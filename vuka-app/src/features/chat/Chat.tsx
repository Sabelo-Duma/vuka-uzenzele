import { useCallback, useEffect, useRef, useState } from 'react';
// React's synthetic TouchEvent, deliberately shadowing the DOM global of the
// same name — these handlers receive the synthetic one.
import type { TouchEvent } from 'react';
import { useApp } from '../../store/appStore';
import type { Conversation, Message, ChatUser } from '../../lib/api';
import { Avatar, Card, EmptyState, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';

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

const roleLabel = (r: ChatUser['role']) => (r === 'employer' ? 'Employer' : 'Worker');

/** Can this still be edited? Mirrors the server's window, which owns the rule. */
function withinEditWindow(m: Message, windowMinutes: number): boolean {
  if (m.deleted) return false;
  const age = (Date.now() - new Date(m.createdAt).getTime()) / 60_000;
  return age <= windowMinutes;
}

/**
 * The actions on one message, as a bottom sheet.
 *
 * Reached by long-press on touch, right-click or the hover button on desktop —
 * see MessageBubble. A sheet rather than a popover anchored to the bubble
 * because a bubble near the bottom of the thread leaves a popover nowhere to go
 * once the keyboard is up.
 */
function MessageActions({ mine, canEdit, onReply, onEdit, onDelete, onCopy, onClose }: {
  mine: boolean; canEdit: boolean;
  onReply: () => void; onEdit: () => void; onDelete: () => void; onCopy: () => void; onClose: () => void;
}) {
  const item = 'w-full text-left px-4 py-3 text-[14px] font-semibold hover:bg-surface-2 transition flex items-center gap-3';
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-label="Message actions">
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative w-full sm:w-[320px] bg-surface rounded-t-3xl sm:rounded-3xl border border-line shadow-e3 overflow-hidden animate-slideup pb-[max(8px,env(safe-area-inset-bottom))] sm:pb-0">
        <button className={`${item} text-navy`} onClick={onReply}><Icon name="reply" size={16} /> Reply</button>
        <button className={`${item} text-navy`} onClick={onCopy}><Icon name="copy" size={16} /> Copy text</button>
        {mine && canEdit && <button className={`${item} text-navy`} onClick={onEdit}><Icon name="edit" size={16} /> Edit</button>}
        {mine && <button className={`${item} text-red`} onClick={onDelete}><Icon name="trash" size={16} /> Delete for everyone</button>}
        <button className={`${item} text-muted border-t border-line`} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/**
 * The little quoted block that sits above a reply's own text.
 *
 * Deliberately not interactive. The bubble around it owns the touch gestures,
 * and a tappable target inside would swallow the start of a long-press or a
 * reply-swipe on the exact part of the message people aim at.
 */
function QuotedBlock({ label, body, deleted, tone }: {
  label: string; body: string; deleted: boolean; tone: 'mine' | 'theirs';
}) {
  return (
    <div
      className={`block w-full text-left rounded-xl px-2.5 py-1.5 mb-1.5 border-l-[3px] ${
        tone === 'mine' ? 'bg-white/15 border-white/60 dark:bg-navy-deep/10' : 'bg-navy/5 border-navy/40'
      }`}
    >
      <span className={`block text-[10.5px] font-bold uppercase tracking-wide ${tone === 'mine' ? 'opacity-80' : 'text-navy/70'}`}>{label}</span>
      <span className={`block text-[12px] truncate ${deleted ? 'italic opacity-60' : 'opacity-90'}`}>
        {deleted ? 'Message deleted' : body}
      </span>
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
function MessageBubble({ m, mine, meId, otherFirstName, onMenu, onReply }: {
  m: Message; mine: boolean; meId: string | undefined; otherFirstName: string;
  onMenu: () => void; onReply: () => void;
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
      <div className={`px-3.5 py-2.5 text-[13px] italic rounded-2xl border border-dashed border-line text-subtle inline-flex items-center gap-1.5 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
        <Icon name="trash" size={12} /> This message was deleted
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Slides out from under the bubble as it moves. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full transition-colors ${armed ? 'bg-red text-white' : 'bg-surface-2 text-muted'}`}
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
        className={`relative px-3.5 py-2.5 text-[13.5px] leading-snug rounded-2xl select-none ${dragX ? '' : 'transition-transform'} ${
          mine ? 'bg-navy text-white dark:text-navy-deep rounded-br-md' : 'bg-surface-2 text-ink border border-line rounded-bl-md'
        }`}
      >
        {m.replyTo && (
          <QuotedBlock
            tone={mine ? 'mine' : 'theirs'}
            label={m.replyTo.senderId === meId ? 'You' : otherFirstName}
            body={m.replyTo.body}
            deleted={m.replyTo.deleted}
          />
        )}
        <span className="whitespace-pre-wrap break-words">{m.body}</span>
      </div>

      {/* Mouse and keyboard route to the same menu. Only shown where there's a
          real pointer — on a phone it would just sit on top of the text. */}
      <button
        type="button"
        onClick={onMenu}
        aria-label="Message actions"
        className={`hidden [@media(pointer:fine)]:grid place-items-center absolute top-1 w-7 h-7 rounded-full bg-surface border border-line text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition ${mine ? '-left-9' : '-right-9'}`}
      >
        <Icon name="chev" size={14} />
      </button>
    </div>
  );
}

/* ---------------- Inbox ---------------- */
export function Messages() {
  const { navigate, loadConversations } = useApp();
  const [convos, setConvos] = useState<Conversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadConversations().then((c) => { if (!cancelled) setConvos(c); }).catch(() => { if (!cancelled) setConvos([]); });
    return () => { cancelled = true; };
  }, [loadConversations]);

  return (
    <div className="max-w-[720px] mx-auto">
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Direct messages</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Chats<span className="text-red">.</span></h2>
      </header>

      {convos === null ? (
        <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => (
          <Card key={i} className="p-3.5 flex gap-3.5 items-center">
            <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" />
            <div className="flex-1 flex flex-col gap-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
          </Card>
        ))}</div>
      ) : convos.length === 0 ? (
        <EmptyState icon="💬" title="No messages yet" hint="When you invite, apply or get hired, start a conversation here. Employers and workers chat directly to sort out the details." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {convos.map((c) => (
            <button key={c.user.id} onClick={() => navigate('chat', c.user.id)} className="text-left active:scale-[.99] transition-transform">
              <Card className="p-3.5 flex gap-3.5 items-center hover:bg-surface-2 transition-colors">
                <Avatar initials={c.user.initials} color={c.user.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <b className="text-[15px] font-extrabold text-navy truncate tracking-tight">{c.user.name}</b>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-subtle shrink-0">{roleLabel(c.user.role)}</span>
                  </div>
                  <div className={`text-[12.5px] truncate mt-0.5 ${c.unread ? 'text-navy font-semibold' : 'text-muted'}`}>
                    {c.lastFromMe && <span className="text-subtle">You: </span>}{c.lastMessage}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] text-subtle">{timeShort(c.lastAt)}</span>
                  {c.unread > 0 && <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-red text-white text-[11px] font-bold tnum">{c.unread}</span>}
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
export function ChatThread({ id }: { id: string }) {
  const { state, navigate, loadThread, sendMessage, editMessage, deleteMessage, toast } = useApp();
  const me = state.user?.id;
  const [other, setOther] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // The server owns the edit window; this is just what it told us.
  const [editWindow, setEditWindow] = useState(15);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<Message | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(0);
  const loadedRef = useRef(false);

  // Load + poll the thread.
  useEffect(() => {
    let cancelled = false;
    loadedRef.current = false;
    const load = async () => {
      try {
        const t = await loadThread(id);
        if (cancelled) return;
        loadedRef.current = true;
        setOther(t.other);
        setMessages(t.messages);
        setEditWindow(t.editWindowMinutes ?? 15);
        setNotFound(false);
      } catch {
        // Only "not found" if we never loaded it. A failed poll AFTER a good
        // load is transient (server blip / offline) — keep the thread on screen.
        if (!cancelled && !loadedRef.current) setNotFound(true);
      }
    };
    load();
    const iv = setInterval(load, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [id, loadThread]);

  // Auto-scroll to the newest message when the count grows.
  useEffect(() => {
    if (messages && messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      endRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  /* One submit path for both a new message and an edit — the composer is the
     same box either way, so the difference lives here rather than in the UI. */
  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const wasEditing = editingId;
    const wasReplyingTo = replyingTo;
    setSending(true);
    setDraft('');
    setReplyingTo(null);
    setEditingId(null);
    try {
      if (wasEditing) {
        const updated = await editMessage(wasEditing, text);
        setMessages((prev) => (prev ?? []).map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const msg = await sendMessage(id, text, wasReplyingTo?.id ?? null);
        setMessages((prev) => [...(prev ?? []), msg]);
      }
    } catch (e) {
      toast((e as Error).message);
      // Put the user back exactly where they were — losing a typed message
      // because the network blinked is its own small betrayal.
      setDraft(text);
      setEditingId(wasEditing);
      setReplyingTo(wasReplyingTo);
    } finally {
      setSending(false);
    }
  };

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
      const updated = await deleteMessage(m.id);
      setMessages((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      // If they were mid-edit or mid-reply on this very message, those are now
      // pointing at something that no longer says anything.
      setEditingId((cur) => (cur === m.id ? null : cur));
      setReplyingTo((cur) => (cur?.id === m.id ? null : cur));
    } catch (e) {
      toast((e as Error).message);
    }
  }, [deleteMessage, toast]);

  const copyText = useCallback(async (m: Message) => {
    setMenuFor(null);
    try {
      await navigator.clipboard.writeText(m.body);
      toast('Copied');
    } catch {
      toast("Your browser wouldn't allow copying.");
    }
  }, [toast]);

  const cancelComposing = () => { setReplyingTo(null); setEditingId(null); setDraft(''); };

  if (notFound) {
    return <div className="max-w-[720px] mx-auto"><EmptyState icon="🔍" title="Conversation unavailable" hint="This person is no longer on Vuka." /></div>;
  }

  return (
    <div className="max-w-[720px] mx-auto flex flex-col" style={{ minHeight: 'min(72vh, 640px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-line mb-3">
        <button onClick={() => navigate('messages')} aria-label="Back to chats" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy hover:bg-surface-2 transition active:scale-95 shrink-0">
          <Icon name="back" size={20} />
        </button>
        {other ? (
          <>
            <Avatar initials={other.initials} color={other.color} size="sm" />
            <div className="min-w-0">
              <b className="block text-[15px] font-extrabold text-navy truncate tracking-tight">{other.name}</b>
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wide">{roleLabel(other.role)}</span>
            </div>
          </>
        ) : <Skeleton className="h-6 w-40" />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-area flex flex-col gap-2 pb-2">
        {messages === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="h-10 w-1/2 rounded-2xl self-end" />
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 grid place-items-center text-center py-8">
            <div>
              <div className="text-4xl mb-2" aria-hidden="true">👋</div>
              <p className="text-muted text-[13.5px]">Say hello and sort out the details — start, pay, and where to meet.</p>
              {/* Gestures are invisible by definition, so say them once, here,
                  where there is nothing else competing for the space. */}
              <p className="text-subtle text-[12px] mt-2">Swipe a message to reply · hold it for more</p>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me;
            return (
              <div key={m.id} id={`msg-${m.id}`} className={`max-w-[80%] scroll-mt-4 ${mine ? 'self-end' : 'self-start'}`}>
                <MessageBubble
                  m={m}
                  mine={mine}
                  meId={me}
                  otherFirstName={other?.name?.split(' ')[0] ?? 'Them'}
                  onMenu={() => setMenuFor(m)}
                  onReply={() => startReply(m)}
                />
                <div className={`flex items-center gap-1 text-[10.5px] text-subtle mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                  <span>{timeShort(m.createdAt)}</span>
                  {m.editedAt && !m.deleted && <span>· edited</span>}
                  {/* Read state only means something on your own messages. */}
                  {mine && !m.deleted && (
                    <span className={m.read ? 'text-info' : 'text-subtle'} title={m.read ? 'Read' : 'Sent'} aria-label={m.read ? 'Read' : 'Sent'}>
                      {m.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer. The textarea is text-base (16px) deliberately: below that,
          iOS zooms the viewport every time the field is focused — which in a
          chat means on every single reply. */}
      <div className="pt-3 border-t border-line">
        {/* What you're about to do, shown before you do it. */}
        {(replyingTo || editingId) && (
          <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-xl bg-surface-2 border border-line">
            <span className="text-navy mt-0.5 shrink-0"><Icon name={editingId ? 'edit' : 'reply'} size={14} /></span>
            <div className="flex-1 min-w-0">
              <span className="block text-[10.5px] font-bold uppercase tracking-wide text-muted">
                {editingId ? 'Editing your message' : `Replying to ${replyingTo?.senderId === me ? 'yourself' : other?.name?.split(' ')[0] ?? 'them'}`}
              </span>
              <span className="block text-[12.5px] text-ink truncate">{editingId ? draft : replyingTo?.body}</span>
            </div>
            <button onClick={cancelComposing} aria-label="Cancel" className="shrink-0 text-muted hover:text-navy transition p-1">
              <Icon name="x" size={15} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              if (e.key === 'Escape') cancelComposing();
            }}
            rows={1}
            placeholder={editingId ? 'Edit your message…' : 'Type a message…'}
            aria-label={editingId ? 'Edit message' : 'Message'}
            className="flex-1 resize-none max-h-28 border-[1.5px] border-line-strong rounded-2xl px-4 py-2.5 text-base bg-surface text-navy focus:outline-none focus:border-navy transition"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label={editingId ? 'Save edit' : 'Send message'}
            className="grid place-items-center w-11 h-11 rounded-2xl bg-red text-white shrink-0 hover:bg-red-hover transition active:scale-95 disabled:opacity-40"
          >
            <Icon name={editingId ? 'check' : 'send'} size={18} />
          </button>
        </div>
      </div>

      {menuFor && (
        <MessageActions
          mine={menuFor.senderId === me}
          canEdit={withinEditWindow(menuFor, editWindow)}
          onReply={() => startReply(menuFor)}
          onEdit={() => startEdit(menuFor)}
          onDelete={() => removeMessage(menuFor)}
          onCopy={() => copyText(menuFor)}
          onClose={() => setMenuFor(null)}
        />
      )}
    </div>
  );
}
