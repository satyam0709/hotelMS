import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminTestimonials(query = {}) {
  const data = await apiGet("/admin/testimonials", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminTestimonial(id) {
  return apiGet(`/admin/testimonials/${id}`, { cache: "no-store" });
}

export async function createAdminTestimonial(payload) {
  return apiPost("/admin/testimonials", payload);
}

export async function updateAdminTestimonial(id, payload) {
  return apiPatch(`/admin/testimonials/${id}`, payload);
}

export async function setTestimonialApproval(id, approvalStatus) {
  return apiPatch(`/admin/testimonials/${id}/approval`, { approvalStatus });
}

export async function deleteAdminTestimonial(id) {
  return apiDelete(`/admin/testimonials/${id}`);
}
