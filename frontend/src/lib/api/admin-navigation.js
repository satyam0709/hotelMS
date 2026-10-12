import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminNavigation(query = {}) {
  const data = await apiGet("/admin/navigation", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminNavigationItem(payload) {
  return apiPost("/admin/navigation", payload);
}

export async function updateAdminNavigationItem(id, payload) {
  return apiPatch(`/admin/navigation/${id}`, payload);
}

export async function deleteAdminNavigationItem(id) {
  return apiDelete(`/admin/navigation/${id}`);
}
