import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { bannerHref, bannerImage } from "@/lib/banners";
import { coalesceList, demoBanners } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

export default function SpecialOffersStrip({ banners = [] }) {
  const items = coalesceList(banners, demoBanners).slice(0, 4);
  const [featured, ...rest] = items;

  if (!items.length) return null;

  const featuredMedia = bannerImage(featured);
  const featuredSrc = mediaUrl(featuredMedia) || fallbackSrc("hero", 0);

  return (
    <section className="section-pad relative overflow-hidden bg-elevated/70">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 size-72 rounded-full bg-brand-warm/25 blur-3xl"
      />
      <Container className="relative">
        <SectionHeader
          eyebrow="Offers"
          title="Curated seasonal retreats"
          description="Limited-time stays, celebrations, and package inclusions composed by the resort team."
          action={
            <Button href="/packages" variant="secondary" className="rounded-full">
              All packages
            </Button>
          }
        />

        <FadeIn className="mt-10">
          <Link
            href={bannerHref(featured)}
            className="group relative grid min-h-[280px] overflow-hidden rounded-[2rem] shadow-[0_22px_60px_rgba(28,25,23,0.16)] md:min-h-[340px] lg:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="relative min-h-[220px] lg:min-h-full">
              <Image
                src={featuredSrc}
                alt={mediaAlt(featuredMedia, featured.title)}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/90 via-brand-green/55 to-transparent" />
            </div>
            <div className="relative flex flex-col justify-center bg-[linear-gradient(145deg,#2c6700_0%,#3f8510_55%,#92cd00_130%)] px-7 py-8 text-white md:px-10 md:py-12">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-white/75 uppercase">
                Featured offer
              </p>
              <h3 className="mt-3 font-display text-3xl md:text-4xl">{featured.title}</h3>
              {featured.subtitle ? (
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
                  {featured.subtitle}
                </p>
              ) : null}
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
                {featured.ctaText || "Explore offer"}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </FadeIn>

        {rest.length ? (
          <Stagger className="mt-5 grid gap-4 md:grid-cols-3">
            {rest.map((banner, index) => {
              const media = bannerImage(banner);
              const src = mediaUrl(media) || fallbackSrc("gallery", index + 2);
              return (
                <StaggerItem key={banner.id}>
                  <Link
                    href={bannerHref(banner)}
                    className="group relative block overflow-hidden rounded-[1.75rem] border border-line bg-elevated shadow-soft transition duration-400 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(44,103,0,0.12)]"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden">
                      <Image
                        src={src}
                        alt={mediaAlt(media, banner.title)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <h3 className="font-display text-xl md:text-2xl">{banner.title}</h3>
                        {banner.subtitle ? (
                          <p className="mt-1 line-clamp-2 text-sm text-white/80">{banner.subtitle}</p>
                        ) : null}
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-white/95">
                          {banner.ctaText || "View offer"}
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        ) : null}
      </Container>
    </section>
  );
}
