"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminTaxRate,
  deleteAdminTaxRate,
  listAdminTaxRates,
  updateAdminTaxRate,
} from "@/lib/api/admin-pricing";
import { toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  name: "",
  percentage: "",
  isDefault: false,
  isActive: true,
};

export default function AdminTaxRatesManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "tax_rates.create");
  const canUpdate = hasPermission(admin, "tax_rates.update");
  const canDelete = hasPermission(admin, "tax_rates.delete");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminTaxRates({ limit: 100 });
      setItems(data.items);
    } catch {
      setError("Unable to load tax rates.");
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
    event.preventDefault();
    if (editId ? !canUpdate : !canCreate) return;
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      name: form.name.trim(),
      percentage: toOptionalNumber(form.percentage),
      isDefault: Boolean(form.isDefault),
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminTaxRate(editId, payload);
      else await createAdminTaxRate(payload);
      resetForm();
      setMessage("Tax rate saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save tax rate.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("Delete this tax rate? Rooms using it must be reassigned first.")) return;
    setError("");
    setMessage("");
    try {
      await deleteAdminTaxRate(id);
      if (editId === id) resetForm();
      setMessage("Tax rate deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete tax rate.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Tax rates</h1>
        <p className="mt-2 text-sm text-muted">
          Assign rates to rooms for booking tax calculation.
        </p>
      </div>

      {loading ? <LoadingState label="Loading tax rates" /> : null}
      {error ? <ErrorState title="Tax rates unavailable" description={error} /> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {(canCreate || canUpdate) ? (
            <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl">{editId ? "Edit tax rate" : "New tax rate"}</h2>
                {editId ? <Button type="button" variant="secondary" size="sm" onClick={resetForm}>Cancel</Button> : null}
              </div>
              <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              <Input
                label="Percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.percentage}
                onChange={(e) => setForm((p) => ({ ...p, percentage: e.target.value }))}
                required
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />
                Default rate
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                Active
              </label>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save tax rate"}</Button>
            </form>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Rooms</th>
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
                        className="font-medium text-ink hover:text-accent"
                        onClick={() => {
                          if (!canUpdate) return;
                          setEditId(item.id);
                          setForm({
                            name: item.name || "",
                            percentage: String(item.percentage ?? ""),
                            isDefault: Boolean(item.isDefault),
                            isActive: Boolean(item.isActive),
                          });
                        }}
                      >
                        {item.name}
                      </button>
                      {item.isDefault ? <p className="text-xs text-accent">Default</p> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{item.percentage}%</td>
                    <td className="px-4 py-3 text-muted">{item.roomCount ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="px-4 py-3 text-right">
                      {canDelete ? (
                        <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => handleDelete(item.id)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No tax rates yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
