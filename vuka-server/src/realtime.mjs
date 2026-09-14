/* ============================================================
   Realtime — one server-sent-events channel per signed-in device.

   Why SSE and not WebSockets. The thread used to be re-downloaded in full
   every four seconds, which on a metered South African data bundle is the
   single most expensive thing the app did to its users. Any push transport
   fixes that. Between the two:

     · SSE is one ordinary GET over the HTTP the app already speaks, so it
       needs no new server, no upgrade handshake and no extra dependency.
     · EventSource reconnects by itself, with the retry interval the server
       names. That matters here specifically: Render's docs say they set no
       fixed timeout but tell you to expect connections to close on deploys
       and to implement reconnection with backoff, and the free instance is
       replaced often. A transport that heals itself is the requirement, not
       a nicety.
     · Nothing in chat needs a client-to-server stream. Sending a message is
       a POST that wants a status code and a body back; typing is a ping.

   What this is not. The registry is in this process's memory, so it is
   correct for exactly one instance — which is what the free plan runs. Two
   instances and a message sent on one would not wake a listener parked on the
   other. The fix at that point is a shared bus (Postgres LISTEN/NOTIFY is
   already available here, and costs nothing extra), and the seam for it is
   emit(): make that publish, and have each instance fan out to its own
   subscribers. Deliberately not built yet, because an untested layer of
   indirection is worse than a documented limit.
   ============================================================ */

/** Devices, by user. One person may legitimately have a phone and a laptop open. */
const byUser = new Map();

/* A runaway tab that reconnects in a loop must not be able to exhaust a free
   instance's sockets, so both a per-person and a whole-process ceiling apply.
   Oldest goes first: the connection someone is actually looking at is the one
   that was opened most recently. */
const MAX_PER_USER = 4;
const MAX_TOTAL = Number(process.env.VUKA_SSE_MAX || 200);

/* Proxies drop a stream that says nothing. A comment frame is legal SSE that
   clients ignore, so this keeps the pipe warm without the app seeing an event. */
const HEARTBEAT_MS = 25_000;

let total = 0;
let nextId = 1;

/** How long a client should wait before reconnecting, if the stream drops. */
const RETRY_MS = 4000;

const frame = (event, data, id) =>
  (id ? `id: ${id}\n` : '') + `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;

/**
 * Attach a response as a live channel for one user.
 * @returns a function that closes and deregisters it
 */
export function subscribe(userId, req, res) {
  if (total >= MAX_TOTAL) {
    res.status(503).json({ error: 'Too many live connections right now. The app will keep checking for messages.' });
    return null;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Nginx and friends buffer by default, which holds every event back until
    // the buffer fills — i.e. turns a live stream into a slow one.
    'X-Accel-Buffering': 'no',
  });
  res.write(`retry: ${RETRY_MS}\n\n`);
  res.write(frame('ready', { at: new Date().toISOString() }));
  // No timeout on a stream that is supposed to stay open.
  res.socket?.setTimeout?.(0);
  res.socket?.setNoDelay?.(true);
  res.socket?.setKeepAlive?.(true);

  const client = { id: nextId++, res };
  let set = byUser.get(userId);
  if (!set) { set = new Set(); byUser.set(userId, set); }
  set.add(client);
  total++;

  if (set.size > MAX_PER_USER) {
    const oldest = set.values().next().value;
    if (oldest && oldest !== client) close(userId, oldest);
  }

  const beat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { close(userId, client); }
  }, HEARTBEAT_MS);
  // A timer must never be the reason the process cannot exit (tests, shutdown).
  beat.unref?.();
  client.beat = beat;

  const end = () => close(userId, client);
  req.on('close', end);
  req.on('error', end);
  return end;
}

function close(userId, client) {
  const set = byUser.get(userId);
  if (set?.delete(client)) {
    total--;
    if (set.size === 0) byUser.delete(userId);
  }
  clearInterval(client.beat);
  try { client.res.end(); } catch { /* already gone */ }
}

/**
 * Send one event to every device a person has open.
 * @returns how many devices took it
 */
export function emit(userId, event, data) {
  const set = byUser.get(userId);
  if (!set || set.size === 0) return 0;
  const text = frame(event, data);
  let sent = 0;
  for (const client of [...set]) {
    try { client.res.write(text); sent++; } catch { close(userId, client); }
  }
  return sent;
}

/**
 * Is this person's app open right now?
 *
 * Used to decide whether a new message also needs a push notification. Someone
 * looking at the thread does not need their phone to buzz about the line that
 * just appeared in front of them.
 */
export const isOnline = (userId) => (byUser.get(userId)?.size ?? 0) > 0;

/** For /api/health and the admin view. */
export const connectionStats = () => ({ users: byUser.size, connections: total });

/** Drop every stream — used on shutdown so the process can exit. */
export function closeAll() {
  for (const [userId, set] of [...byUser]) for (const client of [...set]) close(userId, client);
}
