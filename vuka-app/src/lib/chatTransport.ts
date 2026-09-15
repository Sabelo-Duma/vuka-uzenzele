/* ============================================================
   One live connection for the whole app.

   Before this, being up to date meant re-downloading every message in the open
   thread every four seconds, and asking for the unread count every thirty.
   On a hundred-message conversation that is several megabytes an hour to learn
   that nothing has changed — paid for, on this platform, by people buying data
   in twenty-rand bundles.

   So: one server-sent-events stream per signed-in device, carrying new
   messages, receipts and typing signals as they happen. Everything that reads
   chat subscribes here instead of polling for itself.

   Three things it has to survive, all of them normal:

     · the stream dropping — phones change towers, and Render replaces the free
       instance on every deploy. Reconnects with backoff, using a fresh ticket
       each time, because a ticket is only good for a minute.
     · the stream never connecting at all — a proxy that buffers, a network
       that blocks it. Falls back to asking for changes on a timer, which is
       still far cheaper than what it replaces because it asks for the delta.
     · missing an event anyway. A quiet catch-up sync runs even when the stream
       looks healthy, because "I am connected" is not the same as "I received
       everything", and a chat that silently loses a message is worse than one
       that is briefly slow.
   ============================================================ */
import { api, eventStreamUrl, getToken, reportDeparture } from './api';
import type { Message } from './api';

export type ChatEvent =
  | { type: 'message'; message: Message }
  | { type: 'message-changed'; message: Message }
  | { type: 'receipt'; state: 'delivered' | 'read'; by: string; at: string; ids: string[] }
  | { type: 'typing'; from: string }
  /** The connection itself changed state — used to show "reconnecting". */
  | { type: 'status'; live: boolean }
  /** Authoritative unread total, from a catch-up sync. */
  | { type: 'unread'; count: number }
  /** Someone in a conversation with you arrived or went away. */
  | { type: 'presence'; userId: string; online: boolean };

type Listener = (e: ChatEvent) => void;

const listeners = new Set<Listener>();

/** Everything at or after this has been seen. */
let cursor = '';
let source: EventSource | null = null;
let live = false;
let started = false;
let attempt = 0;
let reconnectTimer: number | null = null;
let syncTimer: number | null = null;
let syncing = false;

/* How often to ask for changes on a timer. The first number is the safety net
   behind a healthy stream; the second is the whole mechanism when there is no
   stream at all. Both slow right down when the app is in the background, where
   nobody is looking and the push notification is what actually matters. */
const SYNC_WHEN_LIVE_MS = 60_000;
const SYNC_WHEN_POLLING_MS = 6_000;
const SYNC_WHEN_HIDDEN_MS = 60_000;

/** Backoff between reconnection attempts: 2s, 4s, 8s, 16s, 30s, 30s… */
const backoffMs = () => Math.min(30_000, 2_000 * 2 ** Math.min(attempt, 4));

function emit(e: ChatEvent) {
  for (const fn of [...listeners]) {
    try { fn(e); } catch { /* one broken listener must not stop the rest */ }
  }
}

function setLive(next: boolean) {
  if (live === next) return;
  live = next;
  emit({ type: 'status', live });
  scheduleSync();
}

/** Subscribe to everything happening in chat. Returns an unsubscribe. */
export function onChatEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Is the live stream up right now? */
export const isLive = () => live;

/**
 * Note that a message has been seen, so the next catch-up starts from here.
 *
 * Called by the screens as well as by this module: opening a thread pulls in
 * messages the stream may never have carried, and the cursor has to move with
 * them or the next sync re-fetches them all.
 */
export function noteSeen(createdAt: string | undefined | null) {
  if (createdAt && createdAt > cursor) cursor = createdAt;
}

async function catchUp() {
  if (syncing || !getToken()) return;
  syncing = true;
  try {
    const res = await api.syncMessages(cursor || new Date().toISOString());
    for (const m of res.messages) {
      noteSeen(m.createdAt);
      emit({ type: 'message', message: m });
    }
    emit({ type: 'unread', count: res.unread });
    /* Move the cursor to the server's clock, not ours. Phone clocks are wrong
       often enough — and wrong by minutes, not milliseconds — that trusting
       this device's idea of "now" would either skip messages or re-fetch the
       same ones forever. */
    if (res.now > cursor) cursor = res.now;
  } catch { /* offline, or a blip — the next tick tries again */ } finally {
    syncing = false;
  }
}

function scheduleSync() {
  if (syncTimer !== null) { clearInterval(syncTimer); syncTimer = null; }
  if (!started) return;
  const hidden = typeof document !== 'undefined' && document.hidden;
  const every = hidden ? SYNC_WHEN_HIDDEN_MS : live ? SYNC_WHEN_LIVE_MS : SYNC_WHEN_POLLING_MS;
  syncTimer = window.setInterval(() => { void catchUp(); }, every);
}

function scheduleReconnect() {
  if (!started || reconnectTimer !== null) return;
  const wait = backoffMs();
  attempt++;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    void connect();
  }, wait);
}

