/* ============================================================
   Msizi — the screen.

   Redesigned 2026-09-25 after "I am not a fan… it's missing that attractive,
   eye-catching thing". Three ideas carry it:

   1. **Msizi is a presence, not a page.** The orb (components/MsiziOrb) is
      the same sphere as the floating button that opened this screen, and it
      shows what Msizi is doing — breathing, listening, thinking, or swelling
      with her voice as she speaks. Before anything is asked it sits large in
      the screen's one feature band, with a personal greeting and a single
      big "Tap to talk"; once a conversation starts the band folds down to a
      compact header carrying the same orb and a live status line.

   2. **Voice is a conversation, not a walkie-talkie.** Reported from a phone:
      "it should greet back and keep listening so I can ask more questions".
      Tapping talk starts a conversation: Msizi listens, answers out loud,
      then listens again by herself, until the person taps stop or goes quiet.
      The microphone is off while she speaks, so she never hears herself.

   3. **A chat, set for reading.** The person's words sit right in a solid
      bubble; Msizi's answers sit left beside the small orb, in a card roomy
      enough for eight lines about how payment works. Follow-ups are chips,
      because choosing is easier than composing when you are unsure.

   Design-system rules still hold: amber is the one primary action (talk /
   send — only one shows at a time), vermilion appears only while the
   microphone is genuinely open, one feature band.
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
  Listener, canListen, canSpeak, onSpeechLevel, onVoicesChanged, pickVoice, primeSpeech, setNeuralVoice,
  speak, stopSpeaking, voicesReady, type ListenError,
} from '../../lib/speech';
import { langMeta } from '../../i18n';
import { Icon } from '../../components/Icon';
import { MsiziOrb, type OrbState } from '../../components/MsiziOrb';

/** One exchange. The question as asked, and what came back. */
interface Turn {
  id: number;
  question: string;
  reply: MsiziReply;
  /** Asked out loud, so the answer should be read out loud too. */
  spoken: boolean;
}

/** How long to wait after Msizi stops speaking before listening again. */
const RELISTEN_MS = 350;

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
        <p key={i} className="text-body text-ink leading-relaxed m-0">{b.items[0]}</p>
      ) : (
        <ul key={i} className="flex flex-col gap-1.5 pl-0 m-0 list-none">
          {b.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-body text-ink leading-relaxed">
              <span aria-hidden="true" className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-brand-solid shrink-0" />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      )))}
    </div>
  );
}

