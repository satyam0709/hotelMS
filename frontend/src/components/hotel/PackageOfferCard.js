import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Clock, Sparkles } from "lucide-react";
import MotionCard from "@/components/motion/MotionCard";
import Button from "@/components/ui/Button";
import { bookingSearchHref } from "@/lib/booking-transitions";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

export default function PackageOfferCard({ package: pkg }) {
  const imageSrc = mediaUrl(pkg.bannerMedia);
  const href = `/packages/${pkg.slug}`;
  const bookHref = bookingSearchHref({ packageSlug: pkg.slug });

  const inclusions = Array.isArray(pkg.inclusions) && pkg.inclusions.length
    ? pkg.inclusions.slice(0, 3)
    : [
        "Daily gourmet breakfast spread",
        "Welcome wellness drink & treats",
        "Resort recreation & pool access",
      ];

  return (
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-elevated shadow-soft transition-all duration-500 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_20px_35px_rgba(26,38,30,0.08)]">
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-accent-soft/30">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={mediaAlt(pkg.bannerMedia, pkg.name)}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 media-fallback-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between pointer-events-none">
          {pkg.isFeatured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/95 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-md">
              <Sparkles className="size-3 text-white/90" />
              Featured Package
            </span>
          ) : <span />}

          {pkg.duration ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md border border-white/10">
              <Clock className="size-3 text-accent-soft" />
              {pkg.duration}
            </span>
          ) : null}
        </div>

        {/* Floating Price */}
        <div className="absolute bottom-3 right-3.5 rounded-xl bg-black/75 px-3 py-1 text-right backdrop-blur-md border border-white/15">
          <p className="text-[10px] text-white/70 uppercase tracking-wider font-medium">Starting from</p>
          <p className="font-display text-lg font-bold text-white leading-tight">
            {pkg.price != null ? formatCurrency(pkg.price) : "Custom Rate"}
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
            <Link href={href} className="inline-flex items-center gap-1.5">
              <span>{pkg.name}</span>
              <ArrowUpRight className="size-4 opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-accent" />
            </Link>
          </h3>

          {pkg.description ? (
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted">
              {pkg.description}
            </p>
          ) : null}

          {/* Inclusions checklist */}
          <div className="mt-4 space-y-1.5 border-t border-line/60 pt-3.5">
            {inclusions.map((item, idx) => (
              <p key={idx} className="flex items-center gap-2 text-xs text-muted">
                <Check className="size-3.5 text-accent shrink-0" />
                <span className="truncate">{item}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line/70 pt-4">
          <Link
            href={href}
            className="text-xs font-semibold tracking-wider text-ink/80 uppercase hover:text-accent transition-colors"
          >
            Package Inclusions
          </Link>
          <Button href={bookHref} size="sm" className="rounded-xl shadow-sm">
            Reserve Package
          </Button>
        </div>
      </div>
    </MotionCard>
  );
}
