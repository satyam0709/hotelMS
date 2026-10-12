/** Normalize list payloads from `{ items, pagination }` or flat `{ items, total }`. */
export function normalizeAdminList(data, fallbackLimit = 20) {
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: data?.pagination?.total ?? data?.total ?? 0,
    limit: data?.pagination?.limit ?? data?.limit ?? fallbackLimit,
    page: data?.pagination?.page ?? data?.page ?? 1,
  };
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function linesToList(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function listToLines(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return "";
}

export function emptyToNull(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : null;
}

export function toOptionalNumber(value) {
  if (value === "" || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 10);
}
