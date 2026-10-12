const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");

const mediaSelection = {
  select: {
    id: true, secureUrl: true, url: true, format: true, altText: true, caption: true, resourceType: true,
  },
};
const activeMedia = { isActive: true, deletedAt: null };
const pageSectionSelection = {
  where: { deletedAt: null, isEnabled: true },
  orderBy: { displayOrder: "asc" },
  select: {
    id: true, sectionKey: true, title: true, subtitle: true, description: true,
    buttonText: true, buttonLink: true, displayOrder: true, settingsJson: true,
    media: mediaSelection,
  },
};

function fail(statusCode, message, code) {
  throw new AppError(statusCode, message, code);
}

function pagination(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function searchText(query = {}) {
  return query.search || query.q;
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

function mediaInclude(relation, options = {}) {
  return {
    [relation]: {
      where: { ...activeMedia, ...(options.where || {}) },
      orderBy: { displayOrder: "asc" },
      select: { id: true, displayOrder: true, media: mediaSelection },
    },
  };
}

async function audited(req, { module, action, entityType, entityId, metadata }, operation) {
  return prisma.$transaction(async (tx) => {
    const result = await operation(tx);
    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module,
      action,
      entityType,
      entityId: typeof entityId === "function" ? entityId(result) : entityId,
      metadata: typeof metadata === "function" ? metadata(result) : metadata,
      request: req,
    });
    return result;
  });
}

function auditFor(config, req, action, entityId, metadata) {
  return { module: config.module, action, entityType: config.entityType, entityId, metadata, req };
}

const resourceConfigs = {
  navigation: { model: "navigationMenuItem", module: "navigation", entityType: "NavigationMenuItem", search: ["label", "href"], orderBy: [{ location: "asc" }, { displayOrder: "asc" }] },
  pages: { model: "page", module: "pages", entityType: "Page", search: ["title", "slug"], orderBy: { displayOrder: "asc" } },
  banners: { model: "banner", module: "banners", entityType: "Banner", search: ["title", "subtitle"], orderBy: { displayOrder: "asc" } },
  policies: { model: "policy", module: "policies", entityType: "Policy", search: ["title", "slug", "type"], orderBy: { updatedAt: "desc" } },
  facilities: { model: "facility", module: "facilities", entityType: "Facility", search: ["name", "slug", "category"], orderBy: { displayOrder: "asc" } },
  events: { model: "eventVenue", module: "events", entityType: "EventVenue", search: ["name", "slug"], orderBy: { createdAt: "desc" } },
  attractions: { model: "attraction", module: "attractions", entityType: "Attraction", search: ["name", "slug", "description"], orderBy: { displayOrder: "asc" } },
  faqCategories: { model: "faqCategory", module: "faqs", entityType: "FaqCategory", search: ["name", "slug"], orderBy: { displayOrder: "asc" } },
  faqs: { model: "faq", module: "faqs", entityType: "Faq", search: ["question", "answer"], orderBy: { displayOrder: "asc" } },
  testimonials: { model: "testimonial", module: "testimonials", entityType: "Testimonial", search: ["guestName", "review", "source"], orderBy: { displayOrder: "asc" } },
  packages: { model: "packageOffer", module: "packages", entityType: "PackageOffer", search: ["name", "slug", "description"], orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }] },
  galleryCategories: { model: "galleryCategory", module: "gallery", entityType: "GalleryCategory", search: ["name", "slug"], orderBy: { displayOrder: "asc" } },
  galleryItems: { model: "galleryItem", module: "gallery", entityType: "GalleryItem", search: ["title", "caption"], orderBy: { displayOrder: "asc" } },
  blogs: { model: "blogPost", module: "blogs", entityType: "BlogPost", search: ["title", "slug", "excerpt", "category"], orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { displayOrder: "asc" }] },
};

