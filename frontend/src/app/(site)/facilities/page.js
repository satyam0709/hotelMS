import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Waves } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FacilitiesFilterGrid from "@/components/hotel/FacilitiesFilterGrid";
import FadeIn from "@/components/motion/FadeIn";
import { getFacilities } from "@/lib/api/content";
import { coalesceList, demoFacilities } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Resort Facilities & Sanctuaries — ExoStay",
  description:
    "Explore our horizon infinity pool, thermal spa, wellness deck, movement studio, and personalized concierge services.",
};

export default async function FacilitiesPage() {
  const result = await Promise.allSettled([getFacilities()]);
  const facilities = coalesceList(
    result[0].status === "fulfilled" ? asListItems(result[0].value) : [],
    demoFacilities,
  );

  return (
    <div className="pb-24">
      {/* Cinematic Hero */}
      <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center overflow-hidden border-b border-line bg-ink text-white">
        <Image
          src={fallbackSrc("hero", 1)}
          alt="ExoStay Resort Facilities"
          fill
          priority
          className="object-cover opacity-45 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />

        <Container className="relative z-10 py-16 sm:py-20">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
              <Waves className="size-3.5 text-accent-soft" />
              Resort Living & Sanctuaries
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
              Spaces shaped for wellness, leisure & renewal
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/85 font-light">
              From morning meditation decks and heated infinity waters to restorative thermal hydrotherapy and round-the-clock concierge care.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Button href="#facilities-grid" size="lg" className="rounded-xl shadow-lg">
                Explore Amenities
              </Button>
              <Button
                href="/booking"
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md"
              >
                Book Your Stay
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Signature Sanctuary Spotlight */}
      <section className="py-14 bg-sand-soft/50 border-b border-line">
        <Container>
          <div className="overflow-hidden rounded-[2rem] border border-line bg-elevated shadow-soft grid lg:grid-cols-2 gap-0">
            <div className="relative min-h-[320px] lg:min-h-full overflow-hidden bg-accent-soft">
              <Image
                src={fallbackSrc("facility", 0)}
                alt="Ayurvedic Wellness Spa"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white tracking-wide uppercase shadow">
                Signature Experience
              </div>
            </div>
            <div className="p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                  Sanctuary Highlight
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl text-ink">
                  Wellness & Ayurvedic Spa
                </h2>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
                  Surrender to unhurried relaxation with bespoke aromatherapy rituals, custom herbal poultices, and a private hydrotherapy circuit designed to quiet the mind and rejuvenate the senses.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line/70 pt-6">
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">Hours</p>
                    <p className="mt-1 font-semibold text-ink text-sm sm:text-base">Daily · 8:00 AM – 9:00 PM</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wider">Appointments</p>
                    <p className="mt-1 font-semibold text-ink text-sm sm:text-base">Private suites & couples</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button href="/contact?type=GENERAL" className="rounded-xl">
                  Enquire for Spa Treatments
                </Button>
                <Link
                  href="/facilities/wellness-spa"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent transition-colors"
                >
                  <span>Learn more</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Facilities Grid */}
      <section id="facilities-grid" className="section-pad">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Explore All Amenities"
              title="Resort amenities at your fingertips"
              description="Filter our facilities by wellness, recreation, dining, or guest services."
            />
          </FadeIn>

          <div className="mt-10">
            <FacilitiesFilterGrid facilities={facilities} />
          </div>
        </Container>
      </section>

      {/* Concierge Assistance Band */}
      <section className="bg-elevated border-t border-line py-14">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-[2rem] border border-line bg-sand-soft/30 p-8 sm:p-10">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.16em] text-accent uppercase">
                <Sparkles className="size-3.5" />
                24/7 Guest Care
              </span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
                Require specialized arrangements or private bookings?
              </h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Our front desk and concierge team can schedule private pool cabanas, yoga instructors, or chauffeur services before you even arrive.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button href="/contact" size="lg" className="rounded-xl">
                Contact Concierge
              </Button>
              <Button href="/booking" variant="secondary" size="lg" className="rounded-xl">
                Reserve Stay
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
