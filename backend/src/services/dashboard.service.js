const prisma = require("../prisma/client");

const OCCUPYING_STATUSES = ["CONFIRMED", "CHECKED_IN", "PENDING_PAYMENT"];
const PENDING_STATUSES = ["PENDING", "PENDING_PAYMENT"];
const CONFIRMED_STATUSES = ["CONFIRMED", "CHECKED_IN"];

function dateOnly(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function defaultFrom() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 6);
  return dateOnly(date);
}

function startOfDay(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDay(value) {
  return new Date(`${value}T23:59:59.999Z`);
}

function money(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

function pct(part, whole) {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(1));
}

function can(admin, key) {
  if (!admin) return false;
  if (Array.isArray(admin.roles) && admin.roles.some((role) => role.slug === "super-admin")) return true;
  return Array.isArray(admin.permissions) && admin.permissions.includes(key);
}

function demandLabel(occupancyPercent, blocked, total) {
  if (total > 0 && blocked >= total) return "MAINTENANCE";
  if (occupancyPercent >= 90) return "HIGH DEMAND";
  if (occupancyPercent >= 65) return "OPTIMAL";
  return "AVAILABLE";
}

function eachDate(from, to) {
  const dates = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    dates.push(dateOnly(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

async function loadRoomSnapshot(today) {
  const day = startOfDay(today);
  const rooms = await prisma.room.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      basePrice: true,
      totalInventory: true,
      roomCategoryId: true,
      category: { select: { id: true, name: true, slug: true, displayOrder: true, isActive: true } },
    },
  });

  const [bookingRooms, blocks] = await Promise.all([
    prisma.bookingRoom.findMany({
      where: {
        booking: {
          OR: [
            { status: "CHECKED_IN" },
            {
              status: { in: OCCUPYING_STATUSES.filter((s) => s !== "CHECKED_IN") },
              checkInDate: { lte: day },
              checkOutDate: { gt: day },
            },
          ],
        },
      },
      select: { quantity: true, roomId: true },
    }),
    prisma.roomBlock.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        startDate: { lte: day },
        endDate: { gte: day },
      },
      select: { quantity: true, roomId: true },
    }),
  ]);

  const occupiedByRoom = new Map();
  for (const row of bookingRooms) {
    occupiedByRoom.set(row.roomId, (occupiedByRoom.get(row.roomId) || 0) + row.quantity);
  }
  const blockedByRoom = new Map();
  for (const row of blocks) {
    blockedByRoom.set(row.roomId, (blockedByRoom.get(row.roomId) || 0) + row.quantity);
  }

  let totalUnits = 0;
  let occupied = 0;
  let blocked = 0;
  const roomCount = rooms.length;
  const categoryMap = new Map();

  for (const room of rooms) {
    const units = Number(room.totalInventory || 0);
    const roomOccupied = Math.min(units, occupiedByRoom.get(room.id) || 0);
    const roomBlocked = Math.min(units, blockedByRoom.get(room.id) || 0);
    const roomAvailable = Math.max(0, units - roomOccupied - roomBlocked);

    totalUnits += units;
    occupied += roomOccupied;
    blocked += roomBlocked;

    const categoryId = room.category?.id || room.roomCategoryId || "uncategorized";
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: room.category?.name || "Uncategorized",
        slug: room.category?.slug || null,
        displayOrder: room.category?.displayOrder ?? 999,
        total: 0,
        occupied: 0,
        blocked: 0,
        available: 0,
        rateSum: 0,
        rateCount: 0,
      });
    }
    const cat = categoryMap.get(categoryId);
    cat.total += units;
    cat.occupied += roomOccupied;
    cat.blocked += roomBlocked;
    cat.available += roomAvailable;
    cat.rateSum += Number(room.basePrice || 0);
    cat.rateCount += 1;
  }

  const available = Math.max(0, totalUnits - occupied - blocked);
  const categories = [...categoryMap.values()]
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    .map((cat) => {
      const occupancyPercent = pct(cat.occupied, cat.total);
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        total: cat.total,
        occupied: cat.occupied,
        blocked: cat.blocked,
        available: cat.available,
        occupancyPercent,
        avgRate: money(cat.rateCount ? cat.rateSum / cat.rateCount : 0),
        demand: demandLabel(occupancyPercent, cat.blocked, cat.total),
      };
    });

  return {
    roomCount,
    totalUnits,
    occupied,
    blocked,
    available,
    occupancyPercent: pct(occupied, totalUnits),
    categories,
  };
}

