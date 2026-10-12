"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { downloadReportsExport, getReportsOverview } from "@/lib/api/admin-reports";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { formatCurrency } from "@/lib/utils";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function statusRows(map = {}) {
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

const EXPORT_TYPES = [
  { type: "summary", label: "Summary CSV" },
  { type: "bookings", label: "Bookings CSV (created)" },
  { type: "bookings-stay", label: "Bookings CSV (stay dates)" },
  { type: "payments", label: "Payments CSV" },
  { type: "inquiries", label: "Inquiries CSV" },
];

export default function AdminReportsOverview() {
  const { admin } = useAdminAuth();
  const canExport = hasPermission(admin, "reports.export");
  const initialFrom = useMemo(() => daysAgoIso(29), []);
  const initialTo = useMemo(() => todayIso(), []);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setData(await getReportsOverview({ from, to }));
    } catch {
      if (!silent) setError("Unable to load reports overview.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminRealtime(
    useCallback((event) => {
      const type = event?.type || "";
      if (!type.startsWith("booking.") && type !== "payment.updated" && !type.startsWith("inquiry.")) return;
      load({ silent: true });
    }, [load]),
  );

  async function handleExport(type) {
    if (!canExport) return;
    setExporting(type);
    setError("");
    setMessage("");
    try {
      const result = await downloadReportsExport({ type, from, to });
      setMessage(`Downloaded ${result.filename}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to export CSV.");
    } finally {
      setExporting("");
    }
  }

  const currency = data?.revenue?.currency || "INR";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Reports</h1>
          <p className="mt-2 text-sm text-muted">
            Management overview for bookings, revenue, inquiries, and newsletter growth.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft sm:flex-row sm:items-end">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {canExport ? (
        <section className="rounded-2xl border border-line bg-elevated p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-ink">CSV export</h2>
              <p className="mt-1 text-sm text-muted">
                Downloads use the selected date range. Max 5,000 rows per detail export.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXPORT_TYPES.map((item) => (
                <Button
                  key={item.type}
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={Boolean(exporting)}
                  onClick={() => handleExport(item.type)}
                >
                  {exporting === item.type ? "Exporting…" : item.label}
                </Button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {loading ? <LoadingState label="Loading reports" /> : null}
      {error ? <ErrorState title="Reports unavailable" description={error} /> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !error && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard
              label="Net revenue"
              value={formatCurrency(data.revenue.net, currency)}
              hint={`${formatCurrency(data.revenue.gross, currency)} gross - ${formatCurrency(data.revenue.refunds, currency)} refunds`}
            />
            <AdminStatCard
              label="Occupancy"
              value={`${data.occupancy?.ratePercent ?? 0}%`}
              hint={`${data.occupancy?.occupiedRoomNights ?? 0} / ${data.occupancy?.availableRoomNights ?? 0} room nights`}
            />
            <AdminStatCard
              label="Bookings"
              value={data.bookings.total}
              hint={`ABV ${formatCurrency(data.bookings.averageBookingValue, currency)}`}
            />
            <AdminStatCard
              label="Arrivals / Departures"
              value={`${data.bookings.arrivals} / ${data.bookings.departures}`}
              hint="Within selected date range"
            />
            <AdminStatCard
              label="Inquiries"
              value={data.inquiries.total}
              hint={`${data.newsletter.subscribed} newsletter subscribers`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SeriesCard
              title="Revenue by day"
              rows={(data.revenue.series || []).map((row) => [row.date, formatCurrency(row.amount, currency)])}
            />
            <SeriesCard
              title="Occupied rooms by day"
              rows={(data.occupancy?.series || []).map((row) => [row.date, row.occupied])}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <BreakdownCard title="Booking statuses" rows={statusRows(data.bookings.byStatus)} />
            <BreakdownCard title="Payment statuses" rows={statusRows(data.revenue.byPaymentStatus)} />
            <BreakdownCard title="Inquiry statuses" rows={statusRows(data.inquiries.byStatus)} />
          </div>

          <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl text-ink">Operational notes</h2>
            <div className="mt-4 grid gap-4 text-sm text-muted sm:grid-cols-3">
              <p>
                <span className="block text-xs font-semibold tracking-[0.14em] text-muted uppercase">Room nights</span>
                <span className="mt-1 block text-lg font-semibold text-ink">{data.bookings.roomNights}</span>
              </p>
              <p>
                <span className="block text-xs font-semibold tracking-[0.14em] text-muted uppercase">Booking value</span>
                <span className="mt-1 block text-lg font-semibold text-ink">
                  {formatCurrency(data.bookings.valueOnBookings, currency)}
                </span>
              </p>
              <p>
                <span className="block text-xs font-semibold tracking-[0.14em] text-muted uppercase">Pending payments</span>
                <span className="mt-1 block text-lg font-semibold text-ink">{data.revenue.pendingPaymentCount}</span>
              </p>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function BreakdownCard({ title, rows }) {
  return (
    <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.length ? rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2 text-sm">
            <span className="text-muted">{label.replaceAll("_", " ")}</span>
            <span className="font-medium text-ink">{value}</span>
          </div>
        )) : (
          <p className="text-sm text-muted">No data in this range.</p>
        )}
      </div>
    </section>
  );
}

function SeriesCard({ title, rows }) {
  const preview = rows.slice(-14);
  return (
    <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <p className="mt-1 text-xs text-muted">Last {preview.length || 0} day(s) in range</p>
      <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
        {preview.length ? preview.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-line/70 px-3 py-2 text-sm">
            <span className="text-muted">{label}</span>
            <span className="font-medium text-ink">{value}</span>
          </div>
        )) : (
          <p className="text-sm text-muted">No series data in this range.</p>
        )}
      </div>
    </section>
  );
}
