"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminMarkdownEditor from "@/components/admin/AdminMarkdownEditor";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { listAdminTaxRates } from "@/lib/api/admin-pricing";
import { createAdminRoom, listAdminRoomCategories } from "@/lib/api/admin-rooms";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  name: "",
  slug: "",
  roomCode: "",
  roomCategoryId: "",
  taxRateId: "",
  shortDescription: "",
  basePrice: "",
  weekendPrice: "",
  maxAdults: "2",
  maxChildren: "0",
  maxOccupancy: "2",
  totalInventory: "1",
  roomSize: "",
  bedType: "",
  extraBedAllowed: false,
  extraBedCharge: "",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  description: "",
  policies: "",
  isActive: true,
  isFeatured: false,
  slugTouched: false,
  codeTouched: false,
};

function suggestRoomCode(slugOrName) {
  const base = slugify(slugOrName).replace(/-/g, "_").toUpperCase();
  return base.slice(0, 80);
}

export default function AdminRoomCreateForm() {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "rooms.create");

  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, taxes] = await Promise.all([
          listAdminRoomCategories({ limit: 100 }),
          listAdminTaxRates({ limit: 100 }).catch(() => ({ items: [] })),
        ]);
        if (!active) return;
        const items = data.items || [];
        const taxItems = taxes.items || [];
        setCategories(items);
        setTaxRates(taxItems);
        setForm((prev) => ({
          ...prev,
          roomCategoryId: prev.roomCategoryId || items.find((c) => c.isActive)?.id || items[0]?.id || "",
          taxRateId: prev.taxRateId || taxItems.find((t) => t.isDefault && t.isActive)?.id || "",
        }));
      } catch {
        if (active) setError("Unable to load room categories.");
      } finally {
        if (active) setLoadingCats(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !prev.slugTouched) {
        next.slug = slugify(value);
        if (!prev.codeTouched) next.roomCode = suggestRoomCode(value);
      }
      if (key === "slug") {
        next.slugTouched = true;
        if (!prev.codeTouched) next.roomCode = suggestRoomCode(value);
      }
      if (key === "roomCode") next.codeTouched = true;
      if (key === "maxAdults" || key === "maxChildren") {
        const adults = Number(key === "maxAdults" ? value : next.maxAdults) || 0;
        const children = Number(key === "maxChildren" ? value : next.maxChildren) || 0;
        const currentOcc = Number(next.maxOccupancy) || 0;
        if (currentOcc < adults + children) {
          next.maxOccupancy = String(adults + children);
        }
      }
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canCreate) return;
    setSaving(true);
    setError("");

    const maxAdults = toOptionalNumber(form.maxAdults);
    const maxChildren = toOptionalNumber(form.maxChildren) ?? 0;
    const maxOccupancy = toOptionalNumber(form.maxOccupancy);
    const basePrice = toOptionalNumber(form.basePrice);
    const totalInventory = toOptionalNumber(form.totalInventory);

    if (maxOccupancy != null && maxAdults != null && maxOccupancy < maxAdults + maxChildren) {
      setError("Max occupancy must be at least max adults plus max children.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      roomCode: form.roomCode.trim().toUpperCase(),
      roomCategoryId: form.roomCategoryId,
      taxRateId: form.taxRateId || null,
      basePrice,
      maxAdults,
      maxChildren,
      maxOccupancy,
      totalInventory,
      shortDescription: form.shortDescription.trim() || null,
      weekendPrice: toOptionalNumber(form.weekendPrice),
      roomSize: form.roomSize.trim() || null,
      bedType: form.bedType.trim() || null,
      extraBedAllowed: Boolean(form.extraBedAllowed),
      extraBedCharge: form.extraBedAllowed ? toOptionalNumber(form.extraBedCharge) : null,
      checkInTime: form.checkInTime.trim() || null,
      checkOutTime: form.checkOutTime.trim() || null,
      description: form.description.trim() || null,
      policies: form.policies.trim() || null,
      isActive: Boolean(form.isActive),
      isFeatured: Boolean(form.isFeatured),
    };

    try {
      const created = await createAdminRoom(payload);
      router.push(`/admin/rooms/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create room.");
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <ErrorState
        title="Permission required"
        description="You need rooms.create to add inventory."
        action={<Button href="/admin/rooms">Back to rooms</Button>}
      />
    );
  }

  if (loadingCats) return <LoadingState label="Loading form" />;

  if (!categories.length) {
    return (
      <ErrorState
        title="Add a category first"
        description="Rooms require a room category before they can be created."
        action={<Button href="/admin/room-categories">Manage categories</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/rooms" className="hover:text-accent">Rooms</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">New room</span>
      </nav>

      <div>
        <h1 className="font-display text-3xl text-ink">New room</h1>
        <p className="mt-2 text-sm text-muted">
          Create inventory, then set amenities, media, rates, and availability on the edit page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
        <Input
          label="Room name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Slug"
            value={form.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            required
          />
          <Input
            label="Room code"
            value={form.roomCode}
            onChange={(event) => updateField("roomCode", event.target.value)}
            required
            placeholder="DELUXE_KING"
          />
        </div>

        <label className="flex w-full flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Category</span>
          <select
            value={form.roomCategoryId}
            onChange={(event) => updateField("roomCategoryId", event.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}{cat.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-full flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Tax rate</span>
          <select
            value={form.taxRateId}
            onChange={(event) => updateField("taxRateId", event.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
          >
            <option value="">No tax</option>
            {taxRates.map((tax) => (
              <option key={tax.id} value={tax.id}>
                {tax.name} ({tax.percentage}%){tax.isDefault ? " · default" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Base price"
            type="number"
            min="0"
            step="0.01"
            value={form.basePrice}
            onChange={(event) => updateField("basePrice", event.target.value)}
            required
          />
          <Input
            label="Weekend price"
            type="number"
            min="0"
            step="0.01"
            value={form.weekendPrice}
            onChange={(event) => updateField("weekendPrice", event.target.value)}
          />
        </div>

        <Input
          label="Total inventory (units)"
          type="number"
          min="1"
          value={form.totalInventory}
          onChange={(event) => updateField("totalInventory", event.target.value)}
          required
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Max adults"
            type="number"
            min="1"
            value={form.maxAdults}
            onChange={(event) => updateField("maxAdults", event.target.value)}
            required
          />
          <Input
            label="Max children"
            type="number"
            min="0"
            value={form.maxChildren}
            onChange={(event) => updateField("maxChildren", event.target.value)}
          />
          <Input
            label="Max occupancy"
            type="number"
            min="1"
            value={form.maxOccupancy}
            onChange={(event) => updateField("maxOccupancy", event.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Room size"
            value={form.roomSize}
            onChange={(event) => updateField("roomSize", event.target.value)}
            placeholder="32 sqm"
          />
          <Input
            label="Bed type"
            value={form.bedType}
            onChange={(event) => updateField("bedType", event.target.value)}
            placeholder="King / Twin"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Check-in time"
            value={form.checkInTime}
            onChange={(event) => updateField("checkInTime", event.target.value)}
            placeholder="14:00"
          />
          <Input
            label="Check-out time"
            value={form.checkOutTime}
            onChange={(event) => updateField("checkOutTime", event.target.value)}
            placeholder="11:00"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.extraBedAllowed}
            onChange={(event) => updateField("extraBedAllowed", event.target.checked)}
          />
          Extra bed allowed
        </label>
        {form.extraBedAllowed ? (
          <Input
            label="Extra bed charge"
            type="number"
            min="0"
            step="0.01"
            value={form.extraBedCharge}
            onChange={(event) => updateField("extraBedCharge", event.target.value)}
          />
        ) : null}

        <label className="block text-sm text-ink">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Short description</span>
          <textarea
            value={form.shortDescription}
            onChange={(event) => updateField("shortDescription", event.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink"
            maxLength={255}
          />
        </label>
        <AdminMarkdownEditor
          label="Full description"
          value={form.description}
          onChange={(value) => updateField("description", value)}
          rows={6}
        />
        <AdminMarkdownEditor
          label="Room policies"
          value={form.policies}
          onChange={(value) => updateField("policies", value)}
          rows={4}
        />

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active on website
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => updateField("isFeatured", event.target.checked)}
            />
            Featured on home
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create room"}
          </Button>
          <Button type="button" variant="secondary" href="/admin/rooms">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
