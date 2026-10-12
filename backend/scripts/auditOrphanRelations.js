const prisma = require("../src/prisma/client");

function relation(label, model, relationField, foreignKey, identityFields = ["id"], nullable = false) {
  const where = { NOT: { [relationField]: {} } };
  if (nullable) where[foreignKey] = { not: null };
  return { label, model, relationField, foreignKey, where, identityFields };
}

const relations = [
  relation("Room.roomCategoryId -> RoomCategory.id", "room", "category", "roomCategoryId"),
  relation("Room.taxRateId -> TaxRate.id", "room", "taxRate", "taxRateId", ["id", "taxRateId"], true),
  relation("RoomAmenity.roomId -> Room.id", "roomAmenity", "room", "roomId", ["roomId", "amenityId"]),
  relation("RoomAmenity.amenityId -> Amenity.id", "roomAmenity", "amenity", "amenityId", ["roomId", "amenityId"]),
  relation("RoomMedia.roomId -> Room.id", "roomMedia", "room", "roomId", ["id", "roomId", "mediaId"]),
  relation("RoomMedia.mediaId -> MediaAsset.id", "roomMedia", "media", "mediaId", ["id", "roomId", "mediaId"]),
  relation("RoomAvailability.roomId -> Room.id", "roomAvailability", "room", "roomId"),
  relation("RoomBlock.roomId -> Room.id", "roomBlock", "room", "roomId"),
  relation("RoomBlock.createdById -> AdminUser.id", "roomBlock", "createdBy", "createdById", ["id", "createdById"], true),
  relation("RoomRate.roomId -> Room.id", "roomRate", "room", "roomId"),
  relation("RoomCategory.featuredMediaId -> MediaAsset.id", "roomCategory", "featuredMedia", "featuredMediaId", ["id", "featuredMediaId"], true),

  relation("Booking.guestId -> Guest.id", "booking", "guest", "guestId"),
  relation("Booking.couponId -> Coupon.id", "booking", "coupon", "couponId", ["id", "couponId"], true),
  relation("BookingRoom.bookingId -> Booking.id", "bookingRoom", "booking", "bookingId"),
  relation("BookingRoom.roomId -> Room.id", "bookingRoom", "room", "roomId"),
  relation("BookingStatusHistory.bookingId -> Booking.id", "bookingStatusHistory", "booking", "bookingId"),
  relation("BookingStatusHistory.changedById -> AdminUser.id", "bookingStatusHistory", "changedBy", "changedById", ["id", "changedById"], true),
  relation("Payment.bookingId -> Booking.id", "payment", "booking", "bookingId"),
  relation("Refund.paymentId -> Payment.id", "refund", "payment", "paymentId"),
  relation("Refund.bookingId -> Booking.id", "refund", "booking", "bookingId"),

  relation("RolePermission.roleId -> Role.id", "rolePermission", "role", "roleId", ["roleId", "permissionId"]),
  relation("RolePermission.permissionId -> Permission.id", "rolePermission", "permission", "permissionId", ["roleId", "permissionId"]),
  relation("UserRole.userId -> AdminUser.id", "userRole", "user", "userId", ["userId", "roleId"]),
  relation("UserRole.roleId -> Role.id", "userRole", "role", "roleId", ["userId", "roleId"]),
  relation("PasswordResetToken.userId -> AdminUser.id", "passwordResetToken", "user", "userId"),
  relation("ActivityLog.userId -> AdminUser.id", "activityLog", "user", "userId", ["id", "userId"], true),
  relation("Inquiry.assignedToId -> AdminUser.id", "inquiry", "assignedTo", "assignedToId", ["id", "assignedToId"], true),
  relation("AdminUser.profileImageMediaId -> MediaAsset.id", "adminUser", "profileImageMedia", "profileImageMediaId", ["id", "profileImageMediaId"], true),
  relation("MediaAsset.uploadedById -> AdminUser.id", "mediaAsset", "uploadedBy", "uploadedById", ["id", "uploadedById"], true),
  relation("EmailLog.templateId -> EmailTemplate.id", "emailLog", "template", "templateId", ["id", "templateId"], true),

  relation("WebsiteSetting.logoMediaId -> MediaAsset.id", "websiteSetting", "logoMedia", "logoMediaId", ["id", "logoMediaId"], true),
  relation("WebsiteSetting.faviconMediaId -> MediaAsset.id", "websiteSetting", "faviconMedia", "faviconMediaId", ["id", "faviconMediaId"], true),
  relation("WebsiteSetting.headerLogoMediaId -> MediaAsset.id", "websiteSetting", "headerLogoMedia", "headerLogoMediaId", ["id", "headerLogoMediaId"], true),
  relation("WebsiteSetting.footerLogoMediaId -> MediaAsset.id", "websiteSetting", "footerLogoMedia", "footerLogoMediaId", ["id", "footerLogoMediaId"], true),
  relation("NavigationMenuItem.parentId -> NavigationMenuItem.id", "navigationMenuItem", "parent", "parentId", ["id", "parentId"], true),
  relation("Page.bannerMediaId -> MediaAsset.id", "page", "bannerMedia", "bannerMediaId", ["id", "bannerMediaId"], true),
  relation("PageSection.pageId -> Page.id", "pageSection", "page", "pageId"),
  relation("PageSection.mediaId -> MediaAsset.id", "pageSection", "media", "mediaId", ["id", "mediaId"], true),
  relation("Banner.desktopMediaId -> MediaAsset.id", "banner", "desktopMedia", "desktopMediaId", ["id", "desktopMediaId"], true),
  relation("Banner.mobileMediaId -> MediaAsset.id", "banner", "mobileMedia", "mobileMediaId", ["id", "mobileMediaId"], true),
  relation("Banner.videoMediaId -> MediaAsset.id", "banner", "videoMedia", "videoMediaId", ["id", "videoMediaId"], true),
  relation("Policy.updatedById -> AdminUser.id", "policy", "updatedBy", "updatedById", ["id", "updatedById"], true),
  relation("FacilityMedia.facilityId -> Facility.id", "facilityMedia", "facility", "facilityId"),
  relation("FacilityMedia.mediaId -> MediaAsset.id", "facilityMedia", "media", "mediaId"),
  relation("RestaurantMedia.restaurantId -> Restaurant.id", "restaurantMedia", "restaurant", "restaurantId"),
  relation("RestaurantMedia.mediaId -> MediaAsset.id", "restaurantMedia", "media", "mediaId"),
  relation("FoodMenuCategory.restaurantId -> Restaurant.id", "foodMenuCategory", "restaurant", "restaurantId"),
  relation("FoodMenuItem.categoryId -> FoodMenuCategory.id", "foodMenuItem", "category", "categoryId"),
  relation("FoodMenuItem.mediaId -> MediaAsset.id", "foodMenuItem", "media", "mediaId", ["id", "mediaId"], true),
  relation("EventVenueMedia.venueId -> EventVenue.id", "eventVenueMedia", "venue", "venueId"),
  relation("EventVenueMedia.mediaId -> MediaAsset.id", "eventVenueMedia", "media", "mediaId"),
  relation("Attraction.mediaId -> MediaAsset.id", "attraction", "media", "mediaId", ["id", "mediaId"], true),
  relation("PackageOffer.bannerMediaId -> MediaAsset.id", "packageOffer", "bannerMedia", "bannerMediaId", ["id", "bannerMediaId"], true),
  relation("GalleryItem.categoryId -> GalleryCategory.id", "galleryItem", "category", "categoryId"),
  relation("GalleryItem.mediaId -> MediaAsset.id", "galleryItem", "media", "mediaId"),
  relation("Testimonial.guestImageMediaId -> MediaAsset.id", "testimonial", "guestImageMedia", "guestImageMediaId", ["id", "guestImageMediaId"], true),
  relation("Faq.categoryId -> FaqCategory.id", "faq", "category", "categoryId"),
];

