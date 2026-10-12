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
  createAdminPackage,
  getAdminPackage,
  updateAdminPackage,
} from "@/lib/api/admin-packages";
import {
  emptyToNull,
  linesToList,
  listToLines,
  slugify,
  toDateInput,
  toOptionalNumber,
} from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  price: "",
  duration: "",
  inclusionsText: "",
  exclusionsText: "",
  terms: "",
  validFrom: "",
  validTo: "",
  displayOrder: "0",
  isFeatured: false,
  isActive: true,
  slugTouched: false,
  bannerMediaId: "",
};

export default function AdminPackageForm({ packageId }) {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const isNew = !packageId || packageId === "new";
  const canWrite = hasPermission(admin, isNew ? "packages.create" : "packages.update");
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
        const data = await getAdminPackage(packageId);
        if (!active) return;
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          price: data.price != null ? String(data.price) : "",
          duration: data.duration || "",
          inclusionsText: listToLines(data.inclusionsJson),
          exclusionsText: listToLines(data.exclusionsJson),
          terms: data.terms || "",
          validFrom: toDateInput(data.validFrom),
          validTo: toDateInput(data.validTo),
          displayOrder: String(data.displayOrder ?? 0),
          isFeatured: Boolean(data.isFeatured),
          isActive: Boolean(data.isActive),
          slugTouched: true,
          bannerMediaId: data.bannerMediaId || data.bannerMedia?.id || "",
        });
      } catch {
        if (active) setError("Package not found or access denied.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [packageId, isNew]);

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !prev.slugTouched) {
        next.slug = slugify(value);
      }
      if (key === "slug") next.slugTouched = true;
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canWrite) return;
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const inclusions = linesToList(form.inclusionsText);
    const exclusions = linesToList(form.exclusionsText);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug) || form.slug.trim(),
      description: emptyToNull(form.description),
      price: toOptionalNumber(form.price),
      duration: emptyToNull(form.duration),
      inclusionsJson: inclusions.length ? inclusions : null,
      exclusionsJson: exclusions.length ? exclusions : null,
      terms: emptyToNull(form.terms),
      validFrom: emptyToNull(form.validFrom),
      validTo: emptyToNull(form.validTo),
      displayOrder: toOptionalNumber(form.displayOrder) ?? 0,
      isFeatured: Boolean(form.isFeatured),
      isActive: Boolean(form.isActive),
      bannerMediaId: emptyToNull(form.bannerMediaId),
    };
    try {
      if (isNew) {
        const created = await createAdminPackage(payload);
        setMessage("Package created.");
        router.replace(`/admin/packages/${created.id}`);
        return;
      }
      await updateAdminPackage(packageId, payload);
      setMessage("Package saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save package.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading package" />;
  if (error && !isNew && !form.name) {
    return (
      <ErrorState
        title="Package unavailable"
        description={error}
        action={<Button href="/admin/packages">Back to packages</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/packages" className="hover:text-accent">Packages</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{isNew ? "New" : form.name || "Edit"}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{isNew ? "New package" : "Edit package"}</h1>
          <p className="mt-2 text-sm text-muted">Pricing, inclusions, and validity for guest package pages.</p>
        </div>
        {!isNew && form.slug ? (
          <Link
            href={`/packages/${form.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            View public page
          </Link>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
        <Input
          label="Name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
        />
        <Input
          label="Slug"
          value={form.slug}
          onChange={(event) => updateField("slug", event.target.value)}
          required
        />
        <label className="block text-sm font-medium text-ink">
          Description
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </label>
        <MediaIdField
          label="Banner image"
          value={form.bannerMediaId}
          onChange={(value) => updateField("bannerMediaId", value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="Leave blank for enquire"
          />
          <Input
            label="Duration"
            value={form.duration}
            onChange={(event) => updateField("duration", event.target.value)}
            placeholder="2 nights / 3 days"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Valid from"
            type="date"
            value={form.validFrom}
            onChange={(event) => updateField("validFrom", event.target.value)}
          />
          <Input
            label="Valid to"
            type="date"
            value={form.validTo}
            onChange={(event) => updateField("validTo", event.target.value)}
          />
        </div>
        <label className="block text-sm font-medium text-ink">
          Inclusions
          <span className="mt-1 block text-xs font-normal text-muted">One item per line</span>
          <textarea
            value={form.inclusionsText}
            onChange={(event) => updateField("inclusionsText", event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Exclusions
          <span className="mt-1 block text-xs font-normal text-muted">One item per line</span>
          <textarea
            value={form.exclusionsText}
            onChange={(event) => updateField("exclusionsText", event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Terms
          <textarea
            value={form.terms}
            onChange={(event) => updateField("terms", event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />
        </label>
        <Input
          label="Display order"
          type="number"
          min="0"
          value={form.displayOrder}
          onChange={(event) => updateField("displayOrder", event.target.value)}
        />
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(form.isActive)}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active on website
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(form.isFeatured)}
              onChange={(event) => updateField("isFeatured", event.target.checked)}
            />
            Featured
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          {canWrite ? (
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Create package" : "Save changes"}
            </Button>
          ) : null}
          <Button href="/admin/packages" variant="secondary">Cancel</Button>
        </div>
      </form>
    </div>
  );
}
