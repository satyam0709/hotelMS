require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../src/utils/password");

const prisma = new PrismaClient();

const defaultAdmin = {
  name: process.env.DEFAULT_ADMIN_NAME || "ExoStay Super Admin",
  email: (process.env.DEFAULT_ADMIN_EMAIL || "").trim().toLowerCase(),
  username: (process.env.DEFAULT_ADMIN_USERNAME || "").trim(),
  password: process.env.DEFAULT_ADMIN_PASSWORD || "",
};

const roles = [
  {
    name: "Super Admin",
    slug: "super-admin",
    description: "Full access to all admin modules.",
    isSystem: true,
  },
  {
    name: "Manager",
    slug: "manager",
    description: "Operational access for content, bookings, rooms, inquiries, and reports.",
    isSystem: true,
  },
  {
    name: "Staff",
    slug: "staff",
    description: "Limited access for booking, guest, and inquiry operations.",
    isSystem: true,
  },
  {
    name: "Demo Viewer",
    slug: "demo-read-only",
    description: "Read-only access for the shared product demo.",
    isSystem: true,
  },
];

const permissionGroups = {
  // dashboard.read gates SSE (/admin/realtime/stream) alongside bookings.read
  dashboard: ["read"],
  settings: ["read", "update"],
  pages: ["read", "create", "update", "delete"],
  sections: ["read", "create", "update", "delete"],
  banners: ["read", "create", "update", "delete"],
  navigation: ["read", "create", "update", "delete"],
  policies: ["read", "create", "update", "delete"],
  media: ["read", "upload", "update", "delete"],
  room_categories: ["read", "create", "update", "delete"],
  // Accommodation inventory/rates/blocks use rooms.* (not a separate inventory.* module)
  rooms: ["read", "create", "update", "delete"],
  amenities: ["read", "create", "update", "delete"],
  facilities: ["read", "create", "update", "delete"],
  restaurant: ["read", "create", "update", "delete"],
  events: ["read", "create", "update", "delete"],
  attractions: ["read", "create", "update", "delete"],
  packages: ["read", "create", "update", "delete"],
  gallery: ["read", "create", "update", "delete"],
  testimonials: ["read", "create", "update", "delete", "approve"],
  faqs: ["read", "create", "update", "delete"],
  blogs: ["read", "create", "update", "delete", "publish"],
  inquiries: ["read", "create", "update", "delete", "assign"],
  newsletter: ["read", "update", "delete"],
  guests: ["read", "update", "delete"],
  bookings: ["read", "create", "update", "cancel"],
  payments: ["read", "update", "refund"],
  reports: ["read", "export"],
  notifications: ["read", "update"],
  coupons: ["read", "create", "update", "delete"],
  tax_rates: ["read", "create", "update", "delete"],
  users: ["read", "create", "update", "delete"],
  roles: ["read", "create", "update", "delete"],
  activity: ["read"],
};

const managerModules = [
  "dashboard",
  "settings",
  "pages",
  "sections",
  "banners",
  "navigation",
  "policies",
  "media",
  "room_categories",
  "rooms",
  "amenities",
  "facilities",
  "restaurant",
  "events",
  "attractions",
  "packages",
  "gallery",
  "testimonials",
  "faqs",
  "blogs",
  "inquiries",
  "newsletter",
  "guests",
  "bookings",
  "payments",
  "reports",
  "notifications",
  "coupons",
  "tax_rates",
  "activity",
];

const staffPermissions = [
  "dashboard.read",
  "bookings.read",
  "bookings.create",
  "bookings.update",
  "bookings.cancel",
  "guests.read",
  "guests.update",
  "inquiries.read",
  "inquiries.update",
  "inquiries.assign",
  "rooms.read",
  "rooms.update",
  "payments.read",
];

