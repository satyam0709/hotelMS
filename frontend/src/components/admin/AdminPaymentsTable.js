"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { listAdminPayments } from "@/lib/api/admin-payments";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

const STATUS_OPTIONS = [
  "",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
];

export default function AdminPaymentsTable() {
  const searchParams = useSearchParams();
  const bookingIdFromUrl = searchParams.get("bookingId") || "";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listAdminPayments({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: status || undefined,
        bookingId: bookingIdFromUrl || undefined,
      });
      setPayload({
        items: data.items,
        total: data.total,
        limit: data.limit,
      });
    } catch {
      if (!silent) setError("Unable to load payments.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, search, status, bookingIdFromUrl]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminRealtime(
    useCallback((event) => {
      if (event?.type === "payment.updated" || String(event?.type || "").startsWith("booking.")) {
        load({ silent: true });
      }
    }, [load]),
  );

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Payments</h1>
        <p className="mt-2 text-sm text-muted">
          Razorpay and desk payments linked to bookings. Open a payment to issue a refund.
        </p>
        {bookingIdFromUrl ? (
          <p className="mt-2 text-xs text-accent">
            Filtered by booking ·{" "}
            <Link href="/admin/payments" className="underline">Clear filter</Link>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Search</label>
          <Input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Booking ref, order id, payment id"
            className="mt-1"
          />
        </div>
        <div className="sm:w-52">
          <label className="text-xs font-medium text-muted">Status</label>
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="mt-1 h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? option.replaceAll("_", " ") : "All statuses"}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {loading ? <LoadingState label="Loading payments" /> : null}
      {error ? <ErrorState title="Payments unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payload.items.length ? payload.items.map((payment) => (
                  <tr key={payment.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{payment.booking?.bookingRef || "—"}</p>
                      <p className="text-xs text-muted">{payment.method || payment.provider}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted">{payment.provider || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {payment.paidAt ? formatDateLabel(payment.paidAt) : formatDateLabel(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/payments/${payment.id}`} className="text-sm text-accent hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>{payload.total} payment{payload.total === 1 ? "" : "s"}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-2 py-2">Page {page} / {totalPages}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
