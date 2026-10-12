import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import GalleryPreviewGrid from "@/components/hotel/GalleryPreviewGrid";
import { coalesceList, demoGalleryItems } from "@/lib/demo-content";

export default function HomeGalleryPreview({ items = [] }) {
  const preview = coalesceList(items, demoGalleryItems()).slice(0, 8);

  return (
    <section className="section-pad bg-[linear-gradient(180deg,transparent,var(--brand-cream))]">
      <Container>
        <SectionHeader
          eyebrow="Gallery"
          title="A glimpse of the property"
          description="Rooms, venues, and surroundings — explore the full gallery for more."
          action={<Button href="/gallery" variant="secondary">View gallery</Button>}
        />
        <GalleryPreviewGrid items={preview} />
      </Container>
    </section>
  );
}