async function main() {
  if (Boolean(defaultAdmin.email) !== Boolean(defaultAdmin.username)) {
    throw new Error("Set both DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_USERNAME, or leave both unset for an existing installation.");
  }

  const permissionRecords = [];

  for (const [module, actions] of Object.entries(permissionGroups)) {
    for (const action of actions) {
      const key = `${module}.${action}`;
      const permission = await prisma.permission.upsert({
        where: { key },
        update: {
          module,
          action,
          description: `${action} access for ${module}`,
        },
        create: {
          key,
          module,
          action,
          description: `${action} access for ${module}`,
        },
      });
      permissionRecords.push(permission);
    }
  }

  const roleRecords = {};

  for (const role of roles) {
    roleRecords[role.slug] = await prisma.role.upsert({
      where: { slug: role.slug },
      update: role,
      create: role,
    });
  }

  const superAdminPermissions = permissionRecords;
  const managerPermissions = permissionRecords.filter((permission) =>
    managerModules.includes(permission.module)
  );
  const staffPermissionRecords = permissionRecords.filter((permission) =>
    staffPermissions.includes(permission.key)
  );
  const demoReadPermissions = permissionRecords.filter((permission) =>
    permission.action === "read" &&
    !["activity", "notifications", "roles", "users"].includes(permission.module)
  );

  const assignments = [
    [roleRecords["super-admin"], superAdminPermissions],
    [roleRecords.manager, managerPermissions],
    [roleRecords.staff, staffPermissionRecords],
    [roleRecords["demo-read-only"], demoReadPermissions],
  ];

  for (const [role, permissions] of assignments) {
    if (role.slug === "demo-read-only") {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    }
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  await ensureDefaultAdmin(roleRecords["super-admin"]);

  await seedDemoViewer(roleRecords["demo-read-only"]);

  const { ensureDefaultTemplates } = require("../src/services/notification.service");
  await ensureDefaultTemplates();
  console.log("Seeded roles, permissions, email templates, and default admin bootstrap.");

  await seedCoreContent();
  console.log("Seeded core website content (settings, rooms, CMS samples).");
}

async function ensureDefaultAdmin(superAdminRole) {
  const where = defaultAdmin.email
    ? {
        OR: [
          { email: defaultAdmin.email },
          { username: defaultAdmin.username },
        ],
        deletedAt: null,
      }
    : {
        status: "ACTIVE",
        deletedAt: null,
        roles: { some: { role: { slug: "super-admin" } } },
      };
  const existingAdmin = await prisma.adminUser.findFirst({
    where,
    select: { id: true },
  });

  if (!defaultAdmin.email) {
    if (!existingAdmin) {
      throw new Error("No active admin exists. Set DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_USERNAME, and a unique DEFAULT_ADMIN_PASSWORD of at least 16 characters to create one.");
    }
    console.log("Existing Super Admin detected; skipped bootstrap because DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_USERNAME are unset.");
    return;
  }

  if (!existingAdmin) {
    if (defaultAdmin.password.length < 16) {
      throw new Error("Set a unique DEFAULT_ADMIN_PASSWORD of at least 16 characters before creating the first admin.");
    }
    const passwordHash = await hashPassword(defaultAdmin.password);
    await prisma.adminUser.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        username: defaultAdmin.username,
        passwordHash,
        status: "ACTIVE",
        roles: { create: { roleId: superAdminRole.id } },
      },
    });
    console.log(`Created default super admin: ${defaultAdmin.email}`);
    return;
  }

  const updateData = {
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    username: defaultAdmin.username,
    status: "ACTIVE",
    roles: {
      deleteMany: {},
      create: { roleId: superAdminRole.id },
    },
  };
  if (process.env.DEFAULT_ADMIN_UPDATE_PASSWORD === "true") {
    if (defaultAdmin.password.length < 16) {
      throw new Error("Set a unique DEFAULT_ADMIN_PASSWORD of at least 16 characters before updating the admin password.");
    }
    updateData.passwordHash = await hashPassword(defaultAdmin.password);
  }
  await prisma.adminUser.update({
    where: { id: existingAdmin.id },
    data: updateData,
  });
  console.log(`Ensured default super admin role: ${defaultAdmin.email}`);
}

