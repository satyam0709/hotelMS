const fs = require("fs");
const path = require("path");

const base = "{{baseUrl}}";
const cookie = "{{cookieName}}={{adminToken}}";

function req(name, method, routePath, opts = {}) {
  const item = {
    name,
    request: {
      method,
      header: [],
      url: {
        raw: `${base}${routePath}`,
        host: ["{{baseUrl}}"],
        path: routePath.replace(/^\//, "").split("?")[0].split("/").filter(Boolean),
      },
      description: opts.description || "",
    },
  };
  if (opts.query) {
    item.request.url.query = opts.query;
    item.request.url.raw = `${base}${routePath}?${opts.query
      .filter((q) => !q.disabled)
      .map((q) => `${q.key}=${q.value || ""}`)
      .join("&")}`;
  }
  if (opts.body) {
    item.request.header.push({ key: "Content-Type", value: "application/json" });
    item.request.body = { mode: "raw", raw: JSON.stringify(opts.body, null, 2) };
  }
  if (opts.auth) {
    item.request.header.push({ key: "Cookie", value: cookie });
  }
  return item;
}

function folder(name, items) {
  return { name, item: items };
}

const listQ = [
  { key: "page", value: "1" },
  { key: "limit", value: "20" },
  { key: "search", value: "", disabled: true },
];

const collection = {
  info: {
    name: "HotelMS API",
    description:
      "Public + Admin API for HotelMS.\n\nAuth: POST /api/admin/auth/login sets an HttpOnly cookie (default name hotel_admin_access). Copy the cookie value into collection variable adminToken, or enable Postman's cookie jar for localhost:5000.\n\nSuccess envelope: { success: true, data }\nError envelope: { success: false, message, errorCode }",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "cookieName", value: "hotel_admin_access" },
    { key: "adminToken", value: "" },
    { key: "bookingRef", value: "HMS-XXXX" },
    { key: "guestEmail", value: "guest@example.com" },
    { key: "slug", value: "deluxe-room" },
    { key: "id", value: "cuid-here" },
  ],
  item: [
    folder("Health", [
      req("Health check", "GET", "/api/health", { description: "Service health. No auth." }),
    ]),
    folder("Admin Auth", [
      req("Login", "POST", "/api/admin/auth/login", {
        description: "Sets HttpOnly cookie. Rate limited 10 requests / 15 min.",
        body: { email: "admin@example.com", password: "ChangeMe123!" },
      }),
      req("Me", "GET", "/api/admin/auth/me", { auth: true, description: "Current admin + roles + permissions." }),
      req("Logout", "POST", "/api/admin/auth/logout", { auth: true }),
      req("Forgot password", "POST", "/api/admin/auth/forgot-password", {
        body: { email: "admin@example.com" },
      }),
      req("Reset password", "POST", "/api/admin/auth/reset-password", {
        body: { token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", password: "NewPass123456" },
      }),
      req("Change password", "PATCH", "/api/admin/auth/password", {
        auth: true,
        description: "Signed-in admin changes their own password.",
        body: { currentPassword: "ChangeMe123!", newPassword: "NewPass123456" },
      }),
    ]),
    folder("Public Content", [
      req("Settings", "GET", "/api/settings"),
      req("Navigation", "GET", "/api/navigation"),
      req("Page by slug", "GET", "/api/pages/{{slug}}"),
      req("Banners", "GET", "/api/banners"),
      req("Packages", "GET", "/api/packages", {
        query: [{ key: "featured", value: "true", disabled: true }],
      }),
      req("Package by slug", "GET", "/api/packages/{{slug}}"),
      req("Gallery", "GET", "/api/gallery"),
      req("Policy by slug", "GET", "/api/policies/{{slug}}"),
      req("Facilities", "GET", "/api/facilities", { query: listQ }),
      req("Facility by slug", "GET", "/api/facilities/{{slug}}"),
      req("Restaurant", "GET", "/api/restaurant"),
      req("Events", "GET", "/api/events"),
      req("Event by slug", "GET", "/api/events/{{slug}}"),
      req("Attractions", "GET", "/api/attractions", { query: listQ }),
      req("Attraction by slug", "GET", "/api/attractions/{{slug}}"),
      req("FAQs", "GET", "/api/faqs"),
      req("Testimonials", "GET", "/api/testimonials"),
      req("Blogs", "GET", "/api/blogs", { query: [{ key: "limit", value: "20" }] }),
      req("Blog by slug", "GET", "/api/blogs/{{slug}}"),
      req("Subscribe newsletter", "POST", "/api/newsletter/subscribe", {
        body: { email: "guest@example.com" },
      }),
      req("Create inquiry", "POST", "/api/inquiries", {
        body: {
          type: "CONTACT",
          name: "Guest Name",
          email: "guest@example.com",
          phone: "+911234567890",
          subject: "Question",
          message: "Hello from Postman",
        },
      }),
    ]),
    folder("Public Accommodation", [
      req("Room categories", "GET", "/api/room-categories", { query: listQ }),
      req("Room category by slug", "GET", "/api/room-categories/{{slug}}"),
      req("Amenities", "GET", "/api/amenities", { query: listQ }),
      req("Rooms", "GET", "/api/rooms", {
        query: [
          { key: "page", value: "1" },
          { key: "limit", value: "20" },
          { key: "isFeatured", value: "true", disabled: true },
        ],
      }),
      req("Room by slug", "GET", "/api/rooms/{{slug}}"),
    ]),
    folder("Public Availability & Booking", [
      req("Search availability", "GET", "/api/availability", {
        query: [
          { key: "checkIn", value: "2026-11-01" },
          { key: "checkOut", value: "2026-11-03" },
          { key: "adults", value: "2" },
          { key: "children", value: "0" },
          { key: "rooms", value: "1" },
        ],
      }),
      req("Create booking", "POST", "/api/bookings", {
        body: {
          checkIn: "2026-11-01",
          checkOut: "2026-11-03",
          guest: { fullName: "Guest Name", email: "guest@example.com", phone: "+911234567890" },
          rooms: [{ roomId: "{{id}}", quantity: 1, adults: 2, children: 0, extraBeds: 0 }],
          paymentMethod: "PAY_AT_HOTEL",
          specialRequests: null,
        },
      }),
      req("Lookup booking", "GET", "/api/bookings/{{bookingRef}}", {
        query: [
          { key: "email", value: "{{guestEmail}}" },
          { key: "phone", value: "{{guestPhone}}" },
        ],
      }),
      req("Public invoice", "GET", "/api/bookings/{{bookingRef}}/invoice", {
        query: [
          { key: "email", value: "{{guestEmail}}" },
          { key: "phone", value: "{{guestPhone}}" },
        ],
      }),
      req("Guest cancel request", "POST", "/api/bookings/{{bookingRef}}/cancel-request", {
        description:
          "Guest cancel: unpaid PENDING/PENDING_PAYMENT cancels immediately; paid/confirmed opens staff cancel-request inquiry. Requires email + phone.",
        body: {
          email: "{{guestEmail}}",
          phone: "{{guestPhone}}",
          reason: "Plans changed",
        },
      }),
    ]),
    folder("Public Payments", [
      req("Create Razorpay order", "POST", "/api/payments/razorpay/order", {
        body: {
          bookingRef: "{{bookingRef}}",
          email: "{{guestEmail}}",
          phone: "{{guestPhone}}",
        },
      }),
      req("Verify Razorpay payment", "POST", "/api/payments/razorpay/verify", {
        body: {
          bookingRef: "{{bookingRef}}",
          razorpayOrderId: "{{razorpayOrderId}}",
          razorpayPaymentId: "{{razorpayPaymentId}}",
          razorpaySignature: "{{razorpaySignature}}",
          email: "{{guestEmail}}",
          phone: "{{guestPhone}}",
        },
      }),
      req("Razorpay webhook", "POST", "/api/payments/razorpay/webhook", {
        description: "Called by Razorpay. Uses raw body + signature header.",
        body: {},
      }),
    ]),
    folder("Admin Users & Roles", [
      req("List permissions", "GET", "/api/admin/permissions", { auth: true }),
      req("List roles", "GET", "/api/admin/roles", { auth: true, query: listQ }),
      req("Create role", "POST", "/api/admin/roles", {
        auth: true,
        body: {
          name: "Front Desk",
          slug: "front-desk",
          description: "Booking and guest operations.",
          permissionIds: ["{{id}}"],
        },
      }),
      req("Update role", "PATCH", "/api/admin/roles/{{id}}", {
        auth: true,
        body: { name: "Front Desk Team", permissionIds: ["{{id}}"] },
      }),
      req("Delete role", "DELETE", "/api/admin/roles/{{id}}", { auth: true }),
      req("List users", "GET", "/api/admin/users", { auth: true, query: listQ }),
      req("Create user", "POST", "/api/admin/users", {
        auth: true,
        body: {
          name: "Front Desk User",
          email: "frontdesk@example.com",
          username: "frontdesk",
          password: "ChangeMe123!",
          status: "ACTIVE",
          roleIds: ["{{id}}"],
        },
      }),
      req("Update user", "PATCH", "/api/admin/users/{{id}}", {
        auth: true,
        body: { status: "ACTIVE", roleIds: ["{{id}}"] },
      }),
      req("Delete user", "DELETE", "/api/admin/users/{{id}}", { auth: true }),
    ]),
    folder("Admin Activity", [
      req("List activity logs", "GET", "/api/admin/activity", {
        auth: true,
        query: [
          { key: "page", value: "1" },
          { key: "limit", value: "20" },
          { key: "module", value: "bookings", disabled: true },
          { key: "action", value: "update", disabled: true },
          { key: "entityType", value: "Booking", disabled: true },
          { key: "userId", value: "{{id}}", disabled: true },
          { key: "from", value: "2026-10-08", disabled: true },
          { key: "to", value: "2026-10-08", disabled: true },
          { key: "search", value: "", disabled: true },
        ],
      }),
    ]),
    folder("Admin Settings & Navigation", [
      req("Get settings", "GET", "/api/admin/settings", { auth: true }),
      req("Update settings", "PATCH", "/api/admin/settings", {
        auth: true,
        body: {
          websiteName: "HotelMS Resort",
          phone: "+911234567890",
          onlinePaymentEnabled: true,
          payAtHotelEnabled: true,
        },
      }),
      req("List navigation", "GET", "/api/admin/navigation", { auth: true, query: listQ }),
      req("Create navigation", "POST", "/api/admin/navigation", {
        auth: true,
        body: { label: "Rooms", href: "/rooms", location: "HEADER", displayOrder: 0, isActive: true },
      }),
      req("Update navigation", "PATCH", "/api/admin/navigation/{{id}}", {
        auth: true,
        body: { label: "Accommodations" },
      }),
      req("Reorder navigation", "PATCH", "/api/admin/navigation/reorder", {
        auth: true,
        body: { items: [{ id: "{{id}}", displayOrder: 0 }] },
      }),
      req("Delete navigation", "DELETE", "/api/admin/navigation/{{id}}", { auth: true }),
    ]),
    folder("Admin Pages & Sections", [
      req("List pages", "GET", "/api/admin/pages", { auth: true, query: listQ }),
      req("Create page", "POST", "/api/admin/pages", {
        auth: true,
        body: { title: "About", slug: "about", isVisible: true },
      }),
      req("Get page", "GET", "/api/admin/pages/{{id}}", { auth: true }),
      req("Update page", "PATCH", "/api/admin/pages/{{id}}", {
        auth: true,
        body: { title: "About Us" },
      }),
      req("Publish page", "PATCH", "/api/admin/pages/{{id}}/publish", { auth: true }),
      req("Update page sections", "PATCH", "/api/admin/pages/{{id}}/sections", {
        auth: true,
        body: {
          sections: [
            {
              sectionKey: "intro",
              title: "Our story",
              description: "Text",
              displayOrder: 0,
              isEnabled: true,
            },
          ],
        },
      }),
      req("Delete page", "DELETE", "/api/admin/pages/{{id}}", { auth: true }),
    ]),
    folder("Admin Banners", [
      req("List banners", "GET", "/api/admin/banners", { auth: true, query: listQ }),
      req("Create banner", "POST", "/api/admin/banners", {
        auth: true,
        body: {
          title: "Spring offer",
          subtitle: "Save 15%",
          ctaText: "View offers",
          ctaLink: "/packages",
          isActive: true,
          displayOrder: 0,
        },
      }),
      req("Get banner", "GET", "/api/admin/banners/{{id}}", { auth: true }),
      req("Update banner", "PATCH", "/api/admin/banners/{{id}}", {
        auth: true,
        body: { isActive: true },
      }),
      req("Reorder banners", "PATCH", "/api/admin/banners/reorder", {
        auth: true,
        body: { items: [{ id: "{{id}}", displayOrder: 0 }] },
      }),
      req("Delete banner", "DELETE", "/api/admin/banners/{{id}}", { auth: true }),
    ]),
    folder("Admin Packages", [
      req("List packages", "GET", "/api/admin/packages", { auth: true, query: listQ }),
      req("Create package", "POST", "/api/admin/packages", {
        auth: true,
        body: {
          name: "Weekend Escape",
          slug: "weekend-escape",
          price: 9999,
          isActive: true,
          isFeatured: true,
        },
      }),
      req("Get package", "GET", "/api/admin/packages/{{id}}", { auth: true }),
      req("Update package", "PATCH", "/api/admin/packages/{{id}}", {
        auth: true,
        body: { isFeatured: true },
      }),
      req("Delete package", "DELETE", "/api/admin/packages/{{id}}", { auth: true }),
    ]),
    folder("Admin Gallery", [
      req("List categories", "GET", "/api/admin/gallery/categories", { auth: true, query: listQ }),
      req("Create category", "POST", "/api/admin/gallery/categories", {
        auth: true,
        body: { name: "Pool", slug: "pool", isActive: true },
      }),
      req("Update category", "PATCH", "/api/admin/gallery/categories/{{id}}", {
        auth: true,
        body: { name: "Poolside" },
      }),
      req("Delete category", "DELETE", "/api/admin/gallery/categories/{{id}}", { auth: true }),
      req("List items", "GET", "/api/admin/gallery/items", { auth: true, query: listQ }),
      req("Create item", "POST", "/api/admin/gallery/items", {
        auth: true,
        body: { categoryId: "{{id}}", mediaId: "{{id}}", title: "Sunrise pool", isActive: true },
      }),
      req("Update item", "PATCH", "/api/admin/gallery/items/{{id}}", {
        auth: true,
        body: { title: "Updated" },
      }),
      req("Delete item", "DELETE", "/api/admin/gallery/items/{{id}}", { auth: true }),
    ]),
    folder("Admin Media", [
      req("List media", "GET", "/api/admin/media", { auth: true, query: listQ }),
      req("Register media URL", "POST", "/api/admin/media/register", {
        auth: true,
        body: {
          url: "https://images.unsplash.com/photo-1571005127559-1fa6eb20aa7c?w=1600",
          altText: "Pool",
          resourceType: "IMAGE",
          folder: "external",
        },
      }),
      {
        name: "Upload media file (Cloudinary)",
        request: {
          method: "POST",
          header: [{ key: "Cookie", value: cookie }],
          body: {
            mode: "formdata",
            formdata: [
              { key: "file", type: "file", src: [], description: "Select an image/video file" },
              { key: "altText", type: "text", value: "Pool sunrise" },
              { key: "folder", type: "text", value: "gallery" },
              { key: "caption", type: "text", value: "", disabled: true },
              { key: "category", type: "text", value: "", disabled: true },
            ],
          },
          url: {
            raw: `${base}/api/admin/media/upload`,
            host: ["{{baseUrl}}"],
            path: ["api", "admin", "media", "upload"],
          },
          description:
            "Multipart upload to Cloudinary. Requires CLOUDINARY_* env vars. Max 15MB. Field name must be `file`.",
        },
      },
      req("Delete media", "DELETE", "/api/admin/media/{{id}}", {
        auth: true,
        description: "Soft-delete media asset (media.delete).",
      }),
    ]),
    folder("Admin Policies", [
      req("List policies", "GET", "/api/admin/policies", { auth: true, query: listQ }),
      req("Create policy", "POST", "/api/admin/policies", {
        auth: true,
        body: {
          type: "privacy",
          title: "Privacy Policy",
          slug: "privacy",
          content: "Full policy text",
          isPublished: true,
        },
      }),
      req("Update policy", "PATCH", "/api/admin/policies/{{id}}", {
        auth: true,
        body: { isPublished: true },
      }),
      req("Delete policy", "DELETE", "/api/admin/policies/{{id}}", { auth: true }),
    ]),
    folder("Admin Facilities Events Attractions", [
      req("List facilities", "GET", "/api/admin/facilities", { auth: true, query: listQ }),
      req("Create facility", "POST", "/api/admin/facilities", {
        auth: true,
        body: { name: "Spa", slug: "spa", category: "Wellness", isActive: true },
      }),
      req("Update facility", "PATCH", "/api/admin/facilities/{{id}}", {
        auth: true,
        body: { isActive: true },
      }),
      req("Delete facility", "DELETE", "/api/admin/facilities/{{id}}", { auth: true }),
      req("List events", "GET", "/api/admin/events", { auth: true, query: listQ }),
      req("Create event", "POST", "/api/admin/events", {
        auth: true,
        body: { name: "Grand Ballroom", slug: "grand-ballroom", capacity: 200, isActive: true },
      }),
      req("Update event", "PATCH", "/api/admin/events/{{id}}", {
        auth: true,
        body: { capacity: 250 },
      }),
      req("Delete event", "DELETE", "/api/admin/events/{{id}}", { auth: true }),
      req("List attractions", "GET", "/api/admin/attractions", { auth: true, query: listQ }),
      req("Create attraction", "POST", "/api/admin/attractions", {
        auth: true,
        body: { name: "Beach Point", slug: "beach-point", distance: "8 km", isActive: true },
      }),
      req("Update attraction", "PATCH", "/api/admin/attractions/{{id}}", {
        auth: true,
        body: { distance: "7 km" },
      }),
      req("Delete attraction", "DELETE", "/api/admin/attractions/{{id}}", { auth: true }),
    ]),
    folder("Admin Restaurant", [
      req("Get restaurant", "GET", "/api/admin/restaurant", { auth: true }),
      req("Save restaurant", "PATCH", "/api/admin/restaurant", {
        auth: true,
        body: { name: "Pavilion", slug: "pavilion", breakfastTime: "7-10", isActive: true },
      }),
      req("List menu categories", "GET", "/api/admin/restaurant/menu-categories", {
        auth: true,
        query: listQ,
      }),
      req("Create menu category", "POST", "/api/admin/restaurant/menu-categories", {
        auth: true,
        body: { name: "Mains", displayOrder: 0, isActive: true },
      }),
      req("Update menu category", "PATCH", "/api/admin/restaurant/menu-categories/{{id}}", {
        auth: true,
        body: { name: "Main courses" },
      }),
      req("Delete menu category", "DELETE", "/api/admin/restaurant/menu-categories/{{id}}", {
        auth: true,
      }),
      req("List menu items", "GET", "/api/admin/restaurant/menu-items", {
        auth: true,
        query: listQ,
      }),
      req("Create menu item", "POST", "/api/admin/restaurant/menu-items", {
        auth: true,
        body: { categoryId: "{{id}}", name: "Grilled fish", price: 850, isAvailable: true },
      }),
      req("Update menu item", "PATCH", "/api/admin/restaurant/menu-items/{{id}}", {
        auth: true,
        body: { price: 900 },
      }),
      req("Delete menu item", "DELETE", "/api/admin/restaurant/menu-items/{{id}}", { auth: true }),
    ]),
    folder("Admin FAQs", [
      req("List FAQ categories", "GET", "/api/admin/faq/categories", { auth: true, query: listQ }),
      req("Create FAQ category", "POST", "/api/admin/faq/categories", {
        auth: true,
        body: { name: "Stay", slug: "stay", isActive: true },
      }),
      req("Update FAQ category", "PATCH", "/api/admin/faq/categories/{{id}}", {
        auth: true,
        body: { isActive: true },
      }),
      req("Delete FAQ category", "DELETE", "/api/admin/faq/categories/{{id}}", { auth: true }),
      req("List FAQs", "GET", "/api/admin/faqs", { auth: true, query: listQ }),
      req("Create FAQ", "POST", "/api/admin/faqs", {
        auth: true,
        body: {
          categoryId: "{{id}}",
          question: "Check-in time?",
          answer: "From 2 PM",
          isActive: true,
        },
      }),
      req("Update FAQ", "PATCH", "/api/admin/faqs/{{id}}", {
        auth: true,
        body: { answer: "From 3 PM" },
      }),
      req("Delete FAQ", "DELETE", "/api/admin/faqs/{{id}}", { auth: true }),
    ]),
    folder("Admin Testimonials", [
      req("List testimonials", "GET", "/api/admin/testimonials", { auth: true, query: listQ }),
      req("Create testimonial", "POST", "/api/admin/testimonials", {
        auth: true,
        body: { guestName: "Asha", rating: 5, review: "Wonderful stay", isActive: true },
      }),
      req("Set approval", "PATCH", "/api/admin/testimonials/{{id}}/approval", {
        auth: true,
        body: { approvalStatus: "APPROVED" },
      }),
      req("Update testimonial", "PATCH", "/api/admin/testimonials/{{id}}", {
        auth: true,
        body: { rating: 5 },
      }),
      req("Delete testimonial", "DELETE", "/api/admin/testimonials/{{id}}", { auth: true }),
    ]),
    folder("Admin Blogs", [
      req("List blogs", "GET", "/api/admin/blogs", { auth: true, query: listQ }),
      req("Create blog", "POST", "/api/admin/blogs", {
        auth: true,
        body: {
          title: "Monsoon mornings",
          slug: "monsoon-mornings",
          content: "Paragraph one.\n\nParagraph two.",
          category: "Resort journal",
          status: "DRAFT",
        },
      }),
      req("Get blog", "GET", "/api/admin/blogs/{{id}}", { auth: true }),
      req("Update blog", "PATCH", "/api/admin/blogs/{{id}}", {
        auth: true,
        body: { excerpt: "Short teaser" },
      }),
      req("Publish blog", "PATCH", "/api/admin/blogs/{{id}}/publish", { auth: true }),
      req("Delete blog", "DELETE", "/api/admin/blogs/{{id}}", { auth: true }),
    ]),
    folder("Admin Coupons & Tax Rates", [
      req("List coupons", "GET", "/api/admin/coupons", { auth: true, query: listQ }),
      req("Create coupon", "POST", "/api/admin/coupons", {
        auth: true,
        body: {
          code: "WELCOME10",
          description: "10% off first stay",
          discountType: "PERCENTAGE",
          discountValue: 10,
          maxDiscountAmount: 2000,
          isActive: true,
        },
      }),
      req("Update coupon", "PATCH", "/api/admin/coupons/{{id}}", {
        auth: true,
        body: { isActive: true, usageLimit: 100 },
      }),
      req("Delete coupon", "DELETE", "/api/admin/coupons/{{id}}", { auth: true }),
      req("List tax rates", "GET", "/api/admin/tax-rates", { auth: true, query: listQ }),
      req("Create tax rate", "POST", "/api/admin/tax-rates", {
        auth: true,
        body: { name: "GST 12%", percentage: 12, isDefault: true, isActive: true },
      }),
      req("Update tax rate", "PATCH", "/api/admin/tax-rates/{{id}}", {
        auth: true,
        body: { percentage: 12, isActive: true },
      }),
      req("Delete tax rate", "DELETE", "/api/admin/tax-rates/{{id}}", { auth: true }),
    ]),
    folder("Admin Notifications", [
      req("Get notification settings", "GET", "/api/admin/notifications/settings", { auth: true }),
      req("Update notification settings", "PATCH", "/api/admin/notifications/settings", {
        auth: true,
        body: {
          smtpHost: "smtp.example.com",
          smtpPort: 587,
          smtpUser: "noreply@example.com",
          smtpPassword: "secret",
          fromEmail: "noreply@example.com",
          adminEmail: "ops@example.com",
          bookingEnabled: true,
          inquiryEnabled: true,
          cancellationEnabled: true,
        },
      }),
      req("List email logs", "GET", "/api/admin/notifications/logs", { auth: true, query: listQ }),
      req("List email templates", "GET", "/api/admin/notifications/templates", { auth: true }),
      req("Get email template", "GET", "/api/admin/notifications/templates/{{id}}", { auth: true }),
      req("Update email template", "PATCH", "/api/admin/notifications/templates/{{id}}", {
        auth: true,
        body: {
          subject: "Booking confirmed — {{bookingRef}}",
          bodyText: "Hello {{guestName}}, your booking {{bookingRef}} is confirmed.",
          isActive: true,
        },
      }),
    ]),
    folder("Admin Guests", [
      req("List guests", "GET", "/api/admin/guests", {
        auth: true,
        query: [
          ...listQ,
          { key: "search", value: "" },
          { key: "guestType", value: "" },
        ],
      }),
      req("Get guest", "GET", "/api/admin/guests/{{id}}", { auth: true }),
      req("Update guest", "PATCH", "/api/admin/guests/{{id}}", {
        auth: true,
        body: {
          fullName: "Guest Name",
          email: "guest@example.com",
          phone: "+911234567890",
          guestType: "VIP",
          notes: "Prefers high floor",
        },
      }),
      req("Delete guest", "DELETE", "/api/admin/guests/{{id}}", { auth: true }),
    ]),
    folder("Admin Inquiries & Newsletter", [
      req("List inquiries", "GET", "/api/admin/inquiries", { auth: true, query: listQ }),
      req("Get inquiry", "GET", "/api/admin/inquiries/{{id}}", { auth: true }),
      req("Update inquiry", "PATCH", "/api/admin/inquiries/{{id}}", {
        auth: true,
        body: { adminRemarks: "Called guest" },
      }),
      req("Set inquiry status", "PATCH", "/api/admin/inquiries/{{id}}/status", {
        auth: true,
        body: { status: "IN_PROGRESS" },
      }),
      req("Assign inquiry", "PATCH", "/api/admin/inquiries/{{id}}/assign", {
        auth: true,
        body: { assignedToId: null },
      }),
      req("List newsletter", "GET", "/api/admin/newsletter", { auth: true, query: listQ }),
      req("Update newsletter status", "PATCH", "/api/admin/newsletter/{{id}}", {
        auth: true,
        body: { status: "UNSUBSCRIBED" },
      }),
    ]),
    folder("Admin Rooms", [
      req("List room categories", "GET", "/api/admin/room-categories", { auth: true, query: listQ }),
      req("Create room category", "POST", "/api/admin/room-categories", {
        auth: true,
        body: { name: "Suites", slug: "suites", isActive: true },
      }),
      req("Get room category", "GET", "/api/admin/room-categories/{{id}}", { auth: true }),
      req("Update room category", "PATCH", "/api/admin/room-categories/{{id}}", {
        auth: true,
        body: { name: "Luxury Suites" },
      }),
      req("Delete room category", "DELETE", "/api/admin/room-categories/{{id}}", { auth: true }),
      req("List amenities", "GET", "/api/admin/amenities", { auth: true, query: listQ }),
      req("Create amenity", "POST", "/api/admin/amenities", {
        auth: true,
        body: { name: "Wi-Fi", slug: "wifi", isActive: true },
      }),
      req("Update amenity", "PATCH", "/api/admin/amenities/{{id}}", {
        auth: true,
        body: { name: "High-speed Wi-Fi" },
      }),
      req("Delete amenity", "DELETE", "/api/admin/amenities/{{id}}", { auth: true }),
      req("List rooms", "GET", "/api/admin/rooms", { auth: true, query: listQ }),
      req("Create room", "POST", "/api/admin/rooms", {
        auth: true,
        body: {
          name: "Deluxe Room",
          slug: "deluxe-room",
          roomCategoryId: "{{id}}",
          basePrice: 4500,
          maxAdults: 2,
          maxChildren: 1,
        },
      }),
      req("Get room", "GET", "/api/admin/rooms/{{id}}", { auth: true }),
      req("Update room", "PATCH", "/api/admin/rooms/{{id}}", {
        auth: true,
        body: { basePrice: 4800 },
      }),
      req("Set room amenities", "PUT", "/api/admin/rooms/{{id}}/amenities", {
        auth: true,
        body: { amenityIds: ["{{id}}"] },
      }),
      req("Set room media", "PUT", "/api/admin/rooms/{{id}}/media", {
        auth: true,
        body: { media: [{ mediaId: "{{id}}", usage: "hero", displayOrder: 0 }] },
      }),
      req("Set room status", "PATCH", "/api/admin/rooms/{{id}}/status", {
        auth: true,
        body: { isActive: true },
      }),
      req("Delete room", "DELETE", "/api/admin/rooms/{{id}}", { auth: true }),
      req("List room availability", "GET", "/api/admin/rooms/{{id}}/availability", {
        auth: true,
        query: [
          { key: "from", value: "2026-11-01" },
          { key: "to", value: "2026-11-30" },
        ],
      }),
      req("Upsert room availability", "PUT", "/api/admin/rooms/{{id}}/availability", {
        auth: true,
        body: { items: [{ date: "2026-11-01", availableUnits: 5, priceOverride: null }] },
      }),
      req("List room blocks", "GET", "/api/admin/rooms/{{id}}/blocks", { auth: true }),
      req("Create room block", "POST", "/api/admin/rooms/{{id}}/blocks", {
        auth: true,
        body: { startDate: "2026-12-01", endDate: "2026-12-05", reason: "Maintenance" },
      }),
      req("Update room block", "PATCH", "/api/admin/rooms/{{id}}/blocks/{{id}}", {
        auth: true,
        body: { reason: "Renovation" },
      }),
      req("Delete room block", "DELETE", "/api/admin/rooms/{{id}}/blocks/{{id}}", { auth: true }),
      req("List room rates", "GET", "/api/admin/rooms/{{id}}/rates", { auth: true }),
      req("Create room rate", "POST", "/api/admin/rooms/{{id}}/rates", {
        auth: true,
        body: {
          name: "Weekend",
          amount: 5500,
          startDate: "2026-11-01",
          endDate: "2026-11-30",
        },
      }),
      req("Update room rate", "PATCH", "/api/admin/rooms/{{id}}/rates/{{id}}", {
        auth: true,
        body: { amount: 5600 },
      }),
      req("Delete room rate", "DELETE", "/api/admin/rooms/{{id}}/rates/{{id}}", { auth: true }),
    ]),
    folder("Admin Bookings", [
      req("List bookings", "GET", "/api/admin/bookings", {
        auth: true,
        query: [
          { key: "page", value: "1" },
          { key: "limit", value: "20" },
          { key: "status", value: "CONFIRMED", disabled: true },
          { key: "checkInFrom", value: "2026-10-08", disabled: true },
          { key: "checkInTo", value: "2026-10-08", disabled: true },
          { key: "checkOutFrom", value: "2026-10-08", disabled: true },
          { key: "checkOutTo", value: "2026-10-08", disabled: true },
          { key: "search", value: "", disabled: true },
        ],
      }),
      req("Create booking (admin)", "POST", "/api/admin/bookings", {
        auth: true,
        body: {
          checkIn: "2026-11-01",
          checkOut: "2026-11-03",
          guest: { fullName: "Walk-in Guest", phone: "+911234567890" },
          rooms: [{ roomId: "{{id}}", quantity: 1, adults: 2, children: 0 }],
          paymentMethod: "PAY_AT_HOTEL",
          confirmImmediately: true,
        },
      }),
      req("Get booking", "GET", "/api/admin/bookings/{{id}}", { auth: true }),
      req("Update booking status", "PATCH", "/api/admin/bookings/{{id}}/status", {
        auth: true,
        body: { status: "CONFIRMED", note: "Paid at desk" },
      }),
      req("Cancel booking", "POST", "/api/admin/bookings/{{id}}/cancel", {
        auth: true,
        body: { reason: "Guest request" },
      }),
      req("Admin invoice", "GET", "/api/admin/bookings/{{id}}/invoice", { auth: true }),
    ]),
    folder("Admin Payments", [
      req("List payments", "GET", "/api/admin/payments", { auth: true, query: listQ }),
      req("Get payment", "GET", "/api/admin/payments/{{id}}", { auth: true }),
      req("Refund payment", "POST", "/api/admin/payments/{{id}}/refund", {
        auth: true,
        body: { amount: 1000, reason: "Partial refund" },
      }),
    ]),
    folder("Admin Reports", [
      req("Reports overview", "GET", "/api/admin/reports/overview", {
        auth: true,
        query: [
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Export bookings CSV", "GET", "/api/admin/reports/export", {
        auth: true,
        query: [
          { key: "type", value: "bookings" },
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Export bookings by stay CSV", "GET", "/api/admin/reports/export", {
        auth: true,
        query: [
          { key: "type", value: "bookings-stay" },
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Export payments CSV", "GET", "/api/admin/reports/export", {
        auth: true,
        query: [
          { key: "type", value: "payments" },
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Export inquiries CSV", "GET", "/api/admin/reports/export", {
        auth: true,
        query: [
          { key: "type", value: "inquiries" },
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Export summary CSV", "GET", "/api/admin/reports/export", {
        auth: true,
        query: [
          { key: "type", value: "summary" },
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Dashboard overview", "GET", "/api/admin/dashboard/overview", {
        auth: true,
        query: [
          { key: "from", value: "2026-10-01" },
          { key: "to", value: "2026-10-08" },
        ],
      }),
      req("Realtime SSE stream", "GET", "/api/admin/realtime/stream", {
        auth: true,
        description:
          "Server-Sent Events for booking/payment signals. Requires dashboard.read or bookings.read. Use Postman SSE / EventSource with cookie jar.",
      }),
    ]),
  ],
};

const out = path.join(__dirname, "..", "postman.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
const count = collection.item.reduce((n, f) => n + f.item.length, 0);
console.log(`Wrote ${out} (${count} requests, ${collection.item.length} folders)`);
