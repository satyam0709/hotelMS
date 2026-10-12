import { apiGet, apiPatch } from "@/lib/api/client";

export async function listAdminInquiries(query = {}) {
  return apiGet("/admin/inquiries", { query, cache: "no-store" });
}

export async function getAdminInquiry(id) {
  return apiGet(`/admin/inquiries/${id}`, { cache: "no-store" });
}

export async function updateInquiryStatus(id, status) {
  return apiPatch(`/admin/inquiries/${id}/status`, { status });
}

export async function updateAdminInquiry(id, payload) {
  return apiPatch(`/admin/inquiries/${id}`, payload);
}

export async function assignAdminInquiry(id, assignedToId) {
  return apiPatch(`/admin/inquiries/${id}/assign`, { assignedToId });
}
