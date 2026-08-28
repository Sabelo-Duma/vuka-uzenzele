/* ============================================================
   Outbound SMS — one seam, pluggable providers.

   Everything that has to reach a phone (sign-up OTP, password-reset code,
   "you've been hired") goes through sendSms(). Swapping provider is env-only;
   no caller changes.

     VUKA_SMS_PROVIDER = console (default) | http | twilio

   console : logs the message. Correct for dev; in production it means no SMS
             actually leaves the building — see `smsConfigured`.
   http    : POST JSON to VUKA_SMS_URL. The payload SHAPE is configurable, so
             a provider whose field names differ needs no code change:

               VUKA_SMS_URL            the endpoint
               VUKA_SMS_BODY           JSON template. Placeholders:
                                         {{to}}        +27821234567
                                         {{to_digits}} 27821234567  (no plus)
                                         {{text}}      the message
                                       Default {"to":"…","body":"…"}
               VUKA_SMS_AUTH           sent verbatim as the Authorization header
               VUKA_SMS_USER / _PASS   or these, and Basic auth is built for you
               VUKA_SMS_HEADERS        or a JSON object of headers, for the
                                       providers that authenticate with their
                                       own named headers rather than Authorization

             Verify the template against your provider's own docs — field names
             vary (to/body, to/message, msisdn/text) and getting it wrong is a
             silent non-delivery, not an error.
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

/** Default payload. Matches BulkSMS.com's JSON API; others vary — see above. */
export const DEFAULT_SMS_BODY = '{"to":"{{to}}","body":"{{text}}"}';

/**
 * Fill {{to}} / {{text}} into a JSON template.
 *
 * Values are escaped as JSON string contents first. A message containing a
 * quote, a backslash or a newline would otherwise produce malformed JSON —
 * and OTP copy is one apostrophe away from that at all times.
 */
export function renderSmsBody(template, to, text) {
  const esc = (v) => JSON.stringify(String(v)).slice(1, -1);
  /* to_digits first: replacing {{to}} first would leave "{{to_digits}}" as
     "+27821234567_digits}}". Longest placeholder wins. */
  const out = template
    .replace(/\{\{to_digits\}\}/g, esc(String(to).replace(/\D/g, '')))
    .replace(/\{\{to\}\}/g, esc(to))
    .replace(/\{\{text\}\}/g, esc(text));
  try {
    JSON.parse(out);
  } catch {
    throw new Error('VUKA_SMS_BODY is not valid JSON once filled in — check the template');
  }
  return out;
}

/**
 * Auth headers, however the provider wants them expressed.
 *
 * Not every gateway uses Authorization: several SA providers authenticate with
 * their own named headers (SMS Messenger wants `email` and `token`), so an
 * arbitrary header map has to be supported or those need a code change — which
 * is the exact thing this module exists to avoid.
 */
export function authHeaders() {
  const extra = process.env.VUKA_SMS_HEADERS;
  if (extra) {
    try {
      const parsed = JSON.parse(extra);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v)]));
      }
      throw new Error('not an object');
    } catch {
      throw new Error('VUKA_SMS_HEADERS must be a JSON object, e.g. {"email":"you@x.co.za","token":"…"}');
    }
  }
  if (process.env.VUKA_SMS_AUTH) return { Authorization: process.env.VUKA_SMS_AUTH };
  const user = process.env.VUKA_SMS_USER;
  const pass = process.env.VUKA_SMS_PASS;
  if (user && pass) {
    return { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` };
  }
  return {};
}

async function viaHttp(to, body) {
  const url = process.env.VUKA_SMS_URL;
  if (!url) throw new Error('VUKA_SMS_URL is not set');
  const payload = renderSmsBody(process.env.VUKA_SMS_BODY || DEFAULT_SMS_BODY, toE164(to), body);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: payload,
  });
  /* Carry a little of the provider's own reply. "responded 400" alone sends you
     to their dashboard to guess; their message usually names the field. */
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`SMS gateway responded ${res.status}${text ? ` — ${text.slice(0, 200)}` : ''}`);

  /* A 200 is not proof of anything. Several gateways answer 200 with an error
     in the body — SMS Messenger returns {"messageId":…,"error":null} — and
     trusting the status alone turns a rejected message into a silent success,
     which is the worst outcome available for an OTP. */
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && parsed.error != null && parsed.error !== '') {
        throw new Error(`SMS gateway accepted the request but reported: ${JSON.stringify(parsed.error).slice(0, 200)}`);
      }
    } catch (e) {
      if (e instanceof SyntaxError) return; // not JSON; the 2xx is all we have
      throw e;
    }
  }
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
