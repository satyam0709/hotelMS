"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  BookOpen,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  CreditCard,
  FileText,
  Folders,
  Gift,
  HelpCircle,
  ImageIcon,
  Images,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  MessageSquareQuote,
  Bell,
  Newspaper,
  Percent,
  ScrollText,
  Settings,
  Sparkles,
  TicketPercent,
  Upload,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { hasPermission } from "@/lib/admin/permissions";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

const ICONS = {
  "/admin": LayoutDashboard,
  "/admin/bookings": CalendarDays,
  "/admin/guests": Users,
  "/admin/payments": CreditCard,
  "/admin/coupons": TicketPercent,
  "/admin/tax-rates": Percent,
  "/admin/reports": ChartColumn,
  "/admin/inquiries": Mail,
  "/admin/newsletter": Newspaper,
  "/admin/rooms": BedDouble,
  "/admin/room-categories": Folders,
  "/admin/amenities": Sparkles,
  "/admin/facilities": Sparkles,
  "/admin/events": CalendarDays,
  "/admin/attractions": MapPin,
  "/admin/restaurant": UtensilsCrossed,
  "/admin/blogs": BookOpen,
  "/admin/banners": ImageIcon,
  "/admin/packages": Gift,
  "/admin/gallery": Images,
  "/admin/media": Upload,
  "/admin/faqs": HelpCircle,
  "/admin/testimonials": MessageSquareQuote,
  "/admin/pages": FileText,
  "/admin/navigation": Menu,
  "/admin/policies": ScrollText,
  "/admin/users": Users,
  "/admin/notifications": Bell,
  "/admin/activity": ClipboardList,
  "/admin/settings": Settings,
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin } = useAdminAuth();
  const navRef = useRef(null);

  const links = ADMIN_NAV.filter((item) => !item.permission || hasPermission(admin, item.permission));

  // Maintain sidebar scroll position across navigation
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const saved = sessionStorage.getItem("admin_sidebar_scroll");
    if (saved !== null) {
      nav.scrollTop = Number(saved);
    } else {
      const activeEl = nav.querySelector(".is-active");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [pathname]);

  const handleScroll = useCallback((e) => {
    sessionStorage.setItem("admin_sidebar_scroll", String(e.currentTarget.scrollTop));
  }, []);

  return (
    <aside className="admin-sidebar flex w-full flex-col border-b border-line bg-[#f7f5ef] md:h-full md:w-60 md:border-b-0 md:border-r">
      <div className="shrink-0 px-5 py-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">ExoStay</p>
        <p className="mt-1 font-display text-xl text-ink">Admin</p>
      </div>
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-y-auto md:pb-6"
      >
        {links.map((item) => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          const Icon = ICONS[item.href] || LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "admin-sidebar-link flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active && "is-active"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 hidden border-t border-line px-5 py-4 text-xs text-muted md:block">
        Signed in as {admin?.name || admin?.email}
      </div>
    </aside>
  );
}
