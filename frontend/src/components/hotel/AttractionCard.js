import Image from "next/image";
import Link from "next/link";
import MotionCard from "@/components/motion/MotionCard";
import { fallbackAsset } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

export default function AttractionCard({ attraction, fallbackIndex = 0 }) {
  const localFallback = fallbackAsset("gallery", fallbackIndex);
  const cmsSrc = mediaUrl(attraction.media);
  const imageSrc = cmsSrc || localFallback.src;
  const imageAlt = cmsSrc ? mediaAlt(attraction.media, attraction.name) : localFallback.alt;

  return (
    <MotionCard className="group overflow-hidden rounded-[1.5rem] border border-line bg-elevated">
      <Link href={`/attractions/${attraction.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-accent-soft">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="space-y-2 p-5">
          <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
            {attraction.name}
          </h3>
          {attraction.distance ? (
            <p className="text-sm text-accent">{attraction.distance}</p>
          ) : null}
          {attraction.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">
              {attraction.description}
            </p>
          ) : null}
        </div>
      </Link>
    </MotionCard>
  );
}
