"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import {
  createBooking,
  createPaymentOrder,
  verifyPayment,
} from "@/lib/api/booking";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { buildQueryString, formatCurrency, formatDateLabel } from "@/lib/utils";

export default function GuestCheckoutForm({
  search,
  selectedRoom,
  onBack,
  brandName,
  onlinePaymentEnabled = true,
  payAtHotelEnabled = true,
}) {
  const router = useRouter();
  const paymentOptions = useMemo(() => {
    const options = [];
    if (onlinePaymentEnabled) {
      options.push({
        value: "ONLINE",
        title: "Pay online",
        description: "Secure Razorpay checkout. Inventory held for 30 minutes.",
      });
    }
    if (payAtHotelEnabled) {
      options.push({
        value: "PAY_AT_HOTEL",
        title: "Pay at hotel",
        description: "Reserve now and settle at check-in.",
      });
    }
    return options;
  }, [onlinePaymentEnabled, payAtHotelEnabled]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [extraBeds, setExtraBeds] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(
    () => paymentOptions[0]?.value || "PAY_AT_HOTEL",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const extraBedsAllowed = Boolean(selectedRoom?.extraBedAllowed);
  const extraBedCharge = Number(selectedRoom?.extraBedCharge || 0);
  const maxExtraBeds = 5;

  const staySummary = useMemo(() => {
    if (!selectedRoom || !search) return null;
    const nights = Number(selectedRoom.nights) || 0;
    const quantity = selectedRoom.quantity || search.rooms || 1;
    const beds = extraBedsAllowed ? Math.max(0, Number(extraBeds) || 0) : 0;
    const extraBedEstimate = beds > 0 && extraBedCharge > 0
      ? Number((extraBedCharge * beds * nights * quantity).toFixed(2))
      : 0;
    return {
      roomName: selectedRoom.name,
      checkIn: formatDateLabel(search.checkIn),
      checkOut: formatDateLabel(search.checkOut),
      nights,
      subtotal: selectedRoom.subtotal,
      quantity,
      extraBeds: beds,
      extraBedEstimate,
      extraBedCharge,
    };
  }, [selectedRoom, search, extraBeds, extraBedsAllowed, extraBedCharge]);

  async function handleOnlinePayment(booking) {
    const order = await createPaymentOrder({
      bookingRef: booking.bookingRef,
      email: email || undefined,
      phone: phone || undefined,
    });

    const razorpayResponse = await openRazorpayCheckout({
      keyId: order.keyId,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency || "INR",
      name: brandName || "Hotel booking",
      description: `${selectedRoom.name} · ${booking.bookingRef}`,
      prefill: {
        name: fullName,
        email: email || undefined,
        contact: phone || undefined,
      },
    });

    await verifyPayment({
      bookingRef: booking.bookingRef,
      razorpayOrderId: razorpayResponse.razorpay_order_id,
      razorpayPaymentId: razorpayResponse.razorpay_payment_id,
      razorpaySignature: razorpayResponse.razorpay_signature,
      email: email.trim(),
      phone: phone.trim(),
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !phone.trim()) {
      setError("Please provide both an email and a phone number.");
      return;
    }
    if (!selectedRoom?.id) {
      setError("Please select a room first.");
      return;
    }
    if (!paymentOptions.length) {
      setError("Booking payments are temporarily unavailable. Please contact the hotel.");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guest: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
        rooms: [
          {
            roomId: selectedRoom.id,
            quantity: Number(search.rooms) || 1,
            adults: Number(search.adults) || 1,
            children: Number(search.children) || 0,
            extraBeds: extraBedsAllowed ? Math.max(0, Number(extraBeds) || 0) : 0,
          },
        ],
        specialRequests: specialRequests.trim() || null,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
      });

      if (paymentMethod === "ONLINE") {
        try {
          await handleOnlinePayment(booking);
        } catch (paymentError) {
          if (paymentError?.message === "Payment cancelled.") {
            setError(
              `Booking ${booking.bookingRef} is held briefly. Complete payment from confirmation, or choose pay at hotel.`
            );
            const query = buildQueryString({
              bookingRef: booking.bookingRef,
              email: email || undefined,
              phone: phone || undefined,
              pending: "1",
            });
            router.push(`/booking/confirmation${query}`);
            return;
          }
          throw paymentError;
        }
      }

      const query = buildQueryString({
        bookingRef: booking.bookingRef,
        email: email || undefined,
        phone: phone || undefined,
      });
      router.push(`/booking/confirmation${query}`);
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err?.message || "Unable to complete booking.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]"
    >
      <div className="rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft md:p-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Guest details
        </p>
        <h2 className="mt-2 font-display text-2xl text-ink md:text-3xl">
          Who is staying?
        </h2>
        <p className="mt-2 text-sm text-muted">
          We use these details for confirmation and booking lookup.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Input
            label="Full name"
            name="fullName"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="sm:col-span-2"
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91…"
          />
          <Input
            label="Coupon code"
            name="couponCode"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Optional"
            className="sm:col-span-2"
          />
          {extraBedsAllowed ? (
            <div className="sm:col-span-2">
              <label htmlFor="extraBeds" className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
                Extra beds
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <Input
                  id="extraBeds"
                  name="extraBeds"
                  type="number"
                  min={0}
                  max={maxExtraBeds}
                  value={extraBeds}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) {
                      setExtraBeds(0);
                      return;
                    }
                    setExtraBeds(Math.min(maxExtraBeds, Math.max(0, Math.floor(next))));
                  }}
                  className="max-w-[8rem]"
                />
                <p className="text-xs text-muted">
                  {extraBedCharge > 0
                    ? `${formatCurrency(extraBedCharge)} per bed / night`
                    : "Extra beds available for this room"}
                </p>
              </div>
            </div>
          ) : null}
          <label className="flex w-full flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
              Special requests
            </span>
            <textarea
              name="specialRequests"
              rows={4}
              value={specialRequests}
              onChange={(event) => setSpecialRequests(event.target.value)}
              className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              placeholder="Arrival time, accessibility needs, celebrations…"
            />
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
            Payment method
          </legend>
          {paymentOptions.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    paymentMethod === option.value
                      ? "border-accent bg-accent-soft/50"
                      : "border-line hover:border-accent/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold text-ink">{option.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {option.description}
                  </p>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Online booking payments are temporarily unavailable. Please contact the hotel.
            </p>
          )}
        </fieldset>

        {error ? (
          <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={onBack} disabled={submitting}>
            Back to rooms
          </Button>
          <Button type="submit" disabled={submitting || !paymentOptions.length}>
            {submitting
              ? "Processing…"
              : paymentMethod === "ONLINE"
                ? "Reserve & pay"
                : "Confirm reservation"}
          </Button>
        </div>
      </div>

      <aside className="h-fit rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Stay summary
        </p>
        {staySummary ? (
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-display text-2xl text-ink">{staySummary.roomName}</p>
              <p className="mt-1 text-muted">
                {staySummary.checkIn} → {staySummary.checkOut}
              </p>
            </div>
            <div className="space-y-2 border-t border-line pt-3 text-muted">
              <p className="flex justify-between gap-3">
                <span>Nights</span>
                <span className="text-ink">{staySummary.nights}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span>Rooms</span>
                <span className="text-ink">{staySummary.quantity}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span>Guests</span>
                <span className="text-ink">
                  {search.adults} adults
                  {search.children ? ` · ${search.children} children` : ""}
                </span>
              </p>
              {staySummary.extraBeds > 0 ? (
                <p className="flex justify-between gap-3">
                  <span>Extra beds ({staySummary.extraBeds})</span>
                  <span className="text-ink">{formatCurrency(staySummary.extraBedEstimate)}</span>
                </p>
              ) : null}
              <p className="flex justify-between gap-3 border-t border-line pt-3 text-base font-semibold text-ink">
                <span>Room subtotal</span>
                <span>
                  {formatCurrency(
                    Number(staySummary.subtotal || 0) + Number(staySummary.extraBedEstimate || 0),
                  )}
                </span>
              </p>
              <p className="text-xs text-muted">
                Taxes and discounts are calculated when the booking is created.
              </p>
            </div>
          </div>
        ) : null}
      </aside>
    </motion.form>
  );
}
