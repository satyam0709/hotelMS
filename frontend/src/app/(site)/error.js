"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function SiteError({ error, reset }) {
  useEffect(() => {
    console.error("Site error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-20">
      <Container className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-line bg-accent-soft/50 text-accent shadow-soft">
          <AlertCircle className="size-8" />
        </div>
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          Temporary Notice
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          We encountered an unexpected moment
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Our team has been notified. You can retry refreshing the view or explore our other resort spaces.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} className="inline-flex items-center gap-2">
            <RotateCcw className="size-4" />
            Reload page
          </Button>
          <Button href="/" variant="secondary" className="inline-flex items-center gap-2">
            <ArrowLeft className="size-4" />
            Return to home
          </Button>
        </div>
      </Container>
    </div>
  );
}
