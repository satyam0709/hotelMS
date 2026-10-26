"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  createAdminFaq,
  createAdminFaqCategory,
  deleteAdminFaq,
  deleteAdminFaqCategory,
  listAdminFaqCategories,
  listAdminFaqs,
  updateAdminFaq,
  updateAdminFaqCategory,
} from "@/lib/api/admin-faqs";
import { slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

export default function AdminFaqsManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "faqs.create");
  const canUpdate = hasPermission(admin, "faqs.update");
  const canDelete = hasPermission(admin, "faqs.delete");
  const [tab, setTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [catForm, setCatForm] = useState({ name: "", slug: "", displayOrder: "0", isActive: true, slugTouched: false });
  const [editCatId, setEditCatId] = useState("");

  const [faqForm, setFaqForm] = useState({ categoryId: "", question: "", answer: "", displayOrder: "0", isActive: true });
  const [editFaqId, setEditFaqId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cats, rows] = await Promise.all([
        listAdminFaqCategories({ limit: 100 }),
        listAdminFaqs({ limit: 100 }),
      ]);
      setCategories(cats.items);
      setFaqs(rows.items);
      setFaqForm((prev) => ({ ...prev, categoryId: prev.categoryId || cats.items[0]?.id || "" }));
    } catch {
      setLoadError("Unable to load FAQs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCategory(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: catForm.name.trim(),
      slug: slugify(catForm.slug || catForm.name),
      displayOrder: toOptionalNumber(catForm.displayOrder) ?? 0,
      isActive: Boolean(catForm.isActive),
    };
    try {
      if (editCatId) await updateAdminFaqCategory(editCatId, payload);
      else await createAdminFaqCategory(payload);
      setEditCatId("");
      setCatForm({ name: "", slug: "", displayOrder: "0", isActive: true, slugTouched: false });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function saveFaq(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      categoryId: faqForm.categoryId,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      displayOrder: toOptionalNumber(faqForm.displayOrder) ?? 0,
      isActive: Boolean(faqForm.isActive),
    };
    try {
      if (editFaqId) await updateAdminFaq(editFaqId, payload);
      else await createAdminFaq(payload);
      setEditFaqId("");
      setFaqForm({ categoryId: categories[0]?.id || "", question: "", answer: "", displayOrder: "0", isActive: true });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save FAQ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">FAQs</h1>
        <p className="mt-2 text-sm text-muted">Categories and questions for the public FAQs page.</p>
      </div>

      <div className="flex gap-2">
        {["categories", "questions"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium capitalize",
              tab === id ? "border-accent bg-accent text-white" : "border-line bg-elevated"
            )}
          >
            {id}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading FAQs" /> : null}
      {loadError ? <ErrorState title="FAQs unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !loadError && tab === "categories" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveCategory} className="space-y-3 rounded-2xl border border-line bg-elevated p-5">
            <h2 className="font-display text-xl">{editCatId ? "Edit category" : "New category"}</h2>
            <Input label="Name" value={catForm.name} onChange={(e) => {
              const name = e.target.value;
              setCatForm((p) => ({
                ...p,
                name,
                slug: p.slugTouched ? p.slug : slugify(name),
              }));
            }} required />
            <Input label="Slug" value={catForm.slug} onChange={(e) => setCatForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
            <Button type="submit" disabled={saving || (editCatId ? !canUpdate : !canCreate)}>Save category</Button>
          </form>
          <ul className="space-y-2 rounded-2xl border border-line bg-elevated p-4">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0">
                <button type="button" className="text-left text-sm font-medium hover:text-accent" onClick={() => {
                  setEditCatId(cat.id);
                  setCatForm({ name: cat.name, slug: cat.slug, displayOrder: String(cat.displayOrder ?? 0), isActive: cat.isActive, slugTouched: true });
                }}>
                  {cat.name}
                </button>
                <div className="flex items-center gap-2">
                  <StatusBadge status={cat.isActive ? "ACTIVE" : "INACTIVE"} />
                  <button type="button" className="text-xs text-red-600" onClick={() => canDelete && deleteAdminFaqCategory(cat.id).then(load)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && !loadError && tab === "questions" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveFaq} className="space-y-3 rounded-2xl border border-line bg-elevated p-5">
            <h2 className="font-display text-xl">{editFaqId ? "Edit question" : "New question"}</h2>
            <select value={faqForm.categoryId} onChange={(e) => setFaqForm((p) => ({ ...p, categoryId: e.target.value }))} className="h-12 w-full rounded-xl border border-line px-3 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input label="Question" value={faqForm.question} onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))} required />
            <label className="block text-sm">Answer<textarea value={faqForm.answer} onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" required /></label>
            <Button type="submit" disabled={saving || !categories.length || (editFaqId ? !canUpdate : !canCreate)}>Save FAQ</Button>
          </form>
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto rounded-2xl border border-line bg-elevated p-4">
            {faqs.map((faq) => (
              <li key={faq.id} className="border-b border-line/60 py-3 last:border-0">
                <button type="button" className="text-left text-sm font-medium hover:text-accent" onClick={() => {
                  setEditFaqId(faq.id);
                  setFaqForm({
                    categoryId: faq.categoryId || faq.category?.id || "",
                    question: faq.question,
                    answer: faq.answer,
                    displayOrder: String(faq.displayOrder ?? 0),
                    isActive: faq.isActive,
                  });
                }}>
                  {faq.question}
                </button>
                <p className="mt-1 text-xs text-muted">{faq.category?.name}</p>
                <button type="button" className="mt-1 text-xs text-red-600" onClick={() => canDelete && deleteAdminFaq(faq.id).then(load)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