async function connect() {
  if (!started || source || !getToken()) return;
  if (typeof EventSource === 'undefined') {
    // No stream available at all — the timer is the whole mechanism.
    setLive(false);
    return;
  }

  let ticket: string;
  try {
    ticket = (await api.eventTicket()).ticket;
  } catch {
    setLive(false);
    scheduleReconnect();
    return;
  }
  if (!started) return;

  /* Say on the way in whether anyone is looking. The app rebuilds this stream
     when it wakes, and a reconnection from a background tab must not be read
     as the person coming back. */
  const es = new EventSource(eventStreamUrl(ticket, typeof document !== 'undefined' && document.hidden));
  source = es;

  es.addEventListener('ready', () => {
    attempt = 0;
    setLive(true);
    /* Anything that happened while the connection was down was missed by
       definition, so the first thing a fresh stream does is ask what it
       missed. */
    void catchUp();
  });

  const parsed = <T>(e: MessageEvent): T | null => {
    try { return JSON.parse(e.data) as T; } catch { return null; }
  };

  es.addEventListener('message', (e) => {
    const m = parsed<Message>(e as MessageEvent);
    if (!m) return;
    noteSeen(m.createdAt);
    emit({ type: 'message', message: m });
  });
  es.addEventListener('message-changed', (e) => {
    const m = parsed<Message>(e as MessageEvent);
    if (m) emit({ type: 'message-changed', message: m });
  });
  es.addEventListener('receipt', (e) => {
    const r = parsed<{ state: 'delivered' | 'read'; by: string; at: string; ids: string[] }>(e as MessageEvent);
    if (r) emit({ type: 'receipt', ...r });
  });
  es.addEventListener('presence', (e) => {
    try {
      const d = JSON.parse((e as MessageEvent).data);
      emit({ type: 'presence', userId: String(d.userId), online: !!d.online });
    } catch { /* a malformed frame must not take the stream down */ }
  });
  es.addEventListener('typing', (e) => {
    const t = parsed<{ from: string }>(e as MessageEvent);
    if (t) emit({ type: 'typing', from: t.from });
  });

  es.onerror = () => {
    /* EventSource reconnects on its own, but it would reuse a ticket that is
       good for sixty seconds — so every reconnection after the first minute
       would be a silent 401 and the stream would never come back. Take it down
       and rebuild it properly instead. */
    es.close();
    if (source === es) source = null;
    setLive(false);
    scheduleReconnect();
  };
}

/* The server cannot see a backgrounded tab: the stream stays open, so without
   being told it goes on counting the person as present. That is what made the
   other side keep showing Online long after someone had left, and it also
   suppressed their push notification, because the send path read an open
   socket as "they are already looking". */
let reportedVisible: boolean | null = null;

function reportVisibility(visible: boolean) {
  /* Only on a change. visibilitychange can fire repeatedly for the same state
     as a phone wakes and settles, and every one of those is a request on
     somebody's data bundle to say what the server already knows. */
  if (reportedVisible === visible) return;
  reportedVisible = visible;
  void api.setPresence(visible).catch(() => {
    /* Let the next change through: this one never landed. */
    if (reportedVisible === visible) reportedVisible = null;
    /* Presence is not worth a retry queue. The next visibility change, the
       next catch-up sync, or the stream closing will all correct it. */
  });
}

function onVisibility() {
  scheduleSync();
  reportVisibility(!document.hidden);
  if (!document.hidden) {
    /* Coming back to the app is the moment being out of date is most obvious,
       so catch up straight away rather than on the next tick — and if the
       stream died while the phone was asleep, rebuild it now. */
    void catchUp();
    if (!source) { attempt = 0; void connect(); }
  }
}

function onOnline() {
  attempt = 0;
  void catchUp();
  if (!source) void connect();
}

/** Start listening. Called once the app has a signed-in user. */
export function startChatTransport() {
  if (started) return;
  started = true;
  cursor = new Date().toISOString();
  attempt = 0;
  reportedVisible = null;
  scheduleSync();
  void connect();
  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
}

/**
 * The app is closing, or being put away.
 *
 * Closing the stream sends the FIN immediately, and the server reads that as
 * gone the moment it lands — which is both faster and more reliable than any
 * request issued from a page that is already unloading. pagehide rather than
 * beforeunload or unload: it is the one that fires on iOS, where the others
 * routinely do not.
 */
function onPageHide() {
  /* Say it explicitly, then drop the stream. Either alone is not enough: the
     request can be cancelled, and the close can be swallowed by a proxy that
     holds its upstream connection open after the browser has gone. */
  reportDeparture();
  source?.close();
  source = null;
  setLive(false);
  /* The next thing this page does, if it is resurrected from the back/forward
     cache, is become visible again — and that has to be reported. */
  reportedVisible = null;
}

/** Stop, and forget everything. Called on sign-out. */
export function stopChatTransport() {
  started = false;
  live = false;
  cursor = '';
  attempt = 0;
  if (reconnectTimer !== null) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (syncTimer !== null) { clearInterval(syncTimer); syncTimer = null; }
  source?.close();
  source = null;
  window.removeEventListener('online', onOnline);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('pagehide', onPageHide);
}
