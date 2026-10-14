const prisma = require("../prisma/client");
const AppError = require("../utils/appError");

const mediaSelection = {
  select: { id: true, secureUrl: true, url: true, format: true, altText: true, caption: true },
};

/** Booking statuses that still occupy inventory for overlapping nights. */
const INVENTORY_CONSUMING_STATUSES = [
  "PENDING",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "NO_SHOW",
];

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function asDatabaseDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateString(value) {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = asDatabaseDate(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive check-in, exclusive check-out → consumed night date strings. */
function nightsBetween(checkIn, checkOut) {
  const nights = [];
  let cursor = checkIn;
  while (cursor < checkOut) {
    nights.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return nights;
}

function isWeekend(dateString) {
  const day = asDatabaseDate(dateString).getUTCDay();
  return day === 0 || day === 6;
}

function asNumber(value) {
  return Number(value);
}

function pageWindow(query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function roomFitsOccupancy(room, adults, children) {
  return adults <= room.maxAdults
    && children <= room.maxChildren
    && (adults + children) <= room.maxOccupancy;
}

function featuredImage(media = []) {
  const preferred = media.find((item) => item.usage === "featured" || item.usage === "hero");
  const chosen = preferred || media[0];
  return chosen ? chosen.media : null;
}

function mapAmenities(amenities = []) {
  return amenities.map(({ amenity }) => amenity).filter(Boolean);
}

/**
 * Deterministic nightly price resolution.
 * Priority: highest matching RoomRate.priority → updatedAt → id,
 * then weekendPrice on that rate, else rate.price,
 * else room.weekendPrice / room.basePrice.
 */
function resolveNightPrice(night, room, rates, stayNights) {
  const matching = rates
    .filter((rate) => {
      if (!rate.isActive || rate.deletedAt) return false;
      const start = toDateString(rate.startDate);
      const end = toDateString(rate.endDate);
      if (night < start || night > end) return false;
      if (rate.minStay != null && stayNights < rate.minStay) return false;
      if (rate.maxStay != null && stayNights > rate.maxStay) return false;
      return true;
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const aUpdated = new Date(a.updatedAt || 0).valueOf();
      const bUpdated = new Date(b.updatedAt || 0).valueOf();
      if (bUpdated !== aUpdated) return bUpdated - aUpdated;
      return String(b.id).localeCompare(String(a.id));
    });

  const weekend = isWeekend(night);
  const winner = matching[0];
  if (winner) {
    const useWeekend = weekend && winner.weekendPrice != null;
    return {
      date: night,
      price: asNumber(useWeekend ? winner.weekendPrice : winner.price),
      source: useWeekend ? `${winner.rateType}_WEEKEND` : winner.rateType,
      rateId: winner.id,
    };
  }

  if (weekend && room.weekendPrice != null) {
    return {
      date: night,
      price: asNumber(room.weekendPrice),
      source: "WEEKEND",
      rateId: null,
    };
  }

  return {
    date: night,
    price: asNumber(room.basePrice),
    source: "BASE",
    rateId: null,
  };
}

function blockedQuantityForNight(night, blocks) {
  return blocks.reduce((sum, block) => {
    if (!block.isActive || block.deletedAt) return sum;
    const start = toDateString(block.startDate);
    const end = toDateString(block.endDate);
    if (start <= night && night < end) return sum + block.quantity;
    return sum;
  }, 0);
}

function bookedQuantityForNight(night, bookingRooms, now = new Date()) {
  return bookingRooms.reduce((sum, bookingRoom) => {
    const booking = bookingRoom.booking;
    if (!booking) return sum;
    if (!INVENTORY_CONSUMING_STATUSES.includes(booking.status)) return sum;
    if (
      (booking.status === "PENDING" || booking.status === "PENDING_PAYMENT")
      && booking.expiresAt
      && new Date(booking.expiresAt) <= now
    ) {
      return sum;
    }
    const checkIn = toDateString(booking.checkInDate);
    const checkOut = toDateString(booking.checkOutDate);
    if (checkIn <= night && night < checkOut) return sum + bookingRoom.quantity;
    return sum;
  }, 0);
}

/**
 * Per-night available inventory after capacity overrides, closures, blocks, and bookings.
 */
function computeNightInventory(night, room, availabilityByDate, blocks, bookingRooms, now = new Date()) {
  const override = availabilityByDate.get(night);
  if (override?.isClosed) {
    return {
      date: night,
      capacity: override.totalInventory,
      blocked: 0,
      booked: 0,
      available: 0,
      isClosed: true,
      minStay: override.minStay,
      maxStay: override.maxStay,
    };
  }

  const capacity = override?.totalInventory ?? room.totalInventory;
  const blocked = blockedQuantityForNight(night, blocks);
  const booked = bookedQuantityForNight(night, bookingRooms, now);
  const available = Math.max(0, capacity - blocked - booked);

  return {
    date: night,
    capacity,
    blocked,
    booked,
    available,
    isClosed: false,
    minStay: override?.minStay ?? null,
    maxStay: override?.maxStay ?? null,
  };
}

function evaluateStay(room, nights, availabilityByDate, blocks, bookingRooms, rates, quantity, now = new Date()) {
  const stayNights = nights.length;
  const nightlyInventory = nights.map((night) =>
    computeNightInventory(night, room, availabilityByDate, blocks, bookingRooms, now)
  );

  for (const night of nightlyInventory) {
    if (night.isClosed || night.available < quantity) {
      return { bookable: false, reason: "INVENTORY_UNAVAILABLE", nightlyInventory };
    }
    if (night.minStay != null && stayNights < night.minStay) {
      return { bookable: false, reason: "MIN_STAY", nightlyInventory };
    }
    if (night.maxStay != null && stayNights > night.maxStay) {
      return { bookable: false, reason: "MAX_STAY", nightlyInventory };
    }
  }

  const breakdown = nights.map((night) => resolveNightPrice(night, room, rates, stayNights));
  const nightlyFrom = Math.min(...breakdown.map((item) => item.price));
  const subtotal = breakdown.reduce((sum, item) => sum + item.price, 0) * quantity;
  const availableInventory = Math.min(...nightlyInventory.map((item) => item.available));

  return {
    bookable: true,
    nightlyInventory,
    breakdown,
    nightlyFrom,
    subtotal,
    availableInventory,
    nights: stayNights,
  };
}

function roomWhere(query = {}) {
  const where = {
    deletedAt: null,
    isActive: true,
    category: { is: { isActive: true, deletedAt: null } },
  };
  if (query.roomId) where.id = query.roomId;
  if (query.categoryId) where.roomCategoryId = query.categoryId;
  if (query.category) {
    where.category = { is: { slug: query.category, isActive: true, deletedAt: null } };
  }
  if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
      ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice }),
    };
  }
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

const roomSearchSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  basePrice: true,
  weekendPrice: true,
  maxAdults: true,
  maxChildren: true,
  maxOccupancy: true,
  totalInventory: true,
  roomSize: true,
  bedType: true,
  isFeatured: true,
  category: { select: { id: true, name: true, slug: true } },
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

async function loadEngineData(client, roomIds, checkIn, checkOut) {
  const rangeStart = asDatabaseDate(checkIn);
  const rangeEndExclusive = asDatabaseDate(checkOut);
  const rateEndInclusive = asDatabaseDate(addDays(checkOut, -1));

  const [availabilityRows, blocks, bookingRooms, rates] = await Promise.all([
    client.roomAvailability.findMany({
      where: {
        roomId: { in: roomIds },
        date: { gte: rangeStart, lt: rangeEndExclusive },
      },
      select: {
        roomId: true,
        date: true,
        totalInventory: true,
        bookedCount: true,
        blockedCount: true,
        availableCount: true,
        minStay: true,
        maxStay: true,
        isClosed: true,
      },
    }),
    client.roomBlock.findMany({
      where: {
        roomId: { in: roomIds },
        deletedAt: null,
        isActive: true,
        startDate: { lt: rangeEndExclusive },
        endDate: { gt: rangeStart },
      },
      select: {
        id: true,
        roomId: true,
        startDate: true,
        endDate: true,
        quantity: true,
        isActive: true,
        deletedAt: true,
      },
    }),
    client.bookingRoom.findMany({
      where: {
        roomId: { in: roomIds },
        booking: {
          is: {
            status: { in: INVENTORY_CONSUMING_STATUSES },
            checkInDate: { lt: rangeEndExclusive },
            checkOutDate: { gt: rangeStart },
          },
        },
      },
      select: {
        roomId: true,
        quantity: true,
        booking: {
          select: {
            status: true,
            checkInDate: true,
            checkOutDate: true,
            expiresAt: true,
          },
        },
      },
    }),
    client.roomRate.findMany({
      where: {
        roomId: { in: roomIds },
        deletedAt: null,
        isActive: true,
        startDate: { lte: rateEndInclusive },
        endDate: { gte: rangeStart },
      },
      select: {
        id: true,
        roomId: true,
        startDate: true,
        endDate: true,
        rateType: true,
        price: true,
        weekendPrice: true,
        priority: true,
        minStay: true,
        maxStay: true,
        isActive: true,
        deletedAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return { availabilityRows, blocks, bookingRooms, rates };
}

function groupByRoomId(rows) {
  const map = new Map();
  for (const row of rows) {
    const list = map.get(row.roomId) || [];
    list.push(row);
    map.set(row.roomId, list);
  }
  return map;
}

function availabilityMapForRoom(rows) {
  const map = new Map();
  for (const row of rows) {
    map.set(toDateString(row.date), row);
  }
  return map;
}

/**
 * Quote a single room stay using the same inventory + pricing engine as public search.
 * Throws AppError when the room cannot be booked for the requested stay.
 */
async function quoteRoomStay(client, {
  roomId,
  checkIn,
  checkOut,
  adults,
  children,
  quantity = 1,
  now = new Date(),
}) {
  const nights = nightsBetween(checkIn, checkOut);
  if (!nights.length) fail(400, "Stay must include at least one night.", "VALIDATION_ERROR");

  const room = await client.room.findFirst({
    where: {
      id: roomId,
      deletedAt: null,
      isActive: true,
      category: { is: { isActive: true, deletedAt: null } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      weekendPrice: true,
      maxAdults: true,
      maxChildren: true,
      maxOccupancy: true,
      totalInventory: true,
      extraBedAllowed: true,
      extraBedCharge: true,
      taxRate: { select: { id: true, name: true, percentage: true, isActive: true, deletedAt: true } },
    },
  });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");
  if (!roomFitsOccupancy(room, adults, children)) {
    fail(400, "Guest count exceeds room occupancy limits.", "OCCUPANCY_EXCEEDED");
  }

  const { availabilityRows, blocks, bookingRooms, rates } = await loadEngineData(
    client,
    [roomId],
    checkIn,
    checkOut
  );

  const evaluation = evaluateStay(
    room,
    nights,
    availabilityMapForRoom(availabilityRows),
    blocks,
    bookingRooms,
    rates,
    quantity,
    now
  );

  if (!evaluation.bookable) {
    fail(409, "Requested room is not available for the selected dates.", evaluation.reason || "INVENTORY_UNAVAILABLE");
  }

  return {
    room,
    nights,
    ...evaluation,
  };
}

async function searchAvailability(query) {
  // Release expired holds so ledger inventory stays aligned with search.
  const bookingService = require("./booking.service");
  if (typeof bookingService.expireStaleHolds === "function") {
    await bookingService.expireStaleHolds();
  }

  const { page, limit, skip } = pageWindow(query);
  const nights = nightsBetween(query.checkIn, query.checkOut);
  if (!nights.length) fail(400, "Stay must include at least one night.", "VALIDATION_ERROR");

  const where = roomWhere(query);
  const rooms = await prisma.room.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    select: roomSearchSelect,
  });

  const eligibleRooms = rooms.filter((room) =>
    roomFitsOccupancy(room, query.adults, query.children)
  );

  if (!eligibleRooms.length) {
    return {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: query.adults,
      children: query.children,
      rooms: query.rooms,
      nights: nights.length,
      items: [],
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  const roomIds = eligibleRooms.map((room) => room.id);
  const { availabilityRows, blocks, bookingRooms, rates } = await loadEngineData(
    prisma,
    roomIds,
    query.checkIn,
    query.checkOut
  );

  const availabilityByRoom = groupByRoomId(availabilityRows);
  const blocksByRoom = groupByRoomId(blocks);
  const bookingsByRoom = groupByRoomId(bookingRooms);
  const ratesByRoom = groupByRoomId(rates);
  const now = new Date();

  const availableItems = [];
  for (const room of eligibleRooms) {
    const evaluation = evaluateStay(
      room,
      nights,
      availabilityMapForRoom(availabilityByRoom.get(room.id) || []),
      blocksByRoom.get(room.id) || [],
      bookingsByRoom.get(room.id) || [],
      ratesByRoom.get(room.id) || [],
      query.rooms,
      now
    );
    if (!evaluation.bookable) continue;

    availableItems.push({
      id: room.id,
      name: room.name,
      slug: room.slug,
      shortDescription: room.shortDescription,
      category: room.category,
      featuredImage: featuredImage(room.media),
      occupancy: {
        maxAdults: room.maxAdults,
        maxChildren: room.maxChildren,
        maxOccupancy: room.maxOccupancy,
      },
      roomSize: room.roomSize,
      bedType: room.bedType,
      amenities: mapAmenities(room.amenities),
      taxRate: room.taxRate,
      extraBedAllowed: Boolean(room.extraBedAllowed),
      extraBedCharge: room.extraBedCharge == null ? null : Number(room.extraBedCharge),
      availableInventory: evaluation.availableInventory,
      nights: evaluation.nights,
      currency: "INR",
      nightlyFrom: evaluation.nightlyFrom,
      subtotal: Number(evaluation.subtotal.toFixed(2)),
      quantity: query.rooms,
      breakdown: evaluation.breakdown.map((item) => ({
        date: item.date,
        price: Number(item.price.toFixed(2)),
        source: item.source,
        rateId: item.rateId,
      })),
    });
  }

  const total = availableItems.length;
  const items = availableItems.slice(skip, skip + limit);

  return {
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    adults: query.adults,
    children: query.children,
    rooms: query.rooms,
    nights: nights.length,
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function ensureAvailabilityRows(tx, room, nights, blocks) {
  const existing = await tx.roomAvailability.findMany({
    where: {
      roomId: room.id,
      date: { in: nights.map(asDatabaseDate) },
    },
    select: { date: true },
  });
  const existingDates = new Set(existing.map((row) => toDateString(row.date)));
  const missingNights = nights.filter((night) => !existingDates.has(night));

  if (missingNights.length > 0) {
    await tx.roomAvailability.createMany({
      data: missingNights.map((night) => {
        const blocked = blockedQuantityForNight(night, blocks);
        const capacity = room.totalInventory;
        return {
          roomId: room.id,
          date: asDatabaseDate(night),
          totalInventory: capacity,
          bookedCount: 0,
          blockedCount: blocked,
          availableCount: Math.max(0, capacity - blocked),
          isClosed: false,
        };
      }),
      skipDuplicates: true,
    });
  }
}

/**
 * Transaction-safe inventory reservation primitive for Phase 5C.
 * Must be called inside an existing Prisma interactive transaction.
 *
 * Uses optimistic locking on bookedCount + conditional availableCount so
 * concurrent requests cannot overbook the same night.
 */
async function reserveInventory(tx, { roomId, checkIn, checkOut, quantity }) {
  if (!tx) fail(500, "reserveInventory requires a Prisma transaction client.", "INTERNAL_ERROR");
  if (quantity < 1) fail(400, "quantity must be at least 1.", "VALIDATION_ERROR");
  if (checkIn >= checkOut) fail(400, "checkOut must be after checkIn.", "VALIDATION_ERROR");

  const nights = nightsBetween(checkIn, checkOut);
  if (!nights.length) fail(400, "Stay must include at least one night.", "VALIDATION_ERROR");

  const room = await tx.room.findFirst({
    where: { id: roomId, deletedAt: null, isActive: true },
    select: { id: true, totalInventory: true },
  });
  if (!room) fail(404, "Room not found.", "NOT_FOUND");

  const blocks = await tx.roomBlock.findMany({
    where: {
      roomId,
      deletedAt: null,
      isActive: true,
      startDate: { lt: asDatabaseDate(checkOut) },
      endDate: { gt: asDatabaseDate(checkIn) },
    },
    select: {
      startDate: true,
      endDate: true,
      quantity: true,
      isActive: true,
      deletedAt: true,
    },
  });

  await ensureAvailabilityRows(tx, room, nights, blocks);

  for (const night of nights) {
    const date = asDatabaseDate(night);
    const blocked = blockedQuantityForNight(night, blocks);
    const row = await tx.roomAvailability.findUnique({
      where: { roomId_date: { roomId, date } },
      select: {
        totalInventory: true,
        bookedCount: true,
        blockedCount: true,
        availableCount: true,
        isClosed: true,
      },
    });

    if (!row || row.isClosed) {
      fail(409, "Requested inventory is no longer available.", "INVENTORY_UNAVAILABLE");
    }

    const capacity = row.totalInventory;
    const available = Math.max(0, capacity - row.bookedCount - blocked);
    if (available < quantity) {
      fail(409, "Requested inventory is no longer available.", "INVENTORY_UNAVAILABLE");
    }

    const result = await tx.roomAvailability.updateMany({
      where: {
        roomId,
        date,
        isClosed: false,
        bookedCount: row.bookedCount,
        availableCount: { gte: quantity },
      },
      data: {
        blockedCount: blocked,
        bookedCount: { increment: quantity },
        availableCount: available - quantity,
        totalInventory: capacity,
      },
    });

    if (result.count !== 1) {
      fail(409, "Requested inventory is no longer available.", "INVENTORY_UNAVAILABLE");
    }
  }

  return { roomId, checkIn, checkOut, quantity, nights };
}

/**
 * Release previously reserved inventory inside a transaction.
 */
async function releaseInventory(tx, { roomId, checkIn, checkOut, quantity }) {
  if (!tx) fail(500, "releaseInventory requires a Prisma transaction client.", "INTERNAL_ERROR");
  if (quantity < 1) fail(400, "quantity must be at least 1.", "VALIDATION_ERROR");
  if (checkIn >= checkOut) fail(400, "checkOut must be after checkIn.", "VALIDATION_ERROR");

  const nights = nightsBetween(checkIn, checkOut);
  for (const night of nights) {
    const result = await tx.roomAvailability.updateMany({
      where: {
        roomId,
        date: asDatabaseDate(night),
        bookedCount: { gte: quantity },
      },
      data: {
        bookedCount: { decrement: quantity },
        availableCount: { increment: quantity },
      },
    });
    if (result.count !== 1) {
      fail(409, "Unable to release inventory for one or more nights.", "INVENTORY_RELEASE_FAILED");
    }
  }

  return { roomId, checkIn, checkOut, quantity, nights };
}

module.exports = {
  INVENTORY_CONSUMING_STATUSES,
  asDatabaseDate,
  bookedQuantityForNight,
  blockedQuantityForNight,
  computeNightInventory,
  evaluateStay,
  isWeekend,
  nightsBetween,
  quoteRoomStay,
  releaseInventory,
  reserveInventory,
  resolveNightPrice,
  roomFitsOccupancy,
  searchAvailability,
  toDateString,
};
