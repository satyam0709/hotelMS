const crypto = require("node:crypto");
const prisma = require("../prisma/client");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");
const emailService = require("./email.service");
const realtime = require("../realtime/hub");
const {
  asDatabaseDate,
  quoteRoomStay,
  releaseInventory,
  reserveInventory,
  toDateString,
} = require("./availability.service");

function emitBooking(type, booking) {
  if (!booking) return;
  try {
    realtime.publish(type, {
      bookingId: booking.id || undefined,
      bookingRef: booking.bookingRef || undefined,
      status: booking.status || undefined,
    });
  } catch {
    // Realtime must never break booking flows.
  }
}

const HOLD_TTL_MS = env.bookingHoldTtlMinutes * 60 * 1000;
const MONEY = (value) => Number(Number(value).toFixed(2));

const ALLOWED_TRANSITIONS = {
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

const STATUSES_RELEASING_INVENTORY = new Set(["CANCELLED", "EXPIRED"]);
const STATUSES_HOLDING_INVENTORY = new Set([
  "PENDING",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CHECKED_IN",
]);

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pageWindow(query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

function generateBookingRef() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `HMS-${date}-${rand}`;
}

const guestPublicSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
};

const bookingRoomSelect = {
  id: true,
  roomId: true,
  quantity: true,
  adults: true,
  children: true,
  extraBeds: true,
  nightlyBreakdownJson: true,
  priceSubtotal: true,
  discountAmount: true,
  taxAmount: true,
  totalAmount: true,
  room: {
    select: {
      id: true,
      name: true,
      slug: true,
      roomCode: true,
    },
  },
};

const bookingDetailSelect = {
  id: true,
  bookingRef: true,
  guestId: true,
  checkInDate: true,
  checkOutDate: true,
  adults: true,
  children: true,
  roomCount: true,
  subtotal: true,
  discountAmount: true,
  taxAmount: true,
  extraBedAmount: true,
  totalAmount: true,
  currency: true,
  couponId: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  specialRequests: true,
  expiresAt: true,
  confirmedAt: true,
  cancelledAt: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  guest: { select: guestPublicSelect },
  rooms: { select: bookingRoomSelect },
  statusHistory: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      oldStatus: true,
      newStatus: true,
      note: true,
      createdAt: true,
      changedById: true,
    },
  },
};

async function findOrCreateGuest(tx, guestInput) {
  let existing = null;
  if (guestInput.email) {
    existing = await tx.guest.findFirst({
      where: { email: guestInput.email, deletedAt: null },
      select: { id: true, fullName: true, email: true, phone: true },
    });
  }
  if (!existing && guestInput.phone) {
    existing = await tx.guest.findFirst({
      where: { phone: guestInput.phone, deletedAt: null },
      select: { id: true, fullName: true, email: true, phone: true },
    });
  }

  if (existing) {
    return tx.guest.update({
      where: { id: existing.id },
      data: {
        fullName: guestInput.fullName,
        email: guestInput.email ?? existing.email,
        phone: guestInput.phone ?? existing.phone,
        notes: guestInput.notes === undefined ? undefined : guestInput.notes,
        totalVisits: { increment: 1 },
        lastVisitAt: new Date(),
      },
      select: guestPublicSelect,
    });
  }

  return tx.guest.create({
    data: {
      fullName: guestInput.fullName,
      email: guestInput.email || null,
      phone: guestInput.phone || null,
      notes: guestInput.notes || null,
      totalVisits: 1,
      lastVisitAt: new Date(),
    },
    select: guestPublicSelect,
  });
}

function applyCoupon(subtotal, coupon) {
  if (!coupon) return { discountAmount: 0, couponId: null };
  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = subtotal * (Number(coupon.discountValue) / 100);
  } else {
    discount = Number(coupon.discountValue);
  }
  if (coupon.maxDiscountAmount != null) {
    discount = Math.min(discount, Number(coupon.maxDiscountAmount));
  }
  discount = Math.min(discount, subtotal);
  return { discountAmount: MONEY(discount), couponId: coupon.id };
}

