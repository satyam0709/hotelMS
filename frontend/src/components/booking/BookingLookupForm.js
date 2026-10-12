"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import FormFeedback from "@/components/ui/FormFeedback";
import Input from "@/components/ui/Input";

export default function BookingLookupForm({ className }) {
  const router = useRouter();
  const [bookingRef, setBookingRef] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    setError("");

    const ref = bookingRef.trim();
    const emailValue = email.trim();
    const phoneValue = phone.trim();

    if (!ref) {
      setError("Enter your booking reference.");
      return;
    }
    if (!emailValue || !phoneValue) {
      setError("Enter both the email and phone used when booking.");
      return;
    }

    const params = new URLSearchParams({
      bookingRef: ref,
      email: emailValue,
      phone: phoneValue,
    });

    router.push(`/booking/confirmation?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={className}
      noValidate
    >
      <div className="space-y-4 rounded-3xl border border-line bg-elevated p-6 shadow-soft md:p-8">
        <div>
          <label htmlFor="lookup-ref" className="text-sm font-medium text-ink">
            Booking reference
          </label>
          <Input
            id="lookup-ref"
            name="bookingRef"
            autoComplete="off"
            placeholder="e.g. HTL-XXXXXX"
            value={bookingRef}
            onChange={(event) => setBookingRef(event.target.value)}
            className="mt-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="lookup-email" className="text-sm font-medium text-ink">
              Email
            </label>
            <Input
              id="lookup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email used at booking"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="lookup-phone" className="text-sm font-medium text-ink">
              Phone
            </label>
            <Input
              id="lookup-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 …"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2"
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Use the same email and phone you provided at checkout. We need the reference plus both contact details to load your booking.
        </p>
        <FormFeedback status="error" message={error} />
        <Button type="submit" className="w-full sm:w-auto">
          Find booking
        </Button>
      </div>
    </form>
  );
}
