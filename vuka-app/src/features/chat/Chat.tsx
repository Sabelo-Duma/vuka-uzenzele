import { useEffect, useRef, useState } from 'react';
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
  const { state, navigate, loadThread, sendMessage, toast } = useApp();
  const me = state.user?.id;
  const [other, setOther] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // Load + poll the thread.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const t = await loadThread(id);
        if (cancelled) return;
        setOther(t.other);
        setMessages(t.messages);
      } catch {
        if (!cancelled) setNotFound(true);
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

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      const msg = await sendMessage(id, text);
      setMessages((prev) => [...(prev ?? []), msg]);
    } catch (e) {
      toast((e as Error).message);
      setDraft(text); // restore so the user doesn't lose it
    } finally {
      setSending(false);
    }
  };

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
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me;
            return (
              <div key={m.id} className={`max-w-[80%] ${mine ? 'self-end' : 'self-start'}`}>
                <div className={`px-3.5 py-2.5 text-[13.5px] leading-snug rounded-2xl ${mine ? 'bg-navy text-white dark:text-navy-deep rounded-br-md' : 'bg-surface-2 text-ink border border-line rounded-bl-md'}`}>
                  {m.body}
                </div>
                <div className={`text-[10.5px] text-subtle mt-1 ${mine ? 'text-right' : 'text-left'}`}>{timeShort(m.createdAt)}</div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 pt-3 border-t border-line">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder="Type a message…"
          aria-label="Message"
          className="flex-1 resize-none max-h-28 border-[1.5px] border-line-strong rounded-2xl px-4 py-2.5 text-sm bg-surface text-navy focus:outline-none focus:border-navy transition"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="grid place-items-center w-11 h-11 rounded-2xl bg-red text-white shrink-0 hover:bg-red-hover transition active:scale-95 disabled:opacity-40"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  );
}
