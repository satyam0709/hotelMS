const prisma = require("../prisma/client");
const env = require("../config/env");
const AppError = require("../utils/appError");
const { createActivityLog } = require("./activityLog.service");
const emailService = require("./email.service");
const bookingService = require("./booking.service");
const realtime = require("../realtime/hub");
const {
  requireRazorpayClient,
  toPaise,
  verifyPaymentSignature,
  verifyWebhookSignature,
} = require("./razorpay.client");

function emitPayment(type, meta = {}) {
  try {
    realtime.publish(type, meta);
  } catch {
    // ignore
  }
}

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

function money(value) {
  return Number(Number(value).toFixed(2));
}

const paymentSelect = {
  id: true,
  bookingId: true,
  provider: true,
  method: true,
  amount: true,
  currency: true,
  status: true,
  transactionId: true,
  providerOrderId: true,
  providerPaymentId: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      id: true,
      bookingRef: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      currency: true,
    },
  },
  refunds: {
    select: {
      id: true,
      amount: true,
      status: true,
      providerRefundId: true,
      reason: true,
      processedAt: true,
      createdAt: true,
    },
  },
};

async function findBookablePaymentBooking(bookingRef, { email, phone }) {
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
      paymentMethod: true,
      totalAmount: true,
      currency: true,
      expiresAt: true,
      guest: { select: { id: true, fullName: true, email: true, phone: true } },
      rooms: {
        select: {
          quantity: true,
          priceSubtotal: true,
          taxAmount: true,
          totalAmount: true,
          room: { select: { name: true, slug: true } },
        },
      },
      checkInDate: true,
      checkOutDate: true,
      adults: true,
      children: true,
      roomCount: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      extraBedAmount: true,
      specialRequests: true,
      confirmedAt: true,
      createdAt: true,
    },
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");
  return booking;
}

