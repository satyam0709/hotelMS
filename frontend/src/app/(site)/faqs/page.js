import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import FaqAccordion from "@/components/site/FaqAccordion";
import { getFaqs } from "@/lib/api/content";
import { demoFaqCategories } from "@/lib/demo-content";

export const metadata = {
  title: "FAQs",
  description: "Answers to common questions about stays, check-in, dining, and bookings.",
};

export default async function FaqsPage() {
  const result = await Promise.allSettled([getFaqs()]);
  const apiCategories = result[0].status === "fulfilled" && Array.isArray(result[0].value)
    ? result[0].value
    : [];
  const hasFaqs = apiCategories.some((category) => Array.isArray(category.faqs) && category.faqs.length);
  const categories = hasFaqs ? apiCategories : demoFaqCategories;

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Help"
              title="Frequently asked questions"
              description="Quick answers before you arrive — or reach out if you need something more specific."
              action={<Button href="/contact" variant="secondary">Contact us</Button>}
            />
          </FadeIn>
        </Container>
      </section>

      <Container>
        <FaqAccordion categories={categories} />
      </Container>
    </div>
  );
}
