"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import {
  getAdminPayment,
  refundAdminPayment,
} from "@/lib/api/admin-payments";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

function refundedTotal(refunds = []) {
  return refunds
    .filter((item) => ["PENDING", "PROCESSING", "SUCCEEDED"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export default function AdminPaymentDetail({ paymentId }) {
  const { admin } = useAdminAuth();
  const canRefund = hasPermission(admin, "payments.refund");
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await getAdminPayment(paymentId);
      setPayment(data);
    } catch {
      if (!silent) {
        setError("Payment not found or access denied.");
        setPayment(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminRealtime(
    useCallback((event) => {
      if (event?.type !== "payment.updated" && !String(event?.type || "").startsWith("booking.")) return;
      if (event.bookingId && payment?.bookingId && event.bookingId !== payment.bookingId) return;
      load({ silent: true });
    }, [load, payment?.bookingId]),
  );

  const remaining = useMemo(() => {
    if (!payment) return 0;
    return Math.max(0, Number(payment.amount || 0) - refundedTotal(payment.refunds));
  }, [payment]);

  const refundable = payment && ["PAID", "PARTIALLY_REFUNDED"].includes(payment.status) && remaining > 0;

  async function handleRefund(event) {
    event.preventDefault();
    if (!window.confirm("Issue this refund? This cannot be undone from the admin panel.")) return;
    setBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      const result = await refundAdminPayment(paymentId, {
        amount: amount.trim() ? amount.trim() : undefined,
        reason: reason.trim() || null,
      });
      setPayment(result?.payment || result);
      setAmount("");
      setReason("");
      setActionMessage("Refund submitted successfully.");
      if (!result?.payment) await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Unable to process refund.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading payment" />;
  if (error || !payment) {
    return (
      <ErrorState
        title="Payment unavailable"
        description={error || "Unknown error"}
        action={<Button href="/admin/payments">Back to payments</Button>}
      />
    );
  }

  const refunds = Array.isArray(payment.refunds) ? payment.refunds : [];

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/payments" className="hover:text-accent">Payments</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{payment.booking?.bookingRef || payment.id}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">
            {formatCurrency(payment.amount, payment.currency)}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {payment.provider || "Provider"} · {payment.method || "—"} · created {formatDateLabel(payment.createdAt)}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Booking</h2>
          {payment.booking?.id ? (
            <p className="mt-3">
              <Link href={`/admin/bookings/${payment.booking.id}`} className="font-medium text-accent hover:underline">
                {payment.booking.bookingRef}
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-muted">No booking linked</p>
          )}
          <p className="mt-2 text-sm text-muted">
            Booking status: {payment.booking?.status || "—"} · Payment status: {payment.booking?.paymentStatus || "—"}
          </p>
          <p className="mt-2 text-sm text-muted">
            Booking total: {formatCurrency(payment.booking?.totalAmount, payment.booking?.currency || payment.currency)}
          </p>
          {payment.bookingId ? (
            <Link
              href={`/admin/payments?bookingId=${payment.bookingId}`}
              className="mt-3 inline-block text-sm text-accent hover:underline"
            >
              All payments for this booking
            </Link>
          ) : null}
        </section>

        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Provider details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Order ID</dt>
              <dd className="break-all text-right text-ink">{payment.providerOrderId || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Payment ID</dt>
              <dd className="break-all text-right text-ink">{payment.providerPaymentId || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Transaction</dt>
              <dd className="break-all text-right text-ink">{payment.transactionId || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Paid at</dt>
              <dd className="text-ink">{payment.paidAt ? formatDateLabel(payment.paidAt) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Refundable left</dt>
              <dd className="font-medium text-ink">{formatCurrency(remaining, payment.currency)}</dd>
            </div>
          </dl>
        </section>
      </div>

      {canRefund && refundable ? (
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Issue refund</h2>
          <p className="mt-2 text-sm text-muted">
            Leave amount blank to refund the full remaining balance ({formatCurrency(remaining, payment.currency)}).
          </p>
          <form onSubmit={handleRefund} className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
            <Input
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(remaining)}
            />
            <Input
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Guest request / overcharge / …"
            />
            <Button type="submit" disabled={busy}>{busy ? "Processing…" : "Refund"}</Button>
          </form>
          {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
          {actionMessage ? <p className="mt-3 text-sm text-accent">{actionMessage}</p> : null}
        </section>
      ) : null}

      {!canRefund ? (
        <p className="text-sm text-muted">You do not have permission to issue refunds.</p>
      ) : null}

      <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
        <h2 className="font-display text-xl text-ink">Refund history</h2>
        {refunds.length ? (
          <ul className="mt-4 divide-y divide-line/80">
            {refunds.map((refund) => (
              <li key={refund.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{formatCurrency(refund.amount, payment.currency)}</p>
                  <p className="text-xs text-muted">
                    {refund.reason || "No reason"} · {formatDateLabel(refund.processedAt || refund.createdAt)}
                  </p>
                  {refund.providerRefundId ? (
                    <p className="text-[11px] text-muted break-all">{refund.providerRefundId}</p>
                  ) : null}
                </div>
                <StatusBadge status={refund.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No refunds yet.</p>
        )}
      </section>
    </div>
  );
}
