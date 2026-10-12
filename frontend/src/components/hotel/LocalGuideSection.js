import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { coalesceList, demoAttractions } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";

export default function LocalGuideSection({ attractions = [], settings = {} }) {
  const list = coalesceList(attractions, demoAttractions).slice(0, 5);
  const hero = list[0];
  const heroSrc = mediaUrl(hero?.media) || fallbackSrc("gallery", 0);
  const address = typeof settings?.address === "string" ? settings.address : "";
  const region = settings?.city || address.split(",").slice(-2, -1)[0]?.trim() || "the region";

  return (
    <section className="section-pad">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[5/4] overflow-hidden rounded-md border border-line bg-accent-soft lg:aspect-[4/5]">
            <Image
              src={heroSrc}
              alt={mediaUrl(hero?.media) ? mediaAlt(hero?.media, hero?.name || "Local area") : "Local area"}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">Local guide</p>
            <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl">
              Discover {region}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
              Trails, viewpoints, and cultural stops within easy reach of the property — curated for day trips and sunset drives.
            </p>

            <ul className="mt-8 divide-y divide-line border-y border-line">
              {list.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{item.name}</p>
                    {item.distance ? (
                      <p className="mt-0.5 text-xs text-muted">{item.distance}</p>
                    ) : null}
                  </div>
                  <Link
                    href={`/attractions/${item.slug}`}
                    className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs font-semibold tracking-wide text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    Read more
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Button href="/attractions" variant="secondary">View local guide</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
