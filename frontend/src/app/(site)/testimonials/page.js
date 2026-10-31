import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import TestimonialCard from "@/components/hotel/TestimonialCard";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { getTestimonials } from "@/lib/api/content";
import { coalesceList, demoTestimonials } from "@/lib/demo-content";

export const metadata = {
  title: "Guest reviews",
  description: "Testimonials and ratings from recent guests.",
};

export default async function TestimonialsPage() {
  const result = await Promise.allSettled([getTestimonials()]);
  const testimonials = coalesceList(
    result[0].status === "fulfilled" && Array.isArray(result[0].value) ? result[0].value : [],
    demoTestimonials,
  );

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Reviews"
              title="What guests are saying"
              description="Approved reviews from direct stays and trusted sources."
              action={<Button href="/booking">Book your stay</Button>}
            />
          </FadeIn>
        </Container>
      </section>

      <Container>
        <Stagger className="mt-10 grid gap-x-4 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((item) => (
            <StaggerItem key={item.id}>
              <TestimonialCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </div>
  );
}
