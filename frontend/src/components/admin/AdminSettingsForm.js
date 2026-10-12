"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { ApiError } from "@/lib/api/client";
import { getAdminSettings, updateAdminSettings } from "@/lib/api/admin-settings";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const FIELDS = [
  { key: "websiteName", label: "Website name", required: true },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email", type: "email" },
  { key: "address", label: "Address", multiline: true },
  { key: "receptionHours", label: "Reception hours" },
  { key: "mapUrl", label: "Google Map embed URL", multiline: true },
  { key: "currency", label: "Currency" },
  { key: "timezone", label: "Timezone" },
  { key: "defaultLanguage", label: "Default language" },
  { key: "copyrightText", label: "Copyright text" },
];

const MEDIA_FIELDS = [
  { key: "logoMediaId", label: "Logo media ID" },
  { key: "faviconMediaId", label: "Favicon media ID" },
  { key: "headerLogoMediaId", label: "Header logo media ID" },
  { key: "footerLogoMediaId", label: "Footer logo media ID" },
];

const SEO_FIELDS = [
  { key: "metaTitle", label: "Default meta title" },
  { key: "metaDescription", label: "Default meta description", multiline: true },
  { key: "metaKeywords", label: "Default meta keywords" },
];

function socialEntries(settings) {
  const raw = settings?.socialLinksJson;
  if (Array.isArray(raw)) {
    return raw.map((row) => `${row.label || ""}|${row.href || ""}`).join("\n");
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([label, href]) => `${label}|${href}`).join("\n");
  }
  return "";
}

function parseSocialLines(text) {
  const lines = String(text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const out = {};
  for (const line of lines) {
    const [label, href] = line.split("|").map((part) => part.trim());
    if (label && href) out[label] = href;
  }
  return Object.keys(out).length ? out : null;
}

export default function AdminSettingsForm() {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "settings.update");
  const [form, setForm] = useState(null);
  const [socialText, setSocialText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAdminSettings();
        if (!active) return;
        setForm(data || {});
        setSocialText(socialEntries(data));
      } catch {
        if (active) setError("Unable to load settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canUpdate) return;
    if (!form?.websiteName?.trim()) {
      setError("Website name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        websiteName: form.websiteName.trim(),
        phone: form.phone?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
        receptionHours: form.receptionHours?.trim() || null,
        mapUrl: form.mapUrl?.trim() || null,
        currency: form.currency?.trim() || undefined,
        timezone: form.timezone?.trim() || undefined,
        defaultLanguage: form.defaultLanguage?.trim() || undefined,
        copyrightText: form.copyrightText?.trim() || null,
        logoMediaId: form.logoMediaId?.trim() || null,
        faviconMediaId: form.faviconMediaId?.trim() || null,
        headerLogoMediaId: form.headerLogoMediaId?.trim() || null,
        footerLogoMediaId: form.footerLogoMediaId?.trim() || null,
        metaTitle: form.metaTitle?.trim() || null,
        metaDescription: form.metaDescription?.trim() || null,
        metaKeywords: form.metaKeywords?.trim() || null,
        socialLinksJson: parseSocialLines(socialText),
        onlinePaymentEnabled: Boolean(form.onlinePaymentEnabled),
        payAtHotelEnabled: Boolean(form.payAtHotelEnabled),
      };
      const updated = await updateAdminSettings(payload);
      setForm(updated);
      setSocialText(socialEntries(updated));
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading settings" />;
  if (error && !form) {
    return <ErrorState title="Settings unavailable" description={error} />;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {FIELDS.map((field) => (
        <div key={field.key}>
          {field.multiline ? (
            <label className="block text-sm font-medium text-ink">
              {field.label}
              <textarea
                value={form[field.key] || ""}
                onChange={(event) => updateField(field.key, event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </label>
          ) : (
            <Input
              label={field.label}
              name={field.key}
              type={field.type || "text"}
              value={form[field.key] || ""}
              onChange={(event) => updateField(field.key, event.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-ink">
          Social links
          <span className="mt-1 block text-xs font-normal text-muted">
            One per line: Label|https://url
          </span>
          <textarea
            value={socialText}
            onChange={(event) => setSocialText(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
            placeholder="Instagram|https://instagram.com/..."
          />
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-elevated p-5">
        <h2 className="font-display text-xl text-ink">Brand media</h2>
        <p className="text-sm text-muted">
          Paste media asset IDs from the Media library (logo / favicon / header / footer).
        </p>
        {MEDIA_FIELDS.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            name={field.key}
            value={form[field.key] || ""}
            onChange={(event) => updateField(field.key, event.target.value)}
          />
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-elevated p-5">
        <h2 className="font-display text-xl text-ink">Default SEO</h2>
        {SEO_FIELDS.map((field) => (
          field.multiline ? (
            <label key={field.key} className="block text-sm font-medium text-ink">
              {field.label}
              <textarea
                value={form[field.key] || ""}
                onChange={(event) => updateField(field.key, event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              />
            </label>
          ) : (
            <Input
              key={field.key}
              label={field.label}
              name={field.key}
              value={form[field.key] || ""}
              onChange={(event) => updateField(field.key, event.target.value)}
            />
          )
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-elevated p-5">
        <h2 className="font-display text-xl text-ink">Payment methods</h2>
        <p className="text-sm text-muted">
          Control which checkout options guests can use on the booking form.
        </p>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.onlinePaymentEnabled !== false}
            onChange={(event) => updateField("onlinePaymentEnabled", event.target.checked)}
          />
          Online payment (Razorpay)
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.payAtHotelEnabled !== false}
            onChange={(event) => updateField("payAtHotelEnabled", event.target.checked)}
          />
          Pay at hotel
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      {canUpdate ? (
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      ) : (
        <p className="text-sm text-muted">You have read-only access to settings.</p>
      )}
    </form>
  );
}
