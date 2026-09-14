import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
// React's synthetic TouchEvent, deliberately shadowing the DOM global of the
// same name — these handlers receive the synthetic one.
import type { TouchEvent } from 'react';
import { useApp } from '../../store/appStore';
import { api, forgetAttachment, uploadAttachment } from '../../lib/api';
import type { Attachment, ChatUser, Conversation, Message } from '../../lib/api';
import { noteSeen, onChatEvent } from '../../lib/chatTransport';
import {
  discard, onOutboxChange, onOutboxSettled, pendingFor, queueMessage, retry,
} from '../../lib/outbox';
import type { Pending } from '../../lib/outbox';
import type { Recording } from '../../lib/voice';
import type { PreparedPhoto } from '../../lib/photo';
import { Avatar, Card, EmptyState, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Composer } from './Composer';
import { VoiceNote } from './VoiceNote';
import { PhotoLightbox, PhotoNote } from './PhotoNote';

function timeShort(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

/** Just the clock — used inside a thread, where the day is a separator above. */
function clockOnly(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

/** "Today", "Yesterday", or a date. What the separator between days says. */
function dayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    const thisYear = d.getFullYear() === today.getFullYear();
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', ...(thisYear ? {} : { year: 'numeric' }) });
  } catch { return ''; }
}

const sameDay = (a: string, b: string) => {
  try { return new Date(a).toDateString() === new Date(b).toDateString(); } catch { return false; }
};

const roleLabel = (r: ChatUser['role']) => (r === 'employer' ? 'Employer' : 'Worker');

/** Can this still be edited? Mirrors the server's window, which owns the rule. */
function withinEditWindow(m: Message, windowMinutes: number): boolean {
  if (m.deleted || m.kind !== 'text') return false;
  const age = (Date.now() - new Date(m.createdAt).getTime()) / 60_000;
  return age <= windowMinutes;
}

/* ---------------- rows ----------------

   A thread is not a list of messages. It is a list of messages plus the things
   that have been written but not yet accepted by the server, in one timeline,
   because to the person looking at it there is no difference — they said a
   thing and it is on the screen. Everything below works in rows for that
   reason. */
type Row =
  | { kind: 'sent'; at: string; message: Message }
  | { kind: 'pending'; at: string; pending: Pending };

/**
 * The ticks.
 *
 * One for accepted, two for reached-their-device, two in colour for read — the
 * vocabulary people already have. A clock for "still trying", which is the
 * state this app previously had no way to show at all, and an exclamation for
 * "it didn't go", which is the one that actually needs to be noticed.
 */
function Ticks({ state }: { state: 'queued' | 'failed' | 'sent' | 'delivered' | 'read' }) {
  if (state === 'queued') {
    return <span title="Sending" aria-label="Sending"><Icon name="clock" size={12} /></span>;
  }
  if (state === 'failed') {
    return <span className="text-danger" title="Not sent" aria-label="Not sent"><Icon name="alert" size={12} /></span>;
  }
  const label = state === 'read' ? 'Read' : state === 'delivered' ? 'Delivered' : 'Sent';
  return (
    <span className={state === 'read' ? 'text-info' : 'text-faint'} title={label} aria-label={label}>
      {state === 'sent' ? '✓' : '✓✓'}
    </span>
  );
}

/**
 * The actions on one message, as a bottom sheet.
 *
 * Reached by long-press on touch, right-click or the hover button on desktop —
 * see MessageBubble. A sheet rather than a popover anchored to the bubble
 * because a bubble near the bottom of the thread leaves a popover nowhere to go
 * once the keyboard is up.
 */
