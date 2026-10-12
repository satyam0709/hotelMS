"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Award, Sparkles, Waves } from "lucide-react";
import BookingSearch from "@/components/hotel/BookingSearch";
import { buildHeroPresentation } from "@/lib/banners";
import "./cinematic-hero.css";

const HERO_BADGES = [
  { label: "Forbes 5-Star 2024", Icon: Award },
  { label: "Michelin-starred culinary", Icon: Sparkles },
  { label: "Private thermal spa", Icon: Waves },
];

function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

function smoothstep(e0, e1, v) {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

function segmentInOut(s, a, b, c, d) {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
}

export default function CinematicHero({ banners = [] }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const controlsRef = useRef(null);
  const hero = useMemo(
    () => buildHeroPresentation({ banners }),
    [banners]
  );
  const sights = hero.sights;
  const frameKey = (hero.frameUrls || [hero.imageUrl]).join("|");
  const frameUrls = useMemo(
    () => (frameKey ? frameKey.split("|") : [hero.imageUrl]),
    [frameKey, hero.imageUrl]
  );
  const heroStyle = useMemo(() => {
    const [a, b, c, d] = frameUrls;
    return {
      "--hero-url": `url("${a}")`,
      "--hero-url-2": `url("${b || a}")`,
      "--hero-url-3": `url("${c || b || a}")`,
      "--hero-url-4": `url("${d || c || b || a}")`,
    };
  }, [frameUrls]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const controls = controlsRef.current;
    if (!section || !track || !controls) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = section;
    const originalCards = Array.from(track.querySelectorAll(".sight-card"));
    const originalSightCount = originalCards.length;

    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetScroll = 0;
    let smoothScroll = 0;
    let rafId = 0;
    let running = true;
    let lastTime = performance.now();
    let sectionTop = 0;
    let sectionHeight = 0;
    let viewportHeight = window.innerHeight;
    let cardStep = 0;
    let sightCards = [];
    let activeSight = originalSightCount;
    let controlsReady = false;

    function measure() {
      viewportHeight = window.innerHeight;
      const rect = section.getBoundingClientRect();
      sectionTop = window.scrollY + rect.top;
      sectionHeight = section.offsetHeight;
      if (sightCards[0]) {
        const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0") || 0;
        cardStep = sightCards[0].offsetWidth + gap;
      }
    }

    function getScrollDistance() {
      return clamp(
        window.scrollY - sectionTop,
        0,
        Math.max(0, sectionHeight - viewportHeight)
      );
    }

    function writeVars(map) {
      for (const key in map) {
        root.style.setProperty(key, map[key]);
      }
    }

    function updateSightSlider(instant = false) {
      if (!sightCards.length || !cardStep) return;
      if (instant) track.classList.add("is-jumping");
      root.style.setProperty("--sights-shift", `${-cardStep * activeSight}px`);
      sightCards.forEach((card, index) => {
        card.classList.toggle("is-active", index === activeSight);
      });
      if (instant) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => track.classList.remove("is-jumping"));
        });
      }
    }

    function jumpSightSlider(i) {
      activeSight = i;
      updateSightSlider(true);
    }

    function normalizeSightSlider() {
      if (activeSight >= originalSightCount * 2) {
        jumpSightSlider(activeSight - originalSightCount);
      } else if (activeSight < originalSightCount) {
        jumpSightSlider(activeSight + originalSightCount);
      }
    }

    function moveSightSlider(dir) {
      activeSight += dir;
      updateSightSlider();
    }

    function selectSightCard(card) {
      const value = Number(card.dataset.sightIndex);
      if (!Number.isFinite(value)) return;
      activeSight = value;
      updateSightSlider();
    }

    function setupSightSlider() {
      track.replaceChildren();
      for (let setIndex = 0; setIndex < 3; setIndex += 1) {
        originalCards.forEach((card, cardIndex) => {
          const clone = card.cloneNode(true);
          clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
          track.appendChild(clone);
        });
      }
      sightCards = Array.from(track.querySelectorAll(".sight-card"));
      activeSight = originalSightCount;
      sightCards.forEach((card) => {
        card.addEventListener("click", () => selectSightCard(card));
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectSightCard(card);
          }
        });
      });
      track.addEventListener("transitionend", (event) => {
        if (event.propertyName === "transform") normalizeSightSlider();
      });
      measure();
      updateSightSlider(true);
    }

    function update(now) {
      if (!running) return;
      const dt = Math.min(0.05, Math.max(0.008, (now - lastTime) / 1000));
      lastTime = now;

      targetScroll = getScrollDistance();

      if (reduceMotion.matches) {
        smoothScroll = targetScroll;
        mouseX = 0;
        mouseY = 0;
      } else {
        // Creamy inertia — lower lambda = silkier follow
        smoothScroll = damp(smoothScroll, targetScroll, 9.5, dt);
        mouseX = damp(mouseX, targetMouseX, 7.5, dt);
        mouseY = damp(mouseY, targetMouseY, 7.5, dt);
      }

      if (Math.abs(smoothScroll - targetScroll) < 0.15) smoothScroll = targetScroll;
      if (Math.abs(mouseX - targetMouseX) < 0.0004) mouseX = targetMouseX;
      if (Math.abs(mouseY - targetMouseY) < 0.0004) mouseY = targetMouseY;

      const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
      const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
      const progress = clamp(smoothScroll / 2700);
      const introExit = smoothstep(90, 650, smoothScroll);
      const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
      const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
      const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
      const blurActive = clamp(frame2.active + frame3.active);
      const frame2Opacity = frame2.active * (1 - frame3.enter);
      const splitDrift = Math.pow(frame2.enter, 1.5);
      const panel2Opacity = frame2.active * (1 - frame2.exit);
      const panel3Opacity = frame3.active * (1 - frame3.exit);
      const backScale = 0.82 + progress * 0.1 + frame2.enter * 0.06 + frame3.enter * 0.06;
      const sharedHeroY = progress * -48;
      const sharedHeroScale = progress * 0.08;
      const sightsScreenTop = Math.min(220, Math.max(112, viewportHeight * 0.19)) - 50;
      const sightsParentTop = viewportHeight - (viewportHeight - sightsScreenTop) / backScale;

      const mx = mouseX;
      const my = mouseY;

      // Keep bridge near natural framing — no width-as-scale blowup (that caused pool zoom)
      const bridgeScale = 1 + sharedHeroScale * 0.12 + frame2.exit * 0.08;
      const bridgeOpacity = Math.max(0, 1 - frame2.enter * 1.35);

      const nextReady = sightsControlsEnter > 0.98;
      if (nextReady !== controlsReady) {
        controlsReady = nextReady;
        controls.classList.toggle("is-ready", controlsReady);
      }

      // Crossfade unique frame photos as the blur clears and the split opens
      const splitReveal = Math.pow(frame2.enter, 0.85);
      root.classList.toggle("is-frames-split", splitReveal > 0.08);

      writeVars({
        "--mx": mx.toFixed(4),
        "--my": my.toFixed(4),
        "--back-opacity": (1 - frame2.active * 0.06).toFixed(4),
        "--back-x": `${(mx * -10).toFixed(2)}px`,
        "--back-y": `${(my * -3).toFixed(2)}px`,
        "--back-scale": backScale.toFixed(5),
        "--four-y": `${(10 + progress * 10).toFixed(3)}vh`,
        "--four-scale": (0.78 + progress * 0.16).toFixed(5),
        "--bazaar-y": `${(20 - progress * 8).toFixed(3)}vh`,
        "--shade-opacity": "1",
        "--shade-z": frame2.active > 0.02 ? "2" : "0",
        "--shade-top-alpha": (blurActive * 0.42).toFixed(4),
        "--shade-mid-alpha": (blurActive * 0.36).toFixed(4),
        "--shade-bottom-alpha": (blurActive * 0.48).toFixed(4),
        "--title-y": `${(introExit * -210).toFixed(2)}px`,
        "--title-scale": (1 - introExit * 0.08).toFixed(5),
        "--title-opacity": (1 - introExit).toFixed(4),
        "--bridge-x": `calc(-50% + ${(mx * 10).toFixed(2)}px)`,
        "--bridge-y": `${(my * 4 + sharedHeroY - frame2.exit * 760).toFixed(2)}px`,
        "--bridge-bottom": `${(5 - frame2.enter * 8).toFixed(3)}vh`,
        "--bridge-scale": bridgeScale.toFixed(5),
        "--bridge-opacity": bridgeOpacity.toFixed(4),
        "--split-left-x": `calc(-50% + ${(-splitDrift * 28).toFixed(3)}vw + ${(mx * 8).toFixed(2)}px)`,
        "--split-left-y": `${(my * 4 + sharedHeroY * 0.6 - splitDrift * 40).toFixed(2)}px`,
        // Lock near 1× — any higher and alt photos read as abstract crops
        "--split-left-scale": (1 + frame2.enter * 0.02).toFixed(5),
        "--split-right-x": `calc(-50% + ${(splitDrift * 28).toFixed(3)}vw + ${(mx * 8).toFixed(2)}px)`,
        "--split-right-y": `${(my * 4 + sharedHeroY * 0.6 - splitDrift * 40).toFixed(2)}px`,
        "--split-right-scale": (1 + frame2.enter * 0.02).toFixed(5),
        "--frame2-opacity": frame2Opacity.toFixed(4),
        "--frame2-x": `calc(-50% + ${(mx * 6).toFixed(2)}px)`,
        "--frame2-y": `calc(-50% + ${(my * 4 - frame2.exit * 120).toFixed(2)}px)`,
        "--frame2-scale": "1",
        "--intro-copy-y": `${(introExit * 90).toFixed(2)}px`,
        "--intro-copy-opacity": (1 - introExit).toFixed(4),
        // White wash clears with the text wipe so cinematic frames run on a clear image
        "--veil-opacity": (1 - introExit).toFixed(4),
        "--split-reveal": splitReveal.toFixed(4),
        "--panel2-opacity": panel2Opacity.toFixed(4),
        "--panel2-y": `calc(-50% + ${(-frame2.exit * 86 + (1 - frame2.enter) * 58).toFixed(2)}px)`,
        "--panel3-opacity": panel3Opacity.toFixed(4),
        "--panel3-y": `calc(-50% + ${(-frame3.exit * 86 + (1 - frame3.enter) * 58).toFixed(2)}px)`,
        "--sights-controls-opacity": sightsControlsEnter.toFixed(4),
        "--sights-visibility": sightsEnter > 0.01 ? "visible" : "hidden",
        "--sights-y": "0px",
        "--sights-enter-x": `${((1 - sightsEnter) * 420).toFixed(3)}vw`,
        "--sights-scale": (1 / backScale).toFixed(5),
        "--sights-top": `${sightsParentTop.toFixed(2)}px`,
        "--sights-screen-top": `${sightsScreenTop.toFixed(2)}px`,
      });

      rafId = requestAnimationFrame(update);
    }

    const onScroll = () => {
      targetScroll = getScrollDistance();
    };
    const onResize = () => {
      measure();
      updateSightSlider(true);
    };
    const onPointerMove = (event) => {
      targetMouseX = event.clientX / window.innerWidth - 0.5;
      targetMouseY = event.clientY / window.innerHeight - 0.5;
    };

    const prev = controls.querySelector(".sight-prev");
    const next = controls.querySelector(".sight-next");
    const onPrev = () => moveSightSlider(-1);
    const onNext = () => moveSightSlider(1);

    // Warm frame images so split layers paint without a flash
    frameUrls.forEach((src) => {
      if (!src) return;
      const warm = new Image();
      warm.src = src;
    });

    setupSightSlider();
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    prev?.addEventListener("click", onPrev);
    next?.addEventListener("click", onNext);
    rafId = requestAnimationFrame(update);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
    };
  }, [frameUrls, hero.videoUrl]);

  return (
    <section
      ref={sectionRef}
      className="cinema-scroll"
      id="cinema"
      aria-label="Resort cinematic scroll story"
      style={heroStyle}
    >
      <div className="stage">
        {hero.videoUrl ? (
          <video
            className="hero-video-bg"
            src={hero.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            poster={hero.imageUrl}
            aria-hidden="true"
          />
        ) : null}
        <div className="world">
          <div
            className="sky-layer"
            aria-hidden="true"
            style={{ backgroundImage: `url("${frameUrls[0]}")` }}
          />

          <div className="back-stack">
            <div
              className="scene-layer back-glow"
              aria-hidden="true"
              style={{ backgroundImage: `url("${frameUrls[0]}")` }}
            />
            <div className="sights-slider" aria-label="Resort highlights slider">
              <div className="sights-track" ref={trackRef}>
                {sights.map((item) => (
                  <article
                    key={`${item.title}-${item.kicker}`}
                    className="sight-card"
                    tabIndex={0}
                    role="button"
                    aria-label={item.aria}
                  >
                    <span className="sight-kicker">{item.kicker}</span>
                    <span className="sight-pin" aria-hidden="true" />
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
            <div
              className="scene-layer back-mid"
              aria-hidden="true"
              style={{ backgroundImage: `url("${frameUrls[3]}")` }}
            />
          </div>

          <div className="sights-controls" ref={controlsRef} aria-label="Slider controls">
            <button type="button" className="sight-nav sight-prev" aria-label="Previous sight">
              ←
            </button>
            <button type="button" className="sight-nav sight-next" aria-label="Next sight">
              →
            </button>
          </div>

          <div
            className="scene-layer splitframe-layer splitframe-left"
            aria-hidden="true"
            style={{
              backgroundImage: `url("${frameUrls[0]}")`,
              "--frame-alt": `url("${frameUrls[1]}")`,
            }}
          />
          <div
            className="scene-layer splitframe-layer splitframe-right"
            aria-hidden="true"
            style={{
              backgroundImage: `url("${frameUrls[0]}")`,
              "--frame-alt": `url("${frameUrls[2]}")`,
            }}
          />
          <div
            className="scene-layer bridge-layer"
            aria-hidden="true"
            style={{ backgroundImage: `url("${frameUrls[0]}")` }}
          />
          <div
            className="scene-layer frame-two-layer"
            aria-hidden="true"
            style={{ backgroundImage: `url("${frameUrls[3]}")` }}
          />
          <div className="readability-veil" aria-hidden="true" />
          <div className="shade" aria-hidden="true" />
        </div>

        <div className="intro-copy intro-copy--sanctuary">
          <ul className="intro-badges" aria-label="Distinctions">
            {HERO_BADGES.map(({ label, Icon }) => (
              <li key={label}>
                <Icon className="intro-badge-icon" aria-hidden />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <h1 className="intro-title">{hero.title}</h1>
          {hero.subtitle ? <p className="intro-subtitle">{hero.subtitle}</p> : null}
          <div className="intro-actions">
            <Link href={hero.ctaHref} className="intro-cta">
              {hero.ctaText}
              <ArrowRight className="intro-cta-arrow" aria-hidden />
            </Link>
            <Link href="/facilities" className="intro-cta intro-cta--secondary">
              Explore experiences
            </Link>
          </div>
        </div>

        <div className="hero-booking">
          <BookingSearch variant="hero" />
        </div>
      </div>
    </section>
  );
}
