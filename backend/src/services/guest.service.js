const prisma = require("../prisma/client");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");

function fail(statusCode, message, errorCode) {
  throw new AppError(statusCode, message, errorCode);
}

function pagination(query = {}) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  return { page, limit, skip: (page - 1) * limit };
}

function paginated(items, total, page, limit) {
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
}

const guestSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  guestType: true,
  notes: true,
  totalVisits: true,
  lastVisitAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { bookings: true } },
};

const bookingSelect = {
  id: true,
  bookingRef: true,
  status: true,
  paymentStatus: true,
  checkInDate: true,
  checkOutDate: true,
  totalAmount: true,
  currency: true,
  createdAt: true,
  rooms: {
    take: 2,
    select: {
      quantity: true,
      room: { select: { id: true, name: true, roomCode: true } },
    },
  },
};

async function audited(req, { action, entityId, metadata }, operation) {
  return prisma.$transaction(async (tx) => {
    const result = await operation(tx);
    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module: "guests",
      action,
      entityType: "Guest",
      entityId: typeof entityId === "function" ? entityId(result) : entityId,
      metadata: typeof metadata === "function" ? metadata(result) : metadata,
      request: req,
    });
    return result;
  });
}

async function ensureContactUnique(tx, { email, phone, excludeId }) {
  if (email) {
    const clash = await tx.guest.findFirst({
      where: { email, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (clash) fail(409, "Another guest already uses this email.", "CONFLICT");
  }
  if (phone) {
    const clash = await tx.guest.findFirst({
      where: { phone, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (clash) fail(409, "Another guest already uses this phone.", "CONFLICT");
  }
}

async function listGuests(query = {}) {
  const { page, limit, skip } = pagination(query);
  const search = query.search || query.q;
  const where = { deletedAt: null };
  if (query.guestType) where.guestType = query.guestType;
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { guestType: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.guest.findMany({
      where,
      orderBy: [{ lastVisitAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      select: guestSelect,
    }),
    prisma.guest.count({ where }),
  ]);

  return paginated(
    items.map(({ _count, ...item }) => ({
      ...item,
      bookingCount: _count.bookings,
    })),
    total,
    page,
    limit,
  );
}

async function getGuest(id) {
  const guest = await prisma.guest.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...guestSelect,
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: bookingSelect,
      },
    },
  });
  if (!guest) fail(404, "Guest not found.", "NOT_FOUND");
  const { _count, ...rest } = guest;
  return {
    ...rest,
    bookingCount: _count.bookings,
  };
}

async function updateGuest(id, data, req) {
  return audited(req, {
    action: "update",
    entityId: id,
    metadata: { changedFields: Object.keys(data) },
  }, async (tx) => {
    const current = await tx.guest.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, phone: true },
    });
    if (!current) fail(404, "Guest not found.", "NOT_FOUND");

    const nextEmail = Object.hasOwn(data, "email") ? data.email : current.email;
    const nextPhone = Object.hasOwn(data, "phone") ? data.phone : current.phone;
    if (!nextEmail && !nextPhone) {
      fail(400, "Guest must keep at least an email or phone.", "VALIDATION_ERROR");
    }

    await ensureContactUnique(tx, {
      email: Object.hasOwn(data, "email") ? data.email : null,
      phone: Object.hasOwn(data, "phone") ? data.phone : null,
      excludeId: id,
    });

    const updated = await tx.guest.update({
      where: { id },
      data,
      select: guestSelect,
    });
    const { _count, ...rest } = updated;
    return {
      ...rest,
      bookingCount: _count.bookings,
    };
  });
}

async function deleteGuest(id, req) {
  return audited(req, {
    action: "delete",
    entityId: id,
  }, async (tx) => {
    const current = await tx.guest.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, _count: { select: { bookings: true } } },
    });
    if (!current) fail(404, "Guest not found.", "NOT_FOUND");
    if (current._count.bookings > 0) {
      fail(409, "Cannot delete a guest with existing bookings. Update notes instead.", "CONFLICT");
    }
    return tx.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  });
}

module.exports = {
  listGuests,
  getGuest,
  updateGuest,
  deleteGuest,
};
