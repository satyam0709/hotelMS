const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, afterEach, before, test } = require("node:test");
const app = require("../src/app");
const env = require("../src/config/env");
const prisma = require("../src/prisma/client");
const bookingService = require("../src/services/booking.service");
const availability = require("../src/services/availability.service");
const { signAccessToken } = require("../src/utils/jwt");
const AppError = require("../src/utils/appError");

let server;
let baseUrl;
const restorers = [];

function stub(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  restorers.push(() => { target[key] = original; });
}

function stubTransaction() {
  stub(prisma, "$transaction", (operation) =>
    typeof operation === "function" ? operation(prisma) : Promise.all(operation)
  );
}

function adminRecord(permissionKeys = []) {
  return {
    id: "booking-admin",
    name: "Booking Admin",
    email: "booking@example.invalid",
    username: "booking-admin",
    status: "ACTIVE",
    lastLoginAt: null,
    roles: [{ role: {
      id: "role-id",
      name: "Test Role",
      slug: "test-role",
      permissions: permissionKeys.map((key) => ({ permission: { key } })),
    } }],
  };
}

function cookie() {
  return `${env.cookieName}=${signAccessToken("booking-admin")}`;
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function futureDate(daysAhead) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function roomRecord() {
  return {
    id: "room-1",
    name: "Deluxe",
    slug: "deluxe",
    basePrice: "200.00",
    weekendPrice: null,
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    totalInventory: 2,
    extraBedAllowed: false,
    extraBedCharge: null,
    taxRate: { id: "tax-1", name: "GST", percentage: "12.00", isActive: true, deletedAt: null },
  };
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

test("public booking create validates payload", async () => {
  const response = await request("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      checkIn: futureDate(10),
      checkOut: futureDate(8),
      guest: { fullName: "A" },
      rooms: [],
    }),
  });
  assert.equal(response.status, 400);
});

test("public booking create reserves inventory and returns booking reference", async () => {
  const checkIn = futureDate(14);
  const checkOut = futureDate(16);
  const activityLogs = [];
  const createdRooms = [];
  const nightTwo = futureDate(15);
  const availabilityByDate = new Map([
    [checkIn, { totalInventory: 2, bookedCount: 0, blockedCount: 0, availableCount: 2, isClosed: false }],
    [nightTwo, { totalInventory: 2, bookedCount: 0, blockedCount: 0, availableCount: 2, isClosed: false }],
  ]);

  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.room, "findFirst", async () => roomRecord());
  stub(prisma.roomAvailability, "findMany", async () => [
    { date: availability.asDatabaseDate(checkIn) },
    { date: availability.asDatabaseDate(nightTwo) },
  ]);
  stub(prisma.roomBlock, "findMany", async () => []);
  stub(prisma.bookingRoom, "findMany", async () => []);
  stub(prisma.roomRate, "findMany", async () => []);
  stub(prisma.guest, "findFirst", async () => null);
  stub(prisma.guest, "create", async ({ data }) => ({ id: "guest-1", fullName: data.fullName, email: data.email, phone: data.phone }));
  stub(prisma.roomAvailability, "findUnique", async ({ where }) => {
    const key = availability.toDateString(where.roomId_date.date);
    return { ...availabilityByDate.get(key) };
  });
  stub(prisma.roomAvailability, "updateMany", async ({ where, data }) => {
    const key = availability.toDateString(where.date);
    const state = availabilityByDate.get(key);
    if (!state) return { count: 0 };
    if (where.bookedCount !== undefined && where.bookedCount !== state.bookedCount) return { count: 0 };
    if (where.availableCount?.gte != null && state.availableCount < where.availableCount.gte) return { count: 0 };
    if (data.bookedCount?.increment) state.bookedCount += data.bookedCount.increment;
    if (typeof data.availableCount === "number") state.availableCount = data.availableCount;
    return { count: 1 };
  });
  stub(prisma.booking, "create", async ({ data }) => ({ id: "booking-1", bookingRef: data.bookingRef }));
  stub(prisma.bookingRoom, "create", async ({ data }) => {
    createdRooms.push(data);
    return { id: "booking-room-1", ...data };
  });
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => data);
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stub(prisma.booking, "findUnique", async () => ({
    id: "booking-1",
    bookingRef: "HMS-TEST-001",
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentMethod: "PAY_AT_HOTEL",
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: 2,
    children: 0,
    roomCount: 1,
    subtotal: "400.00",
    discountAmount: "0.00",
    taxAmount: "48.00",
    extraBedAmount: "0.00",
    totalAmount: "448.00",
    currency: "INR",
    guest: { id: "guest-1", fullName: "Riya Sharma", email: "riya@example.com", phone: "9999999999" },
    rooms: createdRooms,
    statusHistory: [{ oldStatus: null, newStatus: "PENDING" }],
  }));
  stubTransaction();

  const response = await request("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      checkIn,
      checkOut,
      paymentMethod: "PAY_AT_HOTEL",
      guest: { fullName: "Riya Sharma", email: "riya@example.com", phone: "9999999999" },
      rooms: [{ roomId: "room-1", quantity: 1, adults: 2, children: 0 }],
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.bookingRef, "HMS-TEST-001");
  assert.equal(body.data.status, "PENDING");
  assert.equal(availabilityByDate.get(checkIn).bookedCount, 1);
  assert.equal(availabilityByDate.get(nightTwo).bookedCount, 1);
  assert.equal(createdRooms[0].roomId, "room-1");
  assert.equal(createdRooms[0].priceSubtotal, 400);
  assert.equal(activityLogs[0].action, "public-create");
});

