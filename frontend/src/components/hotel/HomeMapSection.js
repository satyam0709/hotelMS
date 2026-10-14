import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

/**
 * HomeMapSection
 *
 * Shows an embedded Google Maps iframe (mapUrl from admin Settings)
 * alongside hotel contact info. Falls back gracefully if mapUrl is absent.
 *
 * Props:
 *   settings  - siteSettings object (address, phone, receptionHours, mapUrl, websiteName, email)
 */
export default function HomeMapSection({ settings = {} }) {
  const mapUrl          = settings?.mapUrl || "";
  const address         = settings?.address || "";
  const phone           = settings?.phone || "";
  const receptionHours  = settings?.receptionHours || "Front desk open 24 hours";
  const brand           = settings?.websiteName || "Our Hotel";

  /* Build a Google Maps directions link from the address */
  const directionsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : "https://maps.google.com";

  return (
    <section className="py-16 md:py-20 bg-[linear-gradient(180deg,#f7f5ef_0%,#fffdf8_60%,#f0f2e8_100%)]">
      <Container>
        {/* Section header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              Location
            </p>
            <h2 className="mt-2 font-display text-4xl text-ink md:text-5xl">
              Find us on the map
            </h2>
            <p className="mt-3 max-w-md text-base text-muted">
              Nestled in a prime location  easy to reach, impossible to forget.
            </p>
          </div>
          <Button
            href={directionsHref}
            variant="secondary"
            size="md"
            target="_blank"
            rel="noreferrer"
          >
            <Navigation className="size-4" />
            Get directions
          </Button>
        </div>

        {/* Map + info grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(17rem,0.38fr)]">
          {/* Map embed */}
          <div className="overflow-hidden rounded-[2rem] border border-line bg-elevated shadow-soft">
            {mapUrl ? (
              <div className="aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-auto lg:h-[480px]">
                <iframe
                  title={`${brand} location map`}
                  src={mapUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : (
              /* Fallback placeholder when no mapUrl is configured */
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 bg-accent-soft/40 sm:aspect-[16/9] lg:h-[480px]">
                <MapPin className="size-10 text-accent/40" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-ink/60">Map not configured yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Admin ? Settings ? Map URL to embed Google Maps
                  </p>
                </div>
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 rounded-xl border border-line bg-elevated px-4 py-2 text-xs font-semibold text-ink transition hover:border-accent/40 hover:text-accent"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Contact info sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Address card */}
            <div className="flex-1 rounded-[1.5rem] border border-line bg-elevated p-6 shadow-soft">
              <div className="flex size-9 items-center justify-center rounded-full bg-accent/10 mb-4">
                <MapPin className="size-4 text-accent" />
              </div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Address</p>
              {address ? (
                <p className="mt-2 font-medium text-ink leading-relaxed">{address}</p>
              ) : (
                <p className="mt-2 text-sm text-muted italic">Address not set</p>
              )}
              {address && (
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  <Navigation className="size-3" />
                  Open in Maps
                </a>
              )}
            </div>

            {/* Phone card */}
            {phone && (
              <div className="rounded-[1.5rem] border border-line bg-elevated p-6 shadow-soft">
                <div className="flex size-9 items-center justify-center rounded-full bg-accent/10 mb-4">
                  <Phone className="size-4 text-accent" />
                </div>
                <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Phone</p>
                <a
                  href={`tel:${phone}`}
                  className="mt-2 block font-medium text-ink hover:text-accent transition-colors"
                >
                  {phone}
                </a>
              </div>
            )}

            {/* Hours card */}
            <div className="rounded-[1.5rem] border border-line bg-elevated p-6 shadow-soft">
              <div className="flex size-9 items-center justify-center rounded-full bg-accent/10 mb-4">
                <Clock className="size-4 text-accent" />
              </div>
              <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Reception hours</p>
              <p className="mt-2 font-medium text-ink">{receptionHours}</p>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
