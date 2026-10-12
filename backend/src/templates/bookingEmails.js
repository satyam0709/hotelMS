function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatMoney(amount, currency = "INR") {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function createBookingConfirmationEmail(booking) {
  const ref = escapeHtml(booking.bookingRef);
  const guestName = escapeHtml(booking.guest?.fullName || "Guest");
  const checkIn = escapeHtml(formatDate(booking.checkInDate));
  const checkOut = escapeHtml(formatDate(booking.checkOutDate));
  const total = escapeHtml(formatMoney(booking.totalAmount, booking.currency));
  const status = escapeHtml(booking.status);

  return {
    subject: `Booking confirmed — ${booking.bookingRef}`,
    text: [
      `Hello ${booking.guest?.fullName || "Guest"},`,
      "",
      `Your booking ${booking.bookingRef} is confirmed.`,
      `Check-in: ${formatDate(booking.checkInDate)}`,
      `Check-out: ${formatDate(booking.checkOutDate)}`,
      `Total: ${formatMoney(booking.totalAmount, booking.currency)}`,
      `Status: ${booking.status}`,
      "",
      "We look forward to welcoming you.",
    ].join("\n"),
    html: [
      `<p>Hello ${guestName},</p>`,
      `<p>Your booking <strong>${ref}</strong> is confirmed.</p>`,
      `<ul>`,
      `<li>Check-in: ${checkIn}</li>`,
      `<li>Check-out: ${checkOut}</li>`,
      `<li>Total: ${total}</li>`,
      `<li>Status: ${status}</li>`,
      `</ul>`,
      `<p>We look forward to welcoming you.</p>`,
    ].join(""),
  };
}

function createBookingCancellationEmail(booking) {
  const ref = escapeHtml(booking.bookingRef);
  const guestName = escapeHtml(booking.guest?.fullName || "Guest");
  const reason = escapeHtml(booking.cancellationReason || "Cancelled");

  return {
    subject: `Booking cancelled — ${booking.bookingRef}`,
    text: [
      `Hello ${booking.guest?.fullName || "Guest"},`,
      "",
      `Your booking ${booking.bookingRef} has been cancelled.`,
      `Reason: ${booking.cancellationReason || "Cancelled"}`,
      "",
      "If you did not request this, please contact the hotel.",
    ].join("\n"),
    html: [
      `<p>Hello ${guestName},</p>`,
      `<p>Your booking <strong>${ref}</strong> has been cancelled.</p>`,
      `<p>Reason: ${reason}</p>`,
      `<p>If you did not request this, please contact the hotel.</p>`,
    ].join(""),
  };
}

function createAdminBookingNotificationEmail(booking) {
  return {
    subject: `New booking ${booking.bookingRef}`,
    text: [
      `New booking received.`,
      `Reference: ${booking.bookingRef}`,
      `Guest: ${booking.guest?.fullName || ""}`,
      `Email: ${booking.guest?.email || ""}`,
      `Phone: ${booking.guest?.phone || ""}`,
      `Check-in: ${formatDate(booking.checkInDate)}`,
      `Check-out: ${formatDate(booking.checkOutDate)}`,
      `Total: ${formatMoney(booking.totalAmount, booking.currency)}`,
      `Status: ${booking.status}`,
      `Payment: ${booking.paymentStatus} / ${booking.paymentMethod}`,
    ].join("\n"),
    html: [
      `<p>New booking received.</p>`,
      `<ul>`,
      `<li>Reference: ${escapeHtml(booking.bookingRef)}</li>`,
      `<li>Guest: ${escapeHtml(booking.guest?.fullName || "")}</li>`,
      `<li>Email: ${escapeHtml(booking.guest?.email || "")}</li>`,
      `<li>Phone: ${escapeHtml(booking.guest?.phone || "")}</li>`,
      `<li>Check-in: ${escapeHtml(formatDate(booking.checkInDate))}</li>`,
      `<li>Check-out: ${escapeHtml(formatDate(booking.checkOutDate))}</li>`,
      `<li>Total: ${escapeHtml(formatMoney(booking.totalAmount, booking.currency))}</li>`,
      `<li>Status: ${escapeHtml(booking.status)}</li>`,
      `</ul>`,
    ].join(""),
  };
}

function createCheckInReminderEmail(booking) {
  const ref = escapeHtml(booking.bookingRef);
  const guestName = escapeHtml(booking.guest?.fullName || "Guest");
  const checkIn = escapeHtml(formatDate(booking.checkInDate));
  const checkOut = escapeHtml(formatDate(booking.checkOutDate));

  return {
    subject: `Check-in reminder — ${booking.bookingRef}`,
    text: [
      `Hello ${booking.guest?.fullName || "Guest"},`,
      "",
      `This is a friendly reminder that your stay (${booking.bookingRef}) begins tomorrow.`,
      `Check-in: ${formatDate(booking.checkInDate)}`,
      `Check-out: ${formatDate(booking.checkOutDate)}`,
      "",
      "We look forward to welcoming you.",
    ].join("\n"),
    html: [
      `<p>Hello ${guestName},</p>`,
      `<p>This is a friendly reminder that your stay <strong>${ref}</strong> begins tomorrow.</p>`,
      `<ul>`,
      `<li>Check-in: ${checkIn}</li>`,
      `<li>Check-out: ${checkOut}</li>`,
      `</ul>`,
      `<p>We look forward to welcoming you.</p>`,
    ].join(""),
  };
}

module.exports = {
  createAdminBookingNotificationEmail,
  createBookingCancellationEmail,
  createBookingConfirmationEmail,
  createCheckInReminderEmail,
};
