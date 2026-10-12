import { apiDelete, apiGet, apiPost, apiUpload } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminMedia(query = {}) {
  const data = await apiGet("/admin/media", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function registerAdminMedia(payload) {
  return apiPost("/admin/media/register", payload);
}

export async function uploadAdminMedia({ file, altText, caption, folder, category }) {
  const formData = new FormData();
  formData.append("file", file);
  if (altText) formData.append("altText", altText);
  if (caption) formData.append("caption", caption);
  if (folder) formData.append("folder", folder);
  if (category) formData.append("category", category);
  return apiUpload("/admin/media/upload", formData);
}

export async function deleteAdminMedia(id) {
  return apiDelete(`/admin/media/${id}`);
}
