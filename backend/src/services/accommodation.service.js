const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");
const realtime = require("../realtime/hub");

function emitInventory(roomId, action) {
  try {
    realtime.publish("inventory.updated", { roomId, action });
  } catch {
    // ignore
  }
}

const mediaSelection = {
  select: { id: true, secureUrl: true, url: true, format: true, altText: true, caption: true },
};

const resources = {
  roomCategories: {
    model: "roomCategory",
    module: "room_categories",
    entityType: "RoomCategory",
    search: ["name", "slug"],
    orderBy: { displayOrder: "asc" },
  },
  amenities: {
    model: "amenity",
    module: "amenities",
    entityType: "Amenity",
    search: ["name", "slug", "icon"],
    orderBy: { displayOrder: "asc" },
  },
};

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pageWindow(query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

function searchValue(query) {
  return query.search || query.q;
}

function whereFor(resourceName, query = {}) {
  const resource = resources[resourceName];
  const where = { deletedAt: null };
  if (query.isActive !== undefined) where.isActive = query.isActive;
  const search = searchValue(query);
  if (search) where.OR = resource.search.map((field) => ({ [field]: { contains: search } }));
  return where;
}

function includeFor(resourceName) {
  if (resourceName === "roomCategories") return { featuredMedia: mediaSelection };
  return undefined;
}

async function audited(req, config, operation) {
  return prisma.$transaction(async (tx) => {
    const result = await operation(tx);
    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module: config.module,
      action: config.action,
      entityType: config.entityType,
      entityId: typeof config.entityId === "function" ? config.entityId(result) : config.entityId,
      metadata: config.metadata,
      request: req,
    });
    return result;
  });
}

async function validateFeaturedMedia(tx, featuredMediaId) {
  if (!featuredMediaId) return;
  const media = await tx.mediaAsset.findFirst({
    where: { id: featuredMediaId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!media) fail(400, "Featured media asset is invalid.", "VALIDATION_ERROR");
}

async function listAdmin(resourceName, query = {}) {
  const resource = resources[resourceName];
  const { page, limit, skip } = pageWindow(query);
  const where = whereFor(resourceName, query);
  const [items, total] = await prisma.$transaction([
    prisma[resource.model].findMany({
      where,
      include: includeFor(resourceName),
      orderBy: resource.orderBy,
      skip,
      take: limit,
    }),
    prisma[resource.model].count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getAdmin(resourceName, id) {
  const resource = resources[resourceName];
  const item = await prisma[resource.model].findFirst({
    where: { id, deletedAt: null },
    include: includeFor(resourceName),
  });
  if (!item) fail(404, "Record not found.", "NOT_FOUND");
  return item;
}

async function create(resourceName, data, req) {
  const resource = resources[resourceName];
  return audited(req, {
    ...resource,
    action: "create",
    entityId: (item) => item.id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    if (resourceName === "roomCategories") await validateFeaturedMedia(tx, data.featuredMediaId);
    return tx[resource.model].create({ data, include: includeFor(resourceName) });
  });
}

async function update(resourceName, id, data, req) {
  const resource = resources[resourceName];
  return audited(req, {
    ...resource,
    action: "update",
    entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const current = await tx[resource.model].findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) fail(404, "Record not found.", "NOT_FOUND");
    if (resourceName === "roomCategories" && Object.hasOwn(data, "featuredMediaId")) {
      await validateFeaturedMedia(tx, data.featuredMediaId);
    }
    return tx[resource.model].update({ where: { id }, data, include: includeFor(resourceName) });
  });
}

async function remove(resourceName, id, req) {
  const resource = resources[resourceName];
  return audited(req, {
    ...resource,
    action: "delete",
    entityId: id,
  }, async (tx) => {
    const current = await tx[resource.model].findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!current) fail(404, "Record not found.", "NOT_FOUND");
    if (resourceName === "roomCategories") {
      const room = await tx.room.findFirst({
        where: { roomCategoryId: id, deletedAt: null },
        select: { id: true },
      });
      if (room) fail(409, "Room category is in use.", "ROOM_CATEGORY_IN_USE");
    }
    return tx[resource.model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });
}

async function reorder(resourceName, items, req) {
  const resource = resources[resourceName];
  return audited(req, {
    ...resource,
    action: "reorder",
    metadata: { count: items.length },
  }, async (tx) => {
    const ids = items.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) fail(400, "Reorder IDs must be unique.", "VALIDATION_ERROR");
    const records = await tx[resource.model].findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
    if (records.length !== ids.length) fail(404, "One or more records were not found.", "NOT_FOUND");
    for (const item of items) {
      await tx[resource.model].update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      });
    }
    return { updated: items.length };
  });
}

async function listPublicRoomCategories(query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const where = { ...whereFor("roomCategories", query), isActive: true };
  const [items, total] = await prisma.$transaction([
    prisma.roomCategory.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        displayOrder: true,
        featuredMedia: mediaSelection,
      },
    }),
    prisma.roomCategory.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getPublicRoomCategory(slug) {
  const category = await prisma.roomCategory.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      displayOrder: true,
      featuredMedia: mediaSelection,
    },
  });
  if (!category) fail(404, "Room category not found.", "NOT_FOUND");
  return category;
}

