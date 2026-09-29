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

import { createHash } from 'node:crypto';
import { all, get, run, toBytes } from './db.mjs';

const MODEL = 'canopylabs/orpheus-v1-english';
const API_URL = 'https://api.groq.com/openai/v1/audio/speech';
/* The three female voices are autumn, diana and hannah. */
const VOICES = ['hannah', 'diana', 'autumn'];
export const MAX_CHARS = 200;

const DAILY_CAP = Number(process.env.VUKA_TTS_DAILY_CAP || 95);
const CACHE_MAX_BYTES = Number(process.env.VUKA_TTS_CACHE_BYTES || 48 * 1024 * 1024);
/* The durable copy, in the database. Sized well inside the free 500 MB: a
   clip is a few hundred kilobytes, so this holds every written answer read
   aloud several times over. */
const DB_CACHE_MAX_BYTES = Number(process.env.VUKA_TTS_DB_CACHE_BYTES || 60 * 1024 * 1024);

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
  /* Two people missing the cache on the same sentence at once both store it;
     count the bytes once, or the total creeps up and evicts too early. */
  const prev = cache.get(k);
  if (prev) { cache.delete(k); cacheBytes -= prev.length; }
  cache.set(k, buf);
  cacheBytes += buf.length;
  for (const [old, b] of cache) {
    if (cacheBytes <= CACHE_MAX_BYTES) break;
    cache.delete(old);
    cacheBytes -= b.length;
  }
}

/* ---- durable cache (database) ------------------------------------------ */

const dbKey = (k) => createHash('sha256').update(k).digest('hex');

async function dbCacheGet(k) {
  try {
    const row = await get('SELECT bytes FROM tts_clips WHERE key = ?', [dbKey(k)]);
    if (!row) return null;
    /* Touch it, so eviction takes the clips nobody has asked for lately. */
    void run('UPDATE tts_clips SET used_at = ? WHERE key = ?', [new Date().toISOString(), dbKey(k)]).catch(() => {});
    return toBytes(row.bytes);
  } catch {
    return null; // a cache must never be the reason a clip fails
  }
}

async function dbCachePut(k, voice, buf) {
  try {
    const now = new Date().toISOString();
    await run('DELETE FROM tts_clips WHERE key = ?', [dbKey(k)]);
    await run('INSERT INTO tts_clips (key, voice, bytes, size, created_at, used_at) VALUES (?,?,?,?,?,?)',
      [dbKey(k), voice, buf, buf.length, now, now]);
    const total = Number((await get('SELECT COALESCE(SUM(size), 0) AS n FROM tts_clips'))?.n ?? 0);
    if (total > DB_CACHE_MAX_BYTES) {
      let over = total - DB_CACHE_MAX_BYTES;
      for (const r of await all('SELECT key, size FROM tts_clips ORDER BY used_at ASC LIMIT 200')) {
        if (over <= 0) break;
        await run('DELETE FROM tts_clips WHERE key = ?', [r.key]);
        over -= Number(r.size);
      }
    }
  } catch { /* best effort */ }
}

