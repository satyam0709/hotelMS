import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminAttractions(query = {}) {
  const data = await apiGet("/admin/attractions", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminAttraction(payload) {
  return apiPost("/admin/attractions", payload);
}

export async function updateAdminAttraction(id, payload) {
  return apiPatch(`/admin/attractions/${id}`, payload);
}

export async function deleteAdminAttraction(id) {
  return apiDelete(`/admin/attractions/${id}`);
}
