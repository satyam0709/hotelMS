import { apiGet, apiPost } from "@/lib/api/client";

export async function createBooking(payload) {
  return apiPost("/bookings", payload, { timeoutMs: 60000 });
}

export async function getBooking(bookingRef, { email, phone } = {}) {
  return apiGet(`/bookings/${bookingRef}`, {
    query: { email, phone },
    cache: "no-store",
    timeoutMs: 60000,
  });
}

export async function createPaymentOrder({ bookingRef, email, phone }) {
  return apiPost("/payments/razorpay/order", { bookingRef, email, phone }, { timeoutMs: 60000 });
}

export async function verifyPayment(payload) {
  return apiPost("/payments/razorpay/verify", payload, { timeoutMs: 60000 });
}

export async function getInvoice(bookingRef, { email, phone } = {}) {
  return apiGet(`/bookings/${bookingRef}/invoice`, {
    query: { email, phone },
    cache: "no-store",
  });
}

export async function requestBookingCancellation({
  bookingRef,
  email,
  phone,
  reason,
}) {
  return apiPost(`/bookings/${bookingRef}/cancel-request`, {
    email: email || undefined,
    phone: phone || undefined,
    reason: reason || undefined,
  });
}

export function normalizeBookingSearch(searchParams = {}) {
  const adults = Number(searchParams.adults || 2);
  const children = Number(searchParams.children || 0);
  const rooms = Number(searchParams.rooms || 1);

  return {
    checkIn: searchParams.checkIn || "",
    checkOut: searchParams.checkOut || "",
    adults: Number.isFinite(adults) && adults > 0 ? adults : 2,
    children: Number.isFinite(children) && children >= 0 ? children : 0,
    rooms: Number.isFinite(rooms) && rooms > 0 ? rooms : 1,
    category: searchParams.category || undefined,
    room: searchParams.room || undefined,
    roomId: searchParams.roomId || undefined,
  };
}

export function hasValidStayDates({ checkIn, checkOut }) {
  return Boolean(checkIn && checkOut && checkIn < checkOut);
}
