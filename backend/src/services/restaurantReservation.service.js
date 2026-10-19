const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");
const emailService = require("./email.service");
const turnstile = require("../utils/turnstile");

const reservationSelect = {
  id: true,
  restaurantId: true,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  guestCount: true,
  mealType: true,
  reservationDate: true,
  reservationTime: true,
  dietaryRequests: true,
  status: true,
  adminRemarks: true,
  createdAt: true,
  updatedAt: true,
};
const publicNotificationReasons = new Set([
  "admin-email-not-configured",
  "guest-email-not-provided",
  "inquiry-emails-disabled",
  "missing-recipient",
]);

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pageWindow(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function dateStart(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateEnd(value) {
  return new Date(`${value}T23:59:59.999Z`);
}

function notificationOutcome(result) {
  if (result?.delivered) {
    return { delivered: true, ...(result.channel ? { channel: result.channel } : {}) };
  }
  return {
    delivered: false,
    reason: publicNotificationReasons.has(result?.reason) ? result.reason : "delivery-failed",
  };
}

async function createPublicReservation(payload) {
  await turnstile.verifyTurnstileIfConfigured(payload.captchaToken);
  const restaurant = await prisma.restaurant.findFirst({
    where: { deletedAt: null, isActive: true, reservationEnabled: true },
    select: { id: true, name: true },
  });
  if (!restaurant) {
    fail(409, "Restaurant reservations are not currently available.", "RESERVATIONS_DISABLED");
  }

  const settings = await prisma.websiteSetting.findFirst({ select: { timezone: true } });
  const timeZone = settings?.timezone || "Asia/Kolkata";
  let todayParts;
  try {
    todayParts = new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    fail(500, "Website timezone is invalid; update the website settings.", "WEBSITE_TIMEZONE_INVALID");
  }
  const today = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
  const todayDate = `${today.year}-${today.month}-${today.day}`;
  const currentTime = `${today.hour}:${today.minute}`;
  if (payload.reservationDate < todayDate) {
    fail(400, "Reservation date must be today or later.", "RESERVATION_DATE_INVALID");
  }
  if (payload.reservationDate === todayDate && payload.reservationTime < currentTime) {
    fail(400, "Reservation time must be in the future.", "RESERVATION_TIME_INVALID");
  }

  const { captchaToken, reservationDate, ...guestDetails } = payload;
  const reservation = await prisma.restaurantReservation.create({
    data: {
      ...guestDetails,
      restaurantId: restaurant.id,
      reservationDate: dateStart(reservationDate),
      status: "REQUESTED",
    },
    select: reservationSelect,
  });

  let notification = notificationOutcome(null);
  try {
    const result = await emailService.sendAdminRestaurantReservationNotification({
      ...reservation,
      restaurantName: restaurant.name,
    });
    notification = notificationOutcome(result);
  } catch (error) {
    console.error(`[restaurantReservation] Notification failed for ${reservation.id}:`, error?.message || error);
    notification = { delivered: false, reason: "delivery-failed" };
  }

  return { reservation, notification };
}

function listWhere(query = {}) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.reservationDate = {
      ...(query.from ? { gte: dateStart(query.from) } : {}),
      ...(query.to ? { lte: dateEnd(query.to) } : {}),
    };
  }
  if (query.search) {
    where.OR = ["guestName", "guestEmail", "guestPhone"].map((field) => ({
      [field]: { contains: query.search },
    }));
  }
  return where;
}

async function listAdminReservations(query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const where = listWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.restaurantReservation.findMany({
      where,
      select: reservationSelect,
      orderBy: [{ reservationDate: "asc" }, { reservationTime: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.restaurantReservation.count({ where }),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getAdminReservation(id) {
  const reservation = await prisma.restaurantReservation.findUnique({
    where: { id },
    select: { ...reservationSelect, restaurant: { select: { name: true } } },
  });
  if (!reservation) fail(404, "Restaurant reservation not found.", "NOT_FOUND");
  return reservation;
}

const allowedTransitions = {
  REQUESTED: new Set(["CONFIRMED", "DECLINED", "CANCELLED"]),
  CONFIRMED: new Set(["CANCELLED", "COMPLETED", "NO_SHOW"]),
  DECLINED: new Set(),
  CANCELLED: new Set(),
  COMPLETED: new Set(),
  NO_SHOW: new Set(),
};

async function updateAdminReservationStatus(id, payload, req) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.restaurantReservation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) fail(404, "Restaurant reservation not found.", "NOT_FOUND");
    if (existing.status !== payload.status && !allowedTransitions[existing.status]?.has(payload.status)) {
      fail(409, `Cannot change reservation status from ${existing.status} to ${payload.status}.`, "RESERVATION_STATUS_CONFLICT");
    }

    if (existing.status !== payload.status) {
      const changed = await tx.restaurantReservation.updateMany({
        where: { id, status: existing.status },
        data: {
          status: payload.status,
          ...(Object.hasOwn(payload, "adminRemarks") ? { adminRemarks: payload.adminRemarks } : {}),
        },
      });
      if (changed.count !== 1) {
        fail(409, "Reservation status changed concurrently. Refresh and try again.", "RESERVATION_STATUS_CONFLICT");
      }
    } else if (Object.hasOwn(payload, "adminRemarks")) {
      await tx.restaurantReservation.update({
        where: { id },
        data: { adminRemarks: payload.adminRemarks },
      });
    }

    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module: "restaurant",
      action: "reservation.status-update",
      entityType: "RestaurantReservation",
      entityId: id,
      metadata: { oldStatus: existing.status, newStatus: payload.status },
      request: req,
    });

    const reservation = await tx.restaurantReservation.findUnique({
      where: { id },
      select: reservationSelect,
    });
    return { reservation, previousStatus: existing.status };
  });
  let notification = { delivered: false, reason: "status-unchanged" };
  if (result.previousStatus !== payload.status) {
    try {
      const delivery = await emailService.sendRestaurantReservationStatusNotification(result.reservation);
      notification = notificationOutcome(delivery);
    } catch (error) {
      console.error(`[restaurantReservation] Guest status notification failed for ${id}:`, error?.message || error);
      notification = { delivered: false, reason: "delivery-failed" };
    }
  }
  return { reservation: result.reservation, notification };
}

module.exports = {
  createPublicReservation,
  getAdminReservation,
  listAdminReservations,
  updateAdminReservationStatus,
};