async function resolveCoupon(tx, couponCode, subtotal, checkIn) {
  if (!couponCode) return null;
  const coupon = await tx.coupon.findFirst({
    where: {
      code: couponCode,
      isActive: true,
      deletedAt: null,
    },
  });
  if (!coupon) fail(400, "Coupon code is invalid.", "COUPON_INVALID");

  const checkInDate = asDatabaseDate(checkIn);
  if (coupon.validFrom && checkInDate < coupon.validFrom) {
    fail(400, "Coupon is not yet valid.", "COUPON_INVALID");
  }
  if (coupon.validTo && checkInDate > coupon.validTo) {
    fail(400, "Coupon has expired.", "COUPON_INVALID");
  }
  if (coupon.minBookingAmount != null && subtotal < Number(coupon.minBookingAmount)) {
    fail(400, "Booking amount is below the coupon minimum.", "COUPON_INVALID");
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    fail(400, "Coupon usage limit has been reached.", "COUPON_INVALID");
  }
  return coupon;
}

function computeExtraBedAmount(room, extraBeds, nights, quantity) {
  if (!extraBeds) return 0;
  if (!room.extraBedAllowed) fail(400, "Extra beds are not allowed for this room.", "VALIDATION_ERROR");
  if (room.extraBedCharge == null) fail(400, "Extra bed charge is not configured for this room.", "VALIDATION_ERROR");
  return MONEY(Number(room.extraBedCharge) * extraBeds * nights.length * quantity);
}

function computeTaxAmount(taxable, taxRate) {
  if (!taxRate || taxRate.deletedAt || taxRate.isActive === false) return 0;
  return MONEY(taxable * (Number(taxRate.percentage) / 100));
}

async function createBookingRecord(tx, {
  payload,
  quotes,
  guest,
  coupon,
  status,
  paymentStatus,
  paymentMethod,
  expiresAt,
  confirmedAt,
  adminId = null,
  req = null,
}) {
  const roomCount = quotes.reduce((sum, item) => sum + item.quantity, 0);
  const adults = quotes.reduce((sum, item) => sum + item.adults, 0);
  const children = quotes.reduce((sum, item) => sum + item.children, 0);

  let subtotal = MONEY(quotes.reduce((sum, item) => sum + item.priceSubtotal, 0));
  const extraBedAmount = MONEY(quotes.reduce((sum, item) => sum + item.extraBedAmount, 0));
  const { discountAmount, couponId } = applyCoupon(subtotal, coupon);
  const taxable = MONEY(Math.max(0, subtotal - discountAmount + extraBedAmount));

  // Distribute discount proportionally; tax uses each room's tax rate on its share.
  let remainingDiscount = discountAmount;
  const roomRows = quotes.map((item, index) => {
    const share = subtotal > 0 ? item.priceSubtotal / subtotal : 0;
    let roomDiscount = index === quotes.length - 1
      ? remainingDiscount
      : MONEY(discountAmount * share);
    remainingDiscount = MONEY(remainingDiscount - roomDiscount);
    const roomTaxable = MONEY(Math.max(0, item.priceSubtotal - roomDiscount + item.extraBedAmount));
    const taxAmount = computeTaxAmount(roomTaxable, item.room.taxRate);
    return {
      ...item,
      discountAmount: roomDiscount,
      taxAmount,
      totalAmount: MONEY(roomTaxable + taxAmount),
    };
  });

  const taxAmount = MONEY(roomRows.reduce((sum, item) => sum + item.taxAmount, 0));
  const totalAmount = MONEY(taxable + taxAmount);

  let booking;
  let attempts = 0;
  while (attempts < 5) {
    attempts += 1;
    const bookingRef = generateBookingRef();
    try {
      booking = await tx.booking.create({
        data: {
          bookingRef,
          guestId: guest.id,
          checkInDate: asDatabaseDate(payload.checkIn),
          checkOutDate: asDatabaseDate(payload.checkOut),
          adults,
          children,
          roomCount,
          subtotal,
          discountAmount,
          taxAmount,
          extraBedAmount,
          totalAmount,
          currency: "INR",
          couponId,
          status,
          paymentStatus,
          paymentMethod,
          specialRequests: payload.specialRequests || null,
          expiresAt,
          confirmedAt,
        },
        select: { id: true, bookingRef: true },
      });
      break;
    } catch (error) {
      if (error?.code === "P2002" && attempts < 5) continue;
      throw error;
    }
  }
  if (!booking) fail(500, "Unable to allocate a booking reference.", "INTERNAL_ERROR");

  for (const item of roomRows) {
    await tx.bookingRoom.create({
      data: {
        bookingId: booking.id,
        roomId: item.roomId,
        quantity: item.quantity,
        adults: item.adults,
        children: item.children,
        extraBeds: item.extraBeds,
        nightlyBreakdownJson: item.breakdown,
        priceSubtotal: item.priceSubtotal,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
      },
    });
  }

  if (couponId) {
    const couponRow = await tx.coupon.findUnique({
      where: { id: couponId },
      select: { usageLimit: true },
    });
    if (!couponRow) fail(400, "Coupon code is invalid.", "COUPON_INVALID");
    const couponResult = await tx.coupon.updateMany({
      where: {
        id: couponId,
        ...(couponRow.usageLimit == null
          ? {}
          : { usedCount: { lt: couponRow.usageLimit } }),
      },
      data: { usedCount: { increment: 1 } },
    });
    if (couponResult.count !== 1) {
      fail(400, "Coupon usage limit reached.", "COUPON_INVALID");
    }
  }

  await tx.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      oldStatus: null,
      newStatus: status,
      changedById: adminId,
      note: "Booking created",
    },
  });

  await createActivityLog({
    client: tx,
    userId: adminId,
    module: "bookings",
    action: adminId ? "create" : "public-create",
    entityType: "Booking",
    entityId: booking.id,
    metadata: {
      bookingRef: booking.bookingRef,
      status,
      paymentMethod,
      roomCount,
      totalAmount,
    },
    request: req,
  });

  return booking.id;
}

