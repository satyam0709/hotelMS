import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { demoFacilities } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

function facilityImage(item, index) {
  const first = Array.isArray(item?.media) ? item.media[0]?.media || item.media[0] : item?.media;
  return mediaUrl(first) || fallbackSrc("facility", index) || fallbackSrc("gallery", index);
}

function padExperiences(list = []) {
  const source = Array.isArray(list) ? list.filter(Boolean) : [];
  if (source.length >= 4) return source.slice(0, 4);
  const seen = new Set(source.map((item) => item.slug || item.id));
  const fillers = demoFacilities.filter((item) => !seen.has(item.slug));
  return [...source, ...fillers].slice(0, 4);
}

export default function SignatureExperiences({ facilities = [] }) {
  const items = padExperiences(facilities);
  const [featured, ...rest] = items;

  return (
    <section className="section-pad relative overflow-hidden border-y border-line/60 bg-[linear-gradient(180deg,#f7f5ef_0%,#fffdf8_55%,#f3f0e6_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(146,205,0,0.12),transparent_60%)]"
      />
      <Container className="relative">
        <SectionHeader
          eyebrow="Experiences"
          title="Signature resort experiences"
          description="Wellness, water, dining, and quiet rituals — composed for guests who prefer depth over distraction."
          align="center"
          action={
            <Button href="/facilities" variant="secondary" size="sm" className="rounded-full">
              All experiences
            </Button>
          }
        />

        {featured ? (
          <FadeIn className="mt-12">
            <Link
              href={`/facilities/${featured.slug}`}
              className="group grid overflow-hidden rounded-[2rem] border border-line/80 bg-elevated shadow-[0_18px_50px_rgba(28,25,23,0.08)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(44,103,0,0.14)] lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="relative min-h-[260px] overflow-hidden lg:min-h-[360px]">
                <Image
                  src={facilityImage(featured, 0)}
                  alt={mediaAlt(featured.media?.[0]?.media || featured.media, featured.name)}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-ink/10" />
              </div>
              <div className="flex flex-col justify-center px-7 py-8 md:px-10 md:py-12">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
                  {featured.category || "Featured"}
                </p>
                <h3 className="mt-3 font-display text-3xl text-ink md:text-4xl">{featured.name}</h3>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {featured.description
                    ? String(featured.description).slice(0, 180)
                    : "A signature amenity designed for unhurried mornings and soft evenings."}
                  {featured.description && featured.description.length > 180 ? "…" : ""}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-green">
                  Learn more
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </FadeIn>
        ) : null}

        {rest.length ? (
          <Stagger className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item, index) => (
              <StaggerItem key={item.id || item.slug}>
                <Link
                  href={`/facilities/${item.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line/80 bg-elevated shadow-soft transition duration-400 hover:-translate-y-1 hover:border-brand-green/30 hover:shadow-[0_18px_40px_rgba(44,103,0,0.12)]"
                >
                  <div className="relative aspect-[16/11] overflow-hidden bg-accent-soft">
                    <Image
                      src={facilityImage(item, index + 1)}
                      alt={mediaAlt(item.media?.[0]?.media || item.media, item.name)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-5 py-5">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
                      {item.category || "Resort"}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{item.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {item.description
                        ? String(item.description).slice(0, 110)
                        : "Discover amenities crafted for slow mornings and unhurried evenings."}
                      {item.description && item.description.length > 110 ? "…" : ""}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-ink uppercase transition-colors group-hover:text-accent">
                      Learn more
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        ) : null}
      </Container>
    </section>
  );
}
