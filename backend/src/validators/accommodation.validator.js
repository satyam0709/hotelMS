const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const slug = z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalText = (max) => z.string().trim().max(max).nullable().optional();
const optionalBoolean = z.boolean().optional();
const optionalOrder = z.number().int().min(0).optional();
const positiveInteger = z.number().int().min(1);
const nonNegativeInteger = z.number().int().min(0);
const price = z.number().finite().min(0).max(99999999.99);
const queryGuestCount = z.coerce.number().int().min(1).max(30);
const queryPrice = z.coerce.number().finite().min(0).max(99999999.99);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Date must be a valid YYYY-MM-DD value.");

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();

const roomCategory = z.object({
  name: z.string().trim().min(1).max(160),
  slug,
  description: optionalText(10000),
  featuredMediaId: id.nullable().optional(),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const amenity = z.object({
  name: z.string().trim().min(1).max(160),
  slug,
  icon: optionalText(120),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const roomMediaItem = z.object({
  mediaId: id,
  usage: z.string().trim().min(1).max(60).default("gallery"),
  displayOrder: nonNegativeInteger.default(0),
}).strict();

const room = z.object({
  name: z.string().trim().min(1).max(191).optional(),
  slug: slug.optional(),
  roomCode: z.string().trim().min(1).max(80).optional(),
  roomCategoryId: id.optional(),
  shortDescription: optionalText(255),
  description: optionalText(30000),
  basePrice: price.optional(),
  weekendPrice: price.nullable().optional(),
  maxAdults: positiveInteger.optional(),
  maxChildren: nonNegativeInteger.optional(),
  maxOccupancy: positiveInteger.optional(),
  roomSize: optionalText(80),
  bedType: optionalText(120),
  totalInventory: positiveInteger.optional(),
  extraBedAllowed: optionalBoolean,
  extraBedCharge: price.nullable().optional(),
  taxRateId: id.nullable().optional(),
  checkInTime: optionalText(20),
  checkOutTime: optionalText(20),
  policies: optionalText(10000),
  isFeatured: optionalBoolean,
  isActive: optionalBoolean,
  amenityIds: z.array(id).max(100).refine((values) => new Set(values).size === values.length, "Amenity IDs must be unique.").optional(),
  media: z.array(roomMediaItem).max(100).optional(),
}).strict();

function validateRoomOccupancy(value) {
  if (
    value.maxAdults !== undefined &&
    value.maxChildren !== undefined &&
    value.maxOccupancy !== undefined &&
    value.maxOccupancy < value.maxAdults + value.maxChildren
  ) return false;
  return true;
}

function fields(schema, required = [], isPartial = false) {
  const shape = { ...schema.shape };
  for (const key of required) shape[key] = shape[key].unwrap();
  const result = z.object(shape).strict();
  const partialResult = isPartial ? result.partial() : result;
  return partialResult.refine((value) => Object.keys(value).length > 0, "At least one field is required.");
}

const roomCreate = fields(room, ["name", "slug", "roomCode", "roomCategoryId", "basePrice", "maxAdults", "maxOccupancy", "totalInventory"])
  .refine(validateRoomOccupancy, {
    message: "maxOccupancy must be at least maxAdults plus maxChildren.",
    path: ["maxOccupancy"],
  });
const roomUpdate = fields(room, [], true).refine(validateRoomOccupancy, {
  message: "maxOccupancy must be at least maxAdults plus maxChildren when all occupancy fields are provided.",
  path: ["maxOccupancy"],
});

const roomListQuery = z.object({
  ...listQuery.shape,
  category: slug.optional(),
  categoryId: id.optional(),
  guestCount: queryGuestCount.optional(),
  minPrice: queryPrice.optional(),
  maxPrice: queryPrice.optional(),
  amenityIds: z.preprocess(
    (value) => typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value,
    z.array(id).max(100).optional()
  ),
  isFeatured: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict().refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
  message: "minPrice must be less than or equal to maxPrice.",
  path: ["minPrice"],
});

const roomAmenities = z.object({
  amenityIds: z.array(id).max(100).refine((values) => new Set(values).size === values.length, "Amenity IDs must be unique."),
}).strict();
const roomMedia = z.object({ items: z.array(roomMediaItem).max(100) }).strict();
const roomStatus = z.object({ isActive: z.boolean() }).strict();

const availabilityDateQuery = z.object({
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from must be on or before to.",
  path: ["from"],
});
const availabilityDay = z.object({
  date: dateOnly,
  totalInventory: positiveInteger,
  bookedCount: nonNegativeInteger.default(0),
  blockedCount: nonNegativeInteger.default(0),
  availableCount: nonNegativeInteger,
  minStay: positiveInteger.nullable().optional(),
  maxStay: positiveInteger.nullable().optional(),
  isClosed: z.boolean().optional(),
}).strict();
const availabilityUpsert = z.object({ days: z.array(availabilityDay).min(1).max(366) }).strict()
  .refine(({ days }) => new Set(days.map(({ date }) => date)).size === days.length, {
    message: "Availability dates must be unique.",
    path: ["days"],
  })
  .refine(({ days }) => days.every((day) => day.minStay == null || day.maxStay == null || day.minStay <= day.maxStay), {
    message: "minStay must not exceed maxStay.",
    path: ["days"],
  });
const roomRecordQuery = z.object({
  ...listQuery.shape,
  limit: z.coerce.number().int().min(1).max(370).default(20),
  from: dateOnly.optional(),
  to: dateOnly.optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from must be on or before to.",
  path: ["from"],
});

const roomBlockBase = z.object({
  startDate: dateOnly,
  endDate: dateOnly,
  quantity: positiveInteger,
  reason: optionalText(10000),
  isActive: optionalBoolean,
}).strict();
const roomBlock = roomBlockBase.refine((value) => value.startDate < value.endDate, {
  message: "endDate must be after startDate.",
  path: ["endDate"],
});
const roomBlockUpdate = fields(roomBlockBase, [], true).refine(
  (value) => !value.startDate || !value.endDate || value.startDate < value.endDate,
  { message: "endDate must be after startDate.", path: ["endDate"] }
);

const rateType = z.enum(["SEASONAL", "SPECIAL", "HOLIDAY", "CUSTOM"]);
const roomRateBase = z.object({
  startDate: dateOnly,
  endDate: dateOnly,
  rateType,
  price,
  weekendPrice: price.nullable().optional(),
  priority: nonNegativeInteger.optional(),
  minStay: positiveInteger.nullable().optional(),
  maxStay: positiveInteger.nullable().optional(),
  isActive: optionalBoolean,
}).strict();
const roomRate = roomRateBase.refine((value) => value.startDate <= value.endDate, {
  message: "endDate must be on or after startDate.",
  path: ["endDate"],
}).refine((value) => value.minStay == null || value.maxStay == null || value.minStay <= value.maxStay, {
  message: "minStay must not exceed maxStay.",
  path: ["maxStay"],
});
const roomRateUpdate = fields(roomRateBase, [], true).refine(
  (value) => !value.startDate || !value.endDate || value.startDate <= value.endDate,
  { message: "endDate must be on or after startDate.", path: ["endDate"] }
).refine((value) => value.minStay == null || value.maxStay == null || value.minStay <= value.maxStay, {
  message: "minStay must not exceed maxStay.",
  path: ["maxStay"],
});

const roomIdParams = z.object({ roomId: id }).strict();
const roomAndRecordParams = z.object({ roomId: id, id }).strict();

function patchSchema(schema) {
  return schema.partial().refine((value) => Object.keys(value).length > 0, "At least one field is required.");
}

module.exports = {
  amenity: { create: amenity, update: patchSchema(amenity) },
  idParams: z.object({ id }).strict(),
  roomIdParams,
  roomAndRecordParams,
  room: { create: roomCreate, update: roomUpdate },
  roomListQuery,
  roomAmenities,
  roomMedia,
  roomStatus,
  roomRecordQuery,
  availabilityDateQuery,
  availabilityUpsert,
  roomBlock: { create: roomBlock, update: roomBlockUpdate },
  roomRate: { create: roomRate, update: roomRateUpdate },
  listQuery,
  reorder: z.object({
    items: z.array(z.object({ id, displayOrder: z.number().int().min(0) }).strict()).min(1).max(200),
  }).strict(),
  roomCategory: { create: roomCategory, update: patchSchema(roomCategory) },
  slugParams: z.object({ slug }).strict(),
};