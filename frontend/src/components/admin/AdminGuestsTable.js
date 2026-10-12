"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { listAdminGuests } from "@/lib/api/admin-guests";
import { formatDateLabel } from "@/lib/utils";

export default function AdminGuestsTable() {
  const [search, setSearch] = useState("");
  const [guestType, setGuestType] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await listAdminGuests({
        page,
        limit: 20,
        search: search.trim() || undefined,
        guestType: guestType.trim() || undefined,
      });
      setPayload({
        items: data.items,
        total: data.total,
        limit: data.limit,
      });
    } catch {
      if (!silent) setError("Unable to load guests.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, search, guestType]);

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
        <h1 className="font-display text-3xl text-ink">Guests</h1>
        <p className="mt-2 text-sm text-muted">
          Guest profiles created from website and desk bookings.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft sm:flex-row sm:items-end">
        <Input
          label="Search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Name, email, phone"
        />
        <Input
          label="Guest type"
          value={guestType}
          onChange={(event) => {
            setPage(1);
            setGuestType(event.target.value);
          }}
          placeholder="VIP, corporate…"
        />
        <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {loading ? <LoadingState label="Loading guests" /> : null}
      {error ? <ErrorState title="Guests unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.length ? payload.items.map((guest) => (
                  <tr key={guest.id} className="border-t border-line/80">
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/admin/guests/${guest.id}`} className="hover:text-accent">
                        {guest.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <p>{guest.email || "—"}</p>
                      <p className="text-xs">{guest.phone || "No phone"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{guest.guestType || "—"}</td>
                    <td className="px-4 py-3 text-ink">{guest.totalVisits ?? guest.bookingCount ?? 0}</td>
                    <td className="px-4 py-3 text-muted">
                      {guest.lastVisitAt ? formatDateLabel(guest.lastVisitAt) : "—"}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">No guests found.</td>
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
