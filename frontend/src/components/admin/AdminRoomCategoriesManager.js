"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import MediaIdField from "@/components/admin/MediaIdField";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminRoomCategory,
  deleteAdminRoomCategory,
  listAdminRoomCategories,
  reorderAdminRoomCategories,
  updateAdminRoomCategory,
} from "@/lib/api/admin-rooms";
import { slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  featuredMediaId: "",
  displayOrder: "0",
  isActive: true,
  slugTouched: false,
};

export default function AdminRoomCategoriesManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "room_categories.create");
  const canUpdate = hasPermission(admin, "room_categories.update");
  const canDelete = hasPermission(admin, "room_categories.delete");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listAdminRoomCategories({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load room categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId("");
    setForm(EMPTY);
  }

  async function handleSave(event) {
    if (editId ? !canUpdate : !canCreate) return;
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim() || null,
      featuredMediaId: form.featuredMediaId.trim() || null,
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminRoomCategory(editId, payload);
      else await createAdminRoomCategory(payload);
      resetForm();
      setMessage("Room category saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save room category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("Delete this category? Rooms still assigned to it cannot be deleted.")) return;
    setError("");
    setMessage("");
    try {
      await deleteAdminRoomCategory(id);
      if (editId === id) resetForm();
      setMessage("Room category deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete room category.");
    }
  }

  async function handleReorder() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const ordered = [...items]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name))
        .map((item, index) => ({ id: item.id, displayOrder: index }));
      await reorderAdminRoomCategories(ordered);
      setMessage("Room categories reordered.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reorder room categories.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Room categories</h1>
          <p className="mt-2 text-sm text-muted">
            Group rooms for public listings, filters, and room setup.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleReorder} disabled={saving || !items.length}>
          Normalize order
        </Button>
      </div>

      {loading ? <LoadingState label="Loading room categories" /> : null}
      {loadError ? <ErrorState title="Categories unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">{editId ? "Edit category" : "New category"}</h2>
              {editId ? <Button type="button" variant="secondary" size="sm" onClick={resetForm}>Cancel</Button> : null}
            </div>
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slugTouched ? prev.slug : slugify(name),
                }));
              }}
              required
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value, slugTouched: true }))}
              required
            />
            <label className="block text-sm text-ink">
              <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                className="mt-1.5 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink"
                placeholder="Short blurb shown on category and room listing pages"
              />
            </label>
            <MediaIdField
              label="Featured media"
              value={form.featuredMediaId}
              onChange={(featuredMediaId) => setForm((prev) => ({ ...prev, featuredMediaId }))}
            />
            <Input
              label="Display order"
              type="number"
              min="0"
              value={form.displayOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active
            </label>
            <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>{saving ? "Saving..." : "Save category"}</Button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((item) => (
                  <tr key={item.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-ink hover:text-accent"
                        onClick={() => {
                          setEditId(item.id);
                          setForm({
                            name: item.name || "",
                            slug: item.slug || "",
                            description: item.description || "",
                            featuredMediaId: item.featuredMediaId || item.featuredMedia?.id || "",
                            displayOrder: String(item.displayOrder ?? 0),
                            isActive: Boolean(item.isActive),
                            slugTouched: true,
                          });
                        }}
                      >
                        {item.name}
                      </button>
                      <p className="text-xs text-muted">/{item.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.displayOrder ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="text-sm text-red-700 hover:underline"
                        onClick={() => handleDelete(item.id)}
                      disabled={!canDelete}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted">No room categories yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
