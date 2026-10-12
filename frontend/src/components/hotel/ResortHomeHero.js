"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import BookingSearch from "@/components/hotel/BookingSearch";
import { bannerHref, bannerImageUrl } from "@/lib/banners";
import { siteConfig } from "@/lib/config";
import { mediaAlt } from "@/lib/utils";

const FALLBACK = {
  src: "/assets/hero-1-opt.jpg",
  alt: "Resort exterior at dusk",
  title: "Where timeless comfort meets a serene sanctuary",
  subtitle:
    "Thoughtful rooms, open-air dining, and curated experiences shaped for restorative stays.",
};

function slideFromBanner(banner, index) {
  const imageSrc = bannerImageUrl(banner) || FALLBACK.src;
  const media = banner?.desktopMedia || banner?.mobileMedia;
  return {
    id: banner.id || `banner-${index}`,
    title: banner.title || FALLBACK.title,
    subtitle: banner.subtitle || FALLBACK.subtitle,
    ctaText: banner.ctaText || "Discover more",
    ctaLink: bannerHref(banner),
    imageSrc,
    imageAlt: mediaAlt(media, banner.title || "Resort"),
  };
}

export default function ResortHomeHero({ banners = [], settings = {} }) {
  const slides = useMemo(() => {
    const list = Array.isArray(banners) ? banners.filter((b) => b?.title) : [];
    if (list.length) return list.map(slideFromBanner);
    return [
      {
        id: "fallback",
        ...FALLBACK,
        ctaText: "Discover more",
        ctaLink: "/about",
      },
    ];
  }, [banners]);

  const [index, setIndex] = useState(0);
  const current = slides[index];
  const eyebrow = settings?.tagline || settings?.websiteName || siteConfig.name;

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative isolate overflow-hidden bg-[#13221c] text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="absolute inset-0 min-h-[min(92vh,920px)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={current.imageSrc}
            alt={current.imageAlt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,16,13,0.42)_0%,rgba(8,16,13,0.12)_42%,rgba(8,16,13,0.55)_78%,rgba(8,16,13,0.88)_100%)]"
            aria-hidden
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex min-h-[min(92vh,920px)] flex-col">
        <Container className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-10 text-center md:pt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${current.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="mx-auto max-w-4xl"
            >
              <p className="text-[11px] font-semibold tracking-[0.32em] text-white/75 uppercase md:text-xs">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-display text-[2.35rem] leading-[1.08] text-balance sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                {current.title}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/82 md:mt-6 md:text-lg">
                {current.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:mt-10">
                <Button
                  href={current.ctaLink}
                  className="min-w-[10.5rem] rounded-md bg-white px-6 text-ink shadow-[0_12px_40px_rgba(0,0,0,0.22)] hover:bg-white/92"
                >
                  {current.ctaText}
                </Button>
                <Button
                  href="/facilities"
                  variant="secondary"
                  className="min-w-[10.5rem] rounded-md border-white/35 bg-transparent px-6 text-white hover:bg-white/10"
                >
                  Explore experiences
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {slides.length > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show slide ${slideIndex + 1}`}
                  onClick={() => setIndex(slideIndex)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    slideIndex === index ? "w-10 bg-white" : "w-2.5 bg-white/40 hover:bg-white/65"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </Container>

        <div className="relative z-20 mx-auto w-full max-w-[1200px] translate-y-10 px-4 pb-4 md:translate-y-14 md:pb-6">
          <BookingSearch variant="hero" />
        </div>
      </div>
    </section>
  );
}
