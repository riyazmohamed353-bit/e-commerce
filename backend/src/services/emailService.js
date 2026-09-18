// Sends OTP emails through the Brevo API (HTTPS), using an API key.
// Render's free tier blocks outbound SMTP ports (25/465/587), so we use
// Brevo's HTTPS API (443) instead - no SMTP, no OAuth token refresh needed.
//
// One-time setup required (see backend/.env.example):
//   BREVO_API_KEY, BREVO_SENDER_EMAIL (must be a verified sender/domain in Brevo)

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

  const { BREVO_API_KEY, BREVO_SENDER_EMAIL } = process.env;
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    // Dev fallback - Brevo not configured yet, so surface the code in the
    // server logs instead of failing registration/login outright.
    console.log(`\n[emailService] Brevo not configured. OTP for ${to} (${purpose}): ${otp}\n`);
    return { delivered: false };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'ReTech AI', email: BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[emailService] Brevo send error ${response.status}:`, body);
    throw new Error(`Failed to send OTP email (Brevo API ${response.status})`);
  }

  return { delivered: true };
}

module.exports = { generateOtp, sendOtpEmail };