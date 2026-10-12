import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminPages(query = {}) {
  const data = await apiGet("/admin/pages", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminPage(id) {
  return apiGet(`/admin/pages/${id}`, { cache: "no-store" });
}

export async function updateAdminPage(id, payload) {
  return apiPatch(`/admin/pages/${id}`, payload);
}

export async function publishAdminPage(id) {
  return apiPatch(`/admin/pages/${id}/publish`, {});
}

export async function createAdminPage(payload) {
  return apiPost("/admin/pages", payload);
}

export async function deleteAdminPage(id) {
  return apiDelete(`/admin/pages/${id}`);
}

export async function restoreAdminPage(id) {
  return apiPost(`/admin/pages/${id}/restore`, {});
}

export async function updateAdminPageSections(id, sections) {
  return apiPatch(`/admin/pages/${id}/sections`, { sections });
}