async function listPublicAmenities(query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const where = { ...whereFor("amenities", query), isActive: true };
  const [items, total] = await prisma.$transaction([
    prisma.amenity.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip,
      take: limit,
      select: { id: true, name: true, slug: true, icon: true, displayOrder: true },
    }),
    prisma.amenity.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

const publicRoomRelations = {
  category: { select: { id: true, name: true, slug: true, description: true } },
  taxRate: { select: { name: true, percentage: true } },
  media: {
    where: {
      deletedAt: null,
      isActive: true,
      media: { is: { isActive: true, deletedAt: null } },
    },
    orderBy: { displayOrder: "asc" },
    select: { id: true, usage: true, displayOrder: true, media: mediaSelection },
  },
  amenities: {
    where: { amenity: { is: { isActive: true, deletedAt: null } } },
    select: {
      amenity: { select: { id: true, name: true, slug: true, icon: true } },
    },
  },
};

const publicRoomSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  basePrice: true,
  weekendPrice: true,
  maxAdults: true,
  maxChildren: true,
  maxOccupancy: true,
  roomSize: true,
  bedType: true,
  extraBedAllowed: true,
  extraBedCharge: true,
  checkInTime: true,
  checkOutTime: true,
  policies: true,
  isFeatured: true,
  ...publicRoomRelations,
};

const adminRoomSelect = {
  id: true,
  name: true,
  slug: true,
  roomCode: true,
  roomCategoryId: true,
  shortDescription: true,
  description: true,
  basePrice: true,
  weekendPrice: true,
  maxAdults: true,
  maxChildren: true,
  maxOccupancy: true,
  roomSize: true,
  bedType: true,
  totalInventory: true,
  extraBedAllowed: true,
  extraBedCharge: true,
  taxRateId: true,
  checkInTime: true,
  checkOutTime: true,
  policies: true,
  isFeatured: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, isActive: true, deletedAt: true } },
  taxRate: { select: { id: true, name: true, percentage: true, isActive: true, deletedAt: true } },
  amenities: {
    select: { amenity: { select: { id: true, name: true, slug: true, icon: true, isActive: true, deletedAt: true } } },
  },
  media: {
    where: { deletedAt: null },
    orderBy: { displayOrder: "asc" },
    select: { id: true, mediaId: true, usage: true, displayOrder: true, isActive: true, media: mediaSelection },
  },
};

