import { apiGet } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminActivity(query = {}) {
  const data = await apiGet("/admin/activity", { query, cache: "no-store" });
  return normalizeAdminList(data);
}