async function seedDemoViewer(demoRole) {
  const enabled = process.env.DEMO_READ_ONLY_ENABLED || "false";
  if (!["true", "false"].includes(enabled.toLowerCase())) {
    throw new Error("DEMO_READ_ONLY_ENABLED must be either true or false.");
  }
  if (enabled.toLowerCase() !== "true") {
    await prisma.adminUser.updateMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        roles: { some: { role: { slug: "demo-read-only" } } },
      },
      data: { status: "INACTIVE" },
    });
    console.log("Skipped read-only demo account (DEMO_READ_ONLY_ENABLED is not true).");
    return;
  }

  const email = (process.env.DEMO_READ_ONLY_EMAIL || "").trim().toLowerCase();
  const username = (process.env.DEMO_READ_ONLY_USERNAME || "").trim();
  const password = process.env.DEMO_READ_ONLY_PASSWORD || "";
  const name = (process.env.DEMO_READ_ONLY_NAME || "HotelMS Demo Viewer").trim();
  if (!email || !username || password.length < 16) {
    throw new Error("Set DEMO_READ_ONLY_EMAIL, DEMO_READ_ONLY_USERNAME, and a DEMO_READ_ONLY_PASSWORD of at least 16 characters.");
  }
  if (email === defaultAdmin.email || username === defaultAdmin.username) {
    throw new Error("The read-only demo account must not share the super admin email or username.");
  }

  const existingSelect = {
    id: true,
    roles: { select: { role: { select: { slug: true } } } },
  };
  const existingByEmail = await prisma.adminUser.findUnique({ where: { email }, select: existingSelect });
  const existingByUsername = await prisma.adminUser.findUnique({ where: { username }, select: existingSelect });
  if (existingByEmail && existingByUsername && existingByEmail.id !== existingByUsername.id) {
    throw new Error("The configured demo email and username belong to different admin accounts.");
  }
  const existing = existingByEmail || existingByUsername;
  if (
    existing &&
    !existing.roles?.some(({ role }) => role.slug === "demo-read-only")
  ) {
    throw new Error("The configured demo email or username already belongs to a non-demo admin account.");
  }
  const updatePassword = process.env.DEMO_READ_ONLY_UPDATE_PASSWORD === "true";
  const data = {
    name,
    email,
    username,
    status: "ACTIVE",
    deletedAt: null,
    roles: {
      deleteMany: {},
      create: { roleId: demoRole.id },
    },
  };

  if (existing) {
    if (updatePassword) data.passwordHash = await hashPassword(password);
    await prisma.adminUser.update({ where: { id: existing.id }, data });
  } else {
    await prisma.adminUser.create({ data: { ...data, passwordHash: await hashPassword(password) } });
  }
  console.log(`Ensured read-only demo account: ${email}`);
}

