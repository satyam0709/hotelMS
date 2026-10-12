"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import {
  cancelAdminBooking,
  getAdminBooking,
  updateBookingStatus,
} from "@/lib/api/admin-bookings";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { nextStatusesFor } from "@/lib/booking-transitions";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

export default function AdminBookingDetail({ bookingId }) {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "bookings.update");
  const canCancel = hasPermission(admin, "bookings.cancel");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await getAdminBooking(bookingId);
      setBooking(data);
      setStatus(data?.status || "");
    } catch {
      if (!silent) setError("Booking not found or access denied.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminRealtime(
    useCallback((event) => {
      const type = event?.type || "";
      if (!type.startsWith("booking.") && type !== "payment.updated") return;
      if (event.bookingId && event.bookingId !== bookingId) return;
      if (event.bookingRef && booking?.bookingRef && event.bookingRef !== booking.bookingRef) return;
      load({ silent: true });
    }, [bookingId, booking?.bookingRef, load]),
  );

  const allowedNext = useMemo(() => nextStatusesFor(booking?.status), [booking?.status]);
  const selectOptions = useMemo(() => {
    if (!booking?.status) return [];
    const set = new Set([booking.status, ...allowedNext]);
    return [...set];
  }, [booking?.status, allowedNext]);

  async function applyStatus(nextStatus, note) {
    if (!canUpdate) return;
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      const updated = await updateBookingStatus(bookingId, nextStatus, note || statusNote);
      setBooking(updated);
      setStatus(updated.status);
      setActionMessage(`Status updated to ${updated.status}.`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Unable to update status.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleStatusSave() {
    if (!canUpdate) return;
    if (status === booking.status) {
      setActionError("Choose a different status to save.");
      return;
    }
    await applyStatus(status, statusNote);
  }

  async function handleCancel() {
    if (!canCancel) return;
    if (!window.confirm("Cancel this booking and release inventory?")) return;
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      const updated = await cancelAdminBooking(bookingId, statusNote);
      setBooking(updated);
      setStatus(updated.status || "CANCELLED");
      setActionMessage("Booking cancelled.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Unable to cancel booking.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading booking" />;
  if (error || !booking) {
    return (
      <ErrorState
        title="Booking unavailable"
        description={error || "Unknown error"}
        action={<Button href="/admin/bookings">Back to bookings</Button>}
      />
    );
  }

  const rooms = Array.isArray(booking.rooms) ? booking.rooms : [];
  const cancelRequested = Array.isArray(booking.statusHistory)
    ? booking.statusHistory.some((row) => String(row.note || "").toLowerCase().includes("cancel request"))
    : false;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/bookings" className="hover:text-accent">Bookings</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{booking.bookingRef}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{booking.bookingRef}</h1>
          <p className="mt-2 text-sm text-muted">
            Created {formatDateLabel(booking.createdAt)}
          </p>
          {cancelRequested ? (
            <p className="mt-2 text-sm font-medium text-amber-800">
              Guest submitted a cancel request — review and cancel if approved.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
          <Link
            href={`/admin/payments?bookingId=${booking.id}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            View payments
          </Link>
          <Link
            href={`/admin/bookings/${booking.id}/invoice`}
            className="text-sm font-medium text-accent hover:underline"
          >
            View invoice
          </Link>
        </div>
      </div>

      {(canUpdate || canCancel) ? (
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Front desk</h2>
          <p className="mt-1 text-sm text-muted">One-click stay actions (allowed transitions only).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {canUpdate && allowedNext.includes("CONFIRMED") ? (
              <Button type="button" size="sm" disabled={actionBusy} onClick={() => applyStatus("CONFIRMED", "Confirmed by desk")}>
                Confirm
              </Button>
            ) : null}
            {canUpdate && allowedNext.includes("CHECKED_IN") ? (
              <Button type="button" size="sm" disabled={actionBusy} onClick={() => applyStatus("CHECKED_IN", "Checked in")}>
                Check in
              </Button>
            ) : null}
            {canUpdate && allowedNext.includes("CHECKED_OUT") ? (
              <Button type="button" size="sm" disabled={actionBusy} onClick={() => applyStatus("CHECKED_OUT", "Checked out")}>
                Check out
              </Button>
            ) : null}
            {canUpdate && allowedNext.includes("NO_SHOW") ? (
              <Button type="button" size="sm" variant="secondary" disabled={actionBusy} onClick={() => applyStatus("NO_SHOW", "Marked no-show")}>
                No-show
              </Button>
            ) : null}
            {canCancel && allowedNext.includes("CANCELLED") ? (
              <Button type="button" size="sm" variant="secondary" disabled={actionBusy} onClick={handleCancel}>
                Cancel booking
              </Button>
            ) : null}
            {canUpdate && !allowedNext.length ? (
              <p className="text-sm text-muted">No further status changes from {booking.status}.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Guest</h2>
          <p className="mt-3 font-medium text-ink">
            {booking.guest?.id ? (
              <Link href={`/admin/guests/${booking.guest.id}`} className="hover:text-accent">
                {booking.guest.fullName}
              </Link>
            ) : (
              booking.guest?.fullName || "—"
            )}
          </p>
          {booking.guest?.email ? <p className="text-sm text-muted">{booking.guest.email}</p> : null}
          {booking.guest?.phone ? <p className="text-sm text-muted">{booking.guest.phone}</p> : null}
        </section>
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Stay</h2>
          <p className="mt-3 text-sm text-muted">
            {formatDateLabel(booking.checkInDate)} → {formatDateLabel(booking.checkOutDate)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {booking.adults} adults · {booking.children} children · {booking.roomCount} room(s)
          </p>
          <p className="mt-4 text-lg font-semibold text-accent">
            {formatCurrency(booking.totalAmount, booking.currency)}
          </p>
        </section>
      </div>

      {canUpdate ? (
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Update status</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm text-muted">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 block min-w-[12rem] rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink"
              >
                {selectOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-sm text-muted">
              Note (optional)
              <input
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink"
                placeholder="Internal note"
              />
            </label>
            <Button type="button" onClick={handleStatusSave} disabled={actionBusy || status === booking.status}>
              Save status
            </Button>
          </div>
          {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
          {actionMessage ? <p className="mt-3 text-sm text-accent">{actionMessage}</p> : null}
        </section>
      ) : (
        <>
          {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          {actionMessage ? <p className="text-sm text-accent">{actionMessage}</p> : null}
        </>
      )}

      <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
        <h2 className="font-display text-xl text-ink">Rooms</h2>
        <ul className="mt-4 space-y-3">
          {rooms.map((row, index) => (
            <li key={`${row.id || index}`} className="flex justify-between gap-3 rounded-xl border border-line px-4 py-3 text-sm">
              <span>{row.room?.name || "Room"} × {row.quantity}</span>
              <span className="font-medium text-ink">{formatCurrency(row.totalAmount, booking.currency)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
