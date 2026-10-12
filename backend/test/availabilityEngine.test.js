const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, afterEach, before, test } = require("node:test");
const app = require("../src/app");
const prisma = require("../src/prisma/client");
const availability = require("../src/services/availability.service");
const AppError = require("../src/utils/appError");

let server;
let baseUrl;
const restorers = [];

function stub(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  restorers.push(() => { target[key] = original; });
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function futureDate(daysAhead) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  while (restorers.length) restorers.pop()();
});

after(async () => {
  server.close();
  await once(server, "close");
  await prisma.$disconnect();
});

test("nightsBetween uses inclusive check-in and exclusive check-out", () => {
  assert.deepEqual(availability.nightsBetween("2026-10-10", "2026-10-11"), ["2026-10-10"]);
  assert.deepEqual(availability.nightsBetween("2026-10-10", "2026-10-12"), ["2026-10-10", "2026-10-11"]);
  assert.deepEqual(availability.nightsBetween("2026-10-10", "2026-10-10"), []);
});

test("isWeekend treats Saturday and Sunday as weekend", () => {
  assert.equal(availability.isWeekend("2026-10-10"), true); // Saturday
  assert.equal(availability.isWeekend("2026-10-11"), true); // Sunday
  assert.equal(availability.isWeekend("2026-10-12"), false); // Monday
});

test("roomFitsOccupancy enforces adults, children, and max occupancy", () => {
  const room = { maxAdults: 2, maxChildren: 1, maxOccupancy: 3 };
  assert.equal(availability.roomFitsOccupancy(room, 2, 1), true);
  assert.equal(availability.roomFitsOccupancy(room, 3, 0), false);
  assert.equal(availability.roomFitsOccupancy(room, 2, 2), false);
  assert.equal(availability.roomFitsOccupancy(room, 1, 1), true);
});

test("checkout-exclusive booking overlap does not consume the checkout night", () => {
  const bookingRooms = [{
    quantity: 1,
    booking: {
      status: "CONFIRMED",
      checkInDate: "2026-10-10",
      checkOutDate: "2026-10-12",
      expiresAt: null,
    },
  }];
  assert.equal(availability.bookedQuantityForNight("2026-10-10", bookingRooms), 1);
  assert.equal(availability.bookedQuantityForNight("2026-10-11", bookingRooms), 1);
  assert.equal(availability.bookedQuantityForNight("2026-10-12", bookingRooms), 0);
});

test("cancelled and expired pending bookings do not consume inventory", () => {
  const now = new Date("2026-10-01T00:00:00.000Z");
  const bookingRooms = [
    {
      quantity: 1,
      booking: {
        status: "CANCELLED",
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12",
        expiresAt: null,
      },
    },
    {
      quantity: 1,
      booking: {
        status: "PENDING",
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12",
        expiresAt: "2026-09-30T00:00:00.000Z",
      },
    },
  ];
  assert.equal(availability.bookedQuantityForNight("2026-10-10", bookingRooms, now), 0);
});

test("active blocks reduce inventory with exclusive end date", () => {
  const blocks = [{
    startDate: "2026-10-10",
    endDate: "2026-10-12",
    quantity: 2,
    isActive: true,
    deletedAt: null,
  }];
  assert.equal(availability.blockedQuantityForNight("2026-10-10", blocks), 2);
  assert.equal(availability.blockedQuantityForNight("2026-10-11", blocks), 2);
  assert.equal(availability.blockedQuantityForNight("2026-10-12", blocks), 0);
});

test("closed availability nights are unavailable", () => {
  const room = { totalInventory: 3 };
  const map = new Map([["2026-10-10", { totalInventory: 3, isClosed: true, minStay: null, maxStay: null }]]);
  const night = availability.computeNightInventory("2026-10-10", room, map, [], []);
  assert.equal(night.available, 0);
  assert.equal(night.isClosed, true);
});

test("date override capacity is preferred over room total inventory", () => {
  const room = { totalInventory: 5 };
  const map = new Map([["2026-10-10", { totalInventory: 2, isClosed: false, minStay: null, maxStay: null }]]);
  const night = availability.computeNightInventory("2026-10-10", room, map, [], []);
  assert.equal(night.capacity, 2);
  assert.equal(night.available, 2);
});

test("insufficient inventory makes a multi-night stay unbookable", () => {
  const room = { totalInventory: 1, basePrice: 100, weekendPrice: null };
  const bookingRooms = [{
    quantity: 1,
    booking: {
      status: "CONFIRMED",
      checkInDate: "2026-10-11",
      checkOutDate: "2026-10-12",
      expiresAt: null,
    },
  }];
  const result = availability.evaluateStay(
    room,
    ["2026-10-10", "2026-10-11"],
    new Map(),
    [],
    bookingRooms,
    [],
    1
  );
  assert.equal(result.bookable, false);
  assert.equal(result.reason, "INVENTORY_UNAVAILABLE");
});

