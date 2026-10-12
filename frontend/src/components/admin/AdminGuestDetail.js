"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  deleteAdminGuest,
  getAdminGuest,
  updateAdminGuest,
} from "@/lib/api/admin-guests";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

export default function AdminGuestDetail({ guestId }) {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "guests.update");
  const canDelete = hasPermission(admin, "guests.delete");

  const [guest, setGuest] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAdminGuest(guestId);
        if (!active) return;
        setGuest(data);
        setForm({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          guestType: data.guestType || "",
          notes: data.notes || "",
        });
      } catch {
        if (active) setError("Guest not found or access denied.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [guestId]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canUpdate || !form) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminGuest(guestId, {
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        guestType: form.guestType.trim() || null,
        notes: form.notes.trim() || null,
      });
      setGuest((prev) => ({ ...prev, ...updated, bookings: prev?.bookings || [] }));
      setMessage("Guest profile saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save guest.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canDelete) return;
    if (!window.confirm("Delete this guest profile? Only allowed when they have no bookings.")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await deleteAdminGuest(guestId);
      router.push("/admin/guests");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete guest.");
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading guest" />;
  if (error && !guest) {
    return (
      <ErrorState
        title="Guest unavailable"
        description={error}
        action={<Button href="/admin/guests">Back to guests</Button>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted">
        <Link href="/admin/guests" className="hover:text-accent">Guests</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{guest.fullName}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{guest.fullName}</h1>
          <p className="mt-2 text-sm text-muted">
            {guest.bookingCount ?? guest.bookings?.length ?? 0} booking(s)
            {guest.totalVisits != null ? ` · ${guest.totalVisits} visit(s)` : ""}
            {guest.lastVisitAt ? ` · last visit ${formatDateLabel(guest.lastVisitAt)}` : ""}
          </p>
        </div>
        {canDelete ? (
          <Button type="button" variant="secondary" size="sm" onClick={handleDelete} disabled={saving}>
            Delete guest
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
          <h2 className="font-display text-xl text-ink">Profile</h2>
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            required
            disabled={!canUpdate}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={!canUpdate}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            disabled={!canUpdate}
          />
          <Input
            label="Guest type"
            value={form.guestType}
            onChange={(event) => updateField("guestType", event.target.value)}
            placeholder="VIP, corporate, repeat…"
            disabled={!canUpdate}
          />
          <label className="block text-sm text-ink">
            <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              rows={4}
              disabled={!canUpdate}
              className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink disabled:opacity-60"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
          {canUpdate ? (
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
          ) : (
            <p className="text-sm text-muted">You have read-only access to guest profiles.</p>
          )}
        </form>

        <section className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-xl text-ink">Recent bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Stay</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(guest.bookings || []).length ? guest.bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-line/80">
                    <td className="px-5 py-3 font-medium text-ink">
                      <Link href={`/admin/bookings/${booking.id}`} className="hover:text-accent">
                        {booking.bookingRef}
                      </Link>
                      <p className="text-xs text-muted">
                        {booking.rooms?.[0]?.room?.name || "Room"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {formatDateLabel(booking.checkInDate)} – {formatDateLabel(booking.checkOutDate)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {formatCurrency(booking.totalAmount, booking.currency)}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted">No bookings for this guest.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
