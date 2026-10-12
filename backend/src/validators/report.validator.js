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
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine(rangeRefine, {
  message: "from must be on or before to.",
  path: ["from"],
});

module.exports = { overviewQuery, exportQuery };
