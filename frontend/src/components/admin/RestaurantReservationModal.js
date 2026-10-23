"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { getAdminReservationPdfUrl } from "@/lib/api/admin-restaurant";
import { CheckCircle2, XCircle, MessageSquare, Mail, Download, QrCode, Phone, Calendar, Clock, Users, Utensils, AlertCircle } from "lucide-react";

export default function RestaurantReservationModal({
  reservation,
  onClose,
  onUpdateStatus,
  actionLoading,
}) {
  const [remarks, setRemarks] = useState(reservation?.adminRemarks || "");
  const [qrPreview, setQrPreview] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");

  const dateStr = reservation?.reservationDate
    ? String(reservation.reservationDate).slice(0, 10)
    : "";

  useEffect(() => {
    let active = true;
    if (reservation?.id) {
      import("qrcode").then((QRCode) => {
        const payload = JSON.stringify({
          type: "RESTAURANT_RESERVATION",
          id: reservation.id,
          name: reservation.guestName,
          date: dateStr,
          time: reservation.reservationTime,
          guests: reservation.guestCount,
          status: reservation.status,
        });
        QRCode.toDataURL(payload, { width: 220, margin: 1 })
          .then((url) => {
            if (active) setQrPreview(url);
          })
          .catch(() => {});
      }).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [reservation, dateStr]);

  if (!reservation) return null;

  const rawPhone = (reservation.guestPhone || "").replace(/[^0-9+]/g, "");
  const whatsappNumber = rawPhone.replace(/\+/g, "");

  const yesMessage = "*ExoStay Resort - Table Reservation Confirmed* 🍽️✅\n\n" +
    "Dear " + reservation.guestName + ",\n" +
    "We are pleased to inform you that your dining reservation request has been *CONFIRMED*!\n\n" +
    "📋 *Reservation Details:*\n" +
    "- Reference: #" + reservation.id.slice(0, 8).toUpperCase() + "\n" +
    "- Date: " + dateStr + "\n" +
    "- Time: " + reservation.reservationTime + "\n" +
    "- Guests: " + reservation.guestCount + " Persons\n" +
    "- Meal: " + reservation.mealType + "\n" +
    (reservation.dietaryRequests ? "- Special Notes: " + reservation.dietaryRequests + "\n" : "") +
    (remarks ? "- Staff Note: " + remarks + "\n" : "") +
    "\n🎟️ *Digital QR Pass:* Your digital verification pass is ready. Please present it at the restaurant reception desk.\n\n" +
    "Thank you for choosing ExoStay. We look forward to hosting you!";

  const noMessage = "*ExoStay Resort - Table Reservation Update* 🍽️\n\n" +
    "Dear " + reservation.guestName + ",\n" +
    "Thank you for choosing ExoStay. Regrettably, for your requested time (" + reservation.reservationTime + ") and date (" + dateStr + "), *no tables are currently available*.\n\n" +
    (remarks ? "Note from restaurant: " + remarks + "\n\n" : "") +
    "We sincerely apologize for the inconvenience. Would you like to select an alternate time slot or another date? Please let us know, and we will gladly arrange the best table for you.\n\n" +
    "Warm regards,\nExoStay Hospitality Team";

  const openWhatsApp = (isApproved) => {
    if (!whatsappNumber) {
      alert("No guest phone number was provided for this reservation.");
      return;
    }
    const message = isApproved ? yesMessage : noMessage;
    const url = "https://api.whatsapp.com/send?phone=" + encodeURIComponent(whatsappNumber) + "&text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleStatusChangeWithRemarks = async (newStatus) => {
    setNotificationStatus("Sending update and notifying customer...");
    try {
      await onUpdateStatus(reservation, newStatus, remarks);
      setNotificationStatus("Successfully updated status to " + newStatus + " and email notification triggered!");
    } catch {
      setNotificationStatus("Failed to update status. Please try again.");
    }
  };

  const pdfUrl = getAdminReservationPdfUrl(reservation.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-elevated p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <Utensils className="size-3.5" />
                Table Reservation Details
              </span>
              <span
                className={
                  "rounded-full px-3 py-1 text-xs font-bold " +
                  (reservation.status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : reservation.status === "DECLINED" || reservation.status === "CANCELLED"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300")
                }
              >
                {reservation.status}
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl text-ink">{reservation.guestName}</h2>
            <p className="text-xs text-muted">ID: {reservation.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-line/40 hover:text-ink transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* Guest Contact & Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Guest Information</h4>
              <div className="space-y-1.5 text-sm text-ink">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-accent" />
                  <span>{reservation.guestPhone || "No phone provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-accent" />
                  <span className="truncate">{reservation.guestEmail || "No email provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-accent" />
                  <span>{reservation.guestCount} Guest(s)</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Schedule & Dining</h4>
              <div className="space-y-1.5 text-sm text-ink">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-accent" />
                  <span>{dateStr || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-accent" />
                  <span>{reservation.reservationTime} hrs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Utensils className="size-4 text-accent" />
                  <span>{reservation.mealType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Notes */}
          {reservation.dietaryRequests ? (
            <div className="rounded-2xl border border-line bg-amber-500/5 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Guest Dietary Requests & Notes
              </h4>
              <p className="mt-1 text-sm text-ink leading-relaxed">{reservation.dietaryRequests}</p>
            </div>
          ) : null}

          {/* Verification QR Pass Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-line bg-surface p-4">
            {qrPreview ? (
              <img
                src={qrPreview}
                alt="Reservation QR Code"
                className="size-28 rounded-xl border border-line bg-white p-1 shadow-sm"
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-xl border border-line bg-elevated text-muted">
                <QrCode className="size-8" />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-semibold text-ink flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="size-4 text-brand-green" /> Digital Table Verification Pass
              </h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                Scan upon customer arrival to confirm table reservation. Included in emails, WhatsApp messages, and downloadable PDF pass.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent transition-colors shadow-xs"
                >
                  <Download className="size-3.5" />
                  Download PDF Invoice Pass
                </a>
              </div>
            </div>
          </div>

          {/* Staff Remarks */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Staff Note or Custom Message (included in customer message)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g., Table 4 reserved by poolside. Welcome complimentary drink included."
              rows={2}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {/* Action Decision Section: Option 1 (YES) vs Option 2 (NO) */}
          <div className="rounded-2xl border-2 border-dashed border-line p-5 space-y-4">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <AlertCircle className="size-4 text-accent" />
              Staff Decision & Automated Customer Response
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Option 1: YES */}
              <div className="flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="size-4" /> Option 1: YES (Table Available)
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Confirms table booking. Dispatches pre-filled confirmation email and WhatsApp pass.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={actionLoading || reservation.status === "CONFIRMED"}
                    onClick={() => handleStatusChangeWithRemarks("CONFIRMED")}
                  >
                    <Mail className="size-3.5 mr-1.5" />
                    Send Confirmation Email
                  </Button>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageSquare className="size-3.5" />
                    Open WhatsApp with YES Message
                  </button>
                </div>
              </div>

              {/* Option 2: NO */}
              <div className="flex flex-col justify-between rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                    <XCircle className="size-4" /> Option 2: NO (Table Unavailable)
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Declines booking for selected time and prompts customer with alternate slots.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    className="w-full"
                    disabled={actionLoading || reservation.status === "DECLINED"}
                    onClick={() => handleStatusChangeWithRemarks("DECLINED")}
                  >
                    <Mail className="size-3.5 mr-1.5" />
                    Send Decline Email
                  </Button>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(false)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-600/30 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-800 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                  >
                    <MessageSquare className="size-3.5" />
                    Open WhatsApp with NO Message
                  </button>
                </div>
              </div>
            </div>
          </div>

          {notificationStatus ? (
            <p className="text-center text-xs font-medium text-accent animate-pulse">
              {notificationStatus}
            </p>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
