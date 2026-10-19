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
  listAdminRestaurantReservations,
  listAdminMenuCategories,
  listAdminMenuItems,
  saveAdminRestaurant,
  updateAdminMenuCategory,
  updateAdminMenuItem,
  updateAdminRestaurantReservationStatus,
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
  const [reservations, setReservations] = useState([]);
  const [reservationStatus, setReservationStatus] = useState("");
  const [reservationFrom, setReservationFrom] = useState("");
  const [reservationTo, setReservationTo] = useState("");
  const [reservationPage, setReservationPage] = useState(1);
  const [reservationPagination, setReservationPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [reservationActionId, setReservationActionId] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
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

  const loadReservations = useCallback(async () => {
    await Promise.resolve();
    setReservationsLoading(true);
    setReservationError("");
    try {
      const result = await listAdminRestaurantReservations({
        page: reservationPage,
        limit: 20,
        status: reservationStatus,
        from: reservationFrom,
        to: reservationTo,
      });
      setReservations(result.items);
      setReservationPagination(result.pagination || { page: reservationPage, pages: 1, total: result.items.length });
    } catch (err) {
      setReservationError(err instanceof ApiError ? err.message : "Unable to load table reservations.");
    } finally {
      setReservationsLoading(false);
    }
  }, [reservationFrom, reservationPage, reservationStatus, reservationTo]);

  useEffect(() => {
    if (tab === "reservations") loadReservations();
  }, [loadReservations, tab]);

  async function changeReservationStatus(reservation, status) {
    setReservationActionId(reservation.id);
    setReservationError("");
    try {
      await updateAdminRestaurantReservationStatus(reservation.id, { status });
      await loadReservations();
    } catch (err) {
      setReservationError(err instanceof ApiError ? err.message : "Unable to update reservation.");
    } finally {
      setReservationActionId("");
    }
  }

  function reservationActions(status) {
    if (status === "REQUESTED") {
      return [["CONFIRMED", "Approve"], ["DECLINED", "Decline"], ["CANCELLED", "Cancel"]];
    }
    if (status === "CONFIRMED") {
      return [["CANCELLED", "Cancel"], ["COMPLETED", "Complete"], ["NO_SHOW", "No-show"]];
    }
    return [];
  }

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
        {["profile", "categories", "menu", "reservations"].map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={cn("rounded-md border px-4 py-2 text-sm font-medium capitalize", tab === id ? "border-accent bg-accent text-white" : "border-line bg-elevated")}>
            {id === "menu" ? "Menu items" : id === "reservations" ? "Reservations" : id}
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

      {!loading && !loadError && tab === "reservations" ? (
        <section className="space-y-5">
          <div>
            <h2 className="font-display text-2xl text-ink">Table reservations</h2>
            <p className="mt-1 text-sm text-muted">Review guest requests and update their status.</p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-line bg-elevated p-4 sm:grid-cols-3">
            <label className="text-xs font-medium text-muted">Status
              <select value={reservationStatus} onChange={(event) => { setReservationPage(1); setReservationStatus(event.target.value); }} className="mt-1 h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink">
                <option value="">All statuses</option>
                {["REQUESTED", "CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED", "NO_SHOW"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">From date
              <input type="date" value={reservationFrom} onChange={(event) => { setReservationPage(1); setReservationFrom(event.target.value); }} className="mt-1 h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink" />
            </label>
            <label className="text-xs font-medium text-muted">To date
              <input type="date" value={reservationTo} onChange={(event) => { setReservationPage(1); setReservationTo(event.target.value); }} className="mt-1 h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink" />
            </label>
          </div>
          {reservationError ? <p role="alert" className="text-sm text-red-600">{reservationError}</p> : null}
          {reservationsLoading ? <LoadingState label="Loading table reservations" /> : null}
          {!reservationsLoading && !reservationError && reservations.length === 0 ? <p className="rounded-2xl border border-line bg-elevated p-6 text-sm text-muted">No table reservations match these filters.</p> : null}
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <article key={reservation.id} className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-ink">{reservation.guestName} <span className="font-normal text-muted">· {reservation.guestCount} guests</span></h3>
                    <p className="mt-1 text-sm text-muted">{reservation.guestEmail || "No email"}{reservation.guestPhone ? ` · ${reservation.guestPhone}` : ""}</p>
                    <p className="mt-2 text-sm text-ink">{String(reservation.reservationDate).slice(0, 10)} · {reservation.reservationTime} · {reservation.mealType}</p>
                    {reservation.dietaryRequests ? <p className="mt-2 text-sm text-muted">Notes: {reservation.dietaryRequests}</p> : null}
                    {reservation.adminRemarks ? <p className="mt-1 text-sm text-muted">Staff notes: {reservation.adminRemarks}</p> : null}
                  </div>
                  <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink">{reservation.status.replace("_", " ")}</span>
                </div>
                {canUpdate && reservationActions(reservation.status).length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reservationActions(reservation.status).map(([status, label]) => (
                      <Button key={status} size="sm" variant={status === "DECLINED" || status === "CANCELLED" || status === "NO_SHOW" ? "danger" : "secondary"} disabled={reservationActionId === reservation.id} onClick={() => changeReservationStatus(reservation, status)}>
                        {reservationActionId === reservation.id ? "Saving…" : label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {reservationPagination.pages > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{reservationPagination.total} requests</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={reservationPage <= 1 || reservationsLoading} onClick={() => setReservationPage((page) => page - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={reservationPage >= reservationPagination.pages || reservationsLoading} onClick={() => setReservationPage((page) => page + 1)}>Next</Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
