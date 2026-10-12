/**
 * Curated catalog of every file under frontend/public/assets.
 * Paths are URL-encoded so Next/Image never 404s on spaces.
 */

function asset(fileName, { roles, aspect, alt }) {
  return {
    id: fileName,
    fileName,
    src: `/assets/${encodeURIComponent(fileName)}`,
    roles,
    aspect,
    alt,
  };
}

export const SITE_ASSETS = [
  asset("Hero 1.jpg", {
    roles: ["hero", "gallery"],
    aspect: "21/9",
    alt: "Resort pool and gardens at dusk",
  }),
  asset("hero-1.jpg", {
    roles: ["hero", "gallery"],
    aspect: "21/9",
    alt: "Aerial view of the resort grounds",
  }),
  asset("hero-1-opt.jpg", {
    roles: ["hero", "gallery"],
    aspect: "21/9",
    alt: "Sunlit resort courtyard",
  }),
  asset("Room.jpg", {
    roles: ["room", "gallery"],
    aspect: "4/5",
    alt: "Guest room interior",
  }),
  asset("room 2.jpg", {
    roles: ["room", "gallery"],
    aspect: "16/10",
    alt: "Suite with natural light",
  }),
  asset("room 3.jpg", {
    roles: ["room", "gallery"],
    aspect: "16/10",
    alt: "Bedroom overlooking gardens",
  }),
  asset("parking.jpg", {
    roles: ["parking", "facility", "gallery"],
    aspect: "16/10",
    alt: "Hotel parking area",
  }),
  asset("parking 2.jpg", {
    roles: ["parking", "facility", "gallery"],
    aspect: "16/10",
    alt: "Covered parking bay",
  }),
  asset("parking 3.jpg", {
    roles: ["parking", "facility", "gallery"],
    aspect: "16/10",
    alt: "Guest vehicle parking",
  }),
  asset("Rexception.jpg", {
    roles: ["reception", "about", "gallery"],
    aspect: "16/10",
    alt: "Hotel reception lobby",
  }),
  asset("image 1.jpg", {
    roles: ["gallery", "about", "facility"],
    aspect: "4/5",
    alt: "Resort vignette",
  }),
  asset("image 2.jpg", {
    roles: ["gallery", "facility"],
    aspect: "16/10",
    alt: "Property grounds",
  }),
  asset("image 3.jpg", {
    roles: ["gallery", "about"],
    aspect: "4/5",
    alt: "Resort detail",
  }),
  asset("image 4.jpg", {
    roles: ["gallery", "facility"],
    aspect: "16/10",
    alt: "Outdoor lounge",
  }),
  asset("image 5.jpg", {
    roles: ["gallery", "about"],
    aspect: "1/1",
    alt: "Architectural detail",
  }),
  asset("image 6.jpg", {
    roles: ["gallery", "facility"],
    aspect: "16/10",
    alt: "Garden path",
  }),
  asset("image 7.jpg", {
    roles: ["gallery", "about"],
    aspect: "4/5",
    alt: "Courtyard seating",
  }),
  asset("image 8.jpg", {
    roles: ["gallery", "facility", "about"],
    aspect: "16/10",
    alt: "Evening ambience",
  }),
];

export function assetsByRole(role) {
  return SITE_ASSETS.filter((item) => item.roles.includes(role));
}

export function fallbackAsset(role = "gallery", index = 0) {
  const pool = assetsByRole(role);
  const list = pool.length ? pool : SITE_ASSETS;
  return list[index % list.length];
}

export function fallbackSrc(role = "gallery", index = 0) {
  return fallbackAsset(role, index).src;
}

/**
 * Prefer CMS/Cloudinary URLs; fill remaining slots from the local catalog.
 * @param {Array<string|{src?:string,url?:string,alt?:string}>} preferred
 * @param {{ role?: string, min?: number, includeAllRoles?: string[] }} options
 */
export function resolveImageSources(preferred = [], options = {}) {
  const role = options.role || "gallery";
  const min = options.min ?? 1;
  const includeAllRoles = options.includeAllRoles || [];

  const seen = new Set();
  const items = [];

  for (const entry of preferred) {
    if (!entry) continue;
    const src = typeof entry === "string"
      ? entry
      : entry.src || entry.url || "";
    if (!src || seen.has(src)) continue;
    seen.add(src);
    items.push({
      src,
      alt: typeof entry === "string" ? "" : (entry.alt || ""),
      aspect: typeof entry === "object" && entry.aspect ? entry.aspect : undefined,
    });
  }

  const fillers = assetsByRole(role);
  for (const asset of fillers) {
    if (items.length >= min) break;
    if (seen.has(asset.src)) continue;
    seen.add(asset.src);
    items.push({
      src: asset.src,
      alt: asset.alt,
      aspect: asset.aspect,
    });
  }

  let guard = 0;
  while (items.length < min && guard < SITE_ASSETS.length) {
    const asset = fallbackAsset(role, items.length + guard);
    guard += 1;
    if (seen.has(asset.src)) continue;
    seen.add(asset.src);
    items.push({ src: asset.src, alt: asset.alt, aspect: asset.aspect });
  }

  for (const extraRole of includeAllRoles) {
    for (const asset of assetsByRole(extraRole)) {
      if (seen.has(asset.src)) continue;
      seen.add(asset.src);
      items.push({ src: asset.src, alt: asset.alt, aspect: asset.aspect });
    }
  }

  return items;
}

/** Every catalog entry — use once on a page that must cover all public/assets files. */
export function allSiteAssetSources() {
  return SITE_ASSETS.map((asset) => ({
    src: asset.src,
    alt: asset.alt,
    aspect: asset.aspect,
    roles: asset.roles,
  }));
}

export const ASPECT_CLASS = {
  "21/9": "aspect-[21/9]",
  "16/10": "aspect-[16/10]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
};
