import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminUsers(query = {}) {
  const data = await apiGet("/admin/users", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminUser(payload) {
  return apiPost("/admin/users", payload);
}

export async function updateAdminUser(id, payload) {
  return apiPatch(`/admin/users/${id}`, payload);
}

export async function deleteAdminUser(id) {
  return apiDelete(`/admin/users/${id}`);
}

export async function listAdminRoles(query = {}) {
  const data = await apiGet("/admin/roles", { query, cache: "no-store" });
  return normalizeAdminList(data, 100);
}

export async function createAdminRole(payload) {
  return apiPost("/admin/roles", payload);
}

export async function updateAdminRole(id, payload) {
  return apiPatch(`/admin/roles/${id}`, payload);
}

export async function deleteAdminRole(id) {
  return apiDelete(`/admin/roles/${id}`);
}

export async function listAdminPermissions() {
  return apiGet("/admin/permissions", { cache: "no-store" });
}
