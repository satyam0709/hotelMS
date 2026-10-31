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
import { demoRooms } from "@/lib/demo-content";
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

  const apiDown = roomsResult.status === "rejected";
  const roomsResponse = apiDown ? { items: [], pagination: {} } : roomsResult.value;
  const apiRooms = asListItems(roomsResponse);

  // Determine whether any search/filter is active so we can distinguish "0 results for a search"
  // from "no rooms published at all" and "API unreachable".
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.category ||
    filters.guestCount ||
    filters.minPrice ||
    filters.maxPrice ||
    (Array.isArray(filters.amenityIds) && filters.amenityIds.length)
  );

  // Show demo rooms only when the API is completely unreachable AND no search is active.
  // When the API is up but a search returned 0 results, we show an empty state instead.
  const usingDemoRooms = apiDown && !hasActiveFilters;
  const rooms = usingDemoRooms ? demoRooms : apiRooms;

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
    <div className="pb-12 md:pb-16">
      {/* Hero Header Section - Clean & Balanced */}
      <section className="pt-8 pb-6 md:pt-12 md:pb-8">
        <Container>
          <FadeIn>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-line/60 pb-6">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-accent uppercase mb-2">
                  Accommodation
                </p>
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink font-bold tracking-tight leading-snug">
                  Rooms shaped for slower days
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
                  Browse our rooms by category, guests, and amenities — then open a room for details, gallery, and live availability.
                </p>
              </div>

              {/* Total counter & badge */}
              <div className="flex items-center gap-2 self-start md:self-end">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-soft px-3 py-1 text-xs font-medium text-ink border border-line/70">
                  <span className="size-2 rounded-full bg-accent" />
                  {total} {total === 1 ? "room available" : "rooms available"}
                </span>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Main Content: Filter Sidebar + Room Cards Grid */}
      <Container>
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19.5rem_minmax(0,1fr)] items-start">
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
            <RoomsFilters
              key={buildQueryString({
                search: filters.search,
                category: filters.category,
                guestCount: filters.guestCount,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                amenityIds: filters.amenityIds,
              }) || "all"}
              categories={categories}
              amenities={amenities}
              initialValues={filters}
              total={apiDown ? undefined : total}
            />
          </aside>

          <div className="min-w-0">
            {rooms.length === 0 ? (
              <div className="flex min-h-[22rem] flex-col items-center justify-center gap-5 rounded-2xl border border-line bg-elevated px-6 py-14 text-center">
                {hasActiveFilters ? (
                  <>
                    <div className="flex size-14 items-center justify-center rounded-full border border-line bg-surface">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-muted" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    </div>
                    <div className="max-w-xs">
                      <h2 className="font-display text-lg text-ink font-semibold">No rooms found</h2>
                      <p className="mt-1.5 text-xs text-muted">
                        No rooms match your current filters. Try adjusting your search criteria or clearing all filters.
                      </p>
                    </div>
                    <Button href="/rooms" variant="secondary" size="sm">
                      Clear all filters
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="max-w-xs">
                      <h2 className="font-display text-lg text-ink font-semibold">No rooms available</h2>
                      <p className="mt-1.5 text-xs text-muted">
                        Our room listing is being set up. Please check back soon.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result header line: count and sort */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/60 bg-elevated/70 px-4 py-2.5 backdrop-blur-xs">
                  <p className="text-xs font-medium text-ink">
                    <span className="font-bold text-accent">{rooms.length}</span> {rooms.length === 1 ? "room available" : "rooms available"} matching your criteria
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-medium text-ink">Sort by:</span>
                    <span className="rounded-lg bg-sand-soft/60 px-2.5 py-1 text-xs font-semibold text-ink border border-line/60">
                      Recommended
                    </span>
                  </div>
                </div>

                {/* Vertical stack of horizontal cards */}
                <Stagger className="space-y-4">
                  {rooms.map((room, index) => (
                    <StaggerItem key={room.id} className="w-full">
                      <RoomCard room={room} fallbackIndex={index} layout="row" />
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            )}

            {!apiDown && rooms.length > 0 && pages > 1 ? (
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
