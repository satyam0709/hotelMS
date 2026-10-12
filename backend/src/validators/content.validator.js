const { z } = require("zod");

const id = z.string().trim().min(1).max(191);
const slug = z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableText = (max = 10000) => z.string().trim().max(max).nullable().optional();
const optionalText = (max = 10000) => z.string().trim().max(max).optional();
const optionalBoolean = z.boolean().optional();
const optionalOrder = z.number().int().min(0).optional();
const optionalDate = z.coerce.date().nullable().optional();
const mediaIds = z.array(id).max(30).optional();

const query = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PENDING", "APPROVED", "REJECTED", "SUBSCRIBED", "UNSUBSCRIBED", "NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"]).optional(),
  isPublished: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  type: z.enum(["CONTACT", "BOOKING", "PACKAGE", "EVENT", "RESTAURANT", "GENERAL"]).optional(),
  category: z.string().trim().max(120).optional(),
  categoryId: id.optional(),
  assignedToId: id.optional(),
  location: z.enum(["HEADER", "FOOTER"]).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  isVisible: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  isAvailable: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  trashed: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  isFeatured: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict();

const settings = z.object({
  websiteName: optionalText(160),
  logoMediaId: id.nullable().optional(),
  faviconMediaId: id.nullable().optional(),
  headerLogoMediaId: id.nullable().optional(),
  footerLogoMediaId: id.nullable().optional(),
  phone: nullableText(40),
  whatsapp: nullableText(40),
  email: z.string().trim().email().max(191).nullable().optional(),
  address: nullableText(),
  mapUrl: nullableText(2000),
  currency: optionalText(10),
  timezone: optionalText(80),
  defaultLanguage: optionalText(20),
  copyrightText: nullableText(255),
  socialLinksJson: z.record(z.string(), z.string().url()).nullable().optional(),
  onlinePaymentEnabled: optionalBoolean,
  payAtHotelEnabled: optionalBoolean,
  metaTitle: nullableText(191),
  metaDescription: nullableText(),
  metaKeywords: nullableText(255),
  receptionHours: nullableText(255),
}).strict();

const navigation = z.object({
  label: optionalText(120),
  href: optionalText(255),
  parentId: id.nullable().optional(),
  location: z.enum(["HEADER", "FOOTER"]).optional(),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const page = z.object({
  title: optionalText(191),
  slug: slug.optional(),
  bannerMediaId: id.nullable().optional(),
  isVisible: optionalBoolean,
  displayOrder: optionalOrder,
  metaTitle: nullableText(191),
  metaDescription: nullableText(),
  metaKeywords: nullableText(255),
}).strict();
const pageSection = z.object({
  id: id.optional(),
  sectionKey: z.string().trim().min(1).max(120),
  title: nullableText(191),
  subtitle: nullableText(255),
  description: nullableText(),
  buttonText: nullableText(120),
  buttonLink: nullableText(255),
  mediaId: id.nullable().optional(),
  settingsJson: z.record(z.string(), z.unknown()).nullable().optional(),
  displayOrder: z.number().int().min(0),
  isEnabled: optionalBoolean,
}).strict();
const pageSections = z.object({ sections: z.array(pageSection).max(100) }).strict();

const banner = z.object({
  title: optionalText(191),
  subtitle: nullableText(255),
  ctaText: nullableText(120),
  ctaLink: nullableText(255),
  desktopMediaId: id.nullable().optional(),
  mobileMediaId: id.nullable().optional(),
  videoMediaId: id.nullable().optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const policy = z.object({
  type: optionalText(80),
  title: optionalText(191),
  slug: slug.optional(),
  content: optionalText(100000),
  isPublished: optionalBoolean,
}).strict();

const blogPost = z.object({
  title: optionalText(191),
  slug: slug.optional(),
  category: nullableText(120),
  excerpt: nullableText(),
  content: optionalText(100000),
  authorName: nullableText(160),
  coverMediaId: id.nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  isFeatured: optionalBoolean,
  displayOrder: optionalOrder,
}).strict();

const facility = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  category: nullableText(120),
  description: nullableText(),
  operatingHours: nullableText(160),
  additionalInfo: nullableText(),
  icon: nullableText(120),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
  mediaIds,
}).strict();

const restaurant = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  description: nullableText(),
  cuisineTypesJson: z.array(z.string().trim().min(1).max(80)).max(30).nullable().optional(),
  breakfastTime: nullableText(80),
  lunchTime: nullableText(80),
  dinnerTime: nullableText(80),
  reservationEnabled: optionalBoolean,
  isActive: optionalBoolean,
  mediaIds,
}).strict();
const menuCategory = z.object({
  name: optionalText(160),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();
const menuItem = z.object({
  categoryId: id.optional(),
  name: optionalText(160),
  description: nullableText(),
  price: z.number().finite().min(0).nullable().optional(),
  mediaId: id.nullable().optional(),
  isAvailable: optionalBoolean,
  displayOrder: optionalOrder,
}).strict();

const event = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  description: nullableText(),
  capacity: z.number().int().min(1).nullable().optional(),
  seatingJson: z.record(z.string(), z.unknown()).nullable().optional(),
  facilitiesJson: z.array(z.string().trim().min(1).max(120)).max(100).nullable().optional(),
  basePrice: z.number().finite().min(0).nullable().optional(),
  isActive: optionalBoolean,
  mediaIds,
}).strict();

