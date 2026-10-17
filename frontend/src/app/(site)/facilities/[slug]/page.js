import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FacilityCard from "@/components/hotel/FacilityCard";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ApiError } from "@/lib/api/client";
import { getFacilities, getFacility } from "@/lib/api/content";
import { demoFacilities, findDemoFacility } from "@/lib/demo-content";
import { asListItems, mediaAlt, mediaUrl } from "@/lib/utils";

async function loadFacility(slug) {
  try {
    return await getFacility(slug);
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const facility = await loadFacility(slug).catch(() => null);
  if (!facility) return { title: "Facility not found" };
  return {
    title: facility.name,
    description: facility.description || `${facility.name} at the resort.`,
  };
}

export default async function FacilityDetailPage({ params }) {
  const { slug } = await params;
  const facility = (await loadFacility(slug)) || findDemoFacility(slug);
  if (!facility) notFound();

  const mediaItems = Array.isArray(facility.media)
    ? facility.media.map((item) => item?.media).filter(Boolean)
    : [];
  const hero = mediaItems[0] || null;
  const heroSrc = mediaUrl(hero);

  const relatedResult = await Promise.allSettled([getFacilities()]);
  const related = relatedResult[0].status === "fulfilled"
    ? asListItems(relatedResult[0].value)
      .filter((item) => item.id !== facility.id)
      .filter((item) => !facility.category || item.category === facility.category)
      .slice(0, 3)
    : [];

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/facilities" className="transition-colors hover:text-accent">
                Facilities
              </Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">{facility.name}</span>
            </nav>

            <div className="mb-3 flex flex-wrap gap-2">
              {facility.category ? <Badge tone="line">{facility.category}</Badge> : null}
            </div>
            <h1 className="font-display text-4xl text-ink md:text-6xl">{facility.name}</h1>
            {facility.operatingHours ? (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
                <Clock3 className="size-4 text-accent" />
                {facility.operatingHours}
              </p>
            ) : null}
          </FadeIn>
        </Container>
      </section>

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
          <div className="space-y-8">
            <FadeIn>
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-accent-soft">
                {heroSrc ? (
                  <Image
                    src={heroSrc}
                    alt={mediaAlt(hero, facility.name)}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 70vw"
                  />
                ) : (
                  <div className="absolute inset-0 media-fallback-bg" />
                )}
              </div>
            </FadeIn>

            {mediaItems.length > 1 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {mediaItems.slice(1).map((item) => {
                  const src = mediaUrl(item);
                  if (!src) return null;
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line"
                    >
                      <Image
                        src={src}
                        alt={mediaAlt(item, facility.name)}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}

            {facility.description ? (
              <FadeIn>
                <section>
                  <h2 className="font-display text-3xl text-ink">About</h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted">
                    {facility.description}
                  </p>
                </section>
              </FadeIn>
            ) : null}

            {facility.additionalInfo ? (
              <FadeIn>
                <section className="rounded-[1.75rem] border border-line bg-sand-soft/50 p-6 md:p-8">
                  <h2 className="font-display text-2xl text-ink">Additional information</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted md:text-base">
                    {facility.additionalInfo}
                  </p>
                </section>
              </FadeIn>
            ) : null}
          </div>

          <aside className="h-fit space-y-4 rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <p className="text-sm text-muted">
              Interested in this facility during your stay? Ask the team or book rooms nearby.
            </p>
            <Button href="/contact" className="w-full">
              Enquire
            </Button>
            <Button href="/booking" variant="secondary" className="w-full">
              Book a stay
            </Button>
            <Button href="/facilities" variant="ghost" className="w-full">
              All facilities
            </Button>
          </aside>
        </div>

        <section className="mt-16 md:mt-20">
          <h2 className="mb-8 font-display text-3xl text-ink">Related facilities</h2>
          <Stagger className="grid gap-5 md:grid-cols-3">
            {(related.length
              ? related
              : demoFacilities.filter((item) => item.id !== facility.id)
            ).slice(0, 3).map((item, index) => (
              <StaggerItem key={item.id}>
                <FacilityCard facility={item} fallbackIndex={index} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Container>
    </div>
  );
}
