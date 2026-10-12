import Image from "next/image";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { bannerHref, bannerImage } from "@/lib/banners";
import { mediaAlt, mediaUrl } from "@/lib/utils";

export default function OfferBannerGrid({ banners = [], className = "" }) {
  const items = banners.slice(0, 12);

  if (!items.length) return null;

  return (
    <Stagger className={className || "grid gap-4 md:grid-cols-2"}>
      {items.map((banner) => {
        const media = bannerImage(banner);
        const src = mediaUrl(media);
        const href = bannerHref(banner);
        return (
          <StaggerItem key={banner.id}>
            <article className="group overflow-hidden rounded-[1.75rem] border border-line bg-elevated shadow-soft">
              <Link href={href} className="block">
                <div className="relative aspect-[16/9] overflow-hidden bg-accent-soft">
                  {src ? (
                    <Image
                      src={src}
                      alt={mediaAlt(media, banner.title)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-green),var(--brand-lime))]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-display text-2xl md:text-3xl">{banner.title}</h3>
                    {banner.subtitle ? (
                      <p className="mt-2 max-w-md text-sm text-white/85">{banner.subtitle}</p>
                    ) : null}
                    {banner.ctaText ? (
                      <p className="mt-4 text-sm font-semibold text-white/95">{banner.ctaText} →</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
