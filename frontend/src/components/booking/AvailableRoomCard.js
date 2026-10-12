"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { cardHover, cardTap, hoverBright, smoothSpring } from "@/lib/motion/presets";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

export default function AvailableRoomCard({
  room,
  nights,
  selected,
  onSelect,
}) {
  const imageSrc = mediaUrl(room.featuredImage);
  const amenities = Array.isArray(room.amenities) ? room.amenities.slice(0, 4) : [];

  return (
    <motion.article
      className={`motion-interactive-card overflow-hidden rounded-[1.5rem] border bg-elevated ${
        selected
          ? "border-accent shadow-soft ring-2 ring-accent/15"
          : "border-line"
      }`}
      initial={false}
      whileHover={
        selected
          ? undefined
          : {
              y: cardHover.y,
              scale: cardHover.scale,
              filter: hoverBright.filter,
              transition: smoothSpring,
            }
      }
      whileTap={cardTap}
    >
      <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-accent-soft md:aspect-auto md:min-h-full">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={mediaAlt(room.featuredImage, room.name)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 224px"
            />
          ) : (
            <div className="absolute inset-0 media-fallback-bg" />
          )}
        </div>

        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone="line">{room.category?.name || "Room"}</Badge>
                {room.availableInventory != null ? (
                  <Badge>
                    {room.availableInventory} left
                  </Badge>
                ) : null}
              </div>
              <h3 className="font-display text-2xl text-ink md:text-3xl">{room.name}</h3>
              {room.shortDescription ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {room.shortDescription}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs tracking-[0.14em] text-muted uppercase">From</p>
              <p className="font-display text-2xl text-accent">
                {formatCurrency(room.nightlyFrom)}
              </p>
              <p className="text-xs text-muted">per night</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-full border border-line px-2.5 py-1">
              Up to {room.occupancy?.maxOccupancy || "—"} guests
            </span>
            {room.bedType ? (
              <span className="rounded-full border border-line px-2.5 py-1">{room.bedType}</span>
            ) : null}
            {room.roomSize ? (
              <span className="rounded-full border border-line px-2.5 py-1">{room.roomSize}</span>
            ) : null}
            {amenities.map((amenity) => (
              <span
                key={amenity.id || amenity.slug || amenity.name}
                className="rounded-full border border-line px-2.5 py-1"
              >
                {amenity.name}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-sm text-muted">
                {nights || room.nights} night{(nights || room.nights) === 1 ? "" : "s"} · {room.quantity} room
                {room.quantity === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {formatCurrency(room.subtotal)}
                <span className="ml-1 text-xs font-normal text-muted">before tax</span>
              </p>
            </div>
            <Button
              type="button"
              variant={selected ? "primary" : "secondary"}
              onClick={() => onSelect?.(room)}
            >
              {selected ? "Selected" : "Select room"}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
