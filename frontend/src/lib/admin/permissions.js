export function isSuperAdmin(admin) {
  return admin?.roles?.some((role) => role.slug === "super-admin");
}

export function hasPermission(admin, permissionKey) {
  if (!admin) return false;
  if (isSuperAdmin(admin)) return true;
  return Array.isArray(admin.permissions) && admin.permissions.includes(permissionKey);
}

export function hasAnyPermission(admin, keys = []) {
  return keys.some((key) => hasPermission(admin, key));
}
