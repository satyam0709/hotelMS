const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");
const env = require("../src/config/env");
const prisma = require("../src/prisma/client");
const adminAuthService = require("../src/services/adminAuth.service");
const emailService = require("../src/services/email.service");
const { createEmailService } = require("../src/services/email.service");

after(async () => {
  await prisma.$disconnect();
});

test("forgot-password delivers a hashed token through the development outbox and logs no secrets", async (t) => {
  const outboxDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "hotelms-email-test-"));
  const outboxPath = path.join(outboxDirectory, "outbox.jsonl");
  const storedTokens = [];
  const activityLogs = [];
  const originalFindFirst = prisma.adminUser.findFirst;
  const originalTokenCreate = prisma.passwordResetToken.create;
  const originalActivityCreate = prisma.activityLog.create;
  const originalSend = emailService.sendPasswordResetEmail;

  t.after(async () => {
    prisma.adminUser.findFirst = originalFindFirst;
    prisma.passwordResetToken.create = originalTokenCreate;
    prisma.activityLog.create = originalActivityCreate;
    emailService.sendPasswordResetEmail = originalSend;
    await fs.rm(outboxDirectory, { recursive: true, force: true });
  });

  prisma.adminUser.findFirst = async () => ({ id: "admin-test-id" });
  prisma.passwordResetToken.create = async ({ data }) => storedTokens.push(data);
  prisma.activityLog.create = async ({ data }) => activityLogs.push(data);
  emailService.sendPasswordResetEmail = createEmailService({
    ...env,
    isProduction: false,
    smtpHost: "",
    devEmailOutboxPath: outboxPath,
  }).sendPasswordResetEmail;

  await adminAuthService.requestPasswordReset("admin@example.invalid", {
    ip: "203.0.113.4",
    get: () => "test-agent",
  });

  const [storedToken] = storedTokens;
  const [activityLog] = activityLogs;
  const [outboxMessage] = (await fs.readFile(outboxPath, "utf8")).trim().split("\n").map(JSON.parse);
  const resetUrl = new URL(outboxMessage.text.match(/https?:\/\/\S+/)[0]);
  const rawToken = resetUrl.searchParams.get("token");

  assert.match(rawToken, /^[a-f\d]{64}$/);
  assert.equal(storedToken.tokenHash, createHash("sha256").update(rawToken).digest("hex"));
  assert.equal("token" in storedToken, false);
  assert.equal(activityLog.module, "admin-auth");
  assert.equal(activityLog.action, "password-reset-request");
  assert.equal(activityLog.entityType, "AdminUser");
  assert.equal(activityLog.entityId, "admin-test-id");
  assert.equal(activityLog.ipAddress, "203.0.113.4");
  assert.equal(activityLog.userAgent, "test-agent");
  assert.deepEqual(activityLog.metadataJson, { requestAccepted: true });
  assert.equal(JSON.stringify(activityLog).includes(rawToken), false);
  for (const secretField of ["password", "passwordHash", "token", "tokenHash"]) {
    assert.equal(secretField in activityLog, false);
    assert.equal(secretField in activityLog.metadataJson, false);
  }
  assert.equal(outboxMessage.to, "admin@example.invalid");
});

test("email service refuses development delivery in production", async () => {
  const productionEmailService = createEmailService({ isProduction: true, smtpHost: "" });
  await assert.rejects(
    productionEmailService.sendPasswordResetEmail({ to: "admin@example.invalid", resetUrl: "https://example.invalid/reset" }),
    /not configured/
  );
});

test("email service delivers reset messages through configured SMTP", async () => {
  let transportOptions;
  let sentMessage;
  const smtpEmailService = createEmailService({
    isProduction: true,
    smtpHost: "smtp.example.invalid",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "smtp-user",
    smtpPassword: "smtp-password",
    emailFrom: "HotelMS <no-reply@example.invalid>",
  }, {
    createTransport(options) {
      transportOptions = options;
      return { sendMail: async (message) => { sentMessage = message; } };
    },
  });

  await smtpEmailService.sendPasswordResetEmail({
    to: "admin@example.invalid",
    resetUrl: "https://admin.example.invalid/reset-password?token=test-token",
  });

  assert.deepEqual(transportOptions, {
    host: "smtp.example.invalid",
    port: 587,
    secure: false,
    family: 4,
    auth: { user: "smtp-user", pass: "smtp-password" },
  });
  assert.equal(sentMessage.to, "admin@example.invalid");
  assert.match(sentMessage.text, /https:\/\/admin\.example\.invalid\/reset-password\?token=test-token/);
});