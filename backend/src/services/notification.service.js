const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { encryptSecret, decryptSecret } = require("../utils/secretCrypto");
const { createActivityLog } = require("./activityLog.service");

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pagination(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

function publicSettings(row) {
  if (!row) {
    return {
      id: null,
      smtpHost: null,
      smtpPort: null,
      smtpUser: null,
      hasSmtpPassword: false,
      fromEmail: null,
      adminEmail: null,
      bookingEnabled: true,
      inquiryEnabled: true,
      cancellationEnabled: true,
      checkInReminderEnabled: true,
      updatedAt: null,
    };
  }
  return {
    id: row.id,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpUser: row.smtpUser,
    hasSmtpPassword: Boolean(row.smtpPasswordEncrypted),
    fromEmail: row.fromEmail,
    adminEmail: row.adminEmail,
    bookingEnabled: row.bookingEnabled,
    inquiryEnabled: row.inquiryEnabled,
    cancellationEnabled: row.cancellationEnabled,
    checkInReminderEnabled: row.checkInReminderEnabled ?? true,
    updatedAt: row.updatedAt,
  };
}

async function getSettingsRecord(client = prisma) {
  return client.notificationSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

async function getSettings() {
  return publicSettings(await getSettingsRecord());
}

async function getRuntimeEmailConfig() {
  const row = await getSettingsRecord();
  let smtpPassword = null;
  if (row?.smtpPasswordEncrypted) {
    try {
      smtpPassword = decryptSecret(row.smtpPasswordEncrypted);
    } catch {
      smtpPassword = null;
    }
  }
  return {
    smtpHost: row?.smtpHost || null,
    smtpPort: row?.smtpPort || null,
    smtpUser: row?.smtpUser || null,
    smtpPassword,
    fromEmail: row?.fromEmail || null,
    adminEmail: row?.adminEmail || null,
    bookingEnabled: row?.bookingEnabled ?? true,
    inquiryEnabled: row?.inquiryEnabled ?? true,
    cancellationEnabled: row?.cancellationEnabled ?? true,
    checkInReminderEnabled: row?.checkInReminderEnabled ?? true,
  };
}

async function updateSettings(data, req) {
  return prisma.$transaction(async (tx) => {
    const current = await getSettingsRecord(tx);
    const next = {
      smtpHost: Object.hasOwn(data, "smtpHost") ? data.smtpHost : current?.smtpHost ?? null,
      smtpPort: Object.hasOwn(data, "smtpPort") ? data.smtpPort : current?.smtpPort ?? null,
      smtpUser: Object.hasOwn(data, "smtpUser") ? data.smtpUser : current?.smtpUser ?? null,
      fromEmail: Object.hasOwn(data, "fromEmail") ? data.fromEmail : current?.fromEmail ?? null,
      adminEmail: Object.hasOwn(data, "adminEmail") ? data.adminEmail : current?.adminEmail ?? null,
      bookingEnabled: Object.hasOwn(data, "bookingEnabled") ? data.bookingEnabled : current?.bookingEnabled ?? true,
      inquiryEnabled: Object.hasOwn(data, "inquiryEnabled") ? data.inquiryEnabled : current?.inquiryEnabled ?? true,
      cancellationEnabled: Object.hasOwn(data, "cancellationEnabled")
        ? data.cancellationEnabled
        : current?.cancellationEnabled ?? true,
      checkInReminderEnabled: Object.hasOwn(data, "checkInReminderEnabled")
        ? data.checkInReminderEnabled
        : current?.checkInReminderEnabled ?? true,
      smtpPasswordEncrypted: current?.smtpPasswordEncrypted ?? null,
    };

    if (data.clearSmtpPassword) {
      next.smtpPasswordEncrypted = null;
    } else if (Object.hasOwn(data, "smtpPassword")) {
      next.smtpPasswordEncrypted = data.smtpPassword ? encryptSecret(data.smtpPassword) : null;
    }

    if (next.smtpUser && !next.smtpPasswordEncrypted) {
      fail(400, "SMTP password is required when SMTP user is set.", "VALIDATION_ERROR");
    }
    if ((next.smtpHost || next.smtpPort || next.smtpUser || next.fromEmail)
      && (!next.smtpHost || !next.smtpPort || !next.fromEmail)) {
      fail(400, "SMTP host, port, and from email are required together.", "VALIDATION_ERROR");
    }

    const saved = current
      ? await tx.notificationSetting.update({ where: { id: current.id }, data: next })
      : await tx.notificationSetting.create({ data: next });

    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module: "notifications",
      action: "update",
      entityType: "NotificationSetting",
      entityId: saved.id,
      metadata: {
        changedFields: Object.keys(data).filter((key) => key !== "smtpPassword"),
        passwordUpdated: Boolean(data.smtpPassword) || Boolean(data.clearSmtpPassword),
      },
      request: req,
    });

    return publicSettings(saved);
  });
}

