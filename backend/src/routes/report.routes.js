const express = require("express");
const controller = require("../controllers/report.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/report.validator");

const router = express.Router();

router.use(requireAdminAuth);
router.get("/reports/overview", requirePermission("reports.read"), validateQuery(validator.overviewQuery), controller.overview);
router.get("/reports/export", requirePermission("reports.export"), validateQuery(validator.exportQuery), controller.exportCsv);

module.exports = router;
