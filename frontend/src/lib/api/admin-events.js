import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminEvents(query = {}) {
  const data = await apiGet("/admin/events", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminEvent(payload) {
  return apiPost("/admin/events", payload);
}

export async function updateAdminEvent(id, payload) {
  return apiPatch(`/admin/events/${id}`, payload);
}

export async function deleteAdminEvent(id) {
  return apiDelete(`/admin/events/${id}`);
}
