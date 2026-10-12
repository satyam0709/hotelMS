import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import NewsletterForm from "@/components/site/NewsletterForm";

export default function NewsletterSection({ settings }) {
  const brand = settings?.websiteName || "the resort";

  return (
    <section className="section-pad">
      <Container>
        <FadeIn>
          <div className="border border-line bg-elevated px-6 py-12 md:px-12 md:py-14">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
                Newsletter
              </p>
              <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">
                Stay close to {brand}
              </h2>
              <p className="mt-4 text-base text-muted md:text-lg">
                Seasonal offers, dining notes, and quiet-weekend ideas — delivered when there is something worth opening.
              </p>
              <NewsletterForm className="mx-auto mt-8 max-w-lg text-left" layout="inline" />
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
