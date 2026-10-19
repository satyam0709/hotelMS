CREATE TABLE `RestaurantReservation` (
    `id` VARCHAR(191) NOT NULL,
    `restaurantId` VARCHAR(191) NOT NULL,
    `guestName` VARCHAR(160) NOT NULL,
    `guestEmail` VARCHAR(191) NULL,
    `guestPhone` VARCHAR(40) NULL,
    `guestCount` INTEGER NOT NULL,
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER') NOT NULL,
    `reservationDate` DATE NOT NULL,
    `reservationTime` VARCHAR(5) NOT NULL,
    `dietaryRequests` TEXT NULL,
    `status` ENUM('REQUESTED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW') NOT NULL DEFAULT 'REQUESTED',
    `adminRemarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rest_resv_lookup_idx`(`restaurantId`, `reservationDate`, `reservationTime`),
    INDEX `rest_resv_status_date_idx`(`status`, `reservationDate`),
    INDEX `rest_resv_created_at_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RestaurantReservation`
ADD CONSTRAINT `RestaurantReservation_restaurantId_fkey`
FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
