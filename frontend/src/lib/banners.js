import { fallbackSrc } from "@/lib/site-assets";
import { mediaUrl } from "@/lib/utils";

export function bannerImage(banner) {
  return banner?.desktopMedia || banner?.mobileMedia || banner?.videoMedia || null;
}

export function bannerHref(banner) {
  const link = banner?.ctaLink?.trim();
  if (!link) return "/packages";
  return link.startsWith("/") || link.startsWith("http") ? link : `/${link}`;
}

export function bannerImageUrl(banner) {
  return mediaUrl(bannerImage(banner)) || "";
}

export function bannerVideoUrl(banner) {
  const video = banner?.videoMedia;
  if (!video) return "";
  const type = String(video.resourceType || "").toUpperCase();
  if (type && type !== "VIDEO") return "";
  return mediaUrl(video) || "";
}

const DEFAULT_SIGHTS = [
  {
    aria: "Open Pool card",
    kicker: "Pool",
    title: "Infinity mornings",
    body: "Azure water, palm shade, and lounge chairs made for unhurried days.",
  },
  {
    aria: "Open Dining card",
    kicker: "Dining",
    title: "Poolside pavilion",
    body: "Open-air tables beside the water for long breakfasts and soft evenings.",
  },
  {
    aria: "Open Garden card",
    kicker: "Garden",
    title: "Tropical gardens",
    body: "Lush palms and quiet paths framing every corner of the resort.",
  },
  {
    aria: "Open Suites card",
    kicker: "Stay",
    title: "Sunlit suites",
    body: "Rooms designed for rest, light, and the sound of slow mornings.",
  },
  {
    aria: "Open Wellness card",
    kicker: "Wellness",
    title: "Spa & calm",
    body: "A quieter rhythm after the swim — treatments, steam, and stillness.",
  },
];

/** Four visually distinct local frames used when banners don't supply enough images. */
export const DEFAULT_HERO_FRAMES = [
  fallbackSrc("hero", 0), // pool / resort intro
  fallbackSrc("room", 0), // suite interior
  fallbackSrc("reception", 0), // lobby / arrival
  fallbackSrc("room", 1), // sunlit suite — wide scene for center panel
];

const HERO_FRAME_COUNT = 4;

export function bannersToSights(banners = []) {
  const list = Array.isArray(banners) ? banners : [];
  const mapped = list.slice(0, 5).map((banner) => ({
    aria: `View ${banner.title}`,
    kicker: banner.ctaText || "Offer",
    title: banner.title,
    body: banner.subtitle || "Discover what is new at the resort.",
  }));
  return mapped.length ? mapped : DEFAULT_SIGHTS;
}

/**
 * Collect up to 4 distinct hero frame URLs.
 * Banner media wins first; then curated room/reception/gallery fillers
 * (not more near-identical hero pool shots).
 */
export function buildHeroFrameUrls(banners = []) {
  const list = Array.isArray(banners) ? banners : [];
  const urls = [];
  const seen = new Set();

  function push(url) {
    if (!url || seen.has(url) || urls.length >= HERO_FRAME_COUNT) return;
    seen.add(url);
    urls.push(url);
  }

  for (const banner of list) {
    push(bannerImageUrl(banner));
  }

  for (const url of DEFAULT_HERO_FRAMES) {
    push(url);
  }

  const fillerRoles = ["room", "reception", "gallery", "facility", "hero"];
  for (const role of fillerRoles) {
    for (let index = 0; index < 10 && urls.length < HERO_FRAME_COUNT; index += 1) {
      push(fallbackSrc(role, index));
    }
  }

  while (urls.length < HERO_FRAME_COUNT) {
    urls.push(DEFAULT_HERO_FRAMES[urls.length] || DEFAULT_HERO_FRAMES[0]);
  }

  return urls.slice(0, HERO_FRAME_COUNT);
}

export function buildHeroPresentation({ banners = [] }) {
  const list = Array.isArray(banners) ? banners : [];
  const primary = list[0];
  const frameUrls = buildHeroFrameUrls(list);
  const imageUrl = frameUrls[0];
  const videoUrl = bannerVideoUrl(primary);
  const title =
    primary?.title?.trim()
    || "Where timeless elegance meets serene sanctuary";
  const subtitle =
    primary?.subtitle?.trim()
    || "A refined retreat for tranquil luxury, thoughtful dining, and restorative wellness stays.";
  const ctaText = primary?.ctaText?.trim() || "Discover suites";
  const ctaHref = primary ? bannerHref(primary) : "/rooms";

  return {
    imageUrl,
    frameUrls,
    videoUrl,
    title,
    subtitle,
    ctaText,
    ctaHref,
    sights: bannersToSights(list),
  };
}
