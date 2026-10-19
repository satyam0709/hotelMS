"use client";

import { useCallback, useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import FormFeedback from "@/components/ui/FormFeedback";
import Input from "@/components/ui/Input";
import TurnstileWidget, { isTurnstileEnabled } from "@/components/site/TurnstileWidget";
import { createRestaurantReservation } from "@/lib/api/content";

const INITIAL_FORM = {
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  guestCount: 2,
  mealType: "DINNER",
  reservationDate: "",
  reservationTime: "",
  dietaryRequests: "",
};

function localDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function RestaurantReservationForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [captchaToken, setCaptchaToken] = useState("");
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const turnstileOn = isTurnstileEnabled();
  const onToken = useCallback((token) => setCaptchaToken(token || ""), []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onSubmit(event) {
    event.preventDefault();
    setStatus("idle");
    setFeedback("");

    if (!form.guestEmail.trim() && !form.guestPhone.trim()) {
      setStatus("error");
      setFeedback("Please provide an email address or phone number.");
      return;
    }
    if (turnstileOn && !captchaToken) {
      setStatus("error");
      setFeedback("Please complete the CAPTCHA verification.");
      return;
    }

    startTransition(async () => {
      try {
        await createRestaurantReservation({
          ...form,
          guestName: form.guestName.trim(),
          guestEmail: form.guestEmail.trim() || undefined,
          guestPhone: form.guestPhone.trim() || undefined,
          guestCount: Number(form.guestCount),
          dietaryRequests: form.dietaryRequests.trim() || undefined,
          ...(captchaToken ? { captchaToken } : {}),
        });
        setForm(INITIAL_FORM);
        setCaptchaToken("");
        setStatus("success");
        setFeedback("Request received. Our team will contact you soon.");
      } catch (error) {
        setStatus("error");
        setFeedback(error.message || "Unable to submit your reservation request.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="guestName" value={form.guestName} onChange={updateField} required maxLength={160} />
        <Input label="Email" type="email" name="guestEmail" value={form.guestEmail} onChange={updateField} maxLength={191} />
        <Input label="Phone" type="tel" name="guestPhone" value={form.guestPhone} onChange={updateField} maxLength={40} />
        <div>
          <span className="block text-xs font-medium tracking-[0.08em] text-muted uppercase">Guests</span>
          <div className="mt-1 flex h-12 items-center justify-between rounded-xl border border-line bg-elevated px-3">
            <button
              type="button"
              aria-label="Remove one guest"
              disabled={form.guestCount <= 1}
              onClick={() => setForm((current) => ({ ...current, guestCount: Math.max(1, Number(current.guestCount) - 1) }))}
              className="size-8 rounded-lg border border-line text-lg text-ink disabled:opacity-40"
            >
              -
            </button>
            <span aria-live="polite" className="text-sm font-semibold text-ink">{form.guestCount}</span>
            <button
              type="button"
              aria-label="Add one guest"
              disabled={form.guestCount >= 30}
              onClick={() => setForm((current) => ({ ...current, guestCount: Math.min(30, Number(current.guestCount) + 1) }))}
              className="size-8 rounded-lg border border-line text-lg text-ink disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <label className="flex w-full flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Meal</span>
          <select name="mealType" value={form.mealType} onChange={updateField} className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-ink">
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
          </select>
        </label>
        <Input label="Date" type="date" name="reservationDate" value={form.reservationDate} onChange={updateField} min={localDateString()} required />
        <Input label="Time" type="time" name="reservationTime" value={form.reservationTime} onChange={updateField} required />
        <label className="flex w-full flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Dietary notes or special requests</span>
          <textarea
            name="dietaryRequests"
            value={form.dietaryRequests}
            onChange={updateField}
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
            placeholder="Allergies, accessibility needs, or a special occasion"
          />
        </label>
      </div>

      {turnstileOn ? <TurnstileWidget onToken={onToken} className="mt-2" /> : null}
      <FormFeedback status={status} message={feedback} />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending request…" : "Request a table"}
      </Button>
      <p className="text-xs text-muted">Your table is not reserved until our team contacts you.</p>
    </form>
  );
}
