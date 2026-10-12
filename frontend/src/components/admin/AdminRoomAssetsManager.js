"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { listAdminMedia } from "@/lib/api/admin-media";
import { slugify } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import {
  createAdminAmenity,
  listAdminAmenities,
  setRoomAmenities,
  setRoomMedia,
} from "@/lib/api/admin-rooms";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { mediaUrl } from "@/lib/utils";

const USAGE_OPTIONS = [
  { value: "hero", label: "Hero" },
  { value: "featured", label: "Featured" },
  { value: "gallery", label: "Gallery" },
];

function amenityIdsFromRoom(room) {
  const rows = Array.isArray(room?.amenities) ? room.amenities : [];
  return rows
    .map((row) => row?.amenity?.id || row?.amenityId || row?.id)
    .filter(Boolean);
}

function mediaItemsFromRoom(room) {
  const rows = Array.isArray(room?.media) ? room.media : [];
  return rows.map((row, index) => ({
    key: row.id || `${row.mediaId}-${index}`,
    mediaId: row.mediaId || row.media?.id || "",
    usage: row.usage || "gallery",
    displayOrder: Number(row.displayOrder ?? index),
    preview: row.media || null,
  }));
}

export default function AdminRoomAssetsManager({ roomId, room, onRoomPatch }) {
  const { admin } = useAdminAuth();
  const canUpdateRoom = hasPermission(admin, "rooms.update");
  const canCreateAmenity = hasPermission(admin, "amenities.create");

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AmenitiesPanel
        roomId={roomId}
        room={room}
        canUpdate={canUpdateRoom}
        canCreate={canCreateAmenity}
        onRoomPatch={onRoomPatch}
      />
      <MediaPanel
        roomId={roomId}
        room={room}
        canUpdate={canUpdateRoom}
        onRoomPatch={onRoomPatch}
      />
    </div>
  );
}

