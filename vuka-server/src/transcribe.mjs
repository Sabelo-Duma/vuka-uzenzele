/* ============================================================
   Msizi listening, when the phone cannot.

   A phone's own speech recogniser is free and instant, but it only knows the
   languages its maker put there. iPhone has none of isiZulu, isiXhosa,
   Sesotho or Afrikaans (Apple's dictation list), and it refuses before it
   even asks for the microphone — which is why tapping the mic in isiZulu
   showed no permission prompt at all. Installed web apps on iPhone are
   unreliable even in English.

   So for the languages Whisper knows, the app records the question and the
   server turns it into text with Groq's hosted Whisper: free tier, no card,
   and by Groq's policy not retained. Whisper's language list includes English
   and Afrikaans and does NOT include isiZulu, isiXhosa or Sesotho
   (whisper/tokenizer.py) — asking it to transcribe those would produce
   confident nonsense, so they are refused here rather than attempted.

   Free-tier limits (console.groq.com/docs/rate-limits): 2,000 requests and
   8 hours of audio a day. The cap below stays under that.
   ============================================================ */

const API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = process.env.VUKA_STT_MODEL || 'whisper-large-v3-turbo';
/** Of the app's five languages, the ones Whisper can actually transcribe. */
export const STT_LANGS = ['en', 'af'];
export const STT_MAX_BYTES = 1_500_000;          // ~60 s of speech as Opus or AAC
const DAILY_CAP = Number(process.env.VUKA_STT_DAILY_CAP || 1500);
const TIMEOUT_MS = 20_000;

function key() { return process.env.VUKA_GROQ_API_KEY?.trim() || ''; }
export function sttConfigured() { return Boolean(key()); }

let day = '';
let used = 0;
function spend() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; used = 0; }
  if (used >= DAILY_CAP) return false;
  used += 1;
  return true;
}
export function sttStats() { return { configured: sttConfigured(), langs: STT_LANGS, usedToday: day === new Date().toISOString().slice(0, 10) ? used : 0, dailyCap: DAILY_CAP }; }

const fail = (code, message) => Object.assign(new Error(message ?? code), { code });

/** The file extension Groq infers the format from. */
function extFor(mime) {
  const m = String(mime).toLowerCase();
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'mp4';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  return 'webm';
}

/**
 * Speech to text. Throws with `code`: not_configured | unsupported_language |
 * empty | too_large | over_budget | unavailable.
 */
export async function transcribe(bytes, mime, lang) {
  if (!key()) throw fail('not_configured');
  if (!STT_LANGS.includes(lang)) throw fail('unsupported_language');
  if (!bytes || bytes.length < 800) throw fail('empty');
  if (bytes.length > STT_MAX_BYTES) throw fail('too_large');
  if (!spend()) throw fail('over_budget');

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime || 'audio/webm' }), `question.${extFor(mime)}`);
  form.append('model', MODEL);
  form.append('language', lang);
  form.append('response_format', 'json');
  form.append('temperature', '0');

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key()}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    throw fail('unavailable', `transcribe: ${e.message}`);
  }
  if (res.status === 429) throw fail('over_budget', 'transcribe 429');
  if (!res.ok) throw fail('unavailable', `transcribe ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  const body = await res.json().catch(() => ({}));
  return String(body.text ?? '').trim();
}
