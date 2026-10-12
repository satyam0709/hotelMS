import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import { siteConfig } from "@/lib/config";

export default function CtaBand({ settings }) {
  const phone = settings?.phone;
  const phoneHref = phone ? `tel:${phone}` : siteConfig.contactPath;

  return (
    <section className="section-pad">
      <Container>
        <FadeIn>
          <div className="border border-line bg-elevated px-6 py-14 text-center md:px-12 md:py-16">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Plan your stay
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl text-ink md:text-5xl">
              Reserve your moment of tranquility
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted md:text-lg">
              Choose your dates, explore available rooms, and reserve directly with the resort team.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href={siteConfig.bookingPath} className="min-w-[12rem] rounded-md">
                Reserve direct online
              </Button>
              <Button href={phoneHref} variant="secondary" className="min-w-[12rem] rounded-md">
                {phone || "Contact concierge"}
              </Button>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
