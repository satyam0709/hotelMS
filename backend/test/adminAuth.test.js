const assert = require("node:assert/strict");
const { once } = require("node:events");
const jwt = require("jsonwebtoken");
const { after, before, test } = require("node:test");
const app = require("../src/app");
const env = require("../src/config/env");
const prisma = require("../src/prisma/client");
const { serializeAdmin } = require("../src/middleware/auth.middleware");
const { requirePermission } = require("../src/middleware/permission.middleware");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await once(server, "close");
  await prisma.$disconnect();
});

test("health endpoint returns a safe success response", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { status: "ok" } });
});

test("invalid credentials return a generic authentication error", async () => {
  const response = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "nobody@example.invalid", password: "invalid-password" }),
  });
  const body = await response.json();
  assert.equal(response.status, 401);
  assert.equal(body.errorCode, "INVALID_CREDENTIALS");
  assert.equal(body.message, "Invalid email or password.");
  assert.equal("passwordHash" in body, false);
  assert.equal("token" in body, false);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("malformed login requests are rejected by validation", async () => {
  const response = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "" }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).errorCode, "VALIDATION_ERROR");
});

test("admin me rejects requests without a cookie", async () => {
  const response = await fetch(`${baseUrl}/api/admin/auth/me`);
  assert.equal(response.status, 401);
});

test("admin me rejects malformed and expired JWT cookies", async () => {
  const malformed = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { cookie: `${env.cookieName}=not-a-jwt` },
  });
  assert.equal(malformed.status, 401);

  const expired = jwt.sign({ sub: "nonexistent-admin" }, env.jwtSecret, {
    issuer: "hotelms-admin",
    audience: "hotelms-admin",
    expiresIn: "-1s",
  });
  const expiredResponse = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { cookie: `${env.cookieName}=${expired}` },
  });
  assert.equal(expiredResponse.status, 401);
});

test("permission middleware rejects missing permissions and bypasses for Super Admin", async () => {
  const invoke = (admin) => new Promise((resolve) => {
    requirePermission("rooms.read")({ admin }, {}, (error) => resolve(error || null));
  });

  const denied = await invoke({ roles: [], permissions: [] });
  assert.equal(denied.statusCode, 403);

  const allowed = await invoke({ roles: [{ slug: "super-admin" }], permissions: [] });
  assert.equal(allowed, null);
});

test("admin serialization excludes password and authentication secrets", () => {
  const safeAdmin = serializeAdmin({
    id: "admin-id",
    name: "Admin",
    email: "admin@example.invalid",
    username: "admin",
    status: "ACTIVE",
    lastLoginAt: null,
    passwordHash: "must-not-escape",
    roles: [],
  });
  assert.equal("passwordHash" in safeAdmin, false);
  assert.equal("token" in safeAdmin, false);
});

test("invalid reset tokens are rejected without exposing token details", async () => {
  const response = await fetch(`${baseUrl}/api/admin/auth/reset-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "0".repeat(64), password: "a-new-password-123" }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.errorCode, "RESET_TOKEN_INVALID");
  assert.equal("token" in body, false);
});

test("forgot-password response does not reveal account existence", async () => {
  const response = await fetch(`${baseUrl}/api/admin/auth/forgot-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "nobody@example.invalid" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { accepted: true },
    message: "If the account exists, the reset request has been accepted.",
  });
});