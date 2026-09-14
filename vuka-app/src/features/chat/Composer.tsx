import { useEffect, useRef, useState } from 'react';
import { canRecord, formatDuration, VoiceSession } from '../../lib/voice';
import type { Recording } from '../../lib/voice';
import { isSupportedImage, preparePhoto } from '../../lib/photo';
import type { PreparedPhoto } from '../../lib/photo';
import { Icon } from '../../components/Icon';

/**
 * The box at the bottom of a conversation.
 *
 * It owns three things the thread above it should not have to think about:
 * what is being typed, whether the microphone is running, and how far an
 * upload has got. The thread owns what is being replied to or edited, because
 * that is about messages rather than about composing.
 *
 * Recording starts and stops with a tap, not with a press and hold. Hold-to-
 * record is what the big messengers do and it is genuinely nice with a thumb,
 * but on its own it is unusable with a keyboard, unusable with a switch, and
 * hostile to anyone whose grip is unsteady — and it cannot be tested by a
 * pointer at all. Tap to start, tap to send, tap to discard: three targets that
 * are all 44px, all reachable, and all announce themselves.
 */
export interface ComposerProps {
  disabled?: boolean;
  mode: 'new' | 'edit';
  draft: string;
  onDraftChange: (next: string) => void;
  /** How long a voice note may run, from the server. */
  voiceMaxMs: number;
  onSendText: () => void;
  onSendVoice: (recording: Recording) => void;
  onSendPhoto: (photo: PreparedPhoto, caption: string) => void;
  /** Called as the person types, throttled by the caller. */
  onTyping: () => void;
  onCancelCompose: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'recording'; elapsed: number; level: number }
  | { kind: 'preparing' };