test("public booking lookup requires email and phone and returns narrow projection", async () => {
  stub(prisma.booking, "findMany", async () => []);
  let findArgs;
  stub(prisma.booking, "findFirst", async (args) => {
    findArgs = args;
    return {
      bookingRef: "HMS-TEST-001",
      status: "PENDING",
      guest: { fullName: "Riya Sharma", email: "riya@example.com", phone: "9999999999" },
      rooms: [],
    };
  });

  const missing = await request("/api/bookings/HMS-TEST-001");
  assert.equal(missing.status, 400);

  const emailOnly = await request("/api/bookings/HMS-TEST-001?email=riya@example.com");
  assert.equal(emailOnly.status, 400);

  const response = await request(
    "/api/bookings/HMS-TEST-001?email=riya@example.com&phone=9999999999"
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.bookingRef, "HMS-TEST-001");
  assert.equal(findArgs.where.bookingRef, "HMS-TEST-001");
  assert.equal(findArgs.where.guest.is.email, "riya@example.com");
  assert.equal(findArgs.where.guest.is.phone, "9999999999");
  assert.equal("guestId" in findArgs.select, false);
});

test("admin booking endpoints enforce auth and permissions", async () => {
  stub(prisma.adminUser, "findFirst", async () => adminRecord());
  const unauthenticated = await request("/api/admin/bookings");
  assert.equal(unauthenticated.status, 401);

  const forbidden = await request("/api/admin/bookings", { headers: { cookie: cookie() } });
  assert.equal(forbidden.status, 403);
});

test("admin can confirm a pending booking", async () => {
  const activityLogs = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["bookings.update"]));
  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-1",
    bookingRef: "HMS-TEST-001",
    status: "PENDING",
    checkInDate: futureDate(20),
    checkOutDate: futureDate(22),
    rooms: [{ roomId: "room-1", quantity: 1 }],
  }));
  stub(prisma.booking, "update", async ({ data }) => ({ id: "booking-1", bookingRef: "HMS-TEST-001", status: data.status }));
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => data);
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stub(prisma.booking, "findUnique", async () => ({
    id: "booking-1",
    bookingRef: "HMS-TEST-001",
    status: "CONFIRMED",
    rooms: [],
    guest: { id: "guest-1", fullName: "Riya", email: "riya@example.com", phone: null },
    statusHistory: [],
  }));
  stubTransaction();

  const response = await request("/api/admin/bookings/booking-1/status", {
    method: "PATCH",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ status: "CONFIRMED", note: "Payment received at desk" }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.status, "CONFIRMED");
  assert.equal(activityLogs[0].action, "status");
});