async function buildQuotes(client, payload) {
  const quotes = [];
  for (const roomRequest of payload.rooms) {
    const quote = await quoteRoomStay(client, {
      roomId: roomRequest.roomId,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      adults: roomRequest.adults,
      children: roomRequest.children,
      quantity: roomRequest.quantity,
    });
    const extraBedAmount = computeExtraBedAmount(
      quote.room,
      roomRequest.extraBeds || 0,
      quote.nights,
      roomRequest.quantity
    );
    quotes.push({
      roomId: roomRequest.roomId,
      room: quote.room,
      quantity: roomRequest.quantity,
      adults: roomRequest.adults,
      children: roomRequest.children,
      extraBeds: roomRequest.extraBeds || 0,
      breakdown: quote.breakdown,
      priceSubtotal: MONEY(quote.subtotal),
      extraBedAmount,
      nights: quote.nights,
    });
  }
  return quotes;
}

function initialStatuses(paymentMethod, confirmImmediately = false) {
  if (confirmImmediately) {
    return {
      status: "CONFIRMED",
      paymentStatus: paymentMethod === "ONLINE" ? "PENDING" : "UNPAID",
      expiresAt: null,
      confirmedAt: new Date(),
    };
  }
  if (paymentMethod === "ONLINE") {
    return {
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      expiresAt: new Date(Date.now() + HOLD_TTL_MS),
      confirmedAt: null,
    };
  }
  return {
    status: "PENDING",
    paymentStatus: "UNPAID",
    expiresAt: new Date(Date.now() + HOLD_TTL_MS),
    confirmedAt: null,
  };
}

async function notifyBookingCreated(booking) {
  try {
    await emailService.sendAdminBookingNotification(booking);
  } catch {
    // Notification failures must not break booking creation.
  }
  if (booking.status === "CONFIRMED" && booking.guest?.email) {
    try {
      await emailService.sendBookingConfirmationEmail(booking);
    } catch {
      // ignore
    }
  }
}

async function assertPaymentMethodAllowed(paymentMethod) {
  const settings = await prisma.websiteSetting.findFirst({
    orderBy: { createdAt: "asc" },
    select: { onlinePaymentEnabled: true, payAtHotelEnabled: true },
  });
  const onlineEnabled = settings?.onlinePaymentEnabled ?? true;
  const hotelEnabled = settings?.payAtHotelEnabled ?? true;
  if (paymentMethod === "ONLINE" && !onlineEnabled) {
    fail(400, "Online payment is currently disabled.", "PAYMENT_METHOD_DISABLED");
  }
  if (paymentMethod === "PAY_AT_HOTEL" && !hotelEnabled) {
    fail(400, "Pay at hotel is currently disabled.", "PAYMENT_METHOD_DISABLED");
  }
  if (!onlineEnabled && !hotelEnabled) {
    fail(503, "Booking payments are temporarily unavailable.", "PAYMENT_UNAVAILABLE");
  }
}