const attraction = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  description: nullableText(),
  distance: nullableText(120),
  mapUrl: z.string().trim().url().max(2000).nullable().optional(),
  travelInfo: nullableText(),
  mediaId: id.nullable().optional(),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const packageOffer = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  description: nullableText(),
  bannerMediaId: id.nullable().optional(),
  price: z.number().finite().min(0).nullable().optional(),
  duration: nullableText(120),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).nullable().optional(),
  discountValue: z.number().finite().min(0).nullable().optional(),
  inclusionsJson: z.array(z.string().trim().min(1).max(255)).max(100).nullable().optional(),
  exclusionsJson: z.array(z.string().trim().min(1).max(255)).max(100).nullable().optional(),
  terms: nullableText(),
  validFrom: optionalDate,
  validTo: optionalDate,
  isFeatured: optionalBoolean,
  isActive: optionalBoolean,
  displayOrder: optionalOrder,
}).strict();

const galleryCategory = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const galleryItem = z.object({
  categoryId: id.optional(),
  mediaId: id.optional(),
  title: nullableText(160),
  caption: nullableText(255),
  displayOrder: optionalOrder,
  isFeatured: optionalBoolean,
  isActive: optionalBoolean,
}).strict();

const faqCategory = z.object({
  name: optionalText(160),
  slug: slug.optional(),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();
const faq = z.object({
  categoryId: id.optional(),
  question: optionalText(255),
  answer: optionalText(),
  displayOrder: optionalOrder,
  isActive: optionalBoolean,
}).strict();

const testimonial = z.object({
  guestName: optionalText(160),
  guestImageMediaId: id.nullable().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  review: optionalText(),
  reviewDate: optionalDate,
  source: nullableText(120),
  isActive: optionalBoolean,
  displayOrder: optionalOrder,
}).strict();
const approval = z.object({ approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]) }).strict();

const captchaToken = z.string().trim().min(1).max(2048).optional();
const subscription = z.object({
  email: z.string().trim().email().max(191).transform((value) => value.toLowerCase()),
  captchaToken,
}).strict();
const inquiry = z.object({
  type: z.enum(["CONTACT", "BOOKING", "PACKAGE", "EVENT", "RESTAURANT", "GENERAL"]),
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(191).optional(),
  phone: z.string().trim().min(3).max(40).optional(),
  subject: optionalText(191),
  message: z.string().trim().min(1).max(10000),
  sourceRefType: nullableText(80),
  sourceRefId: nullableText(191),
  captchaToken,
}).strict().refine((value) => value.email || value.phone, {
  message: "An email address or phone number is required.",
  path: ["email"],
});
const searchQuery = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(20).optional(),
}).strict();
const inquiryUpdate = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"]).optional(),
  adminRemarks: nullableText(),
  followUpDate: optionalDate,
}).strict();
const inquiryStatus = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"]),
}).strict();
const inquiryAssignment = z.object({ assignedToId: id.nullable() }).strict();
const newsletterStatus = z.object({ status: z.enum(["SUBSCRIBED", "UNSUBSCRIBED"]) }).strict();

