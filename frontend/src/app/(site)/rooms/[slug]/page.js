import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Clock3, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import MarkdownContent from "@/components/ui/MarkdownContent";
import SectionHeader from "@/components/ui/SectionHeader";
import RoomAmenitiesList from "@/components/hotel/RoomAmenitiesList";
import RoomAvailabilitySearch from "@/components/hotel/RoomAvailabilitySearch";
import RoomCard from "@/components/hotel/RoomCard";
import RoomGallery from "@/components/hotel/RoomGallery";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ApiError } from "@/lib/api/client";
import { getRoom } from "@/lib/api/rooms";
import { demoRooms, findDemoRoom } from "@/lib/demo-content";
import { formatCurrency, roomGalleryItems } from "@/lib/utils";

async function loadRoom(slug) {
  try {
    return await getRoom(slug);
  } catch (error) {
    // Gracefully handle backend errors/timeouts and allow fallback to demo room
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const room = (await loadRoom(slug).catch(() => null)) || findDemoRoom(slug);
  if (!room) {
    return { title: "Room Not Found" };
  }
  return {
    title: `${room.name} — Luxury Stays`,
    description: room.shortDescription || room.description || `${room.name} details and booking.`,
  };
}

export default async function RoomDetailPage({ params }) {
  const { slug } = await params;
  const room = (await loadRoom(slug)) || findDemoRoom(slug);
  if (!room) notFound();

  const images = roomGalleryItems(room);
  const related = Array.isArray(room.relatedRooms) ? room.relatedRooms : [];
  const policies = typeof room.policies === "string"
    ? room.policies
    : room.policies && typeof room.policies === "object"
      ? Object.values(room.policies).filter(Boolean).join("\n")
      : "";

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/rooms" className="transition-colors hover:text-accent">
                Rooms
              </Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">{room.name}</span>
            </nav>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="line">{room.category?.name || "Room"}</Badge>
                  {room.isFeatured ? <Badge>Featured</Badge> : null}
                </div>
                <h1 className="font-display text-4xl text-ink md:text-6xl">{room.name}</h1>
                {room.shortDescription ? (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
                    {room.shortDescription}
                  </p>
                ) : null}
              </div>
              <div className="rounded-[1.25rem] border border-line bg-elevated px-5 py-4 text-right shadow-soft">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">From</p>
                <p className="mt-1 font-display text-3xl text-accent">
                  {formatCurrency(room.basePrice)}
                </p>
                <p className="text-xs text-muted">per night</p>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.7fr)]">
          <div className="space-y-10">
            <FadeIn>
              <RoomGallery images={images} roomName={room.name} />
            </FadeIn>

            <FadeIn delay={0.05}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-elevated px-4 py-4">
                  <Users className="size-4 text-accent" />
                  <p className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">Occupancy</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    Up to {room.maxOccupancy} guests
                    <span className="mt-1 block text-xs font-normal text-muted">
                      {room.maxAdults} adults · {room.maxChildren} children
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-elevated px-4 py-4">
                  <BedDouble className="size-4 text-accent" />
                  <p className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">Bed & size</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {room.bedType || "Flexible"}
                    {room.roomSize ? (
                      <span className="mt-1 block text-xs font-normal text-muted">{room.roomSize}</span>
                    ) : null}
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-elevated px-4 py-4">
                  <Clock3 className="size-4 text-accent" />
                  <p className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">Check-in / out</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {room.checkInTime || "14:00"} / {room.checkOutTime || "11:00"}
                  </p>
                </div>
              </div>
            </FadeIn>

            {room.description ? (
              <FadeIn>
                <section>
                  <h2 className="font-display text-3xl text-ink">About this room</h2>
                  <div className="mt-4">
                    <MarkdownContent content={room.description} className="text-muted" />
                  </div>
                </section>
              </FadeIn>
            ) : null}

            <FadeIn>
              <section>
                <h2 className="font-display text-3xl text-ink">Amenities</h2>
                <div className="mt-5">
                  <RoomAmenitiesList room={room} />
                </div>
              </section>
            </FadeIn>

            {policies ? (
              <FadeIn>
                <section className="rounded-[1.75rem] border border-line bg-sand-soft/50 p-6 md:p-8">
                  <h2 className="font-display text-3xl text-ink">Room policies</h2>
                  <div className="mt-4">
                    <MarkdownContent content={policies} className="text-sm text-muted md:text-base" />
                  </div>
                </section>
              </FadeIn>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <RoomAvailabilitySearch roomSlug={room.slug} roomName={room.name} />
            <div className="rounded-[1.75rem] border border-line bg-elevated p-5">
              <p className="text-sm text-muted">Prefer to speak with the front desk?</p>
              <Button href="/contact" variant="secondary" className="mt-4 w-full">
                Contact us
              </Button>
            </div>
          </aside>
        </div>

        <section className="mt-16 md:mt-20">
          <SectionHeader
            eyebrow="Similar stays"
            title="Related rooms"
            description="Other rooms in the same category you may also like."
            action={<Button href="/rooms" variant="secondary">All rooms</Button>}
          />

          <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(related.length
              ? related
              : demoRooms.filter((item) => item.slug !== room.slug)
            ).map((item, index) => (
              <StaggerItem key={item.id}>
                <RoomCard room={item} fallbackIndex={index} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </Container>
    </div>
  );
}