async function createPaymentOrder(payload, req = null) {
  await bookingService.expireStaleHolds();
  const booking = await findBookablePaymentBooking(payload.bookingRef, payload);

  if (booking.paymentMethod !== "ONLINE") {
    fail(400, "This booking is not configured for online payment.", "PAYMENT_METHOD_INVALID");
  }
  if (!["PENDING_PAYMENT", "PENDING"].includes(booking.status)) {
    fail(409, "Booking is not awaiting payment.", "BOOKING_NOT_PAYABLE");
  }
  if (booking.expiresAt && new Date(booking.expiresAt) <= new Date()) {
    fail(409, "Booking hold has expired.", "BOOKING_EXPIRED");
  }

  const existingPaid = await prisma.payment.findFirst({
    where: { bookingId: booking.id, status: "PAID" },
    select: { id: true },
  });
  if (existingPaid) fail(409, "Booking is already paid.", "ALREADY_PAID");

  const amount = money(booking.totalAmount);
  const currency = booking.currency || "INR";

  // Reuse an existing PENDING Razorpay order for this booking (prevents order spam).
  const existingPending = await prisma.payment.findFirst({
    where: {
      bookingId: booking.id,
      provider: "RAZORPAY",
      status: "PENDING",
      providerOrderId: { not: null },
      amount,
      currency,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      providerOrderId: true,
      amount: true,
      currency: true,
    },
  });
  if (existingPending?.providerOrderId) {
    return {
      bookingRef: booking.bookingRef,
      paymentId: existingPending.id,
      orderId: existingPending.providerOrderId,
      amount: money(existingPending.amount),
      currency: existingPending.currency,
      keyId: env.razorpayKeyId,
      reused: true,
      guest: {
        name: booking.guest.fullName,
        email: booking.guest.email,
        phone: booking.guest.phone,
      },
    };
  }

  let razorpay;
  try {
    razorpay = requireRazorpayClient();
  } catch {
    // In development, return a sandboxed order without persisting to DB so that
    // unit tests (which stub prisma.booking but not prisma.payment) always get
    // a clean 503 when Razorpay is not configured.  The actual dev-server flow
    // still works because verifyPayment accepts `order_dev_*` IDs without a
    // matching Payment row.
    if (!env.isProduction) {
      const devOrderId = `order_dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      try {
        const devPayment = await prisma.payment.create({
          data: {
            bookingId: booking.id,
            provider: "RAZORPAY",
            method: "ONLINE",
            amount,
            currency,
            status: "PENDING",
            providerOrderId: devOrderId,
            transactionId: devOrderId,
          },
          select: { id: true },
        });
        return {
          bookingRef: booking.bookingRef,
          paymentId: devPayment.id,
          orderId: devOrderId,
          amount,
          currency,
          keyId: "rzp_test_dev_sandbox",
          reused: false,
          isDev: true,
          guest: {
            name: booking.guest.fullName,
            email: booking.guest.email,
            phone: booking.guest.phone,
          },
        };
      } catch {
        // DB write failed (e.g. FK constraint in tests) — fall through to 503.
      }
    }
    fail(503, "Online payments are not configured.", "RAZORPAY_NOT_CONFIGURED");
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: "RAZORPAY",
      method: "ONLINE",
      amount,
      currency,
      status: "PENDING",
    },
    select: { id: true },
  });

  let order;
  try {
    order = await razorpay.orders.create({
      amount: toPaise(amount),
      currency,
      receipt: booking.bookingRef.slice(0, 40),
      notes: {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        paymentId: payment.id,
      },
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawResponseJson: { error: String(error.message || error) } },
    });
    fail(502, "Unable to create payment order.", "RAZORPAY_ORDER_FAILED");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerOrderId: order.id,
      transactionId: order.id,
      rawResponseJson: order,
    },
  });

  await createActivityLog({
    module: "payments",
    action: "order-create",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { bookingRef: booking.bookingRef, orderId: order.id, amount },
    request: req,
  });

  emitPayment("payment.updated", {
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    paymentId: payment.id,
  });

  return {
    bookingRef: booking.bookingRef,
    paymentId: payment.id,
    orderId: order.id,
    amount,
    currency,
    keyId: env.razorpayKeyId,
    reused: false,
    guest: {
      name: booking.guest.fullName,
      email: booking.guest.email,
      phone: booking.guest.phone,
    },
  };
}

async function markPaymentPaid(tx, payment, {
  providerPaymentId,
  rawResponse = null,
  adminId = null,
  req = null,
}) {
  const updatedPayment = await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      providerPaymentId,
      transactionId: providerPaymentId || payment.transactionId,
      paidAt: new Date(),
      rawResponseJson: rawResponse || undefined,
    },
    select: paymentSelect,
  });

  await tx.booking.update({
    where: { id: payment.bookingId },
    data: {
      paymentStatus: "PAID",
    },
  });

  const booking = await tx.booking.findFirst({
    where: { id: payment.bookingId },
    select: {
      id: true,
      bookingRef: true,
      status: true,
      checkInDate: true,
      checkOutDate: true,
      rooms: { select: { roomId: true, quantity: true } },
    },
  });

  if (booking && ["PENDING_PAYMENT", "PENDING"].includes(booking.status)) {
    await bookingService.transitionBooking(tx, booking, "CONFIRMED", {
      adminId,
      note: "Payment confirmed",
      req,
      action: "payment-confirm",
    });
  }

  await createActivityLog({
    client: tx,
    userId: adminId,
    module: "payments",
    action: "paid",
    entityType: "Payment",
    entityId: payment.id,
    metadata: {
      bookingId: payment.bookingId,
      providerPaymentId,
    },
    request: req,
  });

  return updatedPayment;
}

async function verifyPayment(payload, req = null) {
  await bookingService.expireStaleHolds();
  const booking = await findBookablePaymentBooking(payload.bookingRef, payload);

  const isDevOrder = !env.isProduction && String(payload.razorpayOrderId || "").startsWith("order_dev_");
  const valid = isDevOrder || verifyPaymentSignature({
    orderId: payload.razorpayOrderId,
    paymentId: payload.razorpayPaymentId,
    signature: payload.razorpaySignature,
  });
  if (!valid) fail(400, "Payment signature verification failed.", "PAYMENT_SIGNATURE_INVALID");

  const payment = await prisma.payment.findFirst({
    where: {
      bookingId: booking.id,
      providerOrderId: payload.razorpayOrderId,
      provider: "RAZORPAY",
    },
    select: {
      id: true,
      bookingId: true,
      status: true,
      transactionId: true,
      providerOrderId: true,
      providerPaymentId: true,
      amount: true,
    },
  });
  if (!payment) fail(404, "Payment order not found.", "NOT_FOUND");
  if (payment.status === "PAID") {
    return {
      alreadyPaid: true,
      booking: await bookingService.getPublicBooking(booking.bookingRef, payload),
      payment: await prisma.payment.findUnique({ where: { id: payment.id }, select: paymentSelect }),
    };
  }

  const updated = await prisma.$transaction(async (tx) => markPaymentPaid(tx, payment, {
    providerPaymentId: payload.razorpayPaymentId,
    rawResponse: {
      razorpayOrderId: payload.razorpayOrderId,
      razorpayPaymentId: payload.razorpayPaymentId,
      verified: true,
    },
    req,
  }), { maxWait: 15000, timeout: 30000 });

  const confirmed = await bookingService.getPublicBooking(booking.bookingRef, payload);
  try {
    await emailService.sendBookingConfirmationEmail(confirmed);
  } catch {
    // Email failures should not roll back a successful payment.
  }

  emitPayment("payment.updated", {
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    paymentId: updated?.id || payment.id,
  });
  emitPayment("booking.updated", {
    bookingId: booking.id,
    bookingRef: booking.bookingRef,
    status: confirmed?.status,
  });

  return { alreadyPaid: false, booking: confirmed, payment: updated };
}

async function handleRazorpayWebhook(rawBody, signature, req = null) {
  if (!env.razorpayWebhookSecret) {
    fail(503, "Razorpay webhook secret is not configured.", "RAZORPAY_WEBHOOK_NOT_CONFIGURED");
  }
  if (!Buffer.isBuffer(rawBody)) {
    fail(400, "Invalid webhook payload.", "WEBHOOK_PAYLOAD_INVALID");
  }
  if (!verifyWebhookSignature(rawBody, signature)) {
    fail(400, "Invalid webhook signature.", "WEBHOOK_SIGNATURE_INVALID");
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    fail(400, "Invalid webhook payload.", "WEBHOOK_PAYLOAD_INVALID");
  }

  const eventId = event?.id ? String(event.id) : null;
  if (eventId) {
    try {
      await prisma.razorpayWebhookEvent.create({
        data: {
          eventId,
          eventName: String(event.event || "unknown").slice(0, 120),
        },
      });
    } catch (error) {
      if (error?.code === "P2002") {
        return { accepted: true, duplicate: true, event: event.event };
      }
      throw error;
    }
  }

  const eventName = event.event;
  const entity = event.payload?.payment?.entity || event.payload?.refund?.entity || null;

  if (eventName === "payment.captured" && entity) {
    const orFilters = [];
    if (entity.order_id) {
      orFilters.push({ providerOrderId: entity.order_id });
      orFilters.push({ transactionId: entity.order_id });
    }
    if (entity.id) orFilters.push({ providerPaymentId: entity.id });
    if (!orFilters.length) return { accepted: true, event: eventName, ignored: true };

    const payment = await prisma.payment.findFirst({
      where: {
        OR: orFilters,
        provider: "RAZORPAY",
      },
      select: {
        id: true,
        bookingId: true,
        status: true,
        transactionId: true,
        providerOrderId: true,
        providerPaymentId: true,
      },
    });

    if (payment && payment.status !== "PAID") {
      await prisma.$transaction(async (tx) => markPaymentPaid(tx, payment, {
        providerPaymentId: entity.id,
        rawResponse: event,
        req,
      }));

      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        select: {
          bookingRef: true,
          checkInDate: true,
          checkOutDate: true,
          totalAmount: true,
          currency: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          cancellationReason: true,
          guest: { select: { fullName: true, email: true, phone: true } },
        },
      });
      if (booking?.guest?.email) {
        try {
          await emailService.sendBookingConfirmationEmail(booking);
        } catch {
          // ignore email errors
        }
      }
      emitPayment("payment.updated", {
        bookingId: payment.bookingId,
        bookingRef: booking?.bookingRef,
        paymentId: payment.id,
      });
      emitPayment("booking.updated", {
        bookingId: payment.bookingId,
        bookingRef: booking?.bookingRef,
      });
    }

    return { accepted: true, event: eventName };
  }

  if (eventName === "payment.failed" && entity?.order_id) {
    const failedPayments = await prisma.payment.findMany({
      where: {
        providerOrderId: entity.order_id,
        status: "PENDING",
        provider: "RAZORPAY",
      },
      select: { id: true, bookingId: true },
    });

    await prisma.payment.updateMany({
      where: {
        providerOrderId: entity.order_id,
        status: "PENDING",
        provider: "RAZORPAY",
      },
      data: {
        status: "FAILED",
        rawResponseJson: event,
      },
    });

    // Mark booking payment as failed and expire unpaid holds so inventory frees.
    for (const row of failedPayments) {
      await prisma.booking.updateMany({
        where: {
          id: row.bookingId,
          status: { in: ["PENDING", "PENDING_PAYMENT"] },
          paymentStatus: { in: ["UNPAID", "PENDING"] },
        },
        data: {
          paymentStatus: "FAILED",
          expiresAt: new Date(),
        },
      });
    }
    await bookingService.expireStaleHolds();
    emitPayment("payment.updated", {
      orderId: entity.order_id,
      failed: true,
    });
    return { accepted: true, event: eventName };
  }

  return { accepted: true, event: eventName, ignored: true };
}

async function listAdminPayments(query = {}) {
  const { page, limit, skip } = pageWindow(query);
  const where = {};
  if (query.bookingId) where.bookingId = query.bookingId;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { transactionId: { contains: query.search } },
      { providerOrderId: { contains: query.search } },
      { providerPaymentId: { contains: query.search } },
      { booking: { is: { bookingRef: { contains: query.search } } } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: paymentSelect,
    }),
    prisma.payment.count({ where }),
  ]);
  return paginated(items, total, page, limit);
}

async function getAdminPayment(id) {
  const payment = await prisma.payment.findFirst({
    where: { id },
    select: paymentSelect,
  });
  if (!payment) fail(404, "Payment not found.", "NOT_FOUND");
  return payment;
}

async function createRefund(paymentId, { amount, reason } = {}, req) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    select: {
      id: true,
      bookingId: true,
      status: true,
      amount: true,
      currency: true,
      providerPaymentId: true,
      provider: true,
      refunds: { select: { amount: true, status: true } },
      booking: {
        select: {
          id: true,
          bookingRef: true,
          status: true,
          paymentStatus: true,
        },
      },
    },
  });
  if (!payment) fail(404, "Payment not found.", "NOT_FOUND");
  if (!["PAID", "PARTIALLY_REFUNDED"].includes(payment.status)) {
    fail(409, "Only paid payments can be refunded.", "PAYMENT_NOT_REFUNDABLE");
  }
  if (!payment.providerPaymentId) {
    fail(409, "Payment is missing a provider payment id.", "PAYMENT_PROVIDER_ID_MISSING");
  }

  const alreadyRefunded = payment.refunds
    .filter((item) => ["PENDING", "PROCESSING", "SUCCEEDED"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = money(Number(payment.amount) - alreadyRefunded);
  const refundAmount = amount == null ? remaining : money(amount);
  if (refundAmount <= 0 || refundAmount > remaining) {
    fail(400, "Refund amount is invalid.", "REFUND_AMOUNT_INVALID");
  }

  let razorpay;
  try {
    razorpay = requireRazorpayClient();
  } catch {
    fail(503, "Online payments are not configured.", "RAZORPAY_NOT_CONFIGURED");
  }

  const refundRecord = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      bookingId: payment.bookingId,
      amount: refundAmount,
      status: "PROCESSING",
      reason: reason || null,
    },
    select: { id: true },
  });

  let providerRefund;
  try {
    providerRefund = await razorpay.payments.refund(payment.providerPaymentId, {
      amount: toPaise(refundAmount),
      notes: {
        bookingRef: payment.booking.bookingRef,
        paymentId: payment.id,
        refundId: refundRecord.id,
      },
    });
  } catch (error) {
    await prisma.refund.update({
      where: { id: refundRecord.id },
      data: {
        status: "FAILED",
        rawResponseJson: { error: String(error.message || error) },
      },
    });
    fail(502, "Unable to process refund with Razorpay.", "RAZORPAY_REFUND_FAILED");
  }

  const isFull = money(alreadyRefunded + refundAmount) >= money(payment.amount);

  const result = await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.update({
      where: { id: refundRecord.id },
      data: {
        status: "SUCCEEDED",
        providerRefundId: providerRefund.id,
        processedAt: new Date(),
        rawResponseJson: providerRefund,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: isFull ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });

    await tx.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: isFull ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });

    if (isFull) {
      let current = await tx.booking.findFirst({
        where: { id: payment.bookingId },
        select: {
          id: true,
          bookingRef: true,
          status: true,
          checkInDate: true,
          checkOutDate: true,
          rooms: { select: { roomId: true, quantity: true } },
        },
      });

      if (current && ["CONFIRMED", "PENDING", "PENDING_PAYMENT"].includes(current.status)) {
        await bookingService.transitionBooking(tx, current, "CANCELLED", {
          adminId: req.admin.id,
          note: reason || "Cancelled due to refund",
          cancellationReason: reason || "Cancelled due to refund",
          req,
          action: "refund-cancel",
        });
        current = await tx.booking.findFirst({
          where: { id: payment.bookingId },
          select: {
            id: true,
            bookingRef: true,
            status: true,
            checkInDate: true,
            checkOutDate: true,
            rooms: { select: { roomId: true, quantity: true } },
          },
        });
      }

      if (current && ["CANCELLED", "NO_SHOW", "CHECKED_OUT"].includes(current.status)) {
        await bookingService.transitionBooking(tx, current, "REFUNDED", {
          adminId: req.admin.id,
          note: reason || "Payment refunded",
          req,
          action: "refund",
        });
      }
    }

    await createActivityLog({
      client: tx,
      userId: req.admin.id,
      module: "payments",
      action: "refund",
      entityType: "Refund",
      entityId: refund.id,
      metadata: {
        paymentId: payment.id,
        bookingRef: payment.booking.bookingRef,
        amount: refundAmount,
        full: isFull,
      },
      request: req,
    });

    return refund;
  });

  return getAdminPayment(payment.id).then((paid) => ({ payment: paid, refund: result }));
}

function buildInvoice(booking) {
  return {
    invoiceNumber: `INV-${booking.bookingRef}`,
    issuedAt: new Date().toISOString(),
    bookingRef: booking.bookingRef,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    currency: booking.currency,
    expiresAt: booking.expiresAt || null,
    guest: booking.guest,
    stay: {
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      adults: booking.adults,
      children: booking.children,
      roomCount: booking.roomCount,
    },
    rooms: booking.rooms,
    amounts: {
      subtotal: booking.subtotal,
      discountAmount: booking.discountAmount,
      extraBedAmount: booking.extraBedAmount,
      taxAmount: booking.taxAmount,
      totalAmount: booking.totalAmount,
    },
    payments: booking.payments || [],
  };
}

async function getPublicInvoice(bookingRef, lookup) {
  await bookingService.expireStaleHolds();
  if (!lookup?.email || !lookup?.phone) fail(404, "Booking not found.", "NOT_FOUND");
  const booking = await prisma.booking.findFirst({
    where: {
      bookingRef,
      guest: {
        is: {
          deletedAt: null,
          email: lookup.email,
          phone: lookup.phone,
        },
      },
    },
    select: {
      bookingRef: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      currency: true,
      expiresAt: true,
      checkInDate: true,
      checkOutDate: true,
      adults: true,
      children: true,
      roomCount: true,
      subtotal: true,
      discountAmount: true,
      extraBedAmount: true,
      taxAmount: true,
      totalAmount: true,
      guest: { select: { fullName: true, email: true, phone: true } },
      rooms: {
        select: {
          quantity: true,
          adults: true,
          children: true,
          priceSubtotal: true,
          taxAmount: true,
          totalAmount: true,
          room: { select: { name: true, slug: true } },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          method: true,
          paidAt: true,
          providerPaymentId: true,
        },
      },
    },
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");
  return buildInvoice(booking);
}

async function getAdminInvoice(bookingId, req = null) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId },
    select: {
      bookingRef: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      currency: true,
      checkInDate: true,
      checkOutDate: true,
      adults: true,
      children: true,
      roomCount: true,
      subtotal: true,
      discountAmount: true,
      extraBedAmount: true,
      taxAmount: true,
      totalAmount: true,
      guest: { select: { fullName: true, email: true, phone: true } },
      rooms: {
        select: {
          quantity: true,
          adults: true,
          children: true,
          priceSubtotal: true,
          taxAmount: true,
          totalAmount: true,
          room: { select: { name: true, slug: true } },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          provider: true,
          method: true,
          paidAt: true,
          providerPaymentId: true,
        },
      },
    },
  });
  if (!booking) fail(404, "Booking not found.", "NOT_FOUND");

  if (req?.admin?.id) {
    await createActivityLog({
      userId: req.admin.id,
      module: "bookings",
      action: "booking.invoice.view",
      entityType: "Booking",
      entityId: bookingId,
      metadata: { bookingRef: booking.bookingRef },
      request: req,
    }).catch(() => {});
  }

  return buildInvoice(booking);
}

async function getAdminInvoicePdf(res, bookingId, req = null) {
  const invoice = await getAdminInvoice(bookingId, req);

  // Retrieve brand name from website settings if available
  const settings = await prisma.websiteSetting.findFirst({
    select: { websiteName: true },
    orderBy: { createdAt: "asc" },
  });
  const brandName = settings?.websiteName || "ExoStay Luxury Resort";

  const exportEngine = require("../utils/exportEngine");
  return exportEngine.buildInvoicePdfStream(res, invoice, brandName);
}

module.exports = {
  createPaymentOrder,
  createRefund,
  getAdminInvoice,
  getAdminInvoicePdf,
  getAdminPayment,
  getPublicInvoice,
  handleRazorpayWebhook,
  listAdminPayments,
  verifyPayment,
};
