import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export const metadata = {
  title: "Page not found",
  description: "The page you requested could not be found on the resort website.",
};

export default function SiteNotFound() {
  return (
    <div className="section-pad">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
            404
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
            The link may be outdated, or this page is not published yet.
            Explore rooms, packages, or reach the front desk for help.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/">Back home</Button>
            <Button href="/rooms" variant="secondary">
              View rooms
            </Button>
            <Button href="/contact" variant="ghost">
              Contact us
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
