"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import MediaIdField from "@/components/admin/MediaIdField";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import AdminPageSectionsEditor from "@/components/admin/AdminPageSectionsEditor";
import {
  createAdminPage,
  deleteAdminPage,
  getAdminPage,
  publishAdminPage,
  updateAdminPage,
} from "@/lib/api/admin-pages";
import { emptyToNull, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  title: "",
  slug: "",
  bannerMediaId: "",
  isVisible: true,
  displayOrder: "0",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  slugTouched: false,
};

export default function AdminPageEditor({ pageId }) {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const isNew = !pageId || pageId === "new";
  const canCreate = hasPermission(admin, "pages.create");
  const canUpdate = hasPermission(admin, "pages.update");
  const canDelete = hasPermission(admin, "pages.delete");
  const canWrite = isNew ? canCreate : canUpdate;

  const [form, setForm] = useState(EMPTY);
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isNew) return undefined;
    let active = true;
    (async () => {
      try {
        const data = await getAdminPage(pageId);
        if (!active) return;
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          bannerMediaId: data.bannerMediaId || data.bannerMedia?.id || "",
          isVisible: Boolean(data.isVisible),
          displayOrder: String(data.displayOrder ?? 0),
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          metaKeywords: data.metaKeywords || "",
          slugTouched: true,
        });
        setSections(data.sections || []);
        setStatus(data.status || "DRAFT");
      } catch {
        if (active) setError("Page not found or access denied.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pageId, isNew]);

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !prev.slugTouched) next.slug = slugify(value);
      if (key === "slug") next.slugTouched = true;
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canWrite) return;
    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug) || form.slug.trim(),
      bannerMediaId: emptyToNull(form.bannerMediaId),
      isVisible: Boolean(form.isVisible),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      metaTitle: emptyToNull(form.metaTitle),
      metaDescription: emptyToNull(form.metaDescription),
      metaKeywords: emptyToNull(form.metaKeywords),
    };
    try {
      if (isNew) {
        const created = await createAdminPage(payload);
        setMessage("Page created.");
        router.replace(`/admin/pages/${created.id}`);
        return;
      }
      const updated = await updateAdminPage(pageId, payload);
      setStatus(updated.status || status);
      setMessage("Page saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save page.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!canUpdate) return;
    setSaving(true);
    setError("");
    try {
      const updated = await publishAdminPage(pageId);
      setStatus(updated.status || "PUBLISHED");
      setMessage("Page published.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to publish page.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canDelete || isNew) return;
    if (!window.confirm(`Delete page “${form.title || "this page"}”? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      await deleteAdminPage(pageId);
      router.replace("/admin/pages");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete page.");
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading page" />;
  if (error && !isNew && !form.title) {
    return (
      <ErrorState
        title="Page unavailable"
        description={error}
        action={<Button href="/admin/pages">Back to pages</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/pages" className="hover:text-accent">Pages</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{isNew ? "New" : form.title || "Edit"}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{isNew ? "New page" : "Edit page"}</h1>
          {!isNew ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              Status: <StatusBadge status={status} />
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && status !== "PUBLISHED" && canUpdate ? (
            <Button type="button" size="sm" onClick={handlePublish} disabled={saving}>
              Publish
            </Button>
          ) : null}
          {!isNew && canDelete ? (
            <Button type="button" size="sm" variant="secondary" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          ) : null}
          {!isNew && form.slug && status === "PUBLISHED" ? (
            <Link href={`/${form.slug}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
              View public URL
            </Link>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
        <Input label="Title" value={form.title} onChange={(e) => updateField("title", e.target.value)} required disabled={!canWrite} />
        <Input label="Slug" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required disabled={!canWrite} />
        <MediaIdField
          label="Banner image"
          value={form.bannerMediaId}
          onChange={(value) => updateField("bannerMediaId", value)}
        />
        <Input
          label="Display order"
          type="number"
          min="0"
          value={form.displayOrder}
          onChange={(e) => updateField("displayOrder", e.target.value)}
          disabled={!canWrite}
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.isVisible} onChange={(e) => updateField("isVisible", e.target.checked)} disabled={!canWrite} />
          Visible when published
        </label>
        <Input
          label="Meta title"
          value={form.metaTitle}
          onChange={(e) => updateField("metaTitle", e.target.value)}
          placeholder="Optional SEO title override"
          disabled={!canWrite}
        />
        <label className="block text-sm font-medium text-ink">
          Meta description
          <textarea
            value={form.metaDescription}
            onChange={(e) => updateField("metaDescription", e.target.value)}
            rows={3}
            placeholder="Optional SEO description"
            disabled={!canWrite}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent disabled:opacity-60"
          />
        </label>
        <Input
          label="Meta keywords"
          value={form.metaKeywords}
          onChange={(e) => updateField("metaKeywords", e.target.value)}
          placeholder="Comma-separated keywords"
          disabled={!canWrite}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          {canWrite ? (
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : isNew ? "Create page" : "Save changes"}</Button>
          ) : null}
          <Button href="/admin/pages" variant="secondary">Cancel</Button>
        </div>
      </form>

      {!isNew ? (
        <AdminPageSectionsEditor pageId={pageId} initialSections={sections} />
      ) : null}
    </div>
  );
}
