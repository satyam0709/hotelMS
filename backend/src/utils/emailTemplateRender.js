function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function interpolate(template, variables = {}, { escape = true } = {}) {
  return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    if (value == null) return "";
    const text = String(value);
    return escape ? escapeHtml(text) : text;
  });
}

function bookingVariables(booking = {}) {
  return {
    bookingRef: booking.bookingRef || "",
    guestName: booking.guest?.fullName || "Guest",
    guestEmail: booking.guest?.email || "",
    guestPhone: booking.guest?.phone || "",
    checkIn: booking.checkInDate ? String(booking.checkInDate).slice(0, 10) : "",
    checkOut: booking.checkOutDate ? String(booking.checkOutDate).slice(0, 10) : "",
    totalAmount: booking.totalAmount != null ? String(booking.totalAmount) : "",
    currency: booking.currency || "INR",
    status: booking.status || "",
    cancellationReason: booking.cancellationReason || "",
  };
}

function inquiryVariables(inquiry = {}) {
  return {
    name: inquiry.name || "",
    email: inquiry.email || "",
    phone: inquiry.phone || "",
    type: inquiry.type || "",
    subject: inquiry.subject || "",
    message: inquiry.message || "",
  };
}

module.exports = {
  escapeHtml,
  interpolate,
  bookingVariables,
  inquiryVariables,
};
