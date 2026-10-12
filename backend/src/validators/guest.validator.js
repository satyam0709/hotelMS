const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const optionalText = (max) => z.string().trim().max(max).nullable().optional();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  guestType: z.string().trim().max(80).optional(),
}).strict();

const idParams = z.object({ id }).strict();

const updateBody = z.object({
  fullName: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().email().max(191).nullable().optional(),
  phone: z.string().trim().min(5).max(40).nullable().optional(),
  guestType: optionalText(80),
  notes: optionalText(10000),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required.",
});

module.exports = { listQuery, idParams, updateBody };
