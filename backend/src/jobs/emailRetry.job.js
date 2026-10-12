const cron = require("node-cron");
const prisma = require("../prisma/client");
const emailService = require("../services/email.service");

/**
 * Retry recently failed outbound emails (bounded batch).
 */
function startEmailRetryJob() {
  const task = cron.schedule("*/10 * * * *", async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const failed = await prisma.emailLog.findMany({
        where: {
          status: "FAILED",
          createdAt: { gte: since },
          recipient: { not: "" },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      let retried = 0;
      for (const log of failed) {
        const alreadyRetried = await prisma.emailLog.findFirst({
          where: {
            status: "SENT",
            relatedType: log.relatedType || undefined,
            relatedId: log.relatedId || undefined,
            templateKey: log.templateKey || undefined,
            createdAt: { gt: log.createdAt },
          },
          select: { id: true },
        });
        if (alreadyRetried) continue;

        const result = await emailService.retryFailedEmail(log);
        if (result?.delivered) retried += 1;
      }

      if (retried > 0) {
        console.log(`[emailRetry] Retried ${retried} failed email(s).`);
      }
    } catch (error) {
      console.error("[emailRetry] Job failed:", error?.message || error);
    }
  });

  return task;
}

module.exports = { startEmailRetryJob };
