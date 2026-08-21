const nodemailer = require('nodemailer');

// Lazily build a transporter only if SMTP credentials are present in .env.
// This keeps the project runnable in dev without an email account -
// OTPs just get printed to the server console instead of emailed.
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function sendOtpEmail(to, otp, purpose = 'verify') {
  const subject =
    purpose === 'reset' ? 'ReTech AI - Password reset code' : 'ReTech AI - Verify your email';
  const heading = purpose === 'reset' ? 'Reset your password' : 'Verify your account';
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto">
      <h2 style="color:#4F46E5">${heading}</h2>
      <p>Your one-time verification code is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px">${otp}</p>
      <p style="color:#6B7280;font-size:13px">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>`;

  const t = getTransporter();
  if (!t) {
    // Dev fallback - no SMTP configured, so surface the code in the server logs.
    console.log(`\n[emailService] SMTP not configured. OTP for ${to} (${purpose}): ${otp}\n`);
    return { delivered: false };
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM || 'ReTech AI <no-reply@retech.ai>',
    to,
    subject,
    html,
  });
  return { delivered: true };
}

module.exports = { generateOtp, sendOtpEmail };
