"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SphereGallery3D = dynamic(() => import("@/components/hotel/SphereGallery3D"), {
  ssr: false,
  loading: () => <HeroSpherePlaceholder />,
});

function HeroSpherePlaceholder() {
  return (
    <div
      className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,rgba(146,205,0,0.16),rgba(255,207,121,0.08)_42%,transparent_70%)]"
      aria-hidden="true"
    />
  );
}

export default function HeroSphereLazy({ images }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = Boolean(navigator.connection?.saveData);
    if (!desktop.matches || reduceMotion.matches || saveData) return undefined;

    const enable = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(enable, { timeout: 1600 });
      return () => window.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(enable, 350);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!ready) return <HeroSpherePlaceholder />;

  return (
    <SphereGallery3D
      images={images}
      branches={18}
      scale={78}
      size={32}
      speed={10}
      hover={180}
      rounded={20}
      core={{ coreSize: 22, coreColor: "#92cd0088", lineColor: "#ffcf7955" }}
      className="h-full w-full"
    />
  );
}
