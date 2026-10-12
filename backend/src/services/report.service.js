const prisma = require("../prisma/client");

function dateOnly(value) {
  return value.toISOString().slice(0, 10);
}

function defaultFrom() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 29);
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

function countMap(rows, key = "status") {
  return rows.reduce((result, row) => {
    result[row[key]] = row._count._all;
    return result;
  }, {});
}

async function overview(query = {}) {
  const from = query.from || defaultFrom();
  const to = query.to || dateOnly(new Date());
  const createdAt = { gte: startOfDay(from), lte: endOfDay(to) };
  const stayDate = { gte: startOfDay(from), lte: endOfDay(to) };

  const [
    bookingTotal,
    bookingStatusRows,
    arrivalCount,
    departureCount,
    roomNightAgg,
    paidAgg,
    pendingPayments,
    paymentStatusRows,
    refundAgg,
    inquiryTotal,
    inquiryStatusRows,
    newsletterTotal,
  ] = await prisma.$transaction([
    prisma.booking.count({ where: { createdAt } }),
    prisma.booking.groupBy({ by: ["status"], where: { createdAt }, _count: { _all: true } }),
    prisma.booking.count({ where: { checkInDate: stayDate } }),
    prisma.booking.count({ where: { checkOutDate: stayDate } }),
    prisma.booking.aggregate({
      where: { createdAt },
      _sum: { roomCount: true, totalAmount: true },
      _avg: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] }, paidAt: createdAt },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.count({ where: { status: "PENDING", createdAt } }),
    prisma.payment.groupBy({ by: ["status"], where: { createdAt }, _count: { _all: true } }),
    prisma.refund.aggregate({
      where: { status: "SUCCEEDED", createdAt },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.inquiry.count({ where: { deletedAt: null, createdAt } }),
    prisma.inquiry.groupBy({ by: ["status"], where: { deletedAt: null, createdAt }, _count: { _all: true } }),
    prisma.newsletterSubscriber.count({ where: { deletedAt: null, status: "SUBSCRIBED" } }),
  ]);

  const grossRevenue = money(paidAgg._sum.amount);
  const refunds = money(refundAgg._sum.amount);
  const netRevenue = money(grossRevenue - refunds);

  const [occupancySeries, revenueSeries, inventoryCapacity] = await Promise.all([
    buildOccupancySeries(from, to),
    buildRevenueSeries(from, to),
    prisma.room.aggregate({
      where: { deletedAt: null, status: "ACTIVE" },
      _sum: { totalInventory: true },
    }),
  ]);

  const sellableUnits = Number(inventoryCapacity._sum.totalInventory || 0);
  const occupiedRoomNights = occupancySeries.reduce((sum, row) => sum + row.occupied, 0);
  const availableRoomNights = sellableUnits * occupancySeries.length;
  const occupancyRate = availableRoomNights > 0
    ? Number(((occupiedRoomNights / availableRoomNights) * 100).toFixed(1))
    : 0;

  return {
    range: { from, to },
    bookings: {
      total: bookingTotal,
      arrivals: arrivalCount,
      departures: departureCount,
      roomNights: Number(roomNightAgg._sum.roomCount || 0),
      averageBookingValue: money(roomNightAgg._avg.totalAmount),
      valueOnBookings: money(roomNightAgg._sum.totalAmount),
      byStatus: countMap(bookingStatusRows),
    },
    revenue: {
      gross: grossRevenue,
      refunds,
      net: netRevenue,
      paidPaymentCount: paidAgg._count._all,
      pendingPaymentCount: pendingPayments,
      byPaymentStatus: countMap(paymentStatusRows),
      currency: "INR",
      series: revenueSeries,
    },
    occupancy: {
      ratePercent: occupancyRate,
      occupiedRoomNights,
      availableRoomNights,
      sellableUnits,
      series: occupancySeries,
    },
    inquiries: {
      total: inquiryTotal,
      byStatus: countMap(inquiryStatusRows),
    },
    newsletter: {
      subscribed: newsletterTotal,
    },
  };
}

async function buildOccupancySeries(from, to) {
  const start = startOfDay(from);
  const end = endOfDay(to);
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "PENDING", "PENDING_PAYMENT"] },
      checkInDate: { lte: end },
      checkOutDate: { gt: start },
    },
    select: { checkInDate: true, checkOutDate: true, roomCount: true },
    take: 5000,
  });

  const days = eachDate(from, to);
  return days.map((day) => {
    const dayStart = startOfDay(day);
    let occupied = 0;
    for (const booking of bookings) {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      if (checkIn <= dayStart && checkOut > dayStart) {
        occupied += Number(booking.roomCount || 1);
      }
    }
    return { date: day, occupied };
  });
}

