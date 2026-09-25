/* ============================================================
   Talking to the phone, and being talked back to.

   Msizi listens and speaks using the two speech APIs already built into the
   browser — SpeechRecognition and speechSynthesis. Both are free, both work on
   a cheap Android handset, and neither costs the user a cent beyond the data
   the recogniser itself uses. That last point decided the design: a cloud
   speech service would be better at isiZulu, and would also be a monthly bill
   and a third party receiving recordings of people describing their work
   history. Neither belongs in this product.

   The honest part, and the reason this file is careful rather than short:

   **These APIs do not cover the languages this app ships in.** Recognition and
   voices exist for English and Afrikaans. For isiZulu, isiXhosa and Sesotho
   they do not — not reliably, and not on the phones our users actually own.
   There is no flag to turn on and no polyfill to install; the models are not
   there.

   So this file never pretends. It reports exactly what the device can do, the
   UI says so in the user's own language, and typing keeps working perfectly in
   all five. That is the same choice the Language screen already makes about
   translation coverage and the legal pages make about staying in English: tell
   the user the truth and let them decide, rather than shipping something that
   silently does nothing.
   ============================================================ */
import type { Lang } from '../i18n';
import { langMeta } from '../i18n';

/* ---------------- Vendor-prefixed types ---------------------------------
   The Web Speech API is still not exposed under its unprefixed name on the
   platforms that matter here, so the constructor has to be looked up under
   both names. TypeScript's DOM library does not describe it at all, hence the
   local declarations rather than a dependency. */

