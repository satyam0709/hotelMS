import Image from "next/image";
import Link from "next/link";
import MotionCard from "@/components/motion/MotionCard";
import Badge from "@/components/ui/Badge";
import { fallbackAsset } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

function facilityImage(facility) {
  return facility?.media?.[0]?.media || null;
}

export default function FacilityCard({ facility, fallbackIndex = 0 }) {
  const image = facilityImage(facility);
  const localFallback = fallbackAsset("facility", fallbackIndex);
  const imageSrc = mediaUrl(image) || localFallback.src;
  const imageAlt = mediaUrl(image) ? mediaAlt(image, facility.name) : localFallback.alt;

  return (
    <MotionCard className="group overflow-hidden rounded-[1.5rem] border border-line bg-elevated">
      <Link href={`/facilities/${facility.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-accent-soft">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {facility.category ? <Badge tone="line">{facility.category}</Badge> : null}
          </div>
          <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
            {facility.name}
          </h3>
          {facility.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">
              {facility.description}
            </p>
          ) : null}
          {facility.operatingHours ? (
            <p className="text-xs tracking-wide text-accent">{facility.operatingHours}</p>
          ) : null}
        </div>
      </Link>
    </MotionCard>
  );
}
