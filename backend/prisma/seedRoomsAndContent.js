require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding rooms, categories, settings, and media assets...");

  // 1. Website Settings
  const existingSettings = await prisma.websiteSetting.findFirst({ select: { id: true } });
  const settingsData = {
    websiteName: "ExoStay - Hotel/Resort",
    phone: "+91 98765 43210",
    whatsapp: "+919876543210",
    email: "reservations@exostay.com",
    address: "Coastal Road, Serenity Bay, Goa 403001, India",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15383.25754593979!2d73.743144!3d15.545811!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbfc1d545f09f2d%3A0xbcf045479dc8c8d8!2sCandolim%20Beach!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
    currency: "INR",
    timezone: "Asia/Kolkata",
    defaultLanguage: "en",
    copyrightText: "© ExoStay - Hotel/Resort. All rights reserved.",
    socialLinksJson: {
      Facebook: "https://facebook.com/",
      Instagram: "https://instagram.com/",
      Twitter: "https://twitter.com/",
    },
    onlinePaymentEnabled: true,
    payAtHotelEnabled: true,
    receptionHours: "Front desk open 24 hours",
  };

  if (!existingSettings) {
    await prisma.websiteSetting.create({ data: settingsData });
    console.log("Created website settings.");
  } else {
    await prisma.websiteSetting.update({
      where: { id: existingSettings.id },
      data: settingsData,
    });
    console.log("Updated website settings.");
  }

  // 2. Tax Rate
  let tax = await prisma.taxRate.findFirst({ where: { name: "GST", deletedAt: null } });
  if (!tax) {
    tax = await prisma.taxRate.create({
      data: { name: "GST", percentage: 12, isDefault: true, isActive: true },
    });
  }

  // 3. Room Categories
  const categoriesDef = [
    { name: "Deluxe", slug: "deluxe", description: "Refined comfort with garden and natural light.", displayOrder: 1 },
    { name: "Suites", slug: "suites", description: "Spacious suites with private terraces and expansive living.", displayOrder: 2 },
    { name: "Premium", slug: "premium", description: "Elevated rooms with scenic pool views and premium finishes.", displayOrder: 3 },
  ];

  const categories = {};
  for (const cat of categoriesDef) {
    categories[cat.slug] = await prisma.roomCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isActive: true, deletedAt: null },
      create: { ...cat, isActive: true },
    });
  }

  // 4. Amenities
  const amenitiesDef = [
    { name: "Wi-Fi", slug: "wifi", icon: "wifi" },
    { name: "Air conditioning", slug: "ac", icon: "wind" },
    { name: "Mini bar", slug: "minibar", icon: "cup" },
    { name: "Rain shower", slug: "rain-shower", icon: "droplet" },
    { name: "Garden view", slug: "garden-view", icon: "trees" },
    { name: "Terrace", slug: "terrace", icon: "sun" },
    { name: "Bathtub", slug: "bathtub", icon: "bath" },
    { name: "Pool view", slug: "pool-view", icon: "waves" },
    { name: "Desk", slug: "desk", icon: "briefcase" },
    { name: "Room service", slug: "room-service", icon: "bell" },
  ];

  const amenities = {};
  for (const [index, item] of amenitiesDef.entries()) {
    amenities[item.slug] = await prisma.amenity.upsert({
      where: { slug: item.slug },
      update: { name: item.name, icon: item.icon, isActive: true, deletedAt: null, displayOrder: index },
      create: { ...item, displayOrder: index, isActive: true },
    });
  }

  // 5. Media Assets for Rooms
  const mediaDef = [
    { publicId: "room-deluxe-garden", url: "/assets/Room.jpg", secureUrl: "/assets/Room.jpg", altText: "Deluxe Garden Room" },
    { publicId: "room-terrace-suite", url: "/assets/room%202.jpg", secureUrl: "/assets/room%202.jpg", altText: "Terrace Suite" },
    { publicId: "room-premium-pool", url: "/assets/room%203.jpg", secureUrl: "/assets/room%203.jpg", altText: "Premium Pool View Room" },
    { publicId: "room-pool-view-suite", url: "/assets/Hero%201.jpg", secureUrl: "/assets/Hero%201.jpg", altText: "Pool View Suite" },
  ];

  const mediaMap = {};
  for (const item of mediaDef) {
    mediaMap[item.publicId] = await prisma.mediaAsset.upsert({
      where: { publicId: item.publicId },
      update: { url: item.url, secureUrl: item.secureUrl, altText: item.altText, isActive: true, deletedAt: null },
      create: {
        publicId: item.publicId,
        url: item.url,
        secureUrl: item.secureUrl,
        resourceType: "IMAGE",
        format: "jpg",
        altText: item.altText,
        caption: item.altText,
        isActive: true,
      },
    });
  }

  // 6. Rooms Definition
  const roomsDef = [
    {
      slug: "deluxe-garden-room",
      roomCode: "DLX-GARDEN",
      name: "Deluxe Garden Room",
      shortDescription: "Floor-to-ceiling windows open to palm-lined gardens and morning light.",
      description: "Our Deluxe Garden Room brings the tranquility of nature directly into your stay. Enjoy plush bedding, ambient lighting, high-speed Wi-Fi, and a rain shower designed for deep unwinding.",
      categorySlug: "deluxe",
      basePrice: 5200,
      weekendPrice: 5800,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 3,
      totalInventory: 10,
      bedType: "King",
      roomSize: "32 m²",
      isFeatured: true,
      extraBedAllowed: true,
      extraBedCharge: 1200,
      mediaId: mediaMap["room-deluxe-garden"].id,
      amenitySlugs: ["wifi", "rain-shower", "garden-view", "ac"],
    },
    {
      slug: "terrace-suite",
      roomCode: "TRC-SUITE",
      name: "Terrace Suite",
      shortDescription: "A private terrace, lounge seating, and space for unhurried mornings.",
      description: "A private terrace, lounge seating, and space for unhurried mornings. Includes a soaking bathtub, curated mini bar, and dedicated dining lounge.",
      categorySlug: "suites",
      basePrice: 8900,
      weekendPrice: 9800,
      maxAdults: 3,
      maxChildren: 2,
      maxOccupancy: 4,
      totalInventory: 6,
      bedType: "King + sofa bed",
      roomSize: "48 m²",
      isFeatured: true,
      extraBedAllowed: true,
      extraBedCharge: 1500,
      mediaId: mediaMap["room-terrace-suite"].id,
      amenitySlugs: ["terrace", "minibar", "bathtub", "wifi", "ac"],
    },
    {
      slug: "premium-pool-view",
      roomCode: "PRM-POOL",
      name: "Premium Pool View",
      shortDescription: "Balcony overlooking the pool deck with curated in-room amenities.",
      description: "Overlook the azure waters of the resort pool from your private balcony. Features modern workspace, plush queen bedding, and 24/7 room service.",
      categorySlug: "premium",
      basePrice: 6800,
      weekendPrice: 7500,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 3,
      totalInventory: 8,
      bedType: "Queen",
      roomSize: "36 m²",
      isFeatured: true,
      extraBedAllowed: true,
      extraBedCharge: 1200,
      mediaId: mediaMap["room-premium-pool"].id,
      amenitySlugs: ["pool-view", "desk", "room-service", "wifi", "ac"],
    },
    {
      slug: "pool-view-suite",
      roomCode: "PV-SUITE",
      name: "Pool View Suite",
      shortDescription: "A bright suite overlooking the lagoon pool with separate living area.",
      description: "An expansive suite positioned directly above the lagoon pool. Experience expansive balconies, luxury king bedding, and personalized turndown service.",
      categorySlug: "suites",
      basePrice: 9200,
      weekendPrice: 10200,
      maxAdults: 2,
      maxChildren: 2,
      maxOccupancy: 4,
      totalInventory: 6,
      bedType: "King",
      roomSize: "52 m²",
      isFeatured: false,
      extraBedAllowed: true,
      extraBedCharge: 1500,
      mediaId: mediaMap["room-pool-view-suite"].id,
      amenitySlugs: ["pool-view", "minibar", "bathtub", "wifi", "ac"],
    },
  ];

  for (const def of roomsDef) {
    const category = categories[def.categorySlug];
    const room = await prisma.room.upsert({
      where: { slug: def.slug },
      update: {
        roomCode: def.roomCode,
        name: def.name,
        shortDescription: def.shortDescription,
        description: def.description,
        roomCategoryId: category.id,
        taxRateId: tax.id,
        basePrice: def.basePrice,
        weekendPrice: def.weekendPrice,
        maxAdults: def.maxAdults,
        maxChildren: def.maxChildren,
        maxOccupancy: def.maxOccupancy,
        totalInventory: def.totalInventory,
        bedType: def.bedType,
        roomSize: def.roomSize,
        isFeatured: def.isFeatured,
        extraBedAllowed: def.extraBedAllowed,
        extraBedCharge: def.extraBedCharge,
        checkInTime: "14:00",
        checkOutTime: "11:00",
        isActive: true,
        deletedAt: null,
      },
      create: {
        slug: def.slug,
        roomCode: def.roomCode,
        name: def.name,
        shortDescription: def.shortDescription,
        description: def.description,
        roomCategoryId: category.id,
        taxRateId: tax.id,
        basePrice: def.basePrice,
        weekendPrice: def.weekendPrice,
        maxAdults: def.maxAdults,
        maxChildren: def.maxChildren,
        maxOccupancy: def.maxOccupancy,
        totalInventory: def.totalInventory,
        bedType: def.bedType,
        roomSize: def.roomSize,
        isFeatured: def.isFeatured,
        extraBedAllowed: def.extraBedAllowed,
        extraBedCharge: def.extraBedCharge,
        checkInTime: "14:00",
        checkOutTime: "11:00",
        isActive: true,
      },
    });

    // Room Media
    await prisma.roomMedia.upsert({
      where: { roomId_mediaId_usage: { roomId: room.id, mediaId: def.mediaId, usage: "featured" } },
      update: { isActive: true, deletedAt: null },
      create: {
        roomId: room.id,
        mediaId: def.mediaId,
        usage: "featured",
        displayOrder: 0,
        isActive: true,
      },
    });

    // Room Amenities
    for (const amenitySlug of def.amenitySlugs) {
      const amenity = amenities[amenitySlug];
      if (amenity) {
        await prisma.roomAmenity.upsert({
          where: { roomId_amenityId: { roomId: room.id, amenityId: amenity.id } },
          update: {},
          create: { roomId: room.id, amenityId: amenity.id },
        });
      }
    }

    console.log(`Seeded room: ${room.name} (${room.slug})`);
  }

  console.log("All rooms and content successfully seeded!");
}

main()
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
