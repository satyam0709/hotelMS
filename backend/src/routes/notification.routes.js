const express = require("express");
const controller = require("../controllers/notification.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/notification.validator");

const router = express.Router();

router.use(requireAdminAuth);
router.get("/notifications/settings", requirePermission("notifications.read"), controller.getSettings);
router.patch(
  "/notifications/settings",
  requirePermission("notifications.update"),
  validateBody(validator.updateSettingsBody),
  controller.updateSettings,
);
router.get(
  "/notifications/logs",
  requirePermission("notifications.read"),
  validateQuery(validator.listLogsQuery),
  controller.listEmailLogs,
);
router.get("/notifications/templates", requirePermission("notifications.read"), controller.listEmailTemplates);
router.get(
  "/notifications/templates/:id",
  requirePermission("notifications.read"),
  validateParams(validator.idParams),
  controller.getEmailTemplate,
);
router.patch(
  "/notifications/templates/:id",
  requirePermission("notifications.update"),
  validateParams(validator.idParams),
  validateBody(validator.updateTemplateBody),
  controller.updateEmailTemplate,
);

module.exports = router;