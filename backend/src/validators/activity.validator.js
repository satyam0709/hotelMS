const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  module: z.string().trim().max(80).optional(),
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(120).optional(),
  userId: id.optional(),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from must be on or before to.",
  path: ["from"],
});

module.exports = { listQuery };
