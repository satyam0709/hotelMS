require("dotenv").config();
const path = require("node:path");

const isProduction = process.env.NODE_ENV === "production";

function parseBoolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  throw new Error(`${name} must be either true or false.`);
}

function parseDuration(value, name) {
  const match = /^(\d+)(ms|s|m|h|d|w)?$/i.exec(value);
  if (!match || Number(match[1]) < 1) {
    throw new Error(`${name} must be a positive duration such as 15m or 1d.`);
  }

  const units = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return Number(match[1]) * units[(match[2] || "ms").toLowerCase()];
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";
const jwtExpiresInMs = parseDuration(jwtExpiresIn, "JWT_EXPIRES_IN");
const rawOrigins = process.env.FRONTEND_ORIGIN || (isProduction ? "" : "http://localhost:3000");
if (!rawOrigins) {
  throw new Error("FRONTEND_ORIGIN must be configured in production.");
}

const frontendOrigins = rawOrigins.split(",").map((value) => {
  const origin = value.trim();
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error("FRONTEND_ORIGIN must contain valid exact origins.");
  }
  if (!origin || origin === "*" || !["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
    throw new Error("FRONTEND_ORIGIN must contain valid exact origins, not paths or wildcards.");
  }
  return origin;
});

const cookieSecure = parseBoolean("COOKIE_SECURE", isProduction);
if (isProduction && !cookieSecure) {
  throw new Error("COOKIE_SECURE must be true in production.");
}
const cookieSameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
if (!["lax", "strict", "none"].includes(cookieSameSite)) {
  throw new Error("COOKIE_SAME_SITE must be lax, strict, or none.");
}
if (cookieSameSite === "none" && !cookieSecure) {
  throw new Error("COOKIE_SECURE must be true when COOKIE_SAME_SITE is none.");
}

const passwordResetTokenTtlMs = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30) * 60000;
if (!Number.isSafeInteger(passwordResetTokenTtlMs) || passwordResetTokenTtlMs < 60000) {
  throw new Error("PASSWORD_RESET_TOKEN_TTL_MINUTES must be a positive integer.");
}

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 0);
const smtpUser = process.env.SMTP_USER || "";
const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "";
const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || "";
const smtpSecure = parseBoolean("SMTP_SECURE", smtpPort === 465);
const hasSmtpSettings = Boolean(smtpHost || process.env.SMTP_PORT || smtpUser || smtpPassword || emailFrom);
if (hasSmtpSettings && (!smtpHost || !Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535 || !emailFrom)) {
  throw new Error("SMTP_HOST, a valid SMTP_PORT, and EMAIL_FROM are required when SMTP is configured.");
}
if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
  throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
}

const passwordResetUrl = process.env.PASSWORD_RESET_URL || `${frontendOrigins[0]}/admin/reset-password`;
let parsedPasswordResetUrl;
try {
  parsedPasswordResetUrl = new URL(passwordResetUrl);
} catch {
  throw new Error("PASSWORD_RESET_URL must be a valid absolute URL.");
}
if (!/^https?:$/.test(parsedPasswordResetUrl.protocol) || (isProduction && parsedPasswordResetUrl.protocol !== "https:")) {
  throw new Error("PASSWORD_RESET_URL must use HTTPS in production and HTTP or HTTPS otherwise.");
}
if (isProduction && (!smtpHost || !smtpPort || !emailFrom)) {
  throw new Error("SMTP_HOST, SMTP_PORT, and EMAIL_FROM must be configured in production.");
}

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
if (Boolean(razorpayKeyId) !== Boolean(razorpayKeySecret)) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured together.");
}
if (isProduction && process.env.RAZORPAY_REQUIRED === "true" && (!razorpayKeyId || !razorpayKeySecret)) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured when Razorpay is required.");
}

const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "";
const bookingHoldTtlMinutes = Number(process.env.BOOKING_HOLD_TTL_MINUTES || 30);
if (!Number.isSafeInteger(bookingHoldTtlMinutes) || bookingHoldTtlMinutes < 1) {
  throw new Error("BOOKING_HOLD_TTL_MINUTES must be a positive integer.");
}

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";
const cloudinaryConfigured = Boolean(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret);
const cloudinaryPartial = Boolean(cloudinaryCloudName || cloudinaryApiKey || cloudinaryApiSecret);
if (cloudinaryPartial && !cloudinaryConfigured) {
  throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured together.");
}
if (isProduction && process.env.CLOUDINARY_REQUIRED === "true" && !cloudinaryConfigured) {
  throw new Error("Cloudinary credentials are required when CLOUDINARY_REQUIRED=true.");
}
const cloudinaryFolder = (process.env.CLOUDINARY_FOLDER || "hotelms").trim() || "hotelms";
const turnstileSecretKey = (process.env.TURNSTILE_SECRET_KEY || "").trim();

module.exports = {
  adminNotificationEmail,
  bookingHoldTtlMinutes,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryCloudName,
  cloudinaryConfigured,
  cloudinaryFolder,
  cookieName: process.env.COOKIE_NAME || "hotel_admin_access",
  cookieSameSite,
  cookieSecure,
  devEmailOutboxPath: path.resolve(process.cwd(), process.env.DEV_EMAIL_OUTBOX_PATH || ".local-email-outbox.jsonl"),
  emailFrom,
  frontendOrigins,
  isProduction,
  jwtExpiresIn,
  jwtExpiresInMs,
  jwtSecret,
  passwordResetTokenTtlMs,
  passwordResetUrl,
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
  smtpHost,
  smtpPassword,
  smtpPort,
  smtpSecure,
  smtpUser,
  turnstileSecretKey,
};