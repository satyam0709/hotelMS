"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  listAdminNewsletter,
  updateNewsletterStatus,
} from "@/lib/api/admin-newsletter";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatDateLabel } from "@/lib/utils";

const STATUS_OPTIONS = ["", "SUBSCRIBED", "UNSUBSCRIBED"];

export default function AdminNewsletterTable() {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "newsletter.update");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminNewsletter({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setPayload({
        items: data.items,
        total: data.total,
        limit: data.limit,
      });
    } catch {
      setError("Unable to load newsletter subscribers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));
  const subscribedCount = payload.items.filter((item) => item.status === "SUBSCRIBED").length;

  async function toggleStatus(item) {
    const next = item.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED";
    setBusyId(item.id);
    setMessage("");
    setError("");
    try {
      await updateNewsletterStatus(item.id, next);
      setMessage(`${item.email} marked ${next.replaceAll("_", " ").toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update subscriber.");
    } finally {
      setBusyId("");
    }
  }

  async function copyEmails() {
    const emails = payload.items
      .filter((item) => item.status === "SUBSCRIBED")
      .map((item) => item.email)
      .join(", ");
    if (!emails) {
      setMessage("No subscribed emails on this page.");
      return;
    }
    try {
      await navigator.clipboard.writeText(emails);
      setMessage(`Copied ${subscribedCount} subscribed email(s) from this page.`);
    } catch {
      setMessage(emails);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Newsletter</h1>
          <p className="mt-2 text-sm text-muted">
            Subscribers from the website footer / newsletter form.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={copyEmails}>
          Copy subscribed (page)
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Search email</label>
          <Input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="guest@example.com"
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
        <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {loading ? <LoadingState label="Loading subscribers" /> : null}
      {error ? <ErrorState title="Newsletter unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payload.items.length ? payload.items.map((item) => (
                  <tr key={item.id} className="border-t border-line/80">
                    <td className="px-4 py-3 font-medium text-ink">{item.email}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDateLabel(item.subscribedAt || item.createdAt)}
                      {item.unsubscribedAt ? (
                        <p className="text-xs">Left {formatDateLabel(item.unsubscribedAt)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canUpdate ? (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => toggleStatus(item)}
                          className="text-sm text-accent hover:underline disabled:opacity-50"
                        >
                          {busyId === item.id
                            ? "Saving…"
                            : item.status === "SUBSCRIBED"
                              ? "Unsubscribe"
                              : "Resubscribe"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">No subscribers found.</td>
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
