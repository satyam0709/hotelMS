"use client";

import { useMemo, useState } from "react";
import Container from "@/components/ui/Container";
import ResortVignettesCarousel from "@/components/hotel/ResortVignettesCarousel";
import { demoGalleryItems } from "@/lib/demo-content";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "rooms", label: "Residences" },
  { id: "wellness", label: "Wellness" },
  { id: "dining", label: "Dining" },
];

function itemText(item) {
  return [
    item.sourceType,
    item.category,
    item.title,
    item.caption,
    item.alt,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesFilter(item, filterId) {
  if (filterId === "all") return true;
  const text = itemText(item);
  if (filterId === "rooms") {
    return (
      text.includes("room") ||
      text.includes("suite") ||
      text.includes("villa") ||
      text.includes("resid")
    );
  }
  if (filterId === "wellness") {
    return (
      text.includes("facility") ||
      text.includes("spa") ||
      text.includes("pool") ||
      text.includes("wellness") ||
      text.includes("gym") ||
      text.includes("yoga")
    );
  }
  if (filterId === "dining") {
    return (
      text.includes("dining") ||
      text.includes("restaurant") ||
      text.includes("pavilion") ||
      text.includes("cafe") ||
      text.includes("bar") ||
      text.includes("kitchen")
    );
  }
  return true;
}

function mergeUnique(primary, fallback, limit = 18) {
  const seen = new Set();
  const out = [];
  for (const item of [...primary, ...fallback]) {
    if (!item?.src || seen.has(item.src)) continue;
    seen.add(item.src);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export default function HomeGalleryVignettes({ items = [] }) {
  const [filter, setFilter] = useState("all");
  const demo = useMemo(() => demoGalleryItems(), []);
  const sourceItems = useMemo(
    () => mergeUnique(items.length ? items : [], demo, 24),
    [items, demo],
  );

  const filtered = useMemo(() => {
    const matched = sourceItems.filter((item) => matchesFilter(item, filter));
    // Always keep enough unique images so the carousel can rotate visibly
    if (matched.length >= 6) return matched.slice(0, 18);
    if (matched.length >= 3) {
      return mergeUnique(matched, sourceItems, 12);
    }
    return sourceItems.slice(0, 18);
  }, [sourceItems, filter]);

  return (
    <section className="pt-3 pb-4 md:pt-4 md:pb-5 bg-elevated/40">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            className="mb-0 md:mb-0"
            eyebrow="Gallery"
            title="Resort vignettes"
            description="A curated look at suites, wellness spaces, and open-air dining across the property."
          />
          <div className="flex flex-wrap gap-2 md:justify-end">
            {FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                  filter === tab.id
                    ? "border-accent bg-accent text-white shadow-sm"
                    : "border-line bg-elevated text-muted hover:border-accent/40 hover:text-ink",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ResortVignettesCarousel items={filtered} />
      </Container>
    </section>
  );
}
