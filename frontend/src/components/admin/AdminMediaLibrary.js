"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  deleteAdminMedia,
  listAdminMedia,
  registerAdminMedia,
  uploadAdminMedia,
} from "@/lib/api/admin-media";
import { emptyToNull } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils";

const FOLDER_OPTIONS = [
  { value: "general", label: "General" },
  { value: "banners", label: "Banners" },
  { value: "rooms", label: "Rooms" },
  { value: "gallery", label: "Gallery" },
  { value: "facilities", label: "Facilities" },
  { value: "blogs", label: "Blogs" },
  { value: "restaurant", label: "Restaurant" },
];

export default function AdminMediaLibrary() {
  const { admin } = useAdminAuth();
  const canUpload = hasPermission(admin, "media.upload");
  const canDelete = hasPermission(admin, "media.delete");
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [altText, setAltText] = useState("");
  const [folder, setFolder] = useState("general");

  const [url, setUrl] = useState("");
  const [urlAlt, setUrlAlt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminMedia({ limit: 60 });
      setItems(data.items);
    } catch {
      setError("Unable to load media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function clearUploadForm() {
    setFile(null);
    setPreview("");
    setAltText("");
    setFolder("general");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(event) {
    if (!canUpload) return;
    event.preventDefault();
    if (!file) {
      setError("Choose an image or video file first.");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const asset = await uploadAdminMedia({
        file,
        altText: emptyToNull(altText),
        folder,
      });
      clearUploadForm();
      setMessage(`Uploaded to Cloudinary. Asset ID: ${asset.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (!canUpload) return;
    if (!url.trim()) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const asset = await registerAdminMedia({
        url: url.trim(),
        altText: emptyToNull(urlAlt),
        resourceType: "IMAGE",
        folder: "external",
      });
      setUrl("");
      setUrlAlt("");
      setMessage(`URL registered. Asset ID: ${asset.id}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to register image.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("Remove this media asset from the library?")) return;
    setDeletingId(id);
    setError("");
    try {
      await deleteAdminMedia(id);
      setMessage("Media removed.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete media.");
    } finally {
      setDeletingId("");
    }
  }

  async function copyId(id) {
    try {
      await navigator.clipboard.writeText(id);
      setMessage(`Copied ID: ${id}`);
    } catch {
      setMessage(id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Media library</h1>
        <p className="mt-2 text-sm text-muted">
          Upload images/videos to Cloudinary, or register an external URL. Copy the asset ID into banners, rooms, gallery, and blogs.
        </p>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error && !loading ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleUpload} className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Upload file</h2>
          <p className="text-xs text-muted">JPEG, PNG, WebP, GIF, AVIF, MP4, WebM · max 15 MB. Requires Cloudinary env vars on the API.</p>

          <label className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            />
          </label>

          {preview ? (
            file?.type?.startsWith("video/") ? (
              <video src={preview} controls className="h-36 w-full rounded-lg object-cover border border-line" />
            ) : (
              <img src={preview} alt="" className="h-36 w-full rounded-lg object-cover border border-line" />
            )
          ) : null}

          <Input label="Alt text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image" />

          <label className="flex w-full flex-col gap-1.5">
            <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Folder</span>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-elevated px-3 text-sm text-ink"
            >
              {FOLDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <Button type="submit" disabled={saving || !file || !canUpload}>
            {saving ? "Uploading…" : "Upload to Cloudinary"}
          </Button>
        </form>

        <form onSubmit={handleRegister} className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Register URL</h2>
          <p className="text-xs text-muted">Use when the file is already hosted (CDN, Unsplash, etc.). No Cloudinary required.</p>
          <Input label="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" required />
          <Input label="Alt text" value={urlAlt} onChange={(e) => setUrlAlt(e.target.value)} />
          <Button type="submit" disabled={saving || !canUpload}>{saving ? "Saving…" : "Register URL"}</Button>
        </form>
      </div>

      {loading ? <LoadingState label="Loading media" /> : null}
      {!loading && error && !items.length ? (
        <ErrorState title="Media unavailable" description={error} />
      ) : null}
      {!loading && !items.length && !error ? (
        <p className="text-sm text-muted">No media yet. Upload a file or register a URL above.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const src = mediaUrl(item);
          const isVideo = item.resourceType === "VIDEO";
          return (
            <div key={item.id} className="rounded-xl border border-line bg-elevated p-3 shadow-soft">
              {src && !isVideo ? (
                <img src={src} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />
              ) : src && isVideo ? (
                <video src={src} className="mb-3 h-28 w-full rounded-lg object-cover" muted />
              ) : (
                <div className="mb-3 h-28 rounded-lg bg-accent-soft" />
              )}
              <p className="text-xs font-medium text-ink line-clamp-1">{item.altText || item.publicId || "Untitled"}</p>
              <p className="mt-1 text-[10px] text-muted uppercase tracking-wide">{item.resourceType}{item.format ? ` · ${item.format}` : ""}</p>
              <p className="mt-1 break-all text-[10px] text-muted">{item.id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyId(item.id)}
                  className="rounded-lg border border-line px-2 py-1 text-[11px] text-ink hover:bg-accent-soft"
                >
                  Copy ID
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={!canDelete}
                  disabled={deletingId === item.id}
                  className="rounded-lg border border-line px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === item.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
