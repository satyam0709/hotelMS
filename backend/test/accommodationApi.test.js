const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, afterEach, before, test } = require("node:test");
const app = require("../src/app");
const env = require("../src/config/env");
const prisma = require("../src/prisma/client");
const { signAccessToken } = require("../src/utils/jwt");

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
    id: "accommodation-admin",
    name: "Accommodation Admin",
    email: "accommodation@example.invalid",
    username: "accommodation-admin",
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
  return `${env.cookieName}=${signAccessToken("accommodation-admin")}`;
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
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

test("public room categories and amenities return active projections with pagination", async () => {
  let categoryArgs;
  let amenityArgs;
  stub(prisma.roomCategory, "findMany", async (args) => {
    categoryArgs = args;
    return [{ id: "category-1", name: "Deluxe", slug: "deluxe", featuredMedia: null }];
  });
  stub(prisma.roomCategory, "count", async () => 1);
  stub(prisma.amenity, "findMany", async (args) => {
    amenityArgs = args;
    return [{ id: "amenity-1", name: "Wi-Fi", slug: "wifi", icon: "wifi" }];
  });
  stub(prisma.amenity, "count", async () => 1);
  stubTransaction();

  const categoryResponse = await request("/api/room-categories?search=deluxe&page=1&limit=10");
  const categoryBody = await categoryResponse.json();
  assert.equal(categoryResponse.status, 200);
  assert.equal(categoryBody.data.items[0].slug, "deluxe");
  assert.deepEqual(categoryArgs.where, { deletedAt: null, isActive: true, OR: [{ name: { contains: "deluxe" } }, { slug: { contains: "deluxe" } }] });
  assert.equal(categoryArgs.skip, 0);
  assert.equal(categoryArgs.take, 10);
  assert.equal("createdAt" in categoryArgs.select, false);

  const amenitiesResponse = await request("/api/amenities");
  const amenitiesBody = await amenitiesResponse.json();
  assert.equal(amenitiesResponse.status, 200);
  assert.equal(amenitiesBody.data.items[0].slug, "wifi");
  assert.deepEqual(amenityArgs.where, { deletedAt: null, isActive: true });
  assert.deepEqual(Object.keys(amenityArgs.select).sort(), ["displayOrder", "icon", "id", "name", "slug"]);
});

test("public category details only return active records", async () => {
  let findArgs;
  stub(prisma.roomCategory, "findFirst", async (args) => {
    findArgs = args;
    return { id: "category-1", name: "Deluxe", slug: "deluxe", featuredMedia: null };
  });

  const response = await request("/api/room-categories/deluxe");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.slug, "deluxe");
  assert.deepEqual(findArgs.where, { slug: "deluxe", isActive: true, deletedAt: null });
  assert.equal("deletedAt" in findArgs.select, false);
});

test("admin category endpoints enforce authentication, permissions, and create validation", async () => {
  let adminFindCount = 0;
  stub(prisma.adminUser, "findFirst", async () => {
    adminFindCount += 1;
    return adminRecord();
  });

  const unauthenticated = await request("/api/admin/room-categories");
  assert.equal(unauthenticated.status, 401);
  assert.equal(adminFindCount, 0);

  const forbidden = await request("/api/admin/room-categories", { headers: { cookie: cookie() } });
  assert.equal(forbidden.status, 403);

  stub(prisma.adminUser, "findFirst", async () => adminRecord(["room_categories.create"]));
  const invalid = await request("/api/admin/room-categories", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ name: "Invalid Slug", slug: "Not Valid" }),
  });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).errorCode, "VALIDATION_ERROR");
});

test("admin room category create validates media and writes an audit record", async () => {
  const activityLogs = [];
  let createdData;
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["room_categories.create"]));
  stub(prisma.roomCategory, "create", async ({ data }) => {
    createdData = data;
    return { id: "category-created", ...data, featuredMedia: null };
  });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const response = await request("/api/admin/room-categories", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json", "user-agent": "accommodation-test" },
    body: JSON.stringify({ name: "Deluxe", slug: "deluxe", description: "Large room", featuredMediaId: null }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.id, "category-created");
  assert.equal(createdData.name, "Deluxe");
  assert.equal(activityLogs.length, 1);
  assert.equal(activityLogs[0].module, "room_categories");
  assert.equal(activityLogs[0].action, "create");
  assert.equal(activityLogs[0].entityId, "category-created");
  assert.deepEqual(activityLogs[0].metadataJson, { changedFields: ["name", "slug", "description", "featuredMediaId"] });
  assert.equal(activityLogs[0].userAgent, "accommodation-test");
});

test("admin amenity delete uses soft delete and logs the mutation", async () => {
  const activityLogs = [];
  let updateArgs;
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["amenities.delete"]));
  stub(prisma.amenity, "findFirst", async () => ({ id: "amenity-1" }));
  stub(prisma.amenity, "update", async (args) => { updateArgs = args; return { id: "amenity-1", ...args.data }; });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const response = await request("/api/admin/amenities/amenity-1", {
    method: "DELETE",
    headers: { cookie: cookie() },
  });
  assert.equal(response.status, 200);
  assert.ok(updateArgs.data.deletedAt instanceof Date);
  assert.equal(activityLogs[0].module, "amenities");
  assert.equal(activityLogs[0].action, "delete");
  assert.equal(activityLogs[0].entityId, "amenity-1");
});

