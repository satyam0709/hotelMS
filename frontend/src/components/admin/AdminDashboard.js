"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Bell,
  CalendarDays,
  CircleDollarSign,
  DoorOpen,
  Home,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { getDashboardOverview } from "@/lib/api/admin-dashboard";
import { updateBookingStatus } from "@/lib/api/admin-bookings";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { nextStatusesFor } from "@/lib/booking-transitions";
import { chart, ops } from "@/lib/ops-theme";
import { cn, formatCurrency, formatDateLabel } from "@/lib/utils";

const FALLBACK_POLL_MS = 3 * 60 * 1000;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function nightCount(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) && diff > 0 ? diff : 1;
}

function demandStyles(demand) {
  if (demand === "HIGH DEMAND") return "bg-[#ffe4e6] text-[#9f1239]";
  if (demand === "OPTIMAL") return "bg-[#dcfce7] text-[#14532d]";
  if (demand === "MAINTENANCE") return "bg-[#ffedd5] text-[#9a3412]";
  return "bg-[#ccfbf1] text-[#115e59]";
}

/** Build sparkline values from trafficByDay (checkIns) or weeklyTrend room snapshots. */
function sparkSeries(data, kind) {
  const traffic = Array.isArray(data?.trafficByDay) ? data.trafficByDay : [];
  const trend = Array.isArray(data?.weeklyTrend) ? data.weeklyTrend : [];
  if (traffic.length) {
    if (kind === "occupied") return traffic.map((row) => Number(row.occupied ?? row.checkIns ?? 0));
    if (kind === "available") return traffic.map((row) => Number(row.available ?? row.checkOuts ?? 0));
    if (kind === "total") {
      return traffic.map((row) => Number(row.occupied ?? row.checkIns ?? 0) + Number(row.available ?? row.checkOuts ?? 0));
    }
    if (kind === "blocked") return traffic.map((row) => Number(row.blocked ?? data?.rooms?.blocked ?? 0));
  }
  if (trend.length) {
    if (kind === "occupied") return trend.map((row) => Number(row.occupied ?? 0));
    if (kind === "available") return trend.map((row) => Number(row.available ?? 0));
    if (kind === "total") {
      return trend.map((row) => Number(row.occupied ?? 0) + Number(row.available ?? 0));
    }
    if (kind === "blocked") return trend.map(() => Number(data?.rooms?.blocked ?? 0));
  }
  const fallback = Number(
    kind === "occupied" ? data?.rooms?.occupied
      : kind === "available" ? data?.rooms?.available
        : kind === "blocked" ? data?.rooms?.blocked
          : data?.rooms?.totalUnits,
  ) || 0;
  return [fallback];
}

