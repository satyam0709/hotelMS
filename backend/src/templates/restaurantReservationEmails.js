function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createAdminRestaurantReservationEmail(reservation) {
  const guestName = String(reservation.guestName || "Guest").replace(/[\r\n]+/g, " ").slice(0, 160);
  const subject = `New table reservation request: ${guestName}`;
  const details = [
    ["Restaurant", reservation.restaurantName],
    ["Guest", reservation.guestName],
    ["Email", reservation.guestEmail || "-"],
    ["Phone", reservation.guestPhone || "-"],
    ["Guests", reservation.guestCount],
    ["Meal", reservation.mealType],
    ["Date", new Date(reservation.reservationDate).toISOString().slice(0, 10)],
    ["Time", reservation.reservationTime],
    ["Dietary requests", reservation.dietaryRequests || "-"],
    ["Status", reservation.status],
  ];
  const text = [
    "A new restaurant table reservation request was submitted.",
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    "The request is not confirmed until staff updates its status.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a2e0a">
      <h2>New table reservation request</h2>
      <table style="border-collapse:collapse">
        ${details.map(([label, value]) => `<tr><th style="padding:6px 12px 6px 0;text-align:left">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`).join("")}
      </table>
      <p>This request is not confirmed until staff updates its status.</p>
    </div>
  `;
  return { subject, text, html };
}

function createGuestRestaurantReservationStatusEmail(reservation, qrDataUri = "") {
  const statusLabels = {
    CONFIRMED: "confirmed",
    DECLINED: "declined",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    NO_SHOW: "marked as a no-show",
  };
  const isConfirmed = reservation.status === "CONFIRMED";
  const status = statusLabels[reservation.status] || reservation.status.toLowerCase();
  const resId = String(reservation.id || "").toUpperCase();
  const refCode = resId ? ` [Ref: ${resId.slice(0, 8)}]` : "";
  const subject = isConfirmed
    ? `Table booking confirmed - ${reservation.restaurantName || "ExoStay Restaurant"}${refCode}`
    : `Table reservation request has been ${status}`;
  const date = new Date(reservation.reservationDate).toISOString().slice(0, 10);
  const text = [
    `Hello ${reservation.guestName},`,
    "",
    `Your table request at ${reservation.restaurantName || "our restaurant"} has been ${status}.`,
    resId ? `Reservation ID: ${resId}` : "",
    `Date: ${date}`,
    `Time: ${reservation.reservationTime}`,
    `Guests: ${reservation.guestCount}`,
    `Meal: ${reservation.mealType}`,
    reservation.adminRemarks ? `Restaurant Note: ${reservation.adminRemarks}` : "",
    "",
    isConfirmed ? "We look forward to welcoming you! Please present your QR code pass upon arrival." : "We apologize for any inconvenience caused.",
  ].filter(Boolean).join("\n");

  const headerBg = isConfirmed ? "#064e3b" : "#7f1d1d";
  const badgeColor = isConfirmed ? "#059669" : "#dc2626";
  const badgeBg = isConfirmed ? "#ecfdf5" : "#fef2f2";

  const qrSection = qrDataUri
    ? `
      <div style="margin: 24px 0; text-align: center; background: #ffffff; border: 2px dashed #d1d5db; border-radius: 16px; padding: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 15px; font-weight: 700;">Digital Verification QR Pass</h4>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">Show this QR code at the restaurant desk for instant check-in verification</p>
        <img src="${qrDataUri}" alt="Reservation QR Pass" style="width: 170px; height: 170px; display: inline-block; border-radius: 8px; border: 1px solid #e5e7eb;" />
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px; font-family: monospace;">PASS REF: ${escapeHtml(reservation.id.toUpperCase())}</p>
      </div>
    `
    : "";

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fafaf9; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4;">
      <div style="background: ${headerBg}; padding: 28px 24px; text-align: center; color: #ffffff;">
        <p style="margin: 0 0 6px 0; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.85;">ExoStay Luxury Dining</p>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Table Reservation Pass</h1>
      </div>
      <div style="padding: 28px 24px;">
        <div style="display: inline-block; background: ${badgeBg}; color: ${badgeColor}; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-bottom: 20px;">
          ${escapeHtml(status.toUpperCase())}
        </div>
        <p style="font-size: 16px; color: #1c1917; margin: 0 0 18px 0; line-height: 1.5;">
          Hello <strong>${escapeHtml(reservation.guestName)}</strong>,
        </p>
        <p style="font-size: 14px; color: #57534e; margin: 0 0 20px 0; line-height: 1.6;">
          ${
            isConfirmed
              ? "We are delighted to confirm your dining reservation. A reserved table is prepared for your party."
              : "We regret to inform you that we are currently unable to accommodate your reservation for the selected date and time."
          }
        </p>

        <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 14px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; font-weight: 700;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #78716c; width: 40%;">Reservation ID:</td>
              <td style="padding: 6px 0; color: #1c1917; font-weight: 600; font-family: monospace;">${escapeHtml(resId ? resId.slice(0, 10) : "-")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #78716c;">Restaurant:</td>
              <td style="padding: 6px 0; color: #1c1917; font-weight: 600;">${escapeHtml(reservation.restaurantName || "ExoBistro & Bar")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #78716c;">Date:</td>
              <td style="padding: 6px 0; color: #1c1917; font-weight: 600;">${escapeHtml(date)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #78716c;">Time:</td>
              <td style="padding: 6px 0; color: #1c1917; font-weight: 600;">${escapeHtml(reservation.reservationTime)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #78716c;">Guests:</td>
              <td style="padding: 6px 0; color: #1c1917; font-weight: 600;">${escapeHtml(reservation.guestCount)} guest(s)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #78716c;">Meal:</td>
              <td style="padding: 6px 0; color: #1c1917; font-weight: 600;">${escapeHtml(reservation.mealType)}</td>
            </tr>
            ${
              reservation.dietaryRequests
                ? `<tr><td style="padding: 6px 0; color: #78716c;">Requests:</td><td style="padding: 6px 0; color: #1c1917;">${escapeHtml(reservation.dietaryRequests)}</td></tr>`
                : ""
            }
          </table>
        </div>

        ${
          reservation.adminRemarks
            ? `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #166534;">
              <strong>Staff Note:</strong> ${escapeHtml(reservation.adminRemarks)}
            </p>
          </div>
        `
            : ""
        }

        ${qrSection}

        <div style="border-top: 1px solid #e7e5e4; padding-top: 18px; margin-top: 24px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #a8a29e;">
            For modifications or assistance, please contact our concierge team at support@exostay.com
          </p>
        </div>
      </div>
    </div>
  `;
  return { subject, text, html };
}

module.exports = {
  createAdminRestaurantReservationEmail,
  createGuestRestaurantReservationStatusEmail,
};
