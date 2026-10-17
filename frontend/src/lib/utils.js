export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatCurrency(amount, currency = "INR") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(typeof value === "string" && value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.valueOf())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function mediaUrl(media) {
  if (!media) return null;
  if (typeof media === "string") return media;
  return media.secureUrl || media.url || null;
}

export function mediaAlt(media, fallback = "") {
  if (!media) return fallback;
  return media.altText || media.caption || fallback;
}

export function pickFeaturedRoomImage(room) {
  const media = room?.media || [];
  const preferred = media.find((item) => item.usage === "featured" || item.usage === "hero");
  const chosen = preferred || media[0];
  return chosen?.media || null;
}

export function roomGalleryItems(room) {
  const media = Array.isArray(room?.media) ? room.media : [];
  const list = media
    .map((item) => (item?.media ? item.media : item))
    .filter(Boolean)
    .map((item, idx) => ({
      id: item.id || item.secureUrl || item.url || `room-media-${idx}`,
      src: mediaUrl(item),
      alt: mediaAlt(item, room?.name || "Room image"),
      resourceType: String(item.resourceType || "IMAGE").toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE",
    }))
    .filter((item) => item.src);

  if (list.length) return list;

  const featured = pickFeaturedRoomImage(room);
  if (featured) {
    const src = mediaUrl(featured);
    if (src) {
      list.push({
        id: "room-featured",
        src,
        alt: mediaAlt(featured, room?.name || "Room image"),
        resourceType: "IMAGE",
      });
    }
  }

  if (!list.length) {
    list.push({
      id: "room-default-fallback",
      src: "/assets/Room.jpg",
      alt: room?.name || "Room preview",
      resourceType: "IMAGE",
    });
  }

  return list;
}

export function roomAmenities(room) {
  const rows = Array.isArray(room?.amenities) ? room.amenities : [];
  return rows
    .map((row) => {
      if (typeof row === "string") return { id: row, name: row };
      return row?.amenity || row;
    })
    .filter((item) => item && (item.id || item.name));
}

export function asListItems(payload) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
}

export function buildQueryString(values = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      params.set(key, value.join(","));
      continue;
    }
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function splitNavigation(items = []) {
  const header = [];
  const footer = [];
  for (const item of items) {
    if (item.location === "FOOTER") footer.push(item);
    else header.push(item);
  }
  return { header, footer };
}
