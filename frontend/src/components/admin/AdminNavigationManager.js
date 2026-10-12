"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminNavigationItem,
  deleteAdminNavigationItem,
  listAdminNavigation,
  updateAdminNavigationItem,
} from "@/lib/api/admin-navigation";
import { toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

const EMPTY = {
  label: "",
  href: "",
  displayOrder: "0",
  isActive: true,
};

export default function AdminNavigationManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "navigation.create");
  const canUpdate = hasPermission(admin, "navigation.update");
  const canDelete = hasPermission(admin, "navigation.delete");
  const [tab, setTab] = useState("HEADER");
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
      const data = await listAdminNavigation({ limit: 200, location: tab });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load navigation.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

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
    if (!form.label.trim() || !form.href.trim()) {
      setError("Label and link are required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      label: form.label.trim(),
      href: form.href.trim(),
      location: tab,
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminNavigationItem(editId, payload);
      else await createAdminNavigationItem(payload);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save link.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("Delete this menu link?")) return;
    setError("");
    try {
      await deleteAdminNavigationItem(id);
      if (editId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete link.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Navigation</h1>
        <p className="mt-2 text-sm text-muted">
          Header and footer links shown on the public site. When empty, default links are used.
        </p>
      </div>

      <div className="flex gap-2">
        {["HEADER", "FOOTER"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              resetForm();
            }}
            className={cn(
              "rounded-md border px-4 py-2 text-sm font-medium",
              tab === id ? "border-accent bg-accent text-white" : "border-line bg-elevated text-ink"
            )}
          >
            {id === "HEADER" ? "Header menu" : "Footer links"}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading navigation" /> : null}
      {loadError ? <ErrorState title="Navigation unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editId ? "Edit link" : "New link"}</h2>
            <Input
              label="Label"
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              required
            />
            <Input
              label="Href"
              value={form.href}
              onChange={(e) => setForm((p) => ({ ...p, href: e.target.value }))}
              placeholder="/rooms or https://…"
              required
            />
            <Input
              label="Display order"
              type="number"
              min="0"
              value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>{saving ? "Saving…" : "Save link"}</Button>
              {editId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              ) : null}
            </div>
          </form>

          <ul className="space-y-2 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No links yet for this menu.</p>
            ) : null}
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-0"
              >
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => {
                    setEditId(item.id);
                    setForm({
                      label: item.label || "",
                      href: item.href || "",
                      displayOrder: String(item.displayOrder ?? 0),
                      isActive: Boolean(item.isActive),
                    });
                  }}
                >
                  <p className="font-medium text-ink">{item.label}</p>
                  <p className="truncate text-xs text-muted">{item.href}</p>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                  {canDelete ? (
                    <button type="button" className="text-xs text-red-600" onClick={() => handleDelete(item.id)}>
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
