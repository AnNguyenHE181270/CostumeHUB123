const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"CostumeHUB" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Error while sending mail:", err);
    throw err;
  }
};

// Bảng màu badge trạng thái — dùng bg/border/text tường minh thay vì hex+alpha để hiển thị
// nhất quán trên cả các mail client cũ (Outlook desktop) không hỗ trợ 8-digit hex.
const BADGE_STYLES = {
  default: { bg: "#f3f3f3", border: "#dddddd", text: "#111111" },
  success: { bg: "#eaf7ec", border: "#b7e4c7", text: "#1a7f37" },
  warning: { bg: "#fff8e6", border: "#f5d78e", text: "#b7791f" },
  danger: { bg: "#fdecec", border: "#f5b8b8", text: "#c53030" },
};

// Layout email dùng chung cho toàn bộ email gửi khách hàng (header/footer tối màu, nút CTA, card bo góc)
// — cùng phong cách branding với email đặt lại mật khẩu trước đây, tránh mỗi luồng tự vẽ HTML rời rạc.
function renderEmailHtml({ heading, bodyHtml, ctaText, ctaUrl, badgeText, badgeColor = "default", footerNote }) {
  const badge = BADGE_STYLES[badgeColor] || BADGE_STYLES.default;

  const badgeHtml = badgeText
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;"><tr><td style="background-color: ${badge.bg}; border: 1px solid ${badge.border}; color: ${badge.text}; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 999px;">${badgeText}</td></tr></table>`
    : "";

  const ctaHtml = ctaUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
        <tr><td align="center">
          <a href="${ctaUrl}" style="display: inline-block; padding: 14px 40px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">${ctaText || "Xem chi tiết"}</a>
        </td></tr>
      </table>`
    : "";

  const footerNoteHtml = footerNote
    ? `<tr><td style="padding: 0 40px 32px;"><p style="font-size: 13px; line-height: 1.6; color: #999999; border-top: 1px solid #eeeeee; padding-top: 20px; margin: 0;">${footerNote}</p></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-width: 600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 0; background-color: #111111;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase;">CostumeHUB</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px;">
              ${badgeHtml}
              <h2 style="margin-top: 0; font-size: 20px; font-weight: 600; color: #111111;">${heading}</h2>
              <div style="font-size: 16px; line-height: 1.6; color: #555555;">${bodyHtml}</div>
              ${ctaHtml}
            </td>
          </tr>

          ${footerNoteHtml}

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eaeaea;">
              <p style="font-size: 14px; color: #888888; margin: 0; margin-bottom: 8px;">Trân trọng,</p>
              <p style="font-size: 16px; font-weight: 600; color: #111111; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Đội ngũ CostumeHUB</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = sendEmail;
module.exports.renderEmailHtml = renderEmailHtml;
