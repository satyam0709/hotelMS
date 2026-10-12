import { apiGet, apiPatch } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminNewsletter(query = {}) {
  const data = await apiGet("/admin/newsletter", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function updateNewsletterStatus(id, status) {
  return apiPatch(`/admin/newsletter/${id}`, { status });
}
