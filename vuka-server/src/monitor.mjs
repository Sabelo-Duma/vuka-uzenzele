/* ============================================================
   Error monitoring — free by default, Sentry when you want it.

   Two levels, both zero-cost:

   1. ALWAYS ON. Every server-side error is captured as one structured JSON
      line (greppable in `render logs`) and kept in a small in-memory ring
      buffer, readable at GET /api/admin/errors. No account, no dependency, no
      bill — enough to answer "what broke, how often, and where" from a phone.

   2. OPTIONAL. Set SENTRY_DSN and the same errors are also shipped to Sentry
      (their free tier covers 5k events/month), so they survive a restart and
      you get alerting. Implemented against Sentry's public envelope endpoint
      with plain fetch — no SDK, so it adds nothing to the image.

   The buffer is per-process and dies with a restart. That's the honest limit
   of the free tier: it's a triage aid, not an audit log. If errors need to
   outlive a deploy, that's what the DSN is for.
   ============================================================ */

import { randomUUID } from 'node:crypto';

const RING_SIZE = Number(process.env.VUKA_ERROR_BUFFER || 100);
const ENV = process.env.NODE_ENV || 'development';

/** Parsed SENTRY_DSN, or null when unset/malformed (never throws at boot). */
const sentry = (() => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, '');
    if (!u.username || !projectId) throw new Error('missing key or project id');
    return {
      url: `${u.protocol}//${u.host}/api/${projectId}/envelope/`,
      auth: `Sentry sentry_version=7, sentry_client=vuka-server/1.0, sentry_key=${u.username}`,
    };
  } catch (e) {
    console.warn(`SENTRY_DSN is set but could not be parsed (${e.message}) — falling back to log-only capture.`);
    return null;
  }
})();

export const monitoringTarget = sentry ? 'sentry' : 'log';

/** Newest-first ring of recent errors. Read-only for callers. */
const ring = [];
/** Repeat counts keyed by "name: message @ where" — one noisy bug shouldn't evict the rest. */
const seen = new Map();

const fingerprintOf = (err, where) => `${err?.name || 'Error'}: ${err?.message || String(err)} @ ${where || '-'}`;

export function recentErrors() {
  return ring.map((e) => ({ ...e, count: seen.get(e.fingerprint) ?? 1 }));
}

export function errorSummary() {
  return {
    target: monitoringTarget,
    captured: [...seen.values()].reduce((a, b) => a + b, 0),
    distinct: seen.size,
    buffered: ring.length,
  };
}

async function shipToSentry(entry, err) {
  if (!sentry) return;
  const event = {
    event_id: entry.id,
    timestamp: entry.at,
    platform: 'node',
    level: 'error',
    environment: ENV,
    logger: 'vuka-server',
    transaction: entry.where || undefined,
    exception: { values: [{ type: err?.name || 'Error', value: err?.message || String(err) }] },
    tags: { where: entry.where || 'unknown' },
    extra: { stack: entry.stack, ...entry.context },
  };
  const body = [
    JSON.stringify({ event_id: entry.id, sent_at: entry.at }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');
  try {
    const res = await fetch(sentry.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope', 'X-Sentry-Auth': sentry.auth },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`Sentry rejected event ${entry.id}: ${res.status}`);
  } catch (e) {
    // Monitoring must never take the app down, or become the outage.
    console.warn(`Could not ship error ${entry.id} to Sentry: ${e.message}`);
  }
}

/**
 * Record an error. Never throws, never awaits the network on the request path.
 * @param err     the thrown thing (Error or otherwise)
 * @param where   a stable label — 'GET /api/gigs', 'unhandledRejection', …
 * @param context small, NON-SENSITIVE extras. Never pass a password, token,
 *                ID number or account number: this can leave the building.
 * @returns the generated error id, safe to show a user for support
 */
export function captureError(err, where = '', context = {}) {
  const id = randomUUID().replace(/-/g, '');
  const fingerprint = fingerprintOf(err, where);
  const entry = {
    id,
    at: new Date().toISOString(),
    where,
    fingerprint,
    name: err?.name || 'Error',
    message: err?.message || String(err),
    stack: typeof err?.stack === 'string' ? err.stack.split('\n').slice(0, 12).join('\n') : null,
    context,
  };

  seen.set(fingerprint, (seen.get(fingerprint) ?? 0) + 1);
  const dupeAt = ring.findIndex((e) => e.fingerprint === fingerprint);
  if (dupeAt !== -1) ring.splice(dupeAt, 1);      // keep one row per bug, most recent
  ring.unshift(entry);
  if (ring.length > RING_SIZE) ring.pop();

  // One line, structured: greppable in `render logs`, parseable by anything.
  console.error(JSON.stringify({ level: 'error', evt: 'app_error', id, where, name: entry.name, msg: entry.message, count: seen.get(fingerprint), env: ENV }));
  if (entry.stack) console.error(entry.stack);

  void shipToSentry(entry, err);
  return id;
}

/**
 * Catch what escapes Express. An unhandled rejection is logged and the process
 * keeps serving; an uncaught exception leaves the process in an unknown state,
 * so we log, then let the caller's graceful shutdown run and the host restart
 * us clean.
 */
export function installProcessHandlers({ onFatal } = {}) {
  process.on('unhandledRejection', (reason) => {
    captureError(reason instanceof Error ? reason : new Error(`Unhandled rejection: ${reason}`), 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    captureError(err, 'uncaughtException');
    if (onFatal) onFatal(err);
  });
}
