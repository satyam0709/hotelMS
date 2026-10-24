"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  Compass,
  Play,
  Sparkles,
  Star,
  Waves,
  ShieldCheck,
  X,
  CheckCircle2,
} from "lucide-react";
import BookingSearch from "@/components/hotel/BookingSearch";
import HeroSphereLazy from "@/components/hotel/HeroSphereLazy";
import { siteConfig } from "@/lib/config";
import { mediaAlt, mediaUrl } from "@/lib/utils";

const HOTEL_SPHERE_ITEMS = [
  { image: "/assets/hero-1-opt.jpg", link: "/rooms" },
  { image: "/assets/Room.jpg", link: "/rooms" },
  { image: "/assets/room%202.jpg", link: "/rooms" },
  { image: "/assets/room%203.jpg", link: "/rooms" },
  { image: "/assets/Hero%201.jpg", link: "/rooms" },
  { image: "/assets/Rexception.jpg", link: "/facilities" },
  { image: "/assets/image%201.jpg", link: "/facilities" },
  { image: "/assets/image%202.jpg", link: "/facilities" },
  { image: "/assets/image%203.jpg", link: "/facilities" },
  { image: "/assets/image%204.jpg", link: "/restaurant" },
  { image: "/assets/image%205.jpg", link: "/facilities" },
  { image: "/assets/image%206.jpg", link: "/rooms" },
  { image: "/assets/image%207.jpg", link: "/facilities" },
  { image: "/assets/image%208.jpg", link: "/restaurant" },
  { image: "/assets/parking%202.jpg", link: "/facilities" },
];

const CURATED_SLIDES = [
  {
    id: "slide-infinity-pool",
    tag: "SIGNATURE RESORT SANCTUARY",
    badge: "Forbes 5-Star Distinction 2025",
    accentWord: "Coastal Sanctuary",
    titlePrefix: "Where Timeless Comfort Meets ",
    titleSuffix: "",
    subtitle:
      "Experience bespoke hospitality at ExoStay. Sun-drenched private suites, ocean-view infinity pools, and Michelin-inspired culinary artistry shaped for restorative luxury.",
    ctaText: "Explore Suites & Villas",
    ctaLink: "/rooms",
    secondaryCta: "Reserve Your Stay",
    secondaryLink: "/booking",
    vignetteTitle: "Infinity Horizon Pool",
    vignetteKicker: "Sanctuary",
    vignettePrice: "From ₹5,200/nt",
    imageSrc: "/assets/hero-1-opt.jpg",
    imageAlt: "ExoStay resort infinity pool and gardens at sunset",
  },
  {
    id: "slide-luxury-suites",
    tag: "RESTFUL ARCHITECTURE",
    badge: "Private Terrace Living",
    accentWord: "Unhurried Living",
    titlePrefix: "Sanctuary Suites Designed for ",
    titleSuffix: "",
    subtitle:
      "Natural timbers, floor-to-ceiling garden horizons, marble soaking baths, and thoughtful turn-down rituals designed for deep restoration.",
    ctaText: "Discover Room Types",
    ctaLink: "/rooms",
    secondaryCta: "Check Rates",
    secondaryLink: "/booking",
    vignetteTitle: "Garden & Terrace Suites",
    vignetteKicker: "Living",
    vignettePrice: "From ₹8,900/nt",
    imageSrc: "/assets/Room.jpg",
    imageAlt: "ExoStay luxury guest suite with private balcony",
  },
  {
    id: "slide-coastal-dining",
    tag: "CULINARY HORIZONS",
    badge: "Michelin-Inspired Menus",
    accentWord: "Artisan Traditions",
    titlePrefix: "Open-Air Coastal Dining & ",
    titleSuffix: "",
    subtitle:
      "From sunrise garden breakfasts to candlelit oceanfront tasting dinners, every plate celebrates fresh seasonal botanicals and coastal harvests.",
    ctaText: "View Dining Menus",
    ctaLink: "/restaurant",
    secondaryCta: "Book a Table",
    secondaryLink: "/contact",
    vignetteTitle: "Pavilion Dining Lounge",
    vignetteKicker: "Culinary",
    vignettePrice: "Chef's Tasting",
    imageSrc: "/assets/image%204.jpg",
    imageAlt: "ExoStay outdoor dining pavilion with ambient evening light",
  },
  {
    id: "slide-grand-arrival",
    tag: "BESPOKE CONCIERGE",
    badge: "24/7 Personalized Hospitality",
    accentWord: "Around You",
    titlePrefix: "An Arrival Experience Crafted ",
    titleSuffix: "",
    subtitle:
      "Dedicated concierge care, private thermal wellness retreats, and curated locale excursions from the moment you step through our doors.",
    ctaText: "Spa & Facilities",
    ctaLink: "/facilities",
    secondaryCta: "Curated Packages",
    secondaryLink: "/packages",
    vignetteTitle: "Grand Reception & Spa",
    vignetteKicker: "Arrival",
    vignettePrice: "24/7 Concierge",
    imageSrc: "/assets/Rexception.jpg",
    imageAlt: "ExoStay grand reception arrival hall",
  },
];

