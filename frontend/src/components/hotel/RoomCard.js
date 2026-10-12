import Image from "next/image";
import Link from "next/link";
import MotionCard from "@/components/motion/MotionCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fallbackAsset } from "@/lib/site-assets";
import { bookingSearchHref } from "@/lib/booking-transitions";
import {
  formatCurrency,
  mediaAlt,
  mediaUrl,
  pickFeaturedRoomImage,
  roomAmenities,
} from "@/lib/utils";

export default function RoomCard({ room, bookingHref, fallbackIndex = 0 }) {
  const image = pickFeaturedRoomImage(room);
  const localFallback = fallbackAsset("room", fallbackIndex);
  const imageSrc = mediaUrl(image) || localFallback.src;
  const imageAlt = mediaUrl(image) ? mediaAlt(image, room.name) : localFallback.alt;
  const amenities = roomAmenities(room).slice(0, 3);
  const detailHref = `/rooms/${room.slug}`;
  const bookHref = bookingHref || bookingSearchHref({ roomSlug: room.slug });

  return (
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-line bg-elevated shadow-[0_1px_0_rgba(255,255,255,0.8)]">
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-accent-soft">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {room.isFeatured ? (
            <div className="absolute top-3 left-3">
              <Badge>Featured</Badge>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">
              {room.category?.name || "Room"}
            </p>
            <h3 className="mt-1 font-display text-2xl text-ink">
              <Link href={detailHref} className="transition-colors hover:text-accent">
                {room.name}
              </Link>
            </h3>
          </div>
          <p className="text-sm font-semibold text-accent">
            {formatCurrency(room.nightlyFrom ?? room.basePrice)}
            <span className="block text-[11px] font-normal tracking-normal text-muted">
              per night
            </span>
          </p>
        </div>

        {room.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {room.shortDescription}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">
            Up to {room.maxOccupancy} guests
          </span>
          {room.bedType ? (
            <span className="rounded-full border border-line px-2.5 py-1">{room.bedType}</span>
          ) : null}
          {room.roomSize ? (
            <span className="rounded-full border border-line px-2.5 py-1">{room.roomSize}</span>
          ) : null}
          {amenities.map((amenity) => (
            <span key={amenity.id || amenity.slug || amenity.name} className="rounded-full border border-line px-2.5 py-1">
              {amenity.name}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button href={detailHref} variant="secondary" size="sm">
            View Details
          </Button>
          <Button href={bookHref} size="sm">
            Book Now
          </Button>
        </div>
      </div>
    </MotionCard>
  );
}
