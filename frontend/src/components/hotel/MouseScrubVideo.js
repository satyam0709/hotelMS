"use client";

import { useEffect, useRef, useState } from "react";

const SENSITIVITY = 0.8;

const DEFAULT_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4";

/**
 * Full-viewport muted video scrubbed by horizontal mouse movement.
 * Does not autoplay. Uses onSeeked queue to avoid seek flooding.
 */
export default function MouseScrubVideo({
  src = DEFAULT_SRC,
  poster = "",
  className = "",
}) {
  const videoRef = useRef(null);
  const prevXRef = useRef(null);
  const targetTimeRef = useRef(0);
  const seekingRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    function clampTime(t) {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return 0;
      return Math.min(duration, Math.max(0, t));
    }

    function applySeek() {
      if (!video || seekingRef.current) return;
      const next = clampTime(targetTimeRef.current);
      if (Math.abs(video.currentTime - next) < 0.01) return;
      seekingRef.current = true;
      try {
        video.currentTime = next;
      } catch {
        seekingRef.current = false;
      }
    }

    function onSeeked() {
      seekingRef.current = false;
      const next = clampTime(targetTimeRef.current);
      if (Math.abs(video.currentTime - next) >= 0.01) {
        applySeek();
      }
    }

    function onMouseMove(event) {
      const x = event.clientX;
      if (prevXRef.current == null) {
        prevXRef.current = x;
        return;
      }
      const delta = x - prevXRef.current;
      prevXRef.current = x;

      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const offset = (delta / window.innerWidth) * SENSITIVITY * duration;
      targetTimeRef.current = clampTime(targetTimeRef.current + offset);
      applySeek();
    }

    function onLoadedMetadata() {
      targetTimeRef.current = clampTime(video.currentTime || 0);
    }

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [reducedMotion, src]);

  // Absolute within the hero (h-screen) so it does not cover sections below
  if (reducedMotion) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-0 bg-cover bg-center ${className}`}
        style={{
          backgroundImage: poster ? `url("${poster}")` : undefined,
          backgroundColor: "#13221c",
          objectPosition: "70% center",
        }}
        aria-hidden
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${className}`}
      style={{ objectPosition: "70% center" }}
      src={src}
      poster={poster || undefined}
      muted
      playsInline
      preload="auto"
      aria-hidden
    />
  );
}
