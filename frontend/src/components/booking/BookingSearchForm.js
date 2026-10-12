"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import FormFeedback from "@/components/ui/FormFeedback";
import Input from "@/components/ui/Input";
import { buildQueryString } from "@/lib/utils";

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function defaultCheckOut(checkIn) {
  const date = new Date(`${checkIn || tomorrowIso()}T00:00:00`);
  date.setDate(date.getDate() + 2);
  return date.toISOString().slice(0, 10);
}

export default function BookingSearchForm({
  initialValues = {},
  roomSlug,
  compact = false,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || tomorrowIso());
  const [checkOut, setCheckOut] = useState(
    initialValues.checkOut || defaultCheckOut(initialValues.checkIn)
  );
  const [adults, setAdults] = useState(initialValues.adults || 2);
  const [children, setChildren] = useState(initialValues.children || 0);
  const [rooms, setRooms] = useState(initialValues.rooms || 1);
  const [error, setError] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError("");
    const query = buildQueryString({
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      room: roomSlug || initialValues.room || undefined,
    });
    startTransition(() => {
      router.push(`/booking${query}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? "rounded-[1.5rem] border border-line bg-elevated p-4 shadow-soft"
          : "rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft md:p-6"
      }
    >
      {!compact ? (
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Step 1
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink md:text-3xl">
            Search availability
          </h2>
          <p className="mt-2 text-sm text-muted">
            Choose dates and guests to see live room inventory and rates.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_auto]">
        <Input
          label="Check-in"
          type="date"
          name="checkIn"
          required
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
        />
        <Input
          label="Check-out"
          type="date"
          name="checkOut"
          required
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
        />
        <Input
          label="Adults"
          type="number"
          name="adults"
          min={1}
          max={30}
          required
          value={adults}
          onChange={(event) => setAdults(Number(event.target.value))}
        />
        <Input
          label="Children"
          type="number"
          name="children"
          min={0}
          max={30}
          value={children}
          onChange={(event) => setChildren(Number(event.target.value))}
        />
        <Input
          label="Rooms"
          type="number"
          name="rooms"
          min={1}
          max={10}
          value={rooms}
          onChange={(event) => setRooms(Number(event.target.value))}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full xl:min-w-36" disabled={isPending}>
            {isPending ? "Searching…" : "Search"}
          </Button>
        </div>
      </div>
      <FormFeedback status="error" message={error} className="mt-3" />
    </form>
  );
}
