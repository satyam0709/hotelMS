"use client";

import { useState } from "react";
import MediaIdField from "@/components/admin/MediaIdField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updateAdminPageSections } from "@/lib/api/admin-pages";
import { emptyToNull, toOptionalNumber } from "@/lib/api/admin-list";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

function toFormSection(section, index) {
  return {
    id: section.id || "",
    sectionKey: section.sectionKey || `section-${index + 1}`,
    title: section.title || "",
    subtitle: section.subtitle || "",
    description: section.description || "",
    buttonText: section.buttonText || "",
    buttonLink: section.buttonLink || "",
    mediaId: section.mediaId || section.media?.id || "",
    displayOrder: String(section.displayOrder ?? index),
    isEnabled: section.isEnabled !== false,
  };
}

function toPayload(rows) {
  return rows.map((row, index) => ({
    ...(row.id ? { id: row.id } : {}),
    sectionKey: row.sectionKey.trim(),
    title: emptyToNull(row.title),
    subtitle: emptyToNull(row.subtitle),
    description: emptyToNull(row.description),
    buttonText: emptyToNull(row.buttonText),
    buttonLink: emptyToNull(row.buttonLink),
    mediaId: emptyToNull(row.mediaId),
    displayOrder: toOptionalNumber(row.displayOrder) ?? index,
    isEnabled: Boolean(row.isEnabled),
  }));
}

const BLANK = {
  id: "",
  sectionKey: "content",
  title: "",
  subtitle: "",
  description: "",
  buttonText: "",
  buttonLink: "",
  mediaId: "",
  displayOrder: "0",
  isEnabled: true,
};

export default function AdminPageSectionsEditor({ pageId, initialSections = [] }) {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "sections.update");
  const [rows, setRows] = useState(() => initialSections.map(toFormSection));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function updateRow(index, key, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...BLANK, sectionKey: `section-${prev.length + 1}`, displayOrder: String(prev.length) }]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!canUpdate) return;
    if (!pageId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminPageSections(pageId, toPayload(rows));
      const list = Array.isArray(updated) ? updated : updated?.sections || [];
      setRows(list.map(toFormSection));
      setMessage("Sections saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save sections.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Page sections</h2>
          <p className="mt-1 text-sm text-muted">
            Blocks used on public CMS pages (e.g. About). Publish the page after editing.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={addRow}>
          Add section
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No sections yet. Add one to build the page body.</p>
        ) : null}
        {rows.map((row, index) => (
          <div key={row.id || `new-${index}`} className="space-y-3 rounded-xl border border-line/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Section {index + 1}</p>
              <button type="button" className="text-xs text-red-600" onClick={() => removeRow(index)}>
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Section key"
                value={row.sectionKey}
                onChange={(e) => updateRow(index, "sectionKey", e.target.value)}
                required
              />
              <Input
                label="Display order"
                type="number"
                min="0"
                value={row.displayOrder}
                onChange={(e) => updateRow(index, "displayOrder", e.target.value)}
              />
            </div>
            <Input label="Title" value={row.title} onChange={(e) => updateRow(index, "title", e.target.value)} />
            <Input label="Subtitle" value={row.subtitle} onChange={(e) => updateRow(index, "subtitle", e.target.value)} />
            <label className="block text-sm">
              Description
              <textarea
                value={row.description}
                onChange={(e) => updateRow(index, "description", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Button text" value={row.buttonText} onChange={(e) => updateRow(index, "buttonText", e.target.value)} />
              <Input label="Button link" value={row.buttonLink} onChange={(e) => updateRow(index, "buttonLink", e.target.value)} />
            </div>
            <MediaIdField
              label="Section image"
              value={row.mediaId}
              onChange={(value) => updateRow(index, "mediaId", value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.isEnabled}
                onChange={(e) => updateRow(index, "isEnabled", e.target.checked)}
              />
              Enabled on site
            </label>
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-accent">{message}</p> : null}

      <div className="mt-6">
        <Button type="button" onClick={handleSave} disabled={saving || !rows.length || !canUpdate}>
          {saving ? "Saving…" : "Save sections"}
        </Button>
      </div>
    </div>
  );
}
