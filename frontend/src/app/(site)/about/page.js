import Image from "next/image";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/ui/ImageCarousel";
import FadeIn from "@/components/motion/FadeIn";
import { ApiError } from "@/lib/api/client";
import { getPublicPage, getSettings } from "@/lib/api/content";
import { getDemoAboutPage } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { mediaAlt, mediaUrl } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "About Us",
  description: "Our story, hospitality philosophy, and the spirit of the resort.",
};

async function loadAboutPage() {
  try {
    return await getPublicPage("about");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function AboutPage() {
  const [pageResult, settingsResult] = await Promise.allSettled([
    loadAboutPage(),
    getSettings(),
  ]);

  const page = (pageResult.status === "fulfilled" && pageResult.value) || getDemoAboutPage();
  const settings = settingsResult.status === "fulfilled" ? settingsResult.value : null;
  const rawBrand = settings?.websiteName;
  const brand = !rawBrand || /hotel\s*l?ms/i.test(rawBrand) ? siteConfig.name : rawBrand;

  const sections = Array.isArray(page.sections) && page.sections.length
    ? page.sections
    : getDemoAboutPage().sections;
  const bannerSrc = mediaUrl(page.bannerMedia);

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Our story
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-6xl">
              {page.title || `About ${brand}`}
            </h1>
          </FadeIn>
        </Container>
      </section>

      <Container className="mb-12">
        <FadeIn>
          <ImageCarousel
            images={bannerSrc ? [{ src: bannerSrc, alt: mediaAlt(page.bannerMedia, page.title || brand) }] : []}
            role="about"
            aspect="21/9"
            min={2}
            rounded="rounded-[2rem]"
            altFallback={page.title || brand}
            sizes="100vw"
          />
        </FadeIn>
      </Container>

      <Container className="space-y-16 md:space-y-20">
        {sections.map((section, index) => {
            const imageSrc = mediaUrl(section.media);
            const reverse = index % 2 === 1;
            return (
              <FadeIn key={section.id}>
                <section
                  className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                    reverse ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-accent-soft md:aspect-[5/4]">
                    <Image
                      src={imageSrc || fallbackSrc("about", index + 1)}
                      alt={imageSrc ? mediaAlt(section.media, section.title || page.title) : "Resort story"}
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

        <FadeIn>
          <div className="overflow-hidden rounded-[2rem] bg-accent px-6 py-12 text-white md:px-12 md:py-14">
            <h2 className="font-display text-3xl md:text-4xl">
              Experience {brand} for yourself
            </h2>
            <p className="mt-4 max-w-xl text-white/80">
              Explore rooms, plan dates, or speak with the team about your stay.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/booking" className="bg-white text-accent hover:bg-white/90">
                Book a stay
              </Button>
              <Button
                href="/contact"
                variant="secondary"
                className="border-white/25 bg-white/10 text-white hover:bg-white/15"
              >
                Contact us
              </Button>
            </div>
          </div>
        </FadeIn>
      </Container>
    </div>
  );
}
