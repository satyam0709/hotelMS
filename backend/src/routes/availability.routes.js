const express = require("express");
const controller = require("../controllers/availability.controller");
const { publicReadLimiter } = require("../middleware/rateLimit.middleware");
const { validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/availability.validator");

const publicRouter = express.Router();

publicRouter.get(
  "/availability",
  publicReadLimiter,
  validateQuery(validator.availabilitySearchQuery),
  controller.searchAvailability
);

module.exports = { publicRouter };
