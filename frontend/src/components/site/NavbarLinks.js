"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function NavbarLinks({ links = [], compact = false, variant = "cream", onItemClick }) {
  const onCream = variant === "cream";
  const pathname = usePathname();
  const [hovered, setHovered] = useState(null);

  return (
    <nav
      className={cn("relative flex items-center", compact ? "flex-col gap-1" : "hidden gap-0.5 lg:flex")}
      aria-label="Primary"
      onMouseLeave={() => setHovered(null)}
    >
      {links.map((item) => {
        const href = item.href;
        const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
        const showPill = hovered === href || (hovered === null && active);

        return (
          <Link
            key={item.id || href}
            href={href}
            onMouseEnter={() => setHovered(href)}
            onClick={() => onItemClick?.()}
            className={cn(
              "group relative rounded-md px-2.5 py-2 text-[13px] font-semibold tracking-wide transition-colors duration-200 xl:px-3",
              compact ? "w-full px-4 py-3 text-base" : "",
              active
                ? "text-brand-green"
                : onCream
                  ? "text-black/80 hover:text-black"
                  : "text-ink/80 hover:text-brand-green"
            )}
          >
            {showPill ? (
              <motion.span
                layoutId={compact ? "nav-pill-mobile" : "nav-pill-desktop"}
                className={cn(
                  "absolute inset-0 rounded-full",
                  active && hovered === null
                    ? "bg-gradient-to-r from-brand-lime/35 via-brand-warm/50 to-brand-lime/25 ring-1 ring-brand-green/25"
                    : "bg-gradient-to-r from-brand-warm/55 via-brand-lime/35 to-brand-warm/40 shadow-[0_4px_18px_rgba(146,205,0,0.22)]"
                )}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>

            {!compact ? (
              <AnimatePresence>
                {hovered === href ? (
                  <motion.span
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 480, damping: 28 }}
                    className="pointer-events-none absolute top-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-green px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white uppercase shadow-[0_8px_24px_rgba(44,103,0,0.35)]"
                  >
                    {item.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
