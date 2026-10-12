import { apiGet, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminPayments(query = {}) {
  const data = await apiGet("/admin/payments", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminPayment(id) {
  return apiGet(`/admin/payments/${id}`, { cache: "no-store" });
}

export async function refundAdminPayment(id, { amount, reason } = {}) {
  return apiPost(`/admin/payments/${id}/refund`, {
    amount: amount == null || amount === "" ? undefined : Number(amount),
    reason: reason || null,
  });
}

export async function getAdminBookingInvoice(bookingId) {
  return apiGet(`/admin/bookings/${bookingId}/invoice`, { cache: "no-store" });
}
