const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { hashPassword } = require("../utils/password");
const { createActivityLog } = require("./activityLog.service");

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pagination(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

const roleSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: { permission: { select: { id: true, key: true, module: true, action: true } } },
    orderBy: { permission: { key: "asc" } },
  },
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: { role: { select: { id: true, name: true, slug: true, isSystem: true } } },
    orderBy: { role: { name: "asc" } },
  },
};

function serializeRole(role) {
  return {
    ...role,
    permissions: (role.permissions || []).map(({ permission }) => permission),
  };
}

function serializeUser(user) {
  return {
    ...user,
    roles: (user.roles || []).map(({ role }) => role),
  };
}

async function audit(req, data, callback) {
  return prisma.$transaction(async (tx) => {
    const result = await callback(tx);
    await createActivityLog({
      client: tx,
      userId: req.admin?.id || null,
      module: data.module,
      action: data.action,
      entityType: data.entityType,
      entityId: typeof data.entityId === "function" ? data.entityId(result) : data.entityId,
      metadata: data.metadata,
      request: req,
    });
    return result;
  });
}

async function assertRoles(tx, roleIds) {
  const uniqueIds = [...new Set(roleIds || [])];
  if (!uniqueIds.length) fail(400, "At least one role is required.", "VALIDATION_ERROR");
  const roles = await tx.role.findMany({
    where: { id: { in: uniqueIds }, deletedAt: null },
    select: { id: true },
  });
  if (roles.length !== uniqueIds.length) fail(400, "One or more roles are invalid.", "VALIDATION_ERROR");
  return uniqueIds;
}

async function assertPermissions(tx, permissionIds = []) {
  const uniqueIds = [...new Set(permissionIds)];
  if (!uniqueIds.length) return [];
  const permissions = await tx.permission.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  if (permissions.length !== uniqueIds.length) fail(400, "One or more permissions are invalid.", "VALIDATION_ERROR");
  return uniqueIds;
}

async function listUsers(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = query.search || query.q;
  const where = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { username: { contains: search } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.adminUser.findMany({ where, select: userSelect, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.adminUser.count({ where }),
  ]);
  return paginated(items.map(serializeUser), total, page, limit);
}

async function createUser(data, req) {
  return audit(req, {
    module: "users",
    action: "create",
    entityType: "AdminUser",
    entityId: (user) => user.id,
  }, async (tx) => {
    const roleIds = await assertRoles(tx, data.roleIds);
    const passwordHash = await hashPassword(data.password);
    const user = await tx.adminUser.create({
      data: {
        name: data.name,
        email: normalizeEmail(data.email),
        username: data.username.trim(),
        passwordHash,
        status: data.status,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      select: userSelect,
    });
    return serializeUser(user);
  });
}

async function updateUser(id, data, req) {
  return audit(req, {
    module: "users",
    action: "update",
    entityType: "AdminUser",
    entityId: id,
    metadata: { changedFields: Object.keys(data).filter((key) => key !== "password") },
  }, async (tx) => {
    const current = await tx.adminUser.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "User not found.", "NOT_FOUND");
    const updateData = {};
    for (const key of ["name", "username", "status"]) {
      if (Object.hasOwn(data, key)) updateData[key] = data[key];
    }
    if (data.email) updateData.email = normalizeEmail(data.email);
    if (data.password) updateData.passwordHash = await hashPassword(data.password);
    const roleIds = Object.hasOwn(data, "roleIds") ? await assertRoles(tx, data.roleIds) : null;
    if (roleIds) {
      updateData.roles = {
        deleteMany: {},
        create: roleIds.map((roleId) => ({ roleId })),
      };
    }
    const user = await tx.adminUser.update({ where: { id }, data: updateData, select: userSelect });
    return serializeUser(user);
  });
}

async function deleteUser(id, req) {
  if (id === req.admin?.id) fail(400, "You cannot delete your own account.", "VALIDATION_ERROR");
  return audit(req, {
    module: "users",
    action: "delete",
    entityType: "AdminUser",
    entityId: id,
  }, async (tx) => {
    const current = await tx.adminUser.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "User not found.", "NOT_FOUND");
    return tx.adminUser.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" }, select: { id: true, deletedAt: true } });
  });
}

async function listRoles(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = query.search || query.q;
  const where = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { description: { contains: search } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.role.findMany({ where, select: roleSelect, orderBy: [{ isSystem: "desc" }, { name: "asc" }], skip, take: limit }),
    prisma.role.count({ where }),
  ]);
  return paginated(items.map(serializeRole), total, page, limit);
}

async function listPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
    select: { id: true, key: true, module: true, action: true, description: true },
  });
  return permissions;
}

async function createRole(data, req) {
  return audit(req, {
    module: "roles",
    action: "create",
    entityType: "Role",
    entityId: (role) => role.id,
  }, async (tx) => {
    const permissionIds = await assertPermissions(tx, data.permissionIds);
    const role = await tx.role.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        isSystem: false,
        permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
      },
      select: roleSelect,
    });
    return serializeRole(role);
  });
}

async function updateRole(id, data, req) {
  return audit(req, {
    module: "roles",
    action: "update",
    entityType: "Role",
    entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const current = await tx.role.findFirst({ where: { id, deletedAt: null }, select: { id: true, isSystem: true } });
    if (!current) fail(404, "Role not found.", "NOT_FOUND");
    const updateData = {};
    for (const key of ["name", "slug", "description"]) {
      if (Object.hasOwn(data, key)) updateData[key] = data[key] || null;
    }
    if (Object.hasOwn(data, "permissionIds")) {
      const permissionIds = await assertPermissions(tx, data.permissionIds);
      updateData.permissions = {
        deleteMany: {},
        create: permissionIds.map((permissionId) => ({ permissionId })),
      };
    }
    const role = await tx.role.update({ where: { id }, data: updateData, select: roleSelect });
    return serializeRole(role);
  });
}

async function deleteRole(id, req) {
  return audit(req, {
    module: "roles",
    action: "delete",
    entityType: "Role",
    entityId: id,
  }, async (tx) => {
    const current = await tx.role.findFirst({ where: { id, deletedAt: null }, select: { id: true, isSystem: true } });
    if (!current) fail(404, "Role not found.", "NOT_FOUND");
    if (current.isSystem) fail(400, "System roles cannot be deleted.", "VALIDATION_ERROR");
    const assigned = await tx.userRole.findFirst({ where: { roleId: id }, select: { roleId: true } });
    if (assigned) fail(409, "Cannot delete a role assigned to users.", "ROLE_IN_USE");
    return tx.role.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true, deletedAt: true } });
  });
}

module.exports = {
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  listPermissions,
  listRoles,
  listUsers,
  updateRole,
  updateUser,
};