async function createBooking(payload, req = null, options = {}) {
  await expireStaleHolds();
  await assertPaymentMethodAllowed(payload.paymentMethod);

  const booking = await prisma.$transaction(async (tx) => {
    const quotes = await buildQuotes(tx, payload);
    const subtotal = MONEY(quotes.reduce((sum, item) => sum + item.priceSubtotal, 0));
    const coupon = await resolveCoupon(tx, payload.couponCode, subtotal, payload.checkIn);
    const guest = await findOrCreateGuest(tx, payload.guest);
    const statuses = initialStatuses(payload.paymentMethod, options.confirmImmediately);

    for (const item of quotes) {
      await reserveInventory(tx, {
        roomId: item.roomId,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        quantity: item.quantity,
      });
    }

    const bookingId = await createBookingRecord(tx, {
      payload,
      quotes,
      guest,
      coupon,
      ...statuses,
      paymentMethod: payload.paymentMethod,
      adminId: req?.admin?.id || null,
      req,
    });

    return tx.booking.findUnique({
      where: { id: bookingId },
      select: bookingDetailSelect,
    });
  });

  await notifyBookingCreated(booking);
  emitBooking("booking.created", booking);
  return booking;
}

async function createPublicBooking(payload, req) {
  return createBooking(payload, req, { confirmImmediately: false });
}

async function createAdminBooking(payload, req) {
  const { confirmImmediately, ...bookingPayload } = payload;
  return createBooking(bookingPayload, req, { confirmImmediately: Boolean(confirmImmediately) });
}

async function releaseBookingInventory(tx, booking) {
  const checkIn = toDateString(booking.checkInDate);
  const checkOut = toDateString(booking.checkOutDate);
  for (const room of booking.rooms) {
    await releaseInventory(tx, {
      roomId: room.roomId,
      checkIn,
      checkOut,
      quantity: room.quantity,
    });
  }
}

async function transitionBooking(tx, booking, nextStatus, {
  adminId = null,
  note = null,
  cancellationReason = null,
  req = null,
  action = "status",
}) {
  const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    fail(409, `Cannot change booking status from ${booking.status} to ${nextStatus}.`, "INVALID_STATUS_TRANSITION");
  }

  const holdingBefore = STATUSES_HOLDING_INVENTORY.has(booking.status);
  const holdingAfter = STATUSES_HOLDING_INVENTORY.has(nextStatus);
  if (holdingBefore && !holdingAfter) {
    await releaseBookingInventory(tx, booking);
  }

  const data = { status: nextStatus };
  if (nextStatus === "CONFIRMED") {
    data.confirmedAt = new Date();
    data.expiresAt = null;
  }
  if (STATUSES_RELEASING_INVENTORY.has(nextStatus)) {
    data.cancelledAt = new Date();
    data.cancellationReason = cancellationReason || note || null;
    data.expiresAt = null;
  }
  if (nextStatus === "CHECKED_OUT" || nextStatus === "NO_SHOW") {
    data.expiresAt = null;
  }

  const updated = await tx.booking.update({
    where: { id: booking.id },
    data,
    select: { id: true, bookingRef: true, status: true },
  });

  await tx.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus: nextStatus,
      changedById: adminId,
      note: note || cancellationReason || `Status changed to ${nextStatus}`,
    },
  });

  await createActivityLog({
    client: tx,
    userId: adminId,
    module: "bookings",
    action,
    entityType: "Booking",
    entityId: booking.id,
    metadata: {
      bookingRef: booking.bookingRef,
      from: booking.status,
      to: nextStatus,
    },
    request: req,
  });

  return updated;
}

async function loadBookingForTransition(tx, id) {
  const booking = await tx.booking.findFirst({
    where: { id },
    select: {
      id: true,
      bookingRef: true,
      status: true,
      checkInDate: true,
      checkOutDate: true,
      rooms: { select: { roomId: true, quantity: true } },
    },
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");
  return booking;
}

async function updateBookingStatus(id, { status, note }, req) {
  await expireStaleHolds();
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await loadBookingForTransition(tx, id);
    await transitionBooking(tx, booking, status, {
      adminId: req.admin.id,
      note,
      req,
      action: "status",
    });
    return tx.booking.findUnique({ where: { id }, select: bookingDetailSelect });
  });

  if (status === "CONFIRMED" && updated.guest?.email) {
    try {
      await emailService.sendBookingConfirmationEmail(updated);
    } catch {
      // ignore
    }
  }
  emitBooking("booking.updated", updated);
  return updated;
}

