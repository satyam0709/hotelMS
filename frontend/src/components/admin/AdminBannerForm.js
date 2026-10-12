"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import MediaIdField from "@/components/admin/MediaIdField";
import {
  createAdminBanner,
  getAdminBanner,
  updateAdminBanner,
} from "@/lib/api/admin-banners";
import { emptyToNull, toDateInput, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  title: "",
  subtitle: "",
  ctaText: "",
  ctaLink: "",
  startDate: "",
  endDate: "",
  displayOrder: "0",
  isActive: true,
  desktopMediaId: "",
  mobileMediaId: "",
  videoMediaId: "",
};

export default function AdminBannerForm({ bannerId }) {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const isNew = !bannerId || bannerId === "new";
  const canWrite = hasPermission(admin, isNew ? "banners.create" : "banners.update");
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isNew) return undefined;
    let active = true;
    (async () => {
      try {
        const data = await getAdminBanner(bannerId);
        if (!active) return;
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          ctaText: data.ctaText || "",
          ctaLink: data.ctaLink || "",
          startDate: toDateInput(data.startDate),
          endDate: toDateInput(data.endDate),
          displayOrder: String(data.displayOrder ?? 0),
          isActive: Boolean(data.isActive),
          desktopMediaId: data.desktopMediaId || data.desktopMedia?.id || "",
          mobileMediaId: data.mobileMediaId || data.mobileMedia?.id || "",
          videoMediaId: data.videoMediaId || data.videoMedia?.id || "",
        });
      } catch {
        if (active) setError("Banner not found or access denied.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bannerId, isNew]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canWrite) return;
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      title: form.title.trim(),
      subtitle: emptyToNull(form.subtitle),
      ctaText: emptyToNull(form.ctaText),
      ctaLink: emptyToNull(form.ctaLink),
      startDate: emptyToNull(form.startDate),
      endDate: emptyToNull(form.endDate),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isActive: Boolean(form.isActive),
      desktopMediaId: emptyToNull(form.desktopMediaId),
      mobileMediaId: emptyToNull(form.mobileMediaId),
      videoMediaId: emptyToNull(form.videoMediaId),
    };
    try {
      if (isNew) {
        const created = await createAdminBanner(payload);
        setMessage("Banner created.");
        router.replace(`/admin/banners/${created.id}`);
        return;
      }
      await updateAdminBanner(bannerId, payload);
      setMessage("Banner saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save banner.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading banner" />;
  if (error && !isNew && !form.title) {
    return (
      <ErrorState
        title="Banner unavailable"
        description={error}
        action={<Button href="/admin/banners">Back to banners</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/banners" className="hover:text-accent">Banners</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{isNew ? "New" : form.title || "Edit"}</span>
      </nav>

      <div>
        <h1 className="font-display text-3xl text-ink">{isNew ? "New banner" : "Edit banner"}</h1>
        <p className="mt-2 text-sm text-muted">
          Text, links, and optional hero images for offers and announcement content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
        <Input
          label="Title"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          required
        />
        <Input
          label="Subtitle"
          value={form.subtitle}
          onChange={(event) => updateField("subtitle", event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="CTA text"
            value={form.ctaText}
            onChange={(event) => updateField("ctaText", event.target.value)}
            placeholder="See offer"
          />
          <Input
            label="CTA link"
            value={form.ctaLink}
            onChange={(event) => updateField("ctaLink", event.target.value)}
            placeholder="/packages or https://…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaIdField
            label="Desktop image"
            value={form.desktopMediaId}
            onChange={(value) => updateField("desktopMediaId", value)}
          />
          <MediaIdField
            label="Mobile image"
            value={form.mobileMediaId}
            onChange={(value) => updateField("mobileMediaId", value)}
          />
        </div>
        <MediaIdField
          label="Hero video (optional)"
          value={form.videoMediaId}
          onChange={(value) => updateField("videoMediaId", value)}
          hint="Upload a VIDEO media asset. Plays muted/looped behind the home hero when set."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(event) => updateField("endDate", event.target.value)}
          />
        </div>
        <Input
          label="Display order"
          type="number"
          min="0"
          value={form.displayOrder}
          onChange={(event) => updateField("displayOrder", event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={Boolean(form.isActive)}
            onChange={(event) => updateField("isActive", event.target.checked)}
          />
          Active on website
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          {canWrite ? (
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Create banner" : "Save changes"}
            </Button>
          ) : null}
          <Button href="/admin/banners" variant="secondary">Cancel</Button>
        </div>
      </form>
    </div>
  );
}
