import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminFaqCategories(query = {}) {
  const data = await apiGet("/admin/faq/categories", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminFaqCategory(payload) {
  return apiPost("/admin/faq/categories", payload);
}

export async function updateAdminFaqCategory(id, payload) {
  return apiPatch(`/admin/faq/categories/${id}`, payload);
}

export async function deleteAdminFaqCategory(id) {
  return apiDelete(`/admin/faq/categories/${id}`);
}

export async function listAdminFaqs(query = {}) {
  const data = await apiGet("/admin/faqs", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminFaq(payload) {
  return apiPost("/admin/faqs", payload);
}

export async function updateAdminFaq(id, payload) {
  return apiPatch(`/admin/faqs/${id}`, payload);
}

export async function deleteAdminFaq(id) {
  return apiDelete(`/admin/faqs/${id}`);
}
