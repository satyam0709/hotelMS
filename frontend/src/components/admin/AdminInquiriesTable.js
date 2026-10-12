"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { listAdminInquiries } from "@/lib/api/admin-inquiries";
import { isCancelRequestInquiry } from "@/lib/booking-transitions";
import { formatDateLabel } from "@/lib/utils";

const STATUS_OPTIONS = ["", "NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"];

export default function AdminInquiriesTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listAdminInquiries({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setPayload({
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
        limit: data?.limit ?? 20,
      });
    } catch {
      if (!silent) setError("Unable to load inquiries.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminRealtime(
    useCallback((event) => {
      if (event?.type === "inquiry.created" || event?.type === "inquiry.updated") {
        load({ silent: true });
      }
    }, [load]),
  );

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Inquiries</h1>
        <p className="mt-2 text-sm text-muted">
          Contact, dining, event, package messages, and booking cancel requests from guests.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted">Search</label>
          <Input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Name, email, subject, message"
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

      {loading ? <LoadingState label="Loading inquiries" /> : null}
      {error ? <ErrorState title="Inquiries unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Linked</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.map((inquiry) => {
                  const cancelRequest = isCancelRequestInquiry(inquiry);
                  const bookingId = inquiry.sourceRefType === "Booking" ? inquiry.sourceRefId : null;
                  return (
                    <tr key={inquiry.id} className="border-t border-line/80">
                      <td className="px-4 py-3">
                        <Link href={`/admin/inquiries/${inquiry.id}`} className="font-medium text-accent hover:underline">
                          {inquiry.name}
                        </Link>
                        <p className="text-xs text-muted">{inquiry.email || inquiry.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {inquiry.type}
                        {cancelRequest ? (
                          <span className="mt-1 block text-[11px] font-semibold tracking-wide text-amber-800 uppercase">
                            Cancel request
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted">{inquiry.subject || "—"}</td>
                      <td className="px-4 py-3 text-muted">
                        {bookingId ? (
                          <Link href={`/admin/bookings/${bookingId}`} className="text-accent hover:underline">
                            Open booking
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDateLabel(inquiry.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={inquiry.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!payload.items.length ? (
              <p className="px-4 py-10 text-center text-sm text-muted">No inquiries found.</p>
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
