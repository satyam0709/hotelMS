import Image from "next/image";
import { Camera, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import GalleryExperience from "@/components/hotel/GalleryExperience";
import FadeIn from "@/components/motion/FadeIn";
import {
  getAttractions,
  getEvents,
  getFacilities,
  getGallery,
} from "@/lib/api/content";
import { getRooms } from "@/lib/api/rooms";
import {
  buildGalleryItemsFromApi,
  buildPublicGalleryItems,
  galleryCategoryOptionsFromApi,
} from "@/lib/gallery-items";
import { demoGalleryItems } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Resort Gallery & Visual Moments — ExoStay",
  description:
    "Immerse yourself in our visual archive of luxury suites, horizon infinity pool, garden dining, and tranquil resort grounds.",
};

export default async function GalleryPage() {
  const galleryResult = await Promise.allSettled([getGallery()]);
  const apiCategories = galleryResult[0].status === "fulfilled" && Array.isArray(galleryResult[0].value)
    ? galleryResult[0].value
    : [];
  const apiItems = buildGalleryItemsFromApi(apiCategories);
  const useApiGallery = apiItems.length > 0;

  let items = apiItems;
  let categoryOptions = galleryCategoryOptionsFromApi(apiCategories);

  if (!useApiGallery) {
    const result = await Promise.allSettled([
      getRooms({ limit: 24 }),
      getFacilities({ limit: 24 }),
      getEvents(),
      getAttractions({ limit: 12 }),
    ]);

    const rooms = result[0].status === "fulfilled" ? asListItems(result[0].value) : [];
    const facilities = result[1].status === "fulfilled" ? asListItems(result[1].value) : [];
    const events = result[2].status === "fulfilled"
      ? (Array.isArray(result[2].value) ? result[2].value : asListItems(result[2].value))
      : [];
    const attractions = result[3].status === "fulfilled" ? asListItems(result[3].value) : [];

    items = buildPublicGalleryItems({ rooms, facilities, events, attractions });
    categoryOptions = undefined;
  }

  if (!items.length) {
    items = demoGalleryItems();
  }

  return (
    <div className="pb-24">
      {/* Cinematic Gallery Hero */}
      <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center overflow-hidden border-b border-line bg-ink text-white">
        <Image
          src={fallbackSrc("hero", 1)}
          alt="ExoStay Resort Moments"
          fill
          priority
          className="object-cover opacity-45 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />

        <Container className="relative z-10 py-16 sm:py-20">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
              <Camera className="size-3.5 text-accent-soft" />
              Visual Chronicles & Spaces
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
              Moments captured across our sanctuaries
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/85 font-light">
              Explore our photography archive — from morning light passing through private suites and quiet garden verandas to candlelit poolside evenings.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Button href="#gallery-experience" size="lg" className="rounded-xl shadow-lg">
                View Photos
              </Button>
              <Button
                href="/rooms"
                variant="secondary"
                size="lg"
                className="rounded-xl bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-md"
              >
                Explore Rooms
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Gallery Experience */}
      <section id="gallery-experience" className="section-pad">
        <Container className="space-y-10">
          <FadeIn>
            <SectionHeader
              eyebrow="Curated Albums"
              title="Filter by space & experience"
              description="Click any image for high-resolution fullscreen preview with intuitive keyboard navigation."
            />
          </FadeIn>

          <GalleryExperience items={items} categoryOptions={categoryOptions} />
        </Container>
      </section>

      {/* Experience in Person CTA */}
      <section className="bg-sand-soft/50 border-t border-line py-16">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-[2rem] border border-line bg-elevated p-8 sm:p-12 shadow-soft">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.16em] text-accent uppercase">
                <Sparkles className="size-3.5" />
                Experience It Live
              </span>
              <h3 className="mt-2 font-display text-3xl sm:text-4xl text-ink">
                Ready to experience these spaces firsthand?
              </h3>
              <p className="mt-2.5 text-sm text-muted leading-relaxed">
                Reserve your favorite suite or connect directly with our reservations team to craft a personalized retreat.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button href="/booking" size="lg" className="rounded-xl shadow-sm">
                Reserve Your Stay
              </Button>
              <Button href="/contact" variant="secondary" size="lg" className="rounded-xl">
                Contact Concierge
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
