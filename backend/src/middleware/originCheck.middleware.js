const env = require("../config/env");
const AppError = require("../utils/appError");

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originFromReferer(referer) {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * For cookie-authenticated admin mutations, require Origin/Referer in FRONTEND_ORIGIN.
 * Safe no-op for GET/HEAD and for requests without an Origin when not mutating.
 */
function requireTrustedOrigin(req, res, next) {
  if (!MUTATING.has(req.method)) return next();

  const origin = req.get("origin") || originFromReferer(req.get("referer"));
  if (!origin) {
    // Allow server-to-server / Postman without Origin in non-production.
    if (!env.isProduction) return next();
    return next(new AppError(403, "Trusted origin required.", "ORIGIN_FORBIDDEN"));
  }

  if (!env.frontendOrigins.includes(origin)) {
    return next(new AppError(403, "Trusted origin required.", "ORIGIN_FORBIDDEN"));
  }

  return next();
}

module.exports = { requireTrustedOrigin };
