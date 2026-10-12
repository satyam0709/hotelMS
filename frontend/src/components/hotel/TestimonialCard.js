import Image from "next/image";
import MotionCard from "@/components/motion/MotionCard";
import { formatDateLabel, mediaAlt, mediaUrl } from "@/lib/utils";

export default function TestimonialCard({ item }) {
  const imageSrc = mediaUrl(item.guestImageMedia);
  const rating = Math.max(1, Math.min(5, Number(item.rating) || 5));

  return (
    <MotionCard className="flex h-full flex-col rounded-[1.5rem] border border-line bg-elevated p-5">
      <div className="flex items-center gap-3">
        <div className="relative size-11 overflow-hidden rounded-full bg-accent-soft">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={mediaAlt(item.guestImageMedia, item.guestName)}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-semibold text-accent">
              {item.guestName?.slice(0, 1) || "G"}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{item.guestName}</p>
          <p className="text-xs text-muted">
            {item.source || "Direct"}
            {item.reviewDate ? ` · ${formatDateLabel(item.reviewDate)}` : ""}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/85">“{item.review}”</p>
      <p className="mt-auto pt-5 text-sm font-medium text-accent" aria-label={`${rating} out of 5 stars`}>
        {"★".repeat(rating)}
      </p>
    </MotionCard>
  );
}
