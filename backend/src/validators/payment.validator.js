const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const bookingRef = z.string().trim().min(1).max(80);

const guestLookup = z.object({
  email: z.string().trim().email().max(191),
  phone: z.string().trim().min(5).max(40),
}).strict();

const createOrder = z.object({
  bookingRef,
  email: z.string().trim().email().max(191),
  phone: z.string().trim().min(5).max(40),
}).strict();

const verifyPayment = z.object({
  bookingRef,
  razorpayOrderId: z.string().trim().min(1).max(191),
  razorpayPaymentId: z.string().trim().min(1).max(191),
  razorpaySignature: z.string().trim().min(1).max(512),
  email: z.string().trim().email().max(191),
  phone: z.string().trim().min(5).max(40),
}).strict();

const refundBody = z.object({
  amount: z.number().finite().min(0.01).max(99999999.99).optional(),
  reason: z.string().trim().max(10000).nullable().optional(),
}).strict();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  bookingId: id.optional(),
  search: z.string().trim().max(120).optional(),
  status: z.enum(["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
}).strict();

const invoiceLookupQuery = guestLookup;

module.exports = {
  createOrder,
  idParams: z.object({ id }).strict(),
  invoiceLookupQuery,
  listQuery,
  refundBody,
  verifyPayment,
};
