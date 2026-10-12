const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { once } = require("node:events");
const { after, afterEach, before, test } = require("node:test");
const app = require("../src/app");
const env = require("../src/config/env");
const prisma = require("../src/prisma/client");
const {
  setRazorpayClient,
  resetRazorpayClient,
  verifyPaymentSignature,
  verifyWebhookSignature,
  toPaise,
} = require("../src/services/razorpay.client");
const { signAccessToken } = require("../src/utils/jwt");

let server;
let baseUrl;
const restorers = [];

function stub(target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  restorers.push(() => { target[key] = original; });
}

function stubTransaction() {
  stub(prisma, "$transaction", (operation) =>
    typeof operation === "function" ? operation(prisma) : Promise.all(operation)
  );
}

function adminRecord(permissionKeys = []) {
  return {
    id: "payment-admin",
    name: "Payment Admin",
    email: "payment@example.invalid",
    username: "payment-admin",
    status: "ACTIVE",
    lastLoginAt: null,
    roles: [{ role: {
      id: "role-id",
      name: "Test Role",
      slug: "test-role",
      permissions: permissionKeys.map((key) => ({ permission: { key } })),
    } }],
  };
}

function cookie() {
  return `${env.cookieName}=${signAccessToken("payment-admin")}`;
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function futureDate(daysAhead) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  while (restorers.length) restorers.pop()();
  resetRazorpayClient();
});

after(async () => {
  server.close();
  await once(server, "close");
  await prisma.$disconnect();
});

test("payment signature helpers verify razorpay digests", () => {
  const secret = "test_secret_key_for_signatures";
  const orderId = "order_123";
  const paymentId = "pay_123";
  const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  assert.equal(verifyPaymentSignature({ orderId, paymentId, signature, secret }), true);
  assert.equal(verifyPaymentSignature({ orderId, paymentId, signature: "bad", secret }), false);

  const body = Buffer.from(JSON.stringify({ event: "payment.captured" }));
  const webhookSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, webhookSignature, secret), true);
  assert.equal(toPaise("199.99"), 19999);
});

test("create payment order requires razorpay configuration", async () => {
  setRazorpayClient(null);
  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-1",
    bookingRef: "HMS-PAY-1",
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    paymentMethod: "ONLINE",
    totalAmount: "448.00",
    currency: "INR",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    guest: { id: "guest-1", fullName: "Riya", email: "riya@example.com", phone: "9999999999" },
    rooms: [],
  }));
  stub(prisma.payment, "findFirst", async () => null);

  const response = await request("/api/payments/razorpay/order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      bookingRef: "HMS-PAY-1",
      email: "riya@example.com",
      phone: "9999999999",
    }),
  });
  assert.equal(response.status, 503);
});

test("create payment order creates pending payment and returns checkout payload", async () => {
  const createdPayments = [];
  const updatedPayments = [];
  const activityLogs = [];

  setRazorpayClient({
    orders: {
      create: async (payload) => {
        assert.equal(payload.amount, 44800);
        assert.equal(payload.currency, "INR");
        return { id: "order_test_1", amount: payload.amount, currency: payload.currency };
      },
    },
  });

  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-1",
    bookingRef: "HMS-PAY-1",
    status: "PENDING_PAYMENT",
    paymentStatus: "PENDING",
    paymentMethod: "ONLINE",
    totalAmount: "448.00",
    currency: "INR",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    guest: { id: "guest-1", fullName: "Riya", email: "riya@example.com", phone: "9999999999" },
    rooms: [],
    checkInDate: futureDate(10),
    checkOutDate: futureDate(12),
  }));
  stub(prisma.payment, "findFirst", async () => null);
  stub(prisma.payment, "create", async ({ data }) => {
    createdPayments.push(data);
    return { id: "payment-1" };
  });
  stub(prisma.payment, "update", async ({ data }) => {
    updatedPayments.push(data);
    return { id: "payment-1", ...data };
  });
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));

  const previousKey = env.razorpayKeyId;
  env.razorpayKeyId = "rzp_test_key";
  restorers.push(() => { env.razorpayKeyId = previousKey; });

  const response = await request("/api/payments/razorpay/order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      bookingRef: "HMS-PAY-1",
      email: "riya@example.com",
      phone: "9999999999",
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.orderId, "order_test_1");
  assert.equal(body.data.amount, 448);
  assert.equal(body.data.keyId, "rzp_test_key");
  assert.equal(createdPayments[0].status, "PENDING");
  assert.equal(updatedPayments[0].providerOrderId, "order_test_1");
  assert.equal(activityLogs[0].action, "order-create");
});