function resourceWhere(config, query = {}) {
  const trashed = query.trashed === true || query.trashed === "true";
  const where = trashed && config.model === "page"
    ? { deletedAt: { not: null } }
    : { deletedAt: null };
  const search = searchText(query);
  if (search) where.OR = config.search.map((field) => ({ [field]: { contains: search } }));
  if (query.isActive !== undefined && "isActive" in config.fields) where.isActive = query.isActive;
  if (query.isVisible !== undefined && config.model === "page") where.isVisible = query.isVisible;
  if (query.status && config.model === "page") {
    if (!["DRAFT", "PUBLISHED"].includes(query.status)) fail(400, "Invalid page status filter.", "VALIDATION_ERROR");
    where.status = query.status;
  }
  if (query.status && config.model === "blogPost") {
    if (!["DRAFT", "PUBLISHED"].includes(query.status)) fail(400, "Invalid blog status filter.", "VALIDATION_ERROR");
    where.status = query.status;
  }
  if (query.isFeatured !== undefined && config.model === "blogPost") {
    where.isFeatured = query.isFeatured === true || query.isFeatured === "true";
  }
  if (query.status && config.model === "testimonial") {
    if (!["PENDING", "APPROVED", "REJECTED"].includes(query.status)) fail(400, "Invalid testimonial status filter.", "VALIDATION_ERROR");
    where.approvalStatus = query.status;
  }
  if (query.status && config.model === "policy") {
    if (!["DRAFT", "PUBLISHED"].includes(query.status)) fail(400, "Invalid policy status filter.", "VALIDATION_ERROR");
    where.isPublished = query.status === "PUBLISHED";
  }
  if (query.isPublished !== undefined && config.model === "policy") where.isPublished = query.isPublished;
  if (query.category && config.model === "facility") where.category = query.category;
  if (query.location && config.model === "navigationMenuItem") where.location = query.location;
  if (query.categoryId && config.model === "faq") where.categoryId = query.categoryId;
  if (query.categoryId && config.model === "galleryItem") where.categoryId = query.categoryId;
  if (query.assignedToId && config.model === "inquiry") where.assignedToId = query.assignedToId;
  return where;
}

for (const config of Object.values(resourceConfigs)) config.fields = {};
resourceConfigs.navigation.fields = { isActive: true };
resourceConfigs.pages.fields = { isVisible: true, displayOrder: true };
resourceConfigs.banners.fields = { isActive: true };
resourceConfigs.facilities.fields = { isActive: true };
resourceConfigs.events.fields = { isActive: true };
resourceConfigs.attractions.fields = { isActive: true };
resourceConfigs.faqCategories.fields = { isActive: true };
resourceConfigs.faqs.fields = { isActive: true };
resourceConfigs.testimonials.fields = { isActive: true };
resourceConfigs.packages.fields = { isActive: true };
resourceConfigs.galleryCategories.fields = { isActive: true };
resourceConfigs.galleryItems.fields = { isActive: true };
resourceConfigs.blogs.fields = { displayOrder: true };

function includeFor(name, admin = true) {
  if (name === "pages") {
    return admin
      ? { sections: { where: { deletedAt: null }, orderBy: { displayOrder: "asc" }, include: { media: mediaSelection } }, bannerMedia: mediaSelection }
      : { sections: pageSectionSelection, bannerMedia: mediaSelection };
  }
  if (name === "facilities") return mediaInclude("media", { where: { isActive: true } });
  if (name === "events") return mediaInclude("media", { where: { isActive: true } });
  if (name === "banners") return { desktopMedia: mediaSelection, mobileMedia: mediaSelection, videoMedia: mediaSelection };
  if (name === "attractions") return { media: mediaSelection };
  if (name === "testimonials") return { guestImageMedia: mediaSelection };
  if (name === "faqs") return { category: { select: { id: true, name: true, slug: true } } };
  if (name === "navigation") return { parent: { select: { id: true, label: true } }, children: { where: { deletedAt: null }, orderBy: { displayOrder: "asc" } } };
  if (name === "packages") return { bannerMedia: mediaSelection };
  if (name === "galleryItems") return { category: { select: { id: true, name: true, slug: true } }, media: mediaSelection };
  if (name === "blogs") return { coverMedia: mediaSelection };
  return undefined;
}

function packageOfferDateWhere(now = new Date()) {
  return {
    deletedAt: null,
    isActive: true,
    AND: [
      { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
      { OR: [{ validTo: null }, { validTo: { gte: now } }] },
    ],
  };
}

const publicPackageSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  duration: true,
  discountType: true,
  discountValue: true,
  inclusionsJson: true,
  exclusionsJson: true,
  terms: true,
  validFrom: true,
  validTo: true,
  isFeatured: true,
  displayOrder: true,
  bannerMedia: mediaSelection,
};

