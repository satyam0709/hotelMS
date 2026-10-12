-- AlterTable
ALTER TABLE `WebsiteSetting` ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaKeywords` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Page` ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaKeywords` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `NotificationSetting` ADD COLUMN `checkInReminderEnabled` BOOLEAN NOT NULL DEFAULT true;