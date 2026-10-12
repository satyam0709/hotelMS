const express = require("express");
const controller = require("../controllers/adminUsers.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/adminUsers.validator");

const router = express.Router();
const allow = (permission) => requirePermission(permission);
const idParams = validateParams(validator.idParams);
const listQuery = validateQuery(validator.listQuery);

router.use(requireAdminAuth);

router.get("/permissions", allow("roles.read"), controller.listPermissions);

router.get("/roles", allow("roles.read"), listQuery, controller.listRoles);
router.post("/roles", allow("roles.create"), validateBody(validator.createRole), controller.createRole);
router.patch("/roles/:id", allow("roles.update"), idParams, validateBody(validator.updateRole), controller.updateRole);
router.delete("/roles/:id", allow("roles.delete"), idParams, controller.deleteRole);

router.get("/users", allow("users.read"), listQuery, controller.listUsers);
router.post("/users", allow("users.create"), validateBody(validator.createUser), controller.createUser);
router.patch("/users/:id", allow("users.update"), idParams, validateBody(validator.updateUser), controller.updateUser);
router.delete("/users/:id", allow("users.delete"), idParams, controller.deleteUser);

module.exports = router;
