import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/ui/ImageCarousel";
import SectionHeader from "@/components/ui/SectionHeader";
import FacilitiesFilterGrid from "@/components/hotel/FacilitiesFilterGrid";
import FadeIn from "@/components/motion/FadeIn";
import { getFacilities } from "@/lib/api/content";
import { coalesceList, demoFacilities } from "@/lib/demo-content";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Facilities & Amenities",
  description: "Explore pools, spa, dining, wellness, and other resort facilities.",
};

export default async function FacilitiesPage() {
  const result = await Promise.allSettled([getFacilities()]);
  const facilities = coalesceList(
    result[0].status === "fulfilled" ? asListItems(result[0].value) : [],
    demoFacilities,
  );

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Facilities"
              title="Everything within easy reach"
              description="From morning swims to quiet spa hours — explore the spaces that shape your stay."
            />
          </FadeIn>
          <div className="mt-8">
            <ImageCarousel
              images={[]}
              role="parking"
              aspect="16/10"
              min={3}
              rounded="rounded-[2rem]"
              altFallback="Hotel facilities"
            />
          </div>
        </Container>
      </section>

      <Container>
        <FacilitiesFilterGrid facilities={facilities} />
      </Container>
    </div>
  );
}
