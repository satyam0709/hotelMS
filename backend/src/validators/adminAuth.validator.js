const { z } = require("zod");

const login = z.object({
  email: z.string().trim().email().max(191).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

const forgotPassword = z.object({
  email: z.string().trim().email().max(191).transform((value) => value.toLowerCase()),
}).strict();

const resetPassword = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/i),
  password: z.string().min(12).max(128),
}).strict();

const changePassword = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
}).strict().refine((value) => value.currentPassword !== value.newPassword, {
  message: "New password must be different from the current password.",
  path: ["newPassword"],
});

const updateProfile = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  profileImageMediaId: z.string().trim().min(1).max(191).nullable().optional(),
}).strict().refine((value) => value.name !== undefined || value.profileImageMediaId !== undefined, {
  message: "Provide a name and/or profileImageMediaId to update.",
});

module.exports = { changePassword, forgotPassword, login, resetPassword, updateProfile };