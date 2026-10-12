"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createAdminBooking } from "@/lib/api/admin-bookings";
import { listAdminRooms } from "@/lib/api/admin-rooms";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatCurrency } from "@/lib/utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso, days) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const EMPTY = {
  checkIn: todayIso(),
  checkOut: addDaysIso(todayIso(), 2),
  fullName: "",
  email: "",
  phone: "",
  roomId: "",
  quantity: "1",
  adults: "2",
  children: "0",
  extraBeds: "0",
  paymentMethod: "PAY_AT_HOTEL",
  specialRequests: "",
  confirmImmediately: true,
};

export default function AdminCreateBookingForm({ onCreated }) {
  const { admin } = useAdminAuth();
  const router = useRouter();
  const canCreate = hasPermission(admin, "bookings.create");
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    listAdminRooms({ page: 1, limit: 100 })
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data?.items) ? data.items.filter((room) => room.isActive !== false) : [];
        setRooms(items);
        setForm((prev) => ({
          ...prev,
          roomId: prev.roomId || items[0]?.id || "",
        }));
      })
      .catch(() => {
        if (active) setRooms([]);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === form.roomId),
    [rooms, form.roomId]
  );

  if (!canCreate) return null;

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!form.email.trim() || !form.phone.trim()) {
        throw new Error("Guest email and phone are both required.");
      }
      const payload = {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guest: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        rooms: [
          {
            roomId: form.roomId,
            quantity: Number(form.quantity),
            adults: Number(form.adults),
            children: Number(form.children),
            extraBeds: Number(form.extraBeds || 0),
          },
        ],
        paymentMethod: form.paymentMethod,
        specialRequests: form.specialRequests.trim() || null,
        confirmImmediately: Boolean(form.confirmImmediately),
      };
      const booking = await createAdminBooking(payload);
      setForm(EMPTY);
      setOpen(false);
      if (onCreated) await onCreated(booking);
      if (booking?.id) router.push(`/admin/bookings/${booking.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-elevated shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-xl text-ink">Desk booking</h2>
          <p className="text-sm text-muted">Create a walk-in / phone reservation.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "New booking"}
        </Button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Check-in" type="date" value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} required />
            <Input label="Check-out" type="date" value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} required />
            <label className="flex flex-col gap-1.5 text-xs font-medium tracking-[0.08em] text-muted uppercase sm:col-span-2">
              Room
              <select
                value={form.roomId}
                onChange={(e) => update("roomId", e.target.value)}
                required
                className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm font-normal normal-case tracking-normal text-ink"
              >
                <option value="">Select room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} · {formatCurrency(room.basePrice, room.currency)} · inv {room.totalInventory ?? "—"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedRoom ? (
            <p className="text-xs text-muted">
              Selected: {selectedRoom.name}
              {selectedRoom.category?.name ? ` · ${selectedRoom.category.name}` : ""}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} required />
            <Input label="Adults" type="number" min="1" value={form.adults} onChange={(e) => update("adults", e.target.value)} required />
            <Input label="Children" type="number" min="0" value={form.children} onChange={(e) => update("children", e.target.value)} />
            <Input label="Extra beds" type="number" min="0" value={form.extraBeds} onChange={(e) => update("extraBeds", e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Guest name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
            <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <p className="text-xs text-muted">Guest email and phone are both required.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium tracking-[0.08em] text-muted uppercase">
              Payment method
              <select
                value={form.paymentMethod}
                onChange={(e) => update("paymentMethod", e.target.value)}
                className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm font-normal normal-case tracking-normal text-ink"
              >
                <option value="PAY_AT_HOTEL">Pay at hotel</option>
                <option value="ONLINE">Online</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.confirmImmediately}
                onChange={(e) => update("confirmImmediately", e.target.checked)}
              />
              Confirm immediately
            </label>
          </div>

          <label className="block text-sm text-ink">
            Special requests
            <textarea
              value={form.specialRequests}
              onChange={(e) => update("specialRequests", e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={busy || !form.roomId}>
            {busy ? "Creating…" : "Create booking"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
