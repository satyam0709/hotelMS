import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import TestimonialCard from "@/components/hotel/TestimonialCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { coalesceList, demoTestimonials } from "@/lib/demo-content";

export default function TestimonialsGrid({ testimonials = [] }) {
  const items = coalesceList(testimonials, demoTestimonials);

  return (
    <section className="section-pad">
      <Container>
        <SectionHeader
          eyebrow="Testimonials"
          title="Reflections from our guests"
          description="Stories from travelers who arrived for a weekend and left with a slower rhythm."
          action={<Button href="/testimonials" variant="secondary">All reviews</Button>}
        />
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <StaggerItem key={item.id}>
              <TestimonialCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