test("admin cancel releases inventory", async () => {
  const availabilityByDate = new Map([
    ["2026-11-10", { bookedCount: 1, availableCount: 0 }],
    ["2026-11-11", { bookedCount: 1, availableCount: 0 }],
  ]);
  const activityLogs = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["bookings.cancel"]));
  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-1",
    bookingRef: "HMS-TEST-001",
    status: "CONFIRMED",
    checkInDate: "2026-11-10",
    checkOutDate: "2026-11-12",
    rooms: [{ roomId: "room-1", quantity: 1 }],
  }));
  stub(prisma.roomAvailability, "updateMany", async ({ where, data }) => {
    const key = availability.toDateString(where.date);
    const state = availabilityByDate.get(key);
    if (!state) return { count: 0 };
    if (where.bookedCount?.gte != null && state.bookedCount < where.bookedCount.gte) {
      return { count: 0 };
    }
    if (data.bookedCount?.decrement) state.bookedCount -= data.bookedCount.decrement;
    if (data.availableCount?.increment) state.availableCount += data.availableCount.increment;
    return { count: 1 };
  });
  stub(prisma.booking, "update", async ({ data }) => ({ id: "booking-1", bookingRef: "HMS-TEST-001", status: data.status }));
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => data);
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stub(prisma.booking, "findUnique", async () => ({
    id: "booking-1",
    bookingRef: "HMS-TEST-001",
    status: "CANCELLED",
    rooms: [],
    guest: { id: "guest-1", fullName: "Riya", email: "riya@example.com", phone: null },
    statusHistory: [],
  }));
  stubTransaction();

  const response = await request("/api/admin/bookings/booking-1/cancel", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ reason: "Guest requested cancellation" }),
  });
  assert.equal(response.status, 200);
  assert.equal(availabilityByDate.get("2026-11-10").bookedCount, 0);
  assert.equal(availabilityByDate.get("2026-11-11").availableCount, 1);
  assert.equal(activityLogs[0].action, "cancel");
});

test("invalid status transitions are rejected", async () => {
  await assert.rejects(
    async () => {
      const tx = {
        booking: {
          update: async () => ({}),
        },
        bookingStatusHistory: { create: async () => ({}) },
        activityLog: { create: async () => ({}) },
      };
      // Force use of private transition through updateBookingStatus stubs
      stub(prisma.booking, "findMany", async () => []);
      stub(prisma.booking, "findFirst", async () => ({
        id: "booking-1",
        bookingRef: "HMS-TEST-001",
        status: "CHECKED_OUT",
        checkInDate: "2026-11-10",
        checkOutDate: "2026-11-12",
        rooms: [],
      }));
      stubTransaction();
      await bookingService.updateBookingStatus("booking-1", { status: "CONFIRMED" }, {
        admin: { id: "booking-admin" },
      });
      return tx;
    },
    (error) => error instanceof AppError && error.errorCode === "INVALID_STATUS_TRANSITION"
  );
});

test("expireStaleHolds releases inventory for expired pending bookings", async () => {
  const availabilityState = { bookedCount: 1, availableCount: 0 };
  let expiredUpdate = null;

  stub(prisma.booking, "findMany", async () => [{
    id: "booking-expired",
    bookingRef: "HMS-EXPIRED",
    status: "PENDING",
    checkInDate: "2026-11-10",
    checkOutDate: "2026-11-11",
    rooms: [{ roomId: "room-1", quantity: 1 }],
  }]);
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-expired",
    bookingRef: "HMS-EXPIRED",
    status: "PENDING",
    checkInDate: "2026-11-10",
    checkOutDate: "2026-11-11",
    rooms: [{ roomId: "room-1", quantity: 1 }],
  }));
  stub(prisma.roomAvailability, "updateMany", async ({ data }) => {
    if (data.bookedCount?.decrement) availabilityState.bookedCount -= data.bookedCount.decrement;
    if (data.availableCount?.increment) availabilityState.availableCount += data.availableCount.increment;
    return { count: 1 };
  });
  stub(prisma.booking, "update", async ({ data }) => {
    expiredUpdate = data;
    return { id: "booking-expired", bookingRef: "HMS-EXPIRED", status: data.status };
  });
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => data);
  stub(prisma.activityLog, "create", async () => ({}));
  stubTransaction();

  const result = await bookingService.expireStaleHolds();
  assert.equal(result.expired, 1);
  assert.equal(expiredUpdate.status, "EXPIRED");
  assert.equal(availabilityState.bookedCount, 0);
  assert.equal(availabilityState.availableCount, 1);
});

