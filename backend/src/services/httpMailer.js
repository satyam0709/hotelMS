// Sends email over HTTPS (port 443) instead of SMTP. Works on Render free tier.
// Put this file next to email.service.js (e.g. src/services/httpMailer.js).
//
// Env vars:
//   EMAIL_PROVIDER = brevo | resend
//   EMAIL_API_KEY  = your provider API key
//   EMAIL_FROM     = "Hotel Name <verified-sender@example.com>"

function parseFrom(from) {
  const match = String(from || "").match(/^\s*"?([^"<]*)"?\s*<(.+)>\s*$/);
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { name: undefined, email: String(from || "").trim() };
}

async function sendViaHttp({ provider, apiKey, from, to, subject, text, html, timeoutMs = 15000 }) {
  if (!apiKey) throw new Error("EMAIL_API_KEY is not set.");
  if (!from) throw new Error("EMAIL_FROM is not set.");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res;
    if (provider === "brevo") {
      const sender = parseFrom(from);
      res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { email: sender.email, ...(sender.name ? { name: sender.name } : {}) },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
        signal: controller.signal,
      });
    } else if (provider === "resend") {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
        signal: controller.signal,
      });
    } else {
      throw new Error(`Unknown EMAIL_PROVIDER "${provider}" (use "brevo" or "resend").`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`${provider} API ${res.status}: ${body.slice(0, 300)}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { sendViaHttp };

/* ------------------------------------------------------------------
 In email.service.js:

 1) At the top:
    const { sendViaHttp } = require("./httpMailer");

 2) Inside deliver(), directly inside the `try {` and BEFORE `if (runtime.smtpHost) {`:

    const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
    if (provider && process.env.EMAIL_API_KEY) {
      await sendViaHttp({
        provider,
        apiKey: process.env.EMAIL_API_KEY,
        from: runtime.fromEmail || process.env.EMAIL_FROM,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      await writeEmailLog({ ...meta, recipient: to, subject: message.subject, status: "SENT" });
      try {
        require("../realtime/hub").publish("email.log", {
          recipient: to, subject: message.subject, status: "SENT", channel: provider,
          at: new Date().toISOString(),
        });
      } catch {}
      return { delivered: true, channel: provider };
    }
------------------------------------------------------------------ */