async function seedCoreContent() {
  const existingSettings = await prisma.websiteSetting.findFirst({ select: { id: true } });
  if (!existingSettings) {
    await prisma.websiteSetting.create({
      data: {
        websiteName: "ExoStay - Hotel/Resort",
        phone: "+91 98765 43210",
        whatsapp: "+919876543210",
        email: "reservations@exostay.com",
        address: "Coastal Road, Serenity Bay",
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
      },
    });
  }

  let tax = await prisma.taxRate.findFirst({ where: { name: "GST", deletedAt: null } });
  if (!tax) {
    tax = await prisma.taxRate.create({
      data: { name: "GST", percentage: 12, isDefault: true, isActive: true },
    });
  }

  const category = await prisma.roomCategory.upsert({
    where: { slug: "suites" },
    update: { name: "Suites", description: "Spacious suites with garden or pool outlooks.", isActive: true, deletedAt: null },
    create: {
      name: "Suites",
      slug: "suites",
      description: "Spacious suites with garden or pool outlooks.",
      displayOrder: 1,
      isActive: true,
    },
  });

  const amenities = [
    { name: "Wi-Fi", slug: "wifi", icon: "wifi" },
    { name: "Air conditioning", slug: "ac", icon: "wind" },
    { name: "Mini bar", slug: "minibar", icon: "cup" },
  ];
  for (const [index, item] of amenities.entries()) {
    await prisma.amenity.upsert({
      where: { slug: item.slug },
      update: { name: item.name, icon: item.icon, isActive: true, deletedAt: null, displayOrder: index },
      create: { ...item, displayOrder: index, isActive: true },
    });
  }

  const rooms = [
    {
      slug: "deluxe-garden-room",
      roomCode: "DLX-GARDEN",
      name: "Deluxe Garden Room",
      shortDescription: "Floor-to-ceiling windows open to palm-lined gardens.",
      basePrice: 5200,
      weekendPrice: 5800,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 3,
      totalInventory: 8,
      bedType: "King",
      roomSize: "38 sqm",
      isFeatured: true,
      extraBedAllowed: true,
      extraBedCharge: 1200,
    },
    {
      slug: "pool-view-suite",
      roomCode: "PV-SUITE",
      name: "Pool View Suite",
      shortDescription: "A bright suite overlooking the lagoon pool.",
      basePrice: 8900,
      weekendPrice: 9800,
      maxAdults: 2,
      maxChildren: 2,
      maxOccupancy: 4,
      totalInventory: 4,
      bedType: "King",
      roomSize: "52 sqm",
      isFeatured: true,
      extraBedAllowed: true,
      extraBedCharge: 1500,
    },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { slug: room.slug },
      update: {
        ...room,
        roomCategoryId: category.id,
        taxRateId: tax.id,
        isActive: true,
        deletedAt: null,
        checkInTime: "14:00",
        checkOutTime: "11:00",
      },
      create: {
        ...room,
        roomCategoryId: category.id,
        taxRateId: tax.id,
        description: room.shortDescription,
        isActive: true,
        checkInTime: "14:00",
        checkOutTime: "11:00",
      },
    });
  }

  const poolFacility = await prisma.facility.upsert({
    where: { slug: "infinity-pool" },
    update: { name: "Infinity Pool", isActive: true, deletedAt: null },
    create: {
      name: "Infinity Pool",
      slug: "infinity-pool",
      description: "Lagoon-edge pool with daybeds and poolside service.",
      displayOrder: 1,
      isActive: true,
    },
  });

  const poolMediaExists = await prisma.facilityMedia.findFirst({
    where: { facilityId: poolFacility.id },
  });
  if (!poolMediaExists) {
    let poolAsset = await prisma.mediaAsset.findFirst({
      where: { url: { contains: "Hero" }, deletedAt: null },
    });
    if (!poolAsset) {
      poolAsset = await prisma.mediaAsset.create({
        data: {
          url: "/assets/Hero%201.jpg",
          secureUrl: "/assets/Hero%201.jpg",
          altText: "Infinity Pool overlooking resort grounds",
          caption: "Infinity Pool",
          resourceType: "IMAGE",
          isActive: true,
        },
      });
    }
    await prisma.facilityMedia.create({
      data: {
        facilityId: poolFacility.id,
        mediaId: poolAsset.id,
        displayOrder: 0,
      },
    });
  }

  const bannerCount = await prisma.banner.count({ where: { deletedAt: null } });
  if (bannerCount === 0) {
    await prisma.banner.create({
      data: {
        title: "Quiet luxury by the water",
        subtitle: "Suites, spa, and open-air dining at ExoStay - Hotel/Resort",
        ctaText: "Explore suites",
        ctaLink: "/rooms",
        displayOrder: 1,
        isActive: true,
      },
    });
  }

  const faqCategory = await prisma.faqCategory.upsert({
    where: { slug: "stays" },
    update: { name: "Stays", isActive: true, deletedAt: null },
    create: { name: "Stays", slug: "stays", displayOrder: 1, isActive: true },
  });

  const faqExists = await prisma.faq.findFirst({
    where: { question: { contains: "check-in" }, deletedAt: null },
  });
  if (!faqExists) {
    await prisma.faq.create({
      data: {
        categoryId: faqCategory.id,
        question: "What are the check-in and check-out times?",
        answer: "Check-in is from 2:00 PM and check-out is by 11:00 AM unless arranged otherwise.",
        displayOrder: 1,
        isActive: true,
      },
    });
  }

  const testimonialCount = await prisma.testimonial.count({ where: { deletedAt: null } });
  if (testimonialCount === 0) {
    await prisma.testimonial.create({
      data: {
        guestName: "Ananya Mehta",
        rating: 5,
        review: "Calm rooms, attentive staff, and a pool we never wanted to leave.",
        approvalStatus: "APPROVED",
        isActive: true,
        displayOrder: 1,
      },
    });
  }

  await prisma.packageOffer.upsert({
    where: { slug: "weekend-escape" },
    update: { name: "Weekend Escape", isActive: true, deletedAt: null },
    create: {
      name: "Weekend Escape",
      slug: "weekend-escape",
      description: "Two nights with breakfast and spa credit for a restorative weekend.",
      price: 14900,
      duration: "2 nights",
      displayOrder: 1,
      isFeatured: true,
      isActive: true,
    },
  });

  const navItems = [
    { label: "Home", href: "/", location: "HEADER", displayOrder: 1 },
    { label: "Rooms", href: "/rooms", location: "HEADER", displayOrder: 2 },
    { label: "Dining", href: "/restaurant", location: "HEADER", displayOrder: 3 },
    { label: "Facilities", href: "/facilities", location: "HEADER", displayOrder: 4 },
    { label: "Packages", href: "/packages", location: "HEADER", displayOrder: 5 },
    { label: "Gallery", href: "/gallery", location: "HEADER", displayOrder: 6 },
    { label: "Contact", href: "/contact", location: "HEADER", displayOrder: 7 },
  ];
  for (const item of navItems) {
    const existing = await prisma.navigationMenuItem.findFirst({
      where: { href: item.href, location: item.location, deletedAt: null },
    });
    if (!existing) {
      await prisma.navigationMenuItem.create({ data: { ...item, isActive: true } });
    }
  }

  await seedCmsPages();
}

