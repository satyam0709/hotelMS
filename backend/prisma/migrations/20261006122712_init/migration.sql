-- CreateTable
CREATE TABLE `WebsiteSetting` (
    `id` VARCHAR(191) NOT NULL,
    `websiteName` VARCHAR(160) NOT NULL,
    `logoMediaId` VARCHAR(191) NULL,
    `faviconMediaId` VARCHAR(191) NULL,
    `headerLogoMediaId` VARCHAR(191) NULL,
    `footerLogoMediaId` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `whatsapp` VARCHAR(40) NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `mapUrl` TEXT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `timezone` VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
    `defaultLanguage` VARCHAR(20) NOT NULL DEFAULT 'en',
    `copyrightText` VARCHAR(255) NULL,
    `socialLinksJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NavigationMenuItem` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `href` VARCHAR(255) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `location` ENUM('HEADER', 'FOOTER') NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `NavigationMenuItem_location_isActive_displayOrder_idx`(`location`, `isActive`, `displayOrder`),
    INDEX `NavigationMenuItem_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `bannerMediaId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Page_slug_key`(`slug`),
    INDEX `Page_status_isVisible_idx`(`status`, `isVisible`),
    INDEX `Page_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PageSection` (
    `id` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(120) NOT NULL,
    `title` VARCHAR(191) NULL,
    `subtitle` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `buttonText` VARCHAR(120) NULL,
    `buttonLink` VARCHAR(255) NULL,
    `mediaId` VARCHAR(191) NULL,
    `settingsJson` JSON NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `PageSection_pageId_isEnabled_displayOrder_idx`(`pageId`, `isEnabled`, `displayOrder`),
    INDEX `PageSection_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(255) NULL,
    `ctaText` VARCHAR(120) NULL,
    `ctaLink` VARCHAR(255) NULL,
    `desktopMediaId` VARCHAR(191) NULL,
    `mobileMediaId` VARCHAR(191) NULL,
    `videoMediaId` VARCHAR(191) NULL,
    `startDate` DATE NULL,
    `endDate` DATE NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Banner_isActive_startDate_endDate_displayOrder_idx`(`isActive`, `startDate`, `endDate`, `displayOrder`),
    INDEX `Banner_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Policy` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(80) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Policy_type_key`(`type`),
    UNIQUE INDEX `Policy_slug_key`(`slug`),
    INDEX `Policy_isPublished_idx`(`isPublished`),
    INDEX `Policy_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `featuredMediaId` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `RoomCategory_slug_key`(`slug`),
    INDEX `RoomCategory_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `RoomCategory_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Room` (
    `id` VARCHAR(191) NOT NULL,
    `roomCategoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `roomCode` VARCHAR(80) NOT NULL,
    `shortDescription` VARCHAR(255) NULL,
    `description` LONGTEXT NULL,
    `basePrice` DECIMAL(10, 2) NOT NULL,
    `weekendPrice` DECIMAL(10, 2) NULL,
    `maxAdults` INTEGER NOT NULL,
    `maxChildren` INTEGER NOT NULL DEFAULT 0,
    `maxOccupancy` INTEGER NOT NULL,
    `roomSize` VARCHAR(80) NULL,
    `bedType` VARCHAR(120) NULL,
    `totalInventory` INTEGER NOT NULL,
    `extraBedAllowed` BOOLEAN NOT NULL DEFAULT false,
    `extraBedCharge` DECIMAL(10, 2) NULL,
    `taxRateId` VARCHAR(191) NULL,
    `checkInTime` VARCHAR(20) NULL,
    `checkOutTime` VARCHAR(20) NULL,
    `policies` TEXT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Room_slug_key`(`slug`),
    UNIQUE INDEX `Room_roomCode_key`(`roomCode`),
    INDEX `Room_roomCategoryId_isActive_isFeatured_idx`(`roomCategoryId`, `isActive`, `isFeatured`),
    INDEX `Room_taxRateId_idx`(`taxRateId`),
    INDEX `Room_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Amenity` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(120) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Amenity_slug_key`(`slug`),
    INDEX `Amenity_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `Amenity_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomAmenity` (
    `roomId` VARCHAR(191) NOT NULL,
    `amenityId` VARCHAR(191) NOT NULL,

    INDEX `RoomAmenity_amenityId_idx`(`amenityId`),
    PRIMARY KEY (`roomId`, `amenityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomMedia` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `usage` VARCHAR(60) NOT NULL DEFAULT 'gallery',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `RoomMedia_roomId_displayOrder_idx`(`roomId`, `displayOrder`),
    INDEX `RoomMedia_mediaId_idx`(`mediaId`),
    INDEX `RoomMedia_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `RoomMedia_roomId_mediaId_usage_key`(`roomId`, `mediaId`, `usage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Facility` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(120) NULL,
    `description` TEXT NULL,
    `operatingHours` VARCHAR(160) NULL,
    `additionalInfo` TEXT NULL,
    `icon` VARCHAR(120) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Facility_slug_key`(`slug`),
    INDEX `Facility_category_isActive_displayOrder_idx`(`category`, `isActive`, `displayOrder`),
    INDEX `Facility_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacilityMedia` (
    `id` VARCHAR(191) NOT NULL,
    `facilityId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `FacilityMedia_facilityId_displayOrder_idx`(`facilityId`, `displayOrder`),
    INDEX `FacilityMedia_mediaId_idx`(`mediaId`),
    INDEX `FacilityMedia_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Restaurant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `cuisineTypesJson` JSON NULL,
    `breakfastTime` VARCHAR(80) NULL,
    `lunchTime` VARCHAR(80) NULL,
    `dinnerTime` VARCHAR(80) NULL,
    `reservationEnabled` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Restaurant_slug_key`(`slug`),
    INDEX `Restaurant_isActive_idx`(`isActive`),
    INDEX `Restaurant_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RestaurantMedia` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `RestaurantMedia_restaurantId_displayOrder_idx`(`restaurantId`, `displayOrder`),
    INDEX `RestaurantMedia_mediaId_idx`(`mediaId`),
    INDEX `RestaurantMedia_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoodMenuCategory` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `FoodMenuCategory_restaurantId_isActive_displayOrder_idx`(`restaurantId`, `isActive`, `displayOrder`),
    INDEX `FoodMenuCategory_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoodMenuItem` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NULL,
    `mediaId` VARCHAR(191) NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `FoodMenuItem_categoryId_isAvailable_idx`(`categoryId`, `isAvailable`),
    INDEX `FoodMenuItem_mediaId_idx`(`mediaId`),
    INDEX `FoodMenuItem_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventVenue` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `capacity` INTEGER NULL,
    `seatingJson` JSON NULL,
    `facilitiesJson` JSON NULL,
    `basePrice` DECIMAL(10, 2) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `EventVenue_slug_key`(`slug`),
    INDEX `EventVenue_isActive_idx`(`isActive`),
    INDEX `EventVenue_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventVenueMedia` (
    `id` VARCHAR(191) NOT NULL,
    `venueId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `EventVenueMedia_venueId_displayOrder_idx`(`venueId`, `displayOrder`),
    INDEX `EventVenueMedia_mediaId_idx`(`mediaId`),
    INDEX `EventVenueMedia_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attraction` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `distance` VARCHAR(120) NULL,
    `mapUrl` TEXT NULL,
    `travelInfo` TEXT NULL,
    `mediaId` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Attraction_slug_key`(`slug`),
    INDEX `Attraction_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `Attraction_mediaId_idx`(`mediaId`),
    INDEX `Attraction_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackageOffer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `bannerMediaId` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NULL,
    `duration` VARCHAR(120) NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED') NULL,
    `discountValue` DECIMAL(10, 2) NULL,
    `inclusionsJson` JSON NULL,
    `exclusionsJson` JSON NULL,
    `terms` TEXT NULL,
    `validFrom` DATE NULL,
    `validTo` DATE NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `PackageOffer_slug_key`(`slug`),
    INDEX `PackageOffer_isActive_isFeatured_displayOrder_idx`(`isActive`, `isFeatured`, `displayOrder`),
    INDEX `PackageOffer_validFrom_validTo_idx`(`validFrom`, `validTo`),
    INDEX `PackageOffer_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `GalleryCategory_slug_key`(`slug`),
    INDEX `GalleryCategory_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `GalleryCategory_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GalleryItem` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `mediaId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NULL,
    `caption` VARCHAR(255) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `GalleryItem_categoryId_isActive_displayOrder_idx`(`categoryId`, `isActive`, `displayOrder`),
    INDEX `GalleryItem_mediaId_idx`(`mediaId`),
    INDEX `GalleryItem_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guest` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(160) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `guestType` VARCHAR(80) NULL,
    `notes` TEXT NULL,
    `totalVisits` INTEGER NOT NULL DEFAULT 0,
    `lastVisitAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Guest_email_idx`(`email`),
    INDEX `Guest_phone_idx`(`phone`),
    INDEX `Guest_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` VARCHAR(191) NOT NULL,
    `bookingRef` VARCHAR(80) NOT NULL,
    `guestId` VARCHAR(191) NOT NULL,
    `checkInDate` DATE NOT NULL,
    `checkOutDate` DATE NOT NULL,
    `adults` INTEGER NOT NULL,
    `children` INTEGER NOT NULL DEFAULT 0,
    `roomCount` INTEGER NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `extraBedAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `couponId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REFUNDED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `paymentMethod` ENUM('PAY_AT_HOTEL', 'ONLINE') NOT NULL DEFAULT 'PAY_AT_HOTEL',
    `specialRequests` TEXT NULL,
    `expiresAt` DATETIME(3) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Booking_bookingRef_key`(`bookingRef`),
    INDEX `Booking_guestId_idx`(`guestId`),
    INDEX `Booking_couponId_idx`(`couponId`),
    INDEX `Booking_status_paymentStatus_checkInDate_checkOutDate_idx`(`status`, `paymentStatus`, `checkInDate`, `checkOutDate`),
    INDEX `Booking_expiresAt_status_idx`(`expiresAt`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingRoom` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `adults` INTEGER NOT NULL,
    `children` INTEGER NOT NULL DEFAULT 0,
    `extraBeds` INTEGER NOT NULL DEFAULT 0,
    `nightlyBreakdownJson` JSON NULL,
    `priceSubtotal` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BookingRoom_bookingId_idx`(`bookingId`),
    INDEX `BookingRoom_roomId_idx`(`roomId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `oldStatus` ENUM('PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REFUNDED', 'EXPIRED') NULL,
    `newStatus` ENUM('PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REFUNDED', 'EXPIRED') NOT NULL,
    `changedById` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BookingStatusHistory_bookingId_createdAt_idx`(`bookingId`, `createdAt`),
    INDEX `BookingStatusHistory_changedById_idx`(`changedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomAvailability` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalInventory` INTEGER NOT NULL,
    `bookedCount` INTEGER NOT NULL DEFAULT 0,
    `blockedCount` INTEGER NOT NULL DEFAULT 0,
    `availableCount` INTEGER NOT NULL,
    `minStay` INTEGER NULL,
    `maxStay` INTEGER NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoomAvailability_date_availableCount_isClosed_idx`(`date`, `availableCount`, `isClosed`),
    UNIQUE INDEX `RoomAvailability_roomId_date_key`(`roomId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomBlock` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `quantity` INTEGER NOT NULL,
    `reason` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `RoomBlock_roomId_startDate_endDate_isActive_idx`(`roomId`, `startDate`, `endDate`, `isActive`),
    INDEX `RoomBlock_createdById_idx`(`createdById`),
    INDEX `RoomBlock_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomRate` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `rateType` ENUM('SEASONAL', 'SPECIAL', 'HOLIDAY', 'CUSTOM') NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `weekendPrice` DECIMAL(10, 2) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `minStay` INTEGER NULL,
    `maxStay` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `RoomRate_roomId_startDate_endDate_isActive_idx`(`roomId`, `startDate`, `endDate`, `isActive`),
    INDEX `RoomRate_priority_idx`(`priority`),
    INDEX `RoomRate_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    `discountValue` DECIMAL(10, 2) NOT NULL,
    `minBookingAmount` DECIMAL(10, 2) NULL,
    `maxDiscountAmount` DECIMAL(10, 2) NULL,
    `validFrom` DATE NULL,
    `validTo` DATE NULL,
    `usageLimit` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Coupon_code_key`(`code`),
    INDEX `Coupon_isActive_validFrom_validTo_idx`(`isActive`, `validFrom`, `validTo`),
    INDEX `Coupon_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaxRate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `TaxRate_isDefault_isActive_idx`(`isDefault`, `isActive`),
    INDEX `TaxRate_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `provider` ENUM('RAZORPAY', 'PAY_AT_HOTEL') NOT NULL,
    `method` ENUM('PAY_AT_HOTEL', 'ONLINE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `status` ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
    `transactionId` VARCHAR(191) NULL,
    `providerOrderId` VARCHAR(191) NULL,
    `providerPaymentId` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `rawResponseJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_transactionId_key`(`transactionId`),
    INDEX `Payment_bookingId_status_idx`(`bookingId`, `status`),
    INDEX `Payment_providerOrderId_idx`(`providerOrderId`),
    INDEX `Payment_providerPaymentId_idx`(`providerPaymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `providerRefundId` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `processedAt` DATETIME(3) NULL,
    `rawResponseJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Refund_status_bookingId_idx`(`status`, `bookingId`),
    INDEX `Refund_paymentId_idx`(`paymentId`),
    INDEX `Refund_providerRefundId_idx`(`providerRefundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inquiry` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('CONTACT', 'BOOKING', 'PACKAGE', 'EVENT', 'RESTAURANT', 'GENERAL') NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(40) NULL,
    `subject` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'CONTACTED', 'CONVERTED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `assignedToId` VARCHAR(191) NULL,
    `followUpDate` DATETIME(3) NULL,
    `adminRemarks` TEXT NULL,
    `sourceRefType` VARCHAR(80) NULL,
    `sourceRefId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Inquiry_type_status_createdAt_idx`(`type`, `status`, `createdAt`),
    INDEX `Inquiry_assignedToId_idx`(`assignedToId`),
    INDEX `Inquiry_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('SUBSCRIBED', 'UNSUBSCRIBED') NOT NULL DEFAULT 'SUBSCRIBED',
    `subscribedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unsubscribedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    INDEX `NewsletterSubscriber_status_idx`(`status`),
    INDEX `NewsletterSubscriber_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Testimonial` (
    `id` VARCHAR(191) NOT NULL,
    `guestName` VARCHAR(160) NOT NULL,
    `guestImageMediaId` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `review` TEXT NOT NULL,
    `reviewDate` DATE NULL,
    `source` VARCHAR(120) NULL,
    `approvalStatus` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Testimonial_approvalStatus_isActive_displayOrder_idx`(`approvalStatus`, `isActive`, `displayOrder`),
    INDEX `Testimonial_guestImageMediaId_idx`(`guestImageMediaId`),
    INDEX `Testimonial_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FaqCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `FaqCategory_slug_key`(`slug`),
    INDEX `FaqCategory_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `FaqCategory_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(255) NOT NULL,
    `answer` TEXT NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Faq_categoryId_isActive_displayOrder_idx`(`categoryId`, `isActive`, `displayOrder`),
    INDEX `Faq_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(120) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `profileImageMediaId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    UNIQUE INDEX `AdminUser_username_key`(`username`),
    INDEX `AdminUser_status_idx`(`status`),
    INDEX `AdminUser_profileImageMediaId_idx`(`profileImageMediaId`),
    INDEX `AdminUser_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Role_slug_key`(`slug`),
    INDEX `Role_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(160) NOT NULL,
    `module` VARCHAR(80) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    INDEX `Permission_module_action_idx`(`module`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,

    INDEX `UserRole_roleId_idx`(`roleId`),
    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `PasswordResetToken_expiresAt_idx`(`expiresAt`),
    INDEX `PasswordResetToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `module` VARCHAR(80) NOT NULL,
    `action` VARCHAR(80) NOT NULL,
    `entityType` VARCHAR(120) NULL,
    `entityId` VARCHAR(191) NULL,
    `metadataJson` JSON NULL,
    `ipAddress` VARCHAR(80) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ActivityLog_module_action_createdAt_idx`(`module`, `action`, `createdAt`),
    INDEX `ActivityLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `ActivityLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationSetting` (
    `id` VARCHAR(191) NOT NULL,
    `smtpHost` VARCHAR(191) NULL,
    `smtpPort` INTEGER NULL,
    `smtpUser` VARCHAR(191) NULL,
    `smtpPasswordEncrypted` TEXT NULL,
    `fromEmail` VARCHAR(191) NULL,
    `adminEmail` VARCHAR(191) NULL,
    `bookingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `inquiryEnabled` BOOLEAN NOT NULL DEFAULT true,
    `cancellationEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(120) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `bodyHtml` LONGTEXT NULL,
    `bodyText` LONGTEXT NULL,
    `variablesJson` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `EmailTemplate_key_key`(`key`),
    INDEX `EmailTemplate_isActive_idx`(`isActive`),
    INDEX `EmailTemplate_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `templateKey` VARCHAR(120) NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,
    `relatedType` VARCHAR(80) NULL,
    `relatedId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailLog_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `EmailLog_relatedType_relatedId_idx`(`relatedType`, `relatedId`),
    INDEX `EmailLog_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `secureUrl` TEXT NOT NULL,
    `resourceType` ENUM('IMAGE', 'VIDEO', 'RAW') NOT NULL,
    `format` VARCHAR(40) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `bytes` INTEGER NULL,
    `folder` VARCHAR(160) NULL,
    `category` VARCHAR(120) NULL,
    `altText` VARCHAR(255) NULL,
    `caption` VARCHAR(255) NULL,
    `uploadedById` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `MediaAsset_publicId_key`(`publicId`),
    INDEX `MediaAsset_folder_category_isActive_idx`(`folder`, `category`, `isActive`),
    INDEX `MediaAsset_uploadedById_idx`(`uploadedById`),
    INDEX `MediaAsset_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WebsiteSetting` ADD CONSTRAINT `WebsiteSetting_logoMediaId_fkey` FOREIGN KEY (`logoMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteSetting` ADD CONSTRAINT `WebsiteSetting_faviconMediaId_fkey` FOREIGN KEY (`faviconMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteSetting` ADD CONSTRAINT `WebsiteSetting_headerLogoMediaId_fkey` FOREIGN KEY (`headerLogoMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebsiteSetting` ADD CONSTRAINT `WebsiteSetting_footerLogoMediaId_fkey` FOREIGN KEY (`footerLogoMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NavigationMenuItem` ADD CONSTRAINT `NavigationMenuItem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `NavigationMenuItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Page` ADD CONSTRAINT `Page_bannerMediaId_fkey` FOREIGN KEY (`bannerMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PageSection` ADD CONSTRAINT `PageSection_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `Page`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PageSection` ADD CONSTRAINT `PageSection_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_desktopMediaId_fkey` FOREIGN KEY (`desktopMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_mobileMediaId_fkey` FOREIGN KEY (`mobileMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD CONSTRAINT `Banner_videoMediaId_fkey` FOREIGN KEY (`videoMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Policy` ADD CONSTRAINT `Policy_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomCategory` ADD CONSTRAINT `RoomCategory_featuredMediaId_fkey` FOREIGN KEY (`featuredMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_roomCategoryId_fkey` FOREIGN KEY (`roomCategoryId`) REFERENCES `RoomCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_taxRateId_fkey` FOREIGN KEY (`taxRateId`) REFERENCES `TaxRate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomAmenity` ADD CONSTRAINT `RoomAmenity_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomAmenity` ADD CONSTRAINT `RoomAmenity_amenityId_fkey` FOREIGN KEY (`amenityId`) REFERENCES `Amenity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMedia` ADD CONSTRAINT `RoomMedia_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMedia` ADD CONSTRAINT `RoomMedia_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacilityMedia` ADD CONSTRAINT `FacilityMedia_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `Facility`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacilityMedia` ADD CONSTRAINT `FacilityMedia_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantMedia` ADD CONSTRAINT `RestaurantMedia_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RestaurantMedia` ADD CONSTRAINT `RestaurantMedia_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FoodMenuCategory` ADD CONSTRAINT `FoodMenuCategory_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FoodMenuItem` ADD CONSTRAINT `FoodMenuItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FoodMenuCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FoodMenuItem` ADD CONSTRAINT `FoodMenuItem_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventVenueMedia` ADD CONSTRAINT `EventVenueMedia_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `EventVenue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventVenueMedia` ADD CONSTRAINT `EventVenueMedia_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attraction` ADD CONSTRAINT `Attraction_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackageOffer` ADD CONSTRAINT `PackageOffer_bannerMediaId_fkey` FOREIGN KEY (`bannerMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GalleryItem` ADD CONSTRAINT `GalleryItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `GalleryCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GalleryItem` ADD CONSTRAINT `GalleryItem_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_guestId_fkey` FOREIGN KEY (`guestId`) REFERENCES `Guest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingRoom` ADD CONSTRAINT `BookingRoom_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingRoom` ADD CONSTRAINT `BookingRoom_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingStatusHistory` ADD CONSTRAINT `BookingStatusHistory_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingStatusHistory` ADD CONSTRAINT `BookingStatusHistory_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomAvailability` ADD CONSTRAINT `RoomAvailability_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomBlock` ADD CONSTRAINT `RoomBlock_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomBlock` ADD CONSTRAINT `RoomBlock_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomRate` ADD CONSTRAINT `RoomRate_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inquiry` ADD CONSTRAINT `Inquiry_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Testimonial` ADD CONSTRAINT `Testimonial_guestImageMediaId_fkey` FOREIGN KEY (`guestImageMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Faq` ADD CONSTRAINT `Faq_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `FaqCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminUser` ADD CONSTRAINT `AdminUser_profileImageMediaId_fkey` FOREIGN KEY (`profileImageMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailLog` ADD CONSTRAINT `EmailLog_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `EmailTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaAsset` ADD CONSTRAINT `MediaAsset_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