test("guest cancel-request for paid booking opens inquiry without cancelling", async () => {
  const histories = [];
  const inquiries = [];

  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-paid",
    bookingRef: "HMS-PAID",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    guest: { fullName: "Paid Guest", email: "paid@example.com", phone: "+911111111111" },
  }));
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => {
    histories.push(data);
    return data;
  });
  stub(prisma.inquiry, "create", async ({ data }) => {
    inquiries.push(data);
    return { id: "inquiry-1", ...data };
  });
  stub(prisma.booking, "findUnique", async () => ({
    id: "booking-paid",
    bookingRef: "HMS-PAID",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    checkInDate: "2026-12-01",
    checkOutDate: "2026-12-03",
    guest: { fullName: "Paid Guest", email: "paid@example.com", phone: "+911111111111" },
    rooms: [],
  }));

  const result = await bookingService.requestGuestCancellation(
    "HMS-PAID",
    { email: "paid@example.com", phone: "+911111111111", reason: "Plans changed" },
    null,
  );

  assert.equal(result.cancelRequestSubmitted, true);
  assert.equal(result.status, "CONFIRMED");
  assert.equal(histories.length, 1);
  assert.match(histories[0].note, /Cancel request/);
  assert.equal(inquiries.length, 1);
  assert.equal(inquiries[0].type, "BOOKING");
  assert.match(inquiries[0].subject, /Cancel request/);
});

test("quoteRoomStay rejects unavailable inventory before booking create", async () => {
  stub(prisma.room, "findFirst", async () => roomRecord());
  stub(prisma.roomAvailability, "findMany", async () => []);
  stub(prisma.roomBlock, "findMany", async () => []);
  stub(prisma.bookingRoom, "findMany", async () => [{
    roomId: "room-1",
    quantity: 2,
    booking: {
      status: "CONFIRMED",
      checkInDate: "2026-11-10",
      checkOutDate: "2026-11-12",
      expiresAt: null,
    },
  }]);
  stub(prisma.roomRate, "findMany", async () => []);

  await assert.rejects(
    () => availability.quoteRoomStay(prisma, {
      roomId: "room-1",
      checkIn: "2026-11-10",
      checkOut: "2026-11-12",
      adults: 2,
      children: 0,
      quantity: 1,
    }),
    (error) => error instanceof AppError && error.statusCode === 409
  );
});

test("POST /api/bookings/quote calculates stay subtotal, coupon discount, taxes, and total", async () => {
  stub(prisma.room, "findFirst", async () => roomRecord());
  stub(prisma.roomAvailability, "findMany", async () => []);
  stub(prisma.roomBlock, "findMany", async () => []);
  stub(prisma.bookingRoom, "findMany", async () => []);
  stub(prisma.roomRate, "findMany", async () => []);
  stub(prisma.coupon, "findFirst", async () => ({
    id: "coupon-1",
    code: "FLAT500",
    discountType: "FIXED",
    discountValue: 100,
    maxDiscountAmount: null,
    minBookingAmount: 200,
    validFrom: null,
    validTo: null,
    usageLimit: 100,
    usedCount: 2,
    isActive: true,
    deletedAt: null,
  }));

  const response = await request("/api/bookings/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkIn: futureDate(1),
      checkOut: futureDate(3),
      rooms: [{ roomId: "room-1", quantity: 1, adults: 2, children: 0, extraBeds: 0 }],
      couponCode: "FLAT500",
    }),
  });

  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  // 2 nights @ 200 = 400
  assert.equal(payload.data.subtotal, 400);
  // discount 100
  assert.equal(payload.data.discountAmount, 100);
  assert.equal(payload.data.coupon.code, "FLAT500");
  // taxable = 300, 12% GST = 36, total = 336
  assert.equal(payload.data.taxAmount, 36);
  assert.equal(payload.data.totalAmount, 336);
});
