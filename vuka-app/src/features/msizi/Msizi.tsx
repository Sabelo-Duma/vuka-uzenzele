/* ============================================================
   Msizi — the screen.

   Two ways in and two ways out: type or talk, read or listen. Every one of the
   four has to work on its own, because on the phones this app is built for at
   least one of them will be unavailable, and which one varies by handset.

   The shape of the screen follows from who is using it. Someone asking "does
   Vuka keep my money" is worried, possibly standing somewhere they would rather
   not be, quite possibly reading in their second or third language. So answers
   are set as plain paragraphs at body size rather than in chat bubbles — a
   bubble is the wrong container for eight lines about how payment works — and
   the follow-up questions are offered as tappable chips, because choosing from
   a list is far easier than composing a question when you are not sure what to
   ask next.

   On the design system: this screen takes its one feature band for the header
   and spends its single primary action on Ask. Vermilion appears only while
   the microphone is actually open, which is the one thing on this screen that
   is genuinely happening right now.
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../store/appStore';
import { useLanguage, useT } from '../../providers/LanguageProvider';
import { computeCv } from '../../lib/engine';
import { autoReleaseHours } from '../../data/catalog';
import { ask, askById, groundingFor, lookup, openers, type MsiziContext, type MsiziReply } from '../../lib/msizi';
import { peelGreeting, smallTalk } from '../../lib/msiziChat';
import { api } from '../../lib/api';
import {
  Listener, audioMode, canListen, canSpeak, onVoicesChanged, pickVoice, primeSpeech, speak, stopSpeaking, voicesReady,
  type ListenError,
} from '../../lib/speech';
import { langMeta } from '../../i18n';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';

/** One exchange. The question as asked, and what came back. */
interface Turn {
  id: number;
  question: string;
  reply: MsiziReply;
  /** Asked out loud, so the answer should be read out loud too. */
  spoken: boolean;
}

/* ------------------------------------------------------------------
   Rendering an answer.
   ------------------------------------------------------------------ */

/**
 * Answers are plain text with "• " marking a bullet. Deliberately not Markdown
 * and deliberately not HTML: the bodies are written by hand in this repository,
 * and the moment they can carry markup they can carry a mistake that renders as
 * a broken page on somebody's phone.
 */
function AnswerBody({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const blocks: { kind: 'p' | 'ul'; items: string[] }[] = [];
  for (const line of lines) {
    const bullet = line.startsWith('• ');
    const content = bullet ? line.slice(2) : line;
    const last = blocks[blocks.length - 1];
    if (bullet && last?.kind === 'ul') last.items.push(content);
    else blocks.push({ kind: bullet ? 'ul' : 'p', items: [content] });
  }
  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((b, i) => (b.kind === 'p' ? (
        <p key={i} className="text-body text-ink leading-relaxed">{b.items[0]}</p>
      ) : (
        <ul key={i} className="flex flex-col gap-1.5 pl-1">
          {b.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-body text-ink leading-relaxed">
              <span aria-hidden="true" className="text-brand shrink-0 leading-relaxed">•</span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      )))}
    </div>
  );
}

