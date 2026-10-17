import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import InquiryForm from "@/components/site/InquiryForm";
import { ApiError } from "@/lib/api/client";
import { getEvent } from "@/lib/api/content";
import { findDemoEvent } from "@/lib/demo-content";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, item]) =>
      typeof item === "string" ? `${key}: ${item}` : key
    );
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

async function loadEvent(slug) {
  try {
    return await getEvent(slug);
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await loadEvent(slug).catch(() => null);
  if (!event) return { title: "Event venue not found" };
  return {
    title: event.name,
    description: event.description || `${event.name} venue details and inquiry.`,
  };
}

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const event = (await loadEvent(slug)) || findDemoEvent(slug);
  if (!event) notFound();

  const mediaItems = Array.isArray(event.media)
    ? event.media.map((item) => item?.media).filter(Boolean)
    : [];
  const hero = mediaItems[0] || null;
  const heroSrc = mediaUrl(hero);
  const facilities = asList(event.facilitiesJson);
  const seating = asList(event.seatingJson);

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/events" className="transition-colors hover:text-accent">
                Events
              </Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">{event.name}</span>
            </nav>
            <div className="mb-3 flex flex-wrap gap-2">
              {event.capacity ? (
                <Badge tone="line">
                  <Users className="mr-1 inline size-3.5" />
                  Capacity {event.capacity}
                </Badge>
              ) : null}
              {event.basePrice != null ? (
                <Badge>From {formatCurrency(event.basePrice)}</Badge>
              ) : null}
            </div>
            <h1 className="font-display text-4xl text-ink md:text-6xl">{event.name}</h1>
          </FadeIn>
        </Container>
      </section>

      <Container className="space-y-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)]">
          <div className="space-y-8">
            <FadeIn>
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-accent-soft">
                {heroSrc ? (
                  <Image
                    src={heroSrc}
                    alt={mediaAlt(hero, event.name)}
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

            {event.description ? (
              <FadeIn>
                <section>
                  <h2 className="font-display text-3xl text-ink">About this venue</h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted">
                    {event.description}
                  </p>
                </section>
              </FadeIn>
            ) : null}

            {facilities.length ? (
              <FadeIn>
                <section>
                  <h2 className="font-display text-2xl text-ink">Facilities</h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {facilities.map((item) => (
                      <li
                        key={item}
                        className="rounded-2xl border border-line bg-elevated px-4 py-3 text-sm text-ink"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </FadeIn>
            ) : null}

            {seating.length ? (
              <FadeIn>
                <section>
                  <h2 className="font-display text-2xl text-ink">Seating</h2>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {seating.map((item) => (
                      <li
                        key={item}
                        className="rounded-2xl border border-line bg-elevated px-4 py-3 text-sm text-ink"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </FadeIn>
            ) : null}
          </div>

          <aside className="h-fit space-y-4 rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <p className="text-sm text-muted">
              Planning a wedding, conference, or private celebration? Send an inquiry to the events team.
            </p>
            <Button href="#event-inquiry" className="w-full">
              Enquire now
            </Button>
            <Button href="/events" variant="secondary" className="w-full">
              All venues
            </Button>
          </aside>
        </div>

        <section id="event-inquiry">
          <InquiryForm
            defaultType="EVENT"
            sourceRefType="event"
            sourceRefId={event.id}
          />
        </section>
      </Container>
    </div>
  );
}
