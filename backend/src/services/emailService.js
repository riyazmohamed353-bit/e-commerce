// Sends OTP emails through the Gmail API (HTTPS), using OAuth2 credentials
// tied to a real Gmail account. This deliberately avoids SMTP (smtp.gmail.com)
// because Render's free tier blocks outbound SMTP ports (25/465/587) -
// the Gmail API runs over HTTPS (443), which is not blocked.
//
// One-time setup required (see backend/.env.example for the full walkthrough):
//   GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// Exchanges the long-lived refresh token for a short-lived access token.
// Access tokens expire in ~1hr, so we fetch a fresh one on every send rather
// than caching - simpler and avoids any expiry-edge-case bugs.
async function getAccessToken() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to refresh Gmail access token: ${response.status} ${body}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Gmail's API expects a full RFC 2822 email, base64url-encoded.
function buildRawMessage({ from, to, subject, html }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

  const { GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
  if (!GMAIL_USER || !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    // Dev fallback - Gmail API not configured yet, so surface the code in the
    // server logs instead of failing registration/login outright.
    console.log(`\n[emailService] Gmail API not configured. OTP for ${to} (${purpose}): ${otp}\n`);
    return { delivered: false };
  }

  const accessToken = await getAccessToken();
  const raw = buildRawMessage({
    from: `ReTech AI <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[emailService] Gmail API send error ${response.status}:`, body);
    throw new Error(`Failed to send OTP email (Gmail API ${response.status})`);
  }

  return { delivered: true };
}

module.exports = { generateOtp, sendOtpEmail };
