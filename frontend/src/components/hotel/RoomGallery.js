"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomGallery({ images = [], roomName = "Room" }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = images[index] || null;

  const go = useCallback(
    (direction) => {
      if (!total) return;
      setIndex((value) => (value + direction + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (total <= 1) return undefined;
    function onKey(event) {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  if (!total) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] media-fallback-bg" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-accent-soft">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id || current.src || index}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={current.src}
              alt={current.alt || roomName}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </motion.div>
        </AnimatePresence>

        {total > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="ui-icon-button-motion absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-elevated/90 text-ink shadow-soft backdrop-blur-sm hover:bg-elevated"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="ui-icon-button-motion absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-elevated/90 text-ink shadow-soft backdrop-blur-sm hover:bg-elevated"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute right-4 bottom-4 rounded-full bg-ink/70 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {index + 1} / {total}
            </div>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              key={image.id || image.src || imageIndex}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`Show image ${imageIndex + 1}`}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition",
                imageIndex === index
                  ? "border-accent shadow-soft"
                  : "border-line opacity-80 hover:opacity-100"
              )}
            >
              <Image
                src={image.src}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
