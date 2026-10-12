"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { getAdminBookingInvoice } from "@/lib/api/admin-payments";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

export default function AdminBookingInvoice({ bookingId }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAdminBookingInvoice(bookingId);
        if (active) setInvoice(data);
      } catch {
        if (active) setError("Unable to load invoice.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) return <LoadingState label="Loading invoice" />;
  if (error || !invoice) {
    return (
      <ErrorState
        title="Invoice unavailable"
        description={error || "Unknown error"}
        action={<Button href={`/admin/bookings/${bookingId}`}>Back to booking</Button>}
      />
    );
  }

  const amounts = invoice.amounts || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/bookings" className="hover:text-accent">Bookings</Link>
        <span className="mx-2">/</span>
        <Link href={`/admin/bookings/${bookingId}`} className="hover:text-accent">
          {invoice.bookingRef}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Invoice</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{invoice.invoiceNumber}</h1>
          <p className="mt-2 text-sm text-muted">
            Issued {formatDateLabel(invoice.issuedAt)} · Booking {invoice.bookingRef}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Guest</h2>
          <p className="mt-3 font-medium text-ink">{invoice.guest?.fullName || "—"}</p>
          {invoice.guest?.email ? <p className="text-sm text-muted">{invoice.guest.email}</p> : null}
          {invoice.guest?.phone ? <p className="text-sm text-muted">{invoice.guest.phone}</p> : null}
        </section>
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Stay</h2>
          <p className="mt-3 text-sm text-muted">
            {formatDateLabel(invoice.stay?.checkIn)} → {formatDateLabel(invoice.stay?.checkOut)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {invoice.stay?.adults} adults
            {invoice.stay?.children ? ` · ${invoice.stay.children} children` : ""}
            {invoice.stay?.roomCount ? ` · ${invoice.stay.roomCount} room(s)` : ""}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
        <h2 className="font-display text-xl text-ink">Rooms</h2>
        <ul className="mt-4 space-y-3">
          {rooms.map((row, index) => (
            <li key={`${row.room?.slug || index}`} className="flex justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm">
              <span>{row.room?.name || "Room"} × {row.quantity}</span>
              <span className="font-medium text-ink">{formatCurrency(row.totalAmount, invoice.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-ink">{formatCurrency(amounts.subtotal, invoice.currency)}</dd>
          </div>
          {amounts.discountAmount ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Discount</dt>
              <dd className="text-ink">−{formatCurrency(amounts.discountAmount, invoice.currency)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Tax</dt>
            <dd className="text-ink">{formatCurrency(amounts.taxAmount, invoice.currency)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-base font-semibold">
            <dt className="text-ink">Total</dt>
            <dd>{formatCurrency(amounts.totalAmount, invoice.currency)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted">
          Payment status: {invoice.paymentStatus} · {String(invoice.paymentMethod || "").replaceAll("_", " ")}
        </p>
      </section>
    </div>
  );
}
