import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/ui/ImageCarousel";
import SectionHeader from "@/components/ui/SectionHeader";
import AttractionCard from "@/components/hotel/AttractionCard";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { getAttractions } from "@/lib/api/content";
import { coalesceList, demoAttractions } from "@/lib/demo-content";
import { asListItems } from "@/lib/utils";

export const metadata = {
  title: "Nearby Attractions",
  description: "Places worth visiting near the hotel and resort.",
};

export default async function AttractionsPage() {
  const result = await Promise.allSettled([getAttractions({ limit: 50 })]);
  const attractions = coalesceList(
    result[0].status === "fulfilled" ? asListItems(result[0].value) : [],
    demoAttractions,
  );

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Nearby"
              title="Places worth the short drive"
              description="Landmarks, nature trails, and local favorites around the property."
            />
          </FadeIn>
          <div className="mt-8">
            <ImageCarousel
              images={[]}
              role="gallery"
              aspect="21/9"
              min={3}
              rounded="rounded-[2rem]"
              altFallback="Nearby places"
            />
          </div>
        </Container>
      </section>

      <Container>
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {attractions.map((item, index) => (
            <StaggerItem key={item.id}>
              <AttractionCard attraction={item} fallbackIndex={index} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </div>
  );
}
