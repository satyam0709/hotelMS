"use client";

import { useCallback, useEffect, useState } from "react";
import MediaIdField from "@/components/admin/MediaIdField";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  createAdminMenuCategory,
  createAdminMenuItem,
  deleteAdminMenuCategory,
  deleteAdminMenuItem,
  getAdminRestaurant,
  listAdminMenuCategories,
  listAdminMenuItems,
  saveAdminRestaurant,
  updateAdminMenuCategory,
  updateAdminMenuItem,
} from "@/lib/api/admin-restaurant";
import { emptyToNull, linesToList, listToLines, slugify, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/utils";

const PROFILE_EMPTY = {
  name: "",
  slug: "",
  description: "",
  cuisineText: "",
  breakfastTime: "",
  lunchTime: "",
  dinnerTime: "",
  reservationEnabled: true,
  isActive: true,
  slugTouched: false,
};

export default function AdminRestaurantManager() {
  const { admin } = useAdminAuth();
  const canCreate = hasPermission(admin, "restaurant.create");
  const canUpdate = hasPermission(admin, "restaurant.update");
  const canDelete = hasPermission(admin, "restaurant.delete");
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(PROFILE_EMPTY);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [catForm, setCatForm] = useState({ name: "", displayOrder: "0", isActive: true });
  const [editCatId, setEditCatId] = useState("");
  const [itemForm, setItemForm] = useState({ categoryId: "", name: "", description: "", price: "", mediaId: "", displayOrder: "0", isAvailable: true });
  const [editItemId, setEditItemId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [restaurant, cats, items] = await Promise.all([
        getAdminRestaurant(),
        listAdminMenuCategories({ limit: 100 }),
        listAdminMenuItems({ limit: 200 }),
      ]);
      if (restaurant) {
        setProfile({
          name: restaurant.name || "",
          slug: restaurant.slug || "",
          description: restaurant.description || "",
          cuisineText: listToLines(restaurant.cuisineTypesJson),
          breakfastTime: restaurant.breakfastTime || "",
          lunchTime: restaurant.lunchTime || "",
          dinnerTime: restaurant.dinnerTime || "",
          reservationEnabled: Boolean(restaurant.reservationEnabled),
          isActive: Boolean(restaurant.isActive),
          slugTouched: true,
        });
      }
      setCategories(cats.items);
      setMenuItems(items.items);
      setItemForm((prev) => ({ ...prev, categoryId: prev.categoryId || cats.items[0]?.id || "" }));
    } catch {
      setLoadError("Unable to load restaurant data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const cuisines = linesToList(profile.cuisineText);
    const payload = {
      name: profile.name.trim(),
      slug: slugify(profile.slug || profile.name),
      description: emptyToNull(profile.description),
      cuisineTypesJson: cuisines.length ? cuisines : null,
      breakfastTime: emptyToNull(profile.breakfastTime),
      lunchTime: emptyToNull(profile.lunchTime),
      dinnerTime: emptyToNull(profile.dinnerTime),
      reservationEnabled: Boolean(profile.reservationEnabled),
      isActive: Boolean(profile.isActive),
    };
    try {
      await saveAdminRestaurant(payload);
      setMessage("Restaurant profile saved.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save restaurant.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { name: catForm.name.trim(), displayOrder: toOptionalNumber(catForm.displayOrder) ?? 0, isActive: Boolean(catForm.isActive) };
    try {
      if (editCatId) await updateAdminMenuCategory(editCatId, payload);
      else await createAdminMenuCategory(payload);
      setEditCatId("");
      setCatForm({ name: "", displayOrder: "0", isActive: true });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(e) {
    e.preventDefault();
    if (!itemForm.categoryId) {
      setError("Select a menu category.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      categoryId: itemForm.categoryId,
      name: itemForm.name.trim(),
      description: emptyToNull(itemForm.description),
      price: toOptionalNumber(itemForm.price),
      mediaId: emptyToNull(itemForm.mediaId),
      displayOrder: toOptionalNumber(itemForm.displayOrder) ?? 0,
      isAvailable: Boolean(itemForm.isAvailable),
    };
    try {
      if (editItemId) await updateAdminMenuItem(editItemId, payload);
      else await createAdminMenuItem(payload);
      setEditItemId("");
      setItemForm({ categoryId: categories[0]?.id || "", name: "", description: "", price: "", mediaId: "", displayOrder: "0", isAvailable: true });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save menu item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Restaurant & dining</h1>
        <p className="mt-2 text-sm text-muted">Public /restaurant page — profile, hours, and menu.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["profile", "categories", "menu"].map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={cn("rounded-md border px-4 py-2 text-sm font-medium capitalize", tab === id ? "border-accent bg-accent text-white" : "border-line bg-elevated")}>
            {id === "menu" ? "Menu items" : id}
          </button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading restaurant" /> : null}
      {loadError ? <ErrorState title="Restaurant unavailable" description={loadError} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {!loading && !loadError && tab === "profile" ? (
        <form onSubmit={saveProfile} className="max-w-xl space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <Input label="Name" value={profile.name} onChange={(e) => {
            const name = e.target.value;
            setProfile((p) => ({ ...p, name, slug: p.slugTouched ? p.slug : slugify(name) }));
          }} required />
          <Input label="Slug" value={profile.slug} onChange={(e) => setProfile((p) => ({ ...p, slug: e.target.value, slugTouched: true }))} required />
          <label className="block text-sm">Description<textarea value={profile.description} onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
          <label className="block text-sm">Cuisine types (one per line)<textarea value={profile.cuisineText} onChange={(e) => setProfile((p) => ({ ...p, cuisineText: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Breakfast" value={profile.breakfastTime} onChange={(e) => setProfile((p) => ({ ...p, breakfastTime: e.target.value }))} />
            <Input label="Lunch" value={profile.lunchTime} onChange={(e) => setProfile((p) => ({ ...p, lunchTime: e.target.value }))} />
            <Input label="Dinner" value={profile.dinnerTime} onChange={(e) => setProfile((p) => ({ ...p, dinnerTime: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profile.reservationEnabled} onChange={(e) => setProfile((p) => ({ ...p, reservationEnabled: e.target.checked }))} />Reservations enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profile.isActive} onChange={(e) => setProfile((p) => ({ ...p, isActive: e.target.checked }))} />Active on site</label>
          <Button type="submit" disabled={saving || !canUpdate}>Save profile</Button>
        </form>
      ) : null}

      {!loading && !loadError && tab === "categories" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveCategory} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editCatId ? "Edit category" : "New category"}</h2>
            <Input label="Name" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} required />
            <Input label="Display order" type="number" min="0" value={catForm.displayOrder} onChange={(e) => setCatForm((p) => ({ ...p, displayOrder: e.target.value }))} />
            <Button type="submit" disabled={saving || (editCatId ? !canUpdate : !canCreate)}>Save category</Button>
          </form>
          <ul className="space-y-2 rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {categories.map((cat) => (
              <li key={cat.id} className="flex justify-between border-b border-line/60 py-2 last:border-0">
                <button type="button" className="text-sm font-medium hover:text-accent" onClick={() => { setEditCatId(cat.id); setCatForm({ name: cat.name, displayOrder: String(cat.displayOrder ?? 0), isActive: cat.isActive }); }}>{cat.name}</button>
                <button type="button" className="text-xs text-red-600" onClick={() => canDelete && deleteAdminMenuCategory(cat.id).then(load)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && !loadError && tab === "menu" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={saveItem} className="space-y-3 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
            <h2 className="font-display text-xl">{editItemId ? "Edit item" : "New menu item"}</h2>
            <select value={itemForm.categoryId} onChange={(e) => setItemForm((p) => ({ ...p, categoryId: e.target.value }))} className="h-12 w-full rounded-xl border border-line px-3 text-sm">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input label="Name" value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} required />
            <label className="block text-sm">Description<textarea value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm" /></label>
            <Input label="Price" type="number" min="0" step="0.01" value={itemForm.price} onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))} />
            <MediaIdField label="Dish image" value={itemForm.mediaId} onChange={(v) => setItemForm((p) => ({ ...p, mediaId: v }))} />
            <Button type="submit" disabled={saving || !categories.length || (editItemId ? !canUpdate : !canCreate)}>Save item</Button>
          </form>
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto rounded-2xl border border-line bg-elevated p-4 shadow-soft">
            {menuItems.map((item) => (
              <li key={item.id} className="border-b border-line/60 py-2 last:border-0">
                <button type="button" className="text-sm font-medium hover:text-accent" onClick={() => {
                  setEditItemId(item.id);
                  setItemForm({ categoryId: item.categoryId || item.category?.id || "", name: item.name || "", description: item.description || "", price: item.price != null ? String(item.price) : "", mediaId: item.mediaId || item.media?.id || "", displayOrder: String(item.displayOrder ?? 0), isAvailable: Boolean(item.isAvailable) });
                }}>{item.name}</button>
                <button type="button" className="ml-2 text-xs text-red-600" onClick={() => canDelete && deleteAdminMenuItem(item.id).then(load)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
