"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import MediaIdField from "@/components/admin/MediaIdField";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminTestimonial,
  deleteAdminTestimonial,
  listAdminTestimonials,
  setTestimonialApproval,
  updateAdminTestimonial,
} from "@/lib/api/admin-testimonials";
import { emptyToNull, toDateInput, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  guestName: "",
  guestImageMediaId: "",
  rating: "5",
  review: "",
  reviewDate: "",
  source: "",
  displayOrder: "0",
  isActive: true,
};

export default function AdminTestimonialsManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "testimonials.create");
  const canUpdate = hasPermission(admin, "testimonials.update");
  const canDelete = hasPermission(admin, "testimonials.delete");
  const canApprove = hasPermission(admin, "testimonials.approve");
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
      const data = await listAdminTestimonials({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load testimonials.");
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
    const payload = {
      guestName: form.guestName.trim(),
      guestImageMediaId: emptyToNull(form.guestImageMediaId),
      rating: toOptionalNumber(form.rating) ?? 5,
      review: form.review.trim(),
      reviewDate: emptyToNull(form.reviewDate),
      source: emptyToNull(form.source),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isActive: Boolean(form.isActive),
    };
    try {
      if (editId) await updateAdminTestimonial(editId, payload);
      else await createAdminTestimonial(payload);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save testimonial.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApproval(id, approvalStatus) {
    if (!canApprove) return;
    setError("");
    try {
      await setTestimonialApproval(id, approvalStatus);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update approval.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Testimonials</h1>
        <p className="mt-2 text-sm text-muted">Guest reviews shown on the site after approval.</p>
      </div>

      {loading ? <LoadingState label="Loading testimonials" /> : null}
      {loadError ? <ErrorState title="Testimonials unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editId ? "Edit testimonial" : "New testimonial"}</h2>
            <Input label="Guest name" value={form.guestName} onChange={(e) => setForm((p) => ({ ...p, guestName: e.target.value }))} required />
            <MediaIdField
              label="Guest photo"
              value={form.guestImageMediaId}
              onChange={(value) => setForm((p) => ({ ...p, guestImageMediaId: value }))}
            />
            <Input label="Rating (1–5)" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} required />
            <label className="block text-sm">
              Review
              <textarea
                value={form.review}
                onChange={(e) => setForm((p) => ({ ...p, review: e.target.value }))}
                rows={4}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Review date" type="date" value={form.reviewDate} onChange={(e) => setForm((p) => ({ ...p, reviewDate: e.target.value }))} />
              <Input label="Source" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} placeholder="Google, direct…" />
            </div>
            <Input label="Display order" type="number" min="0" value={form.displayOrder} onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              Active on website (when approved)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>{saving ? "Saving…" : "Save"}</Button>
              {editId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>Cancel edit</Button>
              ) : null}
            </div>
          </form>

          <ul className="max-h-[40rem] space-y-3 overflow-y-auto rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-line/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-sm font-medium hover:text-accent"
                    onClick={() => {
                      setEditId(item.id);
                      setForm({
                        guestName: item.guestName || "",
                        guestImageMediaId: item.guestImageMediaId || item.guestImageMedia?.id || "",
                        rating: String(item.rating ?? 5),
                        review: item.review || "",
                        reviewDate: toDateInput(item.reviewDate),
                        source: item.source || "",
                        displayOrder: String(item.displayOrder ?? 0),
                        isActive: Boolean(item.isActive),
                      });
                    }}
                  >
                    {item.guestName} · {item.rating}/5
                  </button>
                  <StatusBadge status={item.approvalStatus} />
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-muted">{item.review}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canApprove && item.approvalStatus !== "APPROVED" ? (
                    <button type="button" className="text-xs font-medium text-emerald-700" onClick={() => handleApproval(item.id, "APPROVED")}>
                      Approve
                    </button>
                  ) : null}
                  {canApprove && item.approvalStatus !== "REJECTED" ? (
                    <button type="button" className="text-xs font-medium text-red-600" onClick={() => handleApproval(item.id, "REJECTED")}>
                      Reject
                    </button>
                  ) : null}
                  {canApprove && item.approvalStatus !== "PENDING" ? (
                    <button type="button" className="text-xs text-muted" onClick={() => handleApproval(item.id, "PENDING")}>
                      Mark pending
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button type="button" className="text-xs text-red-600" onClick={() => deleteAdminTestimonial(item.id).then(load)}>
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
