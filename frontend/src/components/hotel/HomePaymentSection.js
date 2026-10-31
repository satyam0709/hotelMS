"use client";

import { useState } from "react";
import { CreditCard, Search, CheckCircle, XCircle, AlertCircle, Lock, Zap, Shield } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import {
  getBooking,
  createPaymentOrder,
  verifyPayment,
} from "@/lib/api/booking";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { formatCurrency, formatDateLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* --- Status badge ------------------------------------------------ */
function StatusBadge({ status }) {
  const map = {
    CONFIRMED:       { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
    PENDING_PAYMENT: { color: "bg-amber-100 text-amber-700 border-amber-200",      icon: AlertCircle },
    PENDING:         { color: "bg-amber-100 text-amber-700 border-amber-200",      icon: AlertCircle },
    CANCELLED:       { color: "bg-rose-100 text-rose-700 border-rose-200",         icon: XCircle    },
    EXPIRED:         { color: "bg-slate-100 text-slate-600 border-slate-200",      icon: XCircle    },
    CHECKED_IN:      { color: "bg-sky-100 text-sky-700 border-sky-200",            icon: CheckCircle },
    CHECKED_OUT:     { color: "bg-slate-100 text-slate-600 border-slate-200",      icon: CheckCircle },
  };
  const cfg = map[status] || { color: "bg-slate-100 text-slate-600 border-slate-200", icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", cfg.color)}>
      <Icon className="size-3.5" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

/* --- Booking result card ----------------------------------------- */
function BookingCard({ booking, lookup, brandName, onPaid }) {
  const [paying,  setPaying]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const canPay =
    booking.paymentMethod === "ONLINE" &&
    ["PENDING_PAYMENT", "PENDING"].includes(booking.status) &&
    booking.paymentStatus !== "PAID";

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const order = await createPaymentOrder({
        bookingRef: booking.bookingRef,
        email: lookup.email,
        phone: lookup.phone,
      });

      const rpRes = await openRazorpayCheckout({
        keyId:       order.keyId,
        orderId:     order.orderId,
        amount:      order.amount,
        currency:    order.currency || "INR",
        name:        brandName || "Hotel booking",
        description: `Booking ${booking.bookingRef}`,
        prefill: {
          name:    booking.guest?.fullName,
          email:   lookup.email  || booking.guest?.email  || undefined,
          contact: lookup.phone  || booking.guest?.phone  || undefined,
        },
      });

      await verifyPayment({
        bookingRef:          booking.bookingRef,
        razorpayOrderId:     rpRes.razorpay_order_id,
        razorpayPaymentId:   rpRes.razorpay_payment_id,
        razorpaySignature:   rpRes.razorpay_signature,
        email: lookup.email,
        phone: lookup.phone,
      });

      setSuccess(true);
      if (onPaid) onPaid();
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

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/50 px-5 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Booking found</p>
          <p className="mt-0.5 font-display text-xl text-ink">{booking.bookingRef}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Body */}
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Guest</dt>
            <dd className="mt-0.5 font-medium text-ink">{booking.guest?.fullName || ""}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Check-in</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDateLabel(booking.checkInDate)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Check-out</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDateLabel(booking.checkOutDate)}</dd>
          </div>
        </dl>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Payment status</dt>
            <dd className="mt-0.5 font-medium text-ink">{booking.paymentStatus}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Payment method</dt>
            <dd className="mt-0.5 font-medium text-ink">{(booking.paymentMethod || "").replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Total amount</dt>
            <dd className="mt-0.5 font-semibold text-accent text-base">{formatCurrency(booking.totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
        {success ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle className="size-4" /> Payment successful! Check your email for confirmation.
          </span>
        ) : (
          <>
            {canPay ? (
              <Button onClick={handlePay} disabled={paying} size="md">
                <CreditCard className="size-4" />
                {paying ? "Opening Razorpay" : "Pay now via Razorpay"}
              </Button>
            ) : (
              <p className="text-sm text-muted">
                {booking.paymentStatus === "PAID"
                  ? "Payment already received."
                  : "No online payment action needed for this booking."}
              </p>
            )}
            <Button
              href={`/booking/invoice?bookingRef=${encodeURIComponent(booking.bookingRef)}${lookup.email ? `&email=${encodeURIComponent(lookup.email)}` : ""}${lookup.phone ? `&phone=${encodeURIComponent(lookup.phone)}` : ""}`}
              variant="secondary"
              size="md"
            >
              View invoice
            </Button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

/* --- Trust badges ----------------------------------------------- */
function TrustBadges() {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-6">
      {[
        { icon: Lock,   text: "256-bit SSL encrypted" },
        { icon: Shield, text: "Razorpay secured" },
        { icon: Zap,    text: "Instant confirmation" },
      ].map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2 text-xs text-muted">
          <Icon className="size-3.5 text-accent" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

/* --- Main section ----------------------------------------------- */
export default function HomePaymentSection({ brandName }) {
  const [bookingRef, setBookingRef] = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [booking,    setBooking]    = useState(null);
  const [error,      setError]      = useState("");
  const [searchKey,  setSearchKey]  = useState(0);

  async function handleLookup(e) {
    e.preventDefault();
    if (!bookingRef.trim()) { setError("Please enter your booking reference."); return; }
    if (!email.trim() && !phone.trim()) { setError("Enter your email or phone to verify identity."); return; }

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const result = await getBooking(bookingRef.trim(), {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setBooking(result?.booking || result);
      setSearchKey((k) => k + 1);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Booking not found. Please check your reference and contact details."
      );
    } finally {
      setLoading(false);
    }
  }  return (
    <section className="py-16 md:py-24 bg-[linear-gradient(160deg,#f4f2ec_0%,#fffdf9_50%,#f0f3e8_100%)] border-y border-line/60">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column: Content, Context & Security Assurance */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-sand-soft px-3 py-1 text-xs font-semibold tracking-[0.16em] text-accent uppercase w-fit border border-line/60">
              <Shield className="size-3.5 text-accent" />
              <span>Secure Reservation Desk</span>
            </div>

            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl text-ink font-bold tracking-tight leading-tight">
              Complete your booking payment
            </h2>

            <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed max-w-lg">
              Already have a reservation? Enter your booking reference to check live status, view booking details, and complete your payment securely via Razorpay.
            </p>

            {/* Feature highlights list */}
            <div className="mt-8 space-y-4 max-w-md">
              <div className="flex items-start gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Zap className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Instant Confirmation</h4>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">
                    Live verification and immediate digital receipt sent directly to your email and phone.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Lock className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">256-Bit Bank Grade Encryption</h4>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">
                    All transactions are tokenized and processed via certified PCI-DSS compliant gateways.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <CreditCard className="size-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink">Flexible Payment Options</h4>
                  <p className="mt-0.5 text-xs text-muted leading-relaxed">
                    Supports UPI, Credit/Debit cards, NetBanking, and international card payments.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional trust points badge strip */}
            <div className="mt-8 pt-6 border-t border-line/60">
              <TrustBadges />
            </div>
          </div>

          {/* Right Column: Interactive Lookup & Payment Form Card */}
          <div className="lg:col-span-6 w-full max-w-lg lg:max-w-none mx-auto">
            <div className="rounded-[1.75rem] border border-line/80 bg-elevated p-6 sm:p-8 shadow-soft backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3.5 border-b border-line/60 pb-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
                  <CreditCard className="size-5.5 text-accent" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-ink">Pay for your booking</p>
                  <p className="text-xs text-muted">Look up any pending reservation instantly</p>
                </div>
              </div>

              <form onSubmit={handleLookup} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="pay-booking-ref" className="block text-xs font-semibold tracking-[0.12em] text-muted uppercase mb-1.5">
                    Booking reference *
                  </label>
                  <input
                    id="pay-booking-ref"
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    placeholder="e.g. BK-2024-0001"
                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm font-mono text-ink placeholder:text-muted/60 outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label htmlFor="pay-email" className="block text-xs font-semibold tracking-[0.12em] text-muted uppercase mb-1.5">
                    Email address
                  </label>
                  <input
                    id="pay-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label htmlFor="pay-phone" className="block text-xs font-semibold tracking-[0.12em] text-muted uppercase mb-1.5">
                    Phone number <span className="text-muted/60 normal-case font-normal">(if email not used)</span>
                  </label>
                  <input
                    id="pay-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
                    autoComplete="tel"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 rounded-xl font-semibold shadow-soft" size="lg" disabled={loading}>
                  <Search className="size-4" />
                  {loading ? "Looking up booking…" : "Find my booking"}
                </Button>
              </form>

              <div className="mt-5 rounded-xl bg-sand-soft/40 p-3 text-center border border-line/60">
                <p className="text-xs text-muted">
                  Don't have a booking yet?{" "}
                  <a href="/booking" className="font-semibold text-accent hover:underline">
                    Reserve a room
                  </a>
                </p>
              </div>
            </div>

            {booking && (
              <div className="mt-6">
                <BookingCard
                  key={searchKey}
                  booking={booking}
                  lookup={{ email: email.trim(), phone: phone.trim() }}
                  brandName={brandName}
                />
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
