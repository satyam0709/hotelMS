import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/ui/ImageCarousel";
import OfferBannerGrid from "@/components/hotel/OfferBannerGrid";
import PackageOfferCard from "@/components/hotel/PackageOfferCard";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import InquiryForm from "@/components/site/InquiryForm";
import { getBanners, getPackages } from "@/lib/api/content";
import { bannerImageUrl } from "@/lib/banners";
import { coalesceList, demoBanners, demoPackages } from "@/lib/demo-content";

export const metadata = {
  title: "Packages & Offers",
  description: "Seasonal stays, celebrations, and special packages at the resort.",
};

export default async function PackagesPage() {
  const [packagesResult, bannersResult] = await Promise.allSettled([
    getPackages(),
    getBanners(),
  ]);

  const packages = coalesceList(
    packagesResult.status === "fulfilled" && Array.isArray(packagesResult.value)
      ? packagesResult.value
      : [],
    demoPackages,
  );
  const banners = coalesceList(
    bannersResult.status === "fulfilled" && Array.isArray(bannersResult.value)
      ? bannersResult.value
      : [],
    demoBanners,
  );

  const offerImages = banners
    .map((banner) => ({
      src: bannerImageUrl(banner),
      alt: banner.title || "Package offer",
    }))
    .filter((item) => item.src);

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Packages"
              title="Stays worth planning ahead"
              description="Curated bundles with inclusions, validity, and clear pricing."
              action={
                <div className="flex flex-wrap gap-3">
                  <Button href="/booking">Book a stay</Button>
                  <Button href="/contact?type=PACKAGE" variant="secondary">Contact</Button>
                </div>
              }
            />
          </FadeIn>
          <div className="mt-8">
            <ImageCarousel
              images={offerImages}
              role="hero"
              aspect="21/9"
              min={2}
              rounded="rounded-[2rem]"
              altFallback="Package stay"
            />
          </div>
        </Container>
      </section>

      <Container className="space-y-12">
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <PackageOfferCard package={pkg} />
            </StaggerItem>
          ))}
        </Stagger>

        <div>
          <h2 className="font-display text-2xl text-ink">Current promotions</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Limited-time stays and celebration offers curated by the resort team.
          </p>
          <OfferBannerGrid banners={banners} className="mt-6 grid gap-4 md:grid-cols-2" />
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft">
            <h2 className="font-display text-2xl text-ink">How packages work</h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
              <li>Choose a bundle or promotion and note the validity window.</li>
              <li>Send a package inquiry with your dates and group size.</li>
              <li>Our team confirms availability and any seasonal extras.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ink">Package inquiry</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tell us your dates and what you are celebrating — we will share available bundles and offers.
            </p>
            <InquiryForm defaultType="PACKAGE" className="mt-6" sourceRefType="PACKAGE_PAGE" />
          </div>
        </div>
      </Container>
    </div>
  );
}
