const crypto = require("node:crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");

const UNSET = Symbol("razorpay-unset");
let client = UNSET;

function createRazorpaySdk(config = env) {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) return null;
  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
}

function getRazorpayClient() {
  if (client !== UNSET) return client;
  client = createRazorpaySdk(env);
  return client;
}

function setRazorpayClient(nextClient) {
  client = nextClient;
}

function resetRazorpayClient() {
  client = UNSET;
}

function requireRazorpayClient() {
  const active = getRazorpayClient();
  if (!active) {
    const error = new Error("Razorpay is not configured.");
    error.code = "RAZORPAY_NOT_CONFIGURED";
    throw error;
  }
  return active;
}

function verifyPaymentSignature({ orderId, paymentId, signature, secret = env.razorpayKeySecret }) {
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(String(signature));
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function verifyWebhookSignature(rawBody, signature, secret = env.razorpayWebhookSecret) {
  if (!secret || !rawBody || !signature) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody));
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(String(signature));
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function toPaise(amount) {
  return Math.round(Number(amount) * 100);
}

module.exports = {
  createRazorpaySdk,
  getRazorpayClient,
  requireRazorpayClient,
  resetRazorpayClient,
  setRazorpayClient,
  toPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
