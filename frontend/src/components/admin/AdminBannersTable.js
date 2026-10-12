"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { deleteAdminBanner, listAdminBanners } from "@/lib/api/admin-banners";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { formatDateLabel } from "@/lib/utils";

export default function AdminBannersTable() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "banners.create");
  const canDelete = hasPermission(admin, "banners.delete");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminBanners({
        page,
        limit: 20,
        search: search.trim() || undefined,
      });
      setPayload(data);
    } catch {
      setError("Unable to load banners.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id, title) {
    if (!canDelete) return;
    if (!window.confirm(`Delete banner “${title}”?`)) return;
    setBusyId(id);
    try {
      await deleteAdminBanner(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete banner.");
    } finally {
      setBusyId("");
    }
  }

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Banners & offers</h1>
          <p className="mt-2 text-sm text-muted">
            Home hero, announcement bar, and seasonal offer cards.
          </p>
        </div>
        {canCreate ? <Button href="/admin/banners/new" size="sm">New banner</Button> : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-elevated p-4 shadow-soft sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Search"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Title or subtitle"
          />
        </div>
        <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {loading ? <LoadingState label="Loading banners" /> : null}
      {error ? <ErrorState title="Banners unavailable" description={error} /> : null}

      {!loading && !error ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">CTA</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payload.items.map((banner) => (
                  <tr key={banner.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <Link href={`/admin/banners/${banner.id}`} className="font-medium text-ink hover:text-accent">
                        {banner.title}
                      </Link>
                      {banner.subtitle ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{banner.subtitle}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{banner.ctaText || "—"}</td>
                    <td className="px-4 py-3 text-muted">{banner.displayOrder ?? 0}</td>
                    <td className="px-4 py-3 text-muted">
                      {banner.startDate || banner.endDate
                        ? `${banner.startDate ? formatDateLabel(banner.startDate) : "…"} → ${banner.endDate ? formatDateLabel(banner.endDate) : "…"}`
                        : "Always"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={banner.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canDelete ? (
                        <button
                          type="button"
                          disabled={busyId === banner.id}
                          onClick={() => handleDelete(banner.id, banner.title)}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
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
              <p className="px-4 py-10 text-center text-sm text-muted">No banners yet. Create one to power home offers.</p>
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
