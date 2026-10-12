import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function getAdminRestaurant() {
  return apiGet("/admin/restaurant", { cache: "no-store" });
}

export async function saveAdminRestaurant(payload) {
  return apiPatch("/admin/restaurant", payload);
}

export async function listAdminMenuCategories(query = {}) {
  const data = await apiGet("/admin/restaurant/menu-categories", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminMenuCategory(payload) {
  return apiPost("/admin/restaurant/menu-categories", payload);
}

export async function updateAdminMenuCategory(id, payload) {
  return apiPatch(`/admin/restaurant/menu-categories/${id}`, payload);
}

export async function deleteAdminMenuCategory(id) {
  return apiDelete(`/admin/restaurant/menu-categories/${id}`);
}

export async function listAdminMenuItems(query = {}) {
  const data = await apiGet("/admin/restaurant/menu-items", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminMenuItem(payload) {
  return apiPost("/admin/restaurant/menu-items", payload);
}

export async function updateAdminMenuItem(id, payload) {
  return apiPatch(`/admin/restaurant/menu-items/${id}`, payload);
}

export async function deleteAdminMenuItem(id) {
  return apiDelete(`/admin/restaurant/menu-items/${id}`);
}
