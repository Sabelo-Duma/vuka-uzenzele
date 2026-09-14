/* ============================================================
   Recording a voice note in a browser.

   The one thing this file exists to get right is that there is no single audio
   format every browser can record. Chrome, Edge and Firefox record WebM with
   Opus. Safari records MP4 with AAC, and did not gain the ability to record
   anything else until 18.4 — and even on 18.4 it still defaults to MP4 unless
   asked otherwise. So the format is chosen by asking, in order, and whatever
   comes out is stored with its own content type rather than assumed.

   Why voice notes matter here more than in most apps: this is a product for
   South African youth work, used by people who may be typing in their second
   or third language on a cheap phone in a moving taxi. Saying "I'm at the gate,
   the blue one" takes three seconds to speak and thirty to type.
   ============================================================ */

/**
 * The formats a browser might record, best first.
 *
 * Opus first because it is built for speech: a minute of it is around a hundred
 * kilobytes, where AAC at the same intelligibility is several times that, and
 * every one of those kilobytes is paid for out of somebody's data bundle at
 * both ends. MP4/AAC is not a compromise so much as what Safari gives you.
 */
const CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
];

/** The first format this browser admits to supporting, or null for its default. */
export function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const type of CANDIDATES) {
    try { if (MediaRecorder.isTypeSupported(type)) return type; } catch { /* older implementations throw */ }
  }
  /* Null means "let the browser decide". Safari below 18.4 answers false to
     every probe above and still records perfectly well as MP4 — refusing to
     record because the probe was unhelpful would be the wrong conclusion. */
  return null;
}

/** Can this device record at all? Needs both the API and a secure context. */
export function canRecord(): boolean {
  return typeof MediaRecorder !== 'undefined'
    && typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia;
}

export interface Recording {
  blob: Blob;
  durationMs: number;
  /** One digit 0-9 per bar — see sampling below. */
  waveform: string;
}

/** How many bars a finished clip is drawn with. */
const BARS = 40;
/** How often loudness is measured while recording. */
const SAMPLE_MS = 50;

/** mm:ss — the only time format a voice note ever needs. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Squash however many loudness samples were taken into exactly BARS digits.
 *
 * Normalised against the loudest moment rather than against an absolute scale,
 * because phone microphones differ by more than speaking voices do — without
 * it, a quiet handset draws a flat line and a loud one draws a solid block.
 * A floor of 1 keeps silence visible as a thin bar instead of a gap, so the
 * clip reads as a clip and not as a broken image.
 */
function toWaveform(samples: number[]): string {
  if (samples.length === 0) return '1'.repeat(BARS);
  const peak = Math.max(...samples, 0.0001);
  const out: number[] = [];
  for (let i = 0; i < BARS; i++) {
    const from = Math.floor((i * samples.length) / BARS);
    const to = Math.max(from + 1, Math.floor(((i + 1) * samples.length) / BARS));
    let sum = 0;
    for (let j = from; j < to; j++) sum += samples[j] ?? 0;
    const mean = sum / (to - from);
    out.push(Math.min(9, Math.max(1, Math.round((mean / peak) * 9))));
  }
  return out.join('');
}

export interface RecorderEvents {
  /** Called about twenty times a second with elapsed ms and current loudness 0-1. */
  onTick?: (elapsedMs: number, level: number) => void;
  /** The cap was reached and recording stopped by itself. */
  onMaxReached?: () => void;
}

/**
 * One recording session.
 *
 * Deliberately a class rather than a hook: it owns a microphone, an audio
 * context and a timer, and every one of those has to be released on exactly one
 * path no matter how the session ends — sent, cancelled, navigated away from,
 * or interrupted by a phone call. A hook would spread that across renders.
 */
export class VoiceSession {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private samples: number[] = [];
  private timer: number | null = null;
  private startedAt = 0;
  private stopping: Promise<Recording> | null = null;

  constructor(private maxMs: number, private events: RecorderEvents = {}) {}