/** A question offered as a tappable chip. */
function AskChip({ id, onPick, onFeature = false }: { id: string; onPick: (id: string) => void; onFeature?: boolean }) {
  const entry = lookup(id);
  if (!entry) return null;
  return (
    <button
      onClick={() => onPick(id)}
      /* 44px minimum, set explicitly rather than left to the padding. These
         chips sit in a wrapped row where several land within a thumb's width
         of each other, which is exactly where an under-sized target gets you
         the answer next to the one you wanted. */
      className={`inline-flex items-center gap-2 text-left min-h-[44px] rounded-pill px-4 py-2 text-small font-semibold
        transition active:scale-95
        ${onFeature
          ? 'bg-white/10 text-on-feature border border-white/15 hover:bg-white/15'
          : 'bg-surface text-ink border border-line hover:border-brand hover:bg-surface-2'}`}
    >
      <span aria-hidden="true" className={onFeature ? 'text-on-feature-accent' : 'text-brand'}>✦</span>
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
  /** A voice conversation is running: Msizi listens again after answering. */
  const [convo, setConvo] = useState(false);
  const convoRef = useRef(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [speakingTurn, setSpeakingTurn] = useState<number | null>(null);
  /** False until the browser has published its voice list. */
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  /** Bumped whenever that list changes, to force the capability re-read. */
  const [voiceTick, setVoiceTick] = useState(0);

  const listenerRef = useRef<Listener | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);
  const orbRef = useRef<HTMLSpanElement | null>(null);
  const relistenTimer = useRef<number | null>(null);
  /** Set below; lets the reply path restart listening without a hook cycle. */
  const listenRef = useRef<(retry?: number) => void>(() => {});

  const setConversation = useCallback((on: boolean) => {
    convoRef.current = on;
    setConvo(on);
    if (!on && relistenTimer.current !== null) {
      window.clearTimeout(relistenTimer.current);
      relistenTimer.current = null;
    }
  }, []);

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
     at first paint — and Chromium can publish them later than voicesReady is
     willing to wait. So: read it when the list first settles, and again every
     time it changes. */
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
    convoRef.current = false;
    if (relistenTimer.current !== null) window.clearTimeout(relistenTimer.current);
    listenerRef.current?.cancel();
    stopSpeaking();
  }, []);

  /* The natural voice for English answers (vuka-server/src/voice.mjs). Only
     while signed in — the route needs a session — and the phone's own voice
     covers everything it cannot. */
  useEffect(() => {
    if (!state.user) return undefined;
    setNeuralVoice((text) => api.assistantVoice(text));
    return () => setNeuralVoice(null);
  }, [state.user]);

  /* The orb swells with her voice. Written straight onto the element, once a
     frame, so a talking Msizi does not re-render the whole conversation. */
  useEffect(() => onSpeechLevel((level) => {
    orbRef.current?.style.setProperty('--level', level.toFixed(3));
  }), []);

  const speechCoverage = useMemo(
    () => (voicesLoaded ? pickVoice(lang).coverage : 'native'),
    /* voiceTick is the signal that the list under pickVoice has changed. */
    [voicesLoaded, lang, voiceTick],
  );

  const scrollToEnd = useCallback(() => {
    window.requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  }, []);

  /** After an answer: in a conversation, listen again. */
  const afterReply = useCallback(() => {
    if (!convoRef.current) return;
    if (relistenTimer.current !== null) window.clearTimeout(relistenTimer.current);
    relistenTimer.current = window.setTimeout(() => {
      relistenTimer.current = null;
      if (convoRef.current) listenRef.current();
    }, RELISTEN_MS);
  }, []);

  const readAloud = useCallback((turn: Turn, onDone?: () => void) => {
    const r = turn.reply;
    if (r.kind === 'thinking') return;
    if (!canSpeak() && !r.body) { onDone?.(); return; }
    /* The title first, then the answer: heard rather than seen, the heading
       is what tells you Msizi understood before the detail starts. Newlines
       are kept — speak() uses them as sentence boundaries, which is what gives
       the voice a cadence instead of one flat run-on. */
    const text = r.kind === 'miss'
      ? `${t('msizi.missTitle')}.\n${t('msizi.missBody')}`
      : r.title ? `${r.title}.\n${r.body}` : r.body;
    setSpeakingTurn(turn.id);
    /* The language of the TEXT picks the voice: written answers are English
       whatever the app is set to; small talk, AI answers and the refusal come
       back in the app's language. A live answer is the person's own record,
       so it is read on the phone, never by a voice that sends it away. */
    const textLang = r.kind === 'chat' || r.kind === 'ai' || r.kind === 'miss' ? lang : 'en';
    speak(text, textLang, () => {
      setSpeakingTurn((cur) => (cur === turn.id ? null : cur));
      onDone?.();
    }, { localOnly: r.kind === 'live' });
  }, [lang, t]);

  const put = useCallback((question: string, reply: MsiziReply, spoken: boolean): Turn => {
    const turn: Turn = { id: nextId.current++, question, reply, spoken };
    setTurns((prev) => [...prev, turn]);
    setVoiceNote(null);
    scrollToEnd();
    /* Asked out loud, answered out loud. Typed questions are not read back:
       somebody on a taxi with the volume up did not ask for that. */
    if (spoken && reply.kind !== 'thinking') readAloud(turn, afterReply);
    return turn;
  }, [readAloud, scrollToEnd, afterReply]);

  /** Swap a "thinking" turn for what came back, and read it if it was spoken. */
  const settleTurn = useCallback((turn: Turn, reply: MsiziReply) => {
    const next = { ...turn, reply };
    setTurns((prev) => prev.map((x) => (x.id === turn.id ? next : x)));
    scrollToEnd();
    if (turn.spoken) readAloud(next, afterReply);
  }, [readAloud, scrollToEnd, afterReply]);

  /* The conversation so far, for the model fallback's follow-ups. */
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  const firstName = (state.user?.name ?? '').trim().split(/\s+/)[0] ?? '';

  const submit = useCallback((question: string, spoken = false) => {
    const q = question.trim();
    if (!q) return;
    stopSpeaking();
    setDraft('');
    /* Typing ends a voice conversation — the person has switched modes. */
    if (!spoken) setConversation(false);

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
  }, [ctx, put, settleTurn, lang, firstName, setConversation]);

  const pick = useCallback((id: string) => {
    const entry = lookup(id);
    const reply = askById(id, ctx);
    if (!entry || !reply) return;
    stopSpeaking();
    setConversation(false);
    put(entry.ask, reply, false);
  }, [ctx, put, setConversation]);

  /* ---- listening ---- */

  const voiceMessage = useCallback((err: ListenError): string => {
    switch (err) {
      case 'denied': return t('msizi.voiceDenied');
      case 'no-speech': return t('msizi.voiceNoSpeech');
      case 'no-language': return t('msizi.voiceNoLanguage', { language: langMeta(lang).label });
      case 'network': return t('msizi.voiceNetwork');
      case 'busy': return t('msizi.voiceBusy');
      default: return t('msizi.voiceFailed');
    }
  }, [t, lang]);

  /** One listening turn. Used for the first tap and for every re-listen. */
  const listen = useCallback((retry = 0) => {
    if (listenerRef.current) return;
    setVoiceNote(null);
    /* The words appear in the question box as they are recognised, the same
       box typing uses, so the person sees exactly what was heard. */
    const prefix = draft.trim() ? `${draft.trim()} ` : '';
    let failed: ListenError | null = null;
    const listener = new Listener(lang, {
      onPartial: (text) => { setDraft(prefix + text); },
      onFinal: (text) => submit(prefix + text, true),
      onError: (err) => { failed = err; setDraft(prefix.trim()); },
      onEnd: () => {
        setListening(false);
        listenerRef.current = null;
        if (!failed) return;
        /* A microphone still held by the audio that just played: try once
           more, a moment later, before bothering the person with it. */
        if (failed === 'busy' && retry < 1 && convoRef.current) {
          relistenTimer.current = window.setTimeout(() => listenRef.current(retry + 1), 600);
          return;
        }
        /* Going quiet in a conversation is how it ends — said gently, not as
           an error. Anything else is explained, and the conversation stops. */
        const wasConvo = convoRef.current;
        setConversation(false);
        setVoiceNote(failed === 'no-speech' && wasConvo ? t('msizi.convoEnded') : voiceMessage(failed));
      },
    });
    listenerRef.current = listener;
    if (listener.start()) setListening(true);
    else { listenerRef.current = null; setConversation(false); }
  }, [draft, lang, submit, voiceMessage, setConversation, t]);

  listenRef.current = (retry = 0) => listen(retry);

  /** The big button: start a conversation, interrupt Msizi, or stop. */
  const onTalk = useCallback(() => {
    /* Synchronously, inside this tap: the only moment iOS lets speech (and the
       natural voice's audio) be unlocked for what follows. */
    primeSpeech();
    if (listening) {
      /* Stop: deliver what was heard, and end the conversation. */
      setConversation(false);
      listenerRef.current?.stop();
      return;
    }
    if (convo && speakingTurn === null) {
      setConversation(false);
      return;
    }
    /* Tapping while she talks is a barge-in: she stops, and listens. */
    stopSpeaking();
    setSpeakingTurn(null);
    setConversation(true);
    listen(0);
  }, [listening, convo, speakingTurn, listen, setConversation]);

  /* ---- what this device can actually do ---- */

  const listenSupported = canListen();
  /* Having the API is not the same as being able to use it: a browser can
     expose speechSynthesis and ship no voices. */
  const speakSupported = canSpeak() && speechCoverage !== 'none';

  const capabilityNote = !listenSupported
    ? t('msizi.voiceUnsupported')
    : !speakSupported
      ? t('msizi.speakUnsupported')
      /* Only worth saying to somebody whose language it actually is. */
      : speechCoverage === 'fallback' && lang !== 'en'
        ? t('msizi.speakFallback', { language: langMeta(lang).label })
        : null;

  const thinking = turns.some((x) => x.reply.kind === 'thinking');
  const orbState: OrbState = listening ? 'listening'
    : speakingTurn !== null ? 'speaking'
      : thinking ? 'thinking' : 'idle';
  const status = listening ? t('msizi.listening')
    : speakingTurn !== null ? t('msizi.speaking')
      : thinking ? t('msizi.thinking')
        : convo ? t('msizi.convoOn') : null;

  const empty = turns.length === 0;
  const greeting = firstName ? t('msizi.hello', { name: firstName }) : t('msizi.helloAnon');
  /* While she is talking in a conversation, the button interrupts her and
     listens — so it offers to talk, not to stop. */
  const bargeIn = convo && speakingTurn !== null && !listening;
  const stopMode = listening || (convo && !bargeIn);
  const talkLabel = stopMode ? t('msizi.stopListening') : t('msizi.talk');

  return (
    <div className="flex flex-col gap-4 min-h-full">
      {/* ---- The one feature band: Msizi herself ---- */}
      <header
        /* Folded, it stays pinned at the top: the orb and its status line are
           how you know whether she is listening, thinking or talking, and a
           long answer must not scroll that out of sight. */
        className={`feature-band msizi-glow overflow-hidden rounded-[28px] transition-all duration-300
          ${empty ? 'relative px-5 pt-9 pb-7 sm:px-8' : 'sticky top-0 z-20 px-4 py-3.5 shadow-e2'}`}
      >
        {empty ? (
          <div className="relative flex flex-col items-center text-center">
            <MsiziOrb ref={orbRef} size={128} state={orbState} />
            {/* The heading is always "Msizi", in both layouts — the greeting is
                the large line, but the page is named for who you are talking to. */}
            <h1 className="mt-6 mb-1 text-micro font-bold uppercase tracking-[0.18em] text-on-feature-accent">{t('msizi.name')}</h1>
            <p className="m-0 font-display text-head font-extrabold text-on-feature tracking-tight leading-tight">{greeting}</p>
            <p className="mt-2 mb-0 max-w-sm text-body text-on-feature-dim leading-relaxed">{t('msizi.intro')}</p>

            {listenSupported && (
              <button
                onClick={onTalk}
                aria-pressed={stopMode}
                className={`mt-6 inline-flex items-center justify-center gap-2.5 min-h-[56px] px-7 rounded-pill
                  text-lead font-extrabold transition active:scale-95 shadow-e2
                  ${listening ? 'bg-live-solid text-brand-on' : 'bg-brand-solid text-brand-on hover:brightness-105'}`}
              >
                <Icon name={stopMode ? 'stop' : 'mic'} size={22} />
                {talkLabel}
              </button>
            )}
            <p role="status" aria-live="polite" className="min-h-[1.5em] mt-3 mb-0 text-small font-semibold text-on-feature-dim">
              {status}
            </p>
          </div>
        ) : (
          <div className="relative flex items-center gap-3">
            <MsiziOrb ref={orbRef} size={46} state={orbState} />
            <div className="flex-1 min-w-0">
              <h1 className="m-0 font-display text-lead font-extrabold text-on-feature leading-tight">{t('msizi.name')}</h1>
              <p role="status" aria-live="polite" className="m-0 text-small text-on-feature-dim truncate">
                {status ?? t('msizi.tagline')}
              </p>
            </div>
            <button
              onClick={() => { stopSpeaking(); setSpeakingTurn(null); setConversation(false); listenerRef.current?.cancel(); setTurns([]); }}
              className="shrink-0 min-h-[44px] px-3.5 rounded-pill text-small font-bold text-on-feature border border-white/20 hover:bg-white/10 transition"
            >
              {t('msizi.clear')}
            </button>
          </div>
        )}
      </header>

      {/* What this handset can and cannot do, said plainly. */}
      {capabilityNote && (
        <p className="m-0 flex gap-2.5 rounded-2xl border border-line bg-info-soft px-3.5 py-3 text-small text-ink leading-snug">
          <span aria-hidden="true" className="shrink-0">ℹ️</span>
          <span>{capabilityNote}</span>
        </p>
      )}

      {/* Opening suggestions. */}
      {empty && (
        <section aria-label={t('msizi.tryAsking')}>
          <h2 className="text-micro font-bold uppercase tracking-wide text-faint mb-2.5">{t('msizi.tryAsking')}</h2>
          <div className="flex flex-wrap gap-2">
            {openers(state.role).map((id) => <AskChip key={id} id={id} onPick={pick} />)}
          </div>
          {/* What is sent where, said once, up front — not squeezed under the
              question box on every screen of the conversation. */}
          <p className="mt-4 mb-0 text-micro text-faint leading-snug">{t('msizi.notAi')}</p>
        </section>
      )}

      {/* ---- The conversation ---- */}
      <div className="flex flex-col gap-4">
        {turns.map((turn) => (
          <article key={turn.id} className="flex flex-col gap-2.5">
            <p className="self-end max-w-[85%] m-0 rounded-[22px] rounded-br-md bg-ink px-4 py-2.5 text-body font-semibold text-canvas leading-snug">
              <span className="sr-only">{t('msizi.you')}: </span>
              {turn.spoken && <span aria-hidden="true" className="mr-1.5 opacity-70"><Icon name="mic" size={13} /></span>}
              {turn.question}
            </p>

            <div className="flex gap-2.5 items-start max-w-full">
              <MsiziOrb size={30} state={speakingTurn === turn.id ? 'speaking' : turn.reply.kind === 'thinking' ? 'thinking' : 'idle'} className="mt-1" />
              <div
                className="flex-1 min-w-0 rounded-[22px] rounded-tl-md border border-line bg-surface px-4 py-3.5 shadow-e1"
                /* Announced as it arrives — the answer is the point of the
                   screen, and it appears without focus moving anywhere. */
                aria-live="polite"
              >
                {turn.reply.kind === 'thinking' ? (
                  <p role="status" className="m-0 flex items-center gap-2.5 text-body text-dim">
                    <span aria-hidden="true" className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-brand-solid animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-brand-solid animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-brand-solid animate-bounce [animation-delay:300ms]" />
                    </span>
                    {t('msizi.thinking')}
                  </p>
                ) : turn.reply.kind === 'miss' ? (
                  <>
                    <h2 className="m-0 mb-1.5 text-lead font-display font-bold text-ink">{t('msizi.missTitle')}</h2>
                    <p className="m-0 text-body text-dim leading-relaxed">{t('msizi.missBody')}</p>
                  </>
                ) : (
                  <>
                    {turn.reply.title && (
                      <h2 className="m-0 mb-2 text-lead font-display font-bold text-ink leading-snug">{turn.reply.title}</h2>
                    )}
                    <AnswerBody text={turn.reply.body} />
                    {turn.reply.kind === 'ai' && (
                      <p className="mt-3 mb-0 text-micro text-faint leading-snug">✦ {t('msizi.aiLabel')}</p>
                    )}
                  </>
                )}

                {turn.reply.kind !== 'thinking' && (speakSupported || turn.reply.goto) && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    {speakSupported && turn.reply.kind !== 'miss' && (
                      <button
                        onClick={() => {
                          if (speakingTurn === turn.id) { stopSpeaking(); setSpeakingTurn(null); }
                          else { primeSpeech(); readAloud(turn); }
                        }}
                        className="inline-flex items-center gap-2 min-h-[40px] rounded-pill border border-line bg-surface-2 px-3.5
                          text-small font-bold text-ink hover:bg-surface transition active:scale-95"
                      >
                        <Icon name={speakingTurn === turn.id ? 'stop' : 'play'} size={15} />
                        {t(speakingTurn === turn.id ? 'msizi.stopSpeaking' : 'msizi.speak')}
                      </button>
                    )}
                    {turn.reply.goto && (
                      <button
                        onClick={() => navigate(turn.reply.goto!.screen)}
                        className="inline-flex items-center gap-1.5 min-h-[40px] rounded-pill border border-brand bg-brand-soft px-3.5
                          text-small font-bold text-brand hover:bg-surface-2 transition active:scale-95"
                      >
                        {t(turn.reply.goto.labelKey)}
                        <Icon name="chev" size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {turn.reply.kind !== 'thinking' && turn.reply.suggestions.length > 0 && (
              <div className="pl-10">
                <h3 className="text-micro font-bold uppercase tracking-wide text-faint mb-2">
                  {t(turn.reply.kind === 'miss' ? 'msizi.tryAsking' : 'msizi.askNext')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {turn.reply.suggestions.map((id) => <AskChip key={id} id={id} onPick={pick} />)}
                </div>
              </div>
            )}
          </article>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ---- Composer. Sticky so the question box is always reachable. ---- */}
      <div className="sticky bottom-0 mt-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3 pb-2 bg-canvas">
        {voiceNote && (
          <p role="status" className="m-0 mb-2.5 flex gap-2 items-start rounded-2xl border border-line bg-surface-2 px-3.5 py-2.5 text-small text-ink leading-snug">
            <Icon name="alert" size={16} />
            <span>{voiceNote}</span>
          </p>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); submit(draft); }}
          className={`flex items-center gap-2 rounded-pill border bg-surface pl-4 pr-1.5 py-1.5 shadow-e1 transition
            ${listening ? 'border-live ring-2 ring-live-soft' : 'border-line focus-within:border-brand'}`}
        >
          {listening && <span aria-hidden="true" className="pulse-dot shrink-0" />}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={listening ? t('msizi.listening') : t('msizi.placeholder')}
            aria-label={t('msizi.placeholder')}
            enterKeyHint="send"
            /* 16px minimum on a text field, or iOS zooms the viewport the
               moment it gains focus. */
            className="flex-1 min-w-0 h-11 bg-transparent text-base text-ink placeholder:text-faint focus:outline-none"
          />
          {/* One primary action at a time: send when there are words and the
              microphone is closed, otherwise talk. */}
          {draft.trim() !== '' && !listening ? (
            <button
              type="submit"
              aria-label={t('msizi.send')}
              className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-brand-solid text-brand-on transition active:scale-95 hover:brightness-105"
            >
              <Icon name="send" size={19} />
            </button>
          ) : listenSupported ? (
            <button
              type="button"
              onClick={onTalk}
              aria-label={stopMode ? t('msizi.stopListening') : bargeIn ? t('msizi.talk') : t('msizi.listen')}
              aria-pressed={stopMode}
              className={`grid place-items-center w-11 h-11 shrink-0 rounded-full transition active:scale-95
                ${listening ? 'bg-live-solid text-brand-on' : 'bg-brand-solid text-brand-on hover:brightness-105'}`}
            >
              <Icon name={stopMode ? 'stop' : 'mic'} size={19} />
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
