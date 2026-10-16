function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

const publicApiBase = trimSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL
  || process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_BACKEND_API_URL
  || "http://localhost:5000"
);

const serverApiBase = trimSlash(
  process.env.API_BASE_URL
  || process.env.BACKEND_API_URL
  || process.env.BACKEND_URL
  || publicApiBase
);

export const siteConfig = {
  name: "ExoStay - Hotel/Resort",
  defaultTitle: "ExoStay - Hotel/Resort — Luxury Rooms, Dining & Curated Stays",
  description:
    "Experience bespoke hospitality at ExoStay - Hotel/Resort. Book refined rooms and suites, enjoy oceanfront dining, private spa retreats, and seasonal resort packages.",
  apiBaseUrl: typeof window === "undefined" ? serverApiBase : publicApiBase,
  publicApiBaseUrl: publicApiBase,
  bookingPath: "/booking",
  contactPath: "/contact",
  roomsPath: "/rooms",
};

export function getApiBaseUrl() {
  return typeof window === "undefined" ? serverApiBase : publicApiBase;
}
