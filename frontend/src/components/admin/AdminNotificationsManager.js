"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import {
  getNotificationSettings,
  listEmailTemplates,
  listNotificationEmailLogs,
  resendEmailLog,
  sendTestEmail,
  updateEmailTemplate,
  updateNotificationSettings,
} from "@/lib/api/admin-notifications";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import { formatDateLabel } from "@/lib/utils";

const EMPTY = {
  smtpHost: "",
  smtpPort: "",
  smtpUser: "",
  smtpPassword: "",
  fromEmail: "",
  adminEmail: "",
  bookingEnabled: true,
  inquiryEnabled: true,
  cancellationEnabled: true,
  checkInReminderEnabled: true,
  hasSmtpPassword: false,
};

export default function AdminNotificationsManager() {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "notifications.update");

  const [form, setForm] = useState(EMPTY);
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editTemplateId, setEditTemplateId] = useState("");
  const [templateForm, setTemplateForm] = useState({
    subject: "",
    bodyText: "",
    bodyHtml: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resendingId, setResendingId] = useState("");
  const [testRecipient, setTestRecipient] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [settings, logPayload, templateRows] = await Promise.all([
        getNotificationSettings(),
        listNotificationEmailLogs({ limit: 30 }),
        listEmailTemplates(),
      ]);
      setForm({
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort != null ? String(settings.smtpPort) : "",
        smtpUser: settings.smtpUser || "",
        smtpPassword: "",
        fromEmail: settings.fromEmail || "",
        adminEmail: settings.adminEmail || "",
        bookingEnabled: Boolean(settings.bookingEnabled),
        inquiryEnabled: Boolean(settings.inquiryEnabled),
        cancellationEnabled: Boolean(settings.cancellationEnabled),
        checkInReminderEnabled: settings.checkInReminderEnabled !== false,
        hasSmtpPassword: Boolean(settings.hasSmtpPassword),
      });
      setLogs(logPayload.items || []);
      setTemplates(Array.isArray(templateRows) ? templateRows : []);
    } catch {
      if (!silent) setError("Unable to load notification settings.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Listen to realtime server-sent events for instant log updates
  useAdminRealtime(
    useCallback((event) => {
      if (event?.type === "email.log" || event?.type?.startsWith("booking.") || event?.type?.startsWith("inquiry.")) {
        load(true);
      }
    }, [load]),
    { enabled: true }
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleSendTest(e) {
    e?.preventDefault();
    if (!canUpdate || testing) return;
    setTesting(true);
    setError("");
    setMessage("");
    try {
      const payload = testRecipient.trim() ? { to: testRecipient.trim() } : {};
      const res = await sendTestEmail(payload);
      if (res?.delivered) {
        setMessage(`Live test email successfully delivered via ${res.channel || "email service"}!`);
      } else {
        setError(`Email service responded: ${res?.reason || "Delivery could not be verified."}`);
      }
      await load(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to trigger test email.");
    } finally {
      setTesting(false);
    }
  }

  async function handleResend(logId) {
    if (!canUpdate || resendingId) return;
    setResendingId(logId);
    setError("");
    setMessage("");
    try {
      const res = await resendEmailLog(logId);
      if (res?.delivered) {
        setMessage("Email re-sent successfully!");
      } else {
        setError(`Email retry result: ${res?.reason || "Failed to deliver."}`);
      }
      await load(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to retry email delivery.");
    } finally {
      setResendingId("");
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!canUpdate) return;
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      smtpHost: form.smtpHost.trim() || null,
      smtpPort: form.smtpPort === "" ? null : Number(form.smtpPort),
      smtpUser: form.smtpUser.trim() || null,
      fromEmail: form.fromEmail.trim() || null,
      adminEmail: form.adminEmail.trim() || null,
      bookingEnabled: Boolean(form.bookingEnabled),
      inquiryEnabled: Boolean(form.inquiryEnabled),
      cancellationEnabled: Boolean(form.cancellationEnabled),
      checkInReminderEnabled: Boolean(form.checkInReminderEnabled),
    };
    if (form.smtpPassword.trim()) {
      payload.smtpPassword = form.smtpPassword.trim();
    }

    try {
      const updated = await updateNotificationSettings(payload);
      setForm((prev) => ({
        ...prev,
        smtpPassword: "",
        hasSmtpPassword: Boolean(updated.hasSmtpPassword),
        smtpHost: updated.smtpHost || "",
        smtpPort: updated.smtpPort != null ? String(updated.smtpPort) : "",
        smtpUser: updated.smtpUser || "",
        fromEmail: updated.fromEmail || "",
        adminEmail: updated.adminEmail || "",
        bookingEnabled: Boolean(updated.bookingEnabled),
        inquiryEnabled: Boolean(updated.inquiryEnabled),
        cancellationEnabled: Boolean(updated.cancellationEnabled),
        checkInReminderEnabled: updated.checkInReminderEnabled !== false,
      }));
      setMessage("Notification settings saved.");
      const logPayload = await listNotificationEmailLogs({ limit: 20 });
      setLogs(logPayload.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save notification settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearPassword() {
    if (!canUpdate) return;
    if (!window.confirm("Clear the stored SMTP password?")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateNotificationSettings({ clearSmtpPassword: true });
      setForm((prev) => ({ ...prev, smtpPassword: "", hasSmtpPassword: Boolean(updated.hasSmtpPassword) }));
      setMessage("SMTP password cleared.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to clear SMTP password.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading notifications" />;
  if (error && !form) {
    return <ErrorState title="Notifications unavailable" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Notifications</h1>
        <p className="mt-2 text-sm text-muted">
          SMTP delivery, admin alert email, and which events should send mail.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-line bg-elevated p-6 shadow-soft">
          <h2 className="font-display text-xl text-ink">Email delivery</h2>
          <Input
            label="SMTP host"
            value={form.smtpHost}
            onChange={(e) => updateField("smtpHost", e.target.value)}
            placeholder="smtp.example.com"
            disabled={!canUpdate}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="SMTP port"
              type="number"
              min="1"
              max="65535"
              value={form.smtpPort}
              onChange={(e) => updateField("smtpPort", e.target.value)}
              placeholder="587"
              disabled={!canUpdate}
            />
            <Input
              label="SMTP user"
              value={form.smtpUser}
              onChange={(e) => updateField("smtpUser", e.target.value)}
              disabled={!canUpdate}
            />
          </div>
          <Input
            label={form.hasSmtpPassword ? "SMTP password (leave blank to keep current)" : "SMTP password"}
            type="password"
            value={form.smtpPassword}
            onChange={(e) => updateField("smtpPassword", e.target.value)}
            autoComplete="new-password"
            disabled={!canUpdate}
          />
          {canUpdate && form.hasSmtpPassword ? (
            <Button type="button" variant="secondary" size="sm" onClick={handleClearPassword} disabled={saving}>
              Clear stored password
            </Button>
          ) : null}
          <Input
            label="From email"
            type="email"
            value={form.fromEmail}
            onChange={(e) => updateField("fromEmail", e.target.value)}
            disabled={!canUpdate}
          />
          <Input
            label="Admin notification email"
            type="email"
            value={form.adminEmail}
            onChange={(e) => updateField("adminEmail", e.target.value)}
            disabled={!canUpdate}
          />

          <div className="space-y-2 rounded-xl border border-line/80 p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Event toggles</p>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.bookingEnabled}
                onChange={(e) => updateField("bookingEnabled", e.target.checked)}
                disabled={!canUpdate}
              />
              Booking confirmation + admin booking alerts
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.inquiryEnabled}
                onChange={(e) => updateField("inquiryEnabled", e.target.checked)}
                disabled={!canUpdate}
              />
              New inquiry alerts
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.cancellationEnabled}
                onChange={(e) => updateField("cancellationEnabled", e.target.checked)}
                disabled={!canUpdate}
              />
              Cancellation emails to guests
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.checkInReminderEnabled}
                onChange={(e) => updateField("checkInReminderEnabled", e.target.checked)}
                disabled={!canUpdate}
              />
              Check-in reminder emails (24h before)
            </label>
          </div>

          {canUpdate ? (
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
          ) : (
            <p className="text-sm text-muted">You have read-only access to notification settings.</p>
          )}

          {canUpdate ? (
            <div className="mt-6 border-t border-line/80 pt-5">
              <h3 className="text-sm font-semibold text-ink">Live test dispatch</h3>
              <p className="mt-1 text-xs text-muted">
                Trigger an instantaneous live test email to verify your SMTP delivery.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="email"
                  placeholder={form.adminEmail || form.fromEmail || "Recipient email"}
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="flex-1 rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink placeholder:text-muted/60"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={testing}
                  onClick={handleSendTest}
                >
                  {testing ? "Sending…" : "Send Test Email"}
                </Button>
              </div>
            </div>
          ) : null}
        </form>

        <section className="overflow-hidden rounded-2xl border border-line bg-elevated shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl text-ink">Recent email log</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live stream
              </span>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => load(false)}>Refresh</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Status</th>
                  {canUpdate ? <th className="px-5 py-3 text-right">Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {logs.length ? logs.map((log) => (
                  <tr key={log.id} className="border-t border-line/80">
                    <td className="px-5 py-3 text-muted">{formatDateLabel(log.createdAt)}</td>
                    <td className="px-5 py-3 text-muted">{log.recipient || "—"}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{log.subject}</p>
                      <p className="text-xs text-muted">{log.templateKey || "—"}</p>
                      {log.errorMessage ? <p className="text-xs text-red-600">{log.errorMessage}</p> : null}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={log.status} /></td>
                    {canUpdate ? (
                      <td className="px-5 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={resendingId === log.id}
                          onClick={() => handleResend(log.id)}
                        >
                          {resendingId === log.id ? "Retrying…" : "Resend"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={canUpdate ? 5 : 4} className="px-5 py-10 text-center text-muted">No email attempts logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
        <div>
          <h2 className="font-display text-xl text-ink">Email templates</h2>
          <p className="mt-1 text-sm text-muted">
            Edit subjects/bodies with variables like {"{{guestName}}"}, {"{{bookingRef}}"}.
          </p>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-accent-soft/40 text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Template</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {templates.length ? templates.map((item) => (
                  <tr key={item.id} className="border-t border-line/80">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="font-medium text-ink hover:text-accent"
                        onClick={() => {
                          setEditTemplateId(item.id);
                          setTemplateForm({
                            subject: item.subject || "",
                            bodyText: item.bodyText || "",
                            bodyHtml: item.bodyHtml || "",
                            isActive: Boolean(item.isActive),
                          });
                        }}
                      >
                        {item.key}
                      </button>
                      <p className="text-xs text-muted">{item.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-muted">No templates yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {editTemplateId ? (
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!canUpdate) return;
                setSaving(true);
                setError("");
                setMessage("");
                try {
                  await updateEmailTemplate(editTemplateId, {
                    subject: templateForm.subject.trim(),
                    bodyText: templateForm.bodyText.trim() || null,
                    bodyHtml: templateForm.bodyHtml.trim() || null,
                    isActive: Boolean(templateForm.isActive),
                  });
                  setMessage("Email template saved.");
                  setEditTemplateId("");
                  await load();
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "Unable to save template.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Input
                label="Subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))}
                required
                disabled={!canUpdate}
              />
              <label className="block text-sm">
                <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Body text</span>
                <textarea
                  value={templateForm.bodyText}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, bodyText: e.target.value }))}
                  rows={5}
                  disabled={!canUpdate}
                  className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Body HTML</span>
                <textarea
                  value={templateForm.bodyHtml}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, bodyHtml: e.target.value }))}
                  rows={5}
                  disabled={!canUpdate}
                  className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm font-mono"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, isActive: e.target.checked }))}
                  disabled={!canUpdate}
                />
                Active
              </label>
              <div className="flex flex-wrap gap-2">
                {canUpdate ? <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save template"}</Button> : null}
                <Button type="button" variant="secondary" onClick={() => setEditTemplateId("")}>Cancel</Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted">Select a template to edit.</p>
          )}
        </div>
      </section>
    </div>
  );
}
