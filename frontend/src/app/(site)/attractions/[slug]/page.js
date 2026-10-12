import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Route } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import AttractionCard from "@/components/hotel/AttractionCard";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ApiError } from "@/lib/api/client";
import { getAttraction, getAttractions } from "@/lib/api/content";
import { demoAttractions, findDemoAttraction } from "@/lib/demo-content";
import { asListItems, mediaAlt, mediaUrl } from "@/lib/utils";

async function loadAttraction(slug) {
  try {
    return await getAttraction(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const attraction = await loadAttraction(slug).catch(() => null);
  if (!attraction) return { title: "Attraction not found" };
  return {
    title: attraction.name,
    description: attraction.description || `${attraction.name} near the resort.`,
  };
}

export default async function AttractionDetailPage({ params }) {
  const { slug } = await params;
  const attraction = (await loadAttraction(slug)) || findDemoAttraction(slug);
  if (!attraction) notFound();

  const imageSrc = mediaUrl(attraction.media);
  const relatedResult = await Promise.allSettled([getAttractions({ limit: 8 })]);
  const related = relatedResult[0].status === "fulfilled"
    ? asListItems(relatedResult[0].value)
      .filter((item) => item.id !== attraction.id)
      .slice(0, 3)
    : [];

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/attractions" className="transition-colors hover:text-accent">
                Attractions
              </Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">{attraction.name}</span>
            </nav>
            <h1 className="font-display text-4xl text-ink md:text-6xl">{attraction.name}</h1>
            {attraction.distance ? (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
                <Route className="size-4 text-accent" />
                {attraction.distance}
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
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={mediaAlt(attraction.media, attraction.name)}
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

            {attraction.description ? (
              <FadeIn>
                <section>
                  <h2 className="font-display text-3xl text-ink">About</h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted">
                    {attraction.description}
                  </p>
                </section>
              </FadeIn>
            ) : null}

            {attraction.travelInfo ? (
              <FadeIn>
                <section className="rounded-[1.75rem] border border-line bg-sand-soft/50 p-6 md:p-8">
                  <h2 className="font-display text-2xl text-ink">Travel tips</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted md:text-base">
                    {attraction.travelInfo}
                  </p>
                </section>
              </FadeIn>
            ) : null}

            {attraction.mapUrl ? (
              <FadeIn>
                <section className="overflow-hidden rounded-[2rem] border border-line bg-elevated">
                  <div className="border-b border-line px-5 py-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                      <MapPin className="size-3.5" />
                      Location
                    </p>
                  </div>
                  <div className="aspect-[16/9] bg-accent-soft">
                    <iframe
                      title={`${attraction.name} map`}
                      src={attraction.mapUrl}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </section>
              </FadeIn>
            ) : null}
          </div>

          <aside className="h-fit space-y-4 rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <p className="text-sm text-muted">
              Reception can help plan day trips and local transport around your stay.
            </p>
            <Button href="/contact" className="w-full">
              Ask reception
            </Button>
            <Button href="/attractions" variant="secondary" className="w-full">
              All attractions
            </Button>
            <Button href="/booking" variant="ghost" className="w-full">
              Book a stay
            </Button>
          </aside>
        </div>

        <section className="mt-16 md:mt-20">
          <h2 className="mb-8 font-display text-3xl text-ink">More nearby</h2>
          <Stagger className="grid gap-5 md:grid-cols-3">
            {(related.length
              ? related
              : demoAttractions.filter((item) => item.id !== attraction.id)
            ).slice(0, 3).map((item, index) => (
              <StaggerItem key={item.id}>
                <AttractionCard attraction={item} fallbackIndex={index} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Container>
    </div>
  );
}