interface SpeechRecognitionAlternative { transcript: string; confidence: number }
interface SpeechRecognitionResult { isFinal: boolean; length: number; [i: number]: SpeechRecognitionAlternative }
interface SpeechRecognitionResultList { length: number; [i: number]: SpeechRecognitionResult }
interface SpeechRecognitionEventLike { resultIndex: number; results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEventLike { error: string }

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onaudioend: (() => void) | null;
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Can this device turn speech into text at all? */
export function canListen(): boolean {
  return recognitionCtor() !== null;
}

/** Can this device read an answer out loud at all? */
export function canSpeak(): boolean {
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

/* ------------------------------------------------------------------
   Choosing a voice.
   ------------------------------------------------------------------ */

/**
 * Languages to fall back through when the chosen one has no voice.
 *
 * en-ZA first because a South African English voice reads rand amounts, place
 * names and the app's own vocabulary far better than en-US does. The chain
 * ends at plain English rather than at nothing, because an answer read in the
 * wrong accent is still an answer, and silence is not.
 */
const VOICE_FALLBACKS = ['en-ZA', 'en-GB', 'en-US', 'en'];

/** How well this device can speak a given app language. */
export type SpeechCoverage =
  | 'native'    // a voice in the user's own language
  | 'fallback'  // no such voice; an English one will read it
  | 'none';     // this device cannot speak at all

export interface VoicePick {
  voice: SpeechSynthesisVoice | null;
  coverage: SpeechCoverage;
}

/**
 * Names that mark a voice as one of the good ones, worst-to-best order.
 *
 * Android ships several engines side by side and the list is not sorted by
 * quality, so taking the first match for a language is a coin toss between a
 * modern neural voice and the flat, clipped one people describe as "the robot".
 * The first Msizi shipped with did exactly that, and it sounded like it.
 *
 * Matching on names is crude and it is what the API gives us: there is no
 * quality field on SpeechSynthesisVoice. Unknown voices score zero rather than
 * negative, so a device whose voices are named nothing like these still gets
 * its default rather than nothing.
 */
const QUALITY_HINTS = [
  { match: /neural|natural|premium|enhanced|wavenet|studio/i, score: 5 },
  { match: /\bgoogle\b/i, score: 3 },
  { match: /siri/i, score: 3 },
];

/**
 * Msizi is a woman's voice. Asked for by the product owner, and it matches the
 * character — a patient helper, "umsizi".
 *
 * The API has no gender field either, so this is by name. The list covers the
 * voices that actually ship on the phones and browsers this app meets:
 *   · iOS / macOS: Tessa is South African English, then the Siri-era family
 *     (Samantha, Karen, Moira, Fiona, Serena, Kate, Ava, Zoe, Allison...).
 *   · Edge / Windows: the "Online (Natural)" neural voices — Leah is en-ZA,
 *     Adri is Afrikaans, Thando is isiZulu — plus Zira, Hazel, Susan, Aria...
 *   · Chrome desktop: "Google UK English Female", "Google US English".
 *   · Android: Google's voice codes, where sfg/tpc/iob/iog/gba/aua/ahp are
 *     female.
 * A name that is not recognised either way scores nothing, so a phone with
 * only unfamiliar voices still speaks.
 */
const FEMALE_NAMES = /\b(female|woman|tessa|leah|adri|thando|samantha|karen|moira|fiona|serena|kate|ava|zoe|zoey|allison|susan|victoria|veena|nicky|stephanie|martha|catherine|shelley|sandy|flo|kathy|siri female|zira|hazel|heera|aria|jenny|michelle|emma|sonia|libby|natasha|clara|salli|joanna|kendra|kimberly|ivy|amy|olivia|emily|sara|elsa|ellen|lisa)\b|x-(sfg|tpc|iob|iog|gba|aua|ahp|fis|fnf)/i;
const MALE_NAMES = /\b(male|man|luke|willem|themba|david|mark|daniel|alex|fred|tom|aaron|arthur|gordon|rishi|oliver|guy|ryan|brian|christopher|eric|roger|steffan|andrew|george|james|william|thomas|ravi|matthew|joey|justin|kevin|russell|lee|reed|rocko|grandpa|eddy)\b|x-(iom|tpd|rjs|gbd|gbb|aud|ahd|fnm)/i;

/** Novelty voices macOS and iOS ship alongside the real ones. Never Msizi. */
const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|grandma|junior|ralph)\b/i;

/** Names that mark a voice as one to avoid unless it is all there is. */
const POOR_HINTS = /compact|espeak|pico|fallback|low.?quality/i;

/** How good a voice is for reading an answer out loud. Higher is better. */
export function voiceScore(voice: SpeechSynthesisVoice): number {
  let score = 0;
  for (const hint of QUALITY_HINTS) if (hint.match.test(voice.name)) score += hint.score;
  if (POOR_HINTS.test(voice.name)) score -= 6;
  if (NOVELTY.test(voice.name)) score -= 20;
  /* Weighted so that a female voice beats a male one of the same quality, but
     a neural male voice still beats a robotic female one. */
  if (FEMALE_NAMES.test(voice.name)) score += 4;
  else if (MALE_NAMES.test(voice.name)) score -= 4;
  /* A voice the OS has marked default is the one the owner of the phone
     already chose to hear everywhere else. Worth a nudge, not a veto. */
  if (voice.default) score += 1;
  /* A local voice wins ties. Remote voices usually sound better, and a remote
     voice means the sentence is sent to a vendor's servers to be spoken — so
     answers carrying a person's own record ("you have earned...") are spoken
     with localOnly, and never leave the phone. See pickVoice. */
  if (voice.localService) score += 2;
  return score;
}

/** True if a voice is sent off the phone to be spoken. */
function isRemote(voice: SpeechSynthesisVoice): boolean {
  return voice.localService === false;
}

/** Every voice this device offers for a language tag, best first. */
function rankedFor(voices: SpeechSynthesisVoice[], tag: string): SpeechSynthesisVoice[] {
  const want = tag.toLowerCase();
  const base = want.split('-')[0];
  return voices
    .filter((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      return lang === want || lang.split('-')[0] === base;
    })
    /* Region is worth a bonus, not a veto. It used to sort first, so an
       iPhone's compact South African voice (Tessa) always beat a downloaded
       Premium or Enhanced voice from another region — which is the difference
       between "robot" and "person". Now en-ZA wins a tie, and a clearly
       better voice wins outright. */
    .sort((a, b) => {
      const exact = (v: SpeechSynthesisVoice) => (v.lang.toLowerCase().replace('_', '-') === want ? 3 : 0);
      return (voiceScore(b) + exact(b)) - (voiceScore(a) + exact(a));
    });
}

/**
 * The best available voice for an app language.
 *
 * Matching is on the language subtag as well as the full tag: a device with
 * "Afrikaans (South Africa)" reports af-ZA, but some report a bare af, and
 * refusing the second because it is not spelled like the first would silence a
 * voice that was sitting right there.
 */
export function pickVoice(lang: Lang, opts: { localOnly?: boolean } = {}): VoicePick {
  if (!canSpeak()) return { voice: null, coverage: 'none' };
  let voices: SpeechSynthesisVoice[] = [];
  try { voices = window.speechSynthesis.getVoices(); } catch { voices = []; }
  /* A person's own figures ("you have earned...") are never handed to a remote
     voice. Everything else may use one, because on Edge the remote neural
     voices are the only ones that speak isiZulu, and they are the nicest. On
     a phone with only remote voices a personal answer is shown and not read —
     the words are on screen either way. */
  if (opts.localOnly) voices = voices.filter((v) => !isRemote(v));
  /* A browser that exposes speechSynthesis but has no voices installed cannot
     speak at all, which is a different thing from having the wrong voice.
     Reporting it as a fallback produced the sentence "Your phone has no English
     voice, so answers are read aloud in English" — on an English device, about
     a device that could not read anything aloud in any language. */
  if (voices.length === 0) return { voice: null, coverage: 'none' };

  const own = rankedFor(voices, langMeta(lang).tag);
  if (own.length > 0) return { voice: own[0], coverage: 'native' };

  for (const tag of VOICE_FALLBACKS) {
    const hit = rankedFor(voices, tag);
    if (hit.length > 0) return { voice: hit[0], coverage: lang === 'en' ? 'native' : 'fallback' };
  }

  const best = [...voices].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
  return { voice: best, coverage: lang === 'en' ? 'native' : 'fallback' };
}

/**
 * Wait until the browser has a voice list.
 *
 * Voices arrive asynchronously nearly everywhere: getVoices() is empty on the
 * first call and fills in later, which is why the naive version speaks in the
 * wrong accent exactly once per cold start. Resolves as soon as there is a
 * list, or after a short wait if the browser never fires the event.
 */
export function voicesReady(): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak()) { resolve(); return; }
    try {
      if (window.speechSynthesis.getVoices().length > 0) { resolve(); return; }
    } catch { resolve(); return; }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      try { window.speechSynthesis.removeEventListener('voiceschanged', done); } catch { /* already gone */ }
      resolve();
    };
    /* addEventListener rather than the onvoiceschanged property, so this does
       not quietly unsubscribe whatever else is listening — onVoicesChanged
       below stays subscribed for the life of the screen. */
    try { window.speechSynthesis.addEventListener('voiceschanged', done); } catch { done(); return; }
    /* Safari has shipped builds that never fire the event even though the list
       does populate. Waiting on it forever would mean the speak button never
       works at all on those. */
    window.setTimeout(done, 1200);
  });
}

