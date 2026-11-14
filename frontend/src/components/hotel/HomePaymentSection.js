"use client";

import Link from "next/link";
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
  const [paidBooking, setPaidBooking] = useState(null);
  const currentBooking = paidBooking || booking;
  const payments = Array.isArray(currentBooking.payments) ? currentBooking.payments : [];

  const canPay =
    currentBooking.paymentMethod === "ONLINE" &&
    ["PENDING_PAYMENT", "PENDING"].includes(currentBooking.status) &&
    currentBooking.paymentStatus !== "PAID";

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const order = await createPaymentOrder({
        bookingRef: currentBooking.bookingRef,
        email: lookup.email,
        phone: lookup.phone,
      });

      const rpRes = await openRazorpayCheckout({
        keyId:       order.keyId,
        orderId:     order.orderId,
        amount:      order.amount,
        currency:    order.currency || "INR",
        name:        brandName || "Hotel booking",
        description: `Booking ${currentBooking.bookingRef}`,
        prefill: {
          name:    currentBooking.guest?.fullName,
          email:   lookup.email  || currentBooking.guest?.email  || undefined,
          contact: lookup.phone  || currentBooking.guest?.phone  || undefined,
        },
      });

      const verification = await verifyPayment({
        bookingRef:          currentBooking.bookingRef,
        razorpayOrderId:     rpRes.razorpay_order_id,
        razorpayPaymentId:   rpRes.razorpay_payment_id,
        razorpaySignature:   rpRes.razorpay_signature,
        email: lookup.email,
        phone: lookup.phone,
      });

      if (verification?.booking) {
        setPaidBooking(verification.booking);
        onPaid?.(verification.booking);
      }
      setSuccess(true);
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
          <p className="mt-0.5 font-display text-xl text-ink">{currentBooking.bookingRef}</p>
        </div>
        <StatusBadge status={currentBooking.status} />
      </div>

      {/* Body */}
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Guest</dt>
            <dd className="mt-0.5 font-medium text-ink">{currentBooking.guest?.fullName || ""}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Check-in</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDateLabel(currentBooking.checkInDate)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Check-out</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDateLabel(currentBooking.checkOutDate)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Guests</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {currentBooking.adults} adult(s){currentBooking.children ? ` · ${currentBooking.children} child(ren)` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Rooms</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {currentBooking.rooms?.length
                ? currentBooking.rooms.map((item, index) => (
                  <span key={`${item.room?.slug || item.room?.name || "room"}-${index}`}>
                    {index ? ", " : ""}{item.room?.name || "Room"} × {item.quantity}
                  </span>
                ))
                : `${currentBooking.roomCount || 0} room(s)`}
            </dd>
          </div>
        </dl>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Payment status</dt>
            <dd className="mt-0.5 font-medium text-ink">{currentBooking.paymentStatus}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Payment method</dt>
            <dd className="mt-0.5 font-medium text-ink">{(currentBooking.paymentMethod || "").replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-[0.12em] text-muted uppercase">Total amount</dt>
            <dd className="mt-0.5 font-semibold text-accent text-base">
              {formatCurrency(currentBooking.totalAmount, currentBooking.currency)}
            </dd>
          </div>
        </dl>
        {payments.length > 0 && (
          <div className="sm:col-span-2 rounded-xl border border-line bg-canvas/50 p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">Payment details</p>
            <ul className="mt-2 space-y-2">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-ink">
                    {payment.status.replaceAll("_", " ")}
                    {payment.provider || payment.method
                      ? ` · ${(payment.provider || payment.method).replaceAll("_", " ")}`
                      : ""}
                    {payment.paidAt ? ` · ${formatDateLabel(payment.paidAt)}` : ""}
                  </span>
                  <span className="font-medium text-ink">
                    {formatCurrency(payment.amount, payment.currency || currentBooking.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
        {success && (
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle className="size-4" /> Payment verified. Your booking details are up to date.
          </span>
        )}
        {canPay ? (
          <Button onClick={handlePay} disabled={paying} size="md">
            <CreditCard className="size-4" />
            {paying ? "Opening Razorpay…" : "Pay now via Razorpay"}
          </Button>
        ) : (
          <p className="text-sm text-muted">
            {currentBooking.paymentStatus === "PAID"
              ? "Payment already received."
              : "No online payment action needed for this booking."}
          </p>
        )}
        <Button
          href={`/booking/invoice?bookingRef=${encodeURIComponent(currentBooking.bookingRef)}&email=${encodeURIComponent(lookup.email)}&phone=${encodeURIComponent(lookup.phone)}`}
          variant="secondary"
          size="md"
        >
          View invoice
        </Button>
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
        { icon: Lock,   text: "Server-verified payment" },
        { icon: Shield, text: "Razorpay checkout" },
        { icon: Zap,    text: "Booking status synced" },
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
  const [refError,   setRefError]   = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [booking,    setBooking]    = useState(null);
  const [error,      setError]      = useState("");
  const [searchKey,  setSearchKey]  = useState(0);

  async function handleLookup(e) {
    if (e) e.preventDefault();
    const r = bookingRef.trim();
    const emailValue = email.trim();
    const phoneValue = phone.trim();

    const isRefValid = Boolean(r);
    const isEmailValid = emailValue.length <= 191 && /^\S+@\S+\.\S+$/.test(emailValue);
    const isPhoneValid = phoneValue.length >= 5 && phoneValue.length <= 40;

    setRefError(!isRefValid);
    setEmailError(!isEmailValid);
    setPhoneError(!isPhoneValid);
    setError("");

    if (!isRefValid || !isEmailValid || !isPhoneValid) {
      return;
    }

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const result = await getBooking(r, {
        email: emailValue,
        phone: phoneValue,
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
  }

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 border-y border-line/60">
      <div className="mx-auto w-full max-w-5xl lg:max-w-6xl">
        {/* Split card shell */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[5fr_6fr] bg-white border border-[var(--exo-line)] rounded-[28px] overflow-hidden shadow-[0_30px_60px_-30px_rgba(28,61,10,0.35)] font-[var(--font-figtree),system-ui,sans-serif]">
          {/* Left Panel (5fr, dark green) */}
          <aside className="bg-[#1c3d0a] text-[#eef5df] p-7 sm:p-10 lg:p-[44px_38px] flex flex-col justify-between gap-7">
            <div className="space-y-6">
              <div className="font-[var(--font-bricolage),sans-serif] font-bold text-xl tracking-[0.02em] text-[#d6ec9b]">
                {brandName || "EXOSTAY"}
              </div>
              <h1 className="font-[var(--font-bricolage),sans-serif] font-bold text-2xl sm:text-3xl lg:text-[34px] leading-[1.1] text-white">
                Complete your booking payment
              </h1>
              <p className="text-[#c3d3a8] text-sm sm:text-base max-w-[34ch] leading-relaxed">
                Enter your booking reference to see its status and pay securely through Razorpay.
              </p>
            </div>

            <ul className="list-none m-0 p-0 grid gap-4 text-sm text-[#c3d3a8]">
              <li className="grid grid-cols-[36px_1fr] gap-3 items-start">
                <i className="w-9 h-9 rounded-full bg-[#2f5a14] text-[var(--exo-lime)] flex items-center justify-center not-italic font-bold text-sm shrink-0">
                  ✓
                </i>
                <div>
                  <b className="block text-white font-semibold text-[15px] mb-0.5">Server-verified payment</b>
                  <span>Your booking updates after payment verification.</span>
                </div>
              </li>
              <li className="grid grid-cols-[36px_1fr] gap-3 items-start">
                <i className="w-9 h-9 rounded-full bg-[#2f5a14] text-[var(--exo-lime)] flex items-center justify-center not-italic font-bold text-sm shrink-0">
                  ✓
                </i>
                <div>
                  <b className="block text-white font-semibold text-[15px] mb-0.5">Razorpay checkout</b>
                  <span>Payment details are handled by the payment provider.</span>
                </div>
              </li>
              <li className="grid grid-cols-[36px_1fr] gap-3 items-start">
                <i className="w-9 h-9 rounded-full bg-[#2f5a14] text-[var(--exo-lime)] flex items-center justify-center not-italic font-bold text-sm shrink-0">
                  ✓
                </i>
                <div>
                  <b className="block text-white font-semibold text-[15px] mb-0.5">Payment status stays in sync</b>
                  <span>UPI, cards, NetBanking, international cards.</span>
                </div>
              </li>
            </ul>
          </aside>

          {/* Right Form (6fr, white / dark card) */}
          <div className="p-6 sm:p-9 lg:p-[44px_44px_36px] bg-[var(--exo-card)] text-[var(--exo-ink)] flex flex-col justify-between">
            <div>
              <h2 className="font-[var(--font-bricolage),sans-serif] font-bold text-2xl text-[var(--exo-ink)] mb-1">
                Find your booking
              </h2>
              <p className="text-[var(--exo-mute)] text-[15px] mb-6">
                Securely view your booking and payment status.
              </p>

              {/* Form elements with floating labels */}
              <form onSubmit={handleLookup} noValidate>
                {/* Field 1: Booking reference */}
                <div className="relative mb-2">
                  <div className="relative">
                    <input
                      id="exo-ref"
                      type="text"
                      placeholder=" "
                      autoComplete="off"
                      inputMode="text"
                      spellCheck={false}
                      value={bookingRef}
                      onChange={(e) => {
                        setBookingRef(e.target.value);
                        if (refError && e.target.value.trim()) setRefError(false);
                      }}
                      className={cn(
                        "peer w-full h-[58px] pt-6 pb-1.5 px-4 rounded-[14px] bg-[var(--exo-field)] text-[var(--exo-ink)] text-base font-medium outline-none transition-[border-color,box-shadow] duration-150 border-[1.5px]",
                        refError
                          ? "border-[var(--exo-err)] focus:border-[var(--exo-err)] focus:shadow-[0_0_0_4px_rgba(179,38,30,0.18)]"
                          : "border-[var(--exo-line)] focus:border-[var(--exo-green)] focus:shadow-[0_0_0_4px_rgba(111,164,40,0.2)]"
                      )}
                    />
                    <label
                      htmlFor="exo-ref"
                      className="absolute left-[17px] top-[19px] text-[var(--exo-mute)] text-[15px] pointer-events-none transition-all duration-150 peer-focus:top-[8px] peer-focus:text-[12px] peer-focus:font-semibold peer-not-placeholder-shown:top-[8px] peer-not-placeholder-shown:text-[12px] peer-not-placeholder-shown:font-semibold"
                    >
                      Booking reference
                    </label>
                  </div>
                  {refError && (
                    <div className="text-[var(--exo-err)] text-[13px] mt-1.5 ml-1">
                      Enter the reference from your confirmation message.
                    </div>
                  )}
                </div>

                <div className="relative mb-2 mt-4">
                  <div className="relative">
                    <input
                      id="exo-email"
                      type="email"
                      placeholder=" "
                      autoComplete="email"
                      aria-invalid={emailError}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        if (emailError && /^\S+@\S+\.\S+$/.test(e.target.value.trim())) setEmailError(false);
                      }}
                      className={cn(
                        "peer w-full h-[58px] pt-6 pb-1.5 px-4 rounded-[14px] bg-[var(--exo-field)] text-[var(--exo-ink)] text-base font-medium outline-none transition-[border-color,box-shadow] duration-150 border-[1.5px]",
                        emailError
                          ? "border-[var(--exo-err)] focus:border-[var(--exo-err)] focus:shadow-[0_0_0_4px_rgba(179,38,30,0.18)]"
                          : "border-[var(--exo-line)] focus:border-[var(--exo-green)] focus:shadow-[0_0_0_4px_rgba(111,164,40,0.2)]"
                      )}
                    />
                    <label
                      htmlFor="exo-email"
                      className="absolute left-[17px] top-[19px] text-[var(--exo-mute)] text-[15px] pointer-events-none transition-all duration-150 peer-focus:top-[8px] peer-focus:text-[12px] peer-focus:font-semibold peer-not-placeholder-shown:top-[8px] peer-not-placeholder-shown:text-[12px] peer-not-placeholder-shown:font-semibold"
                    >
                      Email address
                    </label>
                  </div>
                  {emailError ? (
                    <div className="text-[var(--exo-err)] text-[13px] mt-1.5 ml-1">
                      Enter the email used for this booking.
                    </div>
                  ) : null}
                </div>

                <div className="relative mb-4 mt-4">
                  <div className="relative">
                    <input
                      id="exo-phone"
                      type="tel"
                      placeholder=" "
                      autoComplete="tel"
                      aria-invalid={phoneError}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError("");
                        if (phoneError && e.target.value.trim().length >= 5) setPhoneError(false);
                      }}
                      className={cn(
                        "peer w-full h-[58px] pt-6 pb-1.5 px-4 rounded-[14px] bg-[var(--exo-field)] text-[var(--exo-ink)] text-base font-medium outline-none transition-[border-color,box-shadow] duration-150 border-[1.5px]",
                        phoneError
                          ? "border-[var(--exo-err)] focus:border-[var(--exo-err)] focus:shadow-[0_0_0_4px_rgba(179,38,30,0.18)]"
                          : "border-[var(--exo-line)] focus:border-[var(--exo-green)] focus:shadow-[0_0_0_4px_rgba(111,164,40,0.2)]"
                      )}
                    />
                    <label
                      htmlFor="exo-phone"
                      className="absolute left-[17px] top-[19px] text-[var(--exo-mute)] text-[15px] pointer-events-none transition-all duration-150 peer-focus:top-[8px] peer-focus:text-[12px] peer-focus:font-semibold peer-not-placeholder-shown:top-[8px] peer-not-placeholder-shown:text-[12px] peer-not-placeholder-shown:font-semibold"
                    >
                      Phone number
                    </label>
                  </div>
                  {phoneError ? (
                    <div className="text-[var(--exo-err)] text-[13px] mt-1.5 ml-1">
                      Enter the phone number used for this booking.
                    </div>
                  ) : (
                    <p className="text-[13px] text-[var(--exo-mute)] mt-1.5 ml-1">
                      We verify both contact details before showing your booking.
                    </p>
                  )}
                </div>

                {/* Primary Button */}
                <button
                  id="go"
                  type="submit"
                  disabled={loading}
                  className="w-full h-[56px] border-0 rounded-[14px] bg-[var(--exo-green)] text-white font-semibold text-[17px] cursor-pointer transition-all duration-150 hover:brightness-105 active:scale-[0.99] focus-visible:outline-[3px] focus-visible:outline-[var(--exo-lime)] focus-visible:outline-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="size-4" />
                  {loading ? "Looking up booking…" : "Find my booking"}
                </button>
              </form>

              {/* Error box */}
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700" role="alert">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Secondary line */}
            <p className="mt-6 mb-0 text-center text-sm text-[var(--exo-mute)]">
              No booking yet?{" "}
              <Link href="/rooms" className="text-[var(--exo-green)] font-semibold hover:underline">
                Reserve a room
              </Link>
            </p>
          </div>
        </div>

        {/* Real result: Booking details card + Razorpay payment */}
        {booking && (
          <div className="mt-8">
            <BookingCard
              key={searchKey}
              booking={booking}
              lookup={{
                email: email.trim(),
                phone: phone.trim(),
              }}
              brandName={brandName}
              onPaid={setBooking}
            />
          </div>
        )}

        {/* Trust badges footer */}
        <div className="mt-6">
          <TrustBadges />
        </div>
      </div>
    </section>
  );
}
