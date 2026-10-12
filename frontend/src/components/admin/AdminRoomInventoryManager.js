"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/admin/StatusBadge";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  createRoomBlock,
  createRoomRate,
  deleteRoomBlock,
  deleteRoomRate,
  listRoomAvailability,
  listRoomBlocks,
  listRoomRates,
  upsertRoomAvailability,
} from "@/lib/api/admin-rooms";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

const RATE_TYPES = ["SEASONAL", "SPECIAL", "HOLIDAY", "CUSTOM"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso, days) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function eachDate(from, to) {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(cursor.valueOf()) || Number.isNaN(end.valueOf()) || cursor > end) return dates;
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function dateKey(value) {
  return String(value || "").slice(0, 10);
}

function monthStartIso(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(1);
  return date.toISOString().slice(0, 10);
}

function monthEndIso(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}

function shiftMonthIso(iso, delta) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 10);
}

function buildMonthCells(monthIso) {
  const start = new Date(`${monthStartIso(monthIso)}T00:00:00.000Z`);
  const end = new Date(`${monthEndIso(monthIso)}T00:00:00.000Z`);
  const pad = start.getUTCDay();
  const cells = [];
  for (let i = 0; i < pad; i += 1) cells.push(null);
  const cursor = new Date(start);
  while (cursor <= end) {
    cells.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AdminRoomInventoryManager({ roomId, room }) {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "rooms.update");
  const defaultInventory = Number(room?.totalInventory) || 1;
  const currency = room?.currency || "INR";
  const [tab, setTab] = useState("availability");
  const [reloadToken, setReloadToken] = useState(0);

  useAdminRealtime(
    useCallback((event) => {
      if (event?.type !== "inventory.updated") return;
      if (event.roomId && event.roomId !== roomId) return;
      setReloadToken((value) => value + 1);
    }, [roomId]),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "availability", label: "Availability" },
          { id: "rates", label: "Rates" },
          { id: "blocks", label: "Blocks" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-accent text-white"
                : "border border-line bg-elevated text-ink hover:bg-accent-soft"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "availability" ? (
        <AvailabilityPanel roomId={roomId} defaultInventory={defaultInventory} reloadToken={reloadToken} canUpdate={canUpdate} />
      ) : null}
      {tab === "rates" ? (
        <RatesPanel roomId={roomId} currency={currency} defaultPrice={room?.basePrice} reloadToken={reloadToken} canUpdate={canUpdate} />
      ) : null}
      {tab === "blocks" ? (
        <BlocksPanel roomId={roomId} defaultQuantity={defaultInventory} reloadToken={reloadToken} canUpdate={canUpdate} />
      ) : null}
    </div>
  );
}