function roomWhere(query = {}, publicOnly = false) {
  const where = { deletedAt: null };
  if (publicOnly) {
    where.isActive = true;
    where.category = { is: { isActive: true, deletedAt: null } };
  } else if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const search = searchValue(query);
  if (search) {
    where.OR = ["name", "slug", "roomCode", "shortDescription", "description"]
      .map((field) => ({ [field]: { contains: search } }));
  }
  if (query.categoryId) where.roomCategoryId = query.categoryId;
  if (query.category) where.category = { is: { slug: query.category, isActive: true, deletedAt: null } };
  if (query.guestCount) where.maxOccupancy = { gte: query.guestCount };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
      ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice }),
    };
  }
  if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
  if (query.amenityIds?.length) {
    where.AND = query.amenityIds.map((amenityId) => ({
      amenities: {
        some: {
          amenityId,
          amenity: { is: { isActive: true, deletedAt: null } },
        },
      },
    }));
  }
  return where;
}

async function listPublicRooms(query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const where = roomWhere(query, true);
  const [items, total] = await prisma.$transaction([
    prisma.room.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      skip,
      take: limit,
      select: publicRoomSelect,
    }),
    prisma.room.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getPublicRoom(slug) {
  const room = await prisma.room.findFirst({
    where: { slug, ...roomWhere({}, true) },
    select: publicRoomSelect,
  });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");

  const relatedRooms = await prisma.room.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      roomCategoryId: room.category.id,
      id: { not: room.id },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: 4,
    select: publicRoomSelect,
  });
  return { ...room, relatedRooms };
}

async function listAdminRooms(query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const where = roomWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.room.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, select: adminRoomSelect }),
    prisma.room.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getAdminRoom(id) {
  const room = await prisma.room.findFirst({ where: { id, deletedAt: null }, select: adminRoomSelect });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");
  return room;
}

