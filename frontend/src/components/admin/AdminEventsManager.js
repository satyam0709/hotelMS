"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminEvent,
  deleteAdminEvent,
  listAdminEvents,
  updateAdminEvent,
} from "@/lib/api/admin-events";
import { emptyToNull, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = { name: "", slug: "", description: "", capacity: "", basePrice: "", isActive: true, slugTouched: false };

export default function AdminEventsManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "events.create");
  const canUpdate = hasPermission(admin, "events.update");
  const canDelete = hasPermission(admin, "events.delete");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listAdminEvents({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e) {
    if (editId ? !canUpdate : !canCreate) return;
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: emptyToNull(form.description),
      capacity: toOptionalNumber(form.capacity),
      basePrice: toOptionalNumber(form.basePrice),
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminEvent(editId, payload);
      else await createAdminEvent(payload);
      setEditId("");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Events & venues</h1>
        <p className="mt-2 text-sm text-muted">Banquet halls, meetings, and celebrations on /events.</p>
      </div>
      {loading ? <LoadingState label="Loading events" /> : null}
      {loadError ? <ErrorState title="Events unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editId ? "Edit venue" : "New venue"}</h2>
            <Input label="Name" value={form.name} onChange={(e) => {
              const name = e.target.value;
              setForm((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
            }} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
            <label className="block text-sm">Description<textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Capacity" type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
              <Input label="Base price" type="number" min="0" step="0.01" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
            <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>Save</Button>
          </form>
          <ul className="space-y-2 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
                <button type="button" className="text-left text-sm font-medium hover:text-accent" onClick={() => {
                  setEditId(item.id);
                  setForm({ name: item.name || "", slug: item.slug || "", description: item.description || "", capacity: item.capacity != null ? String(item.capacity) : "", basePrice: item.basePrice != null ? String(item.basePrice) : "", isActive: Boolean(item.isActive), slugTouched: true });
                }}>{item.name}</button>
                <div className="flex gap-2">
                  <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                  {canDelete ? <button type="button" className="text-xs text-red-600" onClick={() => deleteAdminEvent(item.id).then(load)}>Delete</button> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
