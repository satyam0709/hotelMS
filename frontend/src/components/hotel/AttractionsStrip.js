import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { coalesceList, demoAttractions } from "@/lib/demo-content";
import { fallbackAsset } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

export default function AttractionsStrip({ attractions = [] }) {
  const items = coalesceList(attractions, demoAttractions);

  return (
    <section className="section-pad bg-elevated/50">
      <Container>
        <SectionHeader
          eyebrow="Nearby"
          title="Places worth the short drive"
          description="Landmarks, nature trails, and local favorites around the property."
          action={<Button href="/attractions" variant="secondary">View all</Button>}
        />
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.slice(0, 4).map((item, index) => {
            const local = fallbackAsset("gallery", index);
            const imageSrc = mediaUrl(item.media) || local.src;
            return (
              <StaggerItem key={item.id}>
                <Link
                  href={`/attractions/${item.slug}`}
                  className="group block overflow-hidden rounded-[1.35rem] border border-line bg-elevated"
                >
                  <div className="relative aspect-[4/3] bg-accent-soft">
                    <Image
                      src={imageSrc}
                      alt={mediaUrl(item.media) ? mediaAlt(item.media, item.name) : local.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-xl text-ink">{item.name}</h3>
                    {item.distance ? (
                      <p className="mt-1 text-sm text-muted">{item.distance}</p>
                    ) : null}
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