/**
 * Call `fn` whenever the voice list changes, until the returned function is
 * called.
 *
 * Necessary because `voicesReady` gives up after a short wait, and a browser
 * that publishes its voices *after* that — which Chromium does on a cold
 * start — would otherwise leave the screen reporting "this phone cannot read
 * answers out loud" on a phone that had just become able to.
 */
export function onVoicesChanged(fn: () => void): () => void {
  if (!canSpeak()) return () => { /* nothing to unsubscribe */ };
  try {
    window.speechSynthesis.addEventListener('voiceschanged', fn);
    return () => {
      try { window.speechSynthesis.removeEventListener('voiceschanged', fn); } catch { /* gone */ }
    };
  } catch {
    return () => { /* the browser has no event to listen to */ };
  }
}

/* ------------------------------------------------------------------
   Turning an answer into something worth listening to.
   ------------------------------------------------------------------ */

/* Emoji and pictographs. The answers carry tier medals, category icons and the
   odd tick; a synthesiser either names them out loud ("bronze medal") or stops
   dead on them. Neither is what the sentence meant. */
const PICTOGRAPHS =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}]/gu;

/**
 * Rewrite an answer for the ear rather than the eye.
 *
 * Written text and spoken text are not the same text, and the gap is most of
 * why the first version sounded wrong. "R30,23" is read by a synthesiser as
 * "R thirty comma twenty three" — South African notation uses a comma where a
 * reader expects a decimal point, and the R is a letter as far as the engine is
 * concerned. A bullet is read as "bullet", or swallowed along with the pause it
 * was standing in for.
 *
 * Exported so the tests can assert it. Every rule here is one an actual answer
 * in data/msizi.ts runs into.
 */
