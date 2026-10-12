"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/ui/Button";
import { VignetteTile } from "@/components/hotel/GalleryPreviewGrid";
import { cn } from "@/lib/utils";

const COLS = 3;
const AUTO_MS = 2000;
const TRANSITION = { duration: 0.5, ease: [0.32, 0.72, 0, 1] };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function uniqueBySrc(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item?.src || seen.has(item.src)) continue;
    seen.add(item.src);
    out.push(item);
  }
  return out;
}

function buildPages(items) {
  const unique = uniqueBySrc(items);
  if (!unique.length) return [];

  while (unique.length < COLS) {
    const src = unique[unique.length % Math.max(unique.length, 1)];
    unique.push({ ...src, id: `fill-${unique.length}` });
  }

  const pages = [];
  if (unique.length >= COLS * 2) {
    const usable = unique.slice(0, unique.length - (unique.length % COLS));
    for (let i = 0; i < usable.length; i += COLS) {
      pages.push(usable.slice(i, i + COLS));
    }
  } else {
    for (let offset = 0; offset < unique.length; offset += 1) {
      pages.push(
        Array.from({ length: COLS }, (_, i) => {
          const src = unique[(offset + i) % unique.length];
          return { ...src, id: `${src.id}-p${offset}-${i}` };
        }),
      );
    }
  }

  return pages.length ? pages : [unique.slice(0, COLS)];
}

export default function ResortVignettesCarousel({ items = [] }) {
  const reducedMotion = usePrefersReducedMotion();
  const pages = useMemo(() => buildPages(items), [items]);
  const pageCount = pages.length;

  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    setPageIndex(0);
  }, [pages]);

  useEffect(() => {
    if (pageCount < 2) return undefined;
    const timer = window.setInterval(() => {
      setDirection(1);
      setPageIndex((prev) => (prev + 1) % pageCount);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [pageCount]);

  if (!pageCount) {
    return (
      <div className="mt-10 rounded-2xl border border-line bg-elevated/60 px-6 py-12 text-center text-sm text-muted">
        Gallery previews will load shortly.
      </div>
    );
  }

  const safeIndex = ((pageIndex % pageCount) + pageCount) % pageCount;
  const currentPage = pages[safeIndex] || [];

  return (
    <div className="mt-10 space-y-8">
      <div className="overflow-hidden" aria-label="Resort vignettes carousel">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`page-${safeIndex}`}
            custom={direction}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? 80 : -80 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? -80 : 80 }
            }
            transition={TRANSITION}
            className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          >
            {currentPage.map((item, i) => (
              <div key={`${item.id}-${safeIndex}-${i}`} className="min-w-0">
                <VignetteTile item={item} className="w-full" />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {pageCount > 1 ? (
        <div className="flex justify-center gap-1.5" aria-label="Gallery pages">
          {pages.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              aria-label={`Show set ${i + 1}`}
              onClick={() => {
                setDirection(i > safeIndex ? 1 : -1);
                setPageIndex(i);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === safeIndex ? "w-6 bg-accent" : "w-2 bg-line hover:bg-muted",
              )}
            />
          ))}
        </div>
      ) : null}

      <div className="flex justify-center">
        <Button href="/gallery" variant="secondary">View full gallery</Button>
      </div>
    </div>
  );
}
