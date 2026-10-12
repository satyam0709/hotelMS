const prisma = require("../prisma/client");
const AppError = require("../utils/appError");

function fail(statusCode, message, code) {
  throw new AppError(statusCode, message, code);
}

function contains(q) {
  return { contains: q };
}

async function searchPublic(query = {}) {
  const q = String(query.q || "").trim();
  if (!q) fail(400, "Search query is required.", "VALIDATION_ERROR");
  if (q.length < 2) fail(400, "Search query must be at least 2 characters.", "VALIDATION_ERROR");
  if (q.length > 120) fail(400, "Search query is too long.", "VALIDATION_ERROR");

  const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 20);
  const text = contains(q);

  const [rooms, packages, blogs, pages] = await Promise.all([
    prisma.room.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: text },
          { slug: text },
          { shortDescription: text },
          { description: text },
          { bedType: text },
        ],
      },
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        basePrice: true,
      },
    }),
    prisma.packageOffer.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: text },
          { slug: text },
          { description: text },
          { duration: text },
        ],
      },
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        duration: true,
      },
    }),
    prisma.blogPost.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        OR: [
          { title: text },
          { slug: text },
          { excerpt: text },
          { category: text },
        ],
      },
      take: limit,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        publishedAt: true,
      },
    }),
    prisma.page.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        isVisible: true,
        OR: [
          { title: text },
          { slug: text },
          { metaDescription: text },
          { metaKeywords: text },
        ],
      },
      take: limit,
      orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        metaDescription: true,
      },
    }),
  ]);

  return {
    q,
    rooms: rooms.map((item) => ({
      type: "room",
      id: item.id,
      title: item.name,
      slug: item.slug,
      href: `/rooms/${item.slug}`,
      summary: item.shortDescription || null,
      meta: item.basePrice != null ? { basePrice: item.basePrice } : undefined,
    })),
    packages: packages.map((item) => ({
      type: "package",
      id: item.id,
      title: item.name,
      slug: item.slug,
      href: `/packages/${item.slug}`,
      summary: item.description || null,
      meta: { price: item.price, duration: item.duration },
    })),
    blogs: blogs.map((item) => ({
      type: "blog",
      id: item.id,
      title: item.title,
      slug: item.slug,
      href: `/journal/${item.slug}`,
      summary: item.excerpt || null,
      meta: { category: item.category, publishedAt: item.publishedAt },
    })),
    pages: pages.map((item) => ({
      type: "page",
      id: item.id,
      title: item.title,
      slug: item.slug,
      href: pageHref(item.slug),
      summary: item.metaDescription || null,
    })),
  };
}

function pageHref(slug) {
  const known = {
    about: "/about",
    contact: "/contact",
    gallery: "/gallery",
    facilities: "/facilities",
    restaurant: "/restaurant",
    packages: "/packages",
    rooms: "/rooms",
    events: "/events",
    faqs: "/faqs",
    journal: "/journal",
    testimonials: "/testimonials",
    attractions: "/attractions",
    home: "/",
  };
  return known[slug] || `/pages/${slug}`;
}

module.exports = { searchPublic };
