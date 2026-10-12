import Link from "next/link";
import Button from "@/components/ui/Button";
import PrintButton from "@/components/ui/PrintButton";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import FadeIn from "@/components/motion/FadeIn";
import { ApiError } from "@/lib/api/client";
import { getInvoice } from "@/lib/api/booking";
import { getSettings } from "@/lib/api/content";
import { formatCurrency, formatDateLabel } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Booking invoice",
  description: "View or print your booking invoice.",
};

export default async function BookingInvoicePage({ searchParams }) {
  const params = await searchParams;
  const bookingRef = params?.bookingRef || "";
  const email = params?.email || undefined;
  const phone = params?.phone || undefined;

  const settingsResult = await Promise.allSettled([getSettings()]);
  const settings = settingsResult[0].status === "fulfilled" ? settingsResult[0].value : {};
  const brand = settings?.websiteName || siteConfig.name;

  if (!bookingRef || !email || !phone) {
    return (
      <div className="section-pad">
        <Container>
          <EmptyState
            title="Invoice lookup required"
            description="Open this page from your booking confirmation, or use find booking with the same contact details."
            action={<Button href="/booking/lookup">Find booking</Button>}
          />
        </Container>
      </div>
    );
  }

  let invoice = null;
  let errorMessage = "";
  try {
    invoice = await getInvoice(bookingRef, { email, phone });
  } catch (error) {
    errorMessage = error instanceof ApiError ? error.message : "Unable to load invoice.";
  }

  if (errorMessage) {
    return (
      <div className="section-pad">
        <Container>
          <ErrorState title="Invoice not available" description={errorMessage} />
        </Container>
      </div>
    );
  }

  const amounts = invoice?.amounts || {};
  const rooms = Array.isArray(invoice?.rooms) ? invoice.rooms : [];

  return (
    <div className="pb-20 print:pb-0">
      <section className="section-pad pb-6 print:hidden">
        <Container>
          <FadeIn>
            <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
              <Link href="/booking/lookup" className="hover:text-accent">Find booking</Link>
              <span className="mx-2 text-line">/</span>
              <span className="text-ink">Invoice</span>
            </nav>
            <h1 className="font-display text-3xl text-ink md:text-4xl">Invoice</h1>
          </FadeIn>
        </Container>
      </section>

      <Container>
        <article className="mx-auto max-w-3xl rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft md:p-10 print:border-0 print:shadow-none">
          <header className="border-b border-line pb-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{brand}</p>
            <h2 className="mt-2 font-display text-3xl text-ink">{invoice.invoiceNumber}</h2>
            <p className="mt-2 text-sm text-muted">
              Issued {formatDateLabel(invoice.issuedAt)} · Booking {invoice.bookingRef}
            </p>
          </header>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs tracking-[0.14em] text-muted uppercase">Guest</p>
              <p className="mt-1 font-medium text-ink">{invoice.guest?.fullName}</p>
              {invoice.guest?.email ? <p className="text-sm text-muted">{invoice.guest.email}</p> : null}
              {invoice.guest?.phone ? <p className="text-sm text-muted">{invoice.guest.phone}</p> : null}
            </div>
            <div>
              <p className="text-xs tracking-[0.14em] text-muted uppercase">Stay</p>
              <p className="mt-1 text-sm text-ink">
                {formatDateLabel(invoice.stay?.checkIn)} → {formatDateLabel(invoice.stay?.checkOut)}
              </p>
              <p className="text-sm text-muted">
                {invoice.stay?.adults} adults
                {invoice.stay?.children ? ` · ${invoice.stay.children} children` : ""}
                {invoice.stay?.roomCount ? ` · ${invoice.stay.roomCount} room(s)` : ""}
              </p>
            </div>
          </div>

          <table className="mt-8 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-[0.12em] text-muted uppercase">
                <th className="py-2 pr-4">Room</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((row, index) => (
                <tr key={`${row.room?.slug || "room"}-${index}`} className="border-b border-line/70">
                  <td className="py-3 pr-4 text-ink">{row.room?.name || "Room"}</td>
                  <td className="py-3 pr-4 text-muted">{row.quantity}</td>
                  <td className="py-3 text-right font-medium text-ink">
                    {formatCurrency(row.totalAmount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4 text-muted">
              <dt>Subtotal</dt>
              <dd className="text-ink">{formatCurrency(amounts.subtotal, invoice.currency)}</dd>
            </div>
            {Number(amounts.discountAmount) > 0 ? (
              <div className="flex justify-between gap-4 text-muted">
                <dt>Discount</dt>
                <dd className="text-ink">−{formatCurrency(amounts.discountAmount, invoice.currency)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 text-muted">
              <dt>Tax</dt>
              <dd className="text-ink">{formatCurrency(amounts.taxAmount, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatCurrency(amounts.totalAmount, invoice.currency)}</dd>
            </div>
          </dl>

          <p className="mt-8 text-xs text-muted">
            Payment status: {invoice.paymentStatus} · {invoice.paymentMethod?.replaceAll("_", " ")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <Button
              href={`/booking/confirmation?bookingRef=${encodeURIComponent(bookingRef)}${email ? `&email=${encodeURIComponent(email)}` : ""}${phone ? `&phone=${encodeURIComponent(phone)}` : ""}`}
              variant="secondary"
            >
              Back to booking
            </Button>
            <PrintButton label="Print invoice" />
          </div>
        </article>
      </Container>
    </div>
  );
}
