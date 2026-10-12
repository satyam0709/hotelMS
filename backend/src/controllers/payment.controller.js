const service = require("../services/payment.service");
const { sendSuccess } = require("../utils/response");

const params = (req) => req.validatedParams || req.params;
const query = (req) => req.validatedQuery || req.query;

async function createPaymentOrder(req, res) {
  return sendSuccess(res, await service.createPaymentOrder(req.body, req), "Payment order created.");
}

async function verifyPayment(req, res) {
  return sendSuccess(res, await service.verifyPayment(req.body, req), "Payment verified.");
}

async function handleWebhook(req, res) {
  const signature = req.get("x-razorpay-signature");
  if (!Buffer.isBuffer(req.rawBody)) {
    const AppError = require("../utils/appError");
    throw new AppError(400, "Invalid webhook payload.", "WEBHOOK_PAYLOAD_INVALID");
  }
  return sendSuccess(res, await service.handleRazorpayWebhook(req.rawBody, signature, req));
}

async function listAdminPayments(req, res) {
  return sendSuccess(res, await service.listAdminPayments(query(req)));
}

async function getAdminPayment(req, res) {
  return sendSuccess(res, await service.getAdminPayment(params(req).id));
}

async function createRefund(req, res) {
  return sendSuccess(res, await service.createRefund(params(req).id, req.body, req), "Refund processed.");
}

async function getPublicInvoice(req, res) {
  return sendSuccess(res, await service.getPublicInvoice(params(req).bookingRef, query(req)));
}

async function getAdminInvoice(req, res) {
  return sendSuccess(res, await service.getAdminInvoice(params(req).id));
}

module.exports = {
  createPaymentOrder,
  createRefund,
  getAdminInvoice,
  getAdminPayment,
  getPublicInvoice,
  handleWebhook,
  listAdminPayments,
  verifyPayment,
};
