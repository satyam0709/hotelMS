const fs = require("node:fs/promises");
const path = require("node:path");
const nodemailer = require("nodemailer");
const env = require("../config/env");
const prisma = require("../prisma/client");
const { createPasswordResetEmail } = require("../templates/passwordResetEmail");
const {
  createAdminBookingNotificationEmail,
  createBookingCancellationEmail,
  createBookingConfirmationEmail,
  createCheckInReminderEmail,
} = require("../templates/bookingEmails");
const { createAdminInquiryNotificationEmail } = require("../templates/inquiryEmails");
const {
  createAdminRestaurantReservationEmail,
  createGuestRestaurantReservationStatusEmail,
} = require("../templates/restaurantReservationEmails");
const {
  bookingVariables,
  inquiryVariables,
  interpolate,
} = require("../utils/emailTemplateRender");

function createEmailService(config, mailer = nodemailer) {
  const useDatabaseConfig = config === undefined;
  config = config || env;
  let transporter;
  let transporterKey = "";

  async function resolveTemplateMessage(key, fallbackFactory, variables) {
    try {
      const notificationService = require("./notification.service");
      const template = await notificationService.getActiveTemplateByKey(key);
      if (template?.subject && (template.bodyHtml || template.bodyText)) {
        return {
          subject: interpolate(template.subject, variables),
          text: interpolate(template.bodyText || template.bodyHtml || "", variables),
          html: interpolate(template.bodyHtml || template.bodyText || "", variables),
          templateId: template.id,
        };
      }
    } catch {
      // Fall back to code templates.
    }
    return fallbackFactory();
  }

  async function resolveRuntime() {
    let db = {};
    if (useDatabaseConfig) {
      try {
        const notificationService = require("./notification.service");
        db = await notificationService.getRuntimeEmailConfig();
      } catch {
        db = {};
      }
    }

    const smtpHost = db.smtpHost || config.smtpHost || "";
    const smtpPort = Number(db.smtpPort || config.smtpPort || 0);
    const smtpUser = db.smtpUser || config.smtpUser || "";
    const smtpPassword = db.smtpPassword || config.smtpPassword || "";
    const fromEmail = db.fromEmail || config.emailFrom || "";
    const adminEmail = db.adminEmail || config.adminNotificationEmail || "";
    const smtpSecure = smtpPort === 465;

    return {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromEmail,
      adminEmail,
      smtpSecure,
      bookingEnabled: db.bookingEnabled ?? true,
      inquiryEnabled: db.inquiryEnabled ?? true,
      cancellationEnabled: db.cancellationEnabled ?? true,
      checkInReminderEnabled: db.checkInReminderEnabled ?? true,
    };
  }

  async function writeEmailLog({
    templateKey,
    templateId,
    recipient,
    subject,
    status,
    errorMessage,
    relatedType,
    relatedId,
  }) {
    try {
      await prisma.emailLog.create({
        data: {
          templateKey,
          templateId: templateId || null,
          recipient,
          subject,
          status,
          errorMessage: errorMessage || null,
          relatedType: relatedType || null,
          relatedId: relatedId || null,
          sentAt: status === "SENT" ? new Date() : null,
        },
      });
    } catch {
      // Logging must never break booking/inquiry flows.
    }
  }

  async function deliver(to, message, meta = {}) {
    const runtime = await resolveRuntime();
    if (!to) {
      await writeEmailLog({
        ...meta,
        recipient: "",
        subject: message.subject,
        status: "FAILED",
        errorMessage: "missing-recipient",
      });
      return { delivered: false, reason: "missing-recipient" };
    }

    try {
      if (runtime.smtpHost) {
        const nextKey = `${runtime.smtpHost}:${runtime.smtpPort}:${runtime.smtpUser}:${runtime.fromEmail}`;
        if (!transporter || transporterKey !== nextKey) {
          const transportOptions = {
            host: runtime.smtpHost,
            port: runtime.smtpPort,
            secure: runtime.smtpSecure,
          };
          if (runtime.smtpUser) {
            transportOptions.auth = { user: runtime.smtpUser, pass: runtime.smtpPassword };
          }
          transporter = mailer.createTransport(transportOptions);
          transporterKey = nextKey;
        }

        await transporter.sendMail({ from: runtime.fromEmail, to, ...message });
        const logEntry = await writeEmailLog({
          ...meta,
          recipient: to,
          subject: message.subject,
          status: "SENT",
        });
        try {
          require("../realtime/hub").publish("email.log", {
            recipient: to,
            subject: message.subject,
            status: "SENT",
            at: new Date().toISOString(),
          });
        } catch {}
        return { delivered: true, channel: "smtp" };
      }

      if (config.isProduction) {
        throw new Error("Email delivery is not configured.");
      }

      await fs.mkdir(path.dirname(config.devEmailOutboxPath), { recursive: true });
      await fs.appendFile(
        config.devEmailOutboxPath,
        `${JSON.stringify({ to, ...message, createdAt: new Date().toISOString() })}\n`,
        { encoding: "utf8", mode: 0o600 }
      );
      await writeEmailLog({
        ...meta,
        recipient: to,
        subject: message.subject,
        status: "SENT",
      });
      try {
        require("../realtime/hub").publish("email.log", {
          recipient: to,
          subject: message.subject,
          status: "SENT",
          channel: "outbox",
          at: new Date().toISOString(),
        });
      } catch {}
      return { delivered: true, channel: "outbox" };
    } catch (error) {
      await writeEmailLog({
        ...meta,
        recipient: to,
        subject: message.subject,
        status: "FAILED",
        errorMessage: error?.message || "email-send-failed",
      });
      try {
        require("../realtime/hub").publish("email.log", {
          recipient: to,
          subject: message.subject,
          status: "FAILED",
          errorMessage: error?.message || "email-send-failed",
          at: new Date().toISOString(),
        });
      } catch {}
      if (config.isProduction) throw error;
      return { delivered: false, reason: error?.message || "email-send-failed" };
    }
  }

  async function sendPasswordResetEmail({ to, resetUrl }) {
    const message = await resolveTemplateMessage(
      "password-reset",
      () => createPasswordResetEmail(resetUrl),
      { resetUrl },
    );
    return deliver(to, message, {
      templateKey: "password-reset",
      templateId: message.templateId,
      relatedType: "AdminUser",
    });
  }

  async function sendBookingConfirmationEmail(booking) {
    const runtime = await resolveRuntime();
    if (!runtime.bookingEnabled) return { delivered: false, reason: "booking-emails-disabled" };
    const to = booking?.guest?.email;
    const message = await resolveTemplateMessage(
      "booking-confirmation",
      () => createBookingConfirmationEmail(booking),
      bookingVariables(booking),
    );
    return deliver(to, message, {
      templateKey: "booking-confirmation",
      templateId: message.templateId,
      relatedType: "Booking",
      relatedId: booking?.id,
    });
  }

  async function sendBookingCancellationEmail(booking) {
    const runtime = await resolveRuntime();
    if (!runtime.cancellationEnabled) return { delivered: false, reason: "cancellation-emails-disabled" };
    const to = booking?.guest?.email;
    const message = await resolveTemplateMessage(
      "booking-cancellation",
      () => createBookingCancellationEmail(booking),
      bookingVariables(booking),
    );
    return deliver(to, message, {
      templateKey: "booking-cancellation",
      templateId: message.templateId,
      relatedType: "Booking",
      relatedId: booking?.id,
    });
  }

  async function sendAdminBookingNotification(booking) {
    const runtime = await resolveRuntime();
    if (!runtime.bookingEnabled) return { delivered: false, reason: "booking-emails-disabled" };
    const to = runtime.adminEmail;
    if (!to) return { delivered: false, reason: "admin-email-not-configured" };
    const message = await resolveTemplateMessage(
      "admin-booking-notification",
      () => createAdminBookingNotificationEmail(booking),
      bookingVariables(booking),
    );
    return deliver(to, message, {
      templateKey: "admin-booking-notification",
      templateId: message.templateId,
      relatedType: "Booking",
      relatedId: booking?.id,
    });
  }

  async function sendAdminInquiryNotification(inquiry) {
    const runtime = await resolveRuntime();
    if (!runtime.inquiryEnabled) return { delivered: false, reason: "inquiry-emails-disabled" };
    const to = runtime.adminEmail;
    if (!to) return { delivered: false, reason: "admin-email-not-configured" };
    const message = await resolveTemplateMessage(
      "admin-inquiry-notification",
      () => createAdminInquiryNotificationEmail(inquiry),
      inquiryVariables(inquiry),
    );
    return deliver(to, message, {
      templateKey: "admin-inquiry-notification",
      templateId: message.templateId,
      relatedType: "Inquiry",
      relatedId: inquiry?.id,
    });
  }

  async function sendAdminRestaurantReservationNotification(reservation) {
    const runtime = await resolveRuntime();
    if (!runtime.inquiryEnabled) return { delivered: false, reason: "inquiry-emails-disabled" };
    if (!runtime.adminEmail) return { delivered: false, reason: "admin-email-not-configured" };
    const message = createAdminRestaurantReservationEmail(reservation);
    return deliver(runtime.adminEmail, message, {
      templateKey: "admin-restaurant-reservation",
      relatedType: "RestaurantReservation",
      relatedId: reservation?.id,
    });
  }

  async function sendRestaurantReservationStatusNotification(reservation) {
    const runtime = await resolveRuntime();
    if (!runtime.inquiryEnabled) return { delivered: false, reason: "inquiry-emails-disabled" };
    if (!reservation?.guestEmail) return { delivered: false, reason: "guest-email-not-provided" };
    const message = createGuestRestaurantReservationStatusEmail(reservation);
    return deliver(reservation.guestEmail, message, {
      templateKey: "restaurant-reservation-status",
      relatedType: "RestaurantReservation",
      relatedId: reservation?.id,
    });
  }

  async function sendCheckInReminderEmail(booking) {
    const runtime = await resolveRuntime();
    if (!runtime.checkInReminderEnabled) return { delivered: false, reason: "check-in-reminder-disabled" };
    const to = booking?.guest?.email;
    const message = await resolveTemplateMessage(
      "check-in-reminder",
      () => createCheckInReminderEmail(booking),
      bookingVariables(booking),
    );
    return deliver(to, message, {
      templateKey: "check-in-reminder",
      templateId: message.templateId,
      relatedType: "Booking",
      relatedId: booking?.id,
    });
  }

  async function retryFailedEmail(log) {
    if (!log?.recipient || !log?.subject) {
      return { delivered: false, reason: "invalid-log" };
    }
    return deliver(log.recipient, {
      subject: log.subject,
      text: log.errorMessage ? `Retry of failed email.\n\nPrevious error: ${log.errorMessage}` : "Retry of failed email.",
      html: `<p>Retry of previously failed email.</p><p><strong>${String(log.subject).replace(/</g, "&lt;")}</strong></p>`,
    }, {
      templateKey: log.templateKey || "retry",
      templateId: log.templateId || null,
      relatedType: log.relatedType || null,
      relatedId: log.relatedId || null,
    });
  }

  async function sendTestEmail({ to }) {
    const runtime = await resolveRuntime();
    const recipient = to || runtime.adminEmail || runtime.fromEmail;
    if (!recipient) {
      return { delivered: false, reason: "No recipient specified and no admin/from email configured." };
    }

    const testTime = new Date().toLocaleString();
    const message = {
      subject: `[HotelMS] Test Email Notification - ${testTime}`,
      text: `Hello,\n\nThis is a real-time test email sent from your Hotel Management System.\nTimestamp: ${testTime}\nSMTP Host: ${runtime.smtpHost || "Development Local Outbox"}\nFrom: ${runtime.fromEmail || "System"}\n\nIf you received this message, your email service is fully functional!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">HotelMS Email Service Test</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">
            This is a real-time verification email from your <strong>Hotel Management System</strong>.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">ACTIVE &amp; OPERATIONAL</span></p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Timestamp:</strong> ${testTime}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Channel:</strong> ${runtime.smtpHost ? `SMTP (${runtime.smtpHost}:${runtime.smtpPort})` : "Local Dev Outbox"}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>From:</strong> ${runtime.fromEmail || "(System default)"}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>To:</strong> ${recipient}</p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            You can manage email templates, logs, and triggers anytime in the HotelMS Admin Dashboard.
          </p>
        </div>
      `,
    };

    return deliver(recipient, message, {
      templateKey: "system-test",
      relatedType: "SystemTest",
    });
  }

  return {
    sendAdminBookingNotification,
    sendAdminInquiryNotification,
    sendAdminRestaurantReservationNotification,
    sendRestaurantReservationStatusNotification,
    sendBookingCancellationEmail,
    sendBookingConfirmationEmail,
    sendCheckInReminderEmail,
    sendPasswordResetEmail,
    sendTestEmail,
    retryFailedEmail,
  };
}

module.exports = { createEmailService, ...createEmailService() };
