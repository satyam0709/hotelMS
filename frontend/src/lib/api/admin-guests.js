import { apiDelete, apiGet, apiPatch } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminGuests(query = {}) {
  const data = await apiGet("/admin/guests", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminGuest(id) {
  return apiGet(`/admin/guests/${id}`, { cache: "no-store" });
}

export async function updateAdminGuest(id, payload) {
  return apiPatch(`/admin/guests/${id}`, payload);
}

export async function deleteAdminGuest(id) {
  return apiDelete(`/admin/guests/${id}`);
}
