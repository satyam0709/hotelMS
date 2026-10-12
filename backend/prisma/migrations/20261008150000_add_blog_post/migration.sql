-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(120) NULL,
    `excerpt` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `authorName` VARCHAR(160) NULL,
    `coverMediaId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `BlogPost_isFeatured_displayOrder_idx`(`isFeatured`, `displayOrder`),
    INDEX `BlogPost_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BlogPost` ADD CONSTRAINT `BlogPost_coverMediaId_fkey` FOREIGN KEY (`coverMediaId`) REFERENCES `MediaAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