function AmenitiesPanel({ roomId, room, canUpdate, canCreate, onRoomPatch }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(() => amenityIdsFromRoom(room));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminAmenities({ page: 1, limit: 100, isActive: "true" });
      setCatalog(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load amenities.");
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setSelected(amenityIdsFromRoom(room));
  }, [room]);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function handleSave() {
    if (!canUpdate) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const amenities = await setRoomAmenities(roomId, selected);
      onRoomPatch?.({ amenities });
      setMessage("Amenities saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save amenities.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const created = await createAdminAmenity({
        name: newName.trim(),
        slug: slugify(newName),
        isActive: true,
      });
      setNewName("");
      await loadCatalog();
      if (created?.id) setSelected((prev) => [...new Set([...prev, created.id])]);
      setMessage(`Created amenity “${created.name || newName}”. Save assignments to attach it.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create amenity.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <div>
        <h2 className="font-display text-xl text-ink">Amenities</h2>
        <p className="mt-1 text-sm text-muted">Tick amenities for this room type, then save.</p>
      </div>

      {loading ? <LoadingState label="Loading amenities" /> : null}

      {!loading ? (
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-line p-3">
          {catalog.length ? catalog.map((amenity) => (
            <label key={amenity.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-accent-soft/50">
              <input
                type="checkbox"
                checked={selected.includes(amenity.id)}
                onChange={() => toggle(amenity.id)}
                disabled={!canUpdate || busy}
              />
              <span>{amenity.name}</span>
            </label>
          )) : (
            <p className="px-2 py-6 text-center text-sm text-muted">No amenities yet. Create one below.</p>
          )}
        </div>
      ) : null}

      {canCreate ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="New amenity"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Lake view"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={busy || !newName.trim()}>
            Add
          </Button>
        </form>
      ) : null}

      {canUpdate ? (
        <Button type="button" onClick={handleSave} disabled={busy || loading}>
          {busy ? "Saving…" : "Save amenities"}
        </Button>
      ) : (
        <p className="text-xs text-muted">You need rooms.update to change amenities.</p>
      )}

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}

function MediaPanel({ roomId, room, canUpdate, onRoomPatch }) {
  const [library, setLibrary] = useState([]);
  const [items, setItems] = useState(() => mediaItemsFromRoom(room));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pickId, setPickId] = useState("");
  const [pickUsage, setPickUsage] = useState("gallery");

  useEffect(() => {
    let active = true;
    listAdminMedia({ limit: 60 })
      .then((data) => {
        if (active) setLibrary(data.items);
      })
      .catch(() => {
        if (active) setLibrary([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setItems(mediaItemsFromRoom(room));
  }, [room]);

  const libraryById = useMemo(() => {
    const map = new Map(library.map((item) => [item.id, item]));
    return map;
  }, [library]);

  function addItem() {
    if (!pickId) return;
    setItems((prev) => [
      ...prev,
      {
        key: `${pickId}-${Date.now()}`,
        mediaId: pickId,
        usage: pickUsage,
        displayOrder: prev.length,
        preview: libraryById.get(pickId) || null,
      },
    ]);
    setPickId("");
  }

  function updateItem(key, patch) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((item) => item.key !== key).map((item, index) => ({
      ...item,
      displayOrder: index,
    })));
  }

  function moveItem(key, direction) {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.key === key);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [row] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, row);
      return copy.map((item, order) => ({ ...item, displayOrder: order }));
    });
  }

  async function handleSave() {
    if (!canUpdate) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = items
        .filter((item) => item.mediaId)
        .map((item, index) => ({
          mediaId: item.mediaId,
          usage: item.usage || "gallery",
          displayOrder: index,
        }));
      const media = await setRoomMedia(roomId, payload);
      onRoomPatch?.({ media });
      setMessage("Room media saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save media.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <div>
        <h2 className="font-display text-xl text-ink">Room media</h2>
        <p className="mt-1 text-sm text-muted">
          Attach images from the{" "}
          <Link href="/admin/media" className="text-accent hover:underline">media library</Link>
          . First gallery/hero image is used on listings.
        </p>
      </div>

      {loading ? <LoadingState label="Loading media library" /> : null}

      <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
        <select
          value={pickId}
          onChange={(e) => setPickId(e.target.value)}
          className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
          disabled={!canUpdate}
        >
          <option value="">Select media…</option>
          {library.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.altText || asset.caption || asset.publicId || asset.id}
            </option>
          ))}
        </select>
        <select
          value={pickUsage}
          onChange={(e) => setPickUsage(e.target.value)}
          className="h-12 rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
          disabled={!canUpdate}
        >
          {USAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={addItem} disabled={!canUpdate || !pickId}>
          Add
        </Button>
      </div>

      <ul className="space-y-3">
        {items.length ? items.map((item) => {
          const previewSrc = mediaUrl(item.preview) || mediaUrl(libraryById.get(item.mediaId));
          return (
            <li key={item.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
              {previewSrc ? (
                <img src={previewSrc} alt="" className="h-16 w-24 rounded-lg object-cover border border-line" />
              ) : (
                <div className="h-16 w-24 rounded-lg bg-accent-soft" />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="truncate text-xs text-muted">{item.mediaId}</p>
                <select
                  value={item.usage}
                  onChange={(e) => updateItem(item.key, { usage: e.target.value })}
                  className="h-10 w-full max-w-[10rem] rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
                  disabled={!canUpdate}
                >
                  {USAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="text-xs text-ink hover:underline" disabled={!canUpdate} onClick={() => moveItem(item.key, -1)}>Up</button>
                <button type="button" className="text-xs text-ink hover:underline" disabled={!canUpdate} onClick={() => moveItem(item.key, 1)}>Down</button>
                <button type="button" className="text-xs text-red-700 hover:underline" disabled={!canUpdate} onClick={() => removeItem(item.key)}>Remove</button>
              </div>
            </li>
          );
        }) : (
          <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            No media attached yet.
          </li>
        )}
      </ul>

      {canUpdate ? (
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy ? "Saving…" : "Save media"}
        </Button>
      ) : (
        <p className="text-xs text-muted">You need rooms.update to change media.</p>
      )}

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
