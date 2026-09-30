/* ============================================================
   Listening by recording — for when the phone cannot listen itself.

   The phone's recogniser (lib/speech.ts, Listener) is the first choice: free,
   instant, nothing leaves the phone. But iPhone has no recogniser at all for
   Afrikaans, isiZulu, isiXhosa or Sesotho, and installed web apps on iPhone
   are unreliable even in English. For the languages the server can
   transcribe (GET /api/config → sttLangs: English and Afrikaans, the two
   Whisper knows), this records the question and has the server turn it into
   text instead.

   It deliberately has the same shape as Listener — start(), stop(), cancel(),
   and the same four events with the same guarantees (onFinal at most once,
   onEnd exactly once, last) — so the Msizi screen drives either one the same
   way and cannot tell them apart.

   Asking for the microphone here goes through getUserMedia, which is what
   makes iPhone show its permission prompt.

   When to stop: after the person has spoken and then been quiet for a
   moment, the same rule the phone's recogniser uses. Loudness comes from the
   recorder's own meter; "speech" is anything clearly above the room's noise
   in the first moments of the recording.
   ============================================================ */
import { api } from './api';
import { VoiceSession, canRecord } from './voice';
import type { Lang } from '../i18n';
import type { ListenError, ListenEvents } from './speech';

/* The languages the server can transcribe (from /api/config), set at boot. */
let serverLangs: string[] = [];
export function setTranscribeLangs(langs: string[] | undefined): void { serverLangs = Array.isArray(langs) ? langs : []; }
/** Can Msizi listen in `lang` by recording on this device? */
export function canTranscribe(lang: Lang): boolean { return serverLangs.includes(lang) && canRecord(); }

const MAX_MS = 15_000;               // same ceiling as the phone's recogniser
const QUIET_AFTER_SPEECH_MS = 1_400; // the natural end of a question
const NOTHING_SAID_MS = 7_000;       // give up if nobody speaks
const CALIBRATE_MS = 350;            // the first moments set the noise floor
const MIN_SPEECH_MS = 250;           // shorter than this is a click, not a word

export class RecordListener {
  private session: VoiceSession | null = null;
  private settled = false;
  private delivered = false;
  private cancelled = false;
  private floor = 0;
  private samples = 0;
  private speechMs = 0;
  private lastLoudAt = 0;

  constructor(private lang: Lang, private events: ListenEvents = {}) {}

  static get available(): boolean { return canRecord(); }

  /** Starts asynchronously (the permission prompt); returns false only if it cannot start at all. */
  start(): boolean {
    if (!canRecord()) { this.events.onError?.('failed'); this.events.onEnd?.(); return false; }
    const session = new VoiceSession(MAX_MS, {
      onTick: (elapsed, level) => this.tick(elapsed, level),
      onMaxReached: () => { void this.finish(); },
    });
    this.session = session;
    session.start().catch((e: unknown) => {
      const name = (e as { name?: string })?.name;
      this.settle(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotReadableError' ? 'busy' : 'failed');
    });
    return true;
  }

  private tick(elapsed: number, level: number) {
    if (this.settled) return;
    if (elapsed < CALIBRATE_MS) {
      this.floor = (this.floor * this.samples + level) / (this.samples + 1);
      this.samples += 1;
      return;
    }
    const threshold = Math.max(0.06, this.floor * 2.2);
    if (level > threshold) {
      this.speechMs += 50;
      this.lastLoudAt = Date.now();
    }
    const heard = this.speechMs >= MIN_SPEECH_MS;
    if (heard && Date.now() - this.lastLoudAt > QUIET_AFTER_SPEECH_MS) void this.finish();
    else if (!heard && elapsed > NOTHING_SAID_MS) void this.finish();
  }

  /** Stop and send what was said. */
  stop(): void { void this.finish(); }

  /** Stop and throw it away. */
  cancel(): void {
    if (this.settled) return;
    this.cancelled = true;
    this.delivered = true;
    this.session?.cancel?.();
    this.settle();
  }

  private async finish(): Promise<void> {
    if (this.settled || !this.session) return;
    const session = this.session;
    this.session = null;
    let blob: Blob | null = null;
    try { blob = (await session.stop()).blob; } catch { blob = null; }
    if (this.cancelled || this.settled) return;
    if (!blob || this.speechMs < MIN_SPEECH_MS) { this.settle('no-speech'); return; }
    this.events.onPartial?.('…');
    try {
      const text = await api.transcribe(blob, this.lang);
      if (this.cancelled || this.settled) return;
      if (!text.trim()) { this.settle('no-speech'); return; }
      this.delivered = true;
      this.events.onFinal?.(text.trim());
      this.settle();
    } catch (e) {
      const reason = (e as { reason?: string })?.reason;
      this.settle(reason === 'unsupported_language' ? 'no-language' : reason === 'over_budget' ? 'failed' : 'network');
    }
  }

  private settle(err?: ListenError): void {
    if (this.settled) return;
    this.settled = true;
    if (this.session) { this.session.cancel?.(); this.session = null; }
    if (err) this.events.onError?.(err);
    else if (!this.delivered) this.events.onError?.('no-speech');
    this.events.onEnd?.();
  }
}