function MessageActions({ mine, canEdit, canCopy, onReply, onEdit, onDelete, onCopy, onClose }: {
  mine: boolean; canEdit: boolean; canCopy: boolean;
  onReply: () => void; onEdit: () => void; onDelete: () => void; onCopy: () => void; onClose: () => void;
}) {
  const item = 'w-full text-left px-4 py-3 text-body font-semibold hover:bg-surface-2 transition flex items-center gap-3';
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-label="Message actions">
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative w-full sm:w-[320px] bg-surface rounded-t-3xl sm:rounded-3xl border border-line shadow-e3 overflow-hidden animate-slideup pb-[max(8px,env(safe-area-inset-bottom))] sm:pb-0">
        <button className={`${item} text-ink`} onClick={onReply}><Icon name="reply" size={16} /> Reply</button>
        {canCopy && <button className={`${item} text-ink`} onClick={onCopy}><Icon name="copy" size={16} /> Copy text</button>}
        {mine && canEdit && <button className={`${item} text-ink`} onClick={onEdit}><Icon name="edit" size={16} /> Edit</button>}
        {mine && <button className={`${item} text-danger`} onClick={onDelete}><Icon name="trash" size={16} /> Delete for everyone</button>}
        <button className={`${item} text-dim border-t border-line`} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/** What a quoted message says when it has no words of its own. */
const quoteText = (kind: string, body: string, deleted: boolean) => {
  if (deleted) return 'Message deleted';
  if (body) return body;
  if (kind === 'voice') return '🎤 Voice note';
  if (kind === 'image') return '📷 Photo';
  return '';
};

/**
 * The little quoted block that sits above a reply's own text.
 *
 * Deliberately not interactive. The bubble around it owns the touch gestures,
 * and a tappable target inside would swallow the start of a long-press or a
 * reply-swipe on the exact part of the message people aim at.
 */
function QuotedBlock({ label, body, tone }: { label: string; body: string; tone: 'mine' | 'theirs' }) {
  return (
    <div
      className={`block w-full text-left rounded-xl px-2.5 py-1.5 mb-1.5 border-l-[3px] ${
        tone === 'mine' ? 'bg-[rgba(128,128,128,.28)] border-current' : 'bg-surface-2 border-line'
      }`}
    >
      <span className={`block text-micro font-bold uppercase tracking-wide ${tone === 'mine' ? 'opacity-80' : 'text-dim'}`}>{label}</span>
      <span className="block text-small truncate opacity-90">{body}</span>
    </div>
  );
}

/** Short haptic tick. Absent on iOS Safari and desktop — never assume it fired. */
function buzz(ms: number) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported; the visual cue carries it */ }
}

const LONG_PRESS_MS = 480;   // below ~400 a scroll starts triggering it
const MOVE_TOLERANCE_PX = 16; // drift allowed before a hold counts as a scroll
const SWIPE_TRIGGER_PX = 56; // far enough to be deliberate, short enough for a thumb
const SWIPE_MAX_PX = 88;

/**
 * One message, with the gestures people already have muscle memory for.
 *
 * Long-press opens the actions; swipe right replies. Plain tap does nothing on
 * purpose — it was the original design and it was wrong: tapping is also how you
 * select text and how a scroll that starts on a bubble begins, so the menu kept
 * appearing when nobody asked for it.
 *
 * Desktop gets right-click and a hover button instead, since there is no
 * long-press with a mouse, and the hover button is what makes the actions
 * reachable by keyboard at all.
 */
