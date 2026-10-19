const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "reservationDate must be a valid calendar date.");
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const rangeRefine = (value) => !value.from || !value.to || value.from <= value.to;

const createBody = z.object({
  guestName: z.string().trim().min(1).max(160),
  guestEmail: z.string().trim().email().max(191).transform((value) => value.toLowerCase()).optional(),
  guestPhone: z.string().trim().min(3).max(40).optional(),
  guestCount: z.number().int().min(1).max(30),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  reservationDate: dateOnly,
  reservationTime: time,
  dietaryRequests: z.string().trim().max(2000).optional(),
  captchaToken: z.string().trim().min(1).max(2048).optional(),
}).strict().refine((value) => value.guestEmail || value.guestPhone, {
  message: "An email address or phone number is required.",
  path: ["guestEmail"],
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.enum(["REQUESTED", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine(rangeRefine, {
  message: "from must be on or before to.",
  path: ["from"],
});

const statusBody = z.object({
  status: z.enum(["CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  adminRemarks: z.string().trim().max(5000).nullable().optional(),
}).strict();

module.exports = {
  createBody,
  idParams: z.object({ id }).strict(),
  listQuery,
  statusBody,
};
