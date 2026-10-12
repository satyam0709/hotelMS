import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import { ApiError } from "@/lib/api/client";
import { getPublicPage, getSettings } from "@/lib/api/content";
import { fallbackSrc } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

async function loadPage(slug) {
  try {
    return await getPublicPage(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) {
    return { title: "Page not found" };
  }
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.subtitle || undefined,
  };
}

export default async function CmsPage({ params }) {
  const { slug } = await params;
  if (slug === "about") redirect("/about");
  if (slug === "home") redirect("/");


  const [page, settingsResult] = await Promise.all([
    loadPage(slug),
    getSettings().catch(() => ({})),
  ]);

  if (!page) notFound();

  const settings = settingsResult || {};
  const brand = settings?.websiteName || siteConfig.name;
  const sections = Array.isArray(page.sections) ? page.sections : [];
  const bannerSrc = mediaUrl(page.bannerMedia);

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              {brand}
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
              {page.title}
            </h1>
          </FadeIn>
        </Container>
      </section>

      {bannerSrc ? (
        <Container className="mb-12">
          <FadeIn>
            <div className="relative aspect-[21/9] overflow-hidden rounded-[2rem] bg-accent-soft">
              <Image
                src={bannerSrc}
                alt={mediaAlt(page.bannerMedia, page.title)}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          </FadeIn>
        </Container>
      ) : null}

      <Container className="space-y-16 md:space-y-20">
        {sections.map((section, index) => {
          const imageSrc = mediaUrl(section.media);
          const reverse = index % 2 === 1;
          return (
            <FadeIn key={section.id || `${section.sectionKey}-${index}`}>
              <section
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-accent-soft md:aspect-[5/4]">
                  <Image
                    src={imageSrc || fallbackSrc("about", (index % 4) + 1)}
                    alt={imageSrc ? mediaAlt(section.media, section.title || page.title) : page.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div>
                  {section.subtitle ? (
                    <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
                      {section.subtitle}
                    </p>
                  ) : null}
                  {section.title ? (
                    <h2 className="mt-3 font-display text-3xl text-ink md:text-5xl">
                      {section.title}
                    </h2>
                  ) : null}
                  {section.description ? (
                    <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-muted md:text-lg">
                      {section.description}
                    </p>
                  ) : null}
                  {section.buttonText && section.buttonLink ? (
                    <div className="mt-8">
                      <Button href={section.buttonLink} variant="secondary">
                        {section.buttonText}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </section>
            </FadeIn>
          );
        })}

        {sections.length === 0 ? (
          <FadeIn>
            <p className="text-base text-muted">This page has no published sections yet.</p>
          </FadeIn>
        ) : null}
      </Container>
    </div>
  );
}
