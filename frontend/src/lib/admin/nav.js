/**
 * Shared admin navigation + route permission map.
 * Keep in sync with sidebar links and AuthGate deep-link checks.
 */
export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", permission: null },
  { href: "/admin/bookings", label: "Bookings", permission: "bookings.read" },
  { href: "/admin/guests", label: "Guests", permission: "guests.read" },
  { href: "/admin/payments", label: "Payments", permission: "payments.read" },
  { href: "/admin/coupons", label: "Coupons", permission: "coupons.read" },
  { href: "/admin/tax-rates", label: "Tax rates", permission: "tax_rates.read" },
  { href: "/admin/reports", label: "Reports", permission: "reports.read" },
  { href: "/admin/inquiries", label: "Inquiries", permission: "inquiries.read" },
  { href: "/admin/newsletter", label: "Newsletter", permission: "newsletter.read" },
  { href: "/admin/rooms", label: "Rooms", permission: "rooms.read" },
  { href: "/admin/room-categories", label: "Room categories", permission: "room_categories.read" },
  { href: "/admin/amenities", label: "Amenities", permission: "amenities.read" },
  { href: "/admin/facilities", label: "Facilities", permission: "facilities.read" },
  { href: "/admin/events", label: "Events", permission: "events.read" },
  { href: "/admin/attractions", label: "Attractions", permission: "attractions.read" },
  { href: "/admin/restaurant", label: "Restaurant", permission: "restaurant.read" },
  { href: "/admin/blogs", label: "Blog", permission: "blogs.read" },
  { href: "/admin/banners", label: "Banners", permission: "banners.read" },
  { href: "/admin/packages", label: "Packages", permission: "packages.read" },
  { href: "/admin/gallery", label: "Gallery", permission: "gallery.read" },
  { href: "/admin/media", label: "Media", permission: "media.read" },
  { href: "/admin/faqs", label: "FAQs", permission: "faqs.read" },
  { href: "/admin/testimonials", label: "Testimonials", permission: "testimonials.read" },
  { href: "/admin/pages", label: "Pages", permission: "pages.read" },
  { href: "/admin/navigation", label: "Navigation", permission: "navigation.read" },
  { href: "/admin/policies", label: "Policies", permission: "policies.read" },
  { href: "/admin/users", label: "Users & roles", permission: "users.read" },
  { href: "/admin/notifications", label: "Notifications", permission: "notifications.read" },
  { href: "/admin/activity", label: "Activity", permission: "activity.read" },
  { href: "/admin/settings", label: "Settings", permission: "settings.read" },
];

/** Longest-prefix match for nested admin routes (e.g. /admin/bookings/:id). */
export function requiredPermissionForPath(pathname) {
  const path = String(pathname || "/admin").replace(/\/+$/, "") || "/admin";
  if (path === "/admin") return null;

  const matches = ADMIN_NAV
    .filter((item) => item.href !== "/admin" && (path === item.href || path.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0]?.permission || null;
}