async function cancelBooking(id, { reason } = {}, req = null, { isAdmin = false } = {}) {
  await expireStaleHolds();
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await loadBookingForTransition(tx, id);
    await transitionBooking(tx, booking, "CANCELLED", {
      adminId: isAdmin ? req?.admin?.id : null,
      note: reason || "Booking cancelled",
      cancellationReason: reason || "Booking cancelled",
      req,
      action: "cancel",
    });
    return tx.booking.findUnique({ where: { id }, select: bookingDetailSelect });
  });

  if (updated.guest?.email) {
    try {
      await emailService.sendBookingCancellationEmail(updated);
    } catch {
      // ignore
    }
  }
  emitBooking("booking.cancelled", updated);
  return updated;
}

/** Instant self-cancel: unpaid holds only. */
const GUEST_INSTANT_CANCEL_STATUSES = new Set(["PENDING", "PENDING_PAYMENT"]);
/** Staff-review cancel request: confirmed/paid stays. */
const GUEST_CANCEL_REQUEST_STATUSES = new Set(["CONFIRMED", "PENDING_PAYMENT", "PENDING"]);

async function requestGuestCancellation(bookingRef, { email, phone, reason } = {}, req = null) {
  await expireStaleHolds();
  if (!email || !phone) fail(404, "Booking not found.", "NOT_FOUND");

  const booking = await prisma.booking.findFirst({
    where: {
      bookingRef,
      guest: {
        is: {
          deletedAt: null,
          email,
          phone,
        },
      },
    },
    select: {
      id: true,
      bookingRef: true,
      status: true,
      paymentStatus: true,
      guest: { select: { fullName: true, email: true, phone: true } },
    },
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");

  const isPaid = booking.paymentStatus === "PAID" || booking.paymentStatus === "PARTIALLY_REFUNDED";
  const canInstantCancel = GUEST_INSTANT_CANCEL_STATUSES.has(booking.status) && !isPaid;

  if (canInstantCancel) {
    await cancelBooking(
      booking.id,
      { reason: reason || "Cancelled by guest" },
      req,
      { isAdmin: false },
    );
    return getPublicBooking(bookingRef, { email, phone });
  }

  if (!GUEST_CANCEL_REQUEST_STATUSES.has(booking.status) && booking.status !== "CONFIRMED") {
    fail(
      409,
      "This booking cannot be cancelled online. Please contact the hotel.",
      "GUEST_CANCEL_NOT_ALLOWED",
    );
  }

  // Paid / confirmed: open staff workflow (inquiry) without releasing inventory.
  const note = reason || "Guest requested cancellation";
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus: booking.status,
      note: `Cancel request: ${note}`,
    },
  });

  const inquiry = await prisma.inquiry.create({
    data: {
      type: "BOOKING",
      name: booking.guest?.fullName || "Guest",
      email: booking.guest?.email || email,
      phone: booking.guest?.phone || phone,
      subject: `Cancel request ${booking.bookingRef}`,
      message: `Guest requested cancellation for booking ${booking.bookingRef}.\nStatus: ${booking.status}\nPayment: ${booking.paymentStatus}\nReason: ${note}`,
      status: "NEW",
      sourceRefType: "Booking",
      sourceRefId: booking.id,
    },
  });

  try {
    const emailService = require("./email.service");
    await emailService.sendAdminInquiryNotification(inquiry);
  } catch {
    // Cancel-request acceptance must not fail if email delivery fails.
  }

  try {
    const realtime = require("../realtime/hub");
    realtime.publish("inquiry.created", {
      inquiryId: inquiry.id,
      bookingRef: booking.bookingRef,
      bookingId: booking.id,
    });
    realtime.publish("booking.updated", { bookingRef: booking.bookingRef, bookingId: booking.id });
  } catch {
    // ignore
  }

  const publicBooking = await getPublicBooking(bookingRef, { email, phone });
  return { ...publicBooking, cancelRequestSubmitted: true };
}

