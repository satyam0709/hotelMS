import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { coalesceList, demoEvents } from "@/lib/demo-content";

export default function ExperienceStrip({ events = [] }) {
  const items = coalesceList(events, demoEvents).slice(0, 3);

  return (
    <section className="section-pad bg-[linear-gradient(180deg,color-mix(in_srgb,var(--brand-cream)_95%,white),transparent)]">
      <Container>
        <SectionHeader
          eyebrow="Experience"
          title="Moments beyond the room"
          description="From quiet gardens to celebrations under soft evening light."
          align="center"
          action={<Button href="/events" variant="secondary">View venues</Button>}
        />
        <Stagger className="grid gap-4 md:grid-cols-3">
          {items.map((event) => (
            <StaggerItem key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                className="motion-interactive-card block rounded-[1.5rem] border border-line bg-elevated p-6 transition hover:border-brand-lime/40"
              >
                <p className="text-xs tracking-[0.18em] text-accent uppercase">Venue</p>
                <h3 className="mt-3 font-display text-2xl text-ink">{event.name}</h3>
                {event.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                    {event.description}
                  </p>
                ) : null}
                {event.capacity ? (
                  <p className="mt-5 text-sm text-ink/80">Capacity {event.capacity}</p>
                ) : null}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
