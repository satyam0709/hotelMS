"use client";

import { useEffect, useMemo, useState } from "react";
import AvailableRoomCard from "@/components/booking/AvailableRoomCard";
import BookingSearchForm from "@/components/booking/BookingSearchForm";
import BookingSteps from "@/components/booking/BookingSteps";
import GuestCheckoutForm from "@/components/booking/GuestCheckoutForm";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { getAvailability } from "@/lib/api/rooms";
import { hasValidStayDates } from "@/lib/api/booking";
import { formatDateLabel } from "@/lib/utils";

export default function BookingFlow({
  search,
  availability,
  availabilityError,
  brandName,
  onlinePaymentEnabled = true,
  payAtHotelEnabled = true,
}) {
  const hasDates = hasValidStayDates(search);
  const [liveAvailability, setLiveAvailability] = useState(availability);
  const [liveError, setLiveError] = useState(availabilityError);
  const [isLoading, setIsLoading] = useState(false);

  // Client-side auto-retry if SSR failed or returned an error
  useEffect(() => {
    if (hasDates && (!liveAvailability || liveError)) {
      let isMounted = true;
      setIsLoading(true);
      getAvailability({
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: search.adults,
        children: search.children,
        rooms: search.rooms,
        category: search.category,
        roomId: search.roomId,
        room: search.room,
        limit: 50,
      })
        .then((data) => {
          if (!isMounted) return;
          setLiveAvailability(data);
          setLiveError("");
        })
        .catch((err) => {
          if (!isMounted) return;
          setLiveError(err?.message || "Unable to check availability.");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [
    hasDates,
    search.checkIn,
    search.checkOut,
    search.adults,
    search.children,
    search.rooms,
    search.category,
    search.roomId,
    search.room,
  ]);

  const items = Array.isArray(liveAvailability?.items) ? liveAvailability.items : [];

  const preferred = useMemo(() => {
    if (!items.length) return null;
    if (search.roomId) {
      return items.find((item) => item.id === search.roomId) || null;
    }
    if (search.room) {
      return items.find((item) => item.slug === search.room) || null;
    }
    return null;
  }, [items, search.room, search.roomId]);

  const orderedItems = useMemo(() => {
    if (!preferred) return items;
    return [preferred, ...items.filter((item) => item.id !== preferred.id)];
  }, [items, preferred]);

  const [selectedRoom, setSelectedRoom] = useState(preferred);
  const [step, setStep] = useState(() => {
    if (!hasDates) return "search";
    if (preferred) return "guest";
    return "rooms";
  });

  // When liveAvailability arrives or updates on the client, auto-select preferred room if needed
  useEffect(() => {
    if (preferred && !selectedRoom) {
      setSelectedRoom(preferred);
    }
  }, [preferred, selectedRoom]);

  const currentStep = !hasDates
    ? "search"
    : step === "guest" && selectedRoom
      ? "guest"
      : hasDates
        ? "rooms"
        : "search";

  function selectRoom(room) {
    setSelectedRoom(room);
    setStep("guest");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function retryFetch() {
    setIsLoading(true);
    setLiveError("");
    getAvailability({
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      children: search.children,
      rooms: search.rooms,
      category: search.category,
      roomId: search.roomId,
      room: search.room,
      limit: 50,
    })
      .then((data) => {
        setLiveAvailability(data);
        setLiveError("");
      })
      .catch((err) => {
        setLiveError(err?.message || "Unable to check availability.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="space-y-8">
      <BookingSteps current={currentStep} />

      {currentStep !== "guest" ? (
        <BookingSearchForm
          initialValues={search}
          roomSlug={search.room}
          compact={hasDates}
        />
      ) : null}

      {isLoading ? (
        <div className="rounded-[1.75rem] border border-line bg-elevated p-8 text-center text-muted">
          <p className="animate-pulse text-sm">Checking live room availability…</p>
        </div>
      ) : null}

      {!isLoading && liveError ? (
        <ErrorState
          title="Unable to check availability"
          description={liveError}
          action={
            <Button type="button" onClick={retryFetch}>
              Try again
            </Button>
          }
        />
      ) : null}

      {hasDates && currentStep === "rooms" ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                Available rooms
              </p>
              <h2 className="mt-2 font-display text-3xl text-ink">
                {formatDateLabel(search.checkIn)} → {formatDateLabel(search.checkOut)}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {liveAvailability?.nights || "—"} night
                {(liveAvailability?.nights || 0) === 1 ? "" : "s"} · {search.adults} adults
                {search.children ? ` · ${search.children} children` : ""} · {search.rooms} room
                {search.rooms === 1 ? "" : "s"}
              </p>
            </div>
            {selectedRoom ? (
              <Button type="button" onClick={() => setStep("guest")}>
                Continue with {selectedRoom.name}
              </Button>
            ) : null}
          </div>

          {orderedItems.length ? (
            <div className="space-y-4">
              {orderedItems.map((room, index) => (
                <AvailableRoomCard
                  key={room.id}
                  room={room}
                  nights={liveAvailability?.nights}
                  selected={selectedRoom?.id === room.id}
                  onSelect={selectRoom}
                  fallbackIndex={index}
                />
              ))}
            </div>
          ) : !liveError && !isLoading ? (
            <EmptyState
              title="No rooms available for these dates"
              description="Try different dates, fewer rooms, or adjust guest counts."
              action={<Button href="/rooms" variant="secondary">Browse all rooms</Button>}
            />
          ) : null}
        </section>
      ) : null}

      {currentStep === "guest" && selectedRoom ? (
        <GuestCheckoutForm
          search={search}
          selectedRoom={selectedRoom}
          brandName={brandName}
          onlinePaymentEnabled={onlinePaymentEnabled}
          payAtHotelEnabled={payAtHotelEnabled}
          onBack={() => setStep("rooms")}
        />
      ) : null}

      {!hasDates && !liveError && !isLoading ? (
        <EmptyState
          title="Start with your travel dates"
          description="Search availability to see live rates and inventory from the property."
        />
      ) : null}
    </div>
  );
}
