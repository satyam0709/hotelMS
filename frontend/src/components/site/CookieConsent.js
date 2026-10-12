"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "hotelms-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore storage failures
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-line bg-elevated/95 p-4 shadow-soft backdrop-blur-md md:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          We use essential cookies to keep the site working and optional cookies to improve your stay
          experience. Choose Accept or Decline — you can change this later by clearing site data.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => choose("declined")}>
            Decline
          </Button>
          <Button type="button" size="sm" onClick={() => choose("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
