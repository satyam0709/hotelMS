import Link from "next/link";
import BookingLookupForm from "@/components/booking/BookingLookupForm";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";

export const metadata = {
  title: "Find your booking",
  description: "Look up a reservation with your booking reference and contact details.",
};

export default function BookingLookupPage() {
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
              <span className="text-ink">Find booking</span>
            </nav>
            <SectionHeader
              eyebrow="Lookup"
              title="Find your reservation"
              description="Enter the booking reference from your confirmation email or SMS, plus the email and phone you used when booking."
              action={<Button href="/booking" variant="secondary">New booking</Button>}
            />
          </FadeIn>
        </Container>
      </section>

      <Container className="max-w-xl">
        <BookingLookupForm />
      </Container>
    </div>
  );
}
