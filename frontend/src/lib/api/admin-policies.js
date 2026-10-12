import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminPolicies(query = {}) {
  const data = await apiGet("/admin/policies", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminPolicy(payload) {
  return apiPost("/admin/policies", payload);
}

export async function updateAdminPolicy(id, payload) {
  return apiPatch(`/admin/policies/${id}`, payload);
}

export async function deleteAdminPolicy(id) {
  return apiDelete(`/admin/policies/${id}`);
}