export function toSpeech(text: string): string {
  return text
    /* Money first, before punctuation is touched: R30,23 -> 30 rand 23,
       R1 469 -> 1469 rand. The space is the SA thousands separator and has to
       come out or it is read as two numbers.

       The thousands groups are matched explicitly as `\d{3}` rather than with
       a loose "digits and spaces" run. The loose version was lazy and stopped
       at the first digit — "R1 469" came out as "1 rand 469" — and making it
       greedy instead swallowed the space *after* the amount, gluing the number
       to the next word. Groups of three match what the notation actually is. */
    .replace(/R\s?(\d+(?:[  ]\d{3})*)(?:,(\d{1,2}))?/g,
      (_m, whole: string, cents?: string) => {
        const amount = whole.replace(/[\s ]/g, '');
        return cents ? `${amount} rand ${cents}` : `${amount} rand`;
      })
    /* A percentage sign reads as "percent" on most engines but not all. */
    .replace(/(\d)\s?%/g, '$1 percent')
    .replace(PICTOGRAPHS, ' ')
    /* Bullets become sentences of their own, so the voice pauses where the eye
       would. The full stop is what buys the pause. */
    .replace(/^[•·-]\s+/gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/[.!?:]$/.test(line) ? line : `${line}.`))
    .join(' ')
    /* Ellipses and dashes read as pauses far better than as themselves. */
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Break an answer into utterance-sized pieces, on sentence boundaries.
 *
 * Two reasons, and the first is the one that fixes the robot.
 *
 * A synthesiser given one long block reads it with one flat contour, because
 * it plans prosody over whatever it is handed. Fed a sentence at a time it
 * places a real cadence on each — which is most of the difference between
 * "spoken" and "recited".
 *
 * And it retires a hack. Chrome stops speaking after roughly fifteen seconds
 * unless the queue is nudged, and the usual workaround is to pause() and
 * resume() on a timer. That works and it is audible: a small catch in the voice
 * every ten seconds. Sentences are short enough that the bug never triggers, so
 * the nudging can go.
 */
/**
 * How an English voice should say the South African words in Msizi's answers.
 *
 * Reported from a phone: "it can't pronounce Vuka". An English engine reads it
 * as "VYOO-ka" or "VUH-ka"; the word is isiZulu for "wake up" and is said
 * VOO-kah. Engines accept no phonetic markup in the browser, and Orpheus none
 * either, so the fix is spelling it the way it sounds. Applied ONLY for English
 * voices — an isiZulu voice already says these correctly, and would be thrown
 * by the respelling.
 */
const SAY_AS: [RegExp, string][] = [
  [/\bVuka Uzenzele\b/gi, 'Vooka Oozen-zeh-leh'],
  [/\bUzenzele\b/gi, 'Oozen-zeh-leh'],
  [/\bVuka\b/gi, 'Vooka'],
  /* Chosen by ear from live samples, 2026-09-25: "short and straight". The
     long respellings (Msee-zee, Sah-woo-boh-nah) made the voice drag every
     syllable, so the greetings — Sawubona, Molo, Dumela, Ngiyabonga — are
     left as written, and only the words it actually got wrong are respelled. */
  [/\bumsizi\b/gi, 'umse-ze'],
  [/\bMsizi\b/gi, 'Mse-ze'],
  [/\bisiZulu\b/gi, 'isi-Zoo-loo'],
  [/\bisiXhosa\b/gi, 'isi-Kaw-sah'],
  [/\bSesotho\b/gi, 'Seh-soo-too'],
  [/\bSoweto\b/g, 'So-weh-toh'],
];

/** Respell South African words for an English voice. Exported for the tests. */
export function sayAs(text: string): string {
  let out = text;
  for (const [re, said] of SAY_AS) out = out.replace(re, said);
  return out;
}

export function toSentences(text: string): string[] {
  return toSpeech(text)
    .split(/(?<=[.!?:])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    /* Anything still enormous — a list read as one line — is split again on
       clause boundaries so no single utterance approaches the cutoff. */
    .flatMap((s) => (s.length <= 220 ? [s] : s.split(/(?<=,)\s+/).map((c) => c.trim()).filter(Boolean)));
}

/* ------------------------------------------------------------------
   Speaking.
   ------------------------------------------------------------------ */

export interface SpeakHandle {
  /** Resolves when speech finishes, is cancelled, or fails. Never rejects. */
  done: Promise<void>;
}

/** Bumped by every stopSpeaking(), so a stale queue cannot report completion. */
let speakGeneration = 0;

/**
 * Unlock speech on iOS. MUST be called synchronously inside a tap.
 *
 * iOS Safari refuses speechSynthesis.speak() unless it is called in the same
 * call stack as a user gesture — and an answer read after listening, or after
 * waiting on the network, is never in that stack. That is why voice questions
 * were answered in silence on an iPhone. Speaking one silent utterance inside
 * the tap unlocks the synthesiser for the rest of the page's life.
 */
let primed = false;
export function primeSpeech(): void {
  /* The natural voice plays through an <audio> element, which iOS gates the
     same way. It is unlocked on every tap, not just the first: a clip started
     inside a gesture keeps the element allowed for what follows. */
  unlockAudio();
  if (primed || !canSpeak()) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
    primed = true;
  } catch { /* nothing to unlock */ }
}

