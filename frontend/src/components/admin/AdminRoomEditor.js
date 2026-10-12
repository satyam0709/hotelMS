"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminRoomAssetsManager from "@/components/admin/AdminRoomAssetsManager";
import AdminRoomInventoryManager from "@/components/admin/AdminRoomInventoryManager";
import AdminMarkdownEditor from "@/components/admin/AdminMarkdownEditor";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/admin/StatusBadge";
import { ApiError } from "@/lib/api/client";
import { listAdminTaxRates } from "@/lib/api/admin-pricing";
import { deleteAdminRoom, getAdminRoom, listAdminRoomCategories, updateAdminRoom } from "@/lib/api/admin-rooms";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatCurrency } from "@/lib/utils";

export default function AdminRoomEditor({ roomId }) {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "rooms.update");
  const canDelete = hasPermission(admin, "rooms.delete");
  const [room, setRoom] = useState(null);
  const [categories, setCategories] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, cats, taxes] = await Promise.all([
          getAdminRoom(roomId),
          listAdminRoomCategories({ limit: 100 }),
          listAdminTaxRates({ limit: 100 }).catch(() => ({ items: [] })),
        ]);
        if (active) {
          setRoom(data);
          setCategories(cats.items || []);
          setTaxRates(taxes.items || []);
        }
      } catch {
        if (active) setError("Room not found or access denied.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [roomId]);

  function updateField(key, value) {
    setRoom((prev) => ({ ...prev, [key]: value }));
  }

  function patchRoom(partial) {
    setRoom((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canUpdate) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        name: room.name?.trim(),
        roomCategoryId: room.roomCategoryId || room.category?.id,
        taxRateId: room.taxRateId || room.taxRate?.id || null,
        basePrice: Number(room.basePrice),
        weekendPrice: room.weekendPrice === "" || room.weekendPrice == null ? null : Number(room.weekendPrice),
        maxAdults: Number(room.maxAdults),
        maxChildren: Number(room.maxChildren ?? 0),
        maxOccupancy: Number(room.maxOccupancy),
        totalInventory: Number(room.totalInventory),
        roomSize: room.roomSize?.trim() || null,
        bedType: room.bedType?.trim() || null,
        extraBedAllowed: Boolean(room.extraBedAllowed),
        extraBedCharge: room.extraBedAllowed
          ? (room.extraBedCharge === "" || room.extraBedCharge == null ? null : Number(room.extraBedCharge))
          : null,
        checkInTime: room.checkInTime?.trim() || null,
        checkOutTime: room.checkOutTime?.trim() || null,
        isActive: Boolean(room.isActive),
        isFeatured: Boolean(room.isFeatured),
        shortDescription: room.shortDescription?.trim() || null,
        description: room.description?.trim() || null,
        policies: room.policies?.trim() || null,
      };
      const updated = await updateAdminRoom(roomId, payload);
      setRoom(updated);
      setMessage("Room updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save room.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canDelete) return;
    if (!window.confirm(`Delete room “${room?.name || "this room"}”? This cannot be undone if the room has no bookings.`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteAdminRoom(roomId);
      router.replace("/admin/rooms");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete room.");
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading room" />;
  if (error || !room) {
    return (
      <ErrorState
        title="Room unavailable"
        description={error || "Unknown error"}
        action={<Button href="/admin/rooms">Back to rooms</Button>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted">
        <Link href="/admin/rooms" className="hover:text-accent">Rooms</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{room.name}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ink">{room.name}</h1>
          <StatusBadge status={room.isActive ? "ACTIVE" : "INACTIVE"} />
          {room.isFeatured ? <StatusBadge status="FEATURED" /> : null}
        </div>
        {canDelete ? (
          <Button type="button" size="sm" variant="secondary" onClick={handleDelete} disabled={saving}>
            Delete room
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-muted">
        Public slug{" "}
        <Link href={`/rooms/${room.slug}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          {room.slug}
        </Link>
        {" · "}
        <Link href="/admin/room-categories" className="text-accent hover:underline">
          Manage categories
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
        <Input
          label="Room name"
          value={room.name || ""}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
        <label className="flex w-full flex-col gap-1.5">
          <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Category</span>
          <select
            value={room.roomCategoryId || room.category?.id || ""}
            onChange={(event) => updateField("roomCategoryId", event.target.value)}
            className="h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
            required
          >
            <option value="" disabled>
              Select category
            </option>
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
            value={room.taxRateId || room.taxRate?.id || ""}
            onChange={(event) => updateField("taxRateId", event.target.value || null)}
            className="h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
          >
            <option value="">No tax</option>
            {taxRates.map((tax) => (
              <option key={tax.id} value={tax.id}>
                {tax.name} ({tax.percentage}%){tax.isDefault ? " · default" : ""}{tax.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
          <Link href="/admin/tax-rates" className="text-xs text-accent hover:underline">Manage tax rates</Link>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Base price"
            type="number"
            min="0"
            step="0.01"
            value={room.basePrice ?? ""}
            onChange={(event) => updateField("basePrice", event.target.value)}
          />
          <Input
            label="Weekend price"
            type="number"
            min="0"
            step="0.01"
            value={room.weekendPrice ?? ""}
            onChange={(event) => updateField("weekendPrice", event.target.value)}
          />
          <Input
            label="Total inventory (units)"
            type="number"
            min="1"
            value={room.totalInventory ?? ""}
            onChange={(event) => updateField("totalInventory", event.target.value)}
          />
          <Input
            label="Room size"
            value={room.roomSize || ""}
            onChange={(event) => updateField("roomSize", event.target.value)}
            placeholder="32 sqm"
          />
          <Input
            label="Bed type"
            value={room.bedType || ""}
            onChange={(event) => updateField("bedType", event.target.value)}
            placeholder="King / Twin"
          />
        </div>
        <p className="text-xs text-muted">
          Current listing rate: {formatCurrency(room.basePrice, room.currency)} · Inventory units are used by availability and blocks.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Max adults"
            type="number"
            min="1"
            value={room.maxAdults ?? ""}
            onChange={(event) => updateField("maxAdults", event.target.value)}
          />
          <Input
            label="Max children"
            type="number"
            min="0"
            value={room.maxChildren ?? ""}
            onChange={(event) => updateField("maxChildren", event.target.value)}
          />
          <Input
            label="Max occupancy"
            type="number"
            min="1"
            value={room.maxOccupancy ?? ""}
            onChange={(event) => updateField("maxOccupancy", event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Check-in time"
            value={room.checkInTime || ""}
            onChange={(event) => updateField("checkInTime", event.target.value)}
            placeholder="14:00"
          />
          <Input
            label="Check-out time"
            value={room.checkOutTime || ""}
            onChange={(event) => updateField("checkOutTime", event.target.value)}
            placeholder="11:00"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={Boolean(room.extraBedAllowed)}
            onChange={(event) => updateField("extraBedAllowed", event.target.checked)}
          />
          Extra bed allowed
        </label>
        {room.extraBedAllowed ? (
          <Input
            label="Extra bed charge"
            type="number"
            min="0"
            step="0.01"
            value={room.extraBedCharge ?? ""}
            onChange={(event) => updateField("extraBedCharge", event.target.value)}
          />
        ) : null}
        <label className="block text-sm text-ink">
          Short description
          <textarea
            value={room.shortDescription || ""}
            onChange={(event) => updateField("shortDescription", event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm"
          />
        </label>
        <AdminMarkdownEditor
          label="Full description"
          value={room.description || ""}
          onChange={(value) => updateField("description", value)}
          rows={8}
        />
        <AdminMarkdownEditor
          label="Room policies"
          value={room.policies || ""}
          onChange={(value) => updateField("policies", value)}
          rows={5}
        />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(room.isActive)}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active on website
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(room.isFeatured)}
              onChange={(event) => updateField("isFeatured", event.target.checked)}
            />
            Featured on home
          </label>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {canUpdate ? (
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        ) : (
          <p className="text-sm text-muted">You have read-only access to this room.</p>
        )}
      </form>

      <div>
        <h2 className="font-display text-2xl text-ink">Amenities & media</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Assign amenities and gallery images used on the public room pages.
        </p>
        <AdminRoomAssetsManager roomId={roomId} room={room} onRoomPatch={patchRoom} />
      </div>

      <div>
        <h2 className="font-display text-2xl text-ink">Inventory & pricing</h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Manage daily availability, seasonal rates, and maintenance blocks for this room type.
        </p>
        <AdminRoomInventoryManager roomId={roomId} room={room} />
      </div>
    </div>
  );
}
