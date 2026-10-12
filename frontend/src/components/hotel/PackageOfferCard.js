import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MotionCard from "@/components/motion/MotionCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { bookingSearchHref } from "@/lib/booking-transitions";
import { formatCurrency, mediaAlt, mediaUrl } from "@/lib/utils";

export default function PackageOfferCard({ package: pkg }) {
  const imageSrc = mediaUrl(pkg.bannerMedia);
  const href = `/packages/${pkg.slug}`;
  const bookHref = bookingSearchHref({ packageSlug: pkg.slug });

  return (
    <MotionCard className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
      <div className="flex h-full flex-col">
        <Link href={href} className="relative aspect-[16/10] overflow-hidden bg-accent-soft">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={mediaAlt(pkg.bannerMedia, pkg.name)}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 media-fallback-bg" />
          )}
          {pkg.isFeatured ? (
            <Badge className="absolute top-4 left-4">Featured</Badge>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <Link href={href}>
            <h3 className="font-display text-2xl text-ink group-hover:text-accent">{pkg.name}</h3>
          </Link>
          {pkg.duration ? (
            <p className="mt-1 text-sm text-muted">{pkg.duration}</p>
          ) : null}
          {pkg.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{pkg.description}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
            {pkg.price != null ? (
              <p className="text-lg font-semibold text-accent">
                From {formatCurrency(pkg.price)}
              </p>
            ) : (
              <p className="text-sm font-medium text-muted">Enquire for rates</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button href={href} size="sm" variant="secondary">
                Details
                <ArrowRight className="size-4" />
              </Button>
              <Button href={bookHref} size="sm">
                Book stay
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MotionCard>
  );
}
