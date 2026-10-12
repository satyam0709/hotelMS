const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const status = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  status: status.optional(),
}).strict();

const createUser = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(191),
  username: z.string().trim().min(3).max(120).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(8).max(128),
  status: status.default("ACTIVE"),
  roleIds: z.array(id).min(1).max(20),
}).strict();

const updateUser = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().email().max(191).optional(),
  username: z.string().trim().min(3).max(120).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  password: z.string().min(8).max(128).optional(),
  status: status.optional(),
  roleIds: z.array(id).min(1).max(20).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

const createRole = z.object({
  name: z.string().trim().min(1).max(120),
  slug,
  description: z.string().trim().max(10000).nullable().optional(),
  permissionIds: z.array(id).max(500).default([]),
}).strict();

const updateRole = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: slug.optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  permissionIds: z.array(id).max(500).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required.");

module.exports = {
  createRole,
  createUser,
  idParams: z.object({ id }).strict(),
  listQuery,
  updateRole,
  updateUser,
};
