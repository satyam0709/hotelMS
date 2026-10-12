import { getApiBaseUrl } from "@/lib/config";
import { apiGet, ApiError } from "@/lib/api/client";

export async function getReportsOverview(query = {}) {
  return apiGet("/admin/reports/overview", { query, cache: "no-store" });
}

function buildExportUrl(query = {}) {
  const url = new URL(`${getApiBaseUrl()}/api/admin/reports/export`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function filenameFromDisposition(header, fallback) {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] || fallback;
}

export async function downloadReportsExport(query = {}) {
  const response = await fetch(buildExportUrl(query), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "text/csv,application/json" },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    if (contentType.includes("application/json")) {
      try {
        const payload = await response.json();
        message = payload?.message || message;
      } catch {
        // keep default message
      }
    }
    throw new ApiError(message, { status: response.status, errorCode: "EXPORT_FAILED" });
  }

  const blob = await response.blob();
  const filename = filenameFromDisposition(
    response.headers.get("content-disposition"),
    `hotelms-${query.type || "export"}.csv`,
  );
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  return { filename };
}
