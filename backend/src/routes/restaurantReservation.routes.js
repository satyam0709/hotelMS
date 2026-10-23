const express = require("express");
const controller = require("../controllers/restaurantReservation.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { publicWriteLimiter } = require("../middleware/rateLimit.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/restaurantReservation.validator");

const publicRouter = express.Router();
const adminRouter = express.Router();

publicRouter.post(
  "/restaurant/reservations",
  publicWriteLimiter,
  validateBody(validator.createBody),
  controller.createPublicReservation
);

adminRouter.get(
  "/restaurant/reservations",
  requireAdminAuth,
  requirePermission("restaurant.read"),
  validateQuery(validator.listQuery),
  controller.listAdminReservations
);
adminRouter.get(
  "/restaurant/reservations/:id",
  requireAdminAuth,
  requirePermission("restaurant.read"),
  validateParams(validator.idParams),
  controller.getAdminReservation
);
adminRouter.get(
  "/restaurant/reservations/:id/pdf",
  requireAdminAuth,
  requirePermission("restaurant.read"),
  validateParams(validator.idParams),
  controller.getAdminReservationPdf
);
adminRouter.patch(
  "/restaurant/reservations/:id/status",
  requireAdminAuth,
  requirePermission("restaurant.update"),
  validateParams(validator.idParams),
  validateBody(validator.statusBody),
  controller.updateAdminReservationStatus
);

module.exports = { adminRouter, publicRouter };
