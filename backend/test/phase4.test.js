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

function setTransactionStub() {
  stub(prisma, "$transaction", (operation) =>
    typeof operation === "function" ? operation(prisma) : Promise.all(operation)
  );
}

function adminRecord(permissionKeys = []) {
  return {
    id: "phase4-admin",
    name: "Phase 4 Admin",
    email: "phase4-admin@example.invalid",
    username: "phase4-admin",
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

function adminCookie() {
  return `${env.cookieName}=${signAccessToken("phase4-admin")}`;
}

async function request(path, options = {}) {
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

test("public settings, pages, and banners expose only approved content fields", async () => {
  let pageQuery;
  let bannerQuery;
  stub(prisma.websiteSetting, "findFirst", async () => ({
    websiteName: "Test Hotel",
    phone: "1234567890",
    email: "stay@example.invalid",
    logoMedia: { id: "logo", secureUrl: "https://media.example.invalid/logo.webp" },
  }));
  stub(prisma.page, "findFirst", async (args) => {
    pageQuery = args;
    return { id: "page-1", title: "About", slug: "about", publishedAt: null, sections: [] };
  });
  stub(prisma.banner, "findMany", async (args) => {
    bannerQuery = args;
    return [{ id: "banner-1", title: "Welcome", displayOrder: 0 }];
  });

  const settingsResponse = await request("/api/settings");
  const settingsBody = await settingsResponse.json();
  assert.equal(settingsResponse.status, 200);
  assert.equal(settingsBody.data.websiteName, "Test Hotel");
  assert.equal("smtpPassword" in settingsBody.data, false);
  assert.equal("metaTitle" in settingsBody.data, false);

  const pageResponse = await request("/api/pages/about");
  assert.equal(pageResponse.status, 200);
  assert.deepEqual(pageQuery.where, { slug: "about", deletedAt: null, status: "PUBLISHED", isVisible: true });

  const bannerResponse = await request("/api/banners");
  assert.equal(bannerResponse.status, 200);
  assert.equal(bannerQuery.where.isActive, true);
  assert.equal(bannerQuery.where.deletedAt, null);
  assert.equal(bannerQuery.where.AND.length, 2);
});

test("public navigation and policies exclude inactive or unpublished records", async () => {
  let navigationQuery;
  let policyQuery;
  stub(prisma.navigationMenuItem, "findMany", async (args) => { navigationQuery = args; return []; });
  stub(prisma.policy, "findFirst", async (args) => {
    policyQuery = args;
    return { type: "privacy", title: "Privacy", slug: "privacy", content: "Policy text" };
  });

  const navigationResponse = await request("/api/navigation");
  assert.equal(navigationResponse.status, 200);
  assert.deepEqual(navigationQuery.where, { deletedAt: null, isActive: true, parentId: null });

  const policyResponse = await request("/api/policies/privacy");
  assert.equal(policyResponse.status, 200);
  assert.deepEqual(policyQuery.where, { slug: "privacy", isPublished: true, deletedAt: null });
});

test("public facility, restaurant, event, attraction, FAQ, and testimonial endpoints filter active content", async () => {
  let facilityQuery;
  let restaurantQuery;
  let eventQuery;
  let attractionQuery;
  let faqQuery;
  let testimonialQuery;
  stub(prisma.facility, "findMany", async (args) => {
    facilityQuery = args;
    return [{ id: "facility-1", slug: args.where.slug || "pool", name: "Pool" }];
  });
  stub(prisma.restaurant, "findFirst", async (args) => {
    restaurantQuery = args;
    return { id: "restaurant-1", name: "Dining Room", menuCategories: [] };
  });
  stub(prisma.eventVenue, "findMany", async (args) => { eventQuery = args; return []; });
  stub(prisma.eventVenue, "findFirst", async (args) => { eventQuery = args; return { id: "venue-1", slug: "garden" }; });
  stub(prisma.attraction, "findMany", async (args) => { attractionQuery = args; return []; });
  stub(prisma.attraction, "findFirst", async (args) => { attractionQuery = args; return { id: "attraction-1", slug: "lake" }; });
  stub(prisma.faqCategory, "findMany", async (args) => { faqQuery = args; return []; });
  stub(prisma.testimonial, "findMany", async (args) => { testimonialQuery = args; return []; });

  for (const path of ["/api/facilities", "/api/facilities/pool", "/api/restaurant", "/api/events", "/api/events/garden", "/api/attractions?q=lake", "/api/attractions/lake", "/api/faqs", "/api/testimonials"]) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
  }
  assert.deepEqual(facilityQuery.where, { deletedAt: null, isActive: true, slug: "pool" });
  assert.deepEqual(restaurantQuery.where, { deletedAt: null, isActive: true });
  assert.deepEqual(eventQuery.where, { slug: "garden", deletedAt: null, isActive: true });
  assert.deepEqual(attractionQuery.where, { slug: "lake", deletedAt: null, isActive: true });
  assert.deepEqual(faqQuery.where, { deletedAt: null, isActive: true });
  assert.deepEqual(testimonialQuery.where, { deletedAt: null, isActive: true, approvalStatus: "APPROVED" });
});

test("newsletter intake normalizes email and inquiries are logged without submitted contact details", async () => {
  const subscriptions = [];
  const inquiryRecords = [];
  const activityLogs = [];
  stub(prisma.newsletterSubscriber, "upsert", async (args) => subscriptions.push(args));
  stub(prisma.inquiry, "create", async ({ data }) => {
    inquiryRecords.push(data);
    return { id: "inquiry-1", ...data };
  });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));

  const subscriptionResponse = await request("/api/newsletter/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "GUEST@EXAMPLE.INVALID" }),
  });
  const subscriptionBody = await subscriptionResponse.json();
  assert.equal(subscriptionResponse.status, 200);
  assert.deepEqual(subscriptionBody.data, { subscribed: true });
  assert.deepEqual(subscriptions[0].where, { email: "guest@example.invalid" });
  assert.equal("email" in subscriptionBody.data, false);

  const inquiryResponse = await request("/api/inquiries", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "phase4-test-agent" },
    body: JSON.stringify({ type: "CONTACT", name: "Guest Name", email: "guest@example.invalid", phone: "1234567890", message: "Please contact me." }),
  });
  const inquiryBody = await inquiryResponse.json();
  assert.equal(inquiryResponse.status, 200);
  assert.deepEqual(inquiryBody.data, { accepted: true });
  assert.equal(inquiryRecords[0].status, undefined);
  assert.equal(activityLogs[0].module, "inquiries");
  assert.equal(activityLogs[0].action, "public-create");
  assert.deepEqual(activityLogs[0].metadataJson, { type: "CONTACT" });
  assert.equal(activityLogs[0].userAgent, "phase4-test-agent");
  assert.equal(JSON.stringify(activityLogs[0]).includes("guest@example.invalid"), false);
  assert.equal(JSON.stringify(activityLogs[0]).includes("Please contact me."), false);
});

