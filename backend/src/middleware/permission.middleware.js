const AppError = require("../utils/appError");

function isSuperAdmin(admin) {
  return admin?.roles?.some((role) => role.slug === "super-admin");
}

function requirePermission(permissionKey) {
  return function permissionGuard(req, res, next) {
    if (!req.admin) return next(new AppError(401, "Authentication required.", "AUTH_REQUIRED"));

    if (isSuperAdmin(req.admin) || req.admin.permissions.includes(permissionKey)) return next();

    return next(new AppError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
  };
}

function requireAnyPermission(permissionKeys = []) {
  const keys = Array.isArray(permissionKeys) ? permissionKeys : [permissionKeys];
  return function permissionGuard(req, res, next) {
    if (!req.admin) return next(new AppError(401, "Authentication required.", "AUTH_REQUIRED"));

    if (isSuperAdmin(req.admin) || keys.some((key) => req.admin.permissions.includes(key))) {
      return next();
    }

    return next(new AppError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
  };
}

module.exports = { requireAnyPermission, requirePermission };