test("admin category and amenity updates, creates, and reorders require permissions and audit", async () => {
  const activityLogs = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord([
    "room_categories.update", "amenities.create", "amenities.update",
  ]));
  stub(prisma.roomCategory, "findFirst", async () => ({ id: "category-1" }));
  stub(prisma.roomCategory, "update", async ({ data }) => ({ id: "category-1", ...data }));
  stub(prisma.roomCategory, "findMany", async () => [{ id: "category-1" }]);
  stub(prisma.amenity, "create", async ({ data }) => ({ id: "amenity-created", ...data }));
  stub(prisma.amenity, "findFirst", async () => ({ id: "amenity-1" }));
  stub(prisma.amenity, "update", async ({ data }) => ({ id: "amenity-1", ...data }));
  stub(prisma.amenity, "findMany", async () => [{ id: "amenity-1" }]);
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const categoryUpdate = await request("/api/admin/room-categories/category-1", {
    method: "PATCH",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ name: "Premium" }),
  });
  assert.equal(categoryUpdate.status, 200);

  const categoryReorder = await request("/api/admin/room-categories/reorder", {
    method: "PATCH",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ items: [{ id: "category-1", displayOrder: 2 }] }),
  });
  assert.equal(categoryReorder.status, 200);

  const amenityCreate = await request("/api/admin/amenities", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ name: "Wi-Fi", slug: "wifi", icon: "wifi" }),
  });
  assert.equal(amenityCreate.status, 200);

  const amenityUpdate = await request("/api/admin/amenities/amenity-1", {
    method: "PATCH",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ icon: "wireless" }),
  });
  assert.equal(amenityUpdate.status, 200);

  const amenityReorder = await request("/api/admin/amenities/reorder", {
    method: "PATCH",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ items: [{ id: "amenity-1", displayOrder: 4 }] }),
  });
  assert.equal(amenityReorder.status, 200);
  assert.deepEqual(activityLogs.map(({ action }) => action).sort(), ["create", "reorder", "reorder", "update", "update"]);
  assert.equal(activityLogs.some(({ module }) => module === "room_categories"), true);
  assert.equal(activityLogs.some(({ module }) => module === "amenities"), true);
});

test("public room filters apply category, guest, price, featured, amenities, search, and pagination", async () => {
  let findArgs;
  stub(prisma.room, "findMany", async (args) => { findArgs = args; return []; });
  stub(prisma.room, "count", async () => 0);
  stubTransaction();

  const response = await request("/api/rooms?category=deluxe&guestCount=3&minPrice=100&maxPrice=500&amenityIds=amenity-a,amenity-b&isFeatured=true&search=suite&page=2&limit=5");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data.pagination, { page: 2, limit: 5, total: 0, pages: 0 });
  assert.deepEqual(findArgs.where.category, { is: { slug: "deluxe", isActive: true, deletedAt: null } });
  assert.equal(findArgs.where.maxOccupancy.gte, 3);
  assert.deepEqual(findArgs.where.basePrice, { gte: 100, lte: 500 });
  assert.equal(findArgs.where.isFeatured, true);
  assert.equal(findArgs.where.AND.length, 2);
  assert.equal(findArgs.where.OR.some((field) => field.name), true);
  assert.equal(findArgs.skip, 5);
  assert.equal(findArgs.take, 5);
  assert.equal("roomCode" in findArgs.select, false);
  assert.equal("taxRateId" in findArgs.select, false);
});

test("public room detail returns accommodation details and related rooms without availability calculations", async () => {
  let detailArgs;
  let relatedArgs;
  stub(prisma.room, "findFirst", async (args) => {
    detailArgs = args;
    return {
      id: "room-1", slug: "suite", name: "Suite", category: { id: "category-1" },
      amenities: [], media: [], basePrice: "250.00", maxOccupancy: 3,
    };
  });
  stub(prisma.room, "findMany", async (args) => { relatedArgs = args; return []; });

  const response = await request("/api/rooms/suite");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(detailArgs.where, {
    slug: "suite", deletedAt: null, isActive: true,
    category: { is: { isActive: true, deletedAt: null } },
  });
  assert.equal(body.data.name, "Suite");
  assert.deepEqual(body.data.relatedRooms, []);
  assert.deepEqual(relatedArgs.where, { deletedAt: null, isActive: true, roomCategoryId: "category-1", id: { not: "room-1" } });
  assert.equal("availability" in detailArgs.select, false);
});

