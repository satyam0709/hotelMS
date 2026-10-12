import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import RoomCard from "@/components/hotel/RoomCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { coalesceList, demoRooms } from "@/lib/demo-content";

export default function FeaturedRooms({ rooms = [] }) {
  const displayRooms = coalesceList(rooms, demoRooms);

  return (
    <section className="section-pad bg-elevated/60">
      <Container>
        <SectionHeader
          eyebrow="Accommodations"
          title="Private sanctuaries for every stay"
          description="Suites and rooms composed for light, privacy, and unhurried mornings — each with its own view and rhythm."
          action={<Button href="/rooms" variant="secondary">View all rooms</Button>}
        />

        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayRooms.map((room, index) => (
            <StaggerItem key={room.id}>
              <RoomCard room={room} fallbackIndex={index} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