async function listResource(name, query = {}) {
  const config = resourceConfigs[name];
  const { page, limit, skip } = pagination(query);
  const where = resourceWhere(config, query);
  const [items, total] = await prisma.$transaction([
    prisma[config.model].findMany({ where, include: includeFor(name), orderBy: config.orderBy, skip, take: limit }),
    prisma[config.model].count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getResource(name, id) {
  const config = resourceConfigs[name];
  const item = await prisma[config.model].findFirst({ where: { id, deletedAt: null }, include: includeFor(name) });
  if (!item) fail(404, "Record not found.", "NOT_FOUND");
  return item;
}

async function createResource(name, data, req) {
  const config = resourceConfigs[name];
  const { mediaIds, ...recordData } = data;
  return audited(req, {
    module: config.module,
    action: "create",
    entityType: config.entityType,
    entityId: (item) => item.id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const item = await tx[config.model].create({ data: recordData });
    if (name === "facilities") await saveMediaRelations(tx, "facilityMedia", "facilityId", item.id, mediaIds);
    if (name === "events") await saveMediaRelations(tx, "eventVenueMedia", "venueId", item.id, mediaIds);
    return item;
  });
}

async function updateResource(name, id, data, req, action = "update") {
  const config = resourceConfigs[name];
  const { mediaIds, ...recordData } = data;
  return audited(req, {
    module: config.module,
    action,
    entityType: config.entityType,
    entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const current = await tx[config.model].findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Record not found.", "NOT_FOUND");
    const item = Object.keys(recordData).length
      ? await tx[config.model].update({ where: { id }, data: recordData })
      : current;
    if (name === "facilities") await saveMediaRelations(tx, "facilityMedia", "facilityId", id, mediaIds);
    if (name === "events") await saveMediaRelations(tx, "eventVenueMedia", "venueId", id, mediaIds);
    return item;
  });
}

async function deleteResource(name, id, req) {
  const config = resourceConfigs[name];
  return audited(req, {
    module: config.module,
    action: "delete",
    entityType: config.entityType,
    entityId: id,
  }, async (tx) => {
    const current = await tx[config.model].findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Record not found.", "NOT_FOUND");
    return tx[config.model].update({ where: { id }, data: { deletedAt: new Date() } });
  });
}

async function reorderResource(name, items, req) {
  const config = resourceConfigs[name];
  return audited(req, {
    module: config.module,
    action: "reorder",
    entityType: config.entityType,
    metadata: { count: items.length },
  }, async (tx) => {
    const ids = items.map(({ id }) => id);
    const records = await tx[config.model].findMany({ where: { id: { in: ids }, deletedAt: null }, select: { id: true } });
    if (records.length !== new Set(ids).size) fail(404, "One or more records were not found.", "NOT_FOUND");
    for (const item of items) {
      await tx[config.model].update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } });
    }
    return { updated: items.length };
  });
}

async function getPublicSettings() {
  const setting = await prisma.websiteSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      websiteName: true, phone: true, whatsapp: true, email: true, address: true, mapUrl: true,
      currency: true, timezone: true, defaultLanguage: true, copyrightText: true, socialLinksJson: true,
      onlinePaymentEnabled: true, payAtHotelEnabled: true,
      metaTitle: true, metaDescription: true, metaKeywords: true,
      receptionHours: true,
      logoMedia: mediaSelection,
      faviconMedia: mediaSelection,
      headerLogoMedia: mediaSelection,
      footerLogoMedia: mediaSelection,
    },
  });
  return setting || {};
}

async function getAdminSettings() {
  const setting = await prisma.websiteSetting.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      logoMedia: mediaSelection, faviconMedia: mediaSelection,
      headerLogoMedia: mediaSelection, footerLogoMedia: mediaSelection,
    },
  });
  return setting || null;
}

async function updateSettings(data, req) {
  const existing = await prisma.websiteSetting.findFirst({ select: { id: true } });
  if (!existing && !data.websiteName) fail(400, "websiteName is required to initialize settings.", "VALIDATION_ERROR");
  return audited(req, {
    module: "settings", action: "update", entityType: "WebsiteSetting",
    entityId: existing?.id || null, metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    if (existing) return tx.websiteSetting.update({ where: { id: existing.id }, data });
    return tx.websiteSetting.create({ data });
  });
}

async function getPublicNavigation() {
  const items = await prisma.navigationMenuItem.findMany({
    where: { deletedAt: null, isActive: true, parentId: null },
    orderBy: [{ location: "asc" }, { displayOrder: "asc" }],
    select: {
      id: true, label: true, href: true, location: true, displayOrder: true,
      children: {
        where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: "asc" },
        select: { id: true, label: true, href: true, displayOrder: true },
      },
    },
  });
  return items;
}

async function listPages(query = {}) { return listResource("pages", query); }
async function getAdminPage(id) {
  const trashed = await prisma.page.findFirst({
    where: { id, deletedAt: { not: null } },
    include: includeFor("pages"),
  });
  if (trashed) return trashed;
  return getResource("pages", id);
}
async function createPage(data, req) { return createResource("pages", data, req); }
async function updatePage(id, data, req) { return updateResource("pages", id, data, req); }
async function deletePage(id, req) { return deleteResource("pages", id, req); }

