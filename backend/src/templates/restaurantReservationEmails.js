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

function createGuestRestaurantReservationStatusEmail(reservation) {
  const statusLabels = {
    CONFIRMED: "confirmed",
    DECLINED: "declined",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    NO_SHOW: "marked as a no-show",
  };
  const status = statusLabels[reservation.status] || reservation.status.toLowerCase();
  const subject = `Your restaurant reservation request has been ${status}`;
  const date = new Date(reservation.reservationDate).toISOString().slice(0, 10);
  const text = [
    `Hello ${reservation.guestName},`,
    "",
    `Your table request at ${reservation.restaurantName || "our restaurant"} has been ${status}.`,
    `Date: ${date}`,
    `Time: ${reservation.reservationTime}`,
    `Guests: ${reservation.guestCount}`,
    `Meal: ${reservation.mealType}`,
    reservation.adminRemarks ? `Restaurant note: ${reservation.adminRemarks}` : "",
  ].filter(Boolean).join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a2e0a">
      <p>Hello ${escapeHtml(reservation.guestName)},</p>
      <p>Your table request at ${escapeHtml(reservation.restaurantName || "our restaurant")} has been <strong>${escapeHtml(status)}</strong>.</p>
      <p>${escapeHtml(date)} at ${escapeHtml(reservation.reservationTime)} · ${escapeHtml(reservation.guestCount)} guest(s) · ${escapeHtml(reservation.mealType)}</p>
      ${reservation.adminRemarks ? `<p>Restaurant note: ${escapeHtml(reservation.adminRemarks)}</p>` : ""}
    </div>
  `;
  return { subject, text, html };
}

module.exports = {
  createAdminRestaurantReservationEmail,
  createGuestRestaurantReservationStatusEmail,
};
