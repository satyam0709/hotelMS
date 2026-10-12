function createAdminInquiryNotificationEmail(inquiry) {
  const subject = `New inquiry: ${inquiry.subject || inquiry.type || "Contact form"}`;
  const text = [
    "A new website inquiry was submitted.",
    "",
    `Name: ${inquiry.name || "-"}`,
    `Email: ${inquiry.email || "-"}`,
    `Phone: ${inquiry.phone || "-"}`,
    `Type: ${inquiry.type || "-"}`,
    `Subject: ${inquiry.subject || "-"}`,
    "",
    inquiry.message || "",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a2e0a">
      <h2>New inquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(inquiry.name || "-")}</p>
      <p><strong>Email:</strong> ${escapeHtml(inquiry.email || "-")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(inquiry.phone || "-")}</p>
      <p><strong>Type:</strong> ${escapeHtml(inquiry.type || "-")}</p>
      <p><strong>Subject:</strong> ${escapeHtml(inquiry.subject || "-")}</p>
      <p>${escapeHtml(inquiry.message || "").replace(/\n/g, "<br/>")}</p>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { createAdminInquiryNotificationEmail };
