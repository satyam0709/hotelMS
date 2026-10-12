import Image from "next/image";
import Link from "next/link";
import MotionCard from "@/components/motion/MotionCard";
import Badge from "@/components/ui/Badge";
import { fallbackAsset } from "@/lib/site-assets";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

function eventImage(event) {
  return event?.media?.[0]?.media || null;
}

export default function EventCard({ event, fallbackIndex = 0 }) {
  const image = eventImage(event);
  const localFallback = fallbackAsset("gallery", fallbackIndex);
  const imageSrc = mediaUrl(image) || localFallback.src;
  const imageAlt = mediaUrl(image) ? mediaAlt(image, event.name) : localFallback.alt;

  return (
    <MotionCard className="group overflow-hidden rounded-[1.5rem] border border-line bg-elevated">
      <Link href={`/events/${event.slug}`} className="block">
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
          <div className="flex flex-wrap gap-2">
            {event.capacity ? <Badge tone="line">Capacity {event.capacity}</Badge> : null}
            {event.basePrice != null ? (
              <Badge>From {formatCurrency(event.basePrice)}</Badge>
            ) : null}
          </div>
          <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
            {event.name}
          </h3>
          {event.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">
              {event.description}
            </p>
          ) : null}
        </div>
      </Link>
    </MotionCard>
  );
}