async function buildRevenueSeries(from, to) {
  const payments = await prisma.payment.findMany({
    where: {
      status: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] },
      paidAt: { gte: startOfDay(from), lte: endOfDay(to) },
    },
    select: { amount: true, paidAt: true },
    take: 5000,
  });
  const byDay = new Map(eachDate(from, to).map((day) => [day, 0]));
  for (const payment of payments) {
    const day = isoDate(payment.paidAt);
    if (!byDay.has(day)) continue;
    byDay.set(day, money(byDay.get(day) + Number(payment.amount || 0)));
  }
  return [...byDay.entries()].map(([date, amount]) => ({ date, amount }));
}

function eachDate(from, to) {
  const dates = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  if (Number.isNaN(cursor.valueOf()) || Number.isNaN(end.valueOf()) || cursor > end) return dates;
  while (cursor <= end) {
    dates.push(dateOnly(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function csvEscape(value) {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function isoDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return dateOnly(value);
}

function isoDateTime(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

async function exportCsv(query = {}) {
  const type = query.type || "bookings";
  const from = query.from || defaultFrom();
  const to = query.to || dateOnly(new Date());
  const createdAt = { gte: startOfDay(from), lte: endOfDay(to) };
  const filename = `hotelms-${type}-${from}-to-${to}.csv`;

  if (type === "summary") {
    const data = await overview({ from, to });
    const rows = [
      { metric: "range_from", value: data.range.from },
      { metric: "range_to", value: data.range.to },
      { metric: "bookings_total", value: data.bookings.total },
      { metric: "bookings_arrivals", value: data.bookings.arrivals },
      { metric: "bookings_departures", value: data.bookings.departures },
      { metric: "bookings_room_nights", value: data.bookings.roomNights },
      { metric: "bookings_average_value", value: data.bookings.averageBookingValue },
      { metric: "bookings_value_on_bookings", value: data.bookings.valueOnBookings },
      { metric: "revenue_gross", value: data.revenue.gross },
      { metric: "revenue_refunds", value: data.revenue.refunds },
      { metric: "revenue_net", value: data.revenue.net },
      { metric: "revenue_paid_payment_count", value: data.revenue.paidPaymentCount },
      { metric: "revenue_pending_payment_count", value: data.revenue.pendingPaymentCount },
      { metric: "occupancy_rate_percent", value: data.occupancy.ratePercent },
      { metric: "occupancy_occupied_room_nights", value: data.occupancy.occupiedRoomNights },
      { metric: "occupancy_available_room_nights", value: data.occupancy.availableRoomNights },
      { metric: "inquiries_total", value: data.inquiries.total },
      { metric: "newsletter_subscribed", value: data.newsletter.subscribed },
      ...Object.entries(data.bookings.byStatus).map(([status, value]) => ({
        metric: `booking_status_${status}`,
        value,
      })),
      ...Object.entries(data.revenue.byPaymentStatus).map(([status, value]) => ({
        metric: `payment_status_${status}`,
        value,
      })),
      ...Object.entries(data.inquiries.byStatus).map(([status, value]) => ({
        metric: `inquiry_status_${status}`,
        value,
      })),
    ];
    return {
      filename,
      contentType: "text/csv; charset=utf-8",
      body: toCsv(["metric", "value"], rows),
    };
  }

  if (type === "bookings" || type === "bookings-stay") {
    const stayOverlap = {
      checkInDate: { lte: endOfDay(to) },
      checkOutDate: { gt: startOfDay(from) },
    };
    const items = await prisma.booking.findMany({
      where: type === "bookings-stay" ? stayOverlap : { createdAt },
      orderBy: type === "bookings-stay" ? { checkInDate: "asc" } : { createdAt: "desc" },
      take: 5000,
      select: {
        bookingRef: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        checkInDate: true,
        checkOutDate: true,
        adults: true,
        children: true,
        roomCount: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        guest: { select: { fullName: true, email: true, phone: true } },
      },
    });
    const rows = items.map((item) => ({
      bookingRef: item.bookingRef,
      guestName: item.guest?.fullName || "",
      guestEmail: item.guest?.email || "",
      guestPhone: item.guest?.phone || "",
      status: item.status,
      paymentStatus: item.paymentStatus,
      paymentMethod: item.paymentMethod,
      checkInDate: isoDate(item.checkInDate),
      checkOutDate: isoDate(item.checkOutDate),
      adults: item.adults,
      children: item.children,
      roomCount: item.roomCount,
      totalAmount: money(item.totalAmount),
      currency: item.currency,
      createdAt: isoDateTime(item.createdAt),
    }));
    return {
      filename,
      contentType: "text/csv; charset=utf-8",
      body: toCsv([
        "bookingRef",
        "guestName",
        "guestEmail",
        "guestPhone",
        "status",
        "paymentStatus",
        "paymentMethod",
        "checkInDate",
        "checkOutDate",
        "adults",
        "children",
        "roomCount",
        "totalAmount",
        "currency",
        "createdAt",
      ], rows),
    };
  }

  if (type === "payments") {
    const items = await prisma.payment.findMany({
      where: { createdAt },
      orderBy: { createdAt: "desc" },
      take: 5000,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        provider: true,
        providerPaymentId: true,
        paidAt: true,
        createdAt: true,
        booking: {
          select: {
            bookingRef: true,
            guest: { select: { fullName: true, email: true } },
          },
        },
      },
    });
    const rows = items.map((item) => ({
      paymentId: item.id,
      bookingRef: item.booking?.bookingRef || "",
      guestName: item.booking?.guest?.fullName || "",
      guestEmail: item.booking?.guest?.email || "",
      amount: money(item.amount),
      currency: item.currency,
      status: item.status,
      method: item.method,
      provider: item.provider || "",
      providerPaymentId: item.providerPaymentId || "",
      paidAt: isoDateTime(item.paidAt),
      createdAt: isoDateTime(item.createdAt),
    }));
    return {
      filename,
      contentType: "text/csv; charset=utf-8",
      body: toCsv([
        "paymentId",
        "bookingRef",
        "guestName",
        "guestEmail",
        "amount",
        "currency",
        "status",
        "method",
        "provider",
        "providerPaymentId",
        "paidAt",
        "createdAt",
      ], rows),
    };
  }

  const items = await prisma.inquiry.findMany({
    where: { deletedAt: null, createdAt },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      id: true,
      type: true,
      name: true,
      email: true,
      phone: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });
  const rows = items.map((item) => ({
    inquiryId: item.id,
    type: item.type,
    name: item.name,
    email: item.email || "",
    phone: item.phone || "",
    subject: item.subject || "",
    status: item.status,
    createdAt: isoDateTime(item.createdAt),
  }));
  return {
    filename,
    contentType: "text/csv; charset=utf-8",
    body: toCsv([
      "inquiryId",
      "type",
      "name",
      "email",
      "phone",
      "subject",
      "status",
      "createdAt",
    ], rows),
  };
}

module.exports = { overview, exportCsv };