async function restorePage(id, req) {
  return audited(req, {
    module: "pages",
    action: "restore",
    entityType: "Page",
    entityId: id,
  }, async (tx) => {
    const page = await tx.page.findFirst({ where: { id, deletedAt: { not: null } }, select: { id: true } });
    if (!page) fail(404, "Deleted page not found.", "NOT_FOUND");
    return tx.page.update({
      where: { id },
      data: { deletedAt: null },
      include: includeFor("pages"),
    });
  });
}

async function getPublicPages(query = {}) {
  const { page, limit, skip } = pagination(query);
  const where = { deletedAt: null, status: "PUBLISHED", isVisible: true };
  const [items, total] = await prisma.$transaction([
    prisma.page.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true,
      },
      orderBy: { displayOrder: "asc" },
      skip,
      take: limit,
    }),
    prisma.page.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getPublicPage(slug) {
  const page = await prisma.page.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED", isVisible: true },
    select: {
      id: true, title: true, slug: true, publishedAt: true,
      metaTitle: true, metaDescription: true,
      bannerMedia: mediaSelection, sections: pageSectionSelection,
    },
  });
  if (!page) fail(404, "Page not found.", "NOT_FOUND");
  return page;
}

async function publishPage(id, req) {
  return updateResource("pages", id, { status: "PUBLISHED", publishedAt: new Date() }, req, "publish");
}

async function updatePageSections(id, sections, req) {
  return audited(req, {
    module: "sections", action: "update", entityType: "Page", entityId: id,
    metadata: { sectionCount: sections.length },
  }, async (tx) => {
    const page = await tx.page.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!page) fail(404, "Page not found.", "NOT_FOUND");
    for (const section of sections) {
      const { id: sectionId, ...data } = section;
      if (sectionId) {
        const current = await tx.pageSection.findFirst({ where: { id: sectionId, pageId: id, deletedAt: null }, select: { id: true } });
        if (!current) fail(404, "Page section not found.", "NOT_FOUND");
        await tx.pageSection.update({ where: { id: sectionId }, data });
      } else {
        await tx.pageSection.create({ data: { ...data, pageId: id } });
      }
    }
    return tx.pageSection.findMany({ where: { pageId: id, deletedAt: null }, orderBy: { displayOrder: "asc" } });
  });
}

async function getPublicPackages(query = {}) {
  const where = packageOfferDateWhere();
  if (query.featured === true || query.featured === "true") where.isFeatured = true;
  return prisma.packageOffer.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
    select: publicPackageSelect,
  });
}

async function getPublicPackage(slug) {
  const item = await prisma.packageOffer.findFirst({
    where: { ...packageOfferDateWhere(), slug },
    select: publicPackageSelect,
  });
  if (!item) fail(404, "Package not found.", "NOT_FOUND");
  return item;
}

async function getPublicGallery() {
  return prisma.galleryCategory.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      displayOrder: true,
      items: {
        where: { deletedAt: null, isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          title: true,
          caption: true,
          displayOrder: true,
          isFeatured: true,
          media: mediaSelection,
        },
      },
    },
  });
}

async function getPublicBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      deletedAt: null, isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true, title: true, subtitle: true, ctaText: true, ctaLink: true, displayOrder: true,
      desktopMedia: mediaSelection,
      mobileMedia: mediaSelection,
      videoMedia: mediaSelection,
    },
  });
}

async function getPublicPolicy(slug) {
  const policy = await prisma.policy.findFirst({
    where: { slug, isPublished: true, deletedAt: null },
    select: { type: true, title: true, slug: true, content: true, updatedAt: true },
  });
  if (!policy) fail(404, "Policy not found.", "NOT_FOUND");
  return policy;
}

async function getPublicBlogs(query = {}) {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  return prisma.blogPost.findMany({
    where: { deletedAt: null, status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { displayOrder: "asc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      excerpt: true,
      authorName: true,
      publishedAt: true,
      isFeatured: true,
      coverMedia: mediaSelection,
    },
  });
}

async function getPublicBlog(slug) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      excerpt: true,
      content: true,
      authorName: true,
      publishedAt: true,
      coverMedia: mediaSelection,
    },
  });
  if (!post) fail(404, "Blog post not found.", "NOT_FOUND");
  return post;
}