const reorder = z.object({
  items: z.array(z.object({ id, displayOrder: z.number().int().min(0) }).strict()).min(1).max(200),
}).strict();

const mediaRegister = z.object({
  url: z.string().trim().url().max(2000),
  altText: nullableText(255),
  caption: nullableText(255),
  folder: nullableText(160),
  category: nullableText(120),
  resourceType: z.enum(["IMAGE", "VIDEO", "RAW"]).default("IMAGE"),
}).strict();

function fields(schema, required = [], isPartial = false) {
  const shape = { ...schema.shape };
  for (const key of required) shape[key] = shape[key].unwrap();
  const result = z.object(shape).strict();
  const partialSchema = isPartial ? result.partial() : result;
  return partialSchema.refine((value) => Object.keys(value).length > 0, "At least one field is required.");
}

function bannerSchema(required = [], isPartial = false) {
  return fields(banner, required, isPartial).refine(
    (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
    { message: "endDate must be on or after startDate.", path: ["endDate"] }
  );
}

module.exports = {
  approval,
  attraction: { create: fields(attraction, ["name", "slug"]), update: fields(attraction, [], true) },
  banner: { create: bannerSchema(["title"]), update: bannerSchema([], true) },
  blog: { create: fields(blogPost, ["title", "slug", "content"]), update: fields(blogPost, [], true) },
  event: { create: fields(event, ["name", "slug"]), update: fields(event, [], true) },
  galleryCategory: { create: fields(galleryCategory, ["name", "slug"]), update: fields(galleryCategory, [], true) },
  galleryItem: { create: fields(galleryItem, ["categoryId", "mediaId"]), update: fields(galleryItem, [], true) },
  facility: { create: fields(facility, ["name", "slug"]), update: fields(facility, [], true) },
  package: {
    create: fields(packageOffer, ["name", "slug"]).refine(
      (value) => !value.validFrom || !value.validTo || value.validTo >= value.validFrom,
      { message: "validTo must be on or after validFrom.", path: ["validTo"] }
    ),
    update: fields(packageOffer, [], true).refine(
      (value) => !value.validFrom || !value.validTo || value.validTo >= value.validFrom,
      { message: "validTo must be on or after validFrom.", path: ["validTo"] }
    ),
  },
  faq: { create: fields(faq, ["categoryId", "question", "answer"]), update: fields(faq, [], true) },
  faqCategory: { create: fields(faqCategory, ["name", "slug"]), update: fields(faqCategory, [], true) },
  idParams: z.object({ id }).strict(),
  inquiry,
  inquiryAssignment,
  inquiryStatus,
  inquiryUpdate: fields(inquiryUpdate, [], true),
  listQuery: query,
  mediaRegister,
  menuCategory: { create: fields(menuCategory, ["name"]), update: fields(menuCategory, [], true) },
  menuItem: { create: fields(menuItem, ["categoryId", "name"]), update: fields(menuItem, [], true) },
  navigation: { create: fields(navigation, ["label", "href", "location"]), update: fields(navigation, [], true) },
  newsletterStatus,
  page: { create: fields(page, ["title", "slug"]), update: fields(page, [], true) },
  pageSections,
  policy: { create: fields(policy, ["type", "title", "slug", "content"]), update: fields(policy, [], true) },
  reorder,
  restaurant: {
    create: fields(restaurant, ["name", "slug"]),
    update: fields(restaurant, [], true),
  },
  searchQuery,
  slugParams: z.object({ slug }).strict(),
  settings: fields(settings, [], true),
  subscription,
  testimonial: { create: fields(testimonial, ["guestName", "rating", "review"]), update: fields(testimonial, [], true) },
};