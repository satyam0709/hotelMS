import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminCoupons(query = {}) {
  const data = await apiGet("/admin/coupons", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function createAdminCoupon(payload) {
  return apiPost("/admin/coupons", payload);
}

export async function updateAdminCoupon(id, payload) {
  return apiPatch(`/admin/coupons/${id}`, payload);
}

export async function deleteAdminCoupon(id) {
  return apiDelete(`/admin/coupons/${id}`);
}

export async function listAdminTaxRates(query = {}) {
  const data = await apiGet("/admin/tax-rates", { query, cache: "no-store" });
  return normalizeAdminList(data, 100);
}

export async function createAdminTaxRate(payload) {
  return apiPost("/admin/tax-rates", payload);
}

export async function updateAdminTaxRate(id, payload) {
  return apiPatch(`/admin/tax-rates/${id}`, payload);
}

export async function deleteAdminTaxRate(id) {
  return apiDelete(`/admin/tax-rates/${id}`);
}
