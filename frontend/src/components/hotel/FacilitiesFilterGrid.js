"use client";

import { useMemo, useState } from "react";
import FacilityCard from "@/components/hotel/FacilityCard";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { cn } from "@/lib/utils";

export default function FacilitiesFilterGrid({ facilities = [] }) {
  const categories = useMemo(() => {
    const set = new Set();
    for (const item of facilities) {
      if (item?.category) set.add(item.category);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [facilities]);

  const [active, setActive] = useState("all");

  const filtered = useMemo(() => {
    if (active === "all") return facilities;
    return facilities.filter((item) => item.category === active);
  }, [active, facilities]);

  const options = [{ id: "all", label: "All" }, ...categories.map((category) => ({ id: category, label: category }))];

  return (
    <div className="space-y-8">
      {categories.length ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Facility categories">
          {options.map((option) => {
            const isActive = active === option.id;
            const count = option.id === "all"
              ? facilities.length
              : facilities.filter((item) => item.category === option.id).length;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(option.id)}
                className={cn(
                  "ui-button-motion rounded-full border px-4 py-2 text-sm font-medium",
                  isActive
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

      <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((facility, index) => (
          <StaggerItem key={facility.id}>
            <FacilityCard facility={facility} fallbackIndex={index} />
          </StaggerItem>
        ))}
      </Stagger>

      {!filtered.length ? (
        <p className="py-10 text-center text-sm text-muted">No facilities in this category.</p>
      ) : null}
    </div>
  );
}
