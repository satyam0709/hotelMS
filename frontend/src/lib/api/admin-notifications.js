import { apiGet, apiPatch } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function getNotificationSettings() {
  return apiGet("/admin/notifications/settings", { cache: "no-store" });
}

export async function updateNotificationSettings(payload) {
  return apiPatch("/admin/notifications/settings", payload);
}

export async function listNotificationEmailLogs(query = {}) {
  const data = await apiGet("/admin/notifications/logs", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function listEmailTemplates() {
  return apiGet("/admin/notifications/templates", { cache: "no-store" });
}

export async function updateEmailTemplate(id, payload) {
  return apiPatch(`/admin/notifications/templates/${id}`, payload);
}
