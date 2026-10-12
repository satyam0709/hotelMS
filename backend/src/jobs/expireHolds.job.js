const cron = require("node-cron");
const bookingService = require("../services/booking.service");

/**
 * Periodically expire unpaid booking holds so inventory is released
 * without waiting for the next guest/admin request.
 */
function startExpireHoldsJob() {
  // Every 2 minutes
  const task = cron.schedule("*/2 * * * *", async () => {
    try {
      const result = await bookingService.expireStaleHolds();
      if (result?.expired > 0) {
        console.log(`[expireHolds] Released ${result.expired} stale hold(s).`);
      }
    } catch (error) {
      console.error("[expireHolds] Job failed:", error?.message || error);
    }
  });

  return task;
}

module.exports = { startExpireHoldsJob };
