"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import MediaIdField from "@/components/admin/MediaIdField";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminGalleryCategory,
  createAdminGalleryItem,
  deleteAdminGalleryCategory,
  deleteAdminGalleryItem,
  listAdminGalleryCategories,
  listAdminGalleryItems,
  updateAdminGalleryCategory,
  updateAdminGalleryItem,
} from "@/lib/api/admin-gallery";
import { emptyToNull, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn, mediaUrl } from "@/lib/utils";

const EMPTY_CATEGORY = {
  name: "",
  slug: "",
  displayOrder: "0",
  isActive: true,
  slugTouched: false,
};

const EMPTY_ITEM = {
  categoryId: "",
  mediaId: "",
  title: "",
  caption: "",
  displayOrder: "0",
  isFeatured: false,
  isActive: true,
};

export default function AdminGalleryManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "gallery.create");
  const canUpdate = hasPermission(admin, "gallery.update");
  const canDelete = hasPermission(admin, "gallery.delete");
  const [tab, setTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [editingItemId, setEditingItemId] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [cats, rows] = await Promise.all([
        listAdminGalleryCategories({ limit: 100 }),
        listAdminGalleryItems({ limit: 100 }),
      ]);
      setCategories(cats.items);
      setItems(rows.items);
      setItemForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || cats.items[0]?.id || "",
      }));
    } catch {
      setLoadError("Unable to load gallery data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateCategoryField(key, value) {
    setCategoryForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !prev.slugTouched) next.slug = slugify(value);
      if (key === "slug") next.slugTouched = true;
      return next;
    });
  }

  function startEditCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      displayOrder: String(category.displayOrder ?? 0),
      isActive: Boolean(category.isActive),
      slugTouched: true,
    });
    setTab("categories");
    setMessage("");
    setError("");
  }

  function resetCategoryForm() {
    setEditingCategoryId("");
    setCategoryForm(EMPTY_CATEGORY);
  }

  async function saveCategory(event) {
    event.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      setError("Category name and slug are required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      name: categoryForm.name.trim(),
      slug: slugify(categoryForm.slug) || categoryForm.slug.trim(),
      displayOrder: toOptionalNumber(categoryForm.displayOrder) ?? 0,
      isActive: Boolean(categoryForm.isActive),
    };
    try {
      if (editingCategoryId) {
        await updateAdminGalleryCategory(editingCategoryId, payload);
        setMessage("Category updated.");
      } else {
        await createAdminGalleryCategory(payload);
        setMessage("Category created.");
      }
      resetCategoryForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(id, name) {
    if (!canDelete) return;
    if (!window.confirm(`Delete category “${name}”? Items in it may become orphaned.`)) return;
    setBusyId(id);
    try {
      await deleteAdminGalleryCategory(id);
      if (editingCategoryId === id) resetCategoryForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete category.");
    } finally {
      setBusyId("");
    }
  }

  function startEditItem(item) {
    setEditingItemId(item.id);
    setItemForm({
      categoryId: item.categoryId || item.category?.id || "",
      mediaId: item.mediaId || item.media?.id || "",
      title: item.title || "",
      caption: item.caption || "",
      displayOrder: String(item.displayOrder ?? 0),
      isFeatured: Boolean(item.isFeatured),
      isActive: Boolean(item.isActive),
    });
    setTab("items");
    setMessage("");
    setError("");
  }

  function resetItemForm() {
    setEditingItemId("");
    setItemForm({
      ...EMPTY_ITEM,
      categoryId: categories[0]?.id || "",
    });
  }

  async function saveItem(event) {
    event.preventDefault();
    if (!itemForm.categoryId || !itemForm.mediaId.trim()) {
      setError("Category and media ID are required for gallery items.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      categoryId: itemForm.categoryId,
      mediaId: itemForm.mediaId.trim(),
      title: emptyToNull(itemForm.title),
      caption: emptyToNull(itemForm.caption),
      displayOrder: toOptionalNumber(itemForm.displayOrder) ?? 0,
      isFeatured: Boolean(itemForm.isFeatured),
      isActive: Boolean(itemForm.isActive),
    };
    try {
      if (editingItemId) {
        await updateAdminGalleryItem(editingItemId, payload);
        setMessage("Gallery item updated.");
      } else {
        await createAdminGalleryItem(payload);
        setMessage("Gallery item created.");
      }
      resetItemForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save gallery item.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id, title) {
    if (!canDelete) return;
    if (!window.confirm(`Delete gallery item “${title || id}”?`)) return;
    setBusyId(id);
    try {
      await deleteAdminGalleryItem(id);
      if (editingItemId === id) resetItemForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete item.");
    } finally {
      setBusyId("");
    }
  }

  const filteredItems = itemFilter
    ? items.filter((item) => item.categoryId === itemFilter || item.category?.id === itemFilter)
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Gallery</h1>
          <p className="mt-2 text-sm text-muted">
            Albums and images for the public gallery page. Categories first, then items.
          </p>
        </div>
        <Link href="/gallery" target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
          View public gallery
        </Link>
      </div>

      <div className="flex gap-2">
        {[
          { id: "categories", label: "Categories" },
          { id: "items", label: "Items" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === option.id
                ? "border-accent bg-accent text-white"
                : "border-line bg-elevated text-ink hover:border-accent/40"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading gallery" /> : null}
      {loadError ? <ErrorState title="Gallery unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !loadError ? (
        tab === "categories" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <form onSubmit={saveCategory} className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
              <h2 className="font-display text-xl text-ink">
                {editingCategoryId ? "Edit category" : "New category"}
              </h2>
              <Input
                label="Name"
                value={categoryForm.name}
                onChange={(event) => updateCategoryField("name", event.target.value)}
                required
              />
              <Input
                label="Slug"
                value={categoryForm.slug}
                onChange={(event) => updateCategoryField("slug", event.target.value)}
                required
              />
              <Input
                label="Display order"
                type="number"
                min="0"
                value={categoryForm.displayOrder}
                onChange={(event) => updateCategoryField("displayOrder", event.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(categoryForm.isActive)}
                  onChange={(event) => updateCategoryField("isActive", event.target.checked)}
                />
                Active
              </label>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving || ((editingCategoryId || editingItemId) ? !canUpdate : !canCreate)}>
                  {saving ? "Saving…" : editingCategoryId ? "Save category" : "Create category"}
                </Button>
                {editingCategoryId ? (
                  <Button type="button" variant="secondary" onClick={resetCategoryForm}>Cancel</Button>
                ) : null}
              </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t border-line/80">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => startEditCategory(category)} className="font-medium text-ink hover:text-accent">
                          {category.name}
                        </button>
                        <p className="text-xs text-muted">/{category.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{category.displayOrder ?? 0}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={category.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={busyId === category.id}
                          onClick={() => removeCategory(category.id, category.name)}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!categories.length ? (
                <p className="px-4 py-10 text-center text-sm text-muted">No categories yet. Create Property, Rooms, Pool, etc.</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <form onSubmit={saveItem} className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
              <h2 className="font-display text-xl text-ink">
                {editingItemId ? "Edit item" : "New gallery item"}
              </h2>
              {!categories.length ? (
                <p className="text-sm text-muted">Create a category first, then add items.</p>
              ) : null}
              <label className="block text-xs font-medium tracking-[0.08em] text-muted uppercase">
                Category
                <select
                  value={itemForm.categoryId}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="mt-1.5 h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <MediaIdField
                label="Image"
                value={itemForm.mediaId}
                onChange={(value) => setItemForm((prev) => ({ ...prev, mediaId: value }))}
              />
              <Input
                label="Title"
                value={itemForm.title}
                onChange={(event) => setItemForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <Input
                label="Caption"
                value={itemForm.caption}
                onChange={(event) => setItemForm((prev) => ({ ...prev, caption: event.target.value }))}
              />
              <Input
                label="Display order"
                type="number"
                min="0"
                value={itemForm.displayOrder}
                onChange={(event) => setItemForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
              />
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(itemForm.isActive)}
                    onChange={(event) => setItemForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(itemForm.isFeatured)}
                    onChange={(event) => setItemForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                  />
                  Featured
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving || !categories.length}>
                  {saving ? "Saving…" : editingItemId ? "Save item" : "Create item"}
                </Button>
                {editingItemId ? (
                  <Button type="button" variant="secondary" onClick={resetItemForm}>Cancel</Button>
                ) : null}
              </div>
            </form>

            <div className="space-y-4">
              <div className="sm:w-56">
                <label className="text-xs font-medium text-muted">Filter by category</label>
                <select
                  value={itemFilter}
                  onChange={(event) => setItemFilter(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const thumb = mediaUrl(item.media);
                      return (
                        <tr key={item.id} className="border-t border-line/80">
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => startEditItem(item)} className="flex items-center gap-3 text-left hover:text-accent">
                              <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-accent-soft">
                                {thumb ? (
                                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                                ) : null}
                              </span>
                              <span>
                                <span className="block font-medium text-ink">{item.title || "Untitled"}</span>
                                {item.caption ? <span className="block text-xs text-muted line-clamp-1">{item.caption}</span> : null}
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted">{item.category?.name || "—"}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => removeItem(item.id, item.title)}
                              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!filteredItems.length ? (
                  <p className="px-4 py-10 text-center text-sm text-muted">No gallery items yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
