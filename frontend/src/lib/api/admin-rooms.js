import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminRooms(query = {}) {
  const data = await apiGet("/admin/rooms", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminRoom(id) {
  return apiGet(`/admin/rooms/${id}`, { cache: "no-store" });
}

export async function createAdminRoom(payload) {
  return apiPost("/admin/rooms", payload);
}

export async function updateAdminRoom(id, payload) {
  return apiPatch(`/admin/rooms/${id}`, payload);
}

export async function deleteAdminRoom(id) {
  return apiDelete(`/admin/rooms/${id}`);
}

export async function listRoomAvailability(roomId, query = {}) {
  const data = await apiGet(`/admin/rooms/${roomId}/availability`, { query, cache: "no-store" });
  return normalizeAdminList(data, 100);
}

export async function upsertRoomAvailability(roomId, days) {
  return apiPut(`/admin/rooms/${roomId}/availability`, { days });
}

export async function listRoomRates(roomId, query = {}) {
  const data = await apiGet(`/admin/rooms/${roomId}/rates`, { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createRoomRate(roomId, payload) {
  return apiPost(`/admin/rooms/${roomId}/rates`, payload);
}

export async function updateRoomRate(roomId, id, payload) {
  return apiPatch(`/admin/rooms/${roomId}/rates/${id}`, payload);
}

export async function deleteRoomRate(roomId, id) {
  return apiDelete(`/admin/rooms/${roomId}/rates/${id}`);
}

export async function listRoomBlocks(roomId, query = {}) {
  const data = await apiGet(`/admin/rooms/${roomId}/blocks`, { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createRoomBlock(roomId, payload) {
  return apiPost(`/admin/rooms/${roomId}/blocks`, payload);
}

export async function updateRoomBlock(roomId, id, payload) {
  return apiPatch(`/admin/rooms/${roomId}/blocks/${id}`, payload);
}

export async function deleteRoomBlock(roomId, id) {
  return apiDelete(`/admin/rooms/${roomId}/blocks/${id}`);
}

export async function listAdminRoomCategories(query = {}) {
  const data = await apiGet("/admin/room-categories", { query, cache: "no-store" });
  return normalizeAdminList(data, 100);
}

export async function createAdminRoomCategory(payload) {
  return apiPost("/admin/room-categories", payload);
}

export async function updateAdminRoomCategory(id, payload) {
  return apiPatch(`/admin/room-categories/${id}`, payload);
}

export async function deleteAdminRoomCategory(id) {
  return apiDelete(`/admin/room-categories/${id}`);
}

export async function reorderAdminRoomCategories(items) {
  return apiPatch("/admin/room-categories/reorder", { items });
}

export async function listAdminAmenities(query = {}) {
  const data = await apiGet("/admin/amenities", { query, cache: "no-store" });
  return normalizeAdminList(data, 100);
}

export async function createAdminAmenity(payload) {
  return apiPost("/admin/amenities", payload);
}

export async function updateAdminAmenity(id, payload) {
  return apiPatch(`/admin/amenities/${id}`, payload);
}

export async function deleteAdminAmenity(id) {
  return apiDelete(`/admin/amenities/${id}`);
}

export async function reorderAdminAmenities(items) {
  return apiPatch("/admin/amenities/reorder", { items });
}

export async function setRoomAmenities(roomId, amenityIds) {
  return apiPut(`/admin/rooms/${roomId}/amenities`, { amenityIds });
}

export async function setRoomMedia(roomId, items) {
  return apiPut(`/admin/rooms/${roomId}/media`, { items });
}
