import { getApiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  constructor(message, { status, errorCode, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

function buildUrl(path, query) {
  const base = getApiBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}/api${normalized}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) url.searchParams.set(key, value.join(","));
      else url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

const ADMIN_TOKEN_KEY = "hotel_admin_token";

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

export function clearAdminToken() {
  setAdminToken(null);
}

export async function apiFetch(path, {
  method = "GET",
  query,
  body,
  headers,
  cache,
  next,
  signal,
  timeoutMs,
} = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isPublicGet = method === "GET" && !String(path).includes("/admin");
  const effectiveTimeout = timeoutMs ?? (isFormData ? 60000 : isPublicGet ? 8000 : 30000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const storedToken = headers?.Authorization || headers?.authorization ? null : getAdminToken();
  const authHeaders = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

  // In Next.js, cache: 'no-store' and next.revalidate conflict if both are sent.
  const fetchOptions = {
    method,
    headers: {
      Accept: "application/json",
      ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
    credentials: isPublicGet ? "omit" : "include",
  };

  if (next) {
    fetchOptions.next = next;
  } else if (cache) {
    fetchOptions.cache = cache;
  } else {
    fetchOptions.cache = "no-store";
  }

  let response;
  try {
    response = await fetch(buildUrl(path, query), fetchOptions);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", {
        status: 408,
        errorCode: "REQUEST_TIMEOUT",
      });
    }
    throw new ApiError(error?.message || "Unable to reach the API.", {
      status: 503,
      errorCode: "NETWORK_ERROR",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || `Request failed (${response.status})`, {
      status: response.status,
      errorCode: payload?.errorCode,
      details: payload?.details,
    });
  }

  return payload?.data;
}

export async function apiGet(path, options = {}) {
  return apiFetch(path, { ...options, method: "GET" });
}

export async function apiPost(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "POST", body });
}

export async function apiUpload(path, formData, options = {}) {
  return apiFetch(path, { ...options, method: "POST", body: formData, timeoutMs: options.timeoutMs ?? 60000 });
}

export async function apiPatch(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "PATCH", body });
}

export async function apiPut(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "PUT", body });
}

export async function apiDelete(path, options = {}) {
  return apiFetch(path, { ...options, method: "DELETE" });
}
