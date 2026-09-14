/* ============================================================
   The outbox — messages that have been written but not yet accepted.

   The old composer awaited the POST and, if it failed, put the text back in
   the box and showed a toast. That is a reasonable thing to do at a desk. It
   is the wrong thing to do on a phone in a lift, which is where a good half of
   this app's messages are written: the send fails, the user is already walking,
   and the reply that was agreed to never existed.

   So a message is queued first and sent second. It appears in the thread
   immediately with a clock on it, it survives the app being closed, and it is
   retried when the network comes back — and because every entry carries the
   clientId it was minted with, a retry can never post it twice. That last part
   is what makes any of this safe; see the unique index on the server.

   What is deliberately NOT here: the bytes of a voice note or a photo. Those
   are uploaded before the message is queued, so an entry is only ever a few
   hundred characters and localStorage stays a place to keep a queue rather
   than a place to keep audio.
   ============================================================ */
import { api, ApiError } from './api';
import type { Attachment, Message, MessageKind } from './api';

const KEY = 'vuka-outbox';
/** Give up after this many tries and let the person decide. */
const MAX_ATTEMPTS = 6;

export interface Pending {
  clientId: string;
  toUserId: string;
  body: string;
  kind: MessageKind;
  replyToId: string | null;
  /** Quoted text for the reply preview, so a pending reply still looks like one. */
  replyToBody: string | null;
  replyToSenderId: string | null;
  /** When it was written — what the bubble is ordered and timestamped by. */
  createdAt: string;
  /** Already uploaded; only the message referring to it is outstanding. */
  attachment: Attachment | null;
  attempts: number;
  /** Stopped trying. Shows a retry button rather than a spinner. */
  failed: boolean;
  /** Why it stopped, in words meant for the person who wrote it. */
  error: string | null;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let queue: Pending[] = load();
let flushing = false;
let timer: number | null = null;

function load(): Pending[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Pending[]) : [];
  } catch {
    /* Storage can be unavailable (private mode) or hold something from an
       older version. Either way an unreadable queue is an empty one — never a
       crash on the way into the app. */
    return [];
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(queue)); } catch { /* nothing we can do; the queue still works for this session */ }
  for (const fn of [...listeners]) { try { fn(); } catch { /* ignore */ } }
}

/** Told whenever the queue changes, so a thread can redraw its pending bubbles. */
export function onOutboxChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Everything still waiting to reach one person, oldest first. */
export const pendingFor = (userId: string): Pending[] =>
  queue.filter((p) => p.toUserId === userId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/** How many messages are waiting, anywhere. */
export const pendingCount = () => queue.length;

/** A new id for a message about to be written. */
export const newClientId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch { /* not available over plain http, or in an old browser */ }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/** What happened to a queued message once the server had its say. */
type Settled = (clientId: string, message: Message) => void;
const settledListeners = new Set<Settled>();
export function onOutboxSettled(fn: Settled): () => void {
  settledListeners.add(fn);
  return () => { settledListeners.delete(fn); };
}

export interface QueueInput {
  toUserId: string;
  body: string;
  kind?: MessageKind;
  replyTo?: { id: string; body: string; senderId: string } | null;
  attachment?: Attachment | null;
}

/** Put a message in the queue and start trying. Returns its clientId. */
export function queueMessage(input: QueueInput): string {
  const clientId = newClientId();
  queue = [...queue, {
    clientId,
    toUserId: input.toUserId,
    body: input.body,
    kind: input.kind ?? (input.attachment ? input.attachment.kind : 'text'),
    replyToId: input.replyTo?.id ?? null,
    replyToBody: input.replyTo?.body ?? null,
    replyToSenderId: input.replyTo?.senderId ?? null,
    createdAt: new Date().toISOString(),
    attachment: input.attachment ?? null,
    attempts: 0,
    failed: false,
    error: null,
  }];
  save();
  void flushOutbox();
  return clientId;
}

/** Take one out — used by "try again" when the answer is to give up instead. */
export function discard(clientId: string) {
  queue = queue.filter((p) => p.clientId !== clientId);
  save();
}

/** Try a failed message again, right now. */
export function retry(clientId: string) {
  queue = queue.map((p) => (p.clientId === clientId ? { ...p, failed: false, error: null, attempts: 0 } : p));
  save();
  void flushOutbox();
}

/**
 * Work through the queue, oldest first, one at a time.
 *
 * In order and serially on purpose: messages in a conversation are a sequence,
 * and sending three at once over a bad connection is how they arrive shuffled.
 */
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    for (const item of [...queue].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
      if (item.failed) continue;
      if (!queue.some((p) => p.clientId === item.clientId)) continue; // discarded mid-flush

      try {
        const sent = await api.sendMessage(item.toUserId, item.body, {
          replyToId: item.replyToId,
          clientId: item.clientId,
          attachmentId: item.attachment?.id ?? null,
        });
        queue = queue.filter((p) => p.clientId !== item.clientId);
        save();
        for (const fn of [...settledListeners]) { try { fn(item.clientId, sent); } catch { /* ignore */ } }
      } catch (e) {
        const err = e as ApiError;
        /* Two different failures wearing the same face. A 4xx means the server
           understood and said no — the recording is gone, the person is gone,
           the reply points nowhere — and trying again will produce the same no.
           Anything else is the network, which is worth another go. */
        const permanent = err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429;
        const attempts = item.attempts + 1;
        queue = queue.map((p) => (p.clientId === item.clientId
          ? { ...p, attempts, failed: permanent || attempts >= MAX_ATTEMPTS, error: err.message ?? null }
          : p));
        save();
        // A network failure will hit the next message too; stop wasting the battery.
        if (!permanent) break;
      }
    }
  } finally {
    flushing = false;
  }
}

/**
 * Keep trying in the background.
 *
 * Started when a user signs in. The interval is a backstop — the real triggers
 * are coming back online and coming back to the app, both of which are the
 * moment a queued message becomes sendable again.
 */
export function startOutbox() {
  if (timer !== null) return;
  void flushOutbox();
  timer = window.setInterval(() => { if (queue.length) void flushOutbox(); }, 15_000);
  window.addEventListener('online', flushOutbox);
  document.addEventListener('visibilitychange', onVisible);
}

function onVisible() { if (!document.hidden && queue.length) void flushOutbox(); }

export function stopOutbox() {
  if (timer !== null) { clearInterval(timer); timer = null; }
  window.removeEventListener('online', flushOutbox);
  document.removeEventListener('visibilitychange', onVisible);
}

/** Sign-out: this queue belongs to the account that is leaving. */
export function clearOutbox() {
  queue = [];
  save();
}
