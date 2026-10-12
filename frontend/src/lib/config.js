function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

const serverApiBase = trimSlash(
  process.env.API_BASE_URL
  || process.env.BACKEND_API_URL
  || process.env.BACKEND_URL
  || "http://localhost:5000"
);

const publicApiBase = trimSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL
  || process.env.NEXT_PUBLIC_BACKEND_URL
  || serverApiBase
);

export const siteConfig = {
  name: "HotelLMS Resort",
  defaultTitle: "HotelLMS Resort — Rooms, Dining & Curated Stays",
  description:
    "Book refined rooms and suites, enjoy resort dining, and explore seasonal packages at HotelLMS Resort. Live availability, secure booking, and thoughtful hospitality.",
  apiBaseUrl: typeof window === "undefined" ? serverApiBase : publicApiBase,
  publicApiBaseUrl: publicApiBase,
  bookingPath: "/booking",
  contactPath: "/contact",
  roomsPath: "/rooms",
};

export function getApiBaseUrl() {
  return typeof window === "undefined" ? serverApiBase : publicApiBase;
}