async function listEmailLogs(query = {}) {
  const { page, limit, skip } = pagination(query);
  const where = {};
  if (query.status) where.status = query.status;

  const [items, total] = await prisma.$transaction([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        templateKey: true,
        recipient: true,
        subject: true,
        status: true,
        errorMessage: true,
        relatedType: true,
        relatedId: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    prisma.emailLog.count({ where }),
  ]);

  return paginated(items, total, page, limit);
}

const DEFAULT_TEMPLATES = [
  {
    key: "booking-confirmation",
    subject: "Booking confirmed — {{bookingRef}}",
    bodyText: [
      "Hello {{guestName}},",
      "",
      "Your booking {{bookingRef}} is confirmed.",
      "Check-in: {{checkIn}}",
      "Check-out: {{checkOut}}",
      "Total: {{currency}} {{totalAmount}}",
      "Status: {{status}}",
      "",
      "We look forward to welcoming you.",
    ].join("\n"),
    bodyHtml: "<p>Hello {{guestName}},</p><p>Your booking <strong>{{bookingRef}}</strong> is confirmed.</p><ul><li>Check-in: {{checkIn}}</li><li>Check-out: {{checkOut}}</li><li>Total: {{currency}} {{totalAmount}}</li><li>Status: {{status}}</li></ul><p>We look forward to welcoming you.</p>",
    variablesJson: ["guestName", "bookingRef", "checkIn", "checkOut", "currency", "totalAmount", "status"],
  },
  {
    key: "booking-cancellation",
    subject: "Booking cancelled — {{bookingRef}}",
    bodyText: [
      "Hello {{guestName}},",
      "",
      "Your booking {{bookingRef}} has been cancelled.",
      "Reason: {{cancellationReason}}",
      "",
      "If you did not request this, please contact the hotel.",
    ].join("\n"),
    bodyHtml: "<p>Hello {{guestName}},</p><p>Your booking <strong>{{bookingRef}}</strong> has been cancelled.</p><p>Reason: {{cancellationReason}}</p><p>If you did not request this, please contact the hotel.</p>",
    variablesJson: ["guestName", "bookingRef", "cancellationReason"],
  },
  {
    key: "admin-booking-notification",
    subject: "New booking {{bookingRef}}",
    bodyText: [
      "A new booking was created.",
      "Ref: {{bookingRef}}",
      "Guest: {{guestName}} ({{guestEmail}} / {{guestPhone}})",
      "Stay: {{checkIn}} to {{checkOut}}",
      "Total: {{currency}} {{totalAmount}}",
      "Status: {{status}}",
    ].join("\n"),
    bodyHtml: "<p>A new booking was created.</p><ul><li>Ref: {{bookingRef}}</li><li>Guest: {{guestName}}</li><li>Email: {{guestEmail}}</li><li>Phone: {{guestPhone}}</li><li>Stay: {{checkIn}} to {{checkOut}}</li><li>Total: {{currency}} {{totalAmount}}</li><li>Status: {{status}}</li></ul>",
    variablesJson: ["bookingRef", "guestName", "guestEmail", "guestPhone", "checkIn", "checkOut", "currency", "totalAmount", "status"],
  },
  {
    key: "admin-inquiry-notification",
    subject: "New inquiry: {{subject}}",
    bodyText: [
      "A new website inquiry was submitted.",
      "Name: {{name}}",
      "Email: {{email}}",
      "Phone: {{phone}}",
      "Type: {{type}}",
      "Subject: {{subject}}",
      "",
      "{{message}}",
    ].join("\n"),
    bodyHtml: "<p>A new website inquiry was submitted.</p><p><strong>Name:</strong> {{name}}</p><p><strong>Email:</strong> {{email}}</p><p><strong>Phone:</strong> {{phone}}</p><p><strong>Type:</strong> {{type}}</p><p><strong>Subject:</strong> {{subject}}</p><p>{{message}}</p>",
    variablesJson: ["name", "email", "phone", "type", "subject", "message"],
  },
  {
    key: "password-reset",
    subject: "Reset your HotelMS admin password",
    bodyText: "Use this link to reset your password: {{resetUrl}}",
    bodyHtml: "<p>Use this link to reset your password:</p><p><a href=\"{{resetUrl}}\">{{resetUrl}}</a></p>",
    variablesJson: ["resetUrl"],
  },
];

