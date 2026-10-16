import Link from "next/link";
import BookingFlow from "@/components/booking/BookingFlow";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import { getSettings } from "@/lib/api/content";
import { getAvailability } from "@/lib/api/rooms";
import {
  hasValidStayDates,
  normalizeBookingSearch,
} from "@/lib/api/booking";
import { ApiError } from "@/lib/api/client";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Book your stay",
  description: "Search live room availability, reserve inventory, and confirm your stay.",
};

export default async function BookingPage({ searchParams }) {
  const params = await searchParams;
  const search = normalizeBookingSearch(params || {});

  const settingsResult = await Promise.allSettled([getSettings()]);
  const settings = settingsResult[0].status === "fulfilled" ? settingsResult[0].value : {};

  let availability = null;
  let availabilityError = "";

  if (hasValidStayDates(search)) {
    try {
      availability = await getAvailability({
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: search.adults,
        children: search.children,
        rooms: search.rooms,
        category: search.category,
        roomId: search.roomId,
        room: search.room,
        limit: 50,
      });
    } catch (error) {
      availabilityError = error instanceof ApiError
        ? error.message
        : "Unable to load availability right now.";
    }
  }

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Reservations
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
              Book your stay
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              Check live availability, hold a room, and pay online or at the hotel —
              powered by the property inventory system.
            </p>
            <p className="mt-4 text-sm text-muted">
              Already booked?{" "}
              <Link href="/booking/lookup" className="font-medium text-accent hover:underline">
                Find your reservation
              </Link>
            </p>
          </FadeIn>
        </Container>
      </section>

      <Container>
        <BookingFlow
          key={`${search.checkIn}-${search.checkOut}-${search.adults}-${search.children}-${search.rooms}-${search.room || ""}-${search.roomId || ""}`}
          search={search}
          availability={availability}
          availabilityError={availabilityError}
          brandName={settings?.websiteName || siteConfig.name}
          onlinePaymentEnabled={settings?.onlinePaymentEnabled !== false}
          payAtHotelEnabled={settings?.payAtHotelEnabled !== false}
        />
      </Container>
    </div>
  );
}