/* ------------------------------------------------------------------
   The natural voice.

   A neural voice from the server (vuka-server/src/voice.mjs) for English
   answers, because the phone's own English voices are what got "sounds like a
   robot". The phone's voice is always the fallback — for other languages, for
   the person's own record, offline, and when the free allowance is spent.
   ------------------------------------------------------------------ */

type NeuralSource = (text: string) => Promise<Blob>;
let neuralSource: NeuralSource | null = null;
/** Set after a refusal, so a spent allowance is not asked again per sentence. */
let neuralOffUntil = 0;
const NEURAL_BACKOFF_MS = 10 * 60 * 1000;
/** The server's per-clip limit is 200; a margin for whitespace differences. */
export const CLIP_CHARS = 190;

/** Wire up the natural voice. The screen passes the API call in, which keeps
    this module free of network code (and testable without it). */
export function setNeuralVoice(fn: NeuralSource | null): void {
  neuralSource = fn;
}

function neuralAvailable(): boolean {
  return neuralSource !== null && Date.now() >= neuralOffUntil && typeof Audio !== 'undefined';
}

/**
 * Pack sentences into as few clips as possible, each at most `max` characters.
 *
 * The free allowance is counted in requests, so ten short sentences sent one
 * by one would cost ten times what the same answer costs packed into two. A
 * sentence longer than a clip is split at commas, then at spaces.
 */
export function packClips(sentences: string[], max = CLIP_CHARS): string[] {
  const pieces: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) { pieces.push(s); continue; }
    let rest = s;
    while (rest.length > max) {
      const window = rest.slice(0, max);
      const cut = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '));
      const at = cut > max / 3 ? cut + 1 : Math.max(window.lastIndexOf(' '), 1);
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
  }
  const clips: string[] = [];
  for (const p of pieces) {
    const last = clips[clips.length - 1];
    if (last !== undefined && last.length + 1 + p.length <= max) clips[clips.length - 1] = `${last} ${p}`;
    else clips.push(p);
  }
  return clips;
}

let player: HTMLAudioElement | null = null;
let silentUrl: string | null = null;

function getPlayer(): HTMLAudioElement | null {
  if (player) return player;
  if (typeof Audio === 'undefined') return null;
  player = new Audio();
  player.preload = 'auto';
  return player;
}

/** A tenth of a second of silence, as a WAV blob (CSP allows blob:, not data:). */
function silence(): string | null {
  if (silentUrl) return silentUrl;
  if (typeof URL === 'undefined' || typeof Blob === 'undefined') return null;
  const rate = 8000;
  const samples = rate / 10;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return silentUrl;
}

function unlockAudio(): void {
  if (!neuralSource) return;
  const p = getPlayer();
  const src = silence();
  if (!p || !src) return;
  try {
    /* Only if idle. Unlocking over a clip that is playing would cut it off. */
    if (!p.paused && !p.ended) return;
    p.src = src;
    void p.play().catch(() => { /* locked; the phone's voice will be used */ });
  } catch { /* nothing to unlock */ }
}

type PlayResult = 'ended' | 'failed' | 'stopped';

function playBlob(blob: Blob, generation: number): Promise<PlayResult> {
  const p = getPlayer();
  if (!p) return Promise.resolve('failed');
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    let settled = false;
    const done = (r: PlayResult) => {
      if (settled) return;
      settled = true;
      window.clearInterval(watch);
      p.onended = null;
      p.onerror = null;
      URL.revokeObjectURL(url);
      resolve(r);
    };
    /* stopSpeaking() bumps the generation; this is how a clip hears about it. */
    const watch = window.setInterval(() => {
      if (generation !== speakGeneration) { try { p.pause(); } catch { /* gone */ } done('stopped'); }
    }, 120);
    p.onended = () => done('ended');
    p.onerror = () => done('failed');
    p.src = url;
    p.play().catch(() => done('failed'));
  });
}