test("admin endpoints require authentication and module permission, and validate create payloads", async () => {
  let adminLookupCount = 0;
  stub(prisma.adminUser, "findFirst", async () => {
    adminLookupCount += 1;
    return adminRecord();
  });

  const unauthenticated = await request("/api/admin/settings");
  assert.equal(unauthenticated.status, 401);
  assert.equal(adminLookupCount, 0);

  const forbidden = await request("/api/admin/settings", { headers: { cookie: adminCookie() } });
  assert.equal(forbidden.status, 403);

  stub(prisma.adminUser, "findFirst", async () => adminRecord(["pages.create"]));
  const invalidCreate = await request("/api/admin/pages", {
    method: "POST",
    headers: { cookie: adminCookie(), "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(invalidCreate.status, 400);
  assert.equal((await invalidCreate.json()).errorCode, "VALIDATION_ERROR");
});

test("admin content mutations create an ActivityLog entry", async () => {
  const activityLogs = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["facilities.create"]));
  stub(prisma.facility, "create", async ({ data }) => ({ id: "facility-created", ...data }));
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  setTransactionStub();

  const response = await request("/api/admin/facilities", {
    method: "POST",
    headers: { cookie: adminCookie(), "content-type": "application/json", "user-agent": "phase4-admin-test" },
    body: JSON.stringify({ name: "Pool", slug: "pool" }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.id, "facility-created");
  assert.equal(activityLogs.length, 1);
  assert.equal(activityLogs[0].module, "facilities");
  assert.equal(activityLogs[0].action, "create");
  assert.equal(activityLogs[0].entityType, "Facility");
  assert.equal(activityLogs[0].entityId, "facility-created");
  assert.deepEqual(activityLogs[0].metadataJson, { changedFields: ["name", "slug"] });
  assert.equal(activityLogs[0].userAgent, "phase4-admin-test");
});

test("admin can change newsletter subscription status with an audit record", async () => {
  const activityLogs = [];
  stub(prisma.adminUser, "findFirst", async () => adminRecord(["newsletter.update"]));
  stub(prisma.newsletterSubscriber, "findFirst", async () => ({ id: "subscriber-1" }));
  stub(prisma.newsletterSubscriber, "update", async ({ data }) => ({ id: "subscriber-1", email: "guest@example.invalid", ...data }));
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  setTransactionStub();

  const response = await request("/api/admin/newsletter/subscriber-1", {
    method: "PATCH",
    headers: { cookie: adminCookie(), "content-type": "application/json" },
    body: JSON.stringify({ status: "UNSUBSCRIBED" }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.status, "UNSUBSCRIBED");
  assert.ok(body.data.unsubscribedAt);
  assert.equal(activityLogs[0].module, "newsletter");
  assert.equal(activityLogs[0].action, "unsubscribe");
  assert.deepEqual(activityLogs[0].metadataJson, { status: "UNSUBSCRIBED" });
});