function MessageBubble({ m, mine, meId, otherFirstName, onMenu, onReply, onOpenPhoto }: {
  m: Message; mine: boolean; meId: string | undefined; otherFirstName: string;
  onMenu: () => void; onReply: () => void; onOpenPhoto: (url: string) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const start = useRef({ x: 0, y: 0 });
  const drag = useRef(0);
  const timer = useRef<number | null>(null);
  const longFired = useRef(false);
  const swiping = useRef(false);

  const clearTimer = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } };

  const onTouchStart = (e: TouchEvent) => {
    if (m.deleted) return;
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    drag.current = 0;
    longFired.current = false;
    swiping.current = false;
    clearTimer();
    timer.current = window.setTimeout(() => {
      longFired.current = true;
      buzz(12);
      onMenu();
    }, LONG_PRESS_MS);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (m.deleted) return;
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    /* Movement means this is a scroll or a swipe, not a press-and-hold — but a
       thumb resting still for half a second always drifts a few pixels, and at a
       10px budget that drift was cancelling legitimate long-presses. */
    if (Math.abs(dx) > MOVE_TOLERANCE_PX || Math.abs(dy) > MOVE_TOLERANCE_PX) clearTimer();
    // Only a mostly-horizontal, rightward drag counts as reply-swipe — otherwise
    // the thread would fight the user every time they scrolled it.
    if (!longFired.current && dx > 0 && Math.abs(dx) > Math.abs(dy)) {
      swiping.current = true;
      drag.current = Math.min(dx, SWIPE_MAX_PX);
      setDragX(drag.current);
    }
  };

  const onTouchCancel = () => {
    clearTimer();
    drag.current = 0;
    swiping.current = false;
    setDragX(0);
  };

  const onTouchEnd = () => {
    clearTimer();
    // The long-press already did its work; lifting off is not also a swipe.
    if (longFired.current) { drag.current = 0; swiping.current = false; setDragX(0); return; }
    if (swiping.current && drag.current >= SWIPE_TRIGGER_PX && !m.deleted) {
      buzz(8);
      onReply();
    }
    drag.current = 0;
    swiping.current = false;
    setDragX(0);
  };

  const armed = dragX >= SWIPE_TRIGGER_PX;

  if (m.deleted) {
    return (
      <div className={`px-3.5 py-2.5 text-small italic rounded-2xl border border-dashed border-line text-faint inline-flex items-center gap-1.5 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
        <Icon name="trash" size={12} /> This message was deleted
      </div>
    );
  }

  /* A voice note and a photo get less padding than a line of text: the content
     already has its own edges, and the usual bubble inset makes a waveform look
     like it is floating in a box rather than being the message. */
  const padding = m.kind === 'text' ? 'px-3.5 py-2.5' : 'px-2.5 py-2.5';

  return (
    <div className="relative group">
      {/* Slides out from under the bubble as it moves. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full transition-colors ${armed ? 'bg-brand-solid text-brand-on' : 'bg-surface-2 text-dim'}`}
        style={{ opacity: Math.min(1, dragX / SWIPE_TRIGGER_PX) }}
      >
        <Icon name="reply" size={15} />
      </span>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onContextMenu={(e) => { e.preventDefault(); onMenu(); }}
        /* -webkit-touch-callout is the whole reason long-press works on iOS.
           Left on, Safari claims the gesture for its own text-selection callout
           and fires touchcancel partway through — which looked exactly like the
           finger lifting, so the timer was cleared and the menu never opened.
           Swipe was unaffected because it finishes before Safari steps in.
           Selection is disabled with it, deliberately: long-press now selects
           the message rather than the text, which is what every chat app does,
           and "Copy text" in the menu is the replacement. */
        style={{ WebkitTouchCallout: 'none', transform: dragX ? `translateX(${dragX}px)` : undefined }}
        className={`relative ${padding} text-small leading-snug rounded-2xl select-none ${dragX ? '' : 'transition-transform'} ${
          mine ? 'bg-ink text-canvas rounded-br-md' : 'bg-surface-2 text-ink border border-line rounded-bl-md'
        }`}
      >
        {m.replyTo && (
          <QuotedBlock
            tone={mine ? 'mine' : 'theirs'}
            label={m.replyTo.senderId === meId ? 'You' : otherFirstName}
            body={quoteText(m.replyTo.kind, m.replyTo.body, m.replyTo.deleted)}
          />
        )}

        {m.kind === 'voice' && m.attachment
          ? <VoiceNote attachment={m.attachment} tone={mine ? 'mine' : 'theirs'} />
          : m.kind === 'image' && m.attachment
            ? <PhotoNote attachment={m.attachment} caption={m.body} onOpen={onOpenPhoto} />
            : <span className="whitespace-pre-wrap break-words">{m.body}</span>}
      </div>

      {/* Mouse and keyboard route to the same menu. Only shown where there's a
          real pointer — on a phone it would just sit on top of the text. */}
      <button
        type="button"
        onClick={onMenu}
        aria-label="Message actions"
        className={`hidden [@media(pointer:fine)]:grid place-items-center absolute top-1 w-7 h-7 rounded-full bg-surface border border-line text-dim opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition ${mine ? '-left-9' : '-right-9'}`}
      >
        <Icon name="chev" size={14} />
      </button>
    </div>
  );
}

