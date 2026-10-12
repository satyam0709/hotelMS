const express = require("express");
const controller = require("../controllers/booking.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { publicWriteLimiter, strictPublicLimiter } = require("../middleware/rateLimit.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/booking.validator");

const publicRouter = express.Router();
const adminRouter = express.Router();
const allow = (permission) => requirePermission(permission);

publicRouter.post(
  "/bookings",
  publicWriteLimiter,
  validateBody(validator.publicCreateBooking),
  controller.createPublicBooking
);
publicRouter.get(
  "/bookings/:bookingRef",
  strictPublicLimiter,
  validateParams(validator.bookingRefParams),
  validateQuery(validator.publicLookupQuery),
  controller.getPublicBooking
);
publicRouter.post(
  "/bookings/:bookingRef/cancel-request",
  strictPublicLimiter,
  validateParams(validator.bookingRefParams),
  validateBody(validator.guestCancelRequest),
  controller.requestGuestCancellation
);

adminRouter.use(requireAdminAuth);

adminRouter.get(
  "/bookings",
  allow("bookings.read"),
  validateQuery(validator.listQuery),
  controller.listAdminBookings
);
adminRouter.post(
  "/bookings",
  allow("bookings.create"),
  validateBody(validator.adminCreateBooking),
  controller.createAdminBooking
);
adminRouter.get(
  "/bookings/:id",
  allow("bookings.read"),
  validateParams(validator.idParams),
  controller.getAdminBooking
);
adminRouter.patch(
  "/bookings/:id/status",
  allow("bookings.update"),
  validateParams(validator.idParams),
  validateBody(validator.updateStatus),
  controller.updateBookingStatus
);
adminRouter.post(
  "/bookings/:id/cancel",
  allow("bookings.cancel"),
  validateParams(validator.idParams),
  validateBody(validator.cancelBooking),
  controller.cancelAdminBooking
);

module.exports = { adminRouter, publicRouter };