/**
 * Play clips through the natural voice, fetching each next clip while the
 * current one plays. On any failure the rest is handed to `fallback` so the
 * answer is always finished, in one voice or the other.
 */
async function speakNeural(
  clips: string[], generation: number, fallback: (rest: string[]) => void, finish: () => void,
): Promise<void> {
  const source = neuralSource;
  if (!source) { fallback(clips); return; }
  const fetchClip = (i: number) => {
    const pending = source(clips[i]);
    pending.catch(() => { /* handled where awaited */ });
    return pending;
  };
  let next = fetchClip(0);
  for (let i = 0; i < clips.length; i++) {
    let blob: Blob;
    try {
      blob = await next;
    } catch {
      neuralOffUntil = Date.now() + NEURAL_BACKOFF_MS;
      if (generation === speakGeneration) fallback(clips.slice(i));
      return;
    }
    if (generation !== speakGeneration) return;
    if (i + 1 < clips.length) next = fetchClip(i + 1);
    const result = await playBlob(blob, generation);
    if (result === 'stopped') return;
    if (result === 'failed') {
      /* Playback refused — on iOS, an element that was never unlocked. The
         phone's voice was unlocked by the same tap, so it can finish. */
      if (generation === speakGeneration) fallback(clips.slice(i));
      return;
    }
  }
  finish();
}

/**
 * Tell iOS 17+ what the page is doing with audio. After the microphone has
 * been open, WebKit can leave the session in play-and-record, which routes
 * speech to the earpiece at a whisper. Setting "playback" before speaking puts
 * it back on the loudspeaker. Harmless where unsupported.
 */
export function audioMode(mode: 'playback' | 'play-and-record' | 'auto'): void {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = mode;
  } catch { /* not supported */ }
}

/**
 * Read text aloud. `lang` is the language the TEXT is in — the written
 * answers are English whatever the app language is.
 *
 * English goes to the natural voice when it is available, unless `localOnly`
 * (the person's own record, which stays on the phone). Everything else, and
 * anything the natural voice cannot finish, is read by the phone's voice.
 */
export function speak(text: string, lang: Lang, onEnd?: () => void, opts: { localOnly?: boolean } = {}): SpeakHandle {
  const noop: SpeakHandle = { done: Promise.resolve() };
  const neural = lang === 'en' && !opts.localOnly && neuralAvailable();
  if ((!canSpeak() && !neural) || !text.trim()) { onEnd?.(); return noop; }

  stopSpeaking();
  const generation = speakGeneration;

  audioMode('playback');
  const { voice } = canSpeak() ? pickVoice(lang, opts) : { voice: null };
  /* Respell South African words only for an English voice. */
  const english = neural || (voice ? voice.lang.toLowerCase().startsWith('en') : lang === 'en');
  const sentences = toSentences(text).map((s) => (english ? sayAs(s) : s));
  if (sentences.length === 0) { onEnd?.(); return noop; }

  const done = new Promise<void>((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished || generation !== speakGeneration) return;
      finished = true;
      onEnd?.();
      resolve();
    };

    if (neural) {
      void speakNeural(packClips(sentences), generation,
        (rest) => speakDevice(rest, voice, lang, finish), finish);
      return;
    }
    speakDevice(sentences, voice, lang, finish);
  });

  return { done };
}

/** The phone's own voice, one utterance per sentence. */
function speakDevice(
  sentences: string[], voice: SpeechSynthesisVoice | null, lang: Lang, finish: () => void,
): void {
  if (!canSpeak() || sentences.length === 0) { finish(); return; }
  try {
      sentences.forEach((sentence, i) => {
        const u = new SpeechSynthesisUtterance(sentence);
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        else u.lang = langMeta(lang).tag;
        /* Just under the default. The audience includes people meeting the
           app's vocabulary for the first time, in a second or third language —
           and a shade slower reads as considered rather than sluggish. */
        u.rate = 0.96;
        /* A touch above neutral. Many engines' default for a female voice sits
           low and flat; this lifts it toward a warmer, conversational pitch
           without tipping into cartoon. */
        u.pitch = 1.05;
        u.volume = 1;
        if (i === sentences.length - 1) {
          u.onend = finish;
          u.onerror = finish;
        } else {
          /* A failure partway through must not leave the caller waiting for an
             onend that is never coming. */
          u.onerror = finish;
        }
        window.speechSynthesis.speak(u);
      });
  } catch {
    finish();
  }
}

