function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function createPasswordResetEmail(resetUrl) {
  const safeResetUrl = escapeHtml(resetUrl);
  return {
    subject: "Reset your HotelMS admin password",
    text: `Use this link to reset your admin password: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your admin password.</p><p><a href="${safeResetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  };
}

module.exports = { createPasswordResetEmail };