test("minStay rules reject short stays", () => {
  const room = { totalInventory: 2, basePrice: 100, weekendPrice: null };
  const map = new Map([["2026-10-10", { totalInventory: 2, isClosed: false, minStay: 2, maxStay: null }]]);
  const result = availability.evaluateStay(room, ["2026-10-10"], map, [], [], [], 1);
  assert.equal(result.bookable, false);
  assert.equal(result.reason, "MIN_STAY");
});

test("pricing uses base, weekend, and highest-priority seasonal rates", () => {
  const room = { basePrice: "100.00", weekendPrice: "150.00" };
  const rates = [{
    id: "rate-low",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    rateType: "SEASONAL",
    price: "200.00",
    weekendPrice: "250.00",
    priority: 1,
    minStay: null,
    maxStay: null,
    isActive: true,
    deletedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }, {
    id: "rate-high",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    rateType: "SPECIAL",
    price: "300.00",
    weekendPrice: null,
    priority: 5,
    minStay: null,
    maxStay: null,
    isActive: true,
    deletedAt: null,
    updatedAt: "2026-01-02T00:00:00.000Z",
  }];

  const weekday = availability.resolveNightPrice("2026-10-12", room, rates, 2);
  assert.equal(weekday.price, 300);
  assert.equal(weekday.source, "SPECIAL");
  assert.equal(weekday.rateId, "rate-high");

  const weekendWithoutRate = availability.resolveNightPrice("2026-10-10", room, [], 1);
  assert.equal(weekendWithoutRate.price, 150);
  assert.equal(weekendWithoutRate.source, "WEEKEND");

  const base = availability.resolveNightPrice("2026-10-13", room, [], 1);
  assert.equal(base.price, 100);
  assert.equal(base.source, "BASE");
});

test("overlapping rates prefer higher priority then newer updatedAt", () => {
  const room = { basePrice: 100, weekendPrice: null };
  const rates = [{
    id: "a",
    startDate: "2026-10-10",
    endDate: "2026-10-10",
    rateType: "HOLIDAY",
    price: 180,
    weekendPrice: null,
    priority: 3,
    minStay: null,
    maxStay: null,
    isActive: true,
    deletedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }, {
    id: "b",
    startDate: "2026-10-10",
    endDate: "2026-10-10",
    rateType: "CUSTOM",
    price: 190,
    weekendPrice: null,
    priority: 3,
    minStay: null,
    maxStay: null,
    isActive: true,
    deletedAt: null,
    updatedAt: "2026-02-01T00:00:00.000Z",
  }];
  const night = availability.resolveNightPrice("2026-10-10", room, rates, 1);
  assert.equal(night.rateId, "b");
  assert.equal(night.price, 190);
});

test("pricing totals multiply nightly sum by requested room quantity", () => {
  const room = { totalInventory: 3, basePrice: 100, weekendPrice: null };
  const result = availability.evaluateStay(
    room,
    ["2026-10-13", "2026-10-14"],
    new Map(),
    [],
    [],
    [],
    2
  );
  assert.equal(result.bookable, true);
  assert.equal(result.nights, 2);
  assert.equal(result.subtotal, 400);
  assert.equal(result.nightlyFrom, 100);
  assert.equal(result.availableInventory, 3);
});

