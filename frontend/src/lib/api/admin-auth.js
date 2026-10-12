import { apiGet, apiPatch, apiPost } from "@/lib/api/client";

export async function adminLogin({ email, password }) {
  const data = await apiPost("/admin/auth/login", { email, password });
  return data?.admin;
}

export async function adminLogout() {
  return apiPost("/admin/auth/logout", {});
}

export async function getAdminMe() {
  const data = await apiGet("/admin/auth/me");
  return data?.admin;
}

export async function adminForgotPassword(email) {
  return apiPost("/admin/auth/forgot-password", { email });
}

export async function adminResetPassword({ token, password }) {
  return apiPost("/admin/auth/reset-password", { token, password });
}

export async function adminChangePassword({ currentPassword, newPassword }) {
  return apiPatch("/admin/auth/password", { currentPassword, newPassword });
}

export async function updateAdminProfile({ name, profileImageMediaId } = {}) {
  const data = await apiPatch("/admin/auth/me", {
    ...(name !== undefined ? { name } : {}),
    ...(profileImageMediaId !== undefined ? { profileImageMediaId } : {}),
  });
  return data?.admin || data;
}