export async function voiceCacheStats() {
  try {
    const r = await get('SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS b FROM tts_clips');
    return { clips: Number(r?.n ?? 0), bytes: Number(r?.b ?? 0) };
  } catch {
    return { clips: 0, bytes: 0 };
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
  /* Then the durable copy: a clip bought once is never bought again, across
     restarts and deploys. */
  const stored = await dbCacheGet(k);
  if (stored) { cachePut(k, stored); return { audio: stored, cached: true }; }

  rollDay();
  if (Date.now() < blockedUntil) throw Object.assign(new Error(`blocked: ${blockedReason}`), { code: 'over_budget' });
  if (used >= DAILY_CAP) throw Object.assign(new Error('daily cap'), { code: 'over_budget' });
  used += 1;

  let res;
  try {
    res = await fetch(API_URL, {
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
         by the account owner. Nothing here can do that. Short, because the
         moment they do, the voice should come back without a restart. */
      block(5 * 60 * 1000, 'terms_not_accepted');
    }
    throw Object.assign(new Error(`voice ${res.status}: ${detail}`), { code: 'unavailable' });
  }

  const audio = Buffer.from(await res.arrayBuffer());
  if (audio.length < 100) throw Object.assign(new Error('voice: empty audio'), { code: 'unavailable' });
  cachePut(k, audio);
  await dbCachePut(k, voice, audio);
  return { audio, cached: false };
}

/**
 * Can every clip of this answer be spoken in the natural voice, right now?
 *
 * Asked before an answer starts, so it is read in ONE voice. Reported from a
 * phone: when the allowance ran out halfway through an answer, the voice
 * changed mid-sentence — which sounded worse than either voice alone. So an
 * answer is only started in the natural voice if it can be finished in it:
 * every clip already saved, or room left in the allowance for the rest.
 */
export async function canSpeakAll(texts, requestedVoice) {
  if (!voiceConfigured()) return false;
  const voice = VOICES.includes(requestedVoice) ? requestedVoice : defaultVoice();
  const list = (Array.isArray(texts) ? texts : []).slice(0, 20).map(clean).filter(Boolean);
  if (list.length === 0 || list.some((t) => t.length > MAX_CHARS)) return false;
  let missing = 0;
  for (const text of list) {
    const k = `${voice}\u0000${text}`;
    if (cache.has(k)) continue;
    try {
      if (await get('SELECT 1 AS ok FROM tts_clips WHERE key = ?', [dbKey(k)])) continue;
    } catch { /* treat as missing */ }
    missing += 1;
  }
  if (missing === 0) return true;
  rollDay();
  if (Date.now() < blockedUntil) return false;
  return used + missing <= DAILY_CAP;
}

/* ---- Recording the written answers overnight ---------------------------

   The free allowance resets on a rolling day and is mostly unused at night.
   So between 23:00 and 05:00 (South African time) the server works through
   every written answer (voice-warm.json, generated from the app's own speech
   code) and saves each clip it does not have yet, a couple at a time, until
   the provider says stop. Within a couple of weeks every written answer is
   saved, and from then on those are always read in the natural voice, at no
   cost. Most-asked answers come first in the list. */

let warmList = null;
async function loadWarmList() {
  if (warmList) return warmList;
  try {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(new URL('./voice-warm.json', import.meta.url), 'utf8');
    warmList = (JSON.parse(raw).clips ?? []).filter((c) => typeof c === 'string' && c.length <= MAX_CHARS);
  } catch {
    warmList = [];
  }
  return warmList;
}

/** How many of the written answers' clips are saved. For /api/health. */
export async function warmProgress() {
  const list = await loadWarmList();
  let saved = 0;
  for (const text of list) {
    try {
      if (await get('SELECT 1 AS ok FROM tts_clips WHERE key = ?', [dbKey(`${defaultVoice()}\u0000${clean(text)}`)])) saved += 1;
    } catch { /* not counted */ }
  }
  return { saved, total: list.length };
}

/** Is it night in South Africa (UTC+2)? */
function quietHours(now = new Date()) {
  const h = (now.getUTCHours() + 2) % 24;
  return h >= 23 || h < 5;
}

export async function warmOnce({ perRun = 2, force = false } = {}) {
  if (!voiceConfigured() || (!force && !quietHours())) return 0;
  rollDay();
  if (Date.now() < blockedUntil) return 0;
  const voice = defaultVoice();
  let done = 0;
  for (const text of await loadWarmList()) {
    if (done >= perRun) break;
    const k = `${voice}\u0000${clean(text)}`;
    if (cache.has(k)) continue;
    try {
      if (await get('SELECT 1 AS ok FROM tts_clips WHERE key = ?', [dbKey(k)])) continue;
    } catch { return done; }
    try {
      await synthesize(text, voice);
      done += 1;
    } catch {
      return done; // over the allowance, or the provider is down: try next time
    }
  }
  return done;
}

/** Run the overnight recorder every `everyMinutes`. Returns a stop function. */
export function startVoiceWarmer({ everyMinutes = 10 } = {}) {
  if (process.env.VUKA_VOICE_WARM === '0') return () => {};
  const timer = setInterval(() => { void warmOnce().catch(() => {}); }, everyMinutes * 60_000);
  timer.unref?.();
  return () => clearInterval(timer);
}
