import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminPackages(query = {}) {
  const data = await apiGet("/admin/packages", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminPackage(id) {
  return apiGet(`/admin/packages/${id}`, { cache: "no-store" });
}

export async function createAdminPackage(payload) {
  return apiPost("/admin/packages", payload);
}

export async function updateAdminPackage(id, payload) {
  return apiPatch(`/admin/packages/${id}`, payload);
}

export async function deleteAdminPackage(id) {
  return apiDelete(`/admin/packages/${id}`);
}
