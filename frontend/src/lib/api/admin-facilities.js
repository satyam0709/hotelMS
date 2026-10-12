import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminFacilities(query = {}) {
  const data = await apiGet("/admin/facilities", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminFacility(payload) {
  return apiPost("/admin/facilities", payload);
}

export async function updateAdminFacility(id, payload) {
  return apiPatch(`/admin/facilities/${id}`, payload);
}

export async function deleteAdminFacility(id) {
  return apiDelete(`/admin/facilities/${id}`);
}
