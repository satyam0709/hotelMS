"use client";

import { useEffect, useId, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  const existing = document.querySelector(`script[src^="${SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      if (window.turnstile) resolve(window.turnstile);
      else existing.addEventListener("load", () => resolve(window.turnstile));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("Failed to load CAPTCHA."));
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({ onToken, className }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const reactId = useId();

  useEffect(() => {
    if (!siteKey || !containerRef.current) return undefined;
    let cancelled = false;

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !turnstile || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onToken?.(token || ""),
          "expired-callback": () => onToken?.(""),
          "error-callback": () => onToken?.(""),
        });
      })
      .catch(() => {
        onToken?.("");
      });

    return () => {
      cancelled = true;
      try {
        if (widgetIdRef.current != null && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch {
        // ignore cleanup errors
      }
    };
  }, [onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <div
      ref={containerRef}
      id={`turnstile-${reactId}`}
      className={className}
      data-testid="turnstile-widget"
    />
  );
}

export function isTurnstileEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
