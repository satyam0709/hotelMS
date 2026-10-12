const express = require("express");
const controller = require("../controllers/pricing.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const validator = require("../validators/pricing.validator");

const router = express.Router();

router.use(requireAdminAuth);

router.get("/coupons", requirePermission("coupons.read"), validateQuery(validator.listQuery), controller.listCoupons);
router.post("/coupons", requirePermission("coupons.create"), validateBody(validator.coupon.create), controller.createCoupon);
router.get("/coupons/:id", requirePermission("coupons.read"), validateParams(validator.idParams), controller.getCoupon);
router.patch("/coupons/:id", requirePermission("coupons.update"), validateParams(validator.idParams), validateBody(validator.coupon.update), controller.updateCoupon);
router.delete("/coupons/:id", requirePermission("coupons.delete"), validateParams(validator.idParams), controller.deleteCoupon);

router.get("/tax-rates", requirePermission("tax_rates.read"), validateQuery(validator.listQuery), controller.listTaxRates);
router.post("/tax-rates", requirePermission("tax_rates.create"), validateBody(validator.taxRate.create), controller.createTaxRate);
router.get("/tax-rates/:id", requirePermission("tax_rates.read"), validateParams(validator.idParams), controller.getTaxRate);
router.patch("/tax-rates/:id", requirePermission("tax_rates.update"), validateParams(validator.idParams), validateBody(validator.taxRate.update), controller.updateTaxRate);
router.delete("/tax-rates/:id", requirePermission("tax_rates.delete"), validateParams(validator.idParams), controller.deleteTaxRate);

module.exports = router;