const express = require("express");
const controller = require("../controllers/dashboard.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requireAnyPermission } = require("../middleware/permission.middleware");
const { validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/dashboard.validator");

const router = express.Router();

router.use(requireAdminAuth);
router.get(
  "/dashboard/overview",
  requireAnyPermission(["dashboard.read", "bookings.read"]),
  validateQuery(validator.overviewQuery),
  controller.overview,
);

module.exports = router;
