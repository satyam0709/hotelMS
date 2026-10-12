import { getApiBaseUrl } from "@/lib/config";

const staticPaths = [
  "",
  "/about",
  "/rooms",
  "/booking",
  "/booking/lookup",
  "/testimonials",
  "/packages",
  "/facilities",
  "/restaurant",
  "/events",
  "/attractions",
  "/gallery",
  "/journal",
  "/faqs",
  "/contact",
  "/policies/privacy",
  "/policies/terms",
  "/policies/cancellation",
  "/policies/refund",
  "/policies/hotel-rules",
  "/policies/check-in-check-out",
];

async function fetchJson(path) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data ?? payload;
  } catch {
    return null;
  }
}

function asItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const lastModified = new Date();

  const entries = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const [rooms, blogs, packages, pages] = await Promise.all([
    fetchJson("/rooms?limit=100"),
    fetchJson("/blogs?limit=100"),
    fetchJson("/packages?limit=100"),
    fetchJson("/pages?limit=100"),
  ]);

  for (const room of asItems(rooms)) {
    if (!room?.slug) continue;
    entries.push({
      url: `${base}/rooms/${room.slug}`,
      lastModified: room.updatedAt ? new Date(room.updatedAt) : lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const cmsPage of asItems(pages)) {
    if (!cmsPage?.slug || cmsPage.slug === "home") continue;
    const path = cmsPage.slug === "about" ? "/about" : `/pages/${cmsPage.slug}`;
    entries.push({
      url: `${base}${path}`,
      lastModified: cmsPage.updatedAt || cmsPage.publishedAt
        ? new Date(cmsPage.updatedAt || cmsPage.publishedAt)
        : lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const post of asItems(blogs)) {
    if (!post?.slug) continue;
    entries.push({
      url: `${base}/journal/${post.slug}`,
      lastModified: post.publishedAt || post.updatedAt
        ? new Date(post.publishedAt || post.updatedAt)
        : lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const offer of asItems(packages)) {
    if (!offer?.slug) continue;
    entries.push({
      url: `${base}/packages/${offer.slug}`,
      lastModified: offer.updatedAt ? new Date(offer.updatedAt) : lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