const parentIdsByModel = new Map();

async function getParentIds(modelName) {
  if (!parentIdsByModel.has(modelName)) {
    const ids = await prisma[modelName].findMany({ select: { id: true } });
    parentIdsByModel.set(modelName, new Set(ids.map(({ id }) => id)));
  }
  return parentIdsByModel.get(modelName);
}

async function auditRelation(entry) {
  const model = prisma[entry.model];
  const targetModelName = entry.label.split("->")[1].trim().split(".")[0];
  const parentModelName = `${targetModelName[0].toLowerCase()}${targetModelName.slice(1)}`;
  const parentIds = await getParentIds(parentModelName);
  const where = entry.where[entry.foreignKey] ? entry.where : undefined;
  const rows = await model.findMany({
    where,
    select: Object.fromEntries([...new Set([...entry.identityFields, entry.foreignKey])].map((field) => [field, true])),
  });
  const orphans = rows.filter((row) => row[entry.foreignKey] == null || !parentIds.has(row[entry.foreignKey]));
  const orphanCount = orphans.length;
  const samples = orphans.slice(0, 20);
  return {
    relationship: entry.label,
    orphanCount,
    orphanIds: orphanCount <= 20 ? samples : null,
    sampleOrphanIds: orphanCount > 20 ? samples : null,
    repairSafe: orphanCount === 0,
  };
}

