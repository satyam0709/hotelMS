"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminFacility,
  deleteAdminFacility,
  listAdminFacilities,
  updateAdminFacility,
} from "@/lib/api/admin-facilities";
import { emptyToNull, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = { name: "", slug: "", category: "", description: "", operatingHours: "", displayOrder: "0", isActive: true, slugTouched: false };

export default function AdminFacilitiesManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "facilities.create");
  const canUpdate = hasPermission(admin, "facilities.update");
  const canDelete = hasPermission(admin, "facilities.delete");

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
      const data = await listAdminFacilities({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load facilities.");
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

  async function handleSave(e) {
    e.preventDefault();
    if (editId ? !canUpdate : !canCreate) return;
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      category: emptyToNull(form.category),
      description: emptyToNull(form.description),
      operatingHours: emptyToNull(form.operatingHours),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminFacility(editId, payload);
      else await createAdminFacility(payload);
      resetForm();
      setMessage("Facility saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save facility.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("Delete this facility?")) return;
    setError("");
    setMessage("");
    try {
      await deleteAdminFacility(id);
      if (editId === id) resetForm();
      setMessage("Facility deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete facility.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Facilities</h1>
        <p className="mt-2 text-sm text-muted">Amenities shown on /facilities and the home experiences section.</p>
      </div>
      {loading ? <LoadingState label="Loading facilities" /> : null}
      {loadError ? <ErrorState title="Facilities unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {(canCreate || canUpdate) ? (
            <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl">{editId ? "Edit facility" : "New facility"}</h2>
                {editId ? <Button type="button" variant="secondary" size="sm" onClick={resetForm}>Cancel</Button> : null}
              </div>
              <Input label="Name" value={form.name} onChange={(e) => {
                const name = e.target.value;
                setForm((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
              }} required />
              <Input label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
              <Input label="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Wellness, Dining…" />
              <label className="block text-sm">Description<textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
              <Input label="Operating hours" value={form.operatingHours} onChange={(e) => setForm((p) => ({ ...p, operatingHours: e.target.value }))} />
              <Input label="Display order" type="number" min="0" value={form.displayOrder} onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
              <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>Save</Button>
            </form>
          ) : null}
          <ul className="max-h-[36rem] space-y-2 overflow-y-auto rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
                <button type="button" className="text-left text-sm font-medium hover:text-accent" onClick={() => {
                  if (!canUpdate) return;
                  setEditId(item.id);
                  setForm({ name: item.name || "", slug: item.slug || "", category: item.category || "", description: item.description || "", operatingHours: item.operatingHours || "", displayOrder: String(item.displayOrder ?? 0), isActive: Boolean(item.isActive), slugTouched: true });
                }}>{item.name}</button>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                  {canDelete ? (
                    <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
