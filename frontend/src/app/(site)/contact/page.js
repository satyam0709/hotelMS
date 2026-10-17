import Image from "next/image";
import { Clock, HelpCircle, Mail, MapPin, MessageSquare, Phone, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import FadeIn from "@/components/motion/FadeIn";
import InquiryForm from "@/components/site/InquiryForm";
import { getFaqs, getSettings } from "@/lib/api/content";
import { demoContactSettings } from "@/lib/demo-content";
import { fallbackSrc } from "@/lib/site-assets";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Contact Concierge & Reservations — ExoStay Resort",
  description:
    "Reach our 24/7 front desk, reservations team, and guest concierge by phone, WhatsApp, email, or online inquiry.",
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
  const brand = settings?.websiteName || siteConfig.name;
  const socials = socialLinks(settings);
  const mapUrl = settings?.mapUrl || "";
  const phone = settings?.phone;
  const whatsapp = settings?.whatsapp || phone;
  const email = settings?.email;
  const address = settings?.address;
  const receptionHours = settings?.receptionHours || "Front desk open 24 hours";

  return (
    <div className="pb-24">
      {/* Cinematic Contact Hero */}
      <section className="relative min-h-[460px] lg:min-h-[520px] flex items-center overflow-hidden border-b border-line bg-ink text-white">
        <Image
          src={fallbackSrc("reception", 0)}
          alt="ExoStay Reception Lobby"
          fill
          priority
          className="object-cover opacity-45 scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />

        <Container className="relative z-10 py-16 sm:py-20">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase backdrop-blur-md">
              <Sparkles className="size-3.5 text-accent-soft" />
              Concierge & Guest Services
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.1]">
              We are here to assist your stay
            </h1>

            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-white/85 font-light">
              Connect with our reservations desk for suite bookings, private dining requests, celebrations, or local itinerary recommendations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Button href="#inquiry-section" size="lg" className="rounded-xl shadow-lg">
                Send an Inquiry
              </Button>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                >
                  <Phone className="size-4" />
                  Call Reception
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* Concierge Channels Cards */}
      <section className="py-12 bg-sand-soft/50 border-b border-line">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-elevated p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-md"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Phone className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-ink font-semibold group-hover:text-accent transition-colors">
                    Direct Phone Line
                  </h3>
                  <p className="mt-1 text-xs text-muted">24/7 Front desk and concierge</p>
                </div>
                <p className="mt-4 font-semibold text-accent text-sm">{phone}</p>
              </a>
            ) : null}

            {whatsapp ? (
              <a
                href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between rounded-2xl border border-line bg-elevated p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-md"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                    <MessageSquare className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-ink font-semibold group-hover:text-brand-green transition-colors">
                    WhatsApp Chat
                  </h3>
                  <p className="mt-1 text-xs text-muted">Instant guest messaging</p>
                </div>
                <p className="mt-4 font-semibold text-brand-green text-sm">Message Concierge</p>
              </a>
            ) : null}

            {email ? (
              <a
                href={`mailto:${email}`}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-elevated p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-md"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Mail className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg text-ink font-semibold group-hover:text-accent transition-colors">
                    Reservations Email
                  </h3>
                  <p className="mt-1 text-xs text-muted">Inquiries & confirmation details</p>
                </div>
                <p className="mt-4 font-semibold text-accent text-sm truncate">{email}</p>
              </a>
            ) : null}

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-elevated p-6 shadow-soft">
              <div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Clock className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg text-ink font-semibold">
                  Operating Hours
                </h3>
                <p className="mt-1 text-xs text-muted">Always ready to welcome you</p>
              </div>
              <p className="mt-4 font-semibold text-ink text-sm">{receptionHours}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Inquiry & Address Section */}
      <section id="inquiry-section" className="section-pad">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] items-start">
            {/* Left Detail Panel */}
            <FadeIn>
              <div className="space-y-6 rounded-[2rem] border border-line bg-elevated p-8 shadow-soft">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                    Resort Address & Hours
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-ink">{brand}</h2>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    Nestled in lush coastal palms with effortless access to regional cultural landmarks and calm waters.
                  </p>
                </div>

                <div className="space-y-4 border-t border-line/70 pt-6 text-sm text-ink/90">
                  {address ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 size-4 shrink-0 text-accent" />
                      <div>
                        <span className="block text-xs font-semibold tracking-wider text-muted uppercase">Location</span>
                        <span className="leading-relaxed">{address}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-start gap-3">
                    <Clock className="mt-1 size-4 shrink-0 text-accent" />
                    <div>
                      <span className="block text-xs font-semibold tracking-wider text-muted uppercase">Reception Desk</span>
                      <span className="leading-relaxed">{receptionHours}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-1 size-4 shrink-0 text-accent" />
                    <div>
                      <span className="block text-xs font-semibold tracking-wider text-muted uppercase">Check-in / Check-out</span>
                      <span className="leading-relaxed">Check-in 2:00 PM · Check-out 11:00 AM</span>
                    </div>
                  </div>
                </div>

                {socials.length ? (
                  <div className="border-t border-line/70 pt-6">
                    <p className="text-xs font-semibold tracking-wider text-muted uppercase">Connect on Social</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {socials.map((item) => (
                        <li key={item.href || item.label}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-line bg-sand-soft/50 px-3.5 py-1.5 text-xs text-ink/80 transition-colors hover:border-accent hover:text-accent"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="border-t border-line/70 pt-6 space-y-3">
                  <Button href="/booking" className="w-full rounded-xl">
                    Instant Room Booking
                  </Button>
                  <Button href="/faqs" variant="secondary" className="w-full rounded-xl">
                    View Guest FAQs
                  </Button>
                </div>
              </div>
            </FadeIn>

            {/* Right Inquiry Form */}
            <FadeIn delay={0.05}>
              <div className="rounded-[2rem] border border-line bg-elevated p-8 sm:p-10 shadow-soft">
                <div className="mb-6">
                  <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                    Inquiry Desk
                  </p>
                  <h3 className="mt-1 font-display text-2xl sm:text-3xl text-ink">
                    Send a note to our concierge
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    We respond to all stay, dining, and celebration requests within 2 to 4 hours.
                  </p>
                </div>

                <InquiryForm defaultType={defaultType} />
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* Map Section */}
      {mapUrl ? (
        <section className="bg-sand-soft/40 border-t border-line py-14">
          <Container>
            <FadeIn>
              <div className="overflow-hidden rounded-[2rem] border border-line bg-elevated shadow-soft">
                <div className="flex items-center justify-between border-b border-line px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                      Directions & Location
                    </p>
                    <h2 className="mt-0.5 font-display text-2xl text-ink">Find us on the map</h2>
                  </div>
                  <span className="text-xs text-muted hidden sm:inline">Valet parking on arrival</span>
                </div>
                <div className="aspect-[16/8] sm:aspect-[21/9] w-full bg-accent-soft">
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
          </Container>
        </section>
      ) : null}
    </div>
  );
}
