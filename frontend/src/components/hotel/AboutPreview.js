import Image from "next/image";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import { fallbackSrc } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

function firstSection(page) {
  return page?.sections?.[0] || null;
}

const DEFAULT_STATS = [
  { label: "Guest satisfaction", value: "98%" },
  { label: "Acres of gardens", value: "12+" },
  { label: "Rooms & suites", value: "40+" },
  { label: "Signature services", value: "24/7" },
];

function secondSectionMedia(page) {
  const sections = page?.sections || [];
  return sections[1]?.media || sections.find((s, i) => i > 0 && s.media)?.media || null;
}

export default function AboutPreview({ page, settings }) {
  const section = firstSection(page);
  const title = section?.title || page?.title || "A sanctuary sculpted for restorative stillness";
  const description = section?.description
    || page?.sections?.find((item) => item.description)?.description
    || "A thoughtfully composed retreat where architecture, landscape, and hospitality meet in quiet balance — designed for guests who value calm, craft, and generous space.";
  const image = section?.media || page?.bannerMedia;
  const imageSrc = mediaUrl(image) || fallbackSrc("about", 0);
  const secondary = secondSectionMedia(page);
  const secondarySrc = mediaUrl(secondary) || fallbackSrc("reception", 0);

  return (
    <section className="section-pad pt-24 md:pt-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <FadeIn>
          <div className="grid grid-cols-[1.15fr_0.85fr] gap-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-accent-soft">
              <Image
                src={imageSrc}
                alt={mediaUrl(image) ? mediaAlt(image, title) : "Resort atmosphere"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 55vw, 28vw"
              />
            </div>
            <div className="relative mt-10 aspect-[3/4] overflow-hidden rounded-md border border-line bg-accent-soft">
              <Image
                src={secondarySrc}
                alt={mediaUrl(secondary) ? mediaAlt(secondary, "Resort detail") : "Reception lobby"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 40vw, 18vw"
              />
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">About the resort</p>
          <h2 className="mt-3 font-display text-3xl text-ink md:text-[2.75rem] md:leading-tight">{title}</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {description}
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4">
            {DEFAULT_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{stat.label}</dt>
                <dd className="mt-2 font-display text-2xl text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <Button href="/about" variant="secondary">
              Discover more
            </Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