export function Composer({
  disabled, mode, draft, onDraftChange, voiceMaxMs,
  onSendText, onSendVoice, onSendPhoto, onTyping, onCancelCompose, inputRef,
}: ComposerProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [notice, setNotice] = useState<string | null>(null);
  const session = useRef<VoiceSession | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const box = inputRef ?? ownRef;

  /* A microphone left running is not a tidiness problem, it is a recording
     indicator that stays lit and, on some phones, an audio device nothing else
     can use until the tab closes. Leaving the screen must release it. */
  useEffect(() => () => { session.current?.cancel(); session.current = null; }, []);

  /* The textarea grows with what is in it, up to a few lines. Done here rather
     than with CSS because a textarea has no content-based height — and reset to
     'auto' first, or it can only ever get taller. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [draft, box]);

  const startRecording = async () => {
    setNotice(null);
    if (!canRecord()) {
      setNotice("This browser can't record audio. You can still type, or send a photo.");
      return;
    }
    const s = new VoiceSession(voiceMaxMs, {
      onTick: (elapsed, level) => setPhase({ kind: 'recording', elapsed, level }),
      onMaxReached: () => setNotice(`A voice note can be up to ${Math.round(voiceMaxMs / 1000)} seconds.`),
    });
    try {
      setPhase({ kind: 'recording', elapsed: 0, level: 0 });
      await s.start();
      session.current = s;
    } catch (e) {
      setPhase({ kind: 'idle' });
      const name = (e as { name?: string }).name;
      /* These three are the only failures people actually hit, and each one has
         a different fix — a shared "recording failed" would leave someone
         tapping a button that was never going to work. */
      setNotice(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Vuka needs permission to use your microphone. Allow it in your browser settings and try again.'
          : name === 'NotFoundError'
            ? "No microphone was found on this device."
            : "Recording couldn't start. Please try again.",
      );
    }
  };

  const stopAndSend = async () => {
    const s = session.current;
    if (!s) return;
    session.current = null;
    setPhase({ kind: 'preparing' });
    try {
      const recording = await s.stop();
      setPhase({ kind: 'idle' });
      if (recording.durationMs < 500) {
        setNotice('That was too short to send. Hold on a little longer.');
        return;
      }
      onSendVoice(recording);
    } catch (e) {
      setPhase({ kind: 'idle' });
      setNotice(e instanceof Error ? e.message : 'That recording failed.');
    }
  };

  const cancelRecording = () => {
    session.current?.cancel();
    session.current = null;
    setPhase({ kind: 'idle' });
  };

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setNotice(null);
    if (!isSupportedImage(file)) {
      setNotice("That file isn't a photo Vuka can send.");
      return;
    }
    setPhase({ kind: 'preparing' });
    try {
      const photo = await preparePhoto(file);
      setPhase({ kind: 'idle' });
      onSendPhoto(photo, draft.trim());
      onDraftChange('');
    } catch (e) {
      setPhase({ kind: 'idle' });
      setNotice(e instanceof Error ? e.message : "That photo couldn't be prepared.");
    }
  };

  if (phase.kind === 'recording') {
    const remaining = Math.max(0, voiceMaxMs - phase.elapsed);
    const nearlyDone = remaining <= 10_000;
    return (
      <div className="pt-3 border-t border-line">
        <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-live bg-live-soft px-3 py-2.5">
          <span className="relative grid place-items-center w-3 h-3 shrink-0" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-live-solid animate-ping" />
            <span className="relative w-2.5 h-2.5 rounded-full bg-live-solid" />
          </span>

          <span className="font-mono tnum text-body font-bold text-live shrink-0" aria-live="off">
            {formatDuration(phase.elapsed)}
          </span>

          {/* What the microphone is actually hearing. Without it there is no way
              to tell a recording from a muted one until it is too late. */}
          <div className="flex-1 flex items-center gap-[3px] h-6 min-w-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => {
              const wave = Math.sin((phase.elapsed / 90) + i * 0.6) * 0.35 + 0.65;
              const h = Math.max(3, Math.min(22, phase.level * 60 * wave + 3));
              return <span key={i} className="flex-1 rounded-full bg-live-solid" style={{ height: `${h}px`, opacity: 0.8 }} />;
            })}
          </div>

          <span className={`text-micro font-mono tnum shrink-0 ${nearlyDone ? 'text-live font-bold' : 'text-dim'}`}>
            −{formatDuration(remaining)}
          </span>
        </div>

        <p className="sr-only" aria-live="polite">Recording a voice note. {formatDuration(phase.elapsed)} so far.</p>

        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={cancelRecording}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-pill border-[1.5px] border-line bg-surface text-dim font-bold text-small transition active:scale-95 hover:text-ink"
          >
            <Icon name="trash" size={16} /> Discard
          </button>
          <button
            type="button"
            onClick={stopAndSend}
            className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-pill bg-brand-solid text-brand-on font-bold text-small transition active:scale-95 hover:bg-brand-hover"
          >
            <Icon name="send" size={16} /> Send voice note
          </button>
        </div>

        {notice && <p className="text-micro text-live mt-2 mb-0">{notice}</p>}
      </div>
    );
  }

  const hasText = draft.trim().length > 0;
  const busy = phase.kind === 'preparing';

  return (
    <div className="pt-3 border-t border-line">
      {notice && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-xl bg-surface-2 border border-line">
          <span className="text-dim mt-0.5 shrink-0"><Icon name="alert" size={14} /></span>
          <p className="flex-1 text-small text-ink m-0 leading-snug">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="shrink-0 text-dim hover:text-ink transition p-1">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {mode === 'new' && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              /* display:none rather than visually-hidden. It is never tapped —
                 the button beside it opens the picker — so leaving it on screen
                 at 1x1 only creates a control that fails the 44px floor and
                 that a screen reader has to step through for nothing. */
              hidden
              onChange={(e) => { void choosePhoto(e.target.files?.[0]); e.target.value = ''; }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || busy}
              aria-label="Send a photo"
              className="grid place-items-center w-11 h-11 shrink-0 rounded-2xl border-[1.5px] border-line bg-surface text-dim hover:text-ink hover:bg-surface-2 transition active:scale-95 disabled:opacity-40"
            >
              <Icon name="image" size={19} />
            </button>
          </>
        )}

        {/* 16px text, deliberately: below that iOS zooms the whole viewport
            every time the field is focused — which in a chat is every reply. */}
        <textarea
          ref={box}
          value={draft}
          onChange={(e) => { onDraftChange(e.target.value); onTyping(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendText(); }
            if (e.key === 'Escape') onCancelCompose();
          }}
          rows={1}
          disabled={disabled}
          placeholder={mode === 'edit' ? 'Edit your message…' : 'Message'}
          aria-label={mode === 'edit' ? 'Edit message' : 'Message'}
          className="flex-1 min-w-0 resize-none max-h-28 border-[1.5px] border-line rounded-2xl px-4 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-faint transition disabled:opacity-60"
        />

        {mode === 'new' && !hasText ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || busy}
            aria-label="Record a voice note"
            className="grid place-items-center w-11 h-11 shrink-0 rounded-2xl bg-brand-solid text-brand-on hover:bg-brand-hover transition active:scale-95 disabled:opacity-40"
          >
            {busy
              ? <span className="block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Icon name="mic" size={19} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSendText}
            disabled={disabled || busy || !hasText}
            aria-label={mode === 'edit' ? 'Save edit' : 'Send message'}
            className="grid place-items-center w-11 h-11 shrink-0 rounded-2xl bg-brand-solid text-brand-on hover:bg-brand-hover transition active:scale-95 disabled:opacity-40"
          >
            <Icon name={mode === 'edit' ? 'check' : 'send'} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
