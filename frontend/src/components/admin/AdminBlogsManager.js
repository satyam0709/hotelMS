"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminMarkdownEditor from "@/components/admin/AdminMarkdownEditor";
import MediaIdField from "@/components/admin/MediaIdField";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminBlog,
  deleteAdminBlog,
  listAdminBlogs,
  publishAdminBlog,
  updateAdminBlog,
} from "@/lib/api/admin-blogs";
import { emptyToNull, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  title: "",
  slug: "",
  category: "Resort journal",
  excerpt: "",
  content: "",
  authorName: "",
  coverMediaId: "",
  displayOrder: "0",
  isFeatured: false,
  slugTouched: false,
};

export default function AdminBlogsManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "blogs.create");
  const canUpdate = hasPermission(admin, "blogs.update");
  const canDelete = hasPermission(admin, "blogs.delete");
  const canPublish = hasPermission(admin, "blogs.publish");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState("");
  const [editStatus, setEditStatus] = useState("DRAFT");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listAdminBlogs({ limit: 100 });
      setItems(data.items);
    } catch {
      setLoadError("Unable to load blog posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditId("");
    setEditStatus("DRAFT");
    setForm(EMPTY);
  }

  async function handleSave(e) {
    if (editId ? !canUpdate : !canCreate) return;
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      category: emptyToNull(form.category),
      excerpt: emptyToNull(form.excerpt),
      content: form.content.trim(),
      authorName: emptyToNull(form.authorName),
      coverMediaId: emptyToNull(form.coverMediaId),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isFeatured: Boolean(form.isFeatured),
    };
    try {
      if (editId) await updateAdminBlog(editId, payload);
      else await createAdminBlog(payload);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save post.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id) {
    if (!canPublish) return;
    setError("");
    try {
      await publishAdminBlog(id);
      await load();
      if (editId === id) setEditStatus("PUBLISHED");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to publish post.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Blog / journal</h1>
        <p className="mt-2 text-sm text-muted">Published posts appear on /journal and the home journal section.</p>
      </div>

      {loading ? <LoadingState label="Loading posts" /> : null}
      {loadError ? <ErrorState title="Blog unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !loadError ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl">{editId ? "Edit post" : "New post"}</h2>
              {editId ? <StatusBadge status={editStatus} /> : null}
            </div>
            <Input label="Title" value={form.title} onChange={(e) => {
              const title = e.target.value;
              setForm((p) => ({ ...p, title, slug: p.slugTouched ? p.slug : slugify(title) }));
            }} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
            <Input label="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            <Input label="Author" value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} />
            <label className="block text-sm">Excerpt<textarea value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
            <AdminMarkdownEditor
              label="Body"
              value={form.content}
              onChange={(content) => setForm((p) => ({ ...p, content }))}
              rows={14}
              required
            />
            <MediaIdField label="Cover image" value={form.coverMediaId} onChange={(v) => setForm((p) => ({ ...p, coverMediaId: v }))} />
            <Input label="Display order" type="number" min="0" value={form.displayOrder} onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))} />Featured</label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || (editId ? !canUpdate : !canCreate)}>Save draft</Button>
              {editId && editStatus !== "PUBLISHED" && canPublish ? (
                <Button type="button" variant="secondary" onClick={() => handlePublish(editId)}>
                  Publish
                </Button>
              ) : null}
              {editId ? <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button> : null}
            </div>
          </form>

          <ul className="max-h-[40rem] space-y-2 overflow-y-auto rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {items.map((item) => (
              <li key={item.id} className="border-b border-line/60 py-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => {
                    setEditId(item.id);
                    setEditStatus(item.status || "DRAFT");
                    setForm({
                      title: item.title || "",
                      slug: item.slug || "",
                      category: item.category || "",
                      excerpt: item.excerpt || "",
                      content: item.content || "",
                      authorName: item.authorName || "",
                      coverMediaId: item.coverMediaId || item.coverMedia?.id || "",
                      displayOrder: String(item.displayOrder ?? 0),
                      isFeatured: Boolean(item.isFeatured),
                      slugTouched: true,
                    });
                  }}>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted">/journal/{item.slug}</p>
                  </button>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.status === "PUBLISHED" ? (
                    <Link href={`/journal/${item.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:underline">View</Link>
                  ) : canPublish ? (
                    <button type="button" className="text-xs font-medium text-accent" onClick={() => handlePublish(item.id)}>Publish</button>
                  ) : null}
                  {canDelete ? (
                    <button type="button" className="text-xs text-red-600" onClick={() => deleteAdminBlog(item.id).then(load)}>Delete</button>
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
