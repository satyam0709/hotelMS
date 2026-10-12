import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { normalizeAdminList } from "@/lib/api/admin-list";

export async function listAdminBlogs(query = {}) {
  const data = await apiGet("/admin/blogs", { query, cache: "no-store" });
  return normalizeAdminList(data);
}

export async function getAdminBlog(id) {
  return apiGet(`/admin/blogs/${id}`, { cache: "no-store" });
}

export async function createAdminBlog(payload) {
  return apiPost("/admin/blogs", payload);
}

export async function updateAdminBlog(id, payload) {
  return apiPatch(`/admin/blogs/${id}`, payload);
}

export async function publishAdminBlog(id) {
  return apiPatch(`/admin/blogs/${id}/publish`, {});
}

export async function deleteAdminBlog(id) {
  return apiDelete(`/admin/blogs/${id}`);
}
