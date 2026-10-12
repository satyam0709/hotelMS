import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminGalleryCategories(query = {}) {
  const data = await apiGet("/admin/gallery/categories", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminGalleryCategory(id) {
  return apiGet(`/admin/gallery/categories/${id}`, { cache: "no-store" });
}

export async function createAdminGalleryCategory(payload) {
  return apiPost("/admin/gallery/categories", payload);
}

export async function updateAdminGalleryCategory(id, payload) {
  return apiPatch(`/admin/gallery/categories/${id}`, payload);
}

export async function deleteAdminGalleryCategory(id) {
  return apiDelete(`/admin/gallery/categories/${id}`);
}

export async function listAdminGalleryItems(query = {}) {
  const data = await apiGet("/admin/gallery/items", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminGalleryItem(id) {
  return apiGet(`/admin/gallery/items/${id}`, { cache: "no-store" });
}

export async function createAdminGalleryItem(payload) {
  return apiPost("/admin/gallery/items", payload);
}

export async function updateAdminGalleryItem(id, payload) {
  return apiPatch(`/admin/gallery/items/${id}`, payload);
}

export async function deleteAdminGalleryItem(id) {
  return apiDelete(`/admin/gallery/items/${id}`);
}