async function loadTrafficByDay(from, to) {
  const dates = eachDate(from, to);
  const rows = await Promise.all(dates.map(async (day) => {
    const range = { gte: startOfDay(day), lte: endOfDay(day) };
    const [checkIns, checkOuts] = await Promise.all([
      prisma.booking.count({ where: { checkInDate: range, status: { notIn: ["CANCELLED", "EXPIRED"] } } }),
      prisma.booking.count({ where: { checkOutDate: range, status: { notIn: ["CANCELLED", "EXPIRED"] } } }),
    ]);
    return { date: day, checkIns, checkOuts };
  }));
  return rows;
}

async function loadWeeklyTrend(from, to) {
  const dates = eachDate(from, to);
  if (!dates.length) return [];
  const minDay = startOfDay(dates[0]);
  const maxDay = endOfDay(dates[dates.length - 1]);

  const [rooms, bookingRooms, blocks, payments] = await Promise.all([
    prisma.room.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, totalInventory: true },
    }),
    prisma.bookingRoom.findMany({
      where: {
        booking: {
          status: { in: OCCUPYING_STATUSES },
          checkInDate: { lte: maxDay },
          checkOutDate: { gt: minDay },
        },
      },
      select: {
        quantity: true,
        roomId: true,
        booking: { select: { checkInDate: true, checkOutDate: true } },
      },
    }),
    prisma.roomBlock.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        startDate: { lte: maxDay },
        endDate: { gte: minDay },
      },
      select: { quantity: true, roomId: true, startDate: true, endDate: true },
    }),
    prisma.payment.findMany({
      where: {
        status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] },
        paidAt: { gte: minDay, lte: maxDay },
      },
      select: { amount: true, paidAt: true },
    }),
  ]);

  const totalUnits = rooms.reduce((sum, r) => sum + Number(r.totalInventory || 0), 0);

  return dates.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const occupiedByRoom = new Map();
    for (const row of bookingRooms) {
      if (row.booking?.checkInDate <= dayStart && row.booking?.checkOutDate > dayStart) {
        occupiedByRoom.set(row.roomId, (occupiedByRoom.get(row.roomId) || 0) + row.quantity);
      }
    }

    const blockedByRoom = new Map();
    for (const row of blocks) {
      if (row.startDate <= dayStart && row.endDate >= dayStart) {
        blockedByRoom.set(row.roomId, (blockedByRoom.get(row.roomId) || 0) + row.quantity);
      }
    }

    let occupied = 0;
    let blocked = 0;
    for (const room of rooms) {
      const units = Number(room.totalInventory || 0);
      occupied += Math.min(units, occupiedByRoom.get(room.id) || 0);
      blocked += Math.min(units, blockedByRoom.get(room.id) || 0);
    }

    const available = Math.max(0, totalUnits - occupied - blocked);
    const dayRevenue = payments
      .filter((p) => p.paidAt && p.paidAt >= dayStart && p.paidAt <= dayEnd)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      date: day,
      occupancyPercent: pct(occupied, totalUnits),
      revenue: money(dayRevenue),
      occupied,
      available,
    };
  });
}

