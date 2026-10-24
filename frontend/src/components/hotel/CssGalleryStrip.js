"use client";

import Image from "next/image";
import Link from "next/link";
import { isGalleryVideo } from "@/lib/gallery-items";

export default function CssGalleryStrip({ items = [] }) {
  const slides = items.filter((item) => item?.src).slice(0, 12);
  if (!slides.length) return null;

  return (
    <div className="mt-8 -mx-4 overflow-x-auto px-4 [scrollbar-width:thin]">
      <ul className="flex snap-x snap-mandatory gap-3 pb-2 md:gap-4">
        {slides.map((item, index) => {
          const href = item.href || "/gallery";
          const video = isGalleryVideo(item);
          return (
            <li
              key={item.id || item.src}
              className="relative h-52 w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-accent-soft sm:w-72 md:h-64 md:w-80"
            >
              <Link href={href} className="block h-full w-full">
                {video ? (
                  <video
                    src={item.src}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                    aria-label={item.alt || item.caption || "Gallery video"}
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt || item.caption || "Resort gallery"}
                    fill
                    sizes="(max-width: 640px) 78vw, 320px"
                    className="object-cover"
                    quality={70}
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                )}
                {item.caption ? (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 text-sm text-white">
                    {item.caption}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
