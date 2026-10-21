require("dotenv").config();
const dns = require("node:dns");
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const app = require("./app");
const prisma = require("./prisma/client");
const { startExpireHoldsJob } = require("./jobs/expireHolds.job");
const { startEmailRetryJob } = require("./jobs/emailRetry.job");
const { startCheckInReminderJob } = require("./jobs/checkInReminder.job");

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`HotelLMS backend listening on port ${PORT}`);
});

const jobs = [
  startExpireHoldsJob(),
  startEmailRetryJob(),
  startCheckInReminderJob(),
];

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    for (const job of jobs) job?.stop?.();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
