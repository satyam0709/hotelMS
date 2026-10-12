const cron = require("node-cron");
const prisma = require("../prisma/client");
const emailService = require("../services/email.service");
const notificationService = require("../services/notification.service");

function dateOnly(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Send check-in reminders ~24h before arrival for confirmed stays.
 */
function startCheckInReminderJob() {
  const task = cron.schedule("15 * * * *", async () => {
    try {
      const runtime = await notificationService.getRuntimeEmailConfig();
      if (!runtime.checkInReminderEnabled) return;

      const target = addDays(dateOnly(new Date()), 1);
      const checkInDate = new Date(`${target}T00:00:00.000Z`);

      const bookings = await prisma.booking.findMany({
        where: {
          checkInDate,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED", "UNPAID", "PENDING"] },
          guest: { is: { deletedAt: null, email: { not: null } } },
        },
        take: 100,
        select: {
          id: true,
          bookingRef: true,
          status: true,
          checkInDate: true,
          checkOutDate: true,
          totalAmount: true,
          currency: true,
          guest: { select: { fullName: true, email: true, phone: true } },
        },
      });

      let sent = 0;
      for (const booking of bookings) {
        const existing = await prisma.emailLog.findFirst({
          where: {
            templateKey: "check-in-reminder",
            relatedType: "Booking",
            relatedId: booking.id,
            status: { in: ["SENT", "PENDING"] },
          },
          select: { id: true },
        });
        if (existing) continue;

        const result = await emailService.sendCheckInReminderEmail(booking);
        if (result?.delivered) sent += 1;
      }

      if (sent > 0) {
        console.log(`[checkInReminder] Sent ${sent} reminder(s) for ${target}.`);
      }
    } catch (error) {
      console.error("[checkInReminder] Job failed:", error?.message || error);
    }
  });

  return task;
}

module.exports = { startCheckInReminderJob };
