/** Mirrors backend ALLOWED_TRANSITIONS in booking.service.js */
export const ALLOWED_BOOKING_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED", "PENDING_PAYMENT"],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED", "EXPIRED", "PENDING"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  NO_SHOW: ["REFUNDED"],
  REFUNDED: [],
  EXPIRED: [],
};

export function nextStatusesFor(current) {
  return ALLOWED_BOOKING_TRANSITIONS[current] || [];
}

export function isCancelRequestInquiry(inquiry) {
  if (!inquiry) return false;
  if (inquiry.sourceRefType === "Booking" && inquiry.sourceRefId) {
    const subject = String(inquiry.subject || "").toLowerCase();
    return subject.includes("cancel request") || inquiry.type === "BOOKING";
  }
  return false;
}

export function bookingSearchHref({ roomSlug, packageSlug } = {}) {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  const params = new URLSearchParams({
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
    adults: "2",
    children: "0",
    rooms: "1",
  });
  if (roomSlug) params.set("room", roomSlug);
  if (packageSlug) params.set("package", packageSlug);
  return `/booking?${params.toString()}`;
}
