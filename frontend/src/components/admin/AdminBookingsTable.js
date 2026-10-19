"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminCreateBookingForm from "@/components/admin/AdminCreateBookingForm";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { listAdminBookings } from "@/lib/api/admin-bookings";
import { downloadReportsExport } from "@/lib/api/admin-reports";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

const STATUS_OPTIONS = [
  "",
  "PENDING",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
  "REFUNDED",
  "EXPIRED",
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function paramOr(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

export default function AdminBookingsTable() {
  const { admin } = useAdminAuth();
  const searchParams = useSearchParams();
  const canExport = hasPermission(admin, "reports.export");
  const [search, setSearch] = useState(() => paramOr(searchParams.get("search")));
  const [status, setStatus] = useState(() => paramOr(searchParams.get("status")));
  const [checkInFrom, setCheckInFrom] = useState(() => paramOr(searchParams.get("checkInFrom")));
  const [checkInTo, setCheckInTo] = useState(() => paramOr(searchParams.get("checkInTo")));
  const [checkOutFrom, setCheckOutFrom] = useState(() => paramOr(searchParams.get("checkOutFrom")));
  const [checkOutTo, setCheckOutTo] = useState(() => paramOr(searchParams.get("checkOutTo")));
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listAdminBookings({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: status || undefined,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
        checkOutFrom: checkOutFrom || undefined,
        checkOutTo: checkOutTo || undefined,
      });
      setPayload({
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
        limit: data?.limit ?? 20,
      });
    } catch {
      setError("Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, checkInFrom, checkInTo, checkOutFrom, checkOutTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSearch(paramOr(searchParams.get("search")));
    setStatus(paramOr(searchParams.get("status")));
    setCheckInFrom(paramOr(searchParams.get("checkInFrom")));
    setCheckInTo(paramOr(searchParams.get("checkInTo")));
    setCheckOutFrom(paramOr(searchParams.get("checkOutFrom")));
    setCheckOutTo(paramOr(searchParams.get("checkOutTo")));
    setPage(1);
  }, [searchParams]);

  useAdminRealtime(
    useCallback(() => {
      load({ silent: true });
    }, [load]),
  );

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  function applyPreset(type) {
    const today = todayIso();
    setPage(1);
    if (type === "arrivals") {
      setCheckInFrom(today);
      setCheckInTo(today);
      setCheckOutFrom("");
      setCheckOutTo("");
    } else if (type === "departures") {
      setCheckOutFrom(today);
      setCheckOutTo(today);
      setCheckInFrom("");
      setCheckInTo("");
    } else {
      setCheckInFrom("");
      setCheckInTo("");
      setCheckOutFrom("");
      setCheckOutTo("");
    }
  }

  async function handleExport(format = "csv") {
    if (!canExport) return;
    setExporting(true);
    setExportMessage("");
    setError("");
    try {
      const from = checkInFrom || checkOutFrom || undefined;
      const to = checkInTo || checkOutTo || undefined;
      const result = await downloadReportsExport({
        type: "bookings",
        format,
        from,
        to,
        status: status || undefined,
        search: search.trim() || undefined,
        checkInFrom: checkInFrom || undefined,
        checkInTo: checkInTo || undefined,
        checkOutFrom: checkOutFrom || undefined,
        checkOutTo: checkOutTo || undefined,
      });
      setExportMessage(`Bookings ${format.toUpperCase()} downloaded (${result.filename}).`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Unable to export bookings ${format.toUpperCase()}.`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Bookings</h1>
          <p className="mt-2 text-sm text-muted">Search reservations and filter by stay dates or status.</p>
        </div>
        {canExport ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted font-medium">Export:</span>
            {["csv", "xlsx", "pdf"].map((fmt) => (
              <Button
                key={fmt}
                type="button"
                variant="secondary"
                size="sm"
                disabled={exporting}
                onClick={() => handleExport(fmt)}
                className="uppercase text-xs"
              >
                {fmt}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {exportMessage ? <p className="text-sm text-accent">{exportMessage}</p> : null}

      <AdminCreateBookingForm onCreated={load} />

      <div className="space-y-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("arrivals")}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Today&apos;s arrivals
          </button>
          <button
            type="button"
            onClick={() => applyPreset("departures")}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-accent-soft"
          >
            Today&apos;s departures
          </button>
          <button
            type="button"
            onClick={() => applyPreset("clear")}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-accent-soft"
          >
            Clear dates
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted">Search</label>
            <Input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Reference, guest, email, phone"
              className="mt-1"
            />
          </div>
          <div className="sm:w-48">
            <label className="text-xs font-medium text-muted">Status</label>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="mt-1 h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option || "all"} value={option}>
                  {option ? option.replaceAll("_", " ") : "All statuses"}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Check-in from"
            type="date"
            value={checkInFrom}
            onChange={(e) => {
              setPage(1);
              setCheckInFrom(e.target.value);
            }}
          />
          <Input
            label="Check-in to"
            type="date"
            value={checkInTo}
            onChange={(e) => {
              setPage(1);
              setCheckInTo(e.target.value);
            }}
          />
          <Input
            label="Check-out from"
            type="date"
            value={checkOutFrom}
            onChange={(e) => {
              setPage(1);
              setCheckOutFrom(e.target.value);
            }}
          />
          <Input
            label="Check-out to"
            type="date"
            value={checkOutTo}
            onChange={(e) => {
              setPage(1);
              setCheckOutTo(e.target.value);
            }}
          />
        </div>
      </div>

      {loading ? <LoadingState label="Loading bookings" /> : null}
      {error ? <ErrorState title="Bookings unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.map((booking) => (
                  <tr key={booking.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${booking.id}`} className="font-medium text-accent hover:underline">
                        {booking.bookingRef}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{booking.guest?.fullName || "—"}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateLabel(booking.checkInDate)} – {formatDateLabel(booking.checkOutDate)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {formatCurrency(booking.totalAmount, booking.currency)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                    <td className="px-4 py-3 text-muted">{booking.paymentStatus}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bookings/${booking.id}/invoice`}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!payload.items.length ? (
              <p className="px-4 py-10 text-center text-sm text-muted">No bookings match your filters.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <p>Page {page} of {totalPages} · {payload.total} total</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
