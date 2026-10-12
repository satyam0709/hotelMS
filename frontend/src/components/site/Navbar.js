"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { LogIn, Menu, Phone, X } from "lucide-react";
import Button from "@/components/ui/Button";
import NavbarLinks from "@/components/site/NavbarLinks";
import { siteConfig } from "@/lib/config";
import { mediaAlt, mediaUrl } from "@/lib/utils";

const fallbackLinks = [
  { label: "Home", href: "/" },
  { label: "Accommodations", href: "/rooms" },
  { label: "Amenities & Spa", href: "/facilities" },
  { label: "Dining", href: "/restaurant" },
  { label: "Activities", href: "/events" },
  { label: "Packages", href: "/packages" },
  { label: "About", href: "/about" },
];

export default function Navbar({ settings, navigation = [] }) {
  const [open, setOpen] = useState(false);

  const brand = settings?.websiteName || siteConfig.name;
  const logo = settings?.headerLogoMedia || settings?.logoMedia;
  const logoSrc = mediaUrl(logo);
  const links = navigation.length ? navigation : fallbackLinks;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative sticky top-0 z-50 border-b border-line/80 bg-elevated/95 backdrop-blur-md"
    >
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
          <div
            className="grid h-[var(--header-h)] grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-6"
          >
            <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={mediaAlt(logo, brand)}
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                  priority
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                  {brand.slice(0, 1)}
                </span>
              )}
              <span className="truncate font-display text-lg tracking-tight text-ink md:text-xl">
                {brand}
              </span>
            </Link>

            <div className="hidden min-w-0 justify-center lg:flex">
              <NavbarLinks links={links} variant="elevated" />
            </div>

            <div className="flex items-center justify-end gap-2">
              {settings?.phone ? (
                <a
                  href={`tel:${settings.phone}`}
                  className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:text-brand-green lg:inline-flex"
                >
                  <Phone className="size-4 shrink-0" />
                  <span className="max-w-[9rem] truncate">{settings.phone}</span>
                </a>
              ) : null}
              <Button
                href="/admin/login"
                size="sm"
                variant="secondary"
                className="hidden rounded-xl sm:inline-flex"
              >
                <LogIn className="size-4 shrink-0" aria-hidden />
                Login
              </Button>
              <Button
                href={siteConfig.bookingPath}
                size="sm"
                variant="navCta"
                className="hidden rounded-md sm:inline-flex"
              >
                Reserve now
              </Button>
              <button
                type="button"
                className="ui-icon-button-motion inline-flex size-11 items-center justify-center rounded-md border border-line bg-elevated text-ink lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 top-full z-40 border-b border-line bg-elevated shadow-soft lg:hidden"
          >
            <div className="mx-auto max-w-[1400px] overflow-hidden px-4 py-3">
              <nav className="flex flex-col p-3" aria-label="Mobile">
                <NavbarLinks
                  links={links}
                  compact
                  variant="elevated"
                  onItemClick={() => setOpen(false)}
                />
                <div className="mt-2 space-y-2 border-t border-line p-3">
                  <Button
                    href={siteConfig.bookingPath}
                    variant="navCta"
                    className="w-full rounded-md"
                    onClick={() => setOpen(false)}
                  >
                    Reserve now
                  </Button>
                  <Button
                    href="/admin/login"
                    variant="secondary"
                    className="w-full rounded-md"
                    onClick={() => setOpen(false)}
                  >
                    <LogIn className="size-4 shrink-0" aria-hidden />
                    Login
                  </Button>
                </div>
              </nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
