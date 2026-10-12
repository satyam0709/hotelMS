import Image from "next/image";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import FadeIn from "@/components/motion/FadeIn";
import InquiryForm from "@/components/site/InquiryForm";
import { ApiError } from "@/lib/api/client";
import { getPackage } from "@/lib/api/content";
import { findDemoPackage } from "@/lib/demo-content";
import { formatCurrency, formatDateLabel, mediaAlt, mediaUrl } from "@/lib/utils";

function asStringList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

async function loadPackage(slug) {
  try {
    return await getPackage(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const pkg = await loadPackage(slug).catch(() => null);
  if (!pkg) return { title: "Package not found" };
  return {
    title: pkg.name,
    description: pkg.description || `${pkg.name} — resort package details.`,
  };
}

export default async function PackageDetailPage({ params }) {
  const { slug } = await params;
  const pkg = (await loadPackage(slug)) || findDemoPackage(slug);
  if (!pkg) notFound();

  const imageSrc = mediaUrl(pkg.bannerMedia);
  const inclusions = asStringList(pkg.inclusionsJson);
  const exclusions = asStringList(pkg.exclusionsJson);

  return (
    <div className="pb-20">
      <section className="section-pad pb-8">
        <Container>
          <FadeIn>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">Package</p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">{pkg.name}</h1>
            {pkg.duration ? <p className="mt-2 text-muted">{pkg.duration}</p> : null}
            {pkg.price != null ? (
              <p className="mt-4 text-2xl font-semibold text-accent">
                From {formatCurrency(pkg.price)}
              </p>
            ) : null}
            {(pkg.validFrom || pkg.validTo) ? (
              <p className="mt-2 text-sm text-muted">
                Valid{" "}
                {pkg.validFrom ? formatDateLabel(pkg.validFrom) : "now"}
                {pkg.validTo ? ` — ${formatDateLabel(pkg.validTo)}` : ""}
              </p>
            ) : null}
          </FadeIn>
        </Container>
      </section>

      <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-8">
          {imageSrc ? (
            <FadeIn>
              <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-line bg-accent-soft">
                <Image
                  src={imageSrc}
                  alt={mediaAlt(pkg.bannerMedia, pkg.name)}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              </div>
            </FadeIn>
          ) : null}

          {pkg.description ? (
            <FadeIn>
              <p className="text-base leading-relaxed text-muted">{pkg.description}</p>
            </FadeIn>
          ) : null}

          {inclusions.length ? (
            <FadeIn>
              <h2 className="font-display text-2xl text-ink">Inclusions</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                {inclusions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </FadeIn>
          ) : null}

          {exclusions.length ? (
            <FadeIn>
              <h2 className="font-display text-2xl text-ink">Exclusions</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                {exclusions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </FadeIn>
          ) : null}

          {pkg.terms ? (
            <FadeIn>
              <h2 className="font-display text-2xl text-ink">Terms</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{pkg.terms}</p>
            </FadeIn>
          ) : null}
        </div>

        <FadeIn delay={0.05}>
          <div className="space-y-4 rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft">
            <Button href="/booking" className="w-full">Book a stay</Button>
            <Button href="/packages" variant="secondary" className="w-full">All packages</Button>
            <div className="border-t border-line pt-6">
              <h2 className="font-display text-xl text-ink">Enquire about this package</h2>
              <InquiryForm defaultType="PACKAGE" className="mt-4" sourceRefType={`PACKAGE:${pkg.slug}`} />
            </div>
          </div>
        </FadeIn>
      </Container>
    </div>
  );
}
