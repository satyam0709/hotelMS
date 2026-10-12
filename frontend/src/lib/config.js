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
  defaultTitle: "HotelLMS Resort",
  description: "A refined hotel and resort experience with rooms, dining, and curated stays.",
  apiBaseUrl: typeof window === "undefined" ? serverApiBase : publicApiBase,
  publicApiBaseUrl: publicApiBase,
  bookingPath: "/booking",
  contactPath: "/contact",
  roomsPath: "/rooms",
};

export function getApiBaseUrl() {
  return typeof window === "undefined" ? serverApiBase : publicApiBase;
}
