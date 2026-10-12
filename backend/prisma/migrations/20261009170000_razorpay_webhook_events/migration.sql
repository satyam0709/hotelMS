-- CreateTable
CREATE TABLE `RazorpayWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RazorpayWebhookEvent_eventId_key`(`eventId`),
    INDEX `RazorpayWebhookEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