async function ensureDefaultTemplates(client = prisma) {
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await client.emailTemplate.findFirst({
      where: { key: template.key, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      await client.emailTemplate.create({ data: { ...template, isActive: true } });
    }
  }
}

const templateSelect = {
  id: true,
  key: true,
  subject: true,
  bodyHtml: true,
  bodyText: true,
  variablesJson: true,
  isActive: true,
  updatedAt: true,
  createdAt: true,
};

async function listEmailTemplates() {
  await ensureDefaultTemplates();
  return prisma.emailTemplate.findMany({
    where: { deletedAt: null },
    orderBy: { key: "asc" },
    select: templateSelect,
  });
}

async function getEmailTemplate(id) {
  const item = await prisma.emailTemplate.findFirst({
    where: { id, deletedAt: null },
    select: templateSelect,
  });
  if (!item) fail(404, "Email template not found.", "NOT_FOUND");
  return item;
}

async function getActiveTemplateByKey(key) {
  return prisma.emailTemplate.findFirst({
    where: { key, deletedAt: null, isActive: true },
    select: templateSelect,
  });
}

async function updateEmailTemplate(id, data, req) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.emailTemplate.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, key: true },
    });
    if (!current) fail(404, "Email template not found.", "NOT_FOUND");

    const updated = await tx.emailTemplate.update({
      where: { id },
      data: {
        ...(Object.hasOwn(data, "subject") ? { subject: data.subject } : {}),
        ...(Object.hasOwn(data, "bodyHtml") ? { bodyHtml: data.bodyHtml } : {}),
        ...(Object.hasOwn(data, "bodyText") ? { bodyText: data.bodyText } : {}),
        ...(Object.hasOwn(data, "isActive") ? { isActive: data.isActive } : {}),
      },
      select: templateSelect,
    });

    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module: "notifications",
      action: "template-update",
      entityType: "EmailTemplate",
      entityId: id,
      metadata: { key: current.key, changedFields: Object.keys(data) },
      request: req,
    });

    return updated;
  });
}

async function testEmail(data, req) {
  const emailService = require("./email.service");
  const result = await emailService.sendTestEmail({ to: data?.to });
  await createActivityLog({
    userId: req.admin.id,
    module: "notifications",
    action: "test-email",
    entityType: "EmailService",
    entityId: req.admin.id,
    metadata: { to: data?.to, delivered: result?.delivered, channel: result?.channel || null },
    request: req,
  });
  return result;
}

async function resendEmailLog(id, req) {
  const log = await prisma.emailLog.findUnique({
    where: { id },
  });
  if (!log) fail(404, "Email log not found.", "NOT_FOUND");

  const emailService = require("./email.service");
  const result = await emailService.retryFailedEmail(log);

  await createActivityLog({
    userId: req.admin.id,
    module: "notifications",
    action: "resend-email",
    entityType: "EmailLog",
    entityId: id,
    metadata: { recipient: log.recipient, subject: log.subject, delivered: result?.delivered },
    request: req,
  });

  return result;
}

module.exports = {
  getSettings,
  getRuntimeEmailConfig,
  updateSettings,
  listEmailLogs,
  listEmailTemplates,
  getEmailTemplate,
  getActiveTemplateByKey,
  updateEmailTemplate,
  ensureDefaultTemplates,
  DEFAULT_TEMPLATES,
  testEmail,
  resendEmailLog,
};
