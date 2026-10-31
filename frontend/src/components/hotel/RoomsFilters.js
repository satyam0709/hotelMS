"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Filter, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { buildQueryString, cn } from "@/lib/utils";

export default function RoomsFilters({
  categories = [],
  amenities = [],
  initialValues = {},
  total,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialValues.search || initialValues.q || "");
  const [category, setCategory] = useState(initialValues.category || "");
  const [guestCount, setGuestCount] = useState(initialValues.guestCount || "");
  const [minPrice, setMinPrice] = useState(
    initialValues.minPrice && Number(initialValues.minPrice) > 0 ? initialValues.minPrice : ""
  );
  const [maxPrice, setMaxPrice] = useState(
    initialValues.maxPrice && Number(initialValues.maxPrice) > 0 ? initialValues.maxPrice : ""
  );
  const [selectedAmenities, setSelectedAmenities] = useState(
    Array.isArray(initialValues.amenityIds) ? initialValues.amenityIds : []
  );

  const activeCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (category) count += 1;
    if (guestCount && Number(guestCount) > 0) count += 1;
    if (minPrice !== "" && Number(minPrice) > 0) count += 1;
    if (maxPrice !== "" && Number(maxPrice) > 0) count += 1;
    count += selectedAmenities.length;
    return count;
  }, [search, category, guestCount, minPrice, maxPrice, selectedAmenities]);

  function navigateWithFilters(overrides = {}) {
    const nextSearch = overrides.search !== undefined ? overrides.search : search;
    const nextCategory = overrides.category !== undefined ? overrides.category : category;
    const nextGuestCount = overrides.guestCount !== undefined ? overrides.guestCount : guestCount;
    const nextMinPrice = overrides.minPrice !== undefined ? overrides.minPrice : minPrice;
    const nextMaxPrice = overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
    const nextAmenities = overrides.amenityIds !== undefined ? overrides.amenityIds : selectedAmenities;

    const minVal = nextMinPrice !== "" && Number(nextMinPrice) > 0 ? Number(nextMinPrice) : undefined;
    const maxVal = nextMaxPrice !== "" && Number(nextMaxPrice) > 0 ? Number(nextMaxPrice) : undefined;
    const query = buildQueryString({
      search: nextSearch.trim() || undefined,
      category: nextCategory || undefined,
      guestCount: nextGuestCount && Number(nextGuestCount) > 0 ? Number(nextGuestCount) : undefined,
      minPrice: minVal,
      maxPrice: maxVal,
      amenityIds: nextAmenities,
    });
    startTransition(() => {
      router.push(`/rooms${query}`);
    });
  }

  function applyFilters(event) {
    event?.preventDefault?.();
    navigateWithFilters();
  }

  function handleCategoryChange(e) {
    const val = e.target.value;
    setCategory(val);
    navigateWithFilters({ category: val });
  }

  function toggleAmenity(id) {
    const nextAmenities = selectedAmenities.includes(id)
      ? selectedAmenities.filter((item) => item !== id)
      : [...selectedAmenities, id];
    setSelectedAmenities(nextAmenities);
    navigateWithFilters({ amenityIds: nextAmenities });
  }

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    triggerDebouncedSearch({ search: val });
  }

  function handleGuestChange(e) {
    const val = e.target.value;
    setGuestCount(val);
    triggerDebouncedSearch({ guestCount: val });
  }

  function handleMinPriceChange(e) {
    const val = e.target.value;
    setMinPrice(val);
    triggerDebouncedSearch({ minPrice: val });
  }

  function handleMaxPriceChange(e) {
    const val = e.target.value;
    setMaxPrice(val);
    triggerDebouncedSearch({ maxPrice: val });
  }

  function triggerDebouncedSearch(overrides) {
    if (typeof window !== "undefined") {
      if (window.__roomFilterTimer) {
        clearTimeout(window.__roomFilterTimer);
      }
      window.__roomFilterTimer = setTimeout(() => {
        navigateWithFilters(overrides);
      }, 400);
    }
  }

  function clearFilters() {
    if (typeof window !== "undefined" && window.__roomFilterTimer) {
      clearTimeout(window.__roomFilterTimer);
    }
    setSearch("");
    setCategory("");
    setGuestCount("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
    startTransition(() => {
      router.push("/rooms");
    });
  }

  return (
    <form
      onSubmit={applyFilters}
      className={cn(
        "rounded-2xl border border-line/80 bg-elevated/95 p-4.5 sm:p-5 shadow-soft backdrop-blur-sm",
        isPending && "opacity-80"
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line/60 pb-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
            <Filter className="size-3.5" />
            Filter Rooms
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {typeof total === "number" ? `${total} accommodation${total === 1 ? "" : "s"}` : "Refine your stay"}
            {activeCount ? ` · ${activeCount} active` : ""}
          </p>
        </div>
        {activeCount ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-sand-soft/60 hover:text-accent"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        ) : null}
      </div>

      <div className="space-y-3.5">
        <Input
          label="Search"
          type="search"
          name="search"
          placeholder="Keyword or room name…"
          value={search}
          onChange={handleSearchChange}
          inputClassName="h-10 text-xs sm:text-sm rounded-xl bg-white"
        />

        <label className="flex w-full flex-col gap-1">
          <span className="text-[11px] font-medium tracking-[0.06em] text-muted uppercase">
            Category
          </span>
          <select
            name="category"
            value={category}
            onChange={handleCategoryChange}
            className="h-10 w-full rounded-xl border border-line bg-white px-3 text-xs sm:text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)] cursor-pointer"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Guests"
          type="number"
          name="guestCount"
          min={1}
          max={30}
          placeholder="Any occupancy"
          value={guestCount}
          onChange={handleGuestChange}
          inputClassName="h-10 text-xs sm:text-sm rounded-xl bg-white"
        />

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Min price"
            type="number"
            name="minPrice"
            min={0}
            placeholder="₹ 0"
            value={minPrice}
            onChange={handleMinPriceChange}
            inputClassName="h-10 text-xs sm:text-sm rounded-xl bg-white"
          />
          <Input
            label="Max price"
            type="number"
            name="maxPrice"
            min={0}
            placeholder="Any"
            value={maxPrice}
            onChange={handleMaxPriceChange}
            inputClassName="h-10 text-xs sm:text-sm rounded-xl bg-white"
          />
        </div>

        {amenities.length ? (
          <fieldset className="pt-1 border-t border-line/60">
            <legend className="mb-2 text-[11px] font-medium tracking-[0.06em] text-muted uppercase">
              Popular Amenities
            </legend>
            <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto pr-1">
              {amenities.map((amenity) => {
                const active = selectedAmenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 cursor-pointer",
                      active
                        ? "border-accent bg-accent text-white shadow-xs font-semibold"
                        : "border-line/70 bg-white text-muted hover:border-accent/50 hover:bg-sand-soft/40 hover:text-ink"
                    )}
                  >
                    {active ? "✓ " : ""}{amenity.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <Button
          type="submit"
          size="sm"
          className="w-full mt-2 h-10 rounded-xl text-xs sm:text-sm font-semibold shadow-soft"
          disabled={isPending}
        >
          {isPending ? "Filtering…" : "Apply filters"}
        </Button>
      </div>
    </form>
  );
}
