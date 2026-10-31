"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Container from "@/components/ui/Container";
import { cn } from "@/lib/utils";

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

export default function BookingSearch({ variant = "default" }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(tomorrowIso());
  const [checkOut, setCheckOut] = useState(dayAfterTomorrowIso());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [error, setError] = useState("");
  const isHero = variant === "hero";

  function onSubmit(event) {
    event.preventDefault();
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError("");
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
    router.push(`/booking?${params.toString()}`);
  }

  const form = (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 110, damping: 18, delay: 0.45 }}
      className={cn(
        isHero
          ? "bg-transparent p-0 border-0 shadow-none text-ink"
          : "border border-line bg-elevated p-4 shadow-soft md:p-5 rounded-[1.75rem]"
      )}
    >
      <div
        className={cn(
          "grid gap-3",
          isHero
            ? "md:grid-cols-[1.15fr_1.15fr_0.7fr_0.7fr_0.7fr_auto] md:items-end md:gap-2"
            : "md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr_auto]"
        )}
      >
        <Input
          label="Check-in"
          type="date"
          name="checkIn"
          required
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
          inputClassName={
            isHero
              ? "border-[#dcd9ce] bg-[#faf9f5] hover:bg-white text-ink text-[#1a2e0a] md:h-11 md:rounded-full [color-scheme:light] font-medium transition-colors focus:bg-white focus:border-[#2c6700]"
              : undefined
          }
        />
        <Input
          label="Check-out"
          type="date"
          name="checkOut"
          required
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          inputClassName={
            isHero
              ? "border-[#dcd9ce] bg-[#faf9f5] hover:bg-white text-ink text-[#1a2e0a] md:h-11 md:rounded-full [color-scheme:light] font-medium transition-colors focus:bg-white focus:border-[#2c6700]"
              : undefined
          }
        />
        <Input
          label="Adults"
          type="number"
          name="adults"
          min={1}
          max={30}
          required
          value={adults}
          onChange={(event) => {
            const val = event.target.value;
            setAdults(val === "" ? "" : Number(val));
          }}
          inputClassName={
            isHero
              ? "border-[#dcd9ce] bg-[#faf9f5] hover:bg-white text-ink text-[#1a2e0a] md:h-11 md:rounded-full [color-scheme:light] font-medium transition-colors focus:bg-white focus:border-[#2c6700]"
              : undefined
          }
        />
        <Input
          label="Children"
          type="number"
          name="children"
          min={0}
          max={30}
          value={children}
          onChange={(event) => {
            const val = event.target.value;
            setChildren(val === "" ? "" : Number(val));
          }}
          inputClassName={
            isHero
              ? "border-[#dcd9ce] bg-[#faf9f5] hover:bg-white text-ink text-[#1a2e0a] md:h-11 md:rounded-full [color-scheme:light] font-medium transition-colors focus:bg-white focus:border-[#2c6700]"
              : undefined
          }
        />
        <Input
          label="Rooms"
          type="number"
          name="rooms"
          min={1}
          max={10}
          value={rooms}
          onChange={(event) => {
            const val = event.target.value;
            setRooms(val === "" ? "" : Number(val));
          }}
          inputClassName={
            isHero
              ? "border-[#dcd9ce] bg-[#faf9f5] hover:bg-white text-ink text-[#1a2e0a] md:h-11 md:rounded-full [color-scheme:light] font-medium transition-colors focus:bg-white focus:border-[#2c6700]"
              : undefined
          }
        />
        <div className="flex items-end">
          <Button
            type="submit"
            className={cn(
              "w-full",
              isHero
                ? "md:min-w-44 md:rounded-full !bg-gradient-to-r !from-[#2c6700] !to-[#3f8f00] hover:!from-[#367d00] hover:!to-[#49a600] !text-white font-semibold shadow-[0_8px_20px_rgba(44,103,0,0.35)] py-3 transition-all active:scale-95"
                : "xl:min-w-36"
            )}
          >
            {isHero ? "Check Rates →" : "Search"}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </motion.form>
  );

  if (isHero) {
    return <div className="mx-auto w-full max-w-6xl">{form}</div>;
  }

  return (
    <Container className="relative z-20 -mt-10 md:-mt-14">
      {form}
    </Container>
  );
}
