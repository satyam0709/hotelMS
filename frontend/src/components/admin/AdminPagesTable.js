"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { deleteAdminPage, listAdminPages, restoreAdminPage } from "@/lib/api/admin-pages";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export default function AdminPagesTable() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "pages.create");
  const canDelete = hasPermission(admin, "pages.delete");
  const canRestore = hasPermission(admin, "pages.update");

  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);
  const [page, setPage] = useState(1);
  const [payload, setPayload] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminPages({
        page,
        limit: 20,
        search: search.trim() || undefined,
        trashed: showTrashed ? "true" : undefined,
      });
      setPayload(data);
    } catch {
      setError("Unable to load pages.");
    } finally {
      setLoading(false);
    }
  }, [page, search, showTrashed]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id, title) {
    if (!canDelete) return;
    if (!window.confirm(`Move page “${title}” to trash? You can restore it later.`)) return;
    setBusyId(id);
    setError("");
    try {
      await deleteAdminPage(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete page.");
    } finally {
      setBusyId("");
    }
  }

  async function handleRestore(id) {
    if (!canRestore) return;
    setBusyId(id);
    setError("");
    try {
      await restoreAdminPage(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to restore page.");
    } finally {
      setBusyId("");
    }
  }

  const totalPages = Math.max(1, Math.ceil(payload.total / payload.limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">CMS pages</h1>
          <p className="mt-2 text-sm text-muted">
            Structured pages with editable sections and SEO fields. Use slug <code className="text-ink">home</code> to toggle homepage sections.
          </p>
        </div>
        {canCreate && !showTrashed ? <Button href="/admin/pages/new" size="sm">New page</Button> : null}
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
        <div className="min-w-[220px] flex-1">
          <Input
            label="Search"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Title or slug"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={showTrashed}
            onChange={(event) => {
              setPage(1);
              setShowTrashed(event.target.checked);
            }}
          />
          Show trash
        </label>
      </div>

      {loading ? <LoadingState label="Loading pages" /> : null}
      {error ? <ErrorState title="Pages unavailable" description={error} /> : null}

      {!loading && !error ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Visible</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {payload.items.map((row) => (
                <tr key={row.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{row.title}</td>
                  <td className="px-4 py-3 text-muted">/{row.slug}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3">{row.isVisible ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {showTrashed ? (
                        canRestore ? (
                          <button
                            type="button"
                            className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
                            disabled={busyId === row.id}
                            onClick={() => handleRestore(row.id)}
                          >
                            Restore
                          </button>
                        ) : null
                      ) : (
                        <>
                          <Link href={`/admin/pages/${row.id}`} className="text-sm font-medium text-accent hover:underline">
                            Edit
                          </Link>
                          {canDelete ? (
                            <button
                              type="button"
                              className="text-sm text-red-700 hover:underline disabled:opacity-50"
                              disabled={busyId === row.id}
                              onClick={() => handleDelete(row.id, row.title)}
                            >
                              Delete
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payload.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              {showTrashed ? "Trash is empty." : "No pages yet."}
            </p>
          ) : null}
        </div>
      ) : null}

      {!loading && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-muted">Page {page} of {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}
