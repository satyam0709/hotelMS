const { rateLimit } = require("express-rate-limit");

const rateLimitMessage = {
  success: false,
  message: "Too many requests. Please try again later.",
  errorCode: "RATE_LIMITED",
};

function createLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitMessage,
  });
}

/** Admin auth endpoints (login, forgot password, etc.). */
const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 60 });

/** Booking lookup, cancel, payment order/verify, invoice. */
const strictPublicLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 20 });

/** Booking create, inquiries, newsletter. */
const publicWriteLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 30 });

/** Availability search and similar public reads that can be hammered. */
const publicReadLimiter = createLimiter({ windowMs: 15 * 60 * 1000, limit: 120 });

module.exports = {
  authLimiter,
  strictPublicLimiter,
  publicWriteLimiter,
  publicReadLimiter,
};