function AvailabilityPanel({ roomId, defaultInventory, reloadToken = 0, canUpdate = true }) {
  const initialFrom = useMemo(() => todayIso(), []);
  const initialTo = useMemo(() => addDaysIso(initialFrom, 30), [initialFrom]);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [monthCursor, setMonthCursor] = useState(() => monthStartIso(initialFrom));
  const [selectedDate, setSelectedDate] = useState(initialFrom);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inventory, setInventory] = useState(String(defaultInventory));
  const [isClosed, setIsClosed] = useState(false);
  const [minStay, setMinStay] = useState("");
  const [maxStay, setMaxStay] = useState("");
  const [fillFrom, setFillFrom] = useState(initialFrom);
  const [fillTo, setFillTo] = useState(initialTo);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listRoomAvailability(roomId, {
        page: 1,
        limit: 100,
        from,
        to,
      });
      setItems(data.items);
    } catch (err) {
      if (!silent) {
        setError(err instanceof ApiError ? err.message : "Unable to load availability.");
        setItems([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId, from, to]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  useEffect(() => {
    const monthFrom = monthStartIso(monthCursor);
    const monthTo = monthEndIso(monthCursor);
    setFrom(monthFrom);
    setTo(monthTo);
  }, [monthCursor]);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const row of items) map.set(dateKey(row.date), row);
    return map;
  }, [items]);

  const monthCells = useMemo(() => buildMonthCells(monthCursor), [monthCursor]);
  const monthLabel = useMemo(() => {
    const date = new Date(`${monthStartIso(monthCursor)}T00:00:00.000Z`);
    return date.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  }, [monthCursor]);

  function selectDay(iso) {
    if (!iso) return;
    setSelectedDate(iso);
    setFillFrom(iso);
    setFillTo(iso);
    const row = byDate.get(iso);
    if (row) {
      setInventory(String(row.totalInventory ?? defaultInventory));
      setIsClosed(Boolean(row.isClosed));
      setMinStay(row.minStay == null ? "" : String(row.minStay));
      setMaxStay(row.maxStay == null ? "" : String(row.maxStay));
    }
  }

  async function handleFill(event) {
    event.preventDefault();
    if (!canUpdate) return;
    const dates = eachDate(fillFrom, fillTo);
    if (!dates.length) {
      setError("Choose a valid date range (from ≤ to, max ~366 days).");
      return;
    }
    if (dates.length > 366) {
      setError("Date range cannot exceed 366 days.");
      return;
    }
    const totalInventory = Number(inventory);
    if (!Number.isInteger(totalInventory) || totalInventory < 1) {
      setError("Total inventory must be a positive integer.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const existing = await listRoomAvailability(roomId, {
        page: 1,
        limit: 366,
        from: fillFrom,
        to: fillTo,
      });
      const byDate = new Map(existing.items.map((row) => [dateKey(row.date), row]));
      const days = dates.map((date) => {
        const current = byDate.get(date);
        const bookedCount = Number(current?.bookedCount || 0);
        const blockedCount = Number(current?.blockedCount || 0);
        const availableCount = isClosed
          ? 0
          : Math.max(0, totalInventory - bookedCount - blockedCount);
        const minStayValue = minStay === "" ? (current?.minStay ?? null) : Number(minStay);
        const maxStayValue = maxStay === "" ? (current?.maxStay ?? null) : Number(maxStay);
        return {
          date,
          totalInventory,
          bookedCount,
          blockedCount,
          availableCount,
          isClosed,
          minStay: Number.isFinite(minStayValue) ? minStayValue : null,
          maxStay: Number.isFinite(maxStayValue) ? maxStayValue : null,
        };
      });
      await upsertRoomAvailability(roomId, days);
      setFrom(fillFrom);
      setTo(fillTo);
      setMessage(`Updated availability for ${days.length} day(s). Booked/blocked counts were preserved.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save availability.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <div>
        <h2 className="font-display text-xl text-ink">Daily availability</h2>
        <p className="mt-1 text-sm text-muted">
          Set inventory for a date range. Existing booked / blocked counts are kept and available units are recalculated.
        </p>
      </div>

      <form onSubmit={handleFill} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
        <Input label="From" type="date" value={fillFrom} onChange={(e) => setFillFrom(e.target.value)} required />
        <Input label="To" type="date" value={fillTo} onChange={(e) => setFillTo(e.target.value)} required />
        <Input
          label="Total inventory"
          type="number"
          min="1"
          value={inventory}
          onChange={(e) => setInventory(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 pb-3 text-sm text-ink">
          <input type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} />
          Mark closed
        </label>
        <Input
          label="Min stay (nights)"
          type="number"
          min="1"
          value={minStay}
          onChange={(e) => setMinStay(e.target.value)}
          placeholder="Keep existing"
        />
        <Input
          label="Max stay (nights)"
          type="number"
          min="1"
          value={maxStay}
          onChange={(e) => setMaxStay(e.target.value)}
          placeholder="Keep existing"
        />
        <div className="xl:col-span-2">
          <Button type="submit" disabled={busy || !canUpdate} className="w-full sm:w-auto">
            {busy ? "Saving…" : "Apply to range"}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setMonthCursor((value) => shiftMonthIso(value, -1))}>
            Previous
          </Button>
          <p className="px-2 pb-2 text-sm font-medium text-ink">{monthLabel}</p>
          <Button type="button" variant="secondary" onClick={() => setMonthCursor((value) => shiftMonthIso(value, 1))}>
            Next
          </Button>
        </div>
        <Button type="button" variant="secondary" onClick={() => load()}>Refresh</Button>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <LoadingState label="Loading availability" /> : null}

      {!loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
              <div key={label} className="py-1 font-medium uppercase tracking-wide">{label}</div>
            ))}
            {monthCells.map((iso, index) => {
              if (!iso) return <div key={`empty-${index}`} className="min-h-16 rounded-xl border border-transparent" />;
              const row = byDate.get(iso);
              const closed = Boolean(row?.isClosed);
              const available = row?.availableCount;
              const selected = selectedDate === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => selectDay(iso)}
                  className={`min-h-16 rounded-xl border px-1 py-1 text-left transition-colors ${
                    selected
                      ? "border-accent bg-accent-soft"
                      : closed
                        ? "border-line/60 bg-line/30 text-muted"
                        : "border-line bg-elevated hover:border-accent/50"
                  }`}
                >
                  <span className="block text-[11px] font-medium text-ink">{Number(iso.slice(8, 10))}</span>
                  <span className="mt-1 block text-[11px] text-muted">
                    {row
                      ? closed
                        ? "Closed"
                        : `${available ?? 0} avail`
                      : "—"}
                  </span>
                  {row?.minStay ? (
                    <span className="mt-0.5 block text-[10px] text-muted">min {row.minStay}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Booked</th>
                  <th className="px-2 py-2">Blocked</th>
                  <th className="px-2 py-2">Available</th>
                  <th className="px-2 py-2">Min</th>
                  <th className="px-2 py-2">Max</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((row) => (
                  <tr
                    key={row.id || dateKey(row.date)}
                    className={`border-t border-line/80 ${dateKey(row.date) === selectedDate ? "bg-accent-soft/40" : ""}`}
                  >
                    <td className="px-2 py-2 text-ink">{formatDateLabel(row.date)}</td>
                    <td className="px-2 py-2">{row.totalInventory}</td>
                    <td className="px-2 py-2">{row.bookedCount}</td>
                    <td className="px-2 py-2">{row.blockedCount}</td>
                    <td className="px-2 py-2 font-medium">{row.availableCount}</td>
                    <td className="px-2 py-2">{row.minStay ?? "—"}</td>
                    <td className="px-2 py-2">{row.maxStay ?? "—"}</td>
                    <td className="px-2 py-2">
                      <StatusBadge status={row.isClosed ? "CLOSED" : "OPEN"} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center text-muted">
                      No availability rows in this range. Apply inventory above to create them.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RatesPanel({ roomId, currency, defaultPrice, reloadToken = 0, canUpdate = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    startDate: todayIso(),
    endDate: addDaysIso(todayIso(), 30),
    rateType: "SEASONAL",
    price: String(defaultPrice ?? ""),
    weekendPrice: "",
    priority: "0",
    minStay: "",
    maxStay: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRoomRates(roomId, { page: 1, limit: 50 });
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load rates.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!canUpdate) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await createRoomRate(roomId, {
        startDate: form.startDate,
        endDate: form.endDate,
        rateType: form.rateType,
        price: Number(form.price),
        weekendPrice: form.weekendPrice === "" ? null : Number(form.weekendPrice),
        priority: Number(form.priority || 0),
        minStay: form.minStay === "" ? null : Number(form.minStay),
        maxStay: form.maxStay === "" ? null : Number(form.maxStay),
        isActive: Boolean(form.isActive),
      });
      setMessage("Rate period created.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create rate.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!canUpdate) return;
    if (!window.confirm("Remove this rate period?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteRoomRate(roomId, id);
      setMessage("Rate removed.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete rate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <div>
        <h2 className="font-display text-xl text-ink">Seasonal / special rates</h2>
        <p className="mt-1 text-sm text-muted">
          Higher priority wins when date ranges overlap. Base price on the room is the fallback.
        </p>
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input label="Start" type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} required />
        <Input label="End" type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} required />
        <label className="flex flex-col gap-1.5 text-xs font-medium tracking-[0.08em] text-muted uppercase">
          Rate type
          <select
            value={form.rateType}
            onChange={(e) => updateForm("rateType", e.target.value)}
            className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm font-normal normal-case tracking-normal text-ink"
          >
            {RATE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <Input label="Price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateForm("price", e.target.value)} required />
        <Input label="Weekend price" type="number" min="0" step="0.01" value={form.weekendPrice} onChange={(e) => updateForm("weekendPrice", e.target.value)} />
        <Input label="Priority" type="number" min="0" value={form.priority} onChange={(e) => updateForm("priority", e.target.value)} />
        <Input label="Min stay" type="number" min="1" value={form.minStay} onChange={(e) => updateForm("minStay", e.target.value)} />
        <Input label="Max stay" type="number" min="1" value={form.maxStay} onChange={(e) => updateForm("maxStay", e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">
          <input type="checkbox" checked={form.isActive} onChange={(e) => updateForm("isActive", e.target.checked)} />
          Active
        </label>
        <div className="md:col-span-2 xl:col-span-4">
          <Button type="submit" disabled={busy || !canUpdate}>{busy ? "Saving…" : "Add rate"}</Button>
        </div>
      </form>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <LoadingState label="Loading rates" /> : null}

      {!loading ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-2 py-2">Period</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Priority</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.length ? items.map((rate) => (
                <tr key={rate.id} className="border-t border-line/80">
                  <td className="px-2 py-2 text-ink">
                    {formatDateLabel(rate.startDate)} – {formatDateLabel(rate.endDate)}
                    {(rate.minStay || rate.maxStay) ? (
                      <p className="text-xs text-muted">
                        Stay {rate.minStay || "1"}–{rate.maxStay || "∞"} nights
                      </p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{rate.rateType}</td>
                  <td className="px-2 py-2">
                    {formatCurrency(rate.price, currency)}
                    {rate.weekendPrice != null ? (
                      <p className="text-xs text-muted">Wknd {formatCurrency(rate.weekendPrice, currency)}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{rate.priority}</td>
                  <td className="px-2 py-2">
                    <StatusBadge status={rate.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(rate.id)}
                      className="text-sm text-red-700 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-muted">No rate periods yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function BlocksPanel({ roomId, defaultQuantity, reloadToken = 0, canUpdate = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    startDate: todayIso(),
    endDate: addDaysIso(todayIso(), 3),
    quantity: String(defaultQuantity || 1),
    reason: "",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRoomBlocks(roomId, { page: 1, limit: 50 });
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load blocks.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
  }, [load, reloadToken]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!canUpdate) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await createRoomBlock(roomId, {
        startDate: form.startDate,
        endDate: form.endDate,
        quantity: Number(form.quantity),
        reason: form.reason.trim() || null,
        isActive: Boolean(form.isActive),
      });
      setMessage("Block created.");
      setForm((prev) => ({ ...prev, reason: "" }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create block.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!canUpdate) return;
    if (!window.confirm("Remove this inventory block?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteRoomBlock(roomId, id);
      setMessage("Block removed.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete block.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <div>
        <h2 className="font-display text-xl text-ink">Inventory blocks</h2>
        <p className="mt-1 text-sm text-muted">
          Hold units offline for maintenance, owner use, or private allotments. End date is exclusive.
        </p>
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input label="Start" type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} required />
        <Input label="End (exclusive)" type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} required />
        <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={(e) => updateForm("quantity", e.target.value)} required />
        <Input label="Reason" value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} placeholder="Maintenance" />
        <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">
          <input type="checkbox" checked={form.isActive} onChange={(e) => updateForm("isActive", e.target.checked)} />
          Active
        </label>
        <div className="md:col-span-2 xl:col-span-4">
          <Button type="submit" disabled={busy || !canUpdate}>{busy ? "Saving…" : "Add block"}</Button>
        </div>
      </form>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <LoadingState label="Loading blocks" /> : null}

      {!loading ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-2 py-2">Period</th>
                <th className="px-2 py-2">Qty</th>
                <th className="px-2 py-2">Reason</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.length ? items.map((block) => (
                <tr key={block.id} className="border-t border-line/80">
                  <td className="px-2 py-2 text-ink">
                    {formatDateLabel(block.startDate)} – {formatDateLabel(block.endDate)}
                  </td>
                  <td className="px-2 py-2">{block.quantity}</td>
                  <td className="px-2 py-2 text-muted">{block.reason || "—"}</td>
                  <td className="px-2 py-2">
                    <StatusBadge status={block.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(block.id)}
                      className="text-sm text-red-700 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-muted">No blocks yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
