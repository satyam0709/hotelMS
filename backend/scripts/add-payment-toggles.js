const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addColumn(sql, label) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`${label}: added`);
  } catch (error) {
    console.log(`${label}: ${error.message}`);
  }
}

async function main() {
  await addColumn(
    "ALTER TABLE `WebsiteSetting` ADD COLUMN `onlinePaymentEnabled` BOOLEAN NOT NULL DEFAULT true",
    "onlinePaymentEnabled",
  );
  await addColumn(
    "ALTER TABLE `WebsiteSetting` ADD COLUMN `payAtHotelEnabled` BOOLEAN NOT NULL DEFAULT true",
    "payAtHotelEnabled",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
