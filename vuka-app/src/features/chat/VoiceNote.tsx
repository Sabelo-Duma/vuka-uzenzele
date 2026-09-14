import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { attachmentUrl } from '../../lib/api';
import type { Attachment } from '../../lib/api';
import { formatDuration, waveformBars } from '../../lib/voice';
import { Icon } from '../../components/Icon';

/**
 * The clip that is playing, anywhere in the app.
 *
 * Held here rather than looked up in the document, because these elements are
 * never in the document: `new Audio()` builds a media element that is not
 * attached to anything, which is what lets a bubble play a blob without
 * rendering a browser's own player controls inside it. A DOM query for "every
 * other audio element" therefore finds none of them — so tapping a second
 * voice note left the first one talking underneath it.
 */
let nowPlaying: HTMLAudioElement | null = null;

/**
 * A voice note, as it appears in the thread.
 *
 * Three decisions worth stating.
 *
 * The audio is not downloaded until someone presses play. A thread with twenty
 * voice notes in it would otherwise pull two megabytes the moment it opened,
 * and most of those clips will never be listened to twice. The bubble is fully
 * drawn before then — length, waveform, who sent it — because all of that
 * travelled with the message.
 *
 * The length shown is the one the sender measured, not the one the audio
 * element reports. MediaRecorder routinely produces WebM with no duration in
 * its header, and a browser asked how long that is answers Infinity — which is
 * how a voice note ends up labelled "0:00" or blank in a lot of otherwise good
 * chat apps.
 *
 * The scrubber is a real range input, made invisible over the bars. Dragging,
 * arrow keys, screen-reader announcements and the whole of the platform's own
 * touch handling come with it; hand-rolling a slider would have meant
 * reimplementing all four, worse.
 */
export function VoiceNote({ attachment, tone }: { attachment: Attachment; tone: 'mine' | 'theirs' }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState(1);
  const [scrubbing, setScrubbing] = useState(false);
  const labelId = useId();

  const total = Math.max(1, attachment.durationMs ?? 1000) / 1000;
  const bars = waveformBars(attachment.waveform);

  // Let go of the element — and the decoder behind it — when the bubble goes.
  useEffect(() => () => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = '';
      if (nowPlaying === el) nowPlaying = null;
    }
  }, []);

  const ensureAudio = useCallback(async (): Promise<HTMLAudioElement> => {
    if (audioRef.current) return audioRef.current;
    setLoading(true);
    try {
      const url = await attachmentUrl(attachment.id);
      const el = new Audio(url);
      el.preload = 'auto';
      el.playbackRate = rate;
      el.onended = () => { setPlaying(false); setPosition(0); el.currentTime = 0; };
      el.onpause = () => setPlaying(false);
      el.onplay = () => setPlaying(true);
      el.ontimeupdate = () => setPosition(el.currentTime);
      audioRef.current = el;
      return el;
    } finally {
      setLoading(false);
    }
  }, [attachment.id, rate]);

  const toggle = async () => {
    setError(null);
    try {
      const el = await ensureAudio();
      if (el.paused) {
        // Only one voice note at a time.
        if (nowPlaying && nowPlaying !== el) nowPlaying.pause();
        nowPlaying = el;
        await el.play();
      } else {
        el.pause();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "That clip wouldn't play.");
      setPlaying(false);
    }
  };

  const seek = (seconds: number) => {
    setPosition(seconds);
    const el = audioRef.current;
    if (el) el.currentTime = seconds;
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const played = Math.min(1, position / total);
  const mine = tone === 'mine';
  /* Everything is drawn in the bubble's own text colour at varying strength,
     so one component sits correctly on the dark bubble and the light one
     without knowing which it is on. Strength is set inline rather than with an
     opacity utility, because these colours are CSS variables and a Tailwind
     opacity modifier on a bare var() silently compiles to nothing. */
  const remaining = Math.max(0, total - position);

  return (
    <div className="flex items-center gap-2.5 min-w-[188px] max-w-full">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        className={`grid place-items-center w-11 h-11 shrink-0 rounded-full transition active:scale-95 ${
          mine ? 'bg-canvas text-ink' : 'bg-brand-solid text-brand-on'
        }`}
      >
        {loading
          ? <span className="block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          : <Icon name={playing ? 'pause' : 'play'} size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="relative h-11 flex items-center">
          {/* The picture of the sound. Purely decorative — the slider over it
              is what anything other than a mouse or a finger interacts with. */}
          <div className="absolute inset-0 flex items-center gap-[2px]" aria-hidden="true">
            {bars.map((height, i) => {
              const passed = i / bars.length <= played;
              return (
                <span
                  key={i}
                  className="flex-1 rounded-full bg-current"
                  style={{
                    height: `${Math.max(3, (height / 9) * 26)}px`,
                    opacity: passed ? 0.95 : 0.32,
                    transition: scrubbing ? 'none' : 'opacity .12s linear',
                  }}
                />
              );
            })}
          </div>

          {/* Labelled twice on purpose. The visible-to-assistive-tech <label>
              is the correct association; the aria-label is what survives
              useId() producing an id with colons in it, which is legal in HTML
              and awkward everywhere that treats an id as a selector. */}
          <label htmlFor={labelId} className="sr-only">Voice note position</label>
          <input
            id={labelId}
            type="range"
            aria-label="Voice note position"
            min={0}
            max={total}
            step={0.05}
            value={Math.min(position, total)}
            onChange={(e) => seek(Number(e.target.value))}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            onPointerCancel={() => setScrubbing(false)}
            aria-valuetext={`${formatDuration(position * 1000)} of ${formatDuration(total * 1000)}`}
            className="relative w-full h-11 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-current
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-current [&::-moz-range-thumb]:border-0"
          />
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-micro font-mono tnum" style={{ opacity: 0.75 }}>
            {/* Counting down while it plays, total when it isn't — the same
                thing every voice note in the world does. */}
            {playing || position > 0 ? formatDuration(remaining * 1000) : formatDuration(total * 1000)}
          </span>
          <button
            type="button"
            onClick={cycleRate}
            aria-label={`Playback speed ${rate} times. Tap to change.`}
            className="grid place-items-center min-w-[44px] h-11 -my-1.5 -mr-2 shrink-0 transition active:scale-95"
          >
            <span
              className="px-1.5 py-0.5 rounded-chip text-micro font-bold font-mono tnum border border-current"
              style={{ opacity: rate === 1 ? 0.55 : 1 }}
            >
              {rate}×
            </span>
          </button>
        </div>

        {error && <p className="text-micro mt-1 mb-0" style={{ opacity: 0.9 }}>{error}</p>}
      </div>
    </div>
  );
}
