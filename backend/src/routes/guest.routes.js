const express = require("express");
const controller = require("../controllers/guest.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/guest.validator");

const router = express.Router();

router.use(requireAdminAuth);
router.get("/guests", requirePermission("guests.read"), validateQuery(validator.listQuery), controller.listGuests);
router.get("/guests/:id", requirePermission("guests.read"), validateParams(validator.idParams), controller.getGuest);
router.patch("/guests/:id", requirePermission("guests.update"), validateParams(validator.idParams), validateBody(validator.updateBody), controller.updateGuest);
router.delete("/guests/:id", requirePermission("guests.delete"), validateParams(validator.idParams), controller.deleteGuest);

module.exports = router;
