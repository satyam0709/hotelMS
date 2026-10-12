"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { isGalleryVideo } from "@/lib/gallery-items";

export default function GalleryLightbox({ items = [], index, onClose, onChange }) {
  const current = index != null && index >= 0 ? items[index] : null;
  const total = items.length;
  const isVideo = isGalleryVideo(current);

  const go = useCallback(
    (direction) => {
      if (!total || index == null) return;
      onChange((index + direction + total) % total);
    },
    [index, onChange, total]
  );

  useEffect(() => {
    if (current == null) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [current, go, onClose]);

  return (
    <AnimatePresence>
      {current ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={isVideo ? "Video preview" : "Image preview"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-ink/92 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{current.caption || current.alt}</p>
              {total > 1 ? (
                <p className="text-xs text-white/70">{index + 1} of {total}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {current.href ? (
                <Link
                  href={current.href}
                  className="hidden rounded-full border border-white/25 px-3 py-1.5 text-xs font-medium hover:bg-white/10 sm:inline-flex"
                  onClick={onClose}
                >
                  View details
                </Link>
              ) : null}
              <button
                type="button"
                aria-label="Close gallery"
                onClick={onClose}
                className="ui-icon-button-motion inline-flex size-10 items-center justify-center rounded-full border border-white/25 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
            <div className="relative h-full w-full max-h-[min(72vh,900px)] max-w-6xl">
              {isVideo ? (
                <video
                  key={current.id || current.src}
                  src={current.src}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                  aria-label={current.alt || current.caption || "Gallery video"}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              )}
            </div>
            {total > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => go(-1)}
                  className="ui-icon-button-motion absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 md:left-6"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => go(1)}
                  className="ui-icon-button-motion absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20 md:right-6"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
