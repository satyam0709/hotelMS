"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import useAdminRealtime from "@/hooks/useAdminRealtime";
import {
  assignAdminInquiry,
  getAdminInquiry,
  updateAdminInquiry,
  updateInquiryStatus,
} from "@/lib/api/admin-inquiries";
import { cancelAdminBooking } from "@/lib/api/admin-bookings";
import { listAdminUsers } from "@/lib/api/admin-users";
import { ApiError } from "@/lib/api/client";
import { hasPermission } from "@/lib/admin/permissions";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { isCancelRequestInquiry } from "@/lib/booking-transitions";
import { formatDateLabel } from "@/lib/utils";

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"];

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return date.toISOString().slice(0, 10);
}

export default function AdminInquiryDetail({ inquiryId }) {
  const { admin } = useAdminAuth();
  const canUpdate = hasPermission(admin, "inquiries.update");
  const canAssign = hasPermission(admin, "inquiries.assign");
  const canReadUsers = hasPermission(admin, "users.read");
  const canCancelBooking = hasPermission(admin, "bookings.cancel");

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [admins, setAdmins] = useState([]);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await getAdminInquiry(inquiryId);
      setInquiry(data);
      setStatus(data.status || "NEW");
      setAdminRemarks(data.adminRemarks || "");
      setFollowUpDate(toDateInputValue(data.followUpDate));
      setAssignedToId(data.assignedToId || "");
    } catch {
      if (!silent) setError("Inquiry not found or access denied.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminRealtime(
    useCallback((event) => {
      if (event?.type !== "inquiry.created" && event?.type !== "inquiry.updated" && !String(event?.type || "").startsWith("booking.")) {
        return;
      }
      if (event.inquiryId && event.inquiryId !== inquiryId) return;
      load({ silent: true });
    }, [inquiryId, load]),
  );

  useEffect(() => {
    if (!canReadUsers || !canAssign) return undefined;
    let active = true;
    (async () => {
      try {
        const data = await listAdminUsers({ limit: 100, status: "ACTIVE" });
        if (!active) return;
        setAdmins(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (active) setAdmins([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [canReadUsers, canAssign]);

  function applyUpdatedFields(updated) {
    setInquiry((prev) => ({
      ...prev,
      ...updated,
      assignedTo: updated.assignedToId
        ? admins.find((item) => item.id === updated.assignedToId) || prev?.assignedTo
        : null,
    }));
    if (updated.status) setStatus(updated.status);
    if (Object.hasOwn(updated, "adminRemarks")) setAdminRemarks(updated.adminRemarks || "");
    if (Object.hasOwn(updated, "followUpDate")) {
      setFollowUpDate(toDateInputValue(updated.followUpDate));
    }
    if (Object.hasOwn(updated, "assignedToId")) {
      setAssignedToId(updated.assignedToId || "");
    }
  }

  function saveWorkflow() {
    setSaveError("");
    setSaveMessage("");
    startTransition(async () => {
      try {
        if (canUpdate) {
          const payload = {
            status,
            adminRemarks: adminRemarks.trim() || null,
            followUpDate: followUpDate ? new Date(`${followUpDate}T00:00:00.000Z`).toISOString() : null,
          };
          const updated = await updateAdminInquiry(inquiryId, payload);
          applyUpdatedFields(updated);
        } else if (status !== inquiry.status) {
          const updated = await updateInquiryStatus(inquiryId, status);
          applyUpdatedFields(updated);
        }

        if (canAssign && assignedToId !== (inquiry.assignedToId || "")) {
          const assigned = await assignAdminInquiry(inquiryId, assignedToId || null);
          applyUpdatedFields(assigned);
        }

        setSaveMessage("Inquiry updated.");
      } catch (err) {
        setSaveError(err instanceof ApiError ? err.message : "Unable to update inquiry.");
      }
    });
  }

  async function rejectCancelRequest() {
    setSaveError("");
    setSaveMessage("");
    startTransition(async () => {
      try {
        const updated = await updateAdminInquiry(inquiryId, {
          status: "CLOSED",
          adminRemarks: `${adminRemarks.trim() ? `${adminRemarks.trim()}\n` : ""}Cancel request rejected by staff.`,
        });
        applyUpdatedFields(updated);
        setSaveMessage("Cancel request rejected and inquiry closed.");
      } catch (err) {
        setSaveError(err instanceof ApiError ? err.message : "Unable to reject cancel request.");
      }
    });
  }

  async function approveCancelRequest() {
    if (!inquiry?.sourceRefId) return;
    if (!window.confirm("Approve cancel request and cancel the linked booking?")) return;
    setCancelBusy(true);
    setSaveError("");
    setSaveMessage("");
    try {
      await cancelAdminBooking(inquiry.sourceRefId, adminRemarks.trim() || "Approved guest cancel request");
      const updated = await updateAdminInquiry(inquiryId, {
        status: "CONVERTED",
        adminRemarks: `${adminRemarks.trim() ? `${adminRemarks.trim()}\n` : ""}Cancel request approved — booking cancelled.`,
      });
      applyUpdatedFields(updated);
      setSaveMessage("Booking cancelled and inquiry marked converted.");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Unable to approve cancel request.");
    } finally {
      setCancelBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading inquiry" />;
  if (error || !inquiry) {
    return (
      <ErrorState
        title="Inquiry unavailable"
        description={error || "Unknown error"}
        action={<Button href="/admin/inquiries">Back to inquiries</Button>}
      />
    );
  }

  const cancelRequest = isCancelRequestInquiry(inquiry);
  const linkedBookingId = inquiry.sourceRefType === "Booking" ? inquiry.sourceRefId : null;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/admin/inquiries" className="hover:text-accent">Inquiries</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{inquiry.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{inquiry.subject || inquiry.type}</h1>
          <p className="mt-2 text-sm text-muted">
            {inquiry.type} · {formatDateLabel(inquiry.createdAt)}
          </p>
          {cancelRequest ? (
            <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Booking cancel request
            </p>
          ) : null}
        </div>
        <StatusBadge status={inquiry.status} />
      </div>

      {linkedBookingId ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Linked booking</h2>
          <p className="mt-2 text-sm text-muted">
            This inquiry references a booking folio. Open the booking to review stay and payment, or resolve the cancel request here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href={`/admin/bookings/${linkedBookingId}`} size="sm">
              Open booking folio
            </Button>
            {cancelRequest && canCancelBooking && inquiry.status !== "CLOSED" && inquiry.status !== "CONVERTED" ? (
              <>
                <Button type="button" size="sm" disabled={cancelBusy || isPending} onClick={approveCancelRequest}>
                  {cancelBusy ? "Cancelling…" : "Approve & cancel booking"}
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={isPending || cancelBusy} onClick={rejectCancelRequest}>
                  Reject request
                </Button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-xl text-ink">Message</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{inquiry.message}</p>
        </section>

        <aside className="space-y-4 rounded-2xl border border-line bg-elevated p-5 shadow-soft">
          <h2 className="font-display text-lg text-ink">Contact</h2>
          <p className="text-sm font-medium text-ink">{inquiry.name}</p>
          {inquiry.email ? <p className="text-sm text-muted">{inquiry.email}</p> : null}
          {inquiry.phone ? <p className="text-sm text-muted">{inquiry.phone}</p> : null}
          {inquiry.assignedTo?.name ? (
            <p className="text-xs text-muted">Assigned to {inquiry.assignedTo.name}</p>
          ) : null}

          <div className="space-y-3 border-t border-line pt-4">
            <div>
              <label className="text-xs font-medium text-muted">Status</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm"
                disabled={!canUpdate && status === inquiry.status}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
                ))}
              </select>
            </div>

            {canUpdate ? (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-muted">Staff remarks</span>
                  <textarea
                    rows={4}
                    value={adminRemarks}
                    onChange={(event) => setAdminRemarks(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
                    placeholder="Internal notes…"
                  />
                </label>
                <Input
                  label="Follow-up date"
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                />
              </>
            ) : null}

            {canAssign ? (
              <div>
                <label className="text-xs font-medium text-muted">Assigned to</label>
                <select
                  value={assignedToId}
                  onChange={(event) => setAssignedToId(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-line bg-elevated px-3 text-sm"
                >
                  <option value="">Unassigned</option>
                  {admins.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {saveError ? <p className="text-xs text-red-600">{saveError}</p> : null}
            {saveMessage ? <p className="text-xs text-accent">{saveMessage}</p> : null}
            <Button
              type="button"
              className="w-full"
              disabled={isPending || (!canUpdate && !canAssign)}
              onClick={saveWorkflow}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