async function auditRoomMediaReattachment() {
  const where = { deletedAt: { not: null } };
  const count = await prisma.roomMedia.count({ where });
  const rows = count
    ? await prisma.roomMedia.findMany({ where, select: { id: true, roomId: true, mediaId: true, usage: true }, take: 20 })
    : [];
  return {
    softDeletedRelationCount: count,
    sample: rows,
    reattachmentBlockedForSameTuple: count > 0,
    explanation: "The unique key (roomId, mediaId, usage) includes soft-deleted rows; reattach by restoring the existing relation row or a create may conflict.",
  };
}

async function auditRefundBookingConsistency() {
  const refunds = await prisma.refund.findMany({
    select: { id: true, bookingId: true, paymentId: true, payment: { select: { bookingId: true } } },
  });
  const mismatches = refunds
    .filter((refund) => refund.payment && refund.payment.bookingId !== refund.bookingId)
    .map(({ id, bookingId, paymentId, payment }) => ({
      id,
      bookingId,
      paymentId,
      paymentBookingId: payment.bookingId,
    }));
  return { checkedCount: refunds.length, mismatchCount: mismatches.length, mismatches };
}

async function verifyRolePermissionParents() {
  const [rowCount, roleCount, permissionCount, samples] = await Promise.all([
    prisma.rolePermission.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.findMany({
      select: { roleId: true, permissionId: true },
      take: 5,
    }),
  ]);
  const parentChecks = await Promise.all(samples.map(async (row) => {
    const [role, permission] = await Promise.all([
      prisma.role.findUnique({ where: { id: row.roleId }, select: { id: true } }),
      prisma.permission.findUnique({ where: { id: row.permissionId }, select: { id: true } }),
    ]);
    return { ...row, roleExists: Boolean(role), permissionExists: Boolean(permission) };
  }));
  return { rowCount, roleCount, permissionCount, parentChecks };
}

async function main() {
  const results = [];
  for (const entry of relations) results.push(await auditRelation(entry));

  const roomMedia = await auditRoomMediaReattachment();
  const refundConsistency = await auditRefundBookingConsistency();
  const rolePermissionCrossCheck = await verifyRolePermissionParents();
  const totalOrphanRows = results.reduce((total, result) => total + result.orphanCount, 0);
  const report = {
    expectedRelations: 57,
    auditedRelations: results.length,
    totalOrphanRows,
    relationshipsWithOrphans: results.filter((result) => result.orphanCount > 0).length,
    relationships: results,
    roomMediaReattachment: roomMedia,
    refundBookingConsistency: refundConsistency,
    rolePermissionCrossCheck,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (results.length !== 57) throw new Error(`Expected 57 relationship checks, got ${results.length}.`);
  if (totalOrphanRows > 0) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());