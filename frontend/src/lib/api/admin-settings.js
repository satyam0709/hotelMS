import { apiGet, apiPatch } from "@/lib/api/client";

export async function getAdminSettings() {
  return apiGet("/admin/settings", { cache: "no-store" });
}

export async function updateAdminSettings(payload) {
  return apiPatch("/admin/settings", payload);
}