async function publishBlog(id, req) {
  return updateResource("blogs", id, { status: "PUBLISHED", publishedAt: new Date() }, req, "publish");
}

async function getPublicFacilities(query = {}) {
  const where = { deletedAt: null, isActive: true };
  if (query.category) where.category = query.category;
  if (query.slug) where.slug = query.slug;
  return prisma.facility.findMany({
    where, orderBy: { displayOrder: "asc" },
    select: {
      id: true, name: true, slug: true, category: true, description: true, operatingHours: true,
      additionalInfo: true, icon: true, displayOrder: true,
      media: {
        where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: "asc" },
        select: { id: true, displayOrder: true, media: mediaSelection },
      },
    },
  });
}

async function getPublicFacility(slug) {
  const items = await getPublicFacilities({ slug });
  const facility = items[0];
  if (!facility) fail(404, "Facility not found.", "NOT_FOUND");
  return facility;
}

async function getRestaurant() {
  return prisma.restaurant.findFirst({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true, name: true, slug: true, description: true, cuisineTypesJson: true,
      breakfastTime: true, lunchTime: true, dinnerTime: true, reservationEnabled: true,
      media: {
        where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: "asc" },
        select: { id: true, displayOrder: true, media: mediaSelection },
      },
      menuCategories: {
        where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: "asc" },
        select: {
          id: true, name: true, displayOrder: true,
          items: {
            where: { deletedAt: null, isAvailable: true }, orderBy: { displayOrder: "asc" },
            select: { id: true, name: true, description: true, price: true, displayOrder: true, media: mediaSelection },
          },
        },
      },
    },
  });
}

async function getAdminRestaurant() {
  return prisma.restaurant.findFirst({
    where: { deletedAt: null },
    include: { ...mediaInclude("media"), menuCategories: { where: { deletedAt: null }, orderBy: { displayOrder: "asc" }, include: { items: { where: { deletedAt: null }, orderBy: { displayOrder: "asc" } } } } },
  });
}

async function saveMediaRelations(tx, model, parentField, parentId, mediaIds) {
  if (mediaIds === undefined) return;
  if (new Set(mediaIds).size !== mediaIds.length) fail(400, "Media IDs must be unique.", "VALIDATION_ERROR");
  const current = await tx[model].findMany({ where: { [parentField]: parentId, deletedAt: null }, select: { id: true } });
  const currentIds = current.map(({ id }) => id);
  const mediaRecords = mediaIds.length ? await tx.mediaAsset.findMany({ where: { id: { in: mediaIds }, ...activeMedia }, select: { id: true } }) : [];
  if (mediaRecords.length !== new Set(mediaIds).size) fail(400, "One or more media assets are invalid.", "VALIDATION_ERROR");
  await tx[model].updateMany({ where: { id: { in: currentIds } }, data: { deletedAt: new Date() } });
  if (mediaIds.length) {
    await tx[model].createMany({ data: mediaIds.map((mediaId, displayOrder) => ({ [parentField]: parentId, mediaId, displayOrder })) });
  }
}

async function saveRestaurant(data, req) {
  const { mediaIds, ...restaurantData } = data;
  return audited(req, {
    module: "restaurant", action: "update", entityType: "Restaurant",
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    let restaurant = await tx.restaurant.findFirst({ where: { deletedAt: null }, select: { id: true } });
    if (!restaurant) {
      if (!restaurantData.name || !restaurantData.slug) fail(400, "name and slug are required to initialize the restaurant.", "VALIDATION_ERROR");
      restaurant = await tx.restaurant.create({ data: restaurantData, select: { id: true } });
    } else if (Object.keys(restaurantData).length) {
      restaurant = await tx.restaurant.update({ where: { id: restaurant.id }, data: restaurantData, select: { id: true } });
    }
    await saveMediaRelations(tx, "restaurantMedia", "restaurantId", restaurant.id, mediaIds);
    return tx.restaurant.findUnique({ where: { id: restaurant.id }, include: { media: mediaInclude("media").media } });
  });
}

