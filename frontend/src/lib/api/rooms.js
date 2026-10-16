import { apiGet } from "@/lib/api/client";

export async function getRooms(query = {}) {
  return apiGet("/rooms", { query, next: { revalidate: 30 } });
}

export async function getRoom(slug) {
  return apiGet(`/rooms/${slug}`, { next: { revalidate: 30 } });
}

export async function getRoomCategories(query = {}) {
  return apiGet("/room-categories", { query, next: { revalidate: 60 } });
}

export async function getAmenities(query = {}) {
  return apiGet("/amenities", { query, next: { revalidate: 120 } });
}

export async function getAvailability(query) {
  return apiGet("/availability", { query, cache: "no-store" });
}

export function normalizeRoomFilters(searchParams = {}) {
  const amenityIds = String(searchParams.amenityIds || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const rawGuests = searchParams.guestCount || searchParams.guests;
  const guestCount = rawGuests !== undefined && rawGuests !== "" && rawGuests !== null ? Number(rawGuests) : undefined;

  const rawMinPrice = searchParams.minPrice;
  const minPrice = rawMinPrice !== undefined && rawMinPrice !== "" && rawMinPrice !== null ? Number(rawMinPrice) : undefined;

  const rawMaxPrice = searchParams.maxPrice;
  const maxPrice = rawMaxPrice !== undefined && rawMaxPrice !== "" && rawMaxPrice !== null ? Number(rawMaxPrice) : undefined;

  const page = Number(searchParams.page || 1);

  return {
    category: searchParams.category || undefined,
    guestCount: Number.isFinite(guestCount) && guestCount > 0 ? guestCount : undefined,
    minPrice: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    amenityIds: amenityIds.length ? amenityIds : undefined,
    isFeatured: searchParams.isFeatured === "true" ? "true" : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number(searchParams.limit) || 12,
    search: searchParams.search || searchParams.q || undefined,
  };
}