function sparkPoints(series, width = 120, height = 28, pad = 2) {
  if (!series?.length) return "";
  const max = Math.max(...series.map(Number), 1);
  const min = Math.min(...series.map(Number), 0);
  const range = max - min || 1;
  return series.map((value, index) => {
    const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
    const y = height - pad - ((Number(value) - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");
}

function deskQuickAction(booking) {
  const next = nextStatusesFor(booking.status);
  if (next.includes("CHECKED_IN")) {
    return { label: "Check in", status: "CHECKED_IN" };
  }
  if (next.includes("CHECKED_OUT")) {
    return { label: "Check out", status: "CHECKED_OUT" };
  }
  if (next.includes("NO_SHOW") && booking.status === "CONFIRMED") {
    return { label: "No-show", status: "NO_SHOW" };
  }
  return null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [from, setFrom] = useState(() => daysAgoIso(6));
  const [to, setTo] = useState(() => todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const [deskBusyId, setDeskBusyId] = useState("");
  const [deskError, setDeskError] = useState("");
  const canUpdateBooking = hasPermission(admin, "bookings.update");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const payload = await getDashboardOverview({ from, to });
      setData(payload);
      setLastSynced(new Date());
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
      setError(err?.message || "Unable to load operations dashboard. Confirm you are signed in and the API is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const { connected: realtimeConnected } = useAdminRealtime(
    useCallback(() => {
      load({ silent: true });
    }, [load]),
    { enabled: true },
  );

  // Slow fallback only while SSE is disconnected
  useEffect(() => {
    if (realtimeConnected) return undefined;
    const timer = window.setInterval(() => load({ silent: true }), FALLBACK_POLL_MS);
    return () => window.clearInterval(timer);
  }, [load, realtimeConnected]);

  const filteredBookings = useMemo(() => {
    const rows = data?.recentBookings || [];
    const q = search.trim().toLowerCase();
    return rows.filter((booking) => {
      if (tab === "arrivals") {
        const today = data?.today || todayIso();
        const isScheduledToday = String(booking.checkInDate).slice(0, 10) === today;
        const isCheckedInToday = booking.status === "CHECKED_IN" && String(booking.updatedAt || booking.checkInDate).slice(0, 10) === today;
        if (!isScheduledToday && !isCheckedInToday) return false;
      } else if (tab === "pending") {
        if (!["PENDING", "PENDING_PAYMENT"].includes(booking.status) && booking.paymentStatus !== "PENDING") return false;
      } else if (tab === "checked_in") {
        if (booking.status !== "CHECKED_IN") return false;
      }
      if (!q) return true;
      const hay = [
        booking.bookingRef,
        booking.guest?.fullName,
        booking.guest?.email,
        booking.guest?.phone,
        booking.roomName,
        booking.roomCode,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [data, tab, search]);

  const tabCounts = useMemo(() => {
    const rows = data?.recentBookings || [];
    const today = data?.today || todayIso();
    return {
      all: rows.length,
      arrivals: rows.filter((b) => {
        const isScheduledToday = String(b.checkInDate).slice(0, 10) === today;
        const isCheckedInToday = b.status === "CHECKED_IN" && String(b.updatedAt || b.checkInDate).slice(0, 10) === today;
        return isScheduledToday || isCheckedInToday;
      }).length,
      pending: rows.filter((b) => ["PENDING", "PENDING_PAYMENT"].includes(b.status) || b.paymentStatus === "PENDING").length,
      checked_in: rows.filter((b) => b.status === "CHECKED_IN").length,
    };
  }, [data]);

  if (loading && !data) {
    return <LoadingState label="Loading operations HQ" className="min-h-48" />;
  }

  if (error && !data) {
    return <ErrorState title="Dashboard unavailable" description={error} action={<Button onClick={() => load()}>Retry</Button>} />;
  }

  const currency = data?.revenue?.currency || "INR";
  const propertyName = data?.property?.name || "HotelMS";
  const canCreateBooking = hasPermission(admin, "bookings.create");
  const canBookings = hasPermission(admin, "bookings.read");
  const canRooms = hasPermission(admin, "rooms.read");
  const canPayments = hasPermission(admin, "payments.read");
  const canReports = hasPermission(admin, "reports.read");
  const canActivity = hasPermission(admin, "activity.read");
  const canInquiries = hasPermission(admin, "inquiries.read");
  const canCategories = hasPermission(admin, "room_categories.read");
  const today = data?.today || todayIso();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">Central operations</p>
          <h1 className="mt-1 font-display text-3xl text-ink md:text-4xl">{propertyName}</h1>
          <p className="mt-2 text-sm text-muted">
            {admin?.name ? `${admin.name} · ` : null}
            Live ops for {formatDateLabel(data?.today || todayIso())}
            {lastSynced ? ` · synced ${lastSynced.toLocaleTimeString()}` : null}
            {refreshing ? " · refreshing…" : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#14532d]">
            <Home className="size-3.5" />
            Occupancy {data?.rooms?.occupancyPercent ?? data?.kpis?.occupancyPercent ?? 0}%
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={() => load({ silent: true })} disabled={refreshing}>
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
          {canCreateBooking ? (
            <Button href="/admin/bookings" size="sm" variant="bronze">
              + New booking
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft lg:flex-row lg:items-end">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => { setFrom(todayIso()); setTo(todayIso()); }}>Day</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => { setFrom(daysAgoIso(6)); setTo(todayIso()); }}>Week</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => { setFrom(daysAgoIso(29)); setTo(todayIso()); }}>Month</Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* KPI strip — solid ops tiles */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          tone="blue"
          icon={Bell}
          label="Check-ins today"
          value={data?.kpis?.checkInsToday ?? "—"}
          hint="Arrivals scheduled today"
          href={canBookings ? `/admin/bookings?checkInFrom=${today}&checkInTo=${today}` : undefined}
        />
        <KpiCard
          tone="teal"
          icon={DoorOpen}
          label="Check-outs today"
          value={data?.kpis?.checkOutsToday ?? "—"}
          hint="Departures scheduled today"
          href={canBookings ? `/admin/bookings?checkOutFrom=${today}&checkOutTo=${today}` : undefined}
        />
        <KpiCard
          tone="green"
          icon={Home}
          label="Occupancy rate"
          value={`${data?.kpis?.occupancyPercent ?? data?.rooms?.occupancyPercent ?? 0}%`}
          hint={`${data?.rooms?.occupied ?? 0} occupied · ${data?.rooms?.available ?? 0} free`}
          href={canRooms ? "/admin/rooms" : undefined}
        />
        <KpiCard
          tone="bronze"
          icon={CircleDollarSign}
          label="Revenue period"
          value={data?.kpis?.revenuePeriod != null ? formatCurrency(data.kpis.revenuePeriod, currency) : "—"}
          hint={data?.revenue ? `${formatCurrency(data.revenue.gross, currency)} gross` : "Payments permission required"}
          href={canPayments ? "/admin/payments" : canReports ? "/admin/reports" : undefined}
        />
      </section>

      {/* Booking summary */}
      {data?.bookingSummary ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            label="Total bookings"
            value={data.bookingSummary.total}
            href={canBookings ? "/admin/bookings" : undefined}
          />
          <MiniMetric
            label="Confirmed / in-house"
            value={data.bookingSummary.confirmed}
            tone="emerald"
            href={canBookings ? "/admin/bookings?status=CONFIRMED" : undefined}
          />
          <MiniMetric
            label="Pending"
            value={data.bookingSummary.pending}
            tone="amber"
            href={canBookings ? "/admin/bookings?status=PENDING" : undefined}
          />
          <MiniMetric
            label="Cancelled"
            value={data.bookingSummary.cancelled}
            tone="rose"
            href={canBookings ? "/admin/bookings?status=CANCELLED" : undefined}
          />
        </section>
      ) : null}

      {/* Room status */}
      {data?.rooms ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SparkMetric
            label="Room types"
            value={data.rooms.roomCount ?? data.rooms.totalUnits}
            color={chart.sparkTotal}
            icon={BedDouble}
            series={sparkSeries(data, "total")}
            href={canRooms ? "/admin/rooms" : undefined}
            hint={`${data.rooms.totalUnits} total inventory units`}
          />
          <SparkMetric
            label="Available"
            value={data.rooms.available}
            color={chart.sparkAvailable}
            icon={Home}
            series={sparkSeries(data, "available")}
            href={canRooms ? "/admin/rooms" : undefined}
          />
          <SparkMetric
            label="Occupied"
            value={data.rooms.occupied}
            color={chart.sparkOccupied}
            icon={CalendarDays}
            series={sparkSeries(data, "occupied")}
            href={canBookings ? "/admin/bookings?status=CHECKED_IN" : undefined}
          />
          <SparkMetric
            label="Blocked / OOO"
            value={data.rooms.blocked}
            color={chart.sparkBlocked}
            icon={Wrench}
            series={sparkSeries(data, "blocked")}
            href={canRooms ? "/admin/rooms" : undefined}
          />
        </section>
      ) : null}

      {/* Charts + activity */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Occupancy overview"
          href={canReports ? "/admin/reports" : canRooms ? "/admin/rooms" : undefined}
        >
          <OccupancyDonut breakdown={data?.occupancyBreakdown} />
        </Panel>
        <Panel
          title="Check-in vs check-out"
          href={canBookings ? `/admin/bookings?checkInFrom=${from}&checkInTo=${to}` : undefined}
        >
          <TrafficBars rows={data?.trafficByDay || []} />
        </Panel>
        <Panel
          title="Latest activity"
          href={canActivity ? "/admin/activity" : undefined}
          action={canActivity ? <Link href="/admin/activity" className="text-sm text-accent hover:underline">View all</Link> : null}
        >
          <ActivityFeed activity={data?.activity || []} inquiries={data?.inquiries || []} />
        </Panel>
      </section>

      {/* Category matrix */}
      {data?.categories?.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">Room category availability</h2>
              <p className="mt-1 text-sm text-muted">Live inventory by category for today.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreateBooking ? <Button href="/admin/bookings" size="sm" variant="bronze">New walk-in</Button> : null}
              {hasPermission(admin, "rooms.update") ? <Button href="/admin/rooms" size="sm" variant="secondary">Block / rates</Button> : null}
              {hasPermission(admin, "room_categories.read") ? <Button href="/admin/room-categories" size="sm" variant="secondary">Categories</Button> : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.categories.map((cat) => {
              const catHref = canCategories
                ? "/admin/room-categories"
                : canRooms
                  ? "/admin/rooms"
                  : undefined;
              const body = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg text-ink">{cat.name}</h3>
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide", demandStyles(cat.demand))}>
                      {cat.demand}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-ink">
                    {cat.occupied} <span className="text-base font-normal text-muted">/ {cat.total}</span>
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: chart.track }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${Math.min(100, cat.occupancyPercent)}%`,
                        background: cat.demand === "HIGH DEMAND" ? ops.rose : ops.teal,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {cat.occupancyPercent}% occupancy · {formatCurrency(cat.avgRate, currency)}/night avg
                  </p>
                  <p className="mt-1 text-xs text-muted">{cat.available} available · {cat.blocked} blocked</p>
                  {catHref ? (
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                      Open <ArrowRight className="size-3.5" />
                    </p>
                  ) : null}
                </>
              );
              const className = cn(
                "rounded-2xl border border-line bg-elevated p-5 shadow-soft transition duration-200",
                catHref && "cursor-pointer hover:-translate-y-0.5 hover:border-brand-green/35 hover:shadow-[0_14px_36px_rgba(44,103,0,0.1)]"
              );
              return catHref ? (
                <Link key={cat.id} href={catHref} className={className}>
                  {body}
                </Link>
              ) : (
                <article key={cat.id} className={className}>
                  {body}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Reservations table */}
      {data?.permissions?.bookings ? (
        <section className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-2xl text-ink">Reservations & guest folios</h2>
              <p className="text-sm text-muted">Recent bookings with quick actions.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search guest / ref"
                  className="h-10 rounded-full border border-line bg-white pl-9 pr-3 text-sm"
                />
              </label>
              <Button href="/admin/bookings" size="sm" variant="secondary">Open bookings</Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
            {[
              ["all", `All (${tabCounts.all})`],
              ["arrivals", `Today's check-ins (${tabCounts.arrivals})`],
              ["pending", `Pending (${tabCounts.pending})`],
              ["checked_in", `Checked-in (${tabCounts.checked_in})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                  tab === key
                    ? "bg-[linear-gradient(135deg,#9a6b2f,#b8860b)] text-white shadow-sm"
                    : "bg-[#f5f4ef] text-ink hover:bg-[#ebe8de]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Guest</th>
                  <th className="px-5 py-3">Room</th>
                  <th className="px-5 py-3">Stay</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length ? filteredBookings.map((booking) => {
                  const quick = deskQuickAction(booking);
                  return (
                    <tr
                      key={booking.id}
                      className="border-t border-line/80 cursor-pointer transition-colors hover:bg-[#f7f5ef]/80"
                      onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="font-medium text-ink hover:text-accent"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {booking.bookingRef}
                        </Link>
                        <div className="mt-1"><StatusBadge status={booking.status} /></div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{booking.guest?.fullName || "—"}</p>
                        <p className="text-xs text-muted">{booking.guest?.email || booking.guest?.phone || "No contact"}</p>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {booking.roomName || "—"}
                        {booking.roomCode ? <span className="block text-xs">{booking.roomCode}</span> : null}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {formatDateLabel(booking.checkInDate)} → {formatDateLabel(booking.checkOutDate)}
                        <span className="block text-xs">{nightCount(booking.checkInDate, booking.checkOutDate)} night(s)</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                        <div className="mt-1"><StatusBadge status={booking.paymentStatus} /></div>
                      </td>
                      <td className="px-5 py-3" onClick={(event) => event.stopPropagation()}>
                        <div className="flex flex-wrap gap-2">
                          {canUpdateBooking && quick ? (
                            <Button
                              type="button"
                              size="sm"
                              disabled={deskBusyId === booking.id}
                              onClick={async () => {
                                setDeskError("");
                                setDeskBusyId(booking.id);
                                try {
                                  await updateBookingStatus(booking.id, quick.status, quick.label);
                                  await load({ silent: true });
                                } catch (err) {
                                  setDeskError(err instanceof ApiError ? err.message : "Unable to update booking.");
                                } finally {
                                  setDeskBusyId("");
                                }
                              }}
                            >
                              {deskBusyId === booking.id ? "…" : quick.label}
                            </Button>
                          ) : null}
                          <Button href={`/admin/bookings/${booking.id}`} size="sm" variant="secondary">
                            Folio
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">No bookings match this view.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {deskError ? <p className="px-5 py-3 text-sm text-red-600">{deskError}</p> : null}
          </div>
        </section>
      ) : null}

      {/* Bottom: inquiries + weekly trend */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Guest requests & inquiries"
          href={canInquiries ? "/admin/inquiries" : undefined}
          action={canInquiries ? <Link href="/admin/inquiries" className="text-sm text-accent hover:underline">Inbox</Link> : null}
        >
          <ul className="divide-y divide-line/80">
            {(data?.inquiries || []).length ? data.inquiries.map((item) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.subject || item.type}</p>
                  <p className="text-xs text-muted">{item.name} · {formatDateLabel(item.createdAt)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{item.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={item.status} />
                  <Button href={`/admin/inquiries/${item.id}`} size="sm" variant="secondary">
                    Acknowledge
                  </Button>
                </div>
              </li>
            )) : (
              <li className="py-8 text-center text-sm text-muted">No open guest requests.</li>
            )}
          </ul>
        </Panel>

        <Panel
          title="Weekly yield & occupancy"
          href={canReports ? "/admin/reports" : undefined}
          action={canReports ? <Link href="/admin/reports" className="text-sm text-accent hover:underline">Full reports</Link> : null}
        >
          <YieldTrend rows={data?.weeklyTrend || []} currency={currency} />
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, action, children, href }) {
  const router = useRouter();
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-elevated p-5 shadow-soft transition duration-200",
        href && "cursor-pointer hover:-translate-y-0.5 hover:border-brand-green/35 hover:shadow-[0_14px_36px_rgba(44,103,0,0.1)]"
      )}
      onClick={(event) => {
        if (!href) return;
        if (event.target.closest("a, button, input, select, textarea, label")) return;
        router.push(href);
      }}
      onKeyDown={(event) => {
        if (!href) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        router.push(href);
      }}
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        <div className="flex items-center gap-3">
          {action}
          {href ? <ArrowRight className="size-4 text-muted" aria-hidden /> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function KpiCard({ tone, icon: Icon, label, value, hint, href }) {
  const tones = {
    blue: { bg: ops.blue, soft: "rgba(255,255,255,0.16)" },
    teal: { bg: ops.teal, soft: "rgba(255,255,255,0.16)" },
    green: { bg: ops.green, soft: "rgba(255,255,255,0.16)" },
    bronze: { bg: ops.bronze, soft: "rgba(255,255,255,0.16)" },
  };
  const palette = tones[tone] || tones.blue;
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-white/75">{label}</p>
        <p className="mt-2 font-display text-3xl text-white">{value}</p>
        {hint ? <p className="mt-2 text-sm text-white/80">{hint}</p> : null}
        {href ? (
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
            Open <ArrowRight className="size-3.5" />
          </p>
        ) : null}
      </div>
      <span className="rounded-xl p-2.5" style={{ background: palette.soft }}>
        <Icon className="size-5 text-white" />
      </span>
    </div>
  );
  const className = "rounded-2xl p-5 text-white shadow-[0_14px_36px_rgba(28,25,23,0.14)] transition-transform duration-300 hover:-translate-y-0.5";
  if (href) {
    return (
      <Link href={href} className={cn(className, "block cursor-pointer")} style={{ background: palette.bg }}>
        {body}
      </Link>
    );
  }
  return (
    <article className={className} style={{ background: palette.bg }}>
      {body}
    </article>
  );
}

function MiniMetric({ label, value, tone = "ink", href }) {
  const tones = {
    ink: "text-ink",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  };
  const body = (
    <>
      <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className={cn("mt-1 font-display text-2xl", tones[tone])}>{value}</p>
      {href ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent">
          Open <ArrowRight className="size-3.5" />
        </p>
      ) : null}
    </>
  );
  const className = cn(
    "rounded-2xl border border-line bg-elevated px-4 py-4 shadow-soft transition duration-200",
    href && "cursor-pointer hover:-translate-y-0.5 hover:border-brand-green/35 hover:shadow-[0_12px_28px_rgba(44,103,0,0.08)]"
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function SparkMetric({ label, value, color, icon: Icon, series = [], href, hint }) {
  const points = sparkPoints(series);
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
        <Icon className="size-4 text-muted" />
      </div>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <svg viewBox="0 0 120 28" className="mt-3 h-7 w-full" aria-hidden>
        {points ? (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        ) : null}
      </svg>
    </>
  );
  const className = cn(
    "rounded-2xl border border-line bg-elevated p-4 shadow-soft transition duration-200",
    href && "cursor-pointer hover:-translate-y-0.5 hover:border-brand-green/35 hover:shadow-[0_12px_28px_rgba(44,103,0,0.08)]"
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function OccupancyDonut({ breakdown }) {
  const occupied = breakdown?.occupied || 0;
  const available = breakdown?.available || 0;
  const blocked = breakdown?.blocked || 0;
  const total = occupied + available + blocked || 1;
  const segments = [
    { label: "Occupied", value: occupied, color: chart.occupied },
    { label: "Available", value: available, color: chart.available },
    { label: "Out of order", value: blocked, color: chart.blocked },
  ];
  let offset = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 120 120" className="size-40 shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={chart.track} strokeWidth="16" />
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          );
          offset += length;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" className="fill-ink text-[16px] font-bold">
          {Math.round((occupied / total) * 100)}%
        </text>
        <text x="60" y="74" textAnchor="middle" className="fill-muted text-[9px]">occupied</text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-muted">
              <span className="size-2.5 rounded-sm" style={{ background: segment.color }} />
              {segment.label}
            </span>
            <span className="font-medium text-ink">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrafficBars({ rows }) {
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-muted">No traffic data for this range.</p>;
  }
  const max = Math.max(1, ...rows.flatMap((row) => [row.checkIns, row.checkOuts]));
  return (
    <div className="space-y-3">
      <div className="flex h-40 items-end gap-2">
        {rows.map((row) => (
          <div key={row.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-[38%] rounded-t-md transition-[height] duration-500"
                style={{
                  height: `${Math.max(row.checkIns ? 6 : 0, (row.checkIns / max) * 100)}%`,
                  background: chart.checkIn,
                }}
                title={`${row.checkIns} check-ins`}
              />
              <div
                className="w-[38%] rounded-t-md transition-[height] duration-500"
                style={{
                  height: `${Math.max(row.checkOuts ? 6 : 0, (row.checkOuts / max) * 100)}%`,
                  background: chart.checkOut,
                }}
                title={`${row.checkOuts} check-outs`}
              />
            </div>
            <span className="text-[10px] text-muted">{row.date.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: chart.checkIn }} /> Check-ins
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: chart.checkOut }} /> Check-outs
        </span>
      </div>
    </div>
  );
}

function ActivityFeed({ activity, inquiries }) {
  const items = [
    ...activity.map((row) => ({
      id: `a-${row.id}`,
      title: `${row.module} · ${row.action}`,
      meta: row.user?.name || row.entityType || "System",
      at: row.createdAt,
      tone: "emerald",
    })),
    ...inquiries.slice(0, 4).map((row) => ({
      id: `i-${row.id}`,
      title: row.subject || `${row.type} inquiry`,
      meta: row.name,
      at: row.createdAt,
      tone: "sky",
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  if (!items.length) {
    return <p className="py-10 text-center text-sm text-muted">No recent activity yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <span className={cn(
            "mt-1 size-2.5 shrink-0 rounded-full",
            item.tone === "sky" ? "bg-sky-500" : "bg-emerald-500"
          )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium text-ink">{item.title}</p>
              <span className="shrink-0 text-[11px] text-muted">
                {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-xs text-muted">{item.meta}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function YieldTrend({ rows, currency }) {
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-muted">No trend data for this range.</p>;
  }
  const maxRevenue = Math.max(1, ...rows.map((row) => row.revenue || 0));
  const maxOcc = Math.max(1, ...rows.map((row) => row.occupancyPercent || 0));
  const last = rows[rows.length - 1];
  const first = rows[0];
  const occDelta = Number(((last?.occupancyPercent || 0) - (first?.occupancyPercent || 0)).toFixed(1));

  const width = 320;
  const height = 140;
  const padX = 12;
  const padY = 12;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const linePoints = rows.map((row, index) => {
    const x = padX + (rows.length === 1 ? plotW / 2 : (index / (rows.length - 1)) * plotW);
    const y = padY + plotH - ((Number(row.occupancyPercent) || 0) / maxOcc) * plotH;
    return { x, y, row };
  });
  const linePath = linePoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = linePoints.length
    ? `${linePath} L${linePoints[linePoints.length - 1].x},${padY + plotH} L${linePoints[0].x},${padY + plotH} Z`
    : "";

  return (
    <div className="space-y-4">
      <div className="relative h-44">
        <div className="absolute inset-0 flex items-end gap-2 px-1 pb-5">
          {rows.map((row) => (
            <div key={row.date} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-[62%] rounded-t-md"
                style={{
                  height: `${Math.max(row.revenue ? 8 : 0, (row.revenue / maxRevenue) * 100)}%`,
                  background: `${ops.green}cc`,
                  minHeight: row.revenue ? 4 : 0,
                }}
                title={`Revenue ${formatCurrency(row.revenue, currency)}`}
              />
              <span className="text-[10px] text-muted">{row.date.slice(5)}</span>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-x-0 top-0 h-[78%] w-full" preserveAspectRatio="none" aria-hidden>
          <path d={areaPath} fill={`${ops.bronze}22`} />
          <path d={linePath} fill="none" stroke={chart.occupancyLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {linePoints.map((point) => (
            <circle
              key={point.row.date}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill={ops.green}
              stroke="#fff"
              strokeWidth="1.5"
            >
              <title>{`${point.row.occupancyPercent}% occupancy`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: ops.green }} /> Daily occupancy bars
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: chart.occupancyLine }} /> Occupancy trend
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted">
          Occupancy pacing{" "}
          <span className={cn("inline-flex items-center gap-1 font-semibold", occDelta >= 0 ? "text-emerald-700" : "text-rose-700")}>
            {occDelta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {occDelta >= 0 ? "+" : ""}{occDelta}% vs range start
          </span>
        </p>
        <p className="font-medium text-ink">
          Latest day {formatCurrency(last?.revenue || 0, currency)}
        </p>
      </div>
    </div>
  );
}
