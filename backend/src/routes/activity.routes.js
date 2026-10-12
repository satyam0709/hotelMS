const express = require("express");
const controller = require("../controllers/activity.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/activity.validator");

const router = express.Router();

router.use(requireAdminAuth);
router.get("/activity", requirePermission("activity.read"), validateQuery(validator.listQuery), controller.listActivity);

module.exports = router;
