import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import EventCard from "@/components/hotel/EventCard";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { getEvents } from "@/lib/api/content";
import { coalesceList, demoEvents } from "@/lib/demo-content";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Events & Banquets",
  description: "Venues for celebrations, conferences, and gatherings at the resort.",
};

export default async function EventsPage() {
  const result = await Promise.allSettled([getEvents()]);
  const events = coalesceList(
    result[0].status === "fulfilled" ? asListItems(result[0].value) : [],
    demoEvents,
  );

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Events"
              title="Spaces for gatherings"
              description="Banquet halls, conference rooms, and celebration venues shaped for memorable occasions."
              action={<Button href="/contact" variant="secondary">Event inquiry</Button>}
            />
          </FadeIn>
        </Container>
      </section>

      <Container>
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <StaggerItem key={event.id}>
              <EventCard event={event} fallbackIndex={index} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </div>
  );
}
