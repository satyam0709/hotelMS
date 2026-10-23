import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Check, Maximize2, Sparkles, Users } from "lucide-react";
import MotionCard from "@/components/motion/MotionCard";
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
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-elevated shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_22px_45px_rgba(26,38,30,0.10)]">
      {/* Visual Image Header */}
      <Link
        href={detailHref}
        className="relative block aspect-[16/10] overflow-hidden bg-accent-soft/30 cursor-pointer"
        aria-label={`View details of ${room.name}`}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

        {/* Badges on Image */}
        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold tracking-wider text-ink uppercase shadow-sm backdrop-blur-md">
            {room.category?.name || "Suite"}
          </span>
          {room.isFeatured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-md">
              <Sparkles className="size-3 text-white/90" />
              Featured
            </span>
          ) : null}
        </div>

        {/* Price Tag Floating at bottom of image */}
        <div className="absolute bottom-3 right-3 rounded-2xl bg-black/80 px-3.5 py-1.5 text-right backdrop-blur-md border border-white/20 pointer-events-none shadow-lg">
          <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">Starting from</p>
          <p className="font-display text-lg font-bold text-white leading-tight">
            {formatCurrency(room.nightlyFrom ?? room.basePrice)}
            <span className="ml-1 text-[11px] font-normal text-white/80">/ night</span>
          </p>
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex-1">
          <h3 className="font-display text-xl sm:text-2xl tracking-tight text-ink transition-colors group-hover:text-accent leading-snug">
            <Link href={detailHref} className="inline-flex items-center gap-1.5 group/title">
              <span>{room.name}</span>
              <ArrowUpRight className="size-4 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0 group-hover/title:translate-y-0 text-accent" />
            </Link>
          </h3>

          {room.shortDescription ? (
            <p className="mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted font-light">
              {room.shortDescription}
            </p>
          ) : null}

          {/* Curated Specs Strip */}
          <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-line/70 bg-sand-soft/30 p-2.5 text-center">
            <div className="flex flex-col items-center justify-center">
              <Users className="size-3.5 text-accent" />
              <span className="mt-1 text-[11px] font-medium text-ink">
                {room.maxOccupancy ? `${room.maxOccupancy} Guests` : "2 Guests"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-line/70 px-1">
              <BedDouble className="size-3.5 text-accent" />
              <span className="mt-1 truncate max-w-full text-[11px] font-medium text-ink">
                {room.bedType || "King Bed"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Maximize2 className="size-3.5 text-accent" />
              <span className="mt-1 text-[11px] font-medium text-ink">
                {room.roomSize || "32 m²"}
              </span>
            </div>
          </div>

          {/* Top Amenities Pills */}
          {amenities.length ? (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {amenities.map((amenity) => (
                <span
                  key={amenity.id || amenity.slug || amenity.name}
                  className="inline-flex items-center gap-1 rounded-full bg-sand-soft/50 px-2.5 py-0.5 text-[11px] text-muted border border-line/60"
                >
                  <Check className="size-3 text-accent shrink-0" />
                  <span className="truncate max-w-[120px]">{amenity.name}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
          <Link
            href={detailHref}
            className="text-xs sm:text-sm font-semibold text-ink/80 transition-colors hover:text-accent underline-offset-4 hover:underline"
          >
            Explore details
          </Link>
          <Button
            href={bookHref}
            size="sm"
            className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md"
          >
            Reserve Now
          </Button>
        </div>
      </div>
    </MotionCard>
  );
}
