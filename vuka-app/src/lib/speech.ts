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

/* ---------------- Which language the device can actually manage ---------- */

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
 * The best available voice for an app language.
 *
 * Matching is on the language subtag as well as the full tag: a device with
 * "Afrikaans (South Africa)" reports af-ZA, but some report a bare af, and
 * refusing the second because it is not spelled like the first would silence a
 * voice that was sitting right there.
 */
export function pickVoice(lang: Lang): VoicePick {
  if (!canSpeak()) return { voice: null, coverage: 'none' };
  let voices: SpeechSynthesisVoice[] = [];
  try { voices = window.speechSynthesis.getVoices(); } catch { voices = []; }
  /* A browser that exposes speechSynthesis but has no voices installed cannot
     speak at all, which is a different thing from having the wrong voice.
     Reporting it as a fallback produced the sentence "Your phone has no English
     voice, so answers are read aloud in English" — on an English device, about
     a device that could not read anything aloud in any language. */
  if (voices.length === 0) return { voice: null, coverage: 'none' };

  const want = langMeta(lang).tag.toLowerCase();
  const base = want.split('-')[0];

  const exact = voices.find((v) => v.lang.toLowerCase() === want);
  if (exact) return { voice: exact, coverage: 'native' };

  const sameLanguage = voices.find((v) => v.lang.toLowerCase().split('-')[0] === base);
  if (sameLanguage) return { voice: sameLanguage, coverage: 'native' };

  for (const tag of VOICE_FALLBACKS) {
    const hit = voices.find((v) => v.lang.toLowerCase() === tag.toLowerCase())
      ?? voices.find((v) => v.lang.toLowerCase().split('-')[0] === tag.split('-')[0]);
    if (hit) return { voice: hit, coverage: lang === 'en' ? 'native' : 'fallback' };
  }

  return { voice: voices[0] ?? null, coverage: lang === 'en' ? 'native' : 'fallback' };
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
 * answers out loud" on a phone that had just become able to. The capability
 * has to be re-read, not sampled once.
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

/* ---------------- Speaking ---------------------------------------------- */

/**
 * Chrome stops speaking after roughly fifteen seconds unless the queue is
 * nudged — a bug old enough to have outlived several major versions. An answer
 * about how payment protection works is comfortably longer than that, so the
 * utterance is kept alive by pausing and resuming on a timer until it ends.
 */
let keepAlive: number | null = null;

function stopKeepAlive() {
  if (keepAlive !== null) { window.clearInterval(keepAlive); keepAlive = null; }
}

export interface SpeakHandle {
  /** Resolves when speech finishes, is cancelled, or fails. Never rejects. */
  done: Promise<void>;
}

/**
 * Read text aloud.
 *
 * Always cancels whatever was already speaking. Two answers talking over each
 * other is worse than either of them, and on a phone held to the ear it is
 * unusable.
 */
export function speak(text: string, lang: Lang, onEnd?: () => void): SpeakHandle {
  const noop: SpeakHandle = { done: Promise.resolve() };
  if (!canSpeak() || !text.trim()) { onEnd?.(); return noop; }

  stopSpeaking();

  const { voice } = pickVoice(lang);
  const u = new SpeechSynthesisUtterance(text);
  if (voice) { u.voice = voice; u.lang = voice.lang; }
  else u.lang = langMeta(lang).tag;
  /* Slightly under the default. The audience includes people meeting the app's
     vocabulary for the first time, in a second or third language. */
  u.rate = 0.95;
  u.pitch = 1;

  const done = new Promise<void>((resolve) => {
    const finish = () => { stopKeepAlive(); onEnd?.(); resolve(); };
    u.onend = finish;
    u.onerror = finish;
  });

  try {
    window.speechSynthesis.speak(u);
    stopKeepAlive();
    keepAlive = window.setInterval(() => {
      try {
        if (!window.speechSynthesis.speaking) { stopKeepAlive(); return; }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } catch { stopKeepAlive(); }
    }, 10_000);
  } catch {
    stopKeepAlive();
    onEnd?.();
    return noop;
  }

  return { done };
}

/** Silence immediately. Safe to call when nothing is speaking. */
export function stopSpeaking(): void {
  stopKeepAlive();
  if (!canSpeak()) return;
  try { window.speechSynthesis.cancel(); } catch { /* nothing queued */ }
}

/* ---------------- Listening --------------------------------------------- */

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
  /** Always fires last, whatever the outcome — the UI's cue to stop pulsing. */
  onEnd?: () => void;
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

/**
 * One listening session.
 *
 * A class for the same reason VoiceSession in voice.ts is one: it holds a live
 * microphone, and that has to be released down every path — answered,
 * cancelled, navigated away from, or interrupted by an incoming call.
 */
export class Listener {
  private rec: SpeechRecognitionLike | null = null;
  private finished = false;
  private best = '';

  constructor(private lang: Lang, private events: ListenEvents = {}) {}

  /** True if this device can construct a recogniser at all. */
  static get available(): boolean { return canListen(); }

  start(): boolean {
    const Ctor = recognitionCtor();
    if (!Ctor) { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }

    let rec: SpeechRecognitionLike;
    try { rec = new Ctor(); } catch { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }

    rec.lang = langMeta(this.lang).tag;
    /* One question at a time. Continuous mode keeps the microphone open
       between sentences, which on a phone means a recording indicator that
       never goes away and a battery that empties while the app sits idle. */
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0]?.transcript ?? '';
        if (r.isFinal) final += text; else interim += text;
      }
      if (final) {
        this.best = `${this.best} ${final}`.trim();
        this.events.onPartial?.(this.best);
      } else if (interim) {
        this.events.onPartial?.(`${this.best} ${interim}`.trim());
      }
    };

    rec.onerror = (e) => {
      const err = classify(e.error);
      /* A no-speech report after something was already heard is not a failure:
         the recogniser is describing the silence that followed the answer. */
      if (err === 'no-speech' && this.best) return;
      this.finished = true;
      this.events.onError?.(err);
    };

    rec.onend = () => {
      if (!this.finished && this.best) this.events.onFinal?.(this.best);
      this.finished = true;
      this.rec = null;
      this.events.onEnd?.();
    };

    try { rec.start(); } catch { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }
    this.rec = rec;
    return true;
  }

  /** Stop listening and deliver whatever was heard. */
  stop(): void {
    try { this.rec?.stop(); } catch { /* already stopped */ }
  }

  /** Stop listening and throw away whatever was heard. */
  cancel(): void {
    this.finished = true;
    this.best = '';
    try { this.rec?.abort(); } catch { /* already stopped */ }
    this.rec = null;
  }
}
