import { apiGet } from "@/lib/api/client";

export async function getDashboardOverview(query = {}) {
  return apiGet("/admin/dashboard/overview", { query, cache: "no-store" });
}