async function expireStaleHolds() {
  const now = new Date();
  const expired = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "PENDING_PAYMENT"] },
      expiresAt: { lte: now },
    },
    select: {
      id: true,
      bookingRef: true,
      status: true,
      checkInDate: true,
      checkOutDate: true,
      rooms: { select: { roomId: true, quantity: true } },
    },
    take: 100,
  });

  for (const booking of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        const current = await tx.booking.findFirst({
          where: {
            id: booking.id,
            status: { in: ["PENDING", "PENDING_PAYMENT"] },
            expiresAt: { lte: now },
          },
          select: {
            id: true,
            bookingRef: true,
            status: true,
            checkInDate: true,
            checkOutDate: true,
            rooms: { select: { roomId: true, quantity: true } },
          },
        });
        if (!current) return;
        await transitionBooking(tx, current, "EXPIRED", {
          note: "Hold expired",
          action: "expire",
        });
      });
    } catch {
      // Best-effort expiry; concurrent workers may race on the same hold.
    }
  }

  if (expired.length) {
    try {
      realtime.publish("booking.expired", { count: expired.length });
    } catch {
      // ignore
    }
  }

  return { expired: expired.length };
}

async function listAdminBookings(query = {}) {
  await expireStaleHolds();
  const { page, limit, skip } = pageWindow(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.guestId) where.guestId = query.guestId;
  if (query.checkInFrom || query.checkInTo) {
    where.checkInDate = {
      ...(query.checkInFrom ? { gte: asDatabaseDate(query.checkInFrom) } : {}),
      ...(query.checkInTo ? { lte: asDatabaseDate(query.checkInTo) } : {}),
    };
  }
  if (query.checkOutFrom || query.checkOutTo) {
    where.checkOutDate = {
      ...(query.checkOutFrom ? { gte: asDatabaseDate(query.checkOutFrom) } : {}),
      ...(query.checkOutTo ? { lte: asDatabaseDate(query.checkOutTo) } : {}),
    };
  }
  const search = query.search || query.q;
  if (search) {
    where.OR = [
      { bookingRef: { contains: search } },
      { guest: { is: { fullName: { contains: search } } } },
      { guest: { is: { email: { contains: search } } } },
      { guest: { is: { phone: { contains: search } } } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        bookingRef: true,
        checkInDate: true,
        checkOutDate: true,
        adults: true,
        children: true,
        roomCount: true,
        totalAmount: true,
        currency: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        expiresAt: true,
        createdAt: true,
        guest: { select: guestPublicSelect },
        rooms: {
          select: {
            id: true,
            quantity: true,
            room: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getAdminBooking(id) {
  await expireStaleHolds();
  const booking = await prisma.booking.findFirst({
    where: { id },
    select: bookingDetailSelect,
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");
  return booking;
}

async function getPublicBooking(bookingRef, { email, phone } = {}) {
  await expireStaleHolds();
  if (!email || !phone) fail(404, "Booking not found.", "NOT_FOUND");
  const booking = await prisma.booking.findFirst({
    where: {
      bookingRef,
      guest: {
        is: {
          deletedAt: null,
          email,
          phone,
        },
      },
    },
    select: {
      bookingRef: true,
      checkInDate: true,
      checkOutDate: true,
      adults: true,
      children: true,
      roomCount: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      extraBedAmount: true,
      totalAmount: true,
      currency: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      specialRequests: true,
      expiresAt: true,
      confirmedAt: true,
      createdAt: true,
      guest: { select: { fullName: true, email: true, phone: true } },
      rooms: {
        select: {
          quantity: true,
          adults: true,
          children: true,
          extraBeds: true,
          nightlyBreakdownJson: true,
          priceSubtotal: true,
          discountAmount: true,
          taxAmount: true,
          totalAmount: true,
          room: { select: { name: true, slug: true } },
        },
      },
    },
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");
  return booking;
}

module.exports = {
  ALLOWED_TRANSITIONS,
  HOLD_TTL_MS,
  cancelBooking,
  createAdminBooking,
  createPublicBooking,
  expireStaleHolds,
  getAdminBooking,
  getPublicBooking,
  listAdminBookings,
  requestGuestCancellation,
  transitionBooking,
  updateBookingStatus,
};
