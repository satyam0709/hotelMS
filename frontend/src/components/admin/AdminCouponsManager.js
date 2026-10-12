"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  listAdminCoupons,
  updateAdminCoupon,
} from "@/lib/api/admin-pricing";
import { toDateInput, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minBookingAmount: "",
  maxDiscountAmount: "",
  validFrom: "",
  validTo: "",
  usageLimit: "",
  isActive: true,
};

export default function AdminCouponsManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "coupons.create");
  const canUpdate = hasPermission(admin, "coupons.update");
  const canDelete = hasPermission(admin, "coupons.delete");

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
      const data = await listAdminCoupons({ limit: 100 });
      setItems(data.items);
    } catch {
      setError("Unable to load coupons.");
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

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (editId ? !canUpdate : !canCreate) return;
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discountType: form.discountType,
      discountValue: toOptionalNumber(form.discountValue),
      minBookingAmount: toOptionalNumber(form.minBookingAmount),
      maxDiscountAmount: toOptionalNumber(form.maxDiscountAmount),
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      usageLimit: toOptionalNumber(form.usageLimit),
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminCoupon(editId, payload);
      else await createAdminCoupon(payload);
      resetForm();
      setMessage("Coupon saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("Deactivate and archive this coupon?")) return;
    setError("");
    setMessage("");
    try {
      await deleteAdminCoupon(id);
      if (editId === id) resetForm();
      setMessage("Coupon deleted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete coupon.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Coupons</h1>
        <p className="mt-2 text-sm text-muted">
          Promo codes applied at booking checkout (`couponCode`).
        </p>
      </div>

      {loading ? <LoadingState label="Loading coupons" /> : null}
      {error ? <ErrorState title="Coupons unavailable" description={error} /> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !error ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {(canCreate || canUpdate) ? (
            <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl">{editId ? "Edit coupon" : "New coupon"}</h2>
                {editId ? <Button type="button" variant="secondary" size="sm" onClick={resetForm}>Cancel</Button> : null}
              </div>
              <Input label="Code" value={form.code} onChange={(e) => updateField("code", e.target.value.toUpperCase())} required disabled={Boolean(editId) && !canUpdate} />
              <label className="block text-sm">
                <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm"
                />
              </label>
              <label className="flex w-full flex-col gap-1.5">
                <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Discount type</span>
                <select
                  value={form.discountType}
                  onChange={(e) => updateField("discountType", e.target.value)}
                  className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed amount</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Discount value" type="number" min="0" step="0.01" value={form.discountValue} onChange={(e) => updateField("discountValue", e.target.value)} required />
                <Input label="Usage limit" type="number" min="1" value={form.usageLimit} onChange={(e) => updateField("usageLimit", e.target.value)} placeholder="Unlimited" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Min booking amount" type="number" min="0" step="0.01" value={form.minBookingAmount} onChange={(e) => updateField("minBookingAmount", e.target.value)} />
                <Input label="Max discount" type="number" min="0" step="0.01" value={form.maxDiscountAmount} onChange={(e) => updateField("maxDiscountAmount", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Valid from" type="date" value={form.validFrom} onChange={(e) => updateField("validFrom", e.target.value)} />
                <Input label="Valid to" type="date" value={form.validTo} onChange={(e) => updateField("validTo", e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} />
                Active
              </label>
              <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>
                {saving ? "Saving…" : "Save coupon"}
              </Button>
            </form>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Usage</th>
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
                            code: item.code || "",
                            description: item.description || "",
                            discountType: item.discountType || "PERCENTAGE",
                            discountValue: String(item.discountValue ?? ""),
                            minBookingAmount: item.minBookingAmount != null ? String(item.minBookingAmount) : "",
                            maxDiscountAmount: item.maxDiscountAmount != null ? String(item.maxDiscountAmount) : "",
                            validFrom: toDateInput(item.validFrom),
                            validTo: toDateInput(item.validTo),
                            usageLimit: item.usageLimit != null ? String(item.usageLimit) : "",
                            isActive: Boolean(item.isActive),
                          });
                        }}
                      >
                        {item.code}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.discountType === "PERCENTAGE" ? `${item.discountValue}%` : item.discountValue}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.usedCount ?? 0}{item.usageLimit != null ? ` / ${item.usageLimit}` : ""}
                    </td>
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
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No coupons yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
