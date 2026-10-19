const { z } = require("zod");

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const rangeRefine = (value) => !value.from || !value.to || value.from <= value.to;

const overviewQuery = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine(rangeRefine, {
  message: "from must be on or before to.",
  path: ["from"],
});

const exportQuery = z.object({
  type: z.enum(["bookings", "bookings-stay", "payments", "inquiries", "summary"]).default("bookings"),
  format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(5000),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  checkInFrom: dateOnly.optional(),
  checkInTo: dateOnly.optional(),
  checkOutFrom: dateOnly.optional(),
  checkOutTo: dateOnly.optional(),
}).strict().refine(rangeRefine, {
  message: "from must be on or before to.",
  path: ["from"],
});

module.exports = { overviewQuery, exportQuery };
