/* ============================================================
   Outbound SMS — one seam, pluggable providers.

   Everything that has to reach a phone (sign-up OTP, password-reset code,
   "you've been hired") goes through sendSms(). Swapping provider is env-only;
   no caller changes.

     VUKA_SMS_PROVIDER = console (default) | http | twilio

   console : logs the message. Correct for dev; in production it means no SMS
             actually leaves the building — see `smsConfigured`.
   http    : POST {to, body} as JSON to VUKA_SMS_URL, with the optional
             VUKA_SMS_AUTH sent as the Authorization header. Fits most SA
             aggregators (Clickatell, BulkSMS, Panacea) directly or via a
             one-line proxy.
   twilio  : Twilio REST API (VUKA_TWILIO_SID / _TOKEN / _FROM).
   ============================================================ */

export const smsProvider = (process.env.VUKA_SMS_PROVIDER || 'console').toLowerCase();

/** True when a real provider is wired up (i.e. messages actually get delivered). */
export const smsConfigured = smsProvider !== 'console';

/**
 * Pilot escape hatch: return one-time codes in the API response so sign-up and
 * password reset work before an SMS contract is in place. NEVER for real users —
 * anyone who knows a phone number could then take over the account.
 */
export const otpEcho = process.env.VUKA_OTP_ECHO === '1';

if (process.env.NODE_ENV === 'production') {
  if (!smsConfigured) console.warn('WARNING: VUKA_SMS_PROVIDER is not set — no SMS will be delivered. Sign-up needs either a provider or VUKA_OTP_ECHO=1 (insecure, pilot only).');
  if (otpEcho) console.warn('WARNING: VUKA_OTP_ECHO=1 in production — one-time codes are returned in API responses. Pilot only; unset before real users.');
}

/** Normalise a SA mobile number to E.164 (+27…) for providers that need it. */
export function toE164(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('27')) return `+${digits}`;
  if (digits.startsWith('0')) return `+27${digits.slice(1)}`;
  return `+${digits}`;
}

async function viaHttp(to, body) {
  const url = process.env.VUKA_SMS_URL;
  if (!url) throw new Error('VUKA_SMS_URL is not set');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.VUKA_SMS_AUTH ? { Authorization: process.env.VUKA_SMS_AUTH } : {}),
    },
    body: JSON.stringify({ to: toE164(to), body }),
  });
  if (!res.ok) throw new Error(`SMS gateway responded ${res.status}`);
}

async function viaTwilio(to, body) {
  const sid = process.env.VUKA_TWILIO_SID;
  const token = process.env.VUKA_TWILIO_TOKEN;
  const from = process.env.VUKA_TWILIO_FROM;
  if (!sid || !token || !from) throw new Error('VUKA_TWILIO_SID / _TOKEN / _FROM must all be set');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toE164(to), From: from, Body: body }).toString(),
  });
  if (!res.ok) throw new Error(`Twilio responded ${res.status}`);
}

/**
 * Send an SMS. Never throws: delivery is best-effort and the caller decides how
 * much a failure matters (an OTP send reports it; a "you're hired" nudge doesn't).
 * @returns {Promise<{delivered: boolean, provider: string, error?: string}>}
 */
export async function sendSms(to, body) {
  try {
    if (smsProvider === 'http') await viaHttp(to, body);
    else if (smsProvider === 'twilio') await viaTwilio(to, body);
    else {
      console.log(`[sms:console] → ${toE164(to)}: ${body}`);
      return { delivered: false, provider: 'console' };
    }
    return { delivered: true, provider: smsProvider };
  } catch (e) {
    console.error(`SMS send failed via ${smsProvider}:`, e.message);
    return { delivered: false, provider: smsProvider, error: e.message };
  }
}
