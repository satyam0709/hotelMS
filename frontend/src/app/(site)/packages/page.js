import Image from "next/image";
import { Compass, Gift, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import OfferBannerGrid from "@/components/hotel/OfferBannerGrid";
import PackageOfferCard from "@/components/hotel/PackageOfferCard";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import InquiryForm from "@/components/site/InquiryForm";
import { getBanners, getPackages } from "@/lib/api/content";
import { coalesceList, demoBanners, demoPackages } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";

export const metadata = {
  title: "Packages & Curated Escapes — ExoStay",
  description:
    "Discover seasonal getaway packages, romantic celebrations, wellness retreats, and family vacation bundles.",
};

const PACKAGE_PERKS = [
  {
    icon: Gift,
    title: "Curated Inclusions",
    desc: "Every package bundles premium experiences — from couples massage to tasting menus.",
  },
  {
    icon: Compass,
    title: "Flexible Rescheduling",
    desc: "Enjoy peace of mind with simple date modifications up to 72 hours before arrival.",
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Host",
    desc: "A personalized experience concierge will coordinate your dining and itinerary prior to check-in.",
  },
  {
    icon: ShieldCheck,
    title: "Best Rate Guarantee",
    desc: "Direct reservations receive our lowest available rates and exclusive resort credits.",
  },
];

export default async function PackagesPage() {
  const [packagesResult, bannersResult] = await Promise.allSettled([
    getPackages(),
    getBanners(),
  ]);

  const packages = coalesceList(
    packagesResult.status === "fulfilled" && Array.isArray(packagesResult.value)
      ? packagesResult.value
      : [],
    demoPackages,
  );
  const banners = coalesceList(
    bannersResult.status === "fulfilled" && Array.isArray(bannersResult.value)
      ? bannersResult.value
      : [],
    demoBanners,
  );

  return (
    <div className="pb-24">
      {/* Cinematic Hero */}
      <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center overflow-hidden border-b border-line bg-ink text-white">
        <Image
          src={fallbackSrc("hero", 0)}
          alt="ExoStay Curated Escapes"
          fill
          priority
          className="object-cover opacity-45 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />

        <Container className="relative z-10 py-16 sm:py-20">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
              <Sparkles className="size-3.5 text-accent-soft" />
              Curated Escapes & Journeys
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
              Stays worth planning ahead
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/85 font-light">
              Elevate your time away with thoughtfully orchestrated packages combining luxury suites, wellness rituals, gourmet dining, and private celebrations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Button href="#package-list" size="lg" className="rounded-xl shadow-lg">
                View Packages
              </Button>
              <Button
                href="/booking"
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md"
              >
                Instant Booking
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Package Value Perks Strip */}
      <section className="py-12 bg-sand-soft/50 border-b border-line">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PACKAGE_PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.title} className="flex gap-4 items-start">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base text-ink font-semibold">{perk.title}</h3>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{perk.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Main Packages Grid */}
      <section id="package-list" className="section-pad">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Signature Packages"
              title="Handcrafted vacation bundles"
              description="Transparent nightly packages complete with bundled dining credits, spa sessions, and early check-in options."
            />
          </FadeIn>

          <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <StaggerItem key={pkg.id}>
                <PackageOfferCard package={pkg} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* Seasonal Promotions */}
      {banners.length ? (
        <section className="py-16 bg-sand-soft/40 border-y border-line">
          <Container>
            <FadeIn>
              <SectionHeader
                eyebrow="Limited Season Offers"
                title="Special celebration & weekend banners"
                description="Promotions curated by the resort director for anniversaries, private retreats, and long weekend escapes."
              />
            </FadeIn>
            <div className="mt-8">
              <OfferBannerGrid banners={banners} className="grid gap-6 md:grid-cols-2" />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Package Customization Inquiry */}
      <section className="section-pad">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div className="rounded-[2rem] border border-line bg-elevated p-8 sm:p-10 shadow-soft space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                  Bespoke Stays
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">
                  Looking for a custom celebration package?
                </h2>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Whether organizing a milestone birthday, honeymoon escape, wellness reset, or family reunion, our reservations team will customize room pairings, private gazebo dining, and curated excursions.
              </p>

              <div className="space-y-3 border-t border-line/70 pt-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">1</span>
                  <p className="text-xs text-muted leading-relaxed">Select your preferred dates and number of guests.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">2</span>
                  <p className="text-xs text-muted leading-relaxed">Share any dining preferences or celebration touches.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">3</span>
                  <p className="text-xs text-muted leading-relaxed">Receive a bespoke quotation and itinerary within hours.</p>
                </div>
              </div>

              <div className="pt-2">
                <Button href="/contact?type=PACKAGE" variant="secondary" className="w-full">
                  Speak with Reservations Concierge
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-line bg-elevated p-8 sm:p-10 shadow-soft">
              <div className="mb-6">
                <h3 className="font-display text-2xl text-ink">Send a package inquiry</h3>
                <p className="mt-1 text-xs text-muted">Direct dispatch to our reservations concierge desk.</p>
              </div>
              <InquiryForm defaultType="PACKAGE" sourceRefType="PACKAGE_PAGE" />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
