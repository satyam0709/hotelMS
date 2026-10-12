const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
const money = z.number().finite().min(0).max(99999999.99);
const optionalMoney = money.nullable().optional();
const optionalText = (max) => z.string().trim().max(max).nullable().optional();

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();

const idParams = z.object({ id }).strict();

const couponBase = z.object({
  code: z.string().trim().min(1).max(80).transform((value) => value.toUpperCase()),
  description: optionalText(5000),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: money,
  minBookingAmount: optionalMoney,
  maxDiscountAmount: optionalMoney,
  validFrom: dateOnly,
  validTo: dateOnly,
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();

function refineCoupon(value) {
  if (value.discountType === "PERCENTAGE" && value.discountValue > 100) return false;
  if (value.validFrom && value.validTo && value.validFrom > value.validTo) return false;
  return true;
}

const couponCreate = couponBase.refine(refineCoupon, {
  message: "Invalid coupon: percentage max 100, and validFrom must be on/before validTo.",
});

const couponUpdate = couponBase.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required.",
}).refine((value) => {
  if (value.discountType === "PERCENTAGE" && value.discountValue != null && value.discountValue > 100) return false;
  if (value.validFrom && value.validTo && value.validFrom > value.validTo) return false;
  return true;
}, {
  message: "Invalid coupon: percentage max 100, and validFrom must be on/before validTo.",
});

const taxRateBase = z.object({
  name: z.string().trim().min(1).max(120),
  percentage: z.number().finite().min(0).max(100),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).strict();

const taxRateCreate = taxRateBase;
const taxRateUpdate = taxRateBase.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required.",
});

module.exports = {
  listQuery,
  idParams,
  coupon: { create: couponCreate, update: couponUpdate },
  taxRate: { create: taxRateCreate, update: taxRateUpdate },
};
