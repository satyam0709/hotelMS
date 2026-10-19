const express = require("express");
const controller = require("../controllers/payment.controller");
const { requireAdminAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const { strictPublicLimiter } = require("../middleware/rateLimit.middleware");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate.middleware");
const paymentValidator = require("../validators/payment.validator");
const bookingValidator = require("../validators/booking.validator");

const publicRouter = express.Router();
const adminRouter = express.Router();
const allow = (permission) => requirePermission(permission);

publicRouter.post(
  "/payments/razorpay/order",
  strictPublicLimiter,
  validateBody(paymentValidator.createOrder),
  controller.createPaymentOrder
);
publicRouter.post(
  "/payments/razorpay/verify",
  strictPublicLimiter,
  validateBody(paymentValidator.verifyPayment),
  controller.verifyPayment
);
publicRouter.post(
  "/payments/razorpay/webhook",
  controller.handleWebhook
);
publicRouter.get(
  "/bookings/:bookingRef/invoice",
  strictPublicLimiter,
  validateParams(bookingValidator.bookingRefParams),
  validateQuery(paymentValidator.invoiceLookupQuery),
  controller.getPublicInvoice
);

adminRouter.use(requireAdminAuth);

adminRouter.get(
  "/payments",
  allow("payments.read"),
  validateQuery(paymentValidator.listQuery),
  controller.listAdminPayments
);
adminRouter.get(
  "/payments/:id",
  allow("payments.read"),
  validateParams(paymentValidator.idParams),
  controller.getAdminPayment
);
adminRouter.post(
  "/payments/:id/refund",
  allow("payments.refund"),
  validateParams(paymentValidator.idParams),
  validateBody(paymentValidator.refundBody),
  controller.createRefund
);
adminRouter.get(
  "/bookings/:id/invoice",
  allow("bookings.read"),
  validateParams(bookingValidator.idParams),
  controller.getAdminInvoice
);
adminRouter.get(
  "/bookings/:id/invoice/pdf",
  allow("bookings.read"),
  validateParams(bookingValidator.idParams),
  controller.getAdminInvoicePdf
);

module.exports = { adminRouter, publicRouter };
