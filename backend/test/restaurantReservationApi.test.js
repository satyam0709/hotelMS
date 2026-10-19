const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, afterEach, before, test } = require("node:test");
const app = require("../src/app");
const env = require("../src/config/env");
const prisma = require("../src/prisma/client");
const emailService = require("../src/services/email.service");
const turnstile = require("../src/utils/turnstile");
const { signAccessToken } = require("../src/utils/jwt");
const {
  createAdminRestaurantReservationEmail,
  createGuestRestaurantReservationStatusEmail,
} = require("../src/templates/restaurantReservationEmails");

let server;
let baseUrl;
const restorers = [];

function stub(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  restorers.push(() => { target[key] = original; });
}

function adminRecord(permissionKeys = []) {
  return {
    id: "restaurant-admin",
    name: "Restaurant Admin",
    email: "restaurant@example.invalid",
    username: "restaurant-admin",
    status: "ACTIVE",
    lastLoginAt: null,
    roles: [{
      role: {
        id: "role-id",
        name: "Test Role",
        slug: "test-role",
        permissions: permissionKeys.map((key) => ({ permission: { key } })),
      },
    }],
  };
}

function adminCookie() {
  return `${env.cookieName}=${signAccessToken("restaurant-admin")}`;
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function requestBody(overrides = {}) {
  return {
    guestName: "Alex Morgan",
    guestEmail: "ALEX@example.com",
    guestPhone: "+15551234567",
    guestCount: 4,
    mealType: "DINNER",
    reservationDate: "2027-12-15",
    reservationTime: "19:00",
    dietaryRequests: "One vegetarian guest",
    ...overrides,
  };
}

test("reservation emails escape submitted content and explain the guest status", () => {
  const reservation = {
    guestName: "<Alex>",
    guestEmail: "alex@example.com",
    guestCount: 2,
    mealType: "DINNER",
    reservationDate: new Date("2027-12-15T00:00:00.000Z"),
    reservationTime: "19:00",
    dietaryRequests: "<script>alert(1)</script>",
    status: "CONFIRMED",
    adminRemarks: "<Call us>",
    restaurantName: "Pavilion",
  };
  const adminEmail = createAdminRestaurantReservationEmail(reservation);
  const guestEmail = createGuestRestaurantReservationStatusEmail(reservation);
  assert.equal(adminEmail.html.includes("<script>"), false);
  assert.match(adminEmail.html, /&lt;script&gt;/);
  assert.match(guestEmail.subject, /confirmed/);
  assert.equal(guestEmail.html.includes("<Alex>"), false);
  assert.match(guestEmail.html, /&lt;Call us&gt;/);
});

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

test("public reservation validates request and guest contact requirements", async () => {
  const invalidDate = await request("/api/restaurant/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody({ reservationDate: "2027-02-30" })),
  });
  assert.equal(invalidDate.status, 400);

  const missingContact = await request("/api/restaurant/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody({ guestEmail: undefined, guestPhone: undefined })),
  });
  assert.equal(missingContact.status, 400);
});

test("public reservation creates a pending request and dispatches admin notification", async () => {
  let saved;
  let emailed;
  stub(turnstile, "verifyTurnstileIfConfigured", async () => {});
  stub(prisma.restaurant, "findFirst", async () => ({ id: "restaurant-1", name: "Pavilion" }));
  stub(prisma.websiteSetting, "findFirst", async () => ({ timezone: "UTC" }));
  stub(prisma.restaurantReservation, "create", async ({ data }) => {
    saved = data;
    return { id: "reservation-1", ...data };
  });
  stub(emailService, "sendAdminRestaurantReservationNotification", async (reservation) => {
    emailed = reservation;
    return { delivered: true, channel: "outbox" };
  });

  const response = await request("/api/restaurant/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(requestBody()),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.reservation.id, "reservation-1");
  assert.equal(body.data.reservation.status, "REQUESTED");
  assert.equal(body.data.reservation.guestEmail, "alex@example.com");
  assert.equal(saved.restaurantId, "restaurant-1");
  assert.equal(saved.mealType, "DINNER");
  assert.equal(emailed.restaurantName, "Pavilion");
  assert.equal(body.data.notification.delivered, true);
});

test("admin reservation list requires permission and returns paginated results", async () => {
  let listArgs;
  let countArgs;
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["restaurant.read"]));
  stub(prisma.restaurantReservation, "findMany", async (args) => {
    listArgs = args;
    return [{ id: "reservation-1", status: "REQUESTED" }];
  });
  stub(prisma.restaurantReservation, "count", async (args) => {
    countArgs = args;
    return 1;
  });
  stub(prisma, "$transaction", async (operations) => Promise.all(operations));

  const response = await request("/api/admin/restaurant/reservations?page=1&limit=10&status=REQUESTED", {
    headers: { Cookie: adminCookie() },
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.items.length, 1);
  assert.deepEqual(body.data.pagination, { page: 1, limit: 10, total: 1, pages: 1 });
  assert.equal(listArgs.where.status, "REQUESTED");
  assert.deepEqual(countArgs.where, listArgs.where);
});

test("admin reservation status changes are audited and invalid transitions are rejected", async () => {
  let status = "REQUESTED";
  let activityLog;
  let guestNotification;
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["restaurant.update"]));
  stub(prisma.restaurantReservation, "findUnique", async () => ({
    id: "reservation-1",
    status,
    ...(status === "CONFIRMED" ? { guestName: "Alex Morgan" } : {}),
  }));
  stub(prisma.restaurantReservation, "updateMany", async ({ where, data }) => {
    assert.equal(where.status, "REQUESTED");
    status = data.status;
    return { count: 1 };
  });
  stub(prisma.activityLog, "create", async ({ data }) => { activityLog = data; return data; });
  stub(emailService, "sendRestaurantReservationStatusNotification", async (reservation) => {
    guestNotification = reservation;
    return { delivered: true, channel: "outbox" };
  });
  stub(prisma, "$transaction", async (operation) =>
    typeof operation === "function" ? operation(prisma) : Promise.all(operation)
  );

  const confirmed = await request("/api/admin/restaurant/reservations/reservation-1/status", {
    method: "PATCH",
    headers: { Cookie: adminCookie(), "content-type": "application/json" },
    body: JSON.stringify({ status: "CONFIRMED", adminRemarks: "Confirmed by phone." }),
  });
  assert.equal(confirmed.status, 200);
  assert.equal(status, "CONFIRMED");
  assert.equal(activityLog.action, "reservation.status-update");
  assert.equal(guestNotification.status, "CONFIRMED");
  assert.equal((await confirmed.json()).data.notification.delivered, true);

  const conflict = await request("/api/admin/restaurant/reservations/reservation-1/status", {
    method: "PATCH",
    headers: { Cookie: adminCookie(), "content-type": "application/json" },
    body: JSON.stringify({ status: "DECLINED" }),
  });
  assert.equal(conflict.status, 409);
  assert.equal(status, "CONFIRMED");
});
