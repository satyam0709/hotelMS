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

export default function RoomCard({ room, bookingHref, fallbackIndex = 0, layout = "grid" }) {
  const image = pickFeaturedRoomImage(room);
  const localFallback = fallbackAsset("room", fallbackIndex);
  const imageSrc = mediaUrl(image) || localFallback.src;
  const imageAlt = mediaUrl(image) ? mediaAlt(image, room.name) : localFallback.alt;
  const amenities = roomAmenities(room);
  const displayAmenities = layout === "row" ? amenities.slice(0, 5) : amenities.slice(0, 3);
  const detailHref = `/rooms/${room.slug}`;
  const bookHref = bookingHref || bookingSearchHref({ roomSlug: room.slug });

  // 1. Horizontal Row Layout (Inspired by reference Tripster/InnSeeker, styled in ExoStay brand palette)
  if (layout === "row") {
    return (
      <MotionCard className="group overflow-hidden rounded-2xl border border-line/80 bg-elevated shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-accent/40 hover:shadow-[0_16px_36px_rgba(44,103,0,0.08)]">
        <div className="grid md:grid-cols-[18rem_minmax(0,1fr)_14rem] lg:grid-cols-[20rem_minmax(0,1fr)_15rem] items-stretch">
          {/* Left: Room Thumbnail */}
          <Link
            href={detailHref}
            className="relative block aspect-[16/10] md:aspect-auto md:min-h-full overflow-hidden bg-accent-soft/30 cursor-pointer"
            aria-label={`View details of ${room.name}`}
          >
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 md:hidden pointer-events-none" />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
              <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wider text-ink uppercase shadow-xs backdrop-blur-md">
                {room.category?.name || "Suite"}
              </span>
              {room.isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-white shadow-xs backdrop-blur-md">
                  <Sparkles className="size-2.5 text-white/90" />
                  Featured
                </span>
              ) : null}
            </div>
          </Link>

          {/* Center: Room Details & Amenities */}
          <div className="flex flex-col justify-between p-5 md:p-6 md:border-r border-line/60">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
                  <Link href={detailHref} className="inline-flex items-center gap-1.5 group/title">
                    <span>{room.name}</span>
                    <ArrowUpRight className="size-4 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0 group-hover/title:translate-y-0 text-accent" />
                  </Link>
                </h3>
              </div>

              {/* Bed, Occupancy & Size row */}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5 text-ink font-medium">
                  <BedDouble className="size-3.5 text-accent" />
                  {room.bedType || "King Bed"}
                </span>
                <span className="text-line">•</span>
                <span className="inline-flex items-center gap-1.5 text-ink font-medium">
                  <Users className="size-3.5 text-accent" />
                  {room.maxOccupancy ? `${room.maxOccupancy} Guests` : "2 Guests"}
                </span>
                <span className="text-line">•</span>
                <span className="inline-flex items-center gap-1.5 text-ink font-medium">
                  <Maximize2 className="size-3.5 text-accent" />
                  {room.roomSize || "32 m²"}
                </span>
              </div>

              {room.shortDescription ? (
                <p className="mt-3 line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted font-normal">
                  {room.shortDescription}
                </p>
              ) : null}

              {/* Amenity Badges */}
              {displayAmenities.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {displayAmenities.map((amenity) => (
                    <span
                      key={amenity.id || amenity.slug || amenity.name}
                      className="inline-flex items-center gap-1 rounded-md bg-sand-soft/50 px-2.5 py-1 text-[11px] font-medium text-ink/80 border border-line/60"
                    >
                      <Check className="size-2.5 text-accent shrink-0" />
                      <span>{amenity.name}</span>
                    </span>
                  ))}
                  <span className="inline-flex items-center rounded-md bg-accent-soft/40 px-2 py-1 text-[10.5px] font-medium text-accent border border-accent/20">
                    Free Cancellation
                  </span>
                </div>
              ) : null}
            </div>

            {/* Quick Explore Link on bottom */}
            <div className="mt-4 pt-3 border-t border-line/50 flex items-center justify-between">
              <Link
                href={detailHref}
                className="text-xs font-semibold text-ink/80 transition-colors hover:text-accent underline-offset-4 hover:underline"
              >
                View room details &amp; gallery →
              </Link>
            </div>
          </div>

          {/* Right: Reviews, Price & Booking CTA */}
          <div className="flex flex-col justify-between bg-sand-soft/15 p-5 md:p-6 border-t md:border-t-0 border-line/60">
            {/* Guest Rating Badge */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-1.5">
              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-ink leading-tight">Excellent</p>
                <p className="text-[10.5px] text-muted">Verified Guest Reviews</p>
              </div>
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white shadow-xs">
                4.9
              </span>
            </div>

            {/* Pricing Stack & CTA */}
            <div className="mt-4 md:mt-auto pt-4 border-t border-line/60 md:border-t-0 md:pt-0">
              <div className="md:text-right">
                <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">Starting from</p>
                <p className="font-display text-2xl font-bold text-ink leading-tight">
                  {formatCurrency(room.nightlyFrom ?? room.basePrice)}
                </p>
                <p className="text-[11px] text-muted">per night · taxes included</p>
              </div>

              <div className="mt-3.5 space-y-2">
                <Button
                  href={bookHref}
                  size="sm"
                  className="w-full h-10 rounded-xl text-xs sm:text-sm font-semibold shadow-soft hover:shadow-md"
                >
                  Reserve Now
                </Button>
                <Button
                  href={detailHref}
                  variant="secondary"
                  size="sm"
                  className="w-full h-9 rounded-xl text-xs font-medium"
                >
                  Explore Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MotionCard>
    );
  }

  // 2. Standard Grid Card Layout (for Homepage Featured Rooms, etc.)
  return (
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-[1.35rem] border border-line/80 bg-elevated shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-400 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_16px_36px_rgba(44,103,0,0.12)]">
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 50vw, 33vw"
        />

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

        {/* Badges on Image */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none gap-2">
          <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-ink uppercase shadow-sm backdrop-blur-md">
            {room.category?.name || "Suite"}
          </span>
          {room.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-md">
              <Sparkles className="size-2.5 text-white/90" />
              Featured
            </span>
          ) : null}
        </div>

        {/* Price Tag Floating at bottom of image */}
        <div className="absolute bottom-2.5 right-2.5 rounded-xl bg-black/75 px-3 py-1 text-right backdrop-blur-md border border-white/20 pointer-events-none shadow-md">
          <p className="text-[9px] font-medium tracking-wider text-white/70 uppercase leading-none">Starting from</p>
          <p className="font-display text-base font-bold text-white leading-tight mt-0.5">
            {formatCurrency(room.nightlyFrom ?? room.basePrice)}
            <span className="ml-1 text-[10px] font-normal text-white/80">/ night</span>
          </p>
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex-1 flex flex-col">
          <h3 className="font-display text-lg sm:text-xl tracking-tight text-ink transition-colors group-hover:text-accent leading-snug">
            <Link href={detailHref} className="inline-flex items-center gap-1 group/title">
              <span>{room.name}</span>
              <ArrowUpRight className="size-3.5 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0 group-hover/title:translate-y-0 text-accent shrink-0" />
            </Link>
          </h3>

          {room.shortDescription ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted font-normal min-h-[2rem]">
              {room.shortDescription}
            </p>
          ) : (
            <div className="mt-1.5 min-h-[2rem]" />
          )}

          {/* Curated Specs Strip */}
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-line/70 bg-sand-soft/30 p-2 text-center">
            <div className="flex flex-col items-center justify-center">
              <Users className="size-3.5 text-accent" />
              <span className="mt-1 text-[10.5px] font-medium text-ink truncate max-w-full">
                {room.maxOccupancy ? `${room.maxOccupancy} Guests` : "2 Guests"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-line/70 px-1">
              <BedDouble className="size-3.5 text-accent" />
              <span className="mt-1 truncate max-w-full text-[10.5px] font-medium text-ink" title={room.bedType || "King Bed"}>
                {room.bedType || "King Bed"}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Maximize2 className="size-3.5 text-accent" />
              <span className="mt-1 text-[10.5px] font-medium text-ink truncate max-w-full">
                {room.roomSize || "32 m²"}
              </span>
            </div>
          </div>

          {/* Top Amenities Pills */}
          <div className="mt-3 flex flex-wrap gap-1.5 min-h-[1.75rem]">
            {displayAmenities.length ? (
              displayAmenities.map((amenity) => (
                <span
                  key={amenity.id || amenity.slug || amenity.name}
                  className="inline-flex items-center gap-1 rounded-full bg-sand-soft/40 px-2 py-0.5 text-[10.5px] text-muted border border-line/60"
                >
                  <Check className="size-2.5 text-accent shrink-0" />
                  <span className="truncate max-w-[105px]">{amenity.name}</span>
                </span>
              ))
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/70 pt-3.5">
          <Link
            href={detailHref}
            className="text-xs font-semibold text-ink/80 transition-colors hover:text-accent underline-offset-4 hover:underline"
          >
            Explore details
          </Link>
          <Button
            href={bookHref}
            size="sm"
            className="h-9 rounded-xl px-3.5 py-1 text-xs font-semibold shadow-xs hover:shadow-sm"
          >
            Reserve Now
          </Button>
        </div>
      </div>
    </MotionCard>
  );
}