async function validateRoomRelations(tx, roomData, currentRoom = {}) {
  const categoryId = roomData.roomCategoryId ?? currentRoom.roomCategoryId;
  const category = await tx.roomCategory.findFirst({
    where: { id: categoryId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!category) fail(400, "Room category is invalid or inactive.", "VALIDATION_ERROR");

  const taxRateId = Object.hasOwn(roomData, "taxRateId") ? roomData.taxRateId : currentRoom.taxRateId;
  if (taxRateId) {
    const taxRate = await tx.taxRate.findFirst({
      where: { id: taxRateId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!taxRate) fail(400, "Tax rate is invalid or inactive.", "VALIDATION_ERROR");
  }

  const merged = { ...currentRoom, ...roomData };
  const maxChildren = merged.maxChildren ?? 0;
  if (merged.maxOccupancy < merged.maxAdults + maxChildren) {
    fail(400, "maxOccupancy must be at least maxAdults plus maxChildren.", "VALIDATION_ERROR");
  }
}

async function validateAmenityIds(tx, amenityIds) {
  if (!amenityIds?.length) return;
  const amenities = await tx.amenity.findMany({
    where: { id: { in: amenityIds }, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (amenities.length !== amenityIds.length) fail(400, "One or more amenities are invalid or inactive.", "VALIDATION_ERROR");
}

async function validateRoomMedia(tx, mediaItems) {
  if (!mediaItems?.length) return;
  const mediaIds = [...new Set(mediaItems.map(({ mediaId }) => mediaId))];
  const media = await tx.mediaAsset.findMany({
    where: { id: { in: mediaIds }, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (media.length !== mediaIds.length) fail(400, "One or more media assets are invalid or inactive.", "VALIDATION_ERROR");
}

async function replaceRoomAmenities(tx, roomId, amenityIds) {
  if (amenityIds === undefined) return;
  await validateAmenityIds(tx, amenityIds);
  await tx.roomAmenity.deleteMany({ where: { roomId } });
  if (amenityIds.length) {
    await tx.roomAmenity.createMany({
      data: amenityIds.map((amenityId) => ({ roomId, amenityId })),
      skipDuplicates: true,
    });
  }
}

async function replaceRoomMedia(tx, roomId, mediaItems) {
  if (mediaItems === undefined) return;
  const keys = mediaItems.map(({ mediaId, usage }) => `${mediaId}\u0000${usage}`);
  if (new Set(keys).size !== keys.length) fail(400, "Room media entries must be unique by mediaId and usage.", "VALIDATION_ERROR");
  await validateRoomMedia(tx, mediaItems);

  const keptIds = [];
  for (const item of mediaItems) {
    const existing = await tx.roomMedia.findUnique({
      where: { roomId_mediaId_usage: { roomId, mediaId: item.mediaId, usage: item.usage } },
      select: { id: true },
    });
    const relation = existing
      ? await tx.roomMedia.update({
        where: { id: existing.id },
        data: { deletedAt: null, isActive: true, displayOrder: item.displayOrder },
        select: { id: true },
      })
      : await tx.roomMedia.create({
        data: { roomId, mediaId: item.mediaId, usage: item.usage, displayOrder: item.displayOrder },
        select: { id: true },
      });
    keptIds.push(relation.id);
  }

  await tx.roomMedia.updateMany({
    where: {
      roomId,
      deletedAt: null,
      ...(keptIds.length ? { id: { notIn: keptIds } } : {}),
    },
    data: { deletedAt: new Date(), isActive: false },
  });
}

async function logRoomRelationChange(tx, req, action, roomId, count) {
  await createActivityLog({
    client: tx,
    userId: req.admin.id,
    module: "rooms",
    action,
    entityType: "Room",
    entityId: roomId,
    metadata: { count },
    request: req,
  });
}

async function createRoom(data, req) {
  const { amenityIds, media, ...roomData } = data;
  return audited(req, {
    module: "rooms", action: "create", entityType: "Room",
    entityId: (roomRecord) => roomRecord.id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    await validateRoomRelations(tx, roomData);
    await validateAmenityIds(tx, amenityIds);
    await validateRoomMedia(tx, media);
    const roomRecord = await tx.room.create({ data: roomData, select: { id: true } });
    await replaceRoomAmenities(tx, roomRecord.id, amenityIds);
    await replaceRoomMedia(tx, roomRecord.id, media);
    if (amenityIds !== undefined) await logRoomRelationChange(tx, req, "amenity-assignment", roomRecord.id, amenityIds.length);
    if (media !== undefined) await logRoomRelationChange(tx, req, "media-sync", roomRecord.id, media.length);
    return tx.room.findUnique({ where: { id: roomRecord.id }, select: adminRoomSelect });
  });
}

async function updateRoom(id, data, req) {
  const { amenityIds, media, ...roomData } = data;
  return audited(req, {
    module: "rooms", action: "update", entityType: "Room", entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const current = await tx.room.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, roomCategoryId: true, taxRateId: true, maxAdults: true, maxChildren: true, maxOccupancy: true },
    });
    if (!current) fail(404, "Room not found.", "NOT_FOUND");
    await validateRoomRelations(tx, roomData, current);
    await validateAmenityIds(tx, amenityIds);
    await validateRoomMedia(tx, media);
    if (Object.keys(roomData).length) await tx.room.update({ where: { id }, data: roomData });
    await replaceRoomAmenities(tx, id, amenityIds);
    await replaceRoomMedia(tx, id, media);
    if (amenityIds !== undefined) await logRoomRelationChange(tx, req, "amenity-assignment", id, amenityIds.length);
    if (media !== undefined) await logRoomRelationChange(tx, req, "media-sync", id, media.length);
    return tx.room.findUnique({ where: { id }, select: adminRoomSelect });
  });
}

async function deleteRoom(id, req) {
  return audited(req, {
    module: "rooms", action: "delete", entityType: "Room", entityId: id,
  }, async (tx) => {
    const current = await tx.room.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Room not found.", "NOT_FOUND");
    return tx.room.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true, deletedAt: true } });
  });
}

async function setRoomStatus(id, isActive, req) {
  return audited(req, {
    module: "rooms", action: "status", entityType: "Room", entityId: id,
    metadata: { isActive },
  }, async (tx) => {
    const current = await tx.room.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Room not found.", "NOT_FOUND");
    return tx.room.update({ where: { id }, data: { isActive }, select: { id: true, isActive: true, updatedAt: true } });
  });
}

async function setRoomAmenities(id, amenityIds, req) {
  return audited(req, {
    module: "rooms", action: "amenity-assignment", entityType: "Room", entityId: id,
    metadata: { count: amenityIds.length },
  }, async (tx) => {
    const current = await tx.room.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Room not found.", "NOT_FOUND");
    await replaceRoomAmenities(tx, id, amenityIds);
    return tx.roomAmenity.findMany({
      where: { roomId: id },
      select: { amenity: { select: { id: true, name: true, slug: true, icon: true, isActive: true } } },
    });
  });
}

async function setRoomMedia(id, items, req) {
  return audited(req, {
    module: "rooms", action: "media-sync", entityType: "Room", entityId: id,
    metadata: { count: items.length },
  }, async (tx) => {
    const current = await tx.room.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Room not found.", "NOT_FOUND");
    await replaceRoomMedia(tx, id, items);
    return tx.roomMedia.findMany({
      where: { roomId: id, deletedAt: null },
      orderBy: { displayOrder: "asc" },
      select: { id: true, mediaId: true, usage: true, displayOrder: true, media: mediaSelection },
    });
  });
}

function asDatabaseDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function requireRoom(tx, roomId) {
  const room = await tx.room.findFirst({
    where: { id: roomId, deletedAt: null },
    select: { id: true, totalInventory: true },
  });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");
  return room;
}

async function listRoomAvailability(roomId, query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const room = await prisma.room.findFirst({
    where: { id: roomId, deletedAt: null },
    select: { id: true },
  });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");

  const where = { roomId };
  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: asDatabaseDate(query.from) } : {}),
      ...(query.to ? { lte: asDatabaseDate(query.to) } : {}),
    };
  }
  const [items, total] = await prisma.$transaction([
    prisma.roomAvailability.findMany({
      where,
      orderBy: { date: "asc" },
      skip,
      take: limit,
      select: { id: true, date: true, totalInventory: true, bookedCount: true, blockedCount: true, availableCount: true, minStay: true, maxStay: true, isClosed: true },
    }),
    prisma.roomAvailability.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function upsertRoomAvailability(roomId, days, req) {
  const updated = await audited(req, {
    module: "rooms", action: "availability-update", entityType: "Room", entityId: roomId,
    metadata: { dayCount: days.length },
  }, async (tx) => {
    await requireRoom(tx, roomId);
    const rows = [];
    for (const day of days) {
      const isClosed = day.isClosed || false;
      if (day.bookedCount + day.blockedCount > day.totalInventory) {
        fail(400, "Booked and blocked counts cannot exceed total inventory.", "VALIDATION_ERROR");
      }
      const expectedAvailable = isClosed ? 0 : day.totalInventory - day.bookedCount - day.blockedCount;
      if (day.availableCount !== expectedAvailable) {
        fail(400, "availableCount must match totalInventory minus bookedCount and blockedCount (or be zero when closed).", "VALIDATION_ERROR");
      }
      const date = asDatabaseDate(day.date);
      const { date: ignoredDate, ...values } = day;
      rows.push(await tx.roomAvailability.upsert({
        where: { roomId_date: { roomId, date } },
        update: { ...values, isClosed },
        create: { ...values, isClosed, roomId, date },
        select: { id: true, date: true, totalInventory: true, bookedCount: true, blockedCount: true, availableCount: true, minStay: true, maxStay: true, isClosed: true },
      }));
    }
    return rows;
  });
  emitInventory(roomId, "availability");
  return updated;
}

async function listRoomBlocks(roomId, query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const room = await prisma.room.findFirst({ where: { id: roomId, deletedAt: null }, select: { id: true } });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");
  const where = { roomId, deletedAt: null };
  if (query.from) where.endDate = { gte: asDatabaseDate(query.from) };
  if (query.to) where.startDate = { ...(where.startDate || {}), lte: asDatabaseDate(query.to) };
  const [items, total] = await prisma.$transaction([
    prisma.roomBlock.findMany({ where, orderBy: { startDate: "asc" }, skip, take: limit, select: { id: true, roomId: true, startDate: true, endDate: true, quantity: true, reason: true, createdById: true, isActive: true, createdAt: true, updatedAt: true } }),
    prisma.roomBlock.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function createRoomBlock(roomId, data, req) {
  const created = await audited(req, {
    module: "rooms", action: "block-create", entityType: "RoomBlock",
    entityId: (record) => record.id, metadata: { roomId, quantity: data.quantity },
  }, async (tx) => {
    const room = await requireRoom(tx, roomId);
    if (data.quantity > room.totalInventory) fail(400, "Block quantity cannot exceed room inventory.", "VALIDATION_ERROR");
    return tx.roomBlock.create({
      data: { ...data, startDate: asDatabaseDate(data.startDate), endDate: asDatabaseDate(data.endDate), roomId, createdById: req.admin.id },
      select: { id: true, roomId: true, startDate: true, endDate: true, quantity: true, reason: true, createdById: true, isActive: true },
    });
  });
  emitInventory(roomId, "block");
  return created;
}

async function updateRoomBlock(roomId, id, data, req) {
  const updated = await audited(req, {
    module: "rooms", action: "block-update", entityType: "RoomBlock", entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const room = await requireRoom(tx, roomId);
    const current = await tx.roomBlock.findFirst({ where: { id, roomId, deletedAt: null }, select: { id: true, startDate: true, endDate: true, quantity: true } });
    if (!current) fail(404, "Room block not found.", "NOT_FOUND");
    const startDate = data.startDate ? asDatabaseDate(data.startDate) : current.startDate;
    const endDate = data.endDate ? asDatabaseDate(data.endDate) : current.endDate;
    const quantity = data.quantity ?? current.quantity;
    if (startDate >= endDate) fail(400, "endDate must be after startDate.", "VALIDATION_ERROR");
    if (quantity > room.totalInventory) fail(400, "Block quantity cannot exceed room inventory.", "VALIDATION_ERROR");
    const updateData = { ...data };
    if (data.startDate) updateData.startDate = startDate;
    if (data.endDate) updateData.endDate = endDate;
    return tx.roomBlock.update({ where: { id }, data: updateData, select: { id: true, roomId: true, startDate: true, endDate: true, quantity: true, reason: true, createdById: true, isActive: true, updatedAt: true } });
  });
  emitInventory(roomId, "block");
  return updated;
}

async function deleteRoomBlock(roomId, id, req) {
  const deleted = await audited(req, {
    module: "rooms", action: "block-delete", entityType: "RoomBlock", entityId: id, metadata: { roomId },
  }, async (tx) => {
    const current = await tx.roomBlock.findFirst({ where: { id, roomId, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Room block not found.", "NOT_FOUND");
    return tx.roomBlock.update({ where: { id }, data: { deletedAt: new Date(), isActive: false }, select: { id: true, deletedAt: true, isActive: true } });
  });
  emitInventory(roomId, "block");
  return deleted;
}

async function listRoomRates(roomId, query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const room = await prisma.room.findFirst({ where: { id: roomId, deletedAt: null }, select: { id: true } });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");
  const where = { roomId, deletedAt: null, ...(query.isActive === undefined ? {} : { isActive: query.isActive }) };
  if (query.from) where.endDate = { gte: asDatabaseDate(query.from) };
  if (query.to) where.startDate = { ...(where.startDate || {}), lte: asDatabaseDate(query.to) };
  const [items, total] = await prisma.$transaction([
    prisma.roomRate.findMany({ where, orderBy: [{ priority: "desc" }, { startDate: "asc" }], skip, take: limit, select: { id: true, roomId: true, startDate: true, endDate: true, rateType: true, price: true, weekendPrice: true, priority: true, minStay: true, maxStay: true, isActive: true, createdAt: true, updatedAt: true } }),
    prisma.roomRate.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function createRoomRate(roomId, data, req) {
  const created = await audited(req, {
    module: "rooms", action: "rate-create", entityType: "RoomRate",
    entityId: (record) => record.id, metadata: { roomId, rateType: data.rateType },
  }, async (tx) => {
    await requireRoom(tx, roomId);
    return tx.roomRate.create({
      data: { ...data, startDate: asDatabaseDate(data.startDate), endDate: asDatabaseDate(data.endDate), roomId },
      select: { id: true, roomId: true, startDate: true, endDate: true, rateType: true, price: true, weekendPrice: true, priority: true, minStay: true, maxStay: true, isActive: true },
    });
  });
  emitInventory(roomId, "rate");
  return created;
}

async function updateRoomRate(roomId, id, data, req) {
  const updated = await audited(req, {
    module: "rooms", action: "rate-update", entityType: "RoomRate", entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    await requireRoom(tx, roomId);
    const current = await tx.roomRate.findFirst({ where: { id, roomId, deletedAt: null }, select: { id: true, startDate: true, endDate: true } });
    if (!current) fail(404, "Room rate not found.", "NOT_FOUND");
    const startDate = data.startDate ? asDatabaseDate(data.startDate) : current.startDate;
    const endDate = data.endDate ? asDatabaseDate(data.endDate) : current.endDate;
    if (startDate > endDate) fail(400, "endDate must be on or after startDate.", "VALIDATION_ERROR");
    const updateData = { ...data };
    if (data.startDate) updateData.startDate = startDate;
    if (data.endDate) updateData.endDate = endDate;
    return tx.roomRate.update({ where: { id }, data: updateData, select: { id: true, roomId: true, startDate: true, endDate: true, rateType: true, price: true, weekendPrice: true, priority: true, minStay: true, maxStay: true, isActive: true, updatedAt: true } });
  });
  emitInventory(roomId, "rate");
  return updated;
}

async function deleteRoomRate(roomId, id, req) {
  const deleted = await audited(req, {
    module: "rooms", action: "rate-delete", entityType: "RoomRate", entityId: id, metadata: { roomId },
  }, async (tx) => {
    const current = await tx.roomRate.findFirst({ where: { id, roomId, deletedAt: null }, select: { id: true } });
    if (!current) fail(404, "Room rate not found.", "NOT_FOUND");
    return tx.roomRate.update({ where: { id }, data: { deletedAt: new Date(), isActive: false }, select: { id: true, deletedAt: true, isActive: true } });
  });
  emitInventory(roomId, "rate");
  return deleted;
}

module.exports = {
  create,
  createRoomBlock,
  createRoomRate,
  createRoom,
  deleteRoomBlock,
  deleteRoomRate,
  deleteRoom,
  getAdmin,
  getAdminRoom,
  getPublicRoomCategory,
  getPublicRoom,
  listRoomAvailability,
  listRoomBlocks,
  listRoomRates,
  listAdmin,
  listAdminRooms,
  listPublicAmenities,
  listPublicRooms,
  listPublicRoomCategories,
  remove,
  reorder,
  setRoomAmenities,
  setRoomMedia,
  setRoomStatus,
  updateRoomBlock,
  updateRoomRate,
  upsertRoomAvailability,
  update,
  updateRoom,
};