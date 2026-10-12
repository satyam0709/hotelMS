"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { GALLERY_CATEGORY_OPTIONS } from "@/lib/gallery-items";
import GalleryPreviewGrid from "@/components/hotel/GalleryPreviewGrid";
import GalleryLightbox from "@/components/hotel/GalleryLightbox";

export default function GalleryExperience({
  items = [],
  showFilters = true,
  categoryOptions = GALLERY_CATEGORY_OPTIONS,
}) {
  const [category, setCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filtered = useMemo(() => {
    if (category === "all") return items;
    return items.filter((item) => item.category === category);
  }, [category, items]);

  const options = categoryOptions?.length ? categoryOptions : GALLERY_CATEGORY_OPTIONS;

  return (
    <div className="space-y-6">
      {showFilters ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Gallery categories">
          {options.map((option) => {
            const active = category === option.id;
            const count = option.id === "all"
              ? items.length
              : items.filter((item) => item.category === option.id).length;
            if (option.id !== "all" && count === 0) return null;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(option.id)}
                className={cn(
                  "ui-button-motion rounded-full border px-4 py-2 text-sm font-medium",
                  active
                    ? "border-accent bg-accent text-white shadow-accent"
                    : "border-line bg-elevated text-ink/80 hover:border-accent/50 hover:bg-accent-soft/60"
                )}
              >
                {option.label}
                <span className="ml-1.5 text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <GalleryPreviewGrid
        items={filtered}
        onSelect={(item) => {
          const idx = filtered.findIndex((row) => row.id === item.id);
          setLightboxIndex(idx >= 0 ? idx : 0);
        }}
      />

      <GalleryLightbox
        items={filtered}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
}
