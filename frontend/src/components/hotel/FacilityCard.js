import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import MotionCard from "@/components/motion/MotionCard";
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
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-elevated shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_20px_35px_rgba(26,38,30,0.08)]">
      <Link href={`/facilities/${facility.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-accent-soft/30">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />

        {facility.category ? (
          <div className="absolute top-3.5 left-3.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold tracking-wider text-ink uppercase backdrop-blur-md shadow-sm">
            {facility.category}
          </div>
        ) : null}

        {facility.operatingHours ? (
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center gap-1.5 rounded-xl bg-black/65 px-3 py-1.5 text-xs text-white/90 backdrop-blur-md border border-white/10">
            <Clock3 className="size-3.5 text-accent-soft shrink-0" />
            <span className="truncate">{facility.operatingHours}</span>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
            <Link href={`/facilities/${facility.slug}`} className="inline-flex items-center gap-1.5">
              <span>{facility.name}</span>
              <ArrowUpRight className="size-4 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-accent" />
            </Link>
          </h3>

          {facility.description ? (
            <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">
              {facility.description}
            </p>
          ) : null}
        </div>

        <div className="mt-6 border-t border-line/70 pt-4 flex items-center justify-between">
          <Link
            href={`/facilities/${facility.slug}`}
            className="text-xs font-semibold tracking-wider text-accent uppercase hover:underline"
          >
            Explore Facility
          </Link>
          <Link
            href="/contact"
            className="text-xs text-muted hover:text-ink transition-colors"
          >
            Guest Enquiries
          </Link>
        </div>
      </div>
    </MotionCard>
  );
}