test("verify payment confirms booking when signature is valid", async () => {
  const secret = "verify_secret";
  const previousSecret = env.razorpayKeySecret;
  env.razorpayKeySecret = secret;
  restorers.push(() => { env.razorpayKeySecret = previousSecret; });

  const orderId = "order_abc";
  const paymentId = "pay_abc";
  const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const activityLogs = [];
  let bookingStatus = "PENDING_PAYMENT";

  stub(prisma.booking, "findMany", async () => []);
  stub(prisma.booking, "findFirst", async (args) => {
    if (args?.where?.bookingRef) {
      return {
        id: "booking-1",
        bookingRef: "HMS-PAY-1",
        status: bookingStatus,
        paymentStatus: bookingStatus === "CONFIRMED" ? "PAID" : "PENDING",
        paymentMethod: "ONLINE",
        currency: "INR",
        checkInDate: futureDate(10),
        checkOutDate: futureDate(12),
        adults: 2,
        children: 0,
        roomCount: 1,
        subtotal: "400.00",
        discountAmount: "0.00",
        taxAmount: "48.00",
        extraBedAmount: "0.00",
        totalAmount: "448.00",
        specialRequests: null,
        expiresAt: bookingStatus === "CONFIRMED" ? null : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        confirmedAt: bookingStatus === "CONFIRMED" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        guest: { id: "guest-1", fullName: "Riya", email: "riya@example.com", phone: "9999999999" },
        rooms: [{ roomId: "room-1", quantity: 1, room: { name: "Deluxe", slug: "deluxe" } }],
      };
    }
    return {
      id: "booking-1",
      bookingRef: "HMS-PAY-1",
      status: bookingStatus,
      checkInDate: futureDate(10),
      checkOutDate: futureDate(12),
      rooms: [{ roomId: "room-1", quantity: 1 }],
    };
  });
  stub(prisma.payment, "findFirst", async () => ({
    id: "payment-1",
    bookingId: "booking-1",
    status: "PENDING",
    transactionId: orderId,
    providerOrderId: orderId,
    providerPaymentId: null,
    amount: "448.00",
  }));
  stub(prisma.payment, "update", async ({ data }) => ({
    id: "payment-1",
    bookingId: "booking-1",
    status: data.status,
    providerPaymentId: data.providerPaymentId,
    amount: "448.00",
    currency: "INR",
    provider: "RAZORPAY",
    method: "ONLINE",
    transactionId: data.transactionId || orderId,
    paidAt: data.paidAt || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    booking: { id: "booking-1", bookingRef: "HMS-PAY-1", status: "CONFIRMED", paymentStatus: "PAID", totalAmount: "448.00", currency: "INR" },
    refunds: [],
  }));
  stub(prisma.booking, "update", async ({ data }) => {
    if (data.status) bookingStatus = data.status;
    return { id: "booking-1", bookingRef: "HMS-PAY-1", status: bookingStatus };
  });
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => data);
  stub(prisma.activityLog, "create", async ({ data }) => activityLogs.push(data));
  stubTransaction();

  const response = await request("/api/payments/razorpay/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      bookingRef: "HMS-PAY-1",
      email: "riya@example.com",
      phone: "9999999999",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.booking.status, "CONFIRMED");
  assert.equal(activityLogs.some((item) => item.action === "paid"), true);
});

test("webhook rejects invalid signatures", async () => {
  const previous = env.razorpayWebhookSecret;
  env.razorpayWebhookSecret = "webhook_secret";
  restorers.push(() => { env.razorpayWebhookSecret = previous; });

  const response = await request("/api/payments/razorpay/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-razorpay-signature": "invalid",
    },
    body: JSON.stringify({ event: "payment.captured" }),
  });
  assert.equal(response.status, 400);
});

