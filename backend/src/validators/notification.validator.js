const { z } = require("zod");

const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const optionalEmail = z.string().trim().email().max(191).nullable().optional();

const listLogsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
}).strict();

const updateSettingsBody = z.object({
  smtpHost: optionalText(191),
  smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpUser: optionalText(191),
  smtpPassword: z.string().min(1).max(500).nullable().optional(),
  clearSmtpPassword: z.boolean().optional(),
  fromEmail: optionalEmail,
  adminEmail: optionalEmail,
  bookingEnabled: z.boolean().optional(),
  inquiryEnabled: z.boolean().optional(),
  cancellationEnabled: z.boolean().optional(),
  checkInReminderEnabled: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required.",
}).refine((value) => {
  if (value.smtpUser && value.clearSmtpPassword) return true;
  if (value.smtpUser && value.smtpPassword === null) return false;
  return true;
}, {
  message: "SMTP password is required when setting SMTP user, or clear the password explicitly.",
  path: ["smtpPassword"],
});

const id = z.string().trim().min(1).max(191);

const idParams = z.object({ id }).strict();

const updateTemplateBody = z.object({
  subject: z.string().trim().min(1).max(191).optional(),
  bodyHtml: z.string().trim().max(100000).nullable().optional(),
  bodyText: z.string().trim().max(100000).nullable().optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required.",
});

module.exports = { listLogsQuery, updateSettingsBody, idParams, updateTemplateBody };