  /** Elapsed time so far. Used by the UI; the clip's real length is measured at stop. */
  get elapsedMs(): number { return this.startedAt ? Date.now() - this.startedAt : 0; }

  /**
   * Ask for the microphone and start.
   *
   * The constraints are the ones that matter for speech on a phone held at
   * arm's length in a noisy street. Every browser is free to ignore them, which
   * is why nothing downstream depends on them having been honoured.
   */
  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });

    const mimeType = pickMimeType();
    this.recorder = new MediaRecorder(this.stream, {
      ...(mimeType ? { mimeType } : {}),
      /* A hint, not a setting — Safari has never implemented it. Speech at
         32 kbps is clear; the cap on the server is what actually protects
         anything. */
      audioBitsPerSecond: 32_000,
    });
    this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };

    /* Loudness is measured off the live stream while recording, so the waveform
       is ready the moment the clip is. The alternative — decoding the finished
       audio — means shipping a decoder, doing it again on the receiving side,
       and doing it on the phones least able to afford it. */
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        this.ctx = new Ctor();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024;
        this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);
      }
    } catch { /* no meter; the timer still runs and the clip is unaffected */ }

    this.startedAt = Date.now();
    this.recorder.start();

    const buf = this.analyser ? new Uint8Array(this.analyser.fftSize) : null;
    this.timer = window.setInterval(() => {
      let level = 0;
      if (this.analyser && buf) {
        this.analyser.getByteTimeDomainData(buf);
        // Root mean square around the 128 midpoint: loudness, not position.
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        level = Math.sqrt(sum / buf.length);
      }
      this.samples.push(level);
      const elapsed = this.elapsedMs;
      this.events.onTick?.(elapsed, level);
      if (elapsed >= this.maxMs) {
        this.events.onMaxReached?.();
        void this.stop();
      }
    }, SAMPLE_MS);
  }

  /** Stop and hand back the clip. Safe to call twice — the second call waits on the first. */
  stop(): Promise<Recording> {
    if (this.stopping) return this.stopping;
    this.stopping = new Promise<Recording>((resolve, reject) => {
      const rec = this.recorder;
      if (!rec || rec.state === 'inactive') {
        this.release();
        reject(new Error('Nothing was recorded.'));
        return;
      }
      const durationMs = this.elapsedMs;
      rec.onstop = () => {
        /* The blob's own type is what the browser actually produced, which is
           not always what was asked for. It is what gets uploaded, so the
           server stores the truth rather than our preference. */
        const type = rec.mimeType || this.chunks[0]?.type || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        const waveform = toWaveform(this.samples);
        this.release();
        resolve({ blob, durationMs, waveform });
      };
      rec.onerror = () => { this.release(); reject(new Error('The recording failed. Please try again.')); };
      try { rec.stop(); } catch (e) { this.release(); reject(e as Error); }
    });
    return this.stopping;
  }

  /** Throw the recording away and let the microphone go. */
  cancel(): void {
    try { if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop(); } catch { /* already stopped */ }
    this.chunks = [];
    this.release();
  }

  /**
   * Let go of everything.
   *
   * The microphone track especially: leave it running and the browser keeps
   * showing the recording indicator, iOS keeps the audio session open, and on
   * some Android builds nothing else on the phone can record until the tab is
   * closed.
   */
  private release(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close().catch(() => { /* already closed */ });
    this.ctx = null;
    this.analyser = null;
    this.recorder = null;
  }
}

/**
 * Turn a stored waveform string back into bar heights.
 *
 * Tolerant on purpose: a clip recorded before waveforms existed, or by a
 * browser where the meter was unavailable, still has to draw as something.
 */
export function waveformBars(waveform: string | null | undefined, bars = BARS): number[] {
  const digits = (waveform ?? '').replace(/[^0-9]/g, '');
  if (digits.length === 0) return Array.from({ length: bars }, (_, i) => 3 + ((i * 7) % 5));
  return Array.from({ length: bars }, (_, i) => {
    const d = digits[Math.floor((i * digits.length) / bars)];
    return Math.max(1, Number(d) || 1);
  });
}
