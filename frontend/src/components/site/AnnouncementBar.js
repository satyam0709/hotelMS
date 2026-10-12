"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "hotelms-announcement-dismiss";

function bannerHref(banner) {
  const link = banner?.ctaLink?.trim();
  if (!link) return "/packages";
  return link.startsWith("/") || link.startsWith("http") ? link : `/${link}`;
}

export default function AnnouncementBar({ banner }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!banner?.id) return;
    try {
      const dismissed = window.localStorage.getItem(`${STORAGE_PREFIX}-${banner.id}`);
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
  }, [banner?.id]);

  function dismiss() {
    if (banner?.id) {
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}-${banner.id}`, "1");
      } catch {
        /* ignore */
      }
    }
    setVisible(false);
  }

  if (!banner?.title) return null;

  const href = bannerHref(banner);
  const cta = banner.ctaText || "See details";
  const external = href.startsWith("http");

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative z-[60] border-b border-line/80 bg-canvas"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 blur-2xl"
          >
            <div
              className="aspect-[577/310] w-[36rem] bg-gradient-to-r from-brand-lime to-brand-green opacity-25"
              style={{
                clipPath:
                  "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
              }}
            />
          </div>

          <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-4 py-2 pr-12 text-center sm:flex-row sm:gap-4 sm:text-left">
            <p className="text-xs font-medium tracking-wide text-ink md:text-sm">
              {banner.title}
              {banner.subtitle ? (
                <span className="hidden text-ink/75 sm:inline"> — {banner.subtitle}</span>
              ) : null}
            </p>

            <span className="hidden size-1 rounded-full bg-brand-green sm:block" aria-hidden />

            {external ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/40",
                  "bg-white/50 px-3 py-1 text-xs font-semibold text-ink shadow-sm",
                  "transition-colors hover:bg-white hover:text-brand-green"
                )}
              >
                {cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            ) : (
              <Link
                href={href}
                className={cn(
                  "group inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/40",
                  "bg-white/50 px-3 py-1 text-xs font-semibold text-ink shadow-sm",
                  "transition-colors hover:bg-white hover:text-brand-green"
                )}
              >
                {cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-ink/70 transition-colors hover:text-ink"
            aria-label="Dismiss announcement"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
