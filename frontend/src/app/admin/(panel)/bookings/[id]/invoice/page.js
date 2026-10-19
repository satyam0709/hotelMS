"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { getAdminBookingInvoice } from "@/lib/api/admin-bookings";
import { formatCurrency, formatDateLabel } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/config";

export default function AdminBookingInvoicePage({ params }) {
  const unwrappedParams = use(params);
  const bookingId = unwrappedParams?.id;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getAdminBookingInvoice(bookingId);
        if (mounted) setInvoice(data);
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to load invoice.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (bookingId) load();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  if (loading) {
    return <LoadingState label="Loading invoice..." />;
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <ErrorState title="Invoice not available" description={error || "Could not retrieve invoice."} />
        <div className="mt-4">
          <Button href={`/admin/bookings/${bookingId}`} variant="secondary">
            Back to booking
          </Button>
        </div>
      </div>
    );
  }

  const amounts = invoice.amounts || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];

  return (
    <div className="p-4 md:p-8 print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Top Bar (Hidden during print) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/bookings/${bookingId}`}
            className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to booking
          </Link>
          <span className="text-line">/</span>
          <span className="text-sm text-ink font-semibold">{invoice.invoiceNumber}</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${getApiBaseUrl()}/api/admin/bookings/${bookingId}/invoice/pdf`}
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-elevated px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-muted/10 transition-colors"
          >
            <Download className="h-4 w-4 text-muted" />
            Download PDF
          </a>
          <Button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-line bg-elevated p-8 shadow-sm md:p-12 print:max-w-none print:border-none print:bg-white print:p-0 print:shadow-none text-ink">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">INVOICE</h1>
            <p className="mt-1 text-sm font-mono text-muted">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tracking-wide uppercase text-accent">Hotel Management</p>
            <p className="mt-1 text-xs text-muted">
              Issued: {formatDateLabel(invoice.issuedAt)}
            </p>
            <p className="text-xs text-muted">Booking Ref: <span className="font-mono font-medium text-ink">{invoice.bookingRef}</span></p>
          </div>
        </div>

        {/* Guest & Stay Details */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-line/60 bg-muted/5 p-4 print:border print:bg-transparent">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Billed To (Guest)</h3>
            <p className="mt-2 text-base font-semibold text-ink">{invoice.guest?.fullName || "—"}</p>
            {invoice.guest?.email ? (
              <p className="text-sm text-muted">{invoice.guest.email}</p>
            ) : null}
            {invoice.guest?.phone ? (
              <p className="text-sm text-muted">{invoice.guest.phone}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-line/60 bg-muted/5 p-4 print:border print:bg-transparent">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Stay Period</h3>
            <p className="mt-2 text-sm font-medium text-ink">
              {formatDateLabel(invoice.stay?.checkIn)} → {formatDateLabel(invoice.stay?.checkOut)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {invoice.stay?.adults || 1} Adult(s)
              {invoice.stay?.children ? ` · ${invoice.stay.children} Child(ren)` : ""}
              {invoice.stay?.roomCount ? ` · ${invoice.stay.roomCount} Room(s)` : ""}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-muted/10 text-xs font-medium tracking-wider text-muted uppercase">
              <tr>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rooms.map((row, index) => (
                <tr key={`${row.room?.slug || index}`}>
                  <td className="py-3.5 px-4 font-medium text-ink">
                    {row.room?.name || "Room"}
                    <span className="block text-xs text-muted font-normal">
                      {row.adults} adult(s){row.children ? `, ${row.children} child` : ""}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-muted">{row.quantity}</td>
                  <td className="py-3.5 px-4 text-right font-medium text-ink">
                    {formatCurrency(row.totalAmount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-medium text-ink">{formatCurrency(amounts.subtotal, invoice.currency)}</span>
            </div>
            {Number(amounts.discountAmount) > 0 ? (
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span className="font-medium text-ink">−{formatCurrency(amounts.discountAmount, invoice.currency)}</span>
              </div>
            ) : null}
            {Number(amounts.extraBedAmount) > 0 ? (
              <div className="flex justify-between text-muted">
                <span>Extra Bed</span>
                <span className="font-medium text-ink">+{formatCurrency(amounts.extraBedAmount, invoice.currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted">
              <span>Tax / GST</span>
              <span className="font-medium text-ink">{formatCurrency(amounts.taxAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-ink">
              <span>Total Amount</span>
              <span>{formatCurrency(amounts.totalAmount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary Footer */}
        <div className="mt-8 border-t border-line pt-6 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              Status: <span className="font-semibold text-ink uppercase">{invoice.status}</span>
            </p>
            <p>
              Payment: <span className="font-semibold text-ink uppercase">{invoice.paymentStatus}</span> ({invoice.paymentMethod?.replaceAll("_", " ")})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
