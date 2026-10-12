import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import ImageCarousel from "@/components/ui/ImageCarousel";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import ContactInfoCards from "@/components/site/ContactInfoCards";
import InquiryForm from "@/components/site/InquiryForm";
import { getFaqs, getSettings } from "@/lib/api/content";
import { demoContactSettings } from "@/lib/demo-content";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Contact Us",
  description: "Reach the hotel team by phone, email, or inquiry form.",
};

function socialLinks(settings) {
  if (Array.isArray(settings?.socialLinksJson)) return settings.socialLinksJson;
  if (settings?.socialLinksJson && typeof settings.socialLinksJson === "object") {
    return Object.entries(settings.socialLinksJson).map(([label, href]) => ({ label, href }));
  }
  return [];
}

const INQUIRY_TYPES = new Set([
  "CONTACT",
  "BOOKING",
  "RESTAURANT",
  "EVENT",
  "PACKAGE",
  "GENERAL",
]);

export default async function ContactPage({ searchParams }) {
  const params = await searchParams;
  const requestedType = String(params?.type || "CONTACT").toUpperCase();
  const defaultType = INQUIRY_TYPES.has(requestedType) ? requestedType : "CONTACT";
  const [settingsResult, faqsResult] = await Promise.allSettled([
    getSettings(),
    getFaqs(),
  ]);

  const apiSettings = settingsResult.status === "fulfilled" ? settingsResult.value : {};
  const settings = { ...demoContactSettings, ...apiSettings };
  const faqs = faqsResult.status === "fulfilled" && Array.isArray(faqsResult.value)
    ? faqsResult.value
    : [];
  const brand = settings?.websiteName || siteConfig.name;
  const socials = socialLinks(settings);
  const mapUrl = settings?.mapUrl || "";

  return (
    <div className="pb-20">
      <section className="section-pad pb-10">
        <Container>
          <FadeIn>
            <SectionHeader
              eyebrow="Contact"
              title={`Talk to ${brand}`}
              description="Questions about stays, dining, or events — reach reception or send an inquiry."
            />
          </FadeIn>
        </Container>
      </section>

      <Container className="mb-10">
        <ImageCarousel
          images={[]}
          role="reception"
          aspect="21/9"
          min={1}
          rounded="rounded-[2rem]"
          altFallback={`${brand} reception`}
          className="mb-8"
        />
        <ContactInfoCards settings={settings} />
      </Container>

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,1.15fr)]">
          <FadeIn>
            <aside className="space-y-5 rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                  Reach us
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink">{brand}</h2>
              </div>

              <div className="space-y-4 text-sm text-ink/90">
                {settings?.phone ? (
                  <a href={`tel:${settings.phone}`} className="flex items-start gap-3 hover:text-accent">
                    <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs tracking-[0.14em] text-muted uppercase">Phone</span>
                      {settings.phone}
                    </span>
                  </a>
                ) : null}
                {settings?.whatsapp ? (
                  <a
                    href={`https://wa.me/${String(settings.whatsapp).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 hover:text-accent"
                  >
                    <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs tracking-[0.14em] text-muted uppercase">WhatsApp</span>
                      {settings.whatsapp}
                    </span>
                  </a>
                ) : null}
                {settings?.email ? (
                  <a href={`mailto:${settings.email}`} className="flex items-start gap-3 hover:text-accent">
                    <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs tracking-[0.14em] text-muted uppercase">Email</span>
                      {settings.email}
                    </span>
                  </a>
                ) : null}
                {settings?.address ? (
                  <p className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs tracking-[0.14em] text-muted uppercase">Address</span>
                      {settings.address}
                    </span>
                  </p>
                ) : null}
                {settings?.receptionHours ? (
                  <p className="flex items-start gap-3">
                    <Clock className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      <span className="block text-xs tracking-[0.14em] text-muted uppercase">Reception hours</span>
                      {settings.receptionHours}
                    </span>
                  </p>
                ) : null}
              </div>

              {socials.length ? (
                <div className="border-t border-line pt-5">
                  <p className="text-xs tracking-[0.14em] text-muted uppercase">Social</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {socials.map((item) => (
                      <li key={item.href || item.label}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="border-t border-line pt-5">
                <Button href="/booking" className="w-full">
                  Book a stay
                </Button>
                <Button href="/faqs" variant="secondary" className="mt-3 w-full">
                  View FAQs
                </Button>
              </div>
            </aside>
          </FadeIn>

          <FadeIn delay={0.05}>
            <InquiryForm defaultType={defaultType} />
          </FadeIn>
        </div>

        {mapUrl ? (
          <FadeIn className="mt-10">
            <div className="overflow-hidden rounded-[2rem] border border-line bg-elevated shadow-soft">
              <div className="border-b border-line px-5 py-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                  Location
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">Find us on the map</h2>
              </div>
              <div className="aspect-[16/9] w-full bg-accent-soft">
                <iframe
                  title="Hotel location map"
                  src={mapUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </FadeIn>
        ) : null}
      </Container>
    </div>
  );
}
