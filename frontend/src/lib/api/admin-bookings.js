import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminBookings(query = {}) {
  const data = await apiGet("/admin/bookings", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminBooking(id) {
  return apiGet(`/admin/bookings/${id}`, { cache: "no-store" });
}

export async function updateBookingStatus(id, status, note) {
  return apiPatch(`/admin/bookings/${id}/status`, { status, note: note || null });
}

export async function cancelAdminBooking(id, reason) {
  return apiPost(`/admin/bookings/${id}/cancel`, { reason: reason || null });
}

export async function createAdminBooking(payload) {
  return apiPost("/admin/bookings", payload);
}
