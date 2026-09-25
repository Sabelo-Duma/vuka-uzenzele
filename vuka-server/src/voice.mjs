/* ============================================================
   Msizi's natural voice — a neural text-to-speech model, free tier.

   The phone's own voices were rated 5/10 from a real iPhone: "sounds like a
   robot". The iPhone's South African voice (Tessa) is an old compact voice,
   and no setting in the browser reaches the Siri-quality ones. So English
   answers are spoken by Groq's Orpheus model instead: an expressive neural
   voice, on the same free Groq key the assistant already uses. No card, no
   new account.

   The free allowance is SMALL (at the time of writing 100 requests and a few
   thousand tokens a day, and each request is at most 200 characters). Three
   things make that go further, and one makes running out harmless:

   · Answers repeat. The written knowledge base is a fixed set of pages that
     everyone asks, so every clip is cached. A popular answer costs its
     allowance once, not once per person.
   · The app packs sentences into as few 200-character clips as it can.
   · The daily cap here sits just under the provider's own.
   · When the allowance is spent, or the provider says no, this answers 503
     and the app speaks with the phone's own voice, as it always did. The
     person hears a less lovely voice. They do not hear silence.

   Only English. Orpheus is an English model, and handed isiZulu it would
   mispronounce every word — worse than the phone's fallback.

   Privacy: the text is the answer being read, sent from this server with no
   name or account attached. Answers read from a person's own record are
   never sent here (the app keeps those on the phone's voice).
   ============================================================ */

const MODEL = 'canopylabs/orpheus-v1-english';
const URL = 'https://api.groq.com/openai/v1/audio/speech';
/* The three female voices are autumn, diana and hannah. */
const VOICES = ['hannah', 'diana', 'autumn'];
export const MAX_CHARS = 200;

const DAILY_CAP = Number(process.env.VUKA_TTS_DAILY_CAP || 95);
const CACHE_MAX_BYTES = Number(process.env.VUKA_TTS_CACHE_BYTES || 48 * 1024 * 1024);

function key() { return process.env.VUKA_GROQ_API_KEY?.trim() || ''; }

export function defaultVoice() {
  const v = process.env.VUKA_TTS_VOICE?.trim().toLowerCase();
  return VOICES.includes(v) ? v : 'hannah';
}

export const voiceConfigured = () => key() !== '';

/* ---- budget and back-off ---------------------------------------------- */

let day = '';
let used = 0;
let blockedUntil = 0;
let blockedReason = null;

function rollDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; used = 0; }
}

function block(ms, reason) {
  blockedUntil = Date.now() + ms;
  blockedReason = reason;
}

/* ---- cache ------------------------------------------------------------- */

/* Map keeps insertion order, so re-inserting on a hit makes it an LRU. */
const cache = new Map();
let cacheBytes = 0;

function cacheGet(k) {
  const v = cache.get(k);
  if (!v) return null;
  cache.delete(k);
  cache.set(k, v);
  return v;
}

function cachePut(k, buf) {
  if (buf.length > CACHE_MAX_BYTES / 4) return;
  cache.set(k, buf);
  cacheBytes += buf.length;
  for (const [old, b] of cache) {
    if (cacheBytes <= CACHE_MAX_BYTES) break;
    cache.delete(old);
    cacheBytes -= b.length;
  }
}

export function voiceStats() {
  rollDay();
  return {
    configured: voiceConfigured(),
    voice: defaultVoice(),
    usedToday: used,
    dailyCap: DAILY_CAP,
    cached: cache.size,
    blocked: Date.now() < blockedUntil ? blockedReason : null,
  };
}

/** Normalise so the same sentence always hits the same cache slot. */
function clean(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Speak one clip. Resolves to a WAV Buffer, or throws with `.code`:
 * 'not_configured' | 'too_long' | 'empty' | 'over_budget' | 'unavailable'.
 */
export async function synthesize(rawText, requestedVoice) {
  const text = clean(rawText);
  if (!text) throw Object.assign(new Error('empty'), { code: 'empty' });
  if (text.length > MAX_CHARS) throw Object.assign(new Error('too long'), { code: 'too_long' });
  if (!voiceConfigured()) throw Object.assign(new Error('no key'), { code: 'not_configured' });

  const voice = VOICES.includes(requestedVoice) ? requestedVoice : defaultVoice();
  const k = `${voice}\u0000${text}`;
  const hit = cacheGet(k);
  if (hit) return { audio: hit, cached: true };

  rollDay();
  if (Date.now() < blockedUntil) throw Object.assign(new Error(`blocked: ${blockedReason}`), { code: 'over_budget' });
  if (used >= DAILY_CAP) throw Object.assign(new Error('daily cap'), { code: 'over_budget' });
  used += 1;

  let res;
  try {
    res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key()}` },
      body: JSON.stringify({ model: MODEL, voice, input: text, response_format: 'wav' }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    throw Object.assign(new Error(`voice fetch failed: ${e.message}`), { code: 'unavailable' });
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    if (res.status === 429) {
      /* Out of free allowance. Stop asking until the provider says we may —
         hammering it only burns the next window too. */
      const retry = Number(res.headers.get('retry-after'));
      block(Number.isFinite(retry) && retry > 0 ? retry * 1000 : 60 * 60 * 1000, 'rate_limited');
      throw Object.assign(new Error(`voice 429: ${detail}`), { code: 'over_budget' });
    }
    if (/terms/i.test(detail)) {
      /* Groq asks for the model's terms to be accepted once, in the console,
         by the account owner. Nothing here can do that. */
      block(60 * 60 * 1000, 'terms_not_accepted');
    }
    throw Object.assign(new Error(`voice ${res.status}: ${detail}`), { code: 'unavailable' });
  }

  const audio = Buffer.from(await res.arrayBuffer());
  if (audio.length < 100) throw Object.assign(new Error('voice: empty audio'), { code: 'unavailable' });
  cachePut(k, audio);
  return { audio, cached: false };
}
