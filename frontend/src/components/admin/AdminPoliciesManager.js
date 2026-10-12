"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminPolicy,
  deleteAdminPolicy,
  listAdminPolicies,
  updateAdminPolicy,
} from "@/lib/api/admin-policies";
import { slugify } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = { type: "general", title: "", slug: "", content: "", isPublished: true, slugTouched: false };

export default function AdminPoliciesManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "policies.create");
  const canUpdate = hasPermission(admin, "policies.update");
  const canDelete = hasPermission(admin, "policies.delete");
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
      const data = await listAdminPolicies({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load policies.");
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
    if (editId ? !canUpdate : !canCreate) return;
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      type: form.type.trim(),
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      content: form.content.trim(),
      isPublished: Boolean(form.isPublished),
    };
    try {
      if (editId) await updateAdminPolicy(editId, payload);
      else await createAdminPolicy(payload);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save policy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Policies</h1>
        <p className="mt-2 text-sm text-muted">Privacy, terms, and other legal pages at /policies/[slug].</p>
      </div>
      {loading ? <LoadingState label="Loading policies" /> : null}
      {loadError ? <ErrorState title="Policies unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editId ? "Edit policy" : "New policy"}</h2>
            <Input label="Type" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="privacy, terms…" required />
            <Input label="Title" value={form.title} onChange={(e) => {
              const title = e.target.value;
              setForm((p) => ({ ...p, title, slug: p.slugTouched ? p.slug : slugify(title) }));
            }} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
            <label className="block text-sm">Content<textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={8} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" required /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />Published</label>
            <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>Save</Button>
          </form>
          <ul className="space-y-2 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 border-b border-line/60 py-3 last:border-0">
                <button type="button" className="text-left text-sm font-medium hover:text-accent" onClick={() => {
                  setEditId(item.id);
                  setForm({ type: item.type || "", title: item.title || "", slug: item.slug || "", content: item.content || "", isPublished: Boolean(item.isPublished), slugTouched: true });
                }}>
                  {item.title}
                  <span className="mt-0.5 block text-xs text-muted">/policies/{item.slug}</span>
                </button>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.isPublished ? "ACTIVE" : "INACTIVE"} />
                  {canDelete ? <button type="button" className="text-xs text-red-600" onClick={() => deleteAdminPolicy(item.id).then(load)}>Delete</button> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
