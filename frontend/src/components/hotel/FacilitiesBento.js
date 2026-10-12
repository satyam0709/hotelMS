import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import { MotionSurface } from "@/components/motion/MotionSurface";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { coalesceList, demoFacilities } from "@/lib/demo-content";
import { fallbackAsset } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

function facilityImage(facility) {
  return facility?.media?.[0]?.media || null;
}

export default function FacilitiesBento({ facilities = [] }) {
  const items = coalesceList(facilities, demoFacilities).slice(0, 6);

  return (
    <section className="section-pad">
      <Container>
        <SectionHeader
          eyebrow="Facilities"
          title="Everything within easy reach"
          description="Pool mornings, spa afternoons, and dining that feels like an extension of your room."
          action={<Button href="/facilities" variant="secondary">View all facilities</Button>}
        />

        <Stagger className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {items.map((facility, index) => {
            const image = facilityImage(facility);
            const imageSrc = mediaUrl(image) || fallbackAsset("facility", index).src;
              const wide = index === 0 || index === 3;
              return (
                <StaggerItem
                  key={facility.id}
                  className={wide ? "md:col-span-2" : ""}
                >
                  <MotionSurface className="h-full">
                  <Link
                    href={`/facilities/${facility.slug}`}
                    className="group relative flex min-h-[240px] overflow-hidden rounded-[1.5rem] border border-line bg-elevated"
                  >
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={mediaAlt(image, facility.name)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[linear-gradient(145deg,#e7efe9,#f7f8f7)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                    <div className="relative mt-auto p-5 text-white md:p-6">
                      <h3 className="font-display text-2xl md:text-3xl">{facility.name}</h3>
                      {facility.operatingHours ? (
                        <p className="mt-2 text-sm text-white/80">{facility.operatingHours}</p>
                      ) : null}
                    </div>
                  </Link>
                  </MotionSurface>
                </StaggerItem>
              );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
