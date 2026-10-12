const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../utils/jwt");
const env = require("../config/env");

const adminAccessSelection = {
  id: true,
  name: true,
  email: true,
  username: true,
  status: true,
  lastLoginAt: true,
  profileImageMediaId: true,
  profileImageMedia: { select: { id: true, secureUrl: true, url: true } },
  roles: {
    select: {
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  },
};

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

async function requireAdminAuth(req, res, next) {
  const token = req.cookies?.[env.cookieName];
  if (!token) return next(new AppError(401, "Authentication required.", "AUTH_REQUIRED"));

  let claims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    return next(new AppError(401, "Authentication required.", "AUTH_INVALID"));
  }

  if (typeof claims.sub !== "string") {
    return next(new AppError(401, "Authentication required.", "AUTH_INVALID"));
  }

  const admin = await prisma.adminUser.findFirst({
    where: { id: claims.sub, status: "ACTIVE", deletedAt: null },
    select: adminAccessSelection,
  });
  if (!admin) return next(new AppError(401, "Authentication required.", "AUTH_INVALID"));

  req.admin = serializeAdmin(admin);
  return next();
}

module.exports = { adminAccessSelection, requireAdminAuth, serializeAdmin };