async function overview(query = {}, admin) {
  const today = dateOnly(new Date());
  const from = query.from || defaultFrom();
  const to = query.to || today;
  const createdAt = { gte: startOfDay(from), lte: endOfDay(to) };
  const todayRange = { gte: startOfDay(today), lte: endOfDay(today) };

  const sections = {
    bookings: can(admin, "bookings.read"),
    rooms: can(admin, "rooms.read") || can(admin, "room_categories.read"),
    payments: can(admin, "payments.read") || can(admin, "reports.read"),
    inquiries: can(admin, "inquiries.read"),
    activity: can(admin, "activity.read"),
  };

  const propertyPromise = prisma.websiteSetting.findFirst({
    select: { websiteName: true, phone: true, email: true },
  });

  const bookingStatsPromise = sections.bookings
    ? prisma.$transaction([
      prisma.booking.count({ where: { createdAt } }),
      prisma.booking.count({ where: { createdAt, status: { in: CONFIRMED_STATUSES } } }),
      prisma.booking.count({ where: { createdAt, status: { in: PENDING_STATUSES } } }),
      prisma.booking.count({ where: { createdAt, status: "CANCELLED" } }),
      prisma.booking.count({ where: { createdAt, status: "CHECKED_IN" } }),
      prisma.booking.count({
        where: {
          OR: [
            {
              checkInDate: todayRange,
              status: { notIn: ["CANCELLED", "EXPIRED", "NO_SHOW"] },
            },
            {
              status: "CHECKED_IN",
              updatedAt: todayRange,
            },
          ],
        },
      }),
      prisma.booking.count({
        where: {
          OR: [
            {
              checkOutDate: todayRange,
              status: { notIn: ["CANCELLED", "EXPIRED"] },
            },
            {
              status: "CHECKED_OUT",
              updatedAt: todayRange,
            },
          ],
        },
      }),
      prisma.booking.findMany({
        where: {},
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          bookingRef: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          checkInDate: true,
          checkOutDate: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          guest: { select: { id: true, fullName: true, email: true, phone: true } },
          rooms: {
            take: 1,
            select: {
              quantity: true,
              room: { select: { id: true, name: true, roomCode: true } },
            },
          },
        },
      }),
    ])
    : Promise.resolve(null);

  const revenuePromise = sections.payments
    ? prisma.$transaction([
      prisma.payment.aggregate({
        where: {
          status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] },
          paidAt: createdAt,
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.refund.aggregate({
        where: { status: "SUCCEEDED", createdAt },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: "PENDING", createdAt } }),
    ])
    : Promise.resolve(null);

  const seriesFrom = (() => {
    const dates = eachDate(from, to);
    return dates.length > 14 ? dates.slice(-14)[0] : from;
  })();

  const roomsPromise = sections.rooms ? loadRoomSnapshot(today) : Promise.resolve(null);
  const trafficPromise = sections.bookings ? loadTrafficByDay(seriesFrom, to) : Promise.resolve(null);
  const trendPromise = (sections.rooms || sections.payments) ? loadWeeklyTrend(seriesFrom, to) : Promise.resolve(null);

  const inquiriesPromise = sections.inquiries
    ? prisma.inquiry.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        subject: true,
        message: true,
        createdAt: true,
      },
    })
    : Promise.resolve(null);

  const activityPromise = sections.activity
    ? prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        module: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    })
    : Promise.resolve(null);

  const [
    property,
    bookingStats,
    revenueStats,
    rooms,
    trafficByDay,
    weeklyTrend,
    inquiries,
    activity,
  ] = await Promise.all([
    propertyPromise,
    bookingStatsPromise,
    revenuePromise,
    roomsPromise,
    trafficPromise,
    trendPromise,
    inquiriesPromise,
    activityPromise,
  ]);

  let bookingSummary = null;
  let kpis = {
    checkInsToday: null,
    checkOutsToday: null,
    occupancyPercent: rooms?.occupancyPercent ?? null,
    revenuePeriod: null,
  };
  let recentBookings = [];

  if (bookingStats) {
    const [
      total,
      confirmed,
      pending,
      cancelled,
      checkedIn,
      checkInsToday,
      checkOutsToday,
      recent,
    ] = bookingStats;
    bookingSummary = { total, confirmed, pending, cancelled, checkedIn };
    kpis.checkInsToday = checkInsToday;
    kpis.checkOutsToday = checkOutsToday;
    recentBookings = recent.map((booking) => ({
      id: booking.id,
      bookingRef: booking.bookingRef,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalAmount: money(booking.totalAmount),
      currency: booking.currency,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      guest: booking.guest,
      roomName: booking.rooms[0]?.room?.name || null,
      roomCode: booking.rooms[0]?.room?.roomCode || null,
      roomQuantity: booking.rooms[0]?.quantity || null,
    }));
  }

  let revenue = null;
  if (revenueStats) {
    const [paidAgg, refundAgg, pendingPaymentCount] = revenueStats;
    const gross = money(paidAgg._sum.amount);
    const refunds = money(refundAgg._sum.amount);
    revenue = {
      gross,
      refunds,
      net: money(gross - refunds),
      paidPaymentCount: paidAgg._count._all,
      pendingPaymentCount,
      currency: "INR",
    };
    kpis.revenuePeriod = revenue.net;
  }

  return {
    generatedAt: new Date().toISOString(),
    today,
    range: { from, to },
    property: property
      ? { name: property.websiteName || "ExoStay - Hotel/Resort", phone: property.phone, email: property.email }
      : { name: "ExoStay - Hotel/Resort", phone: null, email: null },
    permissions: sections,
    kpis,
    bookingSummary,
    rooms: rooms
      ? {
        roomCount: rooms.roomCount,
        totalUnits: rooms.totalUnits,
        available: rooms.available,
        occupied: rooms.occupied,
        blocked: rooms.blocked,
        occupancyPercent: rooms.occupancyPercent,
      }
      : null,
    occupancyBreakdown: rooms
      ? {
        occupied: rooms.occupied,
        available: rooms.available,
        blocked: rooms.blocked,
      }
      : null,
    categories: rooms?.categories || [],
    trafficByDay: trafficByDay || [],
    weeklyTrend: weeklyTrend || [],
    recentBookings,
    inquiries: inquiries || [],
    activity: activity || [],
    revenue,
  };
}

module.exports = { overview };
