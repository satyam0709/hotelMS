"use client";

import { useCallback, useEffect, useState } from "react";
import MediaIdField from "@/components/admin/MediaIdField";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminAttraction,
  deleteAdminAttraction,
  listAdminAttractions,
  updateAdminAttraction,
} from "@/lib/api/admin-attractions";
import { emptyToNull, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = { name: "", slug: "", description: "", distance: "", mapUrl: "", displayOrder: "0", mediaId: "", isActive: true, slugTouched: false };

export default function AdminAttractionsManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "attractions.create");
  const canUpdate = hasPermission(admin, "attractions.update");
  const canDelete = hasPermission(admin, "attractions.delete");
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
      const data = await listAdminAttractions({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load attractions.");
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
    const mapUrl = form.mapUrl.trim();
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: emptyToNull(form.description),
      distance: emptyToNull(form.distance),
      mapUrl: mapUrl || null,
      mediaId: emptyToNull(form.mediaId),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminAttraction(editId, payload);
      else await createAdminAttraction(payload);
      setEditId("");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save attraction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Attractions</h1>
        <p className="mt-2 text-sm text-muted">Nearby places for /attractions and the home local guide.</p>
      </div>
      {loading ? <LoadingState label="Loading attractions" /> : null}
      {loadError ? <ErrorState title="Attractions unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editId ? "Edit attraction" : "New attraction"}</h2>
            <Input label="Name" value={form.name} onChange={(e) => {
              const name = e.target.value;
              setForm((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
            }} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
            <Input label="Distance" value={form.distance} onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))} placeholder="12 km" />
            <label className="block text-sm">Description<textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
            <Input label="Map URL" value={form.mapUrl} onChange={(e) => setForm((p) => ({ ...p, mapUrl: e.target.value }))} placeholder="https://…" />
            <MediaIdField label="Image" value={form.mediaId} onChange={(v) => setForm((p) => ({ ...p, mediaId: v }))} />
            <Input label="Display order" type="number" min="0" value={form.displayOrder} onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
            <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>Save</Button>
          </form>
          <ul className="space-y-2 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
                <button type="button" className="text-left text-sm font-medium hover:text-accent" onClick={() => {
                  setEditId(item.id);
                  setForm({ name: item.name || "", slug: item.slug || "", description: item.description || "", distance: item.distance || "", mapUrl: item.mapUrl || "", mediaId: item.mediaId || item.media?.id || "", displayOrder: String(item.displayOrder ?? 0), isActive: Boolean(item.isActive), slugTouched: true });
                }}>{item.name}</button>
                {canDelete ? <button type="button" className="text-xs text-red-600" onClick={() => deleteAdminAttraction(item.id).then(load)}>Delete</button> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