/** A question offered as a tappable chip. */
function AskChip({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const entry = lookup(id);
  if (!entry) return null;
  return (
    <button
      onClick={() => onPick(id)}
      /* 44px minimum, set explicitly rather than left to the padding. These
         chips sit in a wrapped row where several land within a thumb's width
         of each other, which is exactly where an under-sized target gets you
         the answer next to the one you wanted. */
      className="inline-flex items-center text-left min-h-[44px] rounded-pill border border-line bg-surface
        px-4 py-2 text-small font-semibold text-ink hover:bg-surface-2 hover:border-brand transition active:scale-95"
    >
      {entry.ask}
    </button>
  );
}

/* ------------------------------------------------------------------
   The screen.
   ------------------------------------------------------------------ */

export function Msizi() {
  const { state, navigate } = useApp();
  const t = useT();
  const { lang } = useLanguage();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [speakingTurn, setSpeakingTurn] = useState<number | null>(null);
  /** False until the browser has published its voice list. */
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  /** Bumped whenever that list changes, to force the capability re-read. */
  const [voiceTick, setVoiceTick] = useState(0);

  const listenerRef = useRef<Listener | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  /* Everything Msizi is allowed to know about the person asking. Rebuilt on
     each render from the same state the screens use, so a figure it reads back
     can never disagree with the screen the user just came from. */
  const ctx = useMemo<MsiziContext>(() => ({
    role: state.role,
    name: state.user?.name ?? '',
    cv: state.role === 'worker' ? computeCv(state.worker) : null,
    minWage: state.minWage,
    autoReleaseHours: autoReleaseHours(),
    applied: state.appliedGigIds.length + state.appliedFormalIds.length,
    gigsNearby: state.gigs.length,
    unread: state.unread,
    idVerified: state.worker.idVerified,
  }), [state.role, state.user, state.worker, state.minWage, state.appliedGigIds,
       state.appliedFormalIds, state.gigs, state.unread]);

  /* Voices arrive asynchronously, so what this device can manage is not known
     at first paint. Asking before the list exists reports "no voice" on a
     phone that has one — and asking only once reports it forever, because
     Chromium can publish its voices later than voicesReady is willing to wait.
     So: read it when the list first settles, and again every time it changes. */
  useEffect(() => {
    let live = true;
    void voicesReady().then(() => { if (live) setVoicesLoaded(true); });
    const stop = onVoicesChanged(() => {
      if (!live) return;
      setVoicesLoaded(true);
      setVoiceTick((n) => n + 1);
    });
    return () => { live = false; stop(); };
  }, []);

  /* Let go of the microphone and stop talking on the way out — whichever way
     out it is. A page that keeps speaking after you have navigated away is
     alarming, and a microphone left open is worse. */
  useEffect(() => () => {
    listenerRef.current?.cancel();
    stopSpeaking();
  }, []);

  const speechCoverage = useMemo(
    () => (voicesLoaded ? pickVoice(lang).coverage : 'native'),
    /* voiceTick is not read here — it is the signal that the list underneath
       pickVoice has changed and the answer needs recomputing. */
    [voicesLoaded, lang, voiceTick],
  );

  const scrollToEnd = useCallback(() => {
    window.requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  }, []);

  const readAloud = useCallback((turn: Turn) => {
    if (!canSpeak()) return;
    /* The title first, then the answer. Heard rather than seen, the heading is
       what tells you Msizi understood the question before the detail starts. */
    /* The newlines are left in on purpose. speak() splits on them to find
       sentence boundaries, and it is those boundaries that give the voice a
       cadence instead of one flat run-on. Flattening them here — which the
       first version did — is what made it sound recited. */
    const r = turn.reply;
    if (r.kind === 'thinking') return;
    const text = r.kind === 'miss'
      ? `${t('msizi.missTitle')}.\n${t('msizi.missBody')}`
      : r.title ? `${r.title}.\n${r.body}` : r.body;
    setSpeakingTurn(turn.id);
    /* A live answer is the person's own record. It is read by a voice on the
       phone, never by one that sends the sentence to a server. */
    speak(text, lang, () => setSpeakingTurn((cur) => (cur === turn.id ? null : cur)),
      { localOnly: r.kind === 'live' });
  }, [lang, t]);

  const put = useCallback((question: string, reply: MsiziReply, spoken: boolean): Turn => {
    const turn: Turn = { id: nextId.current++, question, reply, spoken };
    setTurns((prev) => [...prev, turn]);
    setVoiceNote(null);
    scrollToEnd();
    /* Asked out loud, answered out loud. Typed questions are not read back:
       somebody on a taxi with the volume up did not ask for that. The iOS
       rule that speech must start inside a tap is met by primeSpeech(),
       called when the microphone was tapped. */
    if (spoken && reply.kind !== 'thinking') readAloud(turn);
    return turn;
  }, [readAloud, scrollToEnd]);

  /** Swap a "thinking" turn for what came back, and read it if it was spoken. */
  const settleTurn = useCallback((turn: Turn, reply: MsiziReply) => {
    const next = { ...turn, reply };
    setTurns((prev) => prev.map((x) => (x.id === turn.id ? next : x)));
    scrollToEnd();
    if (turn.spoken) readAloud(next);
  }, [readAloud, scrollToEnd]);

  /* The conversation so far, for the model fallback's follow-ups. */
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  const firstName = (state.user?.name ?? '').trim().split(/\s+/)[0] ?? '';

  const submit = useCallback((question: string, spoken = false) => {
    const q = question.trim();
    if (!q) return;
    stopSpeaking();
    setDraft('');
   

    /* 1. Conversation: "hello", "thanks", "what can you do". */
    const chat = smallTalk(q, lang, firstName, ctx.role);
    if (chat) {
      put(q, {
        kind: 'chat', id: null, title: '', body: chat.body,
        suggestions: chat.offerOpeners ? openers(ctx.role).slice(0, 4) : [], score: 1,
      }, spoken);
      return;
    }

    /* 2. The written answers. "Hi, how do I get paid" is asked without the hi. */
    const query = peelGreeting(q).rest || q;
    const reply = ask(query, ctx);
    if (reply.kind !== 'miss') { put(q, reply, spoken); return; }

    /* 3. Nothing written covers it. Ask the model, grounded on the nearest
          entries. Offline, unconfigured or over quota, it says honestly that it
          does not know, exactly as before. */
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { put(q, reply, spoken); return; }
    const pending = put(q, { ...reply, kind: 'thinking' }, spoken);
    const history = turnsRef.current
      .filter((x) => x.reply.kind !== 'thinking' && x.reply.kind !== 'live')
      .slice(-3)
      .map((x) => ({ q: x.question, a: x.reply.kind === 'miss' ? '' : x.reply.body }));
    api.assistantAsk({ question: query, lang, entries: groundingFor(query, ctx), history })
      .then(({ answer }) => settleTurn(pending, {
        kind: 'ai', id: null, title: '', body: answer, suggestions: reply.suggestions.slice(0, 3), score: reply.score,
      }))
      .catch(() => settleTurn(pending, reply));
  }, [ctx, put, settleTurn, lang, firstName]);

  const pick = useCallback((id: string) => {
    const entry = lookup(id);
    const reply = askById(id, ctx);
    if (!entry || !reply) return;
    stopSpeaking();
    put(entry.ask, reply, false);
  }, [ctx, put]);

  /* ---- listening ---- */

  const voiceMessage = useCallback((err: ListenError): string => {
    switch (err) {
      case 'denied': return t('msizi.voiceDenied');
      case 'no-speech': return t('msizi.voiceNoSpeech');
      case 'no-language': return t('msizi.voiceNoLanguage', { language: langMeta(lang).label });
      case 'network': return t('msizi.voiceNetwork');
      default: return t('msizi.voiceFailed');
    }
  }, [t, lang]);

  const startListening = useCallback(() => {
    if (listening) { listenerRef.current?.stop(); return; }
    /* Synchronously, inside this tap: the only moment iOS lets speech be
       unlocked. Without it, the spoken answer that follows is silently refused
       — which is why voice questions were answered in silence on an iPhone. */
    primeSpeech();
    stopSpeaking();
    setVoiceNote(null);
   

    /* The words appear in the question box as they are recognised, the same
       box typing uses, so the person sees exactly what was heard. Anything
       already typed stays in front. */
    const prefix = draft.trim() ? `${draft.trim()} ` : '';
    const listener = new Listener(lang, {
      onPartial: (text) => { setDraft(prefix + text); },
      onFinal: (text) => submit(prefix + text, true),
      onError: (err) => { setVoiceNote(voiceMessage(err)); setDraft(prefix.trim()); },
      onEnd: () => { setListening(false); listenerRef.current = null; audioMode('playback'); },
    });
    listenerRef.current = listener;
    if (listener.start()) setListening(true);
  }, [listening, lang, submit, voiceMessage, draft]);

  /* ---- what this device can actually do ---- */

  const listenSupported = canListen();
  /* Having the API is not the same as being able to use it: a browser can
     expose speechSynthesis and ship no voices, in which case the button would
     be there and nothing would ever come out of it. */
  const speakSupported = canSpeak() && speechCoverage !== 'none';

  const capabilityNote = !listenSupported
    ? t('msizi.voiceUnsupported')
    : !speakSupported
      ? t('msizi.speakUnsupported')
      /* Only worth saying to somebody whose language it actually is. Telling an
         English speaker that answers will be read in English is noise. */
      : speechCoverage === 'fallback' && lang !== 'en'
        ? t('msizi.speakFallback', { language: langMeta(lang).label })
        : null;

  const suggestions = turns.length === 0 ? openers(state.role) : [];

  return (
    <div className="flex flex-col gap-5">
      {/* The one feature band this screen is allowed. */}
      <header className="feature-band rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-on-feature-accent text-feature"
          >
            <Icon name="assistant" size={26} />
          </span>
          <div className="min-w-0">
            <h1 className="text-title font-display font-bold text-on-feature">{t('msizi.name')}</h1>
            <p className="text-small text-on-feature-dim">{t('msizi.tagline')}</p>
          </div>
        </div>
        <p className="mt-4 text-body text-on-feature-dim leading-relaxed">{t('msizi.intro')}</p>
      </header>

      {/* What this handset can and cannot do, said plainly rather than by a
          button that silently does nothing. */}
      {capabilityNote && (
        <p className="flex gap-2.5 rounded-2xl border border-line bg-info-soft px-3.5 py-3 text-small text-ink leading-snug">
          <span aria-hidden="true" className="shrink-0">ℹ️</span>
          <span>{capabilityNote}</span>
        </p>
      )}

      {/* Opening suggestions, before anything has been asked. */}
      {suggestions.length > 0 && (
        <section aria-label={t('msizi.tryAsking')}>
          <h2 className="text-micro font-bold uppercase tracking-wide text-faint mb-2.5">{t('msizi.tryAsking')}</h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((id) => <AskChip key={id} id={id} onPick={pick} />)}
          </div>
        </section>
      )}

      {/* The conversation. */}
      <div className="flex flex-col gap-5">
        {turns.map((turn) => (
          <article key={turn.id} className="flex flex-col gap-3">
            <p className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-brand-soft px-3.5 py-2.5 text-small font-semibold text-ink">
              <span className="sr-only">{t('msizi.you')}: </span>
              {turn.question}
            </p>

            <div
              className="rounded-3xl border border-line bg-surface p-4 sm:p-5"
              /* Announced to a screen reader as it arrives — the answer is the
                 entire point of the screen, and it appears without the focus
                 moving anywhere. */
              aria-live="polite"
            >
              {turn.reply.kind === 'thinking' ? (
                <p role="status" className="flex items-center gap-2.5 text-body text-dim">
                  <span aria-hidden="true" className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-brand animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:300ms]" />
                  </span>
                  {t('msizi.thinking')}
                </p>
              ) : turn.reply.kind === 'miss' ? (
                <>
                  <h2 className="text-lead font-display font-bold text-ink mb-1.5">{t('msizi.missTitle')}</h2>
                  <p className="text-body text-dim leading-relaxed">{t('msizi.missBody')}</p>
                </>
              ) : (
                <>
                  {turn.reply.title && (
                    <h2 className="text-lead font-display font-bold text-ink mb-2.5">{turn.reply.title}</h2>
                  )}
                  <AnswerBody text={turn.reply.body} />
                  {turn.reply.kind === 'ai' && (
                    <p className="mt-3 text-micro text-faint leading-snug">{t('msizi.aiLabel')}</p>
                  )}
                </>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 empty:hidden">
                {speakSupported && turn.reply.kind !== 'miss' && turn.reply.kind !== 'thinking' && (
                  <button
                    onClick={() => {
                      if (speakingTurn === turn.id) { stopSpeaking(); setSpeakingTurn(null); }
                      else readAloud(turn);
                    }}
                    className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface-2 px-3.5 py-2
                      text-small font-bold text-ink hover:bg-surface transition active:scale-95"
                  >
                    <Icon name={speakingTurn === turn.id ? 'stop' : 'play'} size={16} />
                    {t(speakingTurn === turn.id ? 'msizi.stopSpeaking' : 'msizi.speak')}
                  </button>
                )}
                {turn.reply.goto && (
                  <button
                    onClick={() => navigate(turn.reply.goto!.screen)}
                    className="inline-flex items-center gap-2 rounded-pill border border-brand bg-brand-soft px-3.5 py-2
                      text-small font-bold text-brand hover:bg-surface-2 transition active:scale-95"
                  >
                    {t(turn.reply.goto.labelKey)}
                    <Icon name="chev" size={15} />
                  </button>
                )}
              </div>

              {turn.reply.kind !== 'thinking' && turn.reply.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-line-soft">
                  <h3 className="text-micro font-bold uppercase tracking-wide text-faint mb-2.5">
                    {t(turn.reply.kind === 'miss' ? 'msizi.tryAsking' : 'msizi.askNext')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {turn.reply.suggestions.map((id) => <AskChip key={id} id={id} onPick={pick} />)}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
        <div ref={bottomRef} />
      </div>

      {turns.length > 0 && (
        <button
          onClick={() => { stopSpeaking(); setSpeakingTurn(null); setTurns([]); }}
          className="self-start text-small font-bold text-dim hover:text-ink underline underline-offset-4"
        >
          {t('msizi.clear')}
        </button>
      )}

      {/* Composer. Sticky so the question box is reachable however long the
          answer above it runs. */}
      <div className={`sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3 pb-2 bg-canvas
        ${turns.length > 0 ? 'border-t border-line' : ''}`}>
        {voiceNote && (
          <p role="status" className="mb-2.5 rounded-2xl border border-line bg-surface-2 px-3.5 py-2.5 text-small text-ink leading-snug">
            {voiceNote}
          </p>
        )}
        {listening && (
          <p role="status" className="mb-2.5 flex items-center gap-2.5 text-small font-bold text-live">
            <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full bg-live-solid animate-pulse" />
            {/* The words themselves are in the question box below. */}
            {t('msizi.listening')}
          </p>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); submit(draft); }}
          className="flex items-end gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('msizi.placeholder')}
            aria-label={t('msizi.placeholder')}
            enterKeyHint="send"
            /* 16px minimum on a text field, or iOS zooms the viewport the
               moment it gains focus. */
            className="flex-1 min-w-0 h-12 rounded-2xl border border-line bg-surface px-3.5
              text-base text-ink placeholder:text-faint focus:outline-none focus:border-brand transition"
          />
          {listenSupported && (
            <button
              type="button"
              onClick={startListening}
              aria-label={t(listening ? 'msizi.stopListening' : 'msizi.listen')}
              aria-pressed={listening}
              className={`grid place-items-center w-12 h-12 shrink-0 rounded-2xl border transition active:scale-95
                ${listening
                  ? 'border-live bg-live-solid text-brand-on animate-pulse'
                  : 'border-line bg-surface text-ink hover:bg-surface-2'}`}
            >
              <Icon name={listening ? 'stop' : 'mic'} size={20} />
            </button>
          )}
          <Button type="submit" disabled={draft.trim() === ''} className="shrink-0">
            {t('msizi.send')}
          </Button>
        </form>
        <p className="mt-2 text-micro text-faint leading-snug">{t('msizi.notAi')}</p>
      </div>
    </div>
  );
}
