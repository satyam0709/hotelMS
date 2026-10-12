const { createHash, randomBytes } = require("node:crypto");
const prisma = require("../prisma/client");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createActivityLog } = require("./activityLog.service");
const emailService = require("./email.service");
const { signAccessToken, verifyAccessToken } = require("../utils/jwt");

const authInclude = {
  roles: {
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  },
  profileImageMedia: { select: { id: true, secureUrl: true, url: true } },
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function serializeAdmin(admin) {
  const roles = admin.roles.map(({ role }) => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
  }));
  const permissions = [...new Set(admin.roles.flatMap(({ role }) =>
    role.permissions.map(({ permission }) => permission.key)
  ))].sort();

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    username: admin.username,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt,
    profileImageMediaId: admin.profileImageMediaId || null,
    profileImage: admin.profileImageMedia
      ? {
          id: admin.profileImageMedia.id,
          url: admin.profileImageMedia.secureUrl || admin.profileImageMedia.url || null,
        }
      : null,
    roles,
    permissions,
  };
}

async function login({ email, password, request }) {
  const admin = await prisma.adminUser.findFirst({
    where: { email: normalizeEmail(email), status: "ACTIVE", deletedAt: null },
    include: authInclude,
  });

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  const lastLoginAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt } });
    await createActivityLog({
      client: tx,
      userId: admin.id,
      module: "admin-auth",
      action: "login",
      entityType: "AdminUser",
      entityId: admin.id,
      request,
    });
  });

  return { token: signAccessToken(admin.id), admin: serializeAdmin({ ...admin, lastLoginAt }) };
}

async function logout(token, request) {
  if (!token) return;

  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    return;
  }

  if (typeof claims.sub !== "string") return;
  const admin = await prisma.adminUser.findFirst({
    where: { id: claims.sub, deletedAt: null },
    select: { id: true },
  });
  if (!admin) return;

  await createActivityLog({
    userId: admin.id,
    module: "admin-auth",
    action: "logout",
    entityType: "AdminUser",
    entityId: admin.id,
    request,
  });
}

async function requestPasswordReset(email, request) {
  const admin = await prisma.adminUser.findFirst({
    where: { email: normalizeEmail(email), status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  let rawToken;
  let tokenHash;
  if (admin) {
    rawToken = randomBytes(32).toString("hex");
    tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: admin.id,
        tokenHash,
        expiresAt: new Date(Date.now() + env.passwordResetTokenTtlMs),
      },
    });
  }

  await createActivityLog({
    userId: admin?.id || null,
    module: "admin-auth",
    action: "password-reset-request",
    entityType: admin ? "AdminUser" : null,
    entityId: admin?.id || null,
    metadata: { requestAccepted: true },
    request,
  });

  if (!admin) return;

  const resetUrl = new URL(env.passwordResetUrl);
  resetUrl.searchParams.set("token", rawToken);
  try {
    await emailService.sendPasswordResetEmail({ to: email, resetUrl: resetUrl.toString() });
  } catch {
    try {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    } catch {
      // Keep delivery failures generic and do not expose token details.
    }
    console.error("Password reset email delivery failed.");
  }
}

async function resetPassword({ token, password, request }) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const passwordHash = await hashPassword(password);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const resetRecord = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt <= now ||
      resetRecord.user.status !== "ACTIVE" ||
      resetRecord.user.deletedAt
    ) {
      throw new AppError(400, "Reset token is invalid or expired.", "RESET_TOKEN_INVALID");
    }

    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: resetRecord.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) {
      throw new AppError(400, "Reset token is invalid or expired.", "RESET_TOKEN_INVALID");
    }

    await tx.adminUser.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });
    await createActivityLog({
      client: tx,
      userId: resetRecord.userId,
      module: "admin-auth",
      action: "password-reset",
      entityType: "AdminUser",
      entityId: resetRecord.userId,
      request,
    });
  });
}

async function updateProfile({ adminId, name, profileImageMediaId, request }) {
  const admin = await prisma.adminUser.findFirst({
    where: { id: adminId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!admin) {
    throw new AppError(401, "Authentication required.", "UNAUTHORIZED");
  }

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (profileImageMediaId !== undefined) {
    if (profileImageMediaId) {
      const media = await prisma.mediaAsset.findFirst({
        where: { id: profileImageMediaId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!media) {
        throw new AppError(400, "Profile image media was not found.", "VALIDATION_ERROR");
      }
    }
    data.profileImageMediaId = profileImageMediaId;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.adminUser.update({
      where: { id: admin.id },
      data,
      include: {
        ...authInclude,
        profileImageMedia: { select: { id: true, secureUrl: true, url: true } },
      },
    });
    await createActivityLog({
      client: tx,
      userId: admin.id,
      module: "admin-auth",
      action: "profile-update",
      entityType: "AdminUser",
      entityId: admin.id,
      metadata: { changedFields: Object.keys(data) },
      request,
    });
    return row;
  });

  return { admin: serializeAdmin(updated) };
}

async function changePassword({ adminId, currentPassword, newPassword, request }) {
  const admin = await prisma.adminUser.findFirst({
    where: { id: adminId, status: "ACTIVE", deletedAt: null },
    select: { id: true, passwordHash: true },
  });
  if (!admin) {
    throw new AppError(401, "Authentication required.", "UNAUTHORIZED");
  }
  if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
    throw new AppError(400, "Current password is incorrect.", "INVALID_CREDENTIALS");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash },
    });
    await createActivityLog({
      client: tx,
      userId: admin.id,
      module: "admin-auth",
      action: "password-change",
      entityType: "AdminUser",
      entityId: admin.id,
      request,
    });
  });

  return { changed: true };
}

module.exports = {
  changePassword,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  updateProfile,
};