/** Silence immediately. Safe to call when nothing is speaking. */
export function stopSpeaking(): void {
  speakGeneration += 1;
  /* The natural voice's clip stops at once, not at the next watch tick. */
  if (player && !player.paused) { try { player.pause(); } catch { /* gone */ } }
  if (!canSpeak()) return;
  try { window.speechSynthesis.cancel(); } catch { /* nothing queued */ }
}

/* ------------------------------------------------------------------
   Listening.
   ------------------------------------------------------------------ */

/** Why listening stopped, in terms the UI can turn into a sentence. */
export type ListenError =
  | 'denied'      // the user said no to the microphone, or the OS did
  | 'no-speech'   // nothing was said
  | 'no-language' // this device cannot recognise the chosen language
  | 'network'     // the recogniser needs a connection and had none
  | 'failed';     // anything else

export interface ListenEvents {
  /** Words so far, updated as they are recognised. Not final. */
  onPartial?: (text: string) => void;
  /** The finished transcript. Fires at most once per session. */
  onFinal?: (text: string) => void;
  onError?: (err: ListenError) => void;
  /** Always fires last, exactly once, whatever the outcome. */
  onEnd?: () => void;
}

/* ---- The clocks, and why every one of them is necessary ----------------

   Chrome on Android IGNORES `continuous`. The platform recogniser underneath
   it is one-shot and is supposed to stop at the first endpoint it detects —
   but when it does not detect one, or when the engine does not support the
   mode being asked for, `onend` is never fired at all and the microphone is
   simply left open. That is not a theoretical edge: it is what a real handset
   did, and the recording indicator stayed on until the tab was closed.

   So nothing here trusts the engine to stop. Every path is on our own timer,
   the same discipline VoiceSession in voice.ts already applies to recording a
   voice note, where the comment reads "the cap on the server is what actually
   protects anything".
   ------------------------------------------------------------------------ */

/** Absolute ceiling. Nothing keeps the microphone past this, ever. */
const MAX_LISTEN_MS = 15_000;
/** Stop this long after the last words were heard — the natural end of a question. */
const SILENCE_AFTER_SPEECH_MS = 2_200;
/** Give up if nothing at all has been said by now. */
const SILENCE_BEFORE_SPEECH_MS = 7_000;
/** If stop() does not produce an onend within this, force it. */
const END_WATCHDOG_MS = 1_500;

/** Exported for the tests, which assert these stay sane relative to each other. */
export const LISTEN_TIMINGS = {
  MAX_LISTEN_MS,
  SILENCE_AFTER_SPEECH_MS,
  SILENCE_BEFORE_SPEECH_MS,
  END_WATCHDOG_MS,
};

/**
 * One listening session.
 *
 * A class for the same reason VoiceSession in voice.ts is one: it holds a live
 * microphone, and that has to be released down every path — answered,
 * cancelled, navigated away from, timed out, or interrupted by a phone call.
 *
 * The contract it guarantees to the UI, which the previous version did not:
 * **onEnd always fires, exactly once.** The screen drives its listening state
 * from that, so an engine that goes quiet must not be able to leave a pulsing
 * microphone on screen with nothing behind it.
 */
export class Listener {
  private rec: SpeechRecognitionLike | null = null;
  private settled = false;
  private delivered = false;
  private best = '';
  /* The words currently on screen but not yet confirmed by the engine. Kept
     because tapping stop mid-sentence should send what the user can see, not
     discard it and report that nothing was heard. */
  private lastInterim = '';
  private heardSomething = false;
  private timers: number[] = [];
  private silence: number | null = null;

  constructor(private lang: Lang, private events: ListenEvents = {}) {}

  /** True if this device can construct a recogniser at all. */
  static get available(): boolean { return canListen(); }

  private clearSilence(): void {
    if (this.silence !== null) { window.clearTimeout(this.silence); this.silence = null; }
  }

  private clearTimers(): void {
    this.clearSilence();
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }

  /** Restart the quiet-for-long-enough clock. Called on every scrap of speech. */
  private armSilence(): void {
    this.clearSilence();
    const wait = this.heardSomething ? SILENCE_AFTER_SPEECH_MS : SILENCE_BEFORE_SPEECH_MS;
    this.silence = window.setTimeout(() => this.finish(), wait);
  }

