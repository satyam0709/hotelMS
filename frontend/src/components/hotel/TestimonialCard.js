"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { mediaAlt, mediaUrl } from "@/lib/utils";

/** Initials avatar with stable hue derived from name */
function AvatarFallback({ name }) {
  const initials = (name || "G")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const hues = [142, 160, 180, 195, 120, 90, 75];
  const hue = hues[(name?.charCodeAt(0) || 0) % hues.length];
  return (
    <span
      className="flex size-full items-center justify-center text-sm font-bold text-white"
      style={{ background: `hsl(${hue} 45% 38%)` }}
    >
      {initials || "G"}
    </span>
  );
}

/** 5-star row */
function Stars({ rating = 5 }) {
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="size-4"
          fill={i < n ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i < n ? 0 : 1.5}
        >
          <path d="M10 1.5l2.4 4.85 5.35.78-3.87 3.77.91 5.32L10 13.7l-4.79 2.52.91-5.32L2.25 7.13l5.35-.78L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default function TestimonialCard({ item }) {
  const imageSrc = mediaUrl(item.guestImageMedia);
  const rating = Math.max(1, Math.min(5, Number(item.rating) || 5));

  return (
    <motion.article
      className="relative flex h-full flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.28 } }}
    >
      {/* ── Speech bubble card ── */}
      <div className="relative flex-1 rounded-[1.75rem] border-2 border-brand-green/20 bg-sand-soft px-6 pb-6 pt-8 shadow-[0_8px_32px_rgba(44,103,0,0.10)]">

        {/* Opening quote badge — top-left */}
        <span
          aria-hidden="true"
          className="absolute -left-2 -top-3 flex size-9 select-none items-center justify-center rounded-lg bg-brand-green text-xl font-black leading-none text-white shadow-md"
        >
          &ldquo;
        </span>

        {/* Polaroid avatar — top-right */}
        <div className="absolute -right-3 -top-4 rounded-xl border-2 border-brand-green/25 bg-white p-1 shadow-[3px_3px_0_rgba(44,103,0,0.15)]">
          <div className="relative size-14 overflow-hidden rounded-lg bg-accent-soft">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={mediaAlt(item.guestImageMedia, item.guestName)}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <AvatarFallback name={item.guestName} />
            )}
          </div>
        </div>

        {/* Stars */}
        <div className="mb-3 text-brand-green">
          <Stars rating={rating} />
        </div>

        {/* Review text */}
        <p className="text-sm italic leading-relaxed text-ink/85">
          &ldquo;{item.review}&rdquo;
        </p>

        {/* Attribution: guest NAME (not "source") */}
        <p className="mt-4 text-right text-sm font-semibold text-brand-green">
          &mdash;&nbsp;{item.guestName}
        </p>

        {/* Closing quote badge — bottom-right */}
        <span
          aria-hidden="true"
          className="absolute -bottom-3 -right-2 flex size-9 select-none items-center justify-center rounded-lg border border-brand-green/20 bg-sand-soft text-xl font-black leading-none text-brand-green shadow-sm"
        >
          &rdquo;
        </span>
      </div>

      {/* ── Speech-bubble tail ── */}
      <div className="flex justify-center">
        <div
          className="h-4 w-8"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: "color-mix(in srgb, var(--brand-green) 20%, transparent)",
          }}
        />
      </div>
      <div className="-mt-px flex justify-center">
        <div
          className="h-3 w-6"
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: "var(--sand-soft)",
          }}
        />
      </div>
    </motion.article>
  );
}
