"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import BookingSearch from "@/components/hotel/BookingSearch";
import { mediaAlt, mediaUrl } from "@/lib/utils";

const FALLBACK_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1571005127559-1fa6eb20aa7c?auto=format&fit=crop&w=2400&q=80",
    alt: "Sunlit resort pool surrounded by palms",
  },
  {
    src: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2400&q=80",
    alt: "Tropical villa terrace overlooking the sea",
  },
  {
    src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2400&q=80",
    alt: "Luxury hotel exterior at dusk",
  },
];

function resolveBannerMedia(banner) {
  return banner?.desktopMedia || banner?.mobileMedia || null;
}

function splitHeadline(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const wordVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 90, damping: 18 },
  },
};

export default function HeroBanner({ banners = [], brandName }) {
  const slides = useMemo(() => {
    if (banners.length) {
      return banners.map((banner, index) => {
        const media = resolveBannerMedia(banner);
        return {
          id: banner.id || `banner-${index}`,
          title: banner.title || "The quiet art of arriving",
          subtitle:
            banner.subtitle
            || "Sunlit rooms, considered service, and landscapes that slow the day.",
          ctaText: banner.ctaText || "Explore Rooms",
          ctaLink: banner.ctaLink || "/rooms",
          imageSrc: mediaUrl(media),
          imageAlt: mediaAlt(media, banner.title || "Hotel banner"),
          fallbackIndex: index % FALLBACK_IMAGES.length,
        };
      });
    }

    return [
      {
        id: "fallback-0",
        title: "The quiet art of arriving",
        subtitle: "Sunlit rooms, considered service, and landscapes that slow the day.",
        ctaText: "Explore Rooms",
        ctaLink: "/rooms",
        imageSrc: FALLBACK_IMAGES[0].src,
        imageAlt: FALLBACK_IMAGES[0].alt,
        fallbackIndex: 0,
      },
      {
        id: "fallback-1",
        title: "Stay where the day softens",
        subtitle: "Pool mornings, garden evenings, and hospitality that never rushes you.",
        ctaText: "Book Your Stay",
        ctaLink: "/booking",
        imageSrc: FALLBACK_IMAGES[1].src,
        imageAlt: FALLBACK_IMAGES[1].alt,
        fallbackIndex: 1,
      },
    ];
  }, [banners]);

  const [index, setIndex] = useState(0);
  const current = slides[index];
  const imageSrc = current.imageSrc || FALLBACK_IMAGES[current.fallbackIndex]?.src;
  const imageAlt = current.imageAlt || FALLBACK_IMAGES[current.fallbackIndex]?.alt || "Resort";
  const words = splitHeadline(current.title);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % slides.length);
    }, 7200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-[#13221c] text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="absolute inset-[-8%]"
            initial={{ scale: 1.08, x: "0%", y: "0%" }}
            animate={{
              scale: [1.08, 1.18, 1.1],
              x: ["0%", "-2.5%", "1.5%"],
              y: ["0%", "-1.5%", "1%"],
            }}
            transition={{
              duration: 18,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,16,13,0.55)_0%,rgba(8,16,13,0.18)_38%,rgba(8,16,13,0.35)_62%,rgba(8,16,13,0.78)_100%)]" />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(8,16,13,0.35)_70%)]"
            animate={{ opacity: [0.55, 0.75, 0.55] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/35 to-transparent" />

      <Container className="relative z-10 flex min-h-[100svh] flex-col pb-8 pt-[calc(var(--header-h)+2.5rem)] md:pb-10">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${current.id}`}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -12, filter: "blur(6px)", transition: { duration: 0.35 } }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
              }}
              className="mx-auto max-w-4xl"
            >
              <motion.p
                variants={wordVariants}
                className="mb-5 text-[11px] font-semibold tracking-[0.34em] text-white/80 uppercase md:text-xs"
              >
                {brandName || "Luxury Resort"}
              </motion.p>

              <h1 className="font-display text-[2.65rem] leading-[1.05] text-balance text-white sm:text-5xl md:text-7xl lg:text-[4.75rem]">
                {words.map((word, wordIndex) => (
                  <motion.span
                    key={`${current.id}-${word}-${wordIndex}`}
                    variants={wordVariants}
                    className="mr-[0.28em] inline-block last:mr-0"
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                variants={wordVariants}
                className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/82 md:mt-6 md:text-lg"
              >
                {current.subtitle}
              </motion.p>

              <motion.div
                variants={wordVariants}
                className="mt-8 flex flex-wrap items-center justify-center gap-3"
              >
                <Button
                  href={current.ctaLink || "/rooms"}
                  className="bg-white text-ink shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:bg-white/92"
                >
                  {current.ctaText || "Explore Rooms"}
                </Button>
                <Button
                  href="/booking"
                  variant="secondary"
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/18"
                >
                  Book Now
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {slides.length > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-2">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show slide ${slideIndex + 1}`}
                  onClick={() => setIndex(slideIndex)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    slideIndex === index
                      ? "w-11 bg-white"
                      : "w-3 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <BookingSearch variant="hero" />
      </Container>
    </section>
  );
}
