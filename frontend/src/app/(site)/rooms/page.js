import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import RoomCard from "@/components/hotel/RoomCard";
import RoomsFilters from "@/components/hotel/RoomsFilters";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import {
  getAmenities,
  getRoomCategories,
  getRooms,
  normalizeRoomFilters,
} from "@/lib/api/rooms";
import { coalesceList, demoRooms } from "@/lib/demo-content";
import { asListItems, buildQueryString } from "@/lib/utils";

export const metadata = {
  title: "Rooms & Accommodation",
  description: "Explore rooms, suites, and stays designed for rest, light, and unhurried mornings.",
};

export default async function RoomsPage({ searchParams }) {
  const params = await searchParams;
  const filters = normalizeRoomFilters(params || {});

  const [roomsResult, categoriesResult, amenitiesResult] = await Promise.allSettled([
    getRooms(filters),
    getRoomCategories({ limit: 50 }),
    getAmenities({ limit: 50 }),
  ]);

  const roomsResponse = roomsResult.status === "fulfilled" ? roomsResult.value : { items: [], pagination: {} };
  const apiRooms = asListItems(roomsResponse);
  const rooms = coalesceList(apiRooms, demoRooms);
  const usingDemoRooms = !apiRooms.length;
  const pagination = usingDemoRooms
    ? { page: 1, pages: 1, total: rooms.length }
    : (roomsResponse?.pagination || {});
  const categories = asListItems(
    categoriesResult.status === "fulfilled" ? categoriesResult.value : []
  );
  const amenities = asListItems(
    amenitiesResult.status === "fulfilled" ? amenitiesResult.value : []
  );

  const total = pagination.total ?? rooms.length;
  const page = pagination.page || filters.page || 1;
  const pages = pagination.pages || 1;

  const prevQuery = page > 1
    ? buildQueryString({ ...filters, page: page - 1, amenityIds: filters.amenityIds })
    : null;
  const nextQuery = page < pages
    ? buildQueryString({ ...filters, page: page + 1, amenityIds: filters.amenityIds })
    : null;

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Accommodation"
              title="Rooms shaped for slower days"
              description="Browse our rooms by category, guests, and amenities — then open a room for details, gallery, and live availability."
            />
          </FadeIn>
        </Container>
      </section>

      <Container>
        <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <RoomsFilters
              key={buildQueryString({
                category: filters.category,
                guestCount: filters.guestCount,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                amenityIds: filters.amenityIds,
              }) || "all"}
              categories={categories}
              amenities={amenities}
              initialValues={filters}
              total={usingDemoRooms ? undefined : total}
            />
          </aside>

          <div>
            <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {rooms.map((room, index) => (
                <StaggerItem key={room.id}>
                  <RoomCard room={room} fallbackIndex={index} />
                </StaggerItem>
              ))}
            </Stagger>

            {!usingDemoRooms && pages > 1 ? (
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
                <p className="text-sm text-muted">
                  Page {page} of {pages}
                </p>
                <div className="flex gap-2">
                  {prevQuery ? (
                    <Button href={`/rooms${prevQuery}`} variant="secondary" size="sm">
                      Previous
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Previous
                    </Button>
                  )}
                  {nextQuery ? (
                    <Button href={`/rooms${nextQuery}`} variant="secondary" size="sm">
                      Next
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      Next
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </div>
  );
}
