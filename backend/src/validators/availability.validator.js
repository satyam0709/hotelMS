const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const slug = z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const queryPrice = z.coerce.number().finite().min(0).max(99999999.99);
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

const availabilitySearchQuery = z.object({
  checkIn: dateOnly,
  checkOut: dateOnly,
  adults: z.coerce.number().int().min(1).max(30),
  children: z.coerce.number().int().min(0).max(30).default(0),
  rooms: z.coerce.number().int().min(1).max(30).default(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: slug.optional(),
  categoryId: id.optional(),
  minPrice: queryPrice.optional(),
  maxPrice: queryPrice.optional(),
  amenityIds: z.preprocess(
    (value) => (typeof value === "string"
      ? value.split(",").map((item) => item.trim()).filter(Boolean)
      : value),
    z.array(id).max(100).optional()
  ),
  isFeatured: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  roomId: id.optional(),
  room: slug.optional(),
}).strict()
  .refine((value) => value.checkIn < value.checkOut, {
    message: "checkOut must be after checkIn.",
    path: ["checkOut"],
  })
  .refine((value) => value.checkIn >= todayUtcDateString(), {
    message: "checkIn must be today or a future date.",
    path: ["checkIn"],
  })
  .refine((value) => nightsBetween(value.checkIn, value.checkOut) <= 30, {
    message: "Stay length cannot exceed 30 nights.",
    path: ["checkOut"],
  })
  .refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
    message: "minPrice must be less than or equal to maxPrice.",
    path: ["minPrice"],
  });

module.exports = {
  availabilitySearchQuery,
  dateOnly,
  nightsBetween,
};