test("admin room create validates relations, synchronizes amenities/media, and audits changes", async () => {
  const activityLogs = [];
  const createdRoomData = [];
  const createdRoomAmenities = [];
  const createdRoomMedia = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["rooms.create"]));
  stub(prisma.roomCategory, "findFirst", async () => ({ id: "category-1" }));
  stub(prisma.amenity, "findMany", async ({ where }) => where.id.in.map((id) => ({ id })));
  stub(prisma.mediaAsset, "findMany", async ({ where }) => where.id.in.map((id) => ({ id })));
  stub(prisma.room, "create", async ({ data }) => {
    createdRoomData.push(data);
    return { id: "room-created" };
  });
  stub(prisma.room, "findUnique", async () => ({ id: "room-created", name: "Suite" }));
  stub(prisma.roomAmenity, "deleteMany", async () => ({ count: 0 }));
  stub(prisma.roomAmenity, "createMany", async ({ data }) => createdRoomAmenities.push(...data));
  stub(prisma.roomMedia, "findUnique", async () => null);
  stub(prisma.roomMedia, "create", async ({ data }) => {
    const relation = { id: `room-media-${createdRoomMedia.length + 1}`, ...data };
    createdRoomMedia.push(relation);
    return relation;
  });
  stub(prisma.roomMedia, "updateMany", async () => ({ count: 0 }));
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const response = await request("/api/admin/rooms", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({
      name: "Suite", slug: "suite", roomCode: "SUITE-1", roomCategoryId: "category-1",
      basePrice: 250, maxAdults: 2, maxChildren: 1, maxOccupancy: 3, totalInventory: 2,
      amenityIds: ["amenity-1"], media: [{ mediaId: "media-1", usage: "hero", displayOrder: 0 }],
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.id, "room-created");
  assert.equal("roomCategoryId" in createdRoomData[0], true);
  assert.deepEqual(createdRoomAmenities, [{ roomId: "room-created", amenityId: "amenity-1" }]);
  assert.equal(createdRoomMedia[0].mediaId, "media-1");
  assert.deepEqual(activityLogs.map(({ action }) => action).sort(), ["amenity-assignment", "create", "media-sync"]);
  assert.equal(activityLogs[0].module, "rooms");
  assert.equal(activityLogs[0].entityId, "room-created");
});

test("admin room delete soft-deletes the room and records the mutation", async () => {
  let updateArgs;
  const activityLogs = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["rooms.delete"]));
  stub(prisma.room, "findFirst", async () => ({ id: "room-1" }));
  stub(prisma.room, "update", async (args) => { updateArgs = args; return { id: "room-1", ...args.data }; });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const response = await request("/api/admin/rooms/room-1", {
    method: "DELETE",
    headers: { cookie: cookie() },
  });
  assert.equal(response.status, 200);
  assert.ok(updateArgs.data.deletedAt instanceof Date);
  assert.equal(activityLogs[0].action, "delete");
  assert.equal(activityLogs[0].entityId, "room-1");
});

test("admin availability upsert validates inventory and audits per-date changes", async () => {
  const activityLogs = [];
  let upsertArgs;
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["rooms.update"]));
  stub(prisma.room, "findFirst", async () => ({ id: "room-1", totalInventory: 3 }));
  stub(prisma.roomAvailability, "upsert", async (args) => {
    upsertArgs = args;
    return { id: "availability-1", ...args.create };
  });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const response = await request("/api/admin/rooms/room-1/availability", {
    method: "PUT",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ days: [{ date: "2026-11-01", totalInventory: 3, bookedCount: 1, blockedCount: 1, availableCount: 1 }] }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data[0].id, "availability-1");
  assert.equal(upsertArgs.create.roomId, "room-1");
  assert.equal(upsertArgs.create.availableCount, 1);
  assert.equal(activityLogs[0].action, "availability-update");
  assert.deepEqual(activityLogs[0].metadataJson, { dayCount: 1 });
});

test("admin room blocks and rates validate dates and create audited records", async () => {
  const activityLogs = [];
  let blockCreate;
  let rateCreate;
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["rooms.create"]));
  stub(prisma.room, "findFirst", async () => ({ id: "room-1", totalInventory: 3 }));
  stub(prisma.roomBlock, "create", async ({ data }) => { blockCreate = data; return { id: "block-1", ...data }; });
  stub(prisma.roomRate, "create", async ({ data }) => { rateCreate = data; return { id: "rate-1", ...data }; });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const invalidBlock = await request("/api/admin/rooms/room-1/blocks", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ startDate: "2026-11-05", endDate: "2026-11-05", quantity: 1 }),
  });
  assert.equal(invalidBlock.status, 400);

  const blockResponse = await request("/api/admin/rooms/room-1/blocks", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ startDate: "2026-11-05", endDate: "2026-11-07", quantity: 1, reason: "Maintenance" }),
  });
  assert.equal(blockResponse.status, 200);
  assert.equal(blockCreate.roomId, "room-1");
  assert.equal(blockCreate.createdById, "accommodation-admin");

  const rateResponse = await request("/api/admin/rooms/room-1/rates", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ startDate: "2026-12-01", endDate: "2026-12-31", rateType: "SEASONAL", price: 300 }),
  });
  assert.equal(rateResponse.status, 200);
  assert.equal(rateCreate.roomId, "room-1");
  assert.equal(rateCreate.price, 300);
  assert.deepEqual(activityLogs.map(({ action }) => action).sort(), ["block-create", "rate-create"]);
});
