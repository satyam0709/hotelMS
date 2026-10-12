const adminAuthController = require("../controllers/adminAuth.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");
const { validateBody } = require("../middleware/validate.middleware");
const adminAuthValidator = require("../validators/adminAuth.validator");

const router = require("express").Router();

router.use(authLimiter);

router.post("/login", validateBody(adminAuthValidator.login), adminAuthController.login);
router.post("/logout", adminAuthController.logout);
router.get("/me", requireAdminAuth, adminAuthController.me);
router.patch(
  "/me",
  requireAdminAuth,
  validateBody(adminAuthValidator.updateProfile),
  adminAuthController.updateProfile
);
router.post("/forgot-password", validateBody(adminAuthValidator.forgotPassword), adminAuthController.forgotPassword);
router.post("/reset-password", validateBody(adminAuthValidator.resetPassword), adminAuthController.resetPassword);
router.patch(
  "/password",
  requireAdminAuth,
  validateBody(adminAuthValidator.changePassword),
  adminAuthController.changePassword
);

module.exports = router;