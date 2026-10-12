import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminBanners(query = {}) {
  const data = await apiGet("/admin/banners", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminBanner(id) {
  return apiGet(`/admin/banners/${id}`, { cache: "no-store" });
}

export async function createAdminBanner(payload) {
  return apiPost("/admin/banners", payload);
}

export async function updateAdminBanner(id, payload) {
  return apiPatch(`/admin/banners/${id}`, payload);
}

export async function deleteAdminBanner(id) {
  return apiDelete(`/admin/banners/${id}`);
}
