import { allSiteAssetSources } from "@/lib/site-assets";
import { mediaAlt, mediaUrl, roomGalleryItems } from "@/lib/utils";

export const GALLERY_CATEGORY_OPTIONS = [
  { id: "all", label: "All" },
  { id: "rooms", label: "Rooms" },
  { id: "facilities", label: "Facilities" },
  { id: "events", label: "Events" },
  { id: "nearby", label: "Nearby" },
];

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

export function isGalleryVideo(item) {
  if (!item) return false;
  const type = String(item.resourceType || "").toUpperCase();
  if (type === "VIDEO") return true;
  const src = item.src || "";
  return VIDEO_EXT.test(src) || /\/video\/upload\//i.test(src);
}

function mediaResourceType(media) {
  if (!media) return "IMAGE";
  const type = String(media.resourceType || "").toUpperCase();
  if (type === "VIDEO") return "VIDEO";
  if (isGalleryVideo({ src: mediaUrl(media), resourceType: media.resourceType })) return "VIDEO";
  return "IMAGE";
}

function entityMediaRows(entity) {
  return Array.isArray(entity?.media) ? entity.media : [];
}

function pushFromRelation(items, seen, { rows, category, caption, href, max }) {
  for (const row of rows) {
    const media = row?.media;
    const src = mediaUrl(media);
    const id = media?.id || `${category}-${items.length}`;
    if (!src || seen.has(id)) continue;
    seen.add(id);
    items.push({
      id,
      src,
      alt: mediaAlt(media, caption),
      caption,
      category,
      href,
      resourceType: mediaResourceType(media),
    });
    if (items.length >= max) return true;
  }
  return false;
}

export function buildPublicGalleryItems(
  { rooms = [], facilities = [], events = [], attractions = [] },
  max = 48
) {
  const items = [];
  const seen = new Set();

  for (const room of rooms) {
    const href = room.slug ? `/rooms/${room.slug}` : "/rooms";
    const photos = roomGalleryItems(room);
    for (const photo of photos) {
      if (!photo.src || seen.has(photo.id)) continue;
      seen.add(photo.id);
      items.push({
        id: photo.id,
        src: photo.src,
        alt: photo.alt,
        caption: room.name,
        category: "rooms",
        href,
        resourceType: photo.resourceType || "IMAGE",
      });
      if (items.length >= max) return items;
    }
  }

  for (const facility of facilities) {
    const href = facility.slug ? `/facilities/${facility.slug}` : "/facilities";
    if (
      pushFromRelation(items, seen, {
        rows: entityMediaRows(facility),
        category: "facilities",
        caption: facility.name,
        href,
        max,
      })
    ) {
      return items;
    }
  }

  for (const event of events) {
    const href = event.slug ? `/events/${event.slug}` : "/events";
    if (
      pushFromRelation(items, seen, {
        rows: entityMediaRows(event),
        category: "events",
        caption: event.name,
        href,
        max,
      })
    ) {
      return items;
    }
  }

  for (const attraction of attractions) {
    const href = attraction.slug ? `/attractions/${attraction.slug}` : "/attractions";
    const media = attraction.media;
    const src = mediaUrl(media);
    const id = media?.id;
    if (src && id && !seen.has(id)) {
      seen.add(id);
      items.push({
        id,
        src,
        alt: mediaAlt(media, attraction.name),
        caption: attraction.name,
        category: "nearby",
        href,
        resourceType: mediaResourceType(media),
      });
      if (items.length >= max) return items;
    }
  }

  for (const asset of allSiteAssetSources()) {
    if (seen.has(asset.src)) continue;
    seen.add(asset.src);
    const category = asset.roles.includes("room")
      ? "rooms"
      : asset.roles.includes("facility") || asset.roles.includes("parking")
        ? "facilities"
        : "rooms";
    items.push({
      id: `local-${asset.src}`,
      src: asset.src,
      alt: asset.alt,
      caption: asset.alt,
      category,
      href: "/gallery",
      resourceType: isGalleryVideo({ src: asset.src }) ? "VIDEO" : "IMAGE",
    });
    if (items.length >= max) return items;
  }

  return items;
}

export function galleryCategoryOptionsFromApi(categories = []) {
  const list = Array.isArray(categories) ? categories : [];
  return [
    { id: "all", label: "All" },
    ...list.map((category) => ({ id: category.slug, label: category.name })),
  ];
}

export function buildGalleryItemsFromApi(categories = []) {
  const list = Array.isArray(categories) ? categories : [];
  const items = [];
  const seen = new Set();

  for (const category of list) {
    const rows = Array.isArray(category.items) ? category.items : [];
    for (const row of rows) {
      const src = mediaUrl(row.media);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      items.push({
        id: row.id,
        src,
        alt: mediaAlt(row.media, row.title || category.name),
        caption: row.caption || row.title || category.name,
        category: category.slug,
        resourceType: mediaResourceType(row.media),
      });
    }
  }

  for (const asset of allSiteAssetSources()) {
    if (seen.has(asset.src)) continue;
    seen.add(asset.src);
    items.push({
      id: `local-${asset.src}`,
      src: asset.src,
      alt: asset.alt,
      caption: asset.alt,
      category: "property",
      resourceType: isGalleryVideo({ src: asset.src }) ? "VIDEO" : "IMAGE",
    });
  }

  return items;
}
