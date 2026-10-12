"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { listAdminActivity } from "@/lib/api/admin-activity";
import { formatDateLabel } from "@/lib/utils";

function dateTimeLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return formatDateLabel(value);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function compactMetadata(value) {
  if (!value || typeof value !== "object") return "";
  const text = JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

export default function AdminActivityTable() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listAdminActivity({
        page,
        limit: 20,
        search: search.trim() || undefined,
        module: module.trim() || undefined,
        action: action.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setPayload({ items: data.items, total: data.total, limit: data.limit });
    } catch {
      if (!silent) setError("Unable to load activity logs.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, search, module, action, from, to]);

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

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Activity log</h1>
        <p className="mt-2 text-sm text-muted">Audit trail for admin auth, content, rooms, bookings, payments, users, and roles.</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_auto] lg:items-end">
          <div>
            <label className="text-xs font-medium text-muted">Search</label>
            <Input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Module, action, entity id, user"
              className="mt-1"
            />
          </div>
          <Input label="Module" value={module} onChange={(e) => { setPage(1); setModule(e.target.value); }} placeholder="bookings" />
          <Input label="Action" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} placeholder="update" />
          <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="From" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
          <Input label="To" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
        </div>
      </div>

      {loading ? <LoadingState label="Loading activity" /> : null}
      {error ? <ErrorState title="Activity unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.length ? payload.items.map((item) => (
                  <tr key={item.id} className="border-t border-line/80 align-top">
                    <td className="px-4 py-3 text-muted">{dateTimeLabel(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.user?.name || "System"}</p>
                      {item.user?.email ? <p className="text-xs text-muted">{item.user.email}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.module}</p>
                      <p className="text-xs text-muted">{item.action}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.entityType || "—"}
                      {item.entityId ? <p className="break-all text-xs">{item.entityId}</p> : null}
                    </td>
                    <td className="max-w-sm break-all px-4 py-3 text-xs text-muted">
                      {compactMetadata(item.metadataJson) || "—"}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">No activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
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