async function seedCmsPages() {
  const about = await prisma.page.upsert({
    where: { slug: "about" },
    update: {
      title: "About Us",
      status: "PUBLISHED",
      isVisible: true,
      deletedAt: null,
      publishedAt: new Date(),
      metaTitle: "About Us",
      metaDescription: "Our story, hospitality philosophy, and the spirit of the resort.",
    },
    create: {
      title: "About Us",
      slug: "about",
      status: "PUBLISHED",
      isVisible: true,
      displayOrder: 1,
      publishedAt: new Date(),
      metaTitle: "About Us",
      metaDescription: "Our story, hospitality philosophy, and the spirit of the resort.",
    },
  });

  const aboutSectionCount = await prisma.pageSection.count({
    where: { pageId: about.id, deletedAt: null },
  });
  if (aboutSectionCount === 0) {
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: about.id,
          sectionKey: "story",
          title: "A place shaped by stillness",
          subtitle: "Our story",
          description: "ExoStay - Hotel/Resort was created for unhurried mornings, thoughtful dining, and restorative stays by the water.",
          displayOrder: 0,
          isEnabled: true,
        },
        {
          pageId: about.id,
          sectionKey: "hospitality",
          title: "Hospitality with intention",
          subtitle: "Philosophy",
          description: "Every detail — from room light to garden paths — is designed to feel calm, personal, and quietly luxurious.",
          displayOrder: 1,
          isEnabled: true,
        },
      ],
    });
  }

  const home = await prisma.page.upsert({
    where: { slug: "home" },
    update: {
      title: "Home",
      status: "PUBLISHED",
      isVisible: true,
      deletedAt: null,
      publishedAt: new Date(),
      metaTitle: "Home",
      metaDescription: "Homepage section visibility controls for ExoStay.",
    },
    create: {
      title: "Home",
      slug: "home",
      status: "PUBLISHED",
      isVisible: true,
      displayOrder: 0,
      publishedAt: new Date(),
      metaTitle: "Home",
      metaDescription: "Homepage section visibility controls for ExoStay.",
    },
  });

  const homeKeys = [
    "hero",
    "about",
    "rooms",
    "gallery",
    "facilities",
    "offers",
    "testimonials",
    "journal",
    "local_guide",
    "newsletter",
    "cta",
  ];
  const existingHomeSections = await prisma.pageSection.findMany({
    where: { pageId: home.id, deletedAt: null },
    select: { sectionKey: true },
  });
  const existingKeys = new Set(existingHomeSections.map((row) => row.sectionKey));
  const missing = homeKeys.filter((key) => !existingKeys.has(key));
  if (missing.length) {
    await prisma.pageSection.createMany({
      data: missing.map((sectionKey, index) => ({
        pageId: home.id,
        sectionKey,
        title: sectionKey.replaceAll("_", " "),
        displayOrder: homeKeys.indexOf(sectionKey) >= 0 ? homeKeys.indexOf(sectionKey) : index,
        isEnabled: true,
      })),
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
