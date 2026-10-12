"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ASPECT_CLASS, resolveImageSources } from "@/lib/site-assets";
import { cn } from "@/lib/utils";

export default function ImageCarousel({
  images = [],
  role = "gallery",
  aspect = "16/10",
  min = 1,
  autoplay = true,
  intervalMs = 5500,
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, 70vw",
  rounded = "rounded-[1.5rem]",
  showControls = true,
  showDots = true,
  altFallback = "Hotel photo",
}) {
  const slides = useMemo(
    () => resolveImageSources(images, { role, min }),
    [images, role, min],
  );
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const current = slides[index] || slides[0];
  const aspectClass = ASPECT_CLASS[current?.aspect || aspect] || ASPECT_CLASS[aspect] || "aspect-[16/10]";

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  useEffect(() => {
    if (!autoplay || count <= 1) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return undefined;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [autoplay, count, intervalMs, slides]);

  if (!current) return null;

  function go(delta) {
    setIndex((prev) => (prev + delta + count) % count);
  }

  return (
    <div className={cn("relative overflow-hidden border border-line bg-accent-soft shadow-soft", rounded, className)}>
      <div className={cn("relative w-full", aspectClass)}>
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt || altFallback}
          fill
          className={cn("object-cover", imageClassName)}
          sizes={sizes}
          priority={index === 0}
        />
      </div>

      {showControls && count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-ink/45 text-white backdrop-blur-sm transition hover:bg-ink/65"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-ink/45 text-white backdrop-blur-sm transition hover:bg-ink/65"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      {showDots && count > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
