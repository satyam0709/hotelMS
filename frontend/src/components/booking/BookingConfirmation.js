"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormFeedback from "@/components/ui/FormFeedback";
import { ApiError } from "@/lib/api/client";
import {
  createPaymentOrder,
  requestBookingCancellation,
  verifyPayment,
} from "@/lib/api/booking";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

const GUEST_CANCELLABLE = new Set(["PENDING", "PENDING_PAYMENT", "CONFIRMED"]);

export default function BookingConfirmation({
  booking,
  lookup,
  brandName,
  pendingPayment = false,
}) {
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [current, setCurrent] = useState(booking);

  const canPayOnline = current?.paymentMethod === "ONLINE"
    && ["PENDING_PAYMENT", "PENDING"].includes(current?.status)
    && current?.paymentStatus !== "PAID";

  const canCancel = GUEST_CANCELLABLE.has(current?.status)
    && current?.status !== "CANCELLED"
    && current?.status !== "EXPIRED";

  async function resumePayment() {
    setPaying(true);
    setError("");
    try {
      const order = await createPaymentOrder({
        bookingRef: current.bookingRef,
        email: lookup.email,
        phone: lookup.phone,
      });

      const razorpayResponse = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: brandName || "Hotel booking",
        description: `Booking ${current.bookingRef}`,
        prefill: {
          name: current.guest?.fullName,
          email: lookup.email || current.guest?.email || undefined,
          contact: lookup.phone || current.guest?.phone || undefined,
        },
      });

      const verified = await verifyPayment({
        bookingRef: current.bookingRef,
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature,
        email: lookup.email,
        phone: lookup.phone,
      });

      if (verified?.booking) setCurrent(verified.booking);
    } catch (err) {
      if (err?.message === "Payment cancelled.") {
        setError("Payment was cancelled. You can try again while the hold is active.");
      } else {
        setError(err instanceof ApiError ? err.message : err?.message || "Payment failed.");
      }
    } finally {
      setPaying(false);
    }
  }

  async function submitCancellation() {
    setCancelling(true);
    setError("");
    setMessage("");
    try {
      const updated = await requestBookingCancellation({
        bookingRef: current.bookingRef,
        email: lookup.email,
        phone: lookup.phone,
        reason: cancelReason.trim() || undefined,
      });
      setCurrent(updated);
      setShowCancelForm(false);
      setMessage(
        updated?.cancelRequestSubmitted
          ? "Cancel request sent. Our team will confirm shortly."
          : "Your booking has been cancelled.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err?.message || "Unable to cancel booking.");
    } finally {
      setCancelling(false);
    }
  }

  if (!current) return null;

  const rooms = Array.isArray(current.rooms) ? current.rooms : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
      <div className="rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft md:p-8">
        <p className={`text-xs font-semibold tracking-[0.18em] uppercase ${
          current.status === "CANCELLED"
            ? "text-rose-600"
            : current.status === "EXPIRED"
              ? "text-amber-600"
              : "text-accent"
        }`}>
          {current.status === "CANCELLED"
            ? "Booking cancelled"
            : current.status === "EXPIRED"
              ? "Hold expired"
              : "Booking confirmation"}
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {current.status === "CONFIRMED"
            ? "You're reserved"
            : current.status === "CANCELLED"
              ? "Reservation cancelled"
              : current.status === "EXPIRED"
                ? "Hold has expired"
                : "Booking received"}
        </h1>
        <p className="mt-3 text-base text-muted">
          Reference <span className="font-semibold text-ink">{current.bookingRef}</span>
          {current.status === "CANCELLED"
            ? " — this booking has been cancelled and inventory released."
            : current.status === "EXPIRED"
              ? " — the temporary inventory hold expired before payment was completed."
              : pendingPayment && canPayOnline
                ? " — complete payment to confirm your hold."
                : current.guest?.email
                  ? " — a confirmation email will be sent when the stay is confirmed."
                  : "."}
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line px-4 py-3">
            <dt className="text-xs tracking-[0.14em] text-muted uppercase">Status</dt>
            <dd className="mt-1 font-medium text-ink">{current.status.replaceAll("_", " ")}</dd>
          </div>
          <div className="rounded-2xl border border-line px-4 py-3">
            <dt className="text-xs tracking-[0.14em] text-muted uppercase">Payment</dt>
            <dd className="mt-1 font-medium text-ink">
              {current.paymentStatus} · {current.paymentMethod?.replaceAll("_", " ")}
            </dd>
          </div>
          <div className="rounded-2xl border border-line px-4 py-3">
            <dt className="text-xs tracking-[0.14em] text-muted uppercase">Check-in</dt>
            <dd className="mt-1 font-medium text-ink">{formatDateLabel(current.checkInDate)}</dd>
          </div>
          <div className="rounded-2xl border border-line px-4 py-3">
            <dt className="text-xs tracking-[0.14em] text-muted uppercase">Check-out</dt>
            <dd className="mt-1 font-medium text-ink">{formatDateLabel(current.checkOutDate)}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <h2 className="font-display text-2xl text-ink">Rooms</h2>
          <ul className="mt-4 space-y-3">
            {rooms.map((item, index) => (
              <li
                key={`${item.room?.slug || "room"}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{item.room?.name || "Room"}</p>
                  <p className="text-sm text-muted">
                    Qty {item.quantity} · {item.adults} adults
                    {item.children ? ` · ${item.children} children` : ""}
                  </p>
                </div>
                <p className="font-semibold text-accent">{formatCurrency(item.totalAmount)}</p>
              </li>
            ))}
          </ul>
        </div>

        <FormFeedback status="success" message={message} className="mt-6" />
        <FormFeedback status="error" message={error} className="mt-6" />

        {showCancelForm && canCancel ? (
          <div className="mt-6 space-y-3 rounded-2xl border border-line bg-canvas/60 p-4">
            <p className="text-sm font-medium text-ink">Cancel this booking?</p>
            <p className="text-xs text-muted">
              Inventory will be released immediately. This cannot be undone online.
            </p>
            <label className="block">
              <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
                Reason (optional)
              </span>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent"
                placeholder="Tell us why you’re cancelling…"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={submitCancellation}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Confirm cancellation"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCancelForm(false)}
                disabled={cancelling}
              >
                Keep booking
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {canPayOnline ? (
            <Button type="button" onClick={resumePayment} disabled={paying || cancelling}>
              {paying ? "Opening payment…" : "Complete payment"}
            </Button>
          ) : null}
          {canCancel && !showCancelForm ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCancelForm(true);
                setError("");
                setMessage("");
              }}
              disabled={paying || cancelling}
            >
              Cancel booking
            </Button>
          ) : null}
          <Button
            href={`/booking/invoice?bookingRef=${encodeURIComponent(current.bookingRef)}${lookup.email ? `&email=${encodeURIComponent(lookup.email)}` : ""}${lookup.phone ? `&phone=${encodeURIComponent(lookup.phone)}` : ""}`}
            variant="secondary"
          >
            View invoice
          </Button>
          <Button href="/rooms" variant="secondary">
            Browse rooms
          </Button>
          <Button href="/" variant="ghost">
            Back home
          </Button>
        </div>
      </div>

      <aside className="h-fit rounded-[1.75rem] border border-line bg-elevated p-6 shadow-soft">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Amount
        </p>
        <div className="mt-4 space-y-2 text-sm text-muted">
          <p className="flex justify-between gap-3">
            <span>Subtotal</span>
            <span className="text-ink">{formatCurrency(current.subtotal)}</span>
          </p>
          {Number(current.discountAmount) > 0 ? (
            <p className="flex justify-between gap-3">
              <span>Discount</span>
              <span className="text-ink">−{formatCurrency(current.discountAmount)}</span>
            </p>
          ) : null}
          {Number(current.extraBedAmount) > 0 ? (
            <p className="flex justify-between gap-3">
              <span>Extra beds</span>
              <span className="text-ink">{formatCurrency(current.extraBedAmount)}</span>
            </p>
          ) : null}
          <p className="flex justify-between gap-3">
            <span>Tax</span>
            <span className="text-ink">{formatCurrency(current.taxAmount)}</span>
          </p>
          <p className="flex justify-between gap-3 border-t border-line pt-3 text-lg font-semibold text-ink">
            <span>Total</span>
            <span>{formatCurrency(current.totalAmount)}</span>
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-5 text-sm text-muted">
          <p className="font-medium text-ink">{current.guest?.fullName}</p>
          {current.guest?.email ? <p className="mt-1">{current.guest.email}</p> : null}
          {current.guest?.phone ? <p className="mt-1">{current.guest.phone}</p> : null}
          {current.expiresAt && canPayOnline ? (
            <p className="mt-4 text-xs">
              Hold expires {formatDateLabel(current.expiresAt)} (local display). Complete payment to confirm.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
