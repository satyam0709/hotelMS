"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { buildQueryString } from "@/lib/utils";

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function dayAfterTomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export default function RoomAvailabilitySearch({ roomSlug, roomName }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(tomorrowIso());
  const [checkOut, setCheckOut] = useState(dayAfterTomorrowIso());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
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
      room: roomSlug,
    });
    router.push(`/booking${query}`);
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 140, damping: 20 }}
      className="rounded-[1.75rem] border border-line bg-elevated p-5 shadow-soft md:p-6"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
        Check availability
      </p>
      <h3 className="mt-2 font-display text-2xl text-ink">
        Reserve {roomName || "this room"}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Choose your dates and continue to live inventory and rates.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
          className="sm:col-span-2"
        />
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <Button type="submit" className="mt-5 w-full">
        Check & continue
      </Button>
    </motion.form>
  );
}
