const { z } = require("zod");

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const overviewQuery = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from must be on or before to.",
  path: ["from"],
});

module.exports = { overviewQuery };
