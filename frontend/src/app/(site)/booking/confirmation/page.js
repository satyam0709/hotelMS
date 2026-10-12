import Link from "next/link";
import BookingConfirmation from "@/components/booking/BookingConfirmation";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import FadeIn from "@/components/motion/FadeIn";
import { ApiError } from "@/lib/api/client";
import { getBooking } from "@/lib/api/booking";
import { getSettings } from "@/lib/api/content";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Booking confirmation",
  description: "View your booking reference, status, and payment details.",
};

export default async function BookingConfirmationPage({ searchParams }) {
  const params = await searchParams;
  const bookingRef = params?.bookingRef || "";
  const email = params?.email || undefined;
  const phone = params?.phone || undefined;
  const pendingPayment = params?.pending === "1";

  const settingsResult = await Promise.allSettled([getSettings()]);
  const settings = settingsResult[0].status === "fulfilled" ? settingsResult[0].value : {};

  if (!bookingRef || !email || !phone) {
    return (
      <div className="section-pad">
        <Container>
          <EmptyState
            title="Booking lookup required"
            description="Open this page from a completed reservation, or use find booking with your reference and contact details."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button href="/booking/lookup">Find booking</Button>
                <Button href="/booking" variant="secondary">Start a booking</Button>
              </div>
            }
          />
        </Container>
      </div>
    );
  }

  let booking = null;
  let errorMessage = "";
  try {
    booking = await getBooking(bookingRef, { email, phone });
  } catch (error) {
    errorMessage = error instanceof ApiError
      ? error.message
      : "Unable to load this booking.";
  }

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/booking" className="transition-colors hover:text-accent">
                Booking
              </Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">Confirmation</span>
            </nav>
          </FadeIn>
        </Container>
      </section>

      <Container>
        {errorMessage ? (
          <ErrorState title="Booking not found" description={errorMessage} />
        ) : (
          <BookingConfirmation
            booking={booking}
            lookup={{ email, phone }}
            brandName={settings?.websiteName || siteConfig.name}
            pendingPayment={pendingPayment}
          />
        )}
      </Container>
    </div>
  );
}