async function listMenuCategories(query = {}) {
  const { page, limit, skip } = pagination(query);
  const where = { deletedAt: null, ...(query.isActive === undefined ? {} : { isActive: query.isActive }) };
  const search = searchText(query);
  if (search) where.name = { contains: search };
  const [items, total] = await prisma.$transaction([
    prisma.foodMenuCategory.findMany({ where, include: { items: { where: { deletedAt: null }, orderBy: { displayOrder: "asc" } } }, orderBy: { displayOrder: "asc" }, skip, take: limit }),
    prisma.foodMenuCategory.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function createMenuCategory(data, req) { return createResource("menuCategories", data, req); }

async function listMenuItems(query = {}) {
  const { page, limit, skip } = pagination(query);
  const where = {
    deletedAt: null,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.isAvailable === undefined ? {} : { isAvailable: query.isAvailable }),
  };
  const search = searchText(query);
  if (search) where.OR = ["name", "description"].map((field) => ({ [field]: { contains: search } }));
  const [items, total] = await prisma.$transaction([
    prisma.foodMenuItem.findMany({ where, include: { category: { select: { id: true, name: true } }, media: mediaSelection }, orderBy: { displayOrder: "asc" }, skip, take: limit }),
    prisma.foodMenuItem.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function mutateMenu(model, entityType, action, id, data, req, create = false) {
  return audited(req, {
    module: "restaurant", action, entityType, entityId: create ? (item) => item.id : id,
    metadata: { changedFields: Object.keys(data || {}) },
  }, async (tx) => {
    if (create) return tx[model].create({ data });
    const existing = await tx[model].findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) fail(404, "Menu record not found.", "NOT_FOUND");
    if (action === "delete") return tx[model].update({ where: { id }, data: { deletedAt: new Date() } });
    return tx[model].update({ where: { id }, data });
  });
}

async function getPublicEvents() {
  return prisma.eventVenue.findMany({
    where: { deletedAt: null, isActive: true }, orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true, capacity: true, seatingJson: true, facilitiesJson: true, basePrice: true, ...mediaInclude("media") },
  });
}

async function getPublicEvent(slug) {
  const event = await prisma.eventVenue.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    select: { id: true, name: true, slug: true, description: true, capacity: true, seatingJson: true, facilitiesJson: true, basePrice: true, ...mediaInclude("media") },
  });
  if (!event) fail(404, "Event venue not found.", "NOT_FOUND");
  return event;
}

async function getPublicAttractions(query = {}) {
  const where = { deletedAt: null, isActive: true };
  const search = searchText(query);
  if (search) where.OR = ["name", "description"].map((field) => ({ [field]: { contains: search } }));
  return prisma.attraction.findMany({
    where, orderBy: { displayOrder: "asc" },
    select: { id: true, name: true, slug: true, description: true, distance: true, mapUrl: true, travelInfo: true, displayOrder: true, media: mediaSelection },
  });
}

async function getPublicAttraction(slug) {
  const attraction = await prisma.attraction.findFirst({
    where: { slug, deletedAt: null, isActive: true },
    select: { id: true, name: true, slug: true, description: true, distance: true, mapUrl: true, travelInfo: true, displayOrder: true, media: mediaSelection },
  });
  if (!attraction) fail(404, "Attraction not found.", "NOT_FOUND");
  return attraction;
}

async function getPublicFaqs() {
  return prisma.faqCategory.findMany({
    where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: "asc" },
    select: {
      id: true, name: true, slug: true, displayOrder: true,
      faqs: { where: { deletedAt: null, isActive: true }, orderBy: { displayOrder: "asc" }, select: { id: true, question: true, answer: true, displayOrder: true } },
    },
  });
}

async function getPublicTestimonials() {
  return prisma.testimonial.findMany({
    where: { deletedAt: null, isActive: true, approvalStatus: "APPROVED" }, orderBy: { displayOrder: "asc" },
    select: { id: true, guestName: true, rating: true, review: true, reviewDate: true, source: true, displayOrder: true, guestImageMedia: mediaSelection },
  });
}

async function setTestimonialApproval(id, approvalStatus, req) {
  return updateResource("testimonials", id, { approvalStatus }, req, "approval");
}

async function subscribe(email, captchaToken) {
  const { verifyTurnstileIfConfigured } = require("../utils/turnstile");
  await verifyTurnstileIfConfigured(captchaToken);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { status: "SUBSCRIBED", unsubscribedAt: null, deletedAt: null },
    create: { email },
  });
  return { subscribed: true };
}