/** A message written but not yet accepted: same shape, quieter, with a way out. */
function PendingBubble({ p, onRetry, onDiscard }: {
  p: Pending; onRetry: () => void; onDiscard: () => void;
}) {
  const label = p.kind === 'voice' ? '🎤 Voice note' : p.kind === 'image' ? (p.body || '📷 Photo') : p.body;
  return (
    <div>
      <div
        className={`px-3.5 py-2.5 text-small leading-snug rounded-2xl rounded-br-md bg-ink text-canvas ${p.failed ? '' : 'opacity-70'}`}
      >
        <span className="whitespace-pre-wrap break-words">{label}</span>
      </div>
      {p.failed && (
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className="text-micro text-danger">{p.error ?? "Couldn't send"}</span>
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 min-h-[32px] px-2 rounded-chip text-micro font-bold text-brand hover:bg-surface-2 transition">
            <Icon name="retry" size={12} /> Try again
          </button>
          <button type="button" onClick={onDiscard} className="inline-flex items-center min-h-[32px] px-2 rounded-chip text-micro font-bold text-dim hover:bg-surface-2 transition">
            Discard
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Inbox ---------------- */
export function Messages() {
  const { navigate, loadConversations } = useApp();
  const [convos, setConvos] = useState<Conversation[] | null>(null);

  const load = useCallback(() => {
    loadConversations().then(setConvos).catch(() => setConvos((prev) => prev ?? []));
  }, [loadConversations]);

  useEffect(() => { load(); }, [load]);

  /* The inbox is a summary of everything, so anything arriving anywhere changes
     it. Reloading the list is cheaper and far less error-prone than trying to
     fold one message into the right row by hand. */
  useEffect(() => onChatEvent((e) => { if (e.type === 'message' || e.type === 'message-changed') load(); }), [load]);

  return (
    <div className="max-w-[720px] mx-auto">
      <header className="mb-3">
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">Direct messages</small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">Chats<span className="text-brand">.</span></h1>
      </header>

      {convos === null ? (
        <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => (
          <Card key={i} className="p-3.5 flex gap-3.5 items-center">
            <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" />
            <div className="flex-1 flex flex-col gap-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
          </Card>
        ))}</div>
      ) : convos.length === 0 ? (
        <EmptyState icon="💬" title="No messages yet" hint="When you invite, apply or get hired, start a conversation here. Employers and workers chat directly to sort out the details — by text, voice note or photo." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {convos.map((c) => (
            <button key={c.user.id} onClick={() => navigate('chat', c.user.id)} className="text-left active:scale-[.99] transition-transform">
              <Card className="p-3.5 flex gap-3.5 items-center hover:bg-surface-2 transition-colors">
                <div className="relative shrink-0">
                  <Avatar initials={c.user.initials} />
                  {/* A green dot only ever means "their app is open right now" —
                      it is the live connection, not a guess from a timestamp. */}
                  {c.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-verified border-2 border-surface" title="Online now" aria-label="Online now" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <b className="text-body font-extrabold text-ink truncate tracking-tight">{c.user.name}</b>
                    <span className="text-micro font-bold uppercase tracking-wide text-faint shrink-0">{roleLabel(c.user.role)}</span>
                  </div>
                  <div className={`text-small truncate mt-0.5 flex items-center gap-1 ${c.unread ? 'text-ink font-semibold' : 'text-dim'}`}>
                    {c.lastFromMe && (
                      <span className="shrink-0"><Ticks state={c.lastRead ? 'read' : c.lastDelivered ? 'delivered' : 'sent'} /></span>
                    )}
                    <span className="truncate">{c.lastMessage}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-micro text-faint">{timeShort(c.lastAt)}</span>
                  {c.unread > 0 && <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-solid text-brand-on text-micro font-bold font-mono tnum">{c.unread}</span>}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Conversation thread ---------------- */

/** How near the bottom counts as "following the conversation". */
const STICK_PX = 120;
/** A typing signal is worth about this long before it becomes a lie. */
const TYPING_TTL_MS = 4000;
/** Don't tell the other side you're typing more often than this. */
const TYPING_PING_MS = 3000;

export function ChatThread({ id }: { id: string }) {
  const { state, goBack, toast, refreshUnread } = useApp();
  const me = state.user?.id;

  const [other, setOther] = useState<ChatUser | null>(null);
  const [online, setOnline] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState<Pending[]>(() => pendingFor(id));
  const [draft, setDraft] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [editWindow, setEditWindow] = useState(15);
  const [voiceMaxMs, setVoiceMaxMs] = useState(60_000);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const [typingUntil, setTypingUntil] = useState(0);
  const [typingNow, setTypingNow] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [newBelow, setNewBelow] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickRef = useRef(true);
  const lastTypingPing = useRef(0);
  const readUpTo = useRef('');

  /* Merge a message in rather than appending it. The same message can arrive
     from three directions — the reply to a POST, the live stream, and a
     catch-up sync — and all three are correct. Keyed by id, so the last one to
     arrive wins and none of them can produce a duplicate. */
  const mergeMessages = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const byId = new Map((prev ?? []).map((m) => [m.id, m]));
      for (const m of incoming) {
        if (m.senderId !== id && m.recipientId !== id) continue; // not this conversation
        byId.set(m.id, m);
        noteSeen(m.createdAt);
      }
      return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, [id]);

  // ---- first page ----
  useEffect(() => {
    let cancelled = false;
    setMessages(null);
    setNotFound(false);
    (async () => {
      try {
        const t = await api.getThread(id);
        if (cancelled) return;
        setOther(t.other);
        setOnline(t.online);
        setHasMore(t.hasMore);
        setEditWindow(t.editWindowMinutes ?? 15);
        setVoiceMaxMs(t.voiceMaxMs ?? 60_000);
        setMessages(t.messages);
        for (const m of t.messages) noteSeen(m.createdAt);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ---- live updates ----
  useEffect(() => onChatEvent((e) => {
    if (e.type === 'message' || e.type === 'message-changed') {
      const m = e.message;
      if (m.senderId !== id && m.recipientId !== id) return;
      if (e.type === 'message-changed' && m.deleted && m.attachment == null) {
        /* The clip is gone on the server, so the copy this device is holding
           has to go too — otherwise a withdrawn voice note keeps playing for
           anyone who had already loaded it. */
        forgetAttachment(m.id);
      }
      mergeMessages([m]);
    }
    if (e.type === 'receipt' && e.by === id) {
      const ids = new Set(e.ids);
      setMessages((prev) => (prev ?? []).map((m) => (ids.has(m.id)
        ? { ...m, delivered: true, read: e.state === 'read' ? true : m.read }
        : m)));
    }
    if (e.type === 'typing' && e.from === id) setTypingUntil(Date.now() + TYPING_TTL_MS);
    if (e.type === 'status') { if (!e.live) setOnline(false); }
  }), [id, mergeMessages]);

  /* "…is typing" has to expire on its own. The signal says someone was typing
     four seconds ago, and nothing ever arrives to say they stopped. */
  useEffect(() => {
    if (typingUntil <= Date.now()) { setTypingNow(false); return; }
    setTypingNow(true);
    const t = window.setTimeout(() => setTypingNow(false), typingUntil - Date.now());
    return () => clearTimeout(t);
  }, [typingUntil]);

  // ---- the outbox, in the same timeline ----
  useEffect(() => {
    setPending(pendingFor(id));
    return onOutboxChange(() => setPending(pendingFor(id)));
  }, [id]);

  useEffect(() => onOutboxSettled((_clientId, sent) => mergeMessages([sent])), [mergeMessages]);

  // ---- read receipts ----
  /* Sent when there is something unread from them AND this screen is actually
     in front of someone. Tying it to the fetch instead — which is what this
     used to do — told people their message had been read by an app syncing in
     a pocket. */
  useEffect(() => {
    if (!messages || !me) return;
    const theirs = messages.filter((m) => m.senderId === id);
    const newest = theirs[theirs.length - 1];
    if (!newest || newest.createdAt <= readUpTo.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    readUpTo.current = newest.createdAt;
    api.markRead(id, newest.createdAt)
      .then(() => refreshUnread())
      .catch(() => { readUpTo.current = ''; /* try again on the next change */ });
  }, [messages, id, me, refreshUnread]);

  // ---- scrolling ----
  const rows: Row[] = useMemo(() => {
    const sent: Row[] = (messages ?? []).map((m) => ({ kind: 'sent' as const, at: m.createdAt, message: m }));
    /* A queued message whose clientId has come back from the server is no
       longer pending — it is that message. Without this check both would show
       for the instant between the reply landing and the queue being written. */
    const seen = new Set((messages ?? []).map((m) => m.clientId).filter(Boolean));
    const queued: Row[] = pending
      .filter((p) => !seen.has(p.clientId))
      .map((p) => ({ kind: 'pending' as const, at: p.createdAt, pending: p }));
    return [...sent, ...queued].sort((a, b) => a.at.localeCompare(b.at));
  }, [messages, pending]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_PX;
    stickRef.current = atBottom;
    if (atBottom) setNewBelow(false);
  };

  const jumpToLatest = useCallback(() => {
    stickRef.current = true;
    setNewBelow(false);
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, []);

  const lastRowKey = rows.length ? `${rows[rows.length - 1].kind}:${rows[rows.length - 1].at}` : '';
  useEffect(() => {
    if (!lastRowKey) return;
    /* Follow the conversation only if the reader was already at the bottom.
       Yanking someone back down while they are reading history is the single
       most disliked thing a chat window can do; the pill below is the answer
       for everyone else. */
    if (stickRef.current) endRef.current?.scrollIntoView({ block: 'end' });
    else setNewBelow(true);
  }, [lastRowKey]);

  // ---- older history ----
  const loadOlder = async () => {
    const first = messages?.[0];
    if (!first || loadingMore) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const before = el ? el.scrollHeight - el.scrollTop : 0;
    try {
      const older = await api.getThread(id, { before: first.createdAt });
      mergeMessages(older.messages);
      setHasMore(older.hasMore);
      /* Keep the reader where they were. Adding content above changes
         scrollHeight, and without this the thread jumps by exactly the height
         of the page that was just inserted. */
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - before;
      });
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  // ---- composing ----
  const pingTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingPing.current < TYPING_PING_MS) return;
    lastTypingPing.current = now;
    void api.sendTyping(id).catch(() => { /* a signal nobody misses */ });
  }, [id]);

  const cancelComposing = () => { setReplyingTo(null); setEditingId(null); setDraft(''); };

  const replyContext = () => (replyingTo
    ? { id: replyingTo.id, body: quoteText(replyingTo.kind, replyingTo.body, replyingTo.deleted), senderId: replyingTo.senderId }
    : null);

  const sendText = async () => {
    const text = draft.trim();
    if (!text) return;

    if (editingId) {
      const target = editingId;
      setDraft('');
      setEditingId(null);
      try {
        mergeMessages([await api.editMessage(target, text)]);
      } catch (e) {
        toast((e as Error).message);
        setDraft(text);
        setEditingId(target);
      }
      return;
    }

    /* Queued, not sent. It is on the screen before the network is involved,
       and it stays there — through a dead signal, a locked phone, a closed
       app — until the server has actually accepted it. */
    queueMessage({ toUserId: id, body: text, kind: 'text', replyTo: replyContext() });
    setDraft('');
    setReplyingTo(null);
    stickRef.current = true;
  };

  /** Upload first, then queue. The bytes are the part that can't be retried cheaply. */
  const sendAttachment = async (blob: Blob, opts: Parameters<typeof uploadAttachment>[1], body: string) => {
    setUploading(0);
    try {
      const attachment: Attachment = await uploadAttachment(blob, { ...opts, onProgress: setUploading });
      queueMessage({ toUserId: id, body, attachment, replyTo: replyContext() });
      setReplyingTo(null);
      stickRef.current = true;
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const sendVoice = (recording: Recording) => {
    void sendAttachment(recording.blob, {
      kind: 'voice',
      durationMs: recording.durationMs,
      waveform: recording.waveform,
    }, '');
  };

  const sendPhoto = (photo: PreparedPhoto, caption: string) => {
    void sendAttachment(photo.blob, { kind: 'image', width: photo.width, height: photo.height }, caption);
  };

  // ---- message actions ----
  const startReply = useCallback((m: Message) => {
    setMenuFor(null);
    setReplyingTo(m);
    setEditingId(null);
    inputRef.current?.focus();
  }, []);

  const startEdit = useCallback((m: Message) => {
    setMenuFor(null);
    setEditingId(m.id);
    setReplyingTo(null);
    setDraft(m.body);
    inputRef.current?.focus();
  }, []);

  const removeMessage = useCallback(async (m: Message) => {
    setMenuFor(null);
    try {
      const updated = await api.deleteMessage(m.id);
      if (m.attachment) forgetAttachment(m.attachment.id);
      mergeMessages([updated]);
      // If they were mid-edit or mid-reply on this very message, those are now
      // pointing at something that no longer says anything.
      setEditingId((cur) => (cur === m.id ? null : cur));
      setReplyingTo((cur) => (cur?.id === m.id ? null : cur));
    } catch (e) {
      toast((e as Error).message);
    }
  }, [mergeMessages, toast]);

  const copyText = useCallback(async (m: Message) => {
    setMenuFor(null);
    try {
      await navigator.clipboard.writeText(m.body);
      toast('Copied');
    } catch {
      toast("Your browser wouldn't allow copying.");
    }
  }, [toast]);

  if (notFound) {
    return <div className="max-w-[720px] mx-auto"><EmptyState icon="🔍" title="Conversation unavailable" hint="This person is no longer on Vuka." /></div>;
  }

  const otherFirstName = other?.name?.split(' ')[0] ?? 'them';

  return (
    <div className="max-w-[720px] mx-auto flex flex-col" style={{ minHeight: 'min(72vh, 640px)' }}>
      {/* Header. Sticky, because it holds the only way out of a long thread and
          you were otherwise scrolling to the top of the conversation to find
          it. Swiping from the left edge works too — see useEdgeSwipeBack. */}
      <div className="sticky top-0 z-20 flex items-center gap-3 py-3 border-b border-line mb-3 bg-canvas">
        <button onClick={() => goBack('messages')} aria-label="Back to chats" className="grid place-items-center w-11 h-11 rounded-chip border border-line bg-surface text-ink hover:bg-surface-2 transition active:scale-95 shrink-0">
          <Icon name="back" size={20} />
        </button>
        {other ? (
          <>
            <div className="relative shrink-0">
              <Avatar initials={other.initials} size="sm" />
              {online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-verified border-2 border-canvas" aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <b className="block text-body font-extrabold text-ink truncate tracking-tight">{other.name}</b>
              <span className="text-micro text-dim font-semibold uppercase tracking-wide" aria-live="polite">
                {typingNow ? 'typing…' : online ? 'Online' : roleLabel(other.role)}
              </span>
            </div>
          </>
        ) : <Skeleton className="h-6 w-40" />}
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 overflow-y-auto scroll-area flex flex-col gap-2 pb-2">
        {messages === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="h-10 w-1/2 rounded-2xl self-end" />
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1 grid place-items-center text-center py-8">
            <div>
              <div className="text-hero mb-2" aria-hidden="true">👋</div>
              <p className="text-dim text-small">Say hello and sort out the details — start, pay, and where to meet.</p>
              {/* Gestures are invisible by definition, so say them once, here,
                  where there is nothing else competing for the space. */}
              <p className="text-faint text-small mt-2">Tap the mic to record · swipe a message to reply · hold it for more</p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingMore}
                className="self-center min-h-[44px] px-4 rounded-pill border border-line bg-surface text-small font-bold text-dim hover:text-ink hover:bg-surface-2 transition disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load earlier messages'}
              </button>
            )}

            {rows.map((row, i) => {
              const prev = rows[i - 1];
              const showDay = !prev || !sameDay(prev.at, row.at);

              if (row.kind === 'pending') {
                return (
                  <Fragment key={`p-${row.pending.clientId}`}>
                    {showDay && <DaySeparator at={row.at} />}
                    <div className="max-w-[80%] self-end">
                    <PendingBubble
                      p={row.pending}
                      onRetry={() => retry(row.pending.clientId)}
                      onDiscard={() => discard(row.pending.clientId)}
                    />
                    <div className="flex items-center gap-1 text-micro text-faint mt-1 justify-end">
                      <span>{clockOnly(row.at)}</span>
                      <Ticks state={row.pending.failed ? 'failed' : 'queued'} />
                    </div>
                    </div>
                  </Fragment>
                );
              }

              const m = row.message;
              const mine = m.senderId === me;
              return (
                <Fragment key={m.id}>
                  {showDay && <DaySeparator at={row.at} />}
                  <div id={`msg-${m.id}`} className={`max-w-[80%] scroll-mt-4 ${mine ? 'self-end' : 'self-start'}`}>
                  <MessageBubble
                    m={m}
                    mine={mine}
                    meId={me}
                    otherFirstName={otherFirstName}
                    onMenu={() => setMenuFor(m)}
                    onReply={() => startReply(m)}
                    onOpenPhoto={setLightbox}
                  />
                  <div className={`flex items-center gap-1 text-micro text-faint mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                    <span>{clockOnly(m.createdAt)}</span>
                    {m.editedAt && !m.deleted && <span>· edited</span>}
                    {/* Delivery state only means something on your own messages. */}
                    {mine && !m.deleted && <Ticks state={m.read ? 'read' : m.delivered ? 'delivered' : 'sent'} />}
                  </div>
                  </div>
                </Fragment>
              );
            })}
          </>
        )}
        <div ref={endRef} />
      </div>

      {newBelow && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="sticky bottom-2 self-center z-10 inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-pill bg-ink text-canvas text-small font-bold shadow-e2 transition active:scale-95"
        >
          New messages <Icon name="chev" size={14} className="rotate-90" />
        </button>
      )}

      {uploading !== null && (
        <div className="mt-2" aria-live="polite">
          <div className="flex items-center gap-2 text-micro text-dim">
            <span className="block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Sending… <span className="font-mono tnum">{Math.round(uploading * 100)}%</span>
          </div>
          <div className="h-1 mt-1 rounded-pill bg-surface-3 overflow-hidden">
            <div className="h-full bg-brand-solid transition-[width]" style={{ width: `${Math.round(uploading * 100)}%` }} />
          </div>
        </div>
      )}

      {/* What you're about to do, shown before you do it. */}
      {(replyingTo || editingId) && (
        <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-xl bg-surface-2 border border-line">
          <span className="text-ink mt-0.5 shrink-0"><Icon name={editingId ? 'edit' : 'reply'} size={14} /></span>
          <div className="flex-1 min-w-0">
            <span className="block text-micro font-bold uppercase tracking-wide text-dim">
              {editingId ? 'Editing your message' : `Replying to ${replyingTo?.senderId === me ? 'yourself' : otherFirstName}`}
            </span>
            <span className="block text-small text-ink truncate">
              {editingId ? draft : quoteText(replyingTo?.kind ?? 'text', replyingTo?.body ?? '', false)}
            </span>
          </div>
          <button onClick={cancelComposing} aria-label="Cancel" className="shrink-0 text-dim hover:text-ink transition p-1">
            <Icon name="x" size={15} />
          </button>
        </div>
      )}

      <Composer
        mode={editingId ? 'edit' : 'new'}
        draft={draft}
        onDraftChange={setDraft}
        voiceMaxMs={voiceMaxMs}
        onSendText={sendText}
        onSendVoice={sendVoice}
        onSendPhoto={sendPhoto}
        onTyping={pingTyping}
        onCancelCompose={cancelComposing}
        inputRef={inputRef}
      />

      {menuFor && (
        <MessageActions
          mine={menuFor.senderId === me}
          canEdit={withinEditWindow(menuFor, editWindow)}
          canCopy={menuFor.kind === 'text' || !!menuFor.body}
          onReply={() => startReply(menuFor)}
          onEdit={() => startEdit(menuFor)}
          onDelete={() => removeMessage(menuFor)}
          onCopy={() => copyText(menuFor)}
          onClose={() => setMenuFor(null)}
        />
      )}

      {lightbox && <PhotoLightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/** The date, once, between the last message of one day and the first of the next. */
function DaySeparator({ at }: { at: string }) {
  return (
    <div className="flex items-center gap-3 my-3 w-full self-stretch shrink-0">
      <span className="flex-1 h-px bg-line" aria-hidden="true" />
      <span className="text-micro font-bold uppercase tracking-wide text-faint">{dayLabel(at)}</span>
      <span className="flex-1 h-px bg-line" aria-hidden="true" />
    </div>
  );
}
