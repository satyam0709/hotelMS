const AppError = require("./appError");
const env = require("../config/env");

async function verifyTurnstileIfConfigured(token) {
  if (!env.turnstileSecretKey) return;

  if (!token || typeof token !== "string" || !token.trim()) {
    throw new AppError(400, "CAPTCHA verification is required.", "CAPTCHA_REQUIRED");
  }

  let response;
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.turnstileSecretKey,
        response: token.trim(),
      }),
    });
  } catch {
    throw new AppError(502, "CAPTCHA verification service unavailable.", "CAPTCHA_UNAVAILABLE");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new AppError(502, "CAPTCHA verification service unavailable.", "CAPTCHA_UNAVAILABLE");
  }

  if (!payload?.success) {
    throw new AppError(400, "CAPTCHA verification failed.", "CAPTCHA_FAILED");
  }
}

module.exports = { verifyTurnstileIfConfigured };
