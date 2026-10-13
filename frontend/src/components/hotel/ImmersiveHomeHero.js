"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildHeroPresentation } from "@/lib/banners";
import { siteConfig } from "@/lib/config";
import useTypewriter from "@/hooks/useTypewriter";
import MouseScrubVideo from "@/components/hotel/MouseScrubVideo";
import { cn } from "@/lib/utils";

const TYPEWRITER_TEXT =
  "Glad you stopped in. Good taste tends to find us. Now, what kind of stay are we crafting?";

const ACTION_PILLS = [
  { label: "Reserve a stay", href: "/booking" },
  { label: "Explore suites", href: "/rooms" },
  { label: "Amenities & spa", href: "/facilities" },
  { label: "See the story", href: "/about" },
];

function CopyIcon({ className }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8.5 3.5V2.5A1 1 0 0 0 7.5 1.5H2.5A1 1 0 0 0 1.5 2.5v5A1 1 0 0 0 2.5 8.5H3.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export default function ImmersiveHomeHero({ banners = [], settings = {} }) {
  const hero = useMemo(() => buildHeroPresentation({ banners }), [banners]);
  const email =
    settings.email || settings.contactEmail || "reservations@exostay.com";
  const brand = settings.websiteName || siteConfig.name;

  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, {
    speed: 38,
    startDelay: 600,
  });
  const [pillsVisible, setPillsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setPillsVisible(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const pillBase =
    "inline-flex items-center justify-center rounded-full border px-4 py-[0.3em] sm:px-5 text-[13px] sm:text-[15px] whitespace-nowrap mx-[0.2em] mb-[0.4em] transition-colors duration-200";

  return (
    <section className="relative z-[1] flex h-screen flex-col overflow-hidden justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10">
      <MouseScrubVideo poster={hero.imageUrl} />

      {/* Soft scrim so white copy stays readable */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/55 via-black/25 to-black/35"
        aria-hidden
      />

      <div className="relative z-10 max-w-xl">
        <p
          className="pointer-events-none mb-5 select-none text-white sm:mb-6"
          style={{
            fontSize: "clamp(18px, 4vw, 26px)",
            lineHeight: 1.3,
            fontWeight: 400,
            filter: "blur(4px)",
          }}
        >
          Welcome to {brand},
          <br />
          Where light, landscape, and quiet luxury meet
        </p>

        <p
          className="mb-5 text-white sm:mb-6"
          style={{
            fontSize: "clamp(18px, 4vw, 26px)",
            lineHeight: 1.35,
            fontWeight: 400,
            minHeight: 54,
          }}
        >
          {displayed}
          {!done ? (
            <span
              className="ml-[2px] inline-block h-[1.1em] w-[2px] align-middle bg-white animate-[blink_1s_step-end_infinite]"
              aria-hidden
            />
          ) : null}
        </p>

        <div
          className={cn(
            "flex flex-wrap gap-y-1 transition-[opacity,transform] duration-400 ease-out",
            pillsVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          style={{ transitionDuration: "0.4s" }}
        >
          {ACTION_PILLS.map((pill) => (
            <Link
              key={pill.href}
              href={pill.href}
              className={cn(
                pillBase,
                "border-black/10 bg-white text-black hover:bg-black hover:text-white",
              )}
            >
              {pill.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={copyEmail}
            className={cn(
              pillBase,
              "gap-2 border-white bg-transparent text-white sm:gap-3 hover:bg-white hover:text-black",
            )}
            aria-label={copied ? "Email copied" : `Copy email ${email}`}
          >
            <span>
              Reach us:{" "}
              <span className="underline underline-offset-1">{email}</span>
            </span>
            <CopyIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
