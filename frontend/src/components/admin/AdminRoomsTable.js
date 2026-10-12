"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { deleteAdminRoom, listAdminRooms } from "@/lib/api/admin-rooms";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatCurrency } from "@/lib/utils";

export default function AdminRoomsTable() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "rooms.create");
  const canDelete = hasPermission(admin, "rooms.delete");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminRooms({ page, limit: 20 });
      setPayload({
        items: Array.isArray(data?.items) ? data.items : [],
        total: data?.total ?? 0,
        limit: data?.limit ?? 20,
      });
    } catch {
      setError("Unable to load rooms.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id, name) {
    if (!canDelete) return;
    if (!window.confirm(`Delete room “${name}”? This cannot be undone if the room has no bookings.`)) return;
    setBusyId(id);
    setError("");
    try {
      await deleteAdminRoom(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete room.");
    } finally {
      setBusyId("");
    }
  }

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Rooms</h1>
          <p className="mt-2 text-sm text-muted">
            Inventory overview. Select a room to edit rates, occupancy, and visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/rooms"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            View public listing
          </Link>
          {canCreate ? (
            <Button href="/admin/rooms/new" size="sm">
              New room
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? <LoadingState label="Loading rooms" /> : null}
      {error ? <ErrorState title="Rooms unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Base rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payload.items.map((room) => (
                  <tr key={room.id} className="border-t border-line/80">
                    <td className="px-4 py-3 font-medium text-ink">
                      <Link href={`/admin/rooms/${room.id}`} className="hover:text-accent">
                        {room.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{room.category?.name || "—"}</td>
                    <td className="px-4 py-3 text-muted">{room.maxAdults}+{room.maxChildren || 0}</td>
                    <td className="px-4 py-3 text-ink">{formatCurrency(room.basePrice, room.currency)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={room.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete ? (
                        <button
                          type="button"
                          className="text-sm text-red-700 hover:underline disabled:opacity-50"
                          disabled={busyId === room.id}
                          onClick={() => handleDelete(room.id, room.name)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!payload.items.length ? (
              <p className="px-4 py-10 text-center text-sm text-muted">No rooms published yet.</p>
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
