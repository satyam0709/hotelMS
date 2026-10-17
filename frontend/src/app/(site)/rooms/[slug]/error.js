"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function RoomDetailError({ error, reset }) {
  useEffect(() => {
    console.error("Room detail page error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <Container className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-line bg-accent-soft/50 text-accent shadow-soft">
          <AlertCircle className="size-8" />
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Room Unavailable
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          We couldn&apos;t load this room
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We encountered an issue preparing the room overview. You can try refreshing the page or explore our other suites and rooms.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} className="inline-flex items-center gap-2">
            <RotateCcw className="size-4" />
            Reload room
          </Button>
          <Button href="/rooms" variant="secondary" className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Browse all rooms
          </Button>
        </div>
      </Container>
    </div>
  );
}