test("public availability endpoint validates query and returns bookable rooms", async () => {
  const checkIn = futureDate(20);
  const checkOut = futureDate(22);

  stub(prisma.room, "findMany", async () => [{
    id: "room-1",
    name: "Deluxe",
    slug: "deluxe",
    shortDescription: "Nice room",
    basePrice: "200.00",
    weekendPrice: null,
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    totalInventory: 2,
    roomSize: "30 sqm",
    bedType: "King",
    isFeatured: true,
    category: { id: "cat-1", name: "Deluxe", slug: "deluxe" },
    taxRate: { name: "GST", percentage: "12.00" },
    media: [{ usage: "hero", displayOrder: 0, media: { id: "media-1", secureUrl: "https://cdn.example/hero.jpg", url: null, format: "jpg", altText: "Hero", caption: null } }],
    amenities: [{ amenity: { id: "amenity-1", name: "Wi-Fi", slug: "wifi", icon: "wifi" } }],
  }]);
  stub(prisma.roomAvailability, "findMany", async () => []);
  stub(prisma.roomBlock, "findMany", async () => []);
  stub(prisma.bookingRoom, "findMany", async () => []);
  stub(prisma.roomRate, "findMany", async () => []);

  const invalid = await request("/api/availability?checkIn=2026-10-12&checkOut=2026-10-10&adults=2");
  assert.equal(invalid.status, 400);

  const response = await request(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0&rooms=1`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.items.length, 1);
  assert.equal(body.data.items[0].slug, "deluxe");
  assert.equal(body.data.items[0].nights, 2);
  assert.equal(body.data.items[0].subtotal, 400);
  assert.equal(body.data.items[0].availableInventory, 2);
  assert.equal(body.data.items[0].breakdown.length, 2);
  assert.equal(body.data.items[0].featuredImage.id, "media-1");
  assert.equal(body.data.pagination.total, 1);
});

test("public availability excludes rooms that fail occupancy or blocked inventory", async () => {
  const checkIn = futureDate(30);
  const checkOut = futureDate(32);

  stub(prisma.room, "findMany", async () => [{
    id: "room-small",
    name: "Single",
    slug: "single",
    shortDescription: null,
    basePrice: "100.00",
    weekendPrice: null,
    maxAdults: 1,
    maxChildren: 0,
    maxOccupancy: 1,
    totalInventory: 1,
    roomSize: null,
    bedType: null,
    isFeatured: false,
    category: { id: "cat-1", name: "Standard", slug: "standard" },
    taxRate: null,
    media: [],
    amenities: [],
  }, {
    id: "room-blocked",
    name: "Suite",
    slug: "suite",
    shortDescription: null,
    basePrice: "300.00",
    weekendPrice: null,
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    totalInventory: 1,
    roomSize: null,
    bedType: null,
    isFeatured: false,
    category: { id: "cat-2", name: "Suite", slug: "suite" },
    taxRate: null,
    media: [],
    amenities: [],
  }]);
  stub(prisma.roomAvailability, "findMany", async () => []);
  stub(prisma.roomBlock, "findMany", async () => [{
    roomId: "room-blocked",
    startDate: checkIn,
    endDate: checkOut,
    quantity: 1,
    isActive: true,
    deletedAt: null,
  }]);
  stub(prisma.bookingRoom, "findMany", async () => []);
  stub(prisma.roomRate, "findMany", async () => []);

  const response = await request(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.items.length, 0);
  assert.equal(body.data.pagination.total, 0);
});

test("reserveInventory conditionally updates and rejects concurrent overbooking", async () => {
  const state = {
    totalInventory: 1,
    bookedCount: 0,
    blockedCount: 0,
    availableCount: 1,
    isClosed: false,
  };

  const tx = {
    room: {
      findFirst: async () => ({ id: "room-1", totalInventory: 1 }),
    },
    roomBlock: {
      findMany: async () => [],
    },
    roomAvailability: {
      findMany: async () => [{ date: availability.asDatabaseDate("2026-11-01") }],
      findUnique: async () => ({ ...state }),
      updateMany: async ({ where, data }) => {
        if (where.bookedCount !== undefined && where.bookedCount !== state.bookedCount) {
          return { count: 0 };
        }
        if (where.availableCount?.gte != null && state.availableCount < where.availableCount.gte) {
          return { count: 0 };
        }
        if (data.bookedCount?.increment) state.bookedCount += data.bookedCount.increment;
        if (typeof data.availableCount === "number") state.availableCount = data.availableCount;
        if (typeof data.blockedCount === "number") state.blockedCount = data.blockedCount;
        return { count: 1 };
      },
    },
  };

  const first = await availability.reserveInventory(tx, {
    roomId: "room-1",
    checkIn: "2026-11-01",
    checkOut: "2026-11-02",
    quantity: 1,
  });
  assert.deepEqual(first.nights, ["2026-11-01"]);
  assert.equal(state.bookedCount, 1);
  assert.equal(state.availableCount, 0);

  await assert.rejects(
    () => availability.reserveInventory(tx, {
      roomId: "room-1",
      checkIn: "2026-11-01",
      checkOut: "2026-11-02",
      quantity: 1,
    }),
    (error) => error instanceof AppError && error.errorCode === "INVENTORY_UNAVAILABLE" && error.statusCode === 409
  );
});

test("releaseInventory restores booked inventory", async () => {
  const state = {
    bookedCount: 1,
    availableCount: 0,
  };
  const tx = {
    roomAvailability: {
      updateMany: async ({ where, data }) => {
        if (where.bookedCount?.gte != null && state.bookedCount < where.bookedCount.gte) {
          return { count: 0 };
        }
        if (data.bookedCount?.decrement) state.bookedCount -= data.bookedCount.decrement;
        if (data.availableCount?.increment) state.availableCount += data.availableCount.increment;
        return { count: 1 };
      },
    },
  };

  const result = await availability.releaseInventory(tx, {
    roomId: "room-1",
    checkIn: "2026-11-01",
    checkOut: "2026-11-02",
    quantity: 1,
  });
  assert.deepEqual(result.nights, ["2026-11-01"]);
  assert.equal(state.bookedCount, 0);
  assert.equal(state.availableCount, 1);
});