test("admin refund processes full refund and updates payment status", async () => {
  setRazorpayClient({
    payments: {
      refund: async (providerPaymentId, payload) => {
        assert.equal(providerPaymentId, "pay_abc");
        assert.equal(payload.amount, 44800);
        return { id: "rfnd_1", amount: payload.amount };
      },
    },
  });

  let bookingStatus = "CONFIRMED";
  let paymentFindCount = 0;

  stub(prisma.adminUser, "findFirst", async () => adminRecord(["payments.refund"]));
  stub(prisma.payment, "findFirst", async () => {
    paymentFindCount += 1;
    if (paymentFindCount === 1) {
      return {
        id: "payment-1",
        bookingId: "booking-1",
        status: "PAID",
        amount: "448.00",
        currency: "INR",
        providerPaymentId: "pay_abc",
        provider: "RAZORPAY",
        refunds: [],
        booking: { id: "booking-1", bookingRef: "HMS-PAY-1", status: "CONFIRMED", paymentStatus: "PAID" },
      };
    }
    return {
      id: "payment-1",
      bookingId: "booking-1",
      status: "REFUNDED",
      amount: "448.00",
      currency: "INR",
      provider: "RAZORPAY",
      method: "ONLINE",
      providerPaymentId: "pay_abc",
      transactionId: "pay_abc",
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      booking: {
        id: "booking-1",
        bookingRef: "HMS-PAY-1",
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
        totalAmount: "448.00",
        currency: "INR",
      },
      refunds: [{
        id: "refund-1",
        amount: "448.00",
        status: "SUCCEEDED",
        providerRefundId: "rfnd_1",
        reason: "Guest cancelled",
        processedAt: new Date(),
        createdAt: new Date(),
      }],
    };
  });
  stub(prisma.refund, "create", async () => ({ id: "refund-1" }));
  stub(prisma.refund, "update", async ({ data }) => ({ id: "refund-1", ...data }));
  stub(prisma.payment, "update", async ({ data }) => ({ id: "payment-1", ...data }));
  stub(prisma.booking, "findFirst", async () => ({
    id: "booking-1",
    bookingRef: "HMS-PAY-1",
    status: bookingStatus,
    checkInDate: "2026-11-10",
    checkOutDate: "2026-11-11",
    rooms: [{ roomId: "room-1", quantity: 1 }],
  }));
  stub(prisma.booking, "update", async ({ data }) => {
    if (data.status) bookingStatus = data.status;
    return { id: "booking-1", bookingRef: "HMS-PAY-1", status: bookingStatus };
  });
  stub(prisma.roomAvailability, "updateMany", async () => ({ count: 1 }));
  stub(prisma.bookingStatusHistory, "create", async ({ data }) => data);
  stub(prisma.activityLog, "create", async ({ data }) => data);
  stubTransaction();

  const unauth = await request("/api/admin/payments/payment-1/refund", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason: "Guest cancelled" }),
  });
  assert.equal(unauth.status, 401);

  const response = await request("/api/admin/payments/payment-1/refund", {
    method: "POST",
    headers: { cookie: cookie(), "content-type": "application/json" },
    body: JSON.stringify({ reason: "Guest cancelled" }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.payment.status, "REFUNDED");
});

test("public invoice returns booking amounts for verified guest", async () => {
  stub(prisma.booking, "findFirst", async (args) => {
    assert.equal(args.where.bookingRef, "HMS-PAY-1");
    assert.equal(args.where.guest.is.email, "riya@example.com");
    assert.equal(args.where.guest.is.phone, "9999999999");
    return {
      bookingRef: "HMS-PAY-1",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "ONLINE",
      currency: "INR",
      checkInDate: "2026-11-10",
      checkOutDate: "2026-11-12",
      adults: 2,
      children: 0,
      roomCount: 1,
      subtotal: "400.00",
      discountAmount: "0.00",
      extraBedAmount: "0.00",
      taxAmount: "48.00",
      totalAmount: "448.00",
      guest: { fullName: "Riya", email: "riya@example.com", phone: "9999999999" },
      rooms: [],
      payments: [{
        id: "payment-1",
        amount: "448.00",
        status: "PAID",
        currency: "INR",
        provider: "RAZORPAY",
        method: "ONLINE",
        paidAt: new Date(),
        providerPaymentId: "pay_1",
      }],
    };
  });

  const response = await request(
    "/api/bookings/HMS-PAY-1/invoice?email=riya@example.com&phone=9999999999"
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.invoiceNumber, "INV-HMS-PAY-1");
  assert.equal(body.data.amounts.totalAmount, "448.00");
});