const TRUST_DISTINCTIONS = [
  { icon: Award, label: "Forbes 5-Star 2025" },
  { icon: Sparkles, label: "Michelin-Starred Dining" },
  { icon: Waves, label: "Private Thermal Spa" },
  { icon: Star, label: "4.9★ Exceptional (1,280+ Reviews)" },
];

export default function LuxuryInteractiveHero({ banners = [], settings = {} }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, rx: 0, ry: 0 });
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Merge CMS banners with curated luxury slides so we ALWAYS have 4 rich experiences from our assets
  const slides = useMemo(() => {
    const list = Array.isArray(banners) ? banners.filter((b) => b?.title) : [];
    // Start with all 4 curated luxury slides from assets
    const result = [...CURATED_SLIDES];

    // If CMS banners exist, enhance the slides while preserving the full 4-slide showcase
    list.forEach((banner, i) => {
      const media = banner?.desktopMedia || banner?.mobileMedia;
      const customImg = mediaUrl(media);
      const fallback = CURATED_SLIDES[i % CURATED_SLIDES.length];
      result[i] = {
        id: banner.id || `banner-${i}`,
        tag: banner.kicker || fallback.tag,
        badge: banner.badge || fallback.badge,
        accentWord: fallback.accentWord,
        titlePrefix: banner.title || fallback.titlePrefix,
        titleSuffix: "",
        subtitle: banner.subtitle || fallback.subtitle,
        ctaText: banner.ctaText || fallback.ctaText,
        ctaLink: banner.ctaLink || fallback.ctaLink,
        secondaryCta: fallback.secondaryCta,
        secondaryLink: fallback.secondaryLink,
        vignetteTitle: banner.title?.slice(0, 26) || fallback.vignetteTitle,
        vignetteKicker: banner.kicker || fallback.vignetteKicker,
        vignettePrice: fallback.vignettePrice,
        imageSrc: customImg || fallback.imageSrc,
        imageAlt: mediaAlt(media, banner.title || fallback.imageAlt),
      };
    });

    return result;
  }, [banners]);

  const current = slides[index] || slides[0];
  const rawBrand = settings?.websiteName || siteConfig.name;
  const hotelName = !rawBrand || /hotel\s*l?ms/i.test(rawBrand) ? "ExoStay - Hotel/Resort" : rawBrand;

  // Auto-play slides with pause on hover
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isVideoModalOpen) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused, isVideoModalOpen]);

  // OriginKit & 3D Parallax Pointer tracker
  const handlePointerMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({
      x,
      y,
      rx: -y * 12, // 3D tilt X
      ry: x * 12, // 3D tilt Y
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0, rx: 0, ry: 0 });
    setIsPaused(false);
  }, []);

  const handlePrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Magical Ambient 3D Particle Canvas System (Living Embers & Stardust)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Particle pool: warm gold stardust & emerald dusk embers
    const particleCount = Math.min(50, Math.floor(width / 30));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.45 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      color: Math.random() > 0.4 ? "255, 207, 121" : "146, 205, 0", // gold or lime
    }));

    let mouseClientX = -1000;
    let mouseClientY = -1000;

    const onMouseMove = (ev) => {
      const rect = canvas.getBoundingClientRect();
      mouseClientX = ev.clientX - rect.left;
      mouseClientY = ev.clientY - rect.top;
    };
    window.addEventListener("pointermove", onMouseMove, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulse += p.pulseSpeed;
        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

        // Soft cursor repulsion / vortex
        const dx = mouseClientX - p.x;
        const dy = mouseClientY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          const force = (1 - dist / 140) * 1.5;
          p.x -= (dx / dist) * force;
          p.y -= (dy / dist) * force;
        }

        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.pulse) * 0.25;

        // Wrap around boundaries
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Render glowing particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha.toFixed(3)})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = p.size * 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMouseMove);
    };
  }, []);

  return (
    <>
      <section
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onMouseEnter={() => setIsPaused(true)}
        className="relative isolate min-h-[100svh] w-full overflow-hidden bg-[#0a130f] text-white flex flex-col justify-between"
        aria-label="ExoStay Luxury Hotel & Resort"
      >
        {/* Dynamic 3D Parallax Photo Backdrop */}
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
          <AnimatePresence mode="sync">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: 1,
                scale: 1.04,
                x: mousePos.x * -24,
                y: mousePos.y * -18,
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 8, ease: "linear" },
                x: { duration: 0.35, ease: "easeOut" },
                y: { duration: 0.35, ease: "easeOut" },
              }}
              className="absolute inset-[-5%] will-change-transform"
            >
              <Image
                src={current.imageSrc}
                alt={current.imageAlt}
                fill
                priority={index === 0}
                quality={92}
                className="object-cover object-center select-none"
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>

          {/* Deep Cinematic Atmosphere Scrims */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#08100c] via-[#08100c]/60 to-[#08100c]/40"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(8,16,12,0.65)_100%)]"
            aria-hidden="true"
          />

          {/* Dynamic Interactive Cursor Glow Spotlight (OriginKit / 3D Lighting) */}
          <div
            className="absolute inset-0 transition-opacity duration-700 opacity-70 pointer-events-none"
            style={{
              background: `radial-gradient(circle 600px at ${50 + mousePos.x * 40}% ${
                50 + mousePos.y * 40
              }%, rgba(146, 205, 0, 0.14), rgba(255, 207, 121, 0.08) 40%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Living Ambient Stardust Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-[1] w-full h-full"
          aria-hidden="true"
        />

        {/* Top Navbar Clearance Spacing */}
        <div className="pt-24 sm:pt-28 md:pt-30" />

        {/* Hero Main Content Stage */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-5 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Kinetic Headlines & Actions */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              {/* OriginKit Style Live Brand Badges */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-2.5 sm:gap-3"
              >
                {/* Emerald Pulse Live Beacon */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-white backdrop-blur-xl shadow-lg hover:border-[#92cd00]/50 transition-colors">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#92cd00] opacity-80" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-[#92cd00] shadow-[0_0_10px_#92cd00]" />
                  </span>
                  <span className="text-[#92cd00] font-bold">{hotelName}</span>
                  <span className="text-white/35">·</span>
                  <span className="text-[#ffcf79]">{current.tag}</span>
                </div>

                {/* Rating Badge */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md shadow-sm">
                  <Star className="size-3.5 text-[#ffcf79] fill-[#ffcf79]" />
                  <span>4.9 / 5 Guest Distinction</span>
                </div>
              </motion.div>

              {/* Kinetic Luxury Headline with Animated Gold Shimmer */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-3 sm:space-y-3.5"
                >
                  <h1 className="font-display text-3xl sm:text-5xl md:text-5xl lg:text-[3.9rem] font-bold tracking-tight text-white leading-[1.08] max-w-3xl drop-shadow-xl">
                    {current.titlePrefix}
                    {current.accentWord ? (
                      <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffe6a3] to-[#92cd00] animate-gold-shimmer">
                        {current.accentWord}
                      </span>
                    ) : null}
                    {current.titleSuffix}
                  </h1>

                  <p className="max-w-xl text-sm sm:text-base md:text-lg text-white/85 font-light leading-relaxed">
                    {current.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* OriginKit Action Triggers & Micro-Animations */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1"
              >
                {/* Primary Booking CTA */}
                <Link
                  href={current.secondaryLink || "/booking"}
                  className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#2c6700] to-[#3d8c00] hover:from-[#357a00] hover:to-[#4aa800] text-white px-7 py-3.5 text-sm sm:text-base font-semibold transition-all duration-300 shadow-[0_12px_35px_rgba(44,103,0,0.45)] hover:shadow-[0_18px_45px_rgba(44,103,0,0.65)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{current.secondaryCta}</span>
                  <div className="size-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white/30">
                    <ArrowRight className="size-3.5" />
                  </div>
                </Link>

                {/* Explore Suites CTA */}
                <Link
                  href={current.ctaLink || "/rooms"}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 hover:border-white/70 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 text-sm sm:text-base font-medium backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                >
                  <span>{current.ctaText}</span>
                </Link>

                {/* Interactive 4K Cinematic Experience Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/35 hover:bg-black/60 text-white/90 hover:text-white px-4 py-2.5 text-xs sm:text-sm font-medium backdrop-blur-md transition-all duration-300 cursor-pointer hover:border-[#ffcf79]/50"
                  aria-label="Watch 4K Cinematic Tour"
                >
                  <span className="relative flex size-6 items-center justify-center rounded-full bg-[#ffcf79]/20 text-[#ffcf79] transition-transform group-hover:scale-110">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ffcf79] opacity-40" />
                    <Play className="size-2.5 fill-current ml-0.5" />
                  </span>
                  <span>Cinematic 4K Tour</span>
                </button>
              </motion.div>

              {/* Slide Navigator & Seamless Controls */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === index
                          ? "w-8 bg-[#92cd00] shadow-[0_0_8px_#92cd00]"
                          : "w-2.5 bg-white/35 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-white/60 ml-1">
                  {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous slide"
                    className="size-7 rounded-full border border-white/20 bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-90 cursor-pointer shadow-sm"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next slide"
                    className="size-7 rounded-full border border-white/20 bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all backdrop-blur-md active:scale-90 cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: OriginKit Sphere Gallery 3D */}
            <div className="lg:col-span-6 hidden md:flex flex-col items-center justify-center relative w-full h-[520px] lg:h-[620px] xl:h-[680px] -mt-16 lg:-mt-20">
              {/* Ambient Backlight Glow */}
              <div
                className="absolute inset-0 pointer-events-none rounded-full blur-3xl opacity-40"
                style={{ background: "radial-gradient(circle at center, rgba(146, 205, 0, 0.22) 0%, rgba(255, 207, 121, 0.12) 40%, transparent 72%)" }}
                aria-hidden="true"
              />
              {/* Sphere Gallery 3D WebGL Canvas */}
              <div className="relative w-full h-full -translate-y-10 lg:-translate-y-14">
                <HeroSphereLazy images={HOTEL_SPHERE_ITEMS} />
              </div>
              {/* Floating Interaction Hint */}
              <div className="absolute bottom-2 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md shadow-lg pointer-events-none">
                <Sparkles className="size-3 text-[#ffcf79]" />
                <span>Interactive 3D Resort Sphere · Drag to rotate · Click photo to explore</span>
              </div>
            </div>
          </div>

          {/* Mobile Slide Dots (for small screens) */}
          <div className="flex md:hidden items-center justify-center gap-2 pt-5 pb-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-[#92cd00] shadow-[0_0_8px_#92cd00]" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Area: Social Proof Strip & Integrated Glassmorphic Booking Search Bar */}
        <div className="relative z-20 pb-5 sm:pb-7 pt-2">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3.5">
            {/* Trust Distinctions */}
            <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-white/80 border-t border-white/10 pt-3">
              <div className="flex flex-wrap items-center gap-6">
                {TRUST_DISTINCTIONS.map(({ icon: Icon, label }) => (
                  <div key={label} className="inline-flex items-center gap-2">
                    <Icon className="size-3.5 text-[#ffcf79]" aria-hidden />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-2 text-[#92cd00] font-semibold text-xs">
                <CheckCircle2 className="size-3.5" />
                <span>Zero Hidden Fees · Complimentary Cancellation</span>
              </div>
            </div>

            {/* Floating Glassmorphic Booking Search Widget */}
            <div className="relative rounded-2xl md:rounded-[2.2rem] border border-white/40 bg-white/95 text-ink shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl p-4 sm:p-5 md:px-6 md:py-4 transition-all">
              <BookingSearch variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic 4K Video Preview Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-2xl md:rounded-3xl border border-white/20 bg-[#0c1813] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-2 rounded-full bg-[#92cd00] animate-pulse" />
                  <span className="font-display font-semibold text-sm sm:text-base text-white">
                    {hotelName} · 4K Cinematic Experience
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Close video preview"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black overflow-hidden">
                <Image
                  src="/assets/hero-1-opt.jpg"
                  alt="ExoStay Cinematic Preview"
                  fill
                  className="object-cover animate-pulse opacity-95"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-end p-6 sm:p-10">
                  <p className="text-xs font-semibold tracking-widest text-[#ffcf79] uppercase">
                    Virtual Sanctuary Tour
                  </p>
                  <h3 className="font-display text-xl sm:text-3xl font-bold text-white mt-1">
                    Welcome to ExoStay - Hotel/Resort
                  </h3>
                  <p className="text-sm text-white/80 max-w-xl mt-2">
                    Private beachfront villas, Michelin-starred pavilions, and restorative thermal
                    hydrotherapy gardens.
                  </p>
                  <div className="mt-5 flex gap-3">
                    <Link
                      href="/booking"
                      onClick={() => setIsVideoModalOpen(false)}
                      className="rounded-full bg-[#2c6700] hover:bg-[#398500] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition"
                    >
                      Reserve Your Stay
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(false)}
                      className="rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 text-xs sm:text-sm transition"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