async function listNewsletter(query = {}) {
  const { page, limit, skip } = pagination(query);
  if (query.status && !["SUBSCRIBED", "UNSUBSCRIBED"].includes(query.status)) fail(400, "Invalid newsletter status filter.", "VALIDATION_ERROR");
  const where = { deletedAt: null, ...(query.status ? { status: query.status } : {}) };
  const search = searchText(query);
  if (search) where.email = { contains: search };
  const [items, total] = await prisma.$transaction([
    prisma.newsletterSubscriber.findMany({ where, select: { id: true, email: true, status: true, subscribedAt: true, unsubscribedAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.newsletterSubscriber.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function setNewsletterStatus(id, status, req) {
  return audited(req, {
    module: "newsletter", action: status === "UNSUBSCRIBED" ? "unsubscribe" : "subscribe",
    entityType: "NewsletterSubscriber", entityId: id, metadata: { status },
  }, async (tx) => {
    const existing = await tx.newsletterSubscriber.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) fail(404, "Subscriber not found.", "NOT_FOUND");
    return tx.newsletterSubscriber.update({
      where: { id }, data: { status, unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null },
      select: { id: true, email: true, status: true, subscribedAt: true, unsubscribedAt: true },
    });
  });
}

async function createInquiry(data, req) {
  const { captchaToken, ...payload } = data;
  const { verifyTurnstileIfConfigured } = require("../utils/turnstile");
  await verifyTurnstileIfConfigured(captchaToken);
  const inquiry = await prisma.inquiry.create({ data: payload });
  await createActivityLog({
    module: "inquiries", action: "public-create", entityType: "Inquiry", entityId: inquiry.id,
    metadata: { type: inquiry.type }, request: req,
  });
  try {
    const emailService = require("./email.service");
    await emailService.sendAdminInquiryNotification(inquiry);
  } catch {
    // Inquiry acceptance must not fail if email delivery fails.
  }
  try {
    require("../realtime/hub").publish("inquiry.created", { inquiryId: inquiry.id, type: inquiry.type });
  } catch {
    // ignore
  }
  return { accepted: true };
}

async function listInquiries(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = searchText(query);
  const where = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.category) where.type = query.category;
  if (query.assignedToId) where.assignedToId = query.assignedToId;
  if (search) where.OR = ["name", "email", "phone", "subject", "message"].map((field) => ({ [field]: { contains: search } }));
  const [items, total] = await prisma.$transaction([
    prisma.inquiry.findMany({ where, select: { id: true, type: true, name: true, email: true, phone: true, subject: true, message: true, status: true, assignedToId: true, followUpDate: true, adminRemarks: true, createdAt: true, updatedAt: true, assignedTo: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.inquiry.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getInquiry(id) {
  const item = await prisma.inquiry.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, type: true, name: true, email: true, phone: true, subject: true, message: true, status: true, assignedToId: true, followUpDate: true, adminRemarks: true, sourceRefType: true, sourceRefId: true, createdAt: true, updatedAt: true, assignedTo: { select: { id: true, name: true } } },
  });
  if (!item) fail(404, "Inquiry not found.", "NOT_FOUND");
  return item;
}

async function updateInquiry(id, data, req, action = "update") {
  const updated = await audited(req, {
    module: "inquiries", action, entityType: "Inquiry", entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const existing = await tx.inquiry.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) fail(404, "Inquiry not found.", "NOT_FOUND");
    if (Object.hasOwn(data, "assignedToId") && data.assignedToId) {
      const assignee = await tx.adminUser.findFirst({ where: { id: data.assignedToId, status: "ACTIVE", deletedAt: null }, select: { id: true } });
      if (!assignee) fail(400, "Assigned staff member is invalid.", "VALIDATION_ERROR");
    }
    return tx.inquiry.update({ where: { id }, data, select: { id: true, status: true, assignedToId: true, adminRemarks: true, followUpDate: true, updatedAt: true } });
  });
  try {
    require("../realtime/hub").publish("inquiry.updated", { inquiryId: id, status: updated?.status });
  } catch {
    // ignore
  }
  return updated;
}

async function setInquiryStatus(id, status, req) { return updateInquiry(id, { status }, req, "status"); }
async function assignInquiry(id, assignedToId, req) { return updateInquiry(id, { assignedToId }, req, "assign"); }

async function listAdminMedia(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = searchText(query);
  const where = { deletedAt: null };
  if (search) {
    where.OR = [
      { altText: { contains: search } },
      { caption: { contains: search } },
      { publicId: { contains: search } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        publicId: true,
        url: true,
        secureUrl: true,
        resourceType: true,
        format: true,
        altText: true,
        caption: true,
        createdAt: true,
      },
    }),
    prisma.mediaAsset.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

const mediaAssetSelect = {
  id: true,
  publicId: true,
  url: true,
  secureUrl: true,
  resourceType: true,
  format: true,
  width: true,
  height: true,
  bytes: true,
  folder: true,
  category: true,
  altText: true,
  caption: true,
  createdAt: true,
};

function mapCloudinaryResourceType(value) {
  const type = String(value || "").toLowerCase();
  if (type === "video") return "VIDEO";
  if (type === "raw") return "RAW";
  return "IMAGE";
}

function uploadBufferToCloudinary(buffer, options) {
  const cloudinary = require("../config/cloudinary");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

async function registerMedia(data, req) {
  const publicId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return audited(req, {
    module: "media",
    action: "upload",
    entityType: "MediaAsset",
    entityId: (item) => item.id,
    metadata: { source: "url_register" },
  }, async (tx) => tx.mediaAsset.create({
    data: {
      publicId,
      url: data.url,
      secureUrl: data.url,
      resourceType: data.resourceType || "IMAGE",
      altText: data.altText || null,
      caption: data.caption || null,
      folder: data.folder || null,
      category: data.category || null,
      uploadedById: req.admin?.id || null,
    },
    select: mediaAssetSelect,
  }));
}

async function uploadMedia(file, fields, req) {
  const env = require("../config/env");
  if (!env.cloudinaryConfigured) {
    fail(503, "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.", "CLOUDINARY_NOT_CONFIGURED");
  }
  if (!file?.buffer?.length) {
    fail(400, "A file is required.", "VALIDATION_ERROR");
  }

  const folderSegment = String(fields.folder || "general")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "general";
  const folder = `${env.cloudinaryFolder}/${folderSegment}`.replace(/\/+/g, "/");
  const altText = fields.altText ? String(fields.altText).trim().slice(0, 255) || null : null;
  const caption = fields.caption ? String(fields.caption).trim().slice(0, 255) || null : null;
  const category = fields.category ? String(fields.category).trim().slice(0, 120) || null : null;

  let uploaded;
  try {
    uploaded = await uploadBufferToCloudinary(file.buffer, {
      folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
  } catch (error) {
    fail(502, error?.message || "Cloudinary upload failed.", "CLOUDINARY_UPLOAD_FAILED");
  }

  return audited(req, {
    module: "media",
    action: "upload",
    entityType: "MediaAsset",
    entityId: (item) => item.id,
    metadata: { source: "cloudinary", publicId: uploaded.public_id },
  }, async (tx) => tx.mediaAsset.create({
    data: {
      publicId: uploaded.public_id,
      url: uploaded.url,
      secureUrl: uploaded.secure_url || uploaded.url,
      resourceType: mapCloudinaryResourceType(uploaded.resource_type),
      format: uploaded.format || null,
      width: uploaded.width || null,
      height: uploaded.height || null,
      bytes: uploaded.bytes || file.size || null,
      folder,
      category,
      altText,
      caption,
      uploadedById: req.admin?.id || null,
    },
    select: mediaAssetSelect,
  }));
}

async function softDeleteMedia(id, req) {
  return audited(req, {
    module: "media",
    action: "delete",
    entityType: "MediaAsset",
    entityId: id,
  }, async (tx) => {
    const existing = await tx.mediaAsset.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, publicId: true },
    });
    if (!existing) fail(404, "Media asset not found.", "NOT_FOUND");
    return tx.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: { id: true, deletedAt: true },
    });
  });
}

const service = {
  assignInquiry,
  createInquiry,
  createMenuCategory: (data, req) => mutateMenu("foodMenuCategory", "FoodMenuCategory", "create", null, data, req, true),
  createMenuItem: (data, req) => mutateMenu("foodMenuItem", "FoodMenuItem", "create", null, data, req, true),
  createPage,
  createResource,
  deletePage,
  deleteResource,
  getAdminPage,
  getAdminRestaurant,
  getAdminSettings,
  getInquiry,
  getResource,
  getPublicAttraction,
  getPublicAttractions,
  getPublicBanners,
  getPublicBlog,
  getPublicBlogs,
  getPublicGallery,
  getPublicPackage,
  getPublicPackages,
  getPublicEvent,
  getPublicEvents,
  getPublicFacility,
  getPublicFacilities,
  getPublicFaqs,
  getPublicNavigation,
  getPublicPage,
  getPublicPolicy,
  getPublicSettings,
  getPublicTestimonials,
  getRestaurant,
  listAdminMedia,
  listInquiries,
  listMenuCategories,
  listMenuItems,
  listNewsletter,
  getPublicPages,
  listPages,
  listResource,
  registerMedia,
  restorePage,
  softDeleteMedia,
  uploadMedia,
  mutateMenu,
  publishBlog,
  publishPage,
  reorderResource,
  saveRestaurant,
  setInquiryStatus,
  setNewsletterStatus,
  setTestimonialApproval,
  subscribe,
  updatePage,
  updatePageSections,
  updateResource,
  updateSettings,
};

module.exports = service;