  /**
   * The single exit. Everything — a final result, a timeout, an error, the
   * user tapping stop — comes through here, so onEnd fires once and the
   * microphone is released once.
   */
  private settle(err?: ListenError): void {
    if (this.settled) return;
    this.settled = true;
    this.clearTimers();

    const rec = this.rec;
    this.rec = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onspeechstart = null;
      rec.onaudioend = null;
      /* abort(), not stop(): stop() asks for a last result and can hang waiting
         for one, which is the whole problem this class exists to contain. */
      try { rec.abort(); } catch { /* already gone */ }
    }

    /* Confirmed words if there are any, otherwise whatever was on screen. */
    const heard = (this.best || this.lastInterim).trim();
    if (err) this.events.onError?.(err);
    else if (!this.delivered && heard) {
      this.delivered = true;
      this.events.onFinal?.(heard);
    } else if (!this.delivered) {
      this.events.onError?.('no-speech');
    }
    this.events.onEnd?.();
  }

  /**
   * Wind up politely: ask the engine to stop so any last words still arrive,
   * but do not wait on it indefinitely.
   *
   * Android commonly delivers a final result in the gap between stop() and
   * onend, so that gap is worth leaving open — and it is also exactly where the
   * engine sometimes never comes back, which is what the watchdog is for.
   */
  private finish(): void {
    if (this.settled) return;
    this.clearTimers();
    const rec = this.rec;
    if (!rec) { this.settle(); return; }
    try { rec.stop(); } catch { this.settle(); return; }
    this.timers.push(window.setTimeout(() => this.settle(), END_WATCHDOG_MS));
  }

  start(): boolean {
    const Ctor = recognitionCtor();
    if (!Ctor) { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }

    let rec: SpeechRecognitionLike;
    try { rec = new Ctor(); } catch { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }

    rec.lang = langMeta(this.lang).tag;
    /* One question at a time. Asking for continuous would keep the microphone
       open between sentences — and on Android it is ignored anyway, which is
       how a session ends up running with nobody managing it. */
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      if (this.settled) return;
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0]?.transcript ?? '';
        if (r.isFinal) final += text; else interim += text;
      }
      if (final.trim() || interim.trim()) {
        this.heardSomething = true;
        this.armSilence();
      }
      if (final) {
        this.best = `${this.best} ${final}`.trim();
        this.events.onPartial?.(this.best);
        /* A final result is the answer to the question asked. Waiting for the
           engine to decide the same thing is how the microphone stays on. */
        this.delivered = true;
        this.events.onFinal?.(this.best);
        this.settle();
        return;
      }
      if (interim) {
        this.lastInterim = `${this.best} ${interim}`.trim();
        this.events.onPartial?.(this.lastInterim);
      }
    };

    rec.onspeechstart = () => {
      this.heardSomething = true;
      this.armSilence();
    };

    rec.onerror = (e) => {
      if (this.settled) return;
      const err = classify(e.error);
      /* A no-speech report after something was already heard is not a failure:
         the recogniser is describing the silence that followed the answer. */
      if (err === 'no-speech' && (this.best || this.lastInterim)) { this.finish(); return; }
      this.settle(err);
    };

    rec.onend = () => {
      /* The engine got there on its own. Good — settle through the same door
         everything else uses. */
      this.settle();
    };

    try { rec.start(); } catch { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }
    this.rec = rec;

    /* The two clocks that make the guarantee. The cap is absolute; the silence
       timer is the one that makes it feel like it is listening for an answer
       rather than running a stopwatch. */
    this.timers.push(window.setTimeout(() => this.finish(), MAX_LISTEN_MS));
    this.armSilence();
    return true;
  }

  /** Stop listening and deliver whatever was heard. */
  stop(): void {
    this.finish();
  }

  /** Stop listening and throw away whatever was heard. */
  cancel(): void {
    if (this.settled) return;
    this.best = '';
    this.lastInterim = '';
    this.delivered = true; // nothing to deliver; suppresses the no-speech error
    this.settle();
  }
}

function classify(code: string): ListenError {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed': return 'denied';
    case 'no-speech': return 'no-speech';
    case 'language-not-supported': return 'no-language';
    case 'network': return 'network';
    default: return 'failed';
  }
}
