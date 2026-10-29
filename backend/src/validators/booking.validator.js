const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Date must be a valid YYYY-MM-DD value.");

function todayUtcDateString() {
  return new Date().toISOString().slice(0, 10);
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  return Math.round((end - start) / 86400000);
}

const guestInput = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(191),
  phone: z.string().trim().min(5).max(40),
  notes: z.string().trim().max(10000).nullable().optional(),
}).strict();

const bookingRoomInput = z.object({
  roomId: id,
  quantity: z.number().int().min(1).max(30).default(1),
  adults: z.number().int().min(1).max(30),
  children: z.number().int().min(0).max(30).default(0),
  extraBeds: z.number().int().min(0).max(10).default(0),
}).strict();

const paymentMethod = z.enum(["PAY_AT_HOTEL", "ONLINE"]);

const bookingCreateObject = z.object({
  checkIn: dateOnly,
  checkOut: dateOnly,
  guest: guestInput,
  rooms: z.array(bookingRoomInput).min(1).max(10),
  specialRequests: z.string().trim().max(10000).nullable().optional(),
  paymentMethod: paymentMethod.default("PAY_AT_HOTEL"),
  couponCode: z.string().trim().min(1).max(80).optional(),
}).strict();

function withStayRules(schema, { requireFutureCheckIn = false } = {}) {
  let result = schema
    .refine((value) => value.checkIn < value.checkOut, {
      message: "checkOut must be after checkIn.",
      path: ["checkOut"],
    })
    .refine((value) => nightsBetween(value.checkIn, value.checkOut) <= 30, {
      message: "Stay length cannot exceed 30 nights.",
      path: ["checkOut"],
    })
    .refine((value) => {
      const keys = value.rooms.map((room) => room.roomId);
      return new Set(keys).size === keys.length;
    }, {
      message: "Each room type may only appear once per booking.",
      path: ["rooms"],
    });

  if (requireFutureCheckIn) {
    result = result.refine((value) => value.checkIn >= todayUtcDateString(), {
      message: "checkIn must be today or a future date.",
      path: ["checkIn"],
    });
  }
  return result;
}

const quoteBookingObject = z.object({
  checkIn: dateOnly,
  checkOut: dateOnly,
  rooms: z.array(bookingRoomInput).min(1).max(10),
  couponCode: z.string().trim().min(1).max(80).optional(),
}).strict();

const quoteBooking = withStayRules(quoteBookingObject, { requireFutureCheckIn: false });
const publicCreateBooking = withStayRules(bookingCreateObject, { requireFutureCheckIn: true });
const adminCreateBooking = withStayRules(
  bookingCreateObject.extend({
    confirmImmediately: z.boolean().optional(),
  })
);

const bookingStatus = z.enum([
  "PENDING",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
  "REFUNDED",
  "EXPIRED",
]);

const updateStatus = z.object({
  status: bookingStatus,
  note: z.string().trim().max(10000).nullable().optional(),
}).strict();

const cancelBooking = z.object({
  reason: z.string().trim().max(10000).nullable().optional(),
}).strict();

const guestCancelRequest = z.object({
  email: z.string().trim().email().max(191),
  phone: z.string().trim().min(5).max(40),
  reason: z.string().trim().max(10000).nullable().optional(),
}).strict();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  status: bookingStatus.optional(),
  paymentStatus: z.enum(["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).optional(),
  checkInFrom: dateOnly.optional(),
  checkInTo: dateOnly.optional(),
  checkOutFrom: dateOnly.optional(),
  checkOutTo: dateOnly.optional(),
  guestId: id.optional(),
}).strict()
  .refine((value) => !value.checkInFrom || !value.checkInTo || value.checkInFrom <= value.checkInTo, {
    message: "checkInFrom must be on or before checkInTo.",
    path: ["checkInFrom"],
  })
  .refine((value) => !value.checkOutFrom || !value.checkOutTo || value.checkOutFrom <= value.checkOutTo, {
    message: "checkOutFrom must be on or before checkOutTo.",
    path: ["checkOutFrom"],
  });

const bookingRefParams = z.object({
  bookingRef: z.string().trim().min(1).max(80),
}).strict();

const publicLookupQuery = z.object({
  email: z.string().trim().email().max(191),
  phone: z.string().trim().min(5).max(40),
}).strict();

module.exports = {
  adminCreateBooking,
  bookingRefParams,
  cancelBooking,
  guestCancelRequest,
  idParams: z.object({ id }).strict(),
  listQuery,
  publicCreateBooking,
  publicLookupQuery,
  quoteBooking,
  updateStatus,
};
