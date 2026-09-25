import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { existsSync } from 'node:fs';
import { basename, join, sep } from 'node:path';
import { all, get, run, initDb, closeDb, driver, toBytes } from './db.mjs';
import { seedIfEmpty } from './seed.mjs';
import {
  hashPassword, verifyPassword, signToken, requireAuth, requireRole, uuid,
  randomDigits, hashCode, verifyCode, signPurposeToken, verifyPurposeToken,
} from './auth.mjs';
import { computeCv, autoReview, MIN_WAGE_PER_HOUR, MAX_GIG_HOURS, CATEGORY_IDS, TIERS, BADGES } from './engine.mjs';
import { encryptField, hasEncryptionKey } from './crypto.mjs';
import { sendSms, smsConfigured, otpEcho } from './notify.mjs';
import { sendPush, pushConfigured, vapidPublicKey } from './push.mjs';
import { coordsForPlace, parseCoords, withDistance, haversineKm } from './geo.mjs';
import { captureError, installProcessHandlers, recentErrors, errorSummary, monitoringTarget } from './monitor.mjs';
import { validateSaId } from './said.mjs';
import { startAutoRelease, AUTO_RELEASE_HOURS } from './autorelease.mjs';
import { askAssistant, aiConfigured, aiStats } from './assistant.mjs';
import { synthesize, voiceStats } from './voice.mjs';
import {
  subscribe, emit, isOnline, hasStream, connectionStats, closeAll, setVisibility, onPresenceChange,
} from './realtime.mjs';
import { cspDirectives, cspCoversInlineScripts, STATIC_DIR } from './csp.mjs';

// Ensure schema + demo data exist before we accept traffic.
await initDb();
await seedIfEmpty();

const app = express();
// Render (and most PaaS) put us behind a reverse proxy. Trust the first hop so
// rate-limiting sees the real client IP (via X-Forwarded-For) and HTTPS is
// detected correctly.
app.set('trust proxy', 1);

/* Security headers.

   CSP used to be off entirely, on the grounds that a strict one would break the
   SPA. It would have — which is why the policy is built from what the app
   actually loads, including a hash of the one inline script in index.html, so
   it is strict without being wrong. See csp.mjs.

   COEP stays off: it would require every resource to opt in via CORP, and
   nothing here needs the cross-origin isolation it buys.

   The rest of helmet's protections are unchanged (HSTS, nosniff, frameguard,
   referrer policy). */
app.use(helmet({
  contentSecurityPolicy: { useDefaults: false, directives: cspDirectives() },
  crossOriginEmbedderPolicy: false,
}));
if (!cspCoversInlineScripts()) {
  /* No build to read means no hash, which means the theme bootstrap would be
     blocked the moment a build appeared behind this process. Worth saying out
     loud rather than discovering as a white screen. */
  console.warn('CSP: no built index.html found — inline script hashes not computed. Build the front-end, then restart.');
}

/* Request logging (concise in prod, readable in dev).

   Health-check pings are skipped so they don't flood the logs. So is the live
   chat channel, for two reasons: it is one long-lived request that would only
   ever be logged when it ends, and its query string carries a connection
   ticket — short-lived and single-purpose, but still not something to write
   into an access log every time a phone comes back onto a signal. */
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: (req) => req.path === '/api/health' || req.path === '/api/events',
}));

// CORS: same-origin single-service deploys need none. If you split the
// front-end onto another origin, set VUKA_CORS_ORIGIN (comma-separated).
const corsOrigin = process.env.VUKA_CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((s) => s.trim()) } : {}));
app.use(express.json({ limit: '64kb' }));

// Rate limiting (free, in-memory — fine for a single instance). A generous
// backstop protects the whole API from abuse without tripping normal use
// (the app polls chat/unread), and a strict limiter guards the auth endpoints
// against password brute-forcing and sign-up spam.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  /* ~5 req/s per IP — well above real usage. Overridable because the end-to-end
     suite drives hundreds of requests from one address in under a minute, and
     the alternative was to make the test thinner than the behaviour it checks.
     Unset, it stays 300 in production. */
  max: Number(process.env.VUKA_RATE_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max: 20,                      // 20 sign-in / sign-up attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the limit
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});
// Health check is exempt so uptime pings never get throttled.
app.use('/api', (req, res, next) => (req.path === '/health' ? next() : apiLimiter(req, res, next)));
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/otp', '/api/auth/otp/verify',
  '/api/auth/password/request', '/api/auth/password/confirm'], authLimiter);

/* The lowest age Vuka will register a worker at.

   Eighteen is a data-protection limit, not a labour one, and the difference
   matters if this is ever revisited. Section 43 of the Basic Conditions of
   Employment Act sets the floor for working at 15, so a 16 or 17 year old may
   lawfully work — under restrictions, including no hazardous work, nothing
   between 6pm and 6am, and no more than eight hours a day.

   What stops Vuka is POPIA s34: anyone under 18 is a child, and their personal
   information may not be processed without a competent person's consent. There
   is no way to obtain or verify a guardian's consent here, so the limit is 18
   until there is. Lowering it means building that consent step first, and the
   job restrictions with it. */
const MIN_AGE = 18;

/* The fallback colour on a profile that has never picked one.

   It used to be #0E355A — an employer's brand navy, left over from the first
   prototype, still being written onto every new profile row and handed out by
   the API long after the app itself stopped using those colours. It was dead
   pixels and a live claim at the same time. This is Vuka's own deep indigo,
   from the 2.0 palette. */
const DEFAULT_AVATAR_COLOR = '#121A2E';

const initialsOf = (name) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- serializers ----
const userOut = (u) => ({ id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email ?? null });
function profileOut(p, verified) {
  if (!p) return null;
  return {
    age: p.age, location: p.location, education: p.education, bio: p.bio,
    skills: JSON.parse(p.skills || '[]'), idVerified: !!verified,
    color: p.color, joined: p.joined, tagline: p.tagline,
    languages: JSON.parse(p.languages || '[]'),
  };
}
function historyOut(h) {
  return {
    id: h.id, jobTitle: h.job_title, category: h.category, employer: h.employer,
    employerInitials: h.employer_initials, date: h.date, hours: h.hours, pay: h.pay,
    rating: h.rating, review: h.review, safetyFlag: !!h.safety_flag,
    // Credited without the employer, so it carries no rating. The app shows
    // "Not rated" rather than an honest-looking zero-star row.
    autoReleased: !!h.auto_released,
  };
}
/**
 * @param g gig row
 * @param rating {avg, count} from employerRatings() — omit for "no ratings yet".
 *   employerRating is null (not 5.0) until real workers have rated the employer;
 *   the client renders that as "New employer" rather than inventing stars.
 */
function gigOut(g, rating) {
  return {
    id: g.id, title: g.title, category: g.category, employer: g.employer_name,
    employerId: g.employer_id, employerInitials: g.employer_initials,
    // The worker is the one going to somebody's house. Whether that somebody
    // has verified their identity is the safety fact that matters most here,
    // and until now only the employer could see verification, about workers.
    employerVerified: !!g.employer_verified,
    employerRating: rating?.avg ?? null, employerRatingCount: rating?.count ?? 0,
    location: g.location, distanceKm: g.distance_km, hours: g.hours, payPerHour: g.pay_per_hour,
    when: g.when_text, description: g.description, urgent: !!g.urgent, status: g.status,
    // Overwritten by withDistance() when both sides' coordinates are known.
    // 'listed' means the number is the listing's own label, not a measurement.
    distanceSource: 'listed',
  };
}
/** How long a sender can still edit what they said. */
const MESSAGE_EDIT_WINDOW_MIN = Number(process.env.VUKA_MESSAGE_EDIT_MINUTES || 15);

/**
 * One message, as the client sees it.
 *
 * A deleted message keeps its row (so replies pointing at it still resolve, and
 * the thread doesn't silently reshuffle) but must never ship its body — the
 * tombstone is the whole point. `parent` is the message being replied to, if
 * any; callers resolve it, because the thread route already holds every row and
 * a per-message lookup would be a query each.
 */
const msgOut = (m, parent = null, attachment = null) => ({
  id: m.id,
  /* The sender's own id for this message, minted before it was ever sent. It
     comes back so the app can match the answer to the bubble it is already
     showing, instead of drawing the same message twice. */
  clientId: m.client_id ?? null,
  senderId: m.sender_id,
  recipientId: m.recipient_id,
  kind: m.kind || 'text',
  body: m.deleted_at ? '' : m.body,
  createdAt: m.created_at,
  /* Three states, not two. Reading something implies it arrived, so read folds
     into delivered — otherwise every row written before delivery receipts
     existed would show as read but never delivered. */
  delivered: !!(m.delivered_at || m.read_at),
  read: !!m.read_at,
  editedAt: m.edited_at ?? null,
  deleted: !!m.deleted_at,
  attachment: attachment && !m.deleted_at ? attachmentOut(attachment) : null,
  replyTo: parent
    ? {
      id: parent.id,
      senderId: parent.sender_id,
      kind: parent.kind || 'text',
      deleted: !!parent.deleted_at,
      // A quote, not the message: enough to recognise, capped so a long
      // message can't be re-sent in full inside every reply to it.
      body: parent.deleted_at ? '' : String(parent.body).slice(0, 140),
    }
    : null,
});
function formalOut(f) {
  return {
    id: f.id, title: f.title, category: f.category, employer: f.employer, employerInitials: f.employer_initials,
    minTier: f.min_tier, type: f.type, location: f.location, distanceKm: f.distance_km,
    salary: f.salary, education: f.education, description: f.description, perks: JSON.parse(f.perks || '[]'),
    distanceSource: 'listed',
  };
}

// ---- query helpers ----
const userByPhone = (phone) => get('SELECT * FROM users WHERE phone = ?', [phone]);
const userById = (id) => get('SELECT * FROM users WHERE id = ?', [id]);

/* ---------------- email ----------------
   A second way in, and the contact detail a CV is expected to carry. The phone
   number stays the account's identity: it is what this platform's users
   reliably have, what the OTP needs, and what payouts are tied to. Email is
   optional everywhere. */

/** Lower-cased and trimmed, so the unique index is effectively case-insensitive. */
export const normEmail = (v) => String(v ?? '').trim().toLowerCase();

/**
 * Deliberately conservative. Not RFC 5322 — that grammar accepts addresses no
 * mail provider would issue, and the cost of wrongly rejecting one here is a
 * user who cannot save their profile. Rejects the shapes that are certainly
 * wrong: no @, nothing either side of it, no dot in the domain, whitespace.
 */
export function isValidEmail(v) {
  const s = normEmail(v);
  return s.length >= 6 && s.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s);
}

const userByEmail = (email) => get('SELECT * FROM users WHERE email = ?', [normEmail(email)]);

/**
 * Resolve whatever the sign-in form sent. One field accepts either a phone
 * number or an email address, because asking someone to first classify their
 * own credential is a question the software can answer for them. An "@" is the
 * only signal needed and it cannot appear in a phone number.
 */
async function userByIdentifier(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  return s.includes('@') ? userByEmail(s) : userByPhone(normPhone(s));
}
const profileOf = (id) => get('SELECT * FROM worker_profiles WHERE user_id = ?', [id]);
const historyOf = (id) => all('SELECT * FROM history WHERE worker_id = ? ORDER BY created_at ASC', [id]);

/**
 * Average worker→employer rating for a set of employers, in one query.
 * Returns Map<employerId, {avg, count}>; employers with no ratings are absent.
 */
async function employerRatings(employerIds) {
  const ids = [...new Set(employerIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => '?').join(',');
  const rows = await all(
    `SELECT employer_id, AVG(rating) AS avg_rating, COUNT(*) AS n FROM employer_ratings WHERE employer_id IN (${placeholders}) GROUP BY employer_id`,
    ids
  );
  return new Map(rows.map((r) => [r.employer_id, { avg: Math.round(Number(r.avg_rating) * 10) / 10, count: Number(r.n) }]));
}

/**
 * A listing's own coordinates: the ones the employer's device shared, or a
 * lookup from its location text. Null when we genuinely don't know where it is.
 */
const rowCoords = (row) => parseCoords(row.lat, row.lng) ?? coordsForPlace(row.location);

/**
 * Where the viewer is, if the app chose to tell us (?lat=&lng=). Absent is the
 * normal case — location permission is the user's to give, and every screen
 * still works without it.
 */
const viewerCoords = (req) => parseCoords(req.query?.lat, req.query?.lng);

/** Serialize gig rows with their employers' real ratings and a real distance. */
async function gigsOut(rows, from = null) {
  const ratings = await employerRatings(rows.map((r) => r.employer_id));
  return rows.map((r) => withDistance(gigOut(r, ratings.get(r.employer_id)), rowCoords(r), from));
}

/**
 * Nearest first — but only among distances we actually measured.
 *
 * A listing we couldn't place has no meaningful distance, and its label is
 * often 0, so ranking it against real measurements would put the gig we know
 * least about at the top of "nearest first". Unmeasured listings keep their
 * newest-first order and follow behind.
 */
function byDistance(a, b) {
  const am = a.distanceSource === 'measured';
  const bm = b.distanceSource === 'measured';
  if (am && bm) return a.distanceKm - b.distanceKm;
  if (am !== bm) return am ? -1 : 1;
  return 0;                                    // Array#sort is stable in Node
}

/**
 * A star rating, or null when none was given.
 *
 * Both rating routes used to read `Number(body.rating) || 5` and clamp it, so a
 * missing value — or a literal 0, which is what an untouched picker now sends —
 * was stored as five stars. Ratings are the reputation this platform trades on,
 * and silently rounding "no opinion" up to the top of the scale devalues every
 * genuine five on it. Callers reject null rather than guessing.
 */
function parseRating(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

async function cvFor(userId) {
  const [profile, history, user] = await Promise.all([
    profileOf(userId), historyOf(userId), userById(userId),
  ]);
  const verified = !!user?.id_verified;
  const cv = computeCv(history.map((h) => ({ rating: h.rating, safety_flag: h.safety_flag, category: h.category, pay: h.pay })), verified);
  return { cv, history: history.map(historyOut), profile: profileOut(profile, verified) };
}

/* ============================================================
   Reaching people — free channels first.

   Web Push costs nothing per message, so it carries the notifications that
   used to need an SMS contract: a new gig nearby, a hire, a confirmed job.
   SMS stays for the things push can't do (a sign-up code has to arrive before
   the app is installed), and every send is best-effort — a notification that
   fails must never fail the request that triggered it.
   ============================================================ */

/** How far "near you" reaches, and how many people one gig may wake. */
const ALERT_RADIUS_KM = Number(process.env.VUKA_ALERT_RADIUS_KM || 15);
const ALERT_FANOUT_MAX = Number(process.env.VUKA_ALERT_FANOUT_MAX || 200);
/** Consecutive failures before we stop retrying a subscription. */
const PUSH_MAX_FAILURES = 10;

/** How many pushes are in flight at once during a fan-out. */
const PUSH_CONCURRENCY = 10;

/**
 * Deliver to one subscription row and reconcile its state. Prunes as it goes:
 * a push service answering 404/410 means that browser is gone for good, and a
 * subscription that has failed PUSH_MAX_FAILURES times in a row is not coming
 * back either.
 * @returns true if it was delivered
 */
async function deliverTo(sub, payload) {
  const result = await sendPush({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
  if (result.delivered) {
    await run('UPDATE push_subscriptions SET last_used_at = ?, failures = 0 WHERE id = ?', [new Date().toISOString(), sub.id]);
    return true;
  }
  if (result.gone || sub.failures + 1 >= PUSH_MAX_FAILURES) {
    await run('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
  } else {
    await run('UPDATE push_subscriptions SET failures = failures + 1 WHERE id = ?', [sub.id]);
  }
  return false;
}

/** Push to a set of subscription rows, a few at a time. @returns devices reached */
async function deliverAll(subs, payload) {
  let sent = 0;
  for (let i = 0; i < subs.length; i += PUSH_CONCURRENCY) {
    const batch = subs.slice(i, i + PUSH_CONCURRENCY);
    const results = await Promise.all(batch.map((s) => deliverTo(s, payload).catch(() => false)));
    sent += results.filter(Boolean).length;
  }
  return sent;
}

/**
 * Push to every device one person has granted permission on.
 * @returns number of devices actually reached
 */
async function notifyUser(userId, payload) {
  if (!pushConfigured) return 0;
  return deliverAll(await all('SELECT * FROM push_subscriptions WHERE user_id = ?', [userId]), payload);
}

/**
 * Tell one person something that matters, on the cheapest channel that will
 * actually reach them: push if any of their devices accepts it, SMS only if
 * none does.
 *
 * Both used to fire unconditionally. For anyone with notifications switched on
 * that made the SMS a paid duplicate of a free message — and at three messages
 * per completed job it was the largest avoidable cost the platform had. Keying
 * the fallback on devices actually reached, rather than on whether a
 * subscription row exists, means an expired or broken subscription still falls
 * back to SMS instead of silently dropping the notice.
 *
 * Detached on purpose: the caller is completing a hire or a confirmation, and
 * must neither wait on a push service nor fail because one was unreachable.
 */
function reach(user, payload, smsText) {
  if (!user?.id) return;
  void (async () => {
    let devices = 0;
    try {
      devices = await notifyUser(user.id, payload);
    } catch (e) {
      captureError(e, `reach:${payload.type}`);
    }
    if (devices > 0) return;              // the free channel did the job
    if (!user.phone) return;
    const sms = await sendSms(user.phone, smsText);
    if (!sms.delivered && sms.provider !== 'console') {
      captureError(
        new Error(`"${payload.type}" notice reached neither push nor SMS: ${sms.error ?? sms.provider}`),
        `reach:${payload.type}`
      );
    }
  })();
}

/**
 * The job alert. This is what the "Job alerts" toggle has always promised and
 * nothing delivered: when a gig is posted, the workers who opted in and are
 * within ALERT_RADIUS_KM hear about it.
 *
 * Two deliberate limits. If we can't place the gig, nobody is notified — a
 * "gig near you" that isn't near you is worse than silence. And the fan-out is
 * capped at the nearest ALERT_FANOUT_MAX, so one posting can't turn into
 * thousands of push requests on a free plan.
 */
async function alertNearbyWorkers(gig) {
  if (!pushConfigured) return { sent: 0, reason: 'push not configured' };
  const at = rowCoords(gig);
  if (!at) return { sent: 0, reason: 'gig location could not be placed' };

  const workers = await all(
    `SELECT u.id AS id, p.location AS location
       FROM users u
       JOIN worker_profiles p ON p.user_id = u.id
       LEFT JOIN user_preferences pr ON pr.user_id = u.id
      WHERE u.role = 'worker' AND COALESCE(pr.job_alerts, 1) = 1 AND u.id <> ?
      LIMIT 2000`,
    [gig.employer_id ?? '']
  );

  const nearby = workers
    .map((w) => {
      const home = coordsForPlace(w.location);
      return home ? { id: w.id, km: haversineKm(home, at) } : null;
    })
    .filter((w) => w && w.km <= ALERT_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
    .slice(0, ALERT_FANOUT_MAX);

  if (workers.length && !nearby.length) {
    console.log(`Job alert for gig ${gig.id}: nobody within ${ALERT_RADIUS_KM} km with alerts on.`);
  }

  // One query for every device belonging to the matched workers, rather than
  // one per worker — and the distance goes in the body, not the title, so a
  // single encrypted payload serves everybody.
  const placeholders = nearby.map(() => '?').join(',');
  const subs = nearby.length
    ? await all(`SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`, nearby.map((w) => w.id))
    : [];
  const sent = await deliverAll(subs, {
    type: 'job-alert',
    title: 'New gig near you',
    body: `${gig.title} · R${gig.pay_per_hour}/hr · ${gig.location}`,
    url: `/?gig=${gig.id}`,
    tag: `gig-${gig.id}`,
  });
  console.log(`Job alert for gig ${gig.id}: ${sent} device(s) notified of ${nearby.length} nearby worker(s).`);
  return { sent, matched: nearby.length };
}

// ---- health ----
const STARTED_AT = Date.now();

/* Which build is actually serving.
   Without this the only way to tell whether a deploy landed is to infer it
   from uptime and asset hashes, which answers "something restarted", not
   "the new code is live" — and those differ exactly when it matters, during
   a failed or queued deploy. Render sets RENDER_GIT_COMMIT on every build;
   the fallbacks keep it honest anywhere else rather than claiming a version
   it doesn't have. A commit SHA is public information — it is in the repo. */
const COMMIT = (process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || '').slice(0, 7) || 'unknown';

/* ---- how full is the database, and is it awake ----

   Both questions matter for the same reason, and the reason is that this is a
   free managed Postgres.

   AWAKE. Supabase pauses a free project after roughly a week without database
   activity, and a paused project is unreachable — every conversation, every
   CV, every reference. Data survives a pause and is restored from their
   dashboard, but a project left paused long enough is eventually deleted
   outright, and free-tier data deleted that way does not come back.

   The uptime workflow has pinged /api/health every ten minutes this whole
   time. It kept Render's instance warm and did nothing at all for Supabase,
   because this route answered from constants and never touched the database.
   Supabase counts database activity, not HTTP requests to something in front
   of it. One SELECT here turns an existing cron into a keep-alive: 144 trivial
   queries a day, against a threshold of "a few".

   FULL. The free plan is 500 MB, and voice notes and photos live in it. A
   message is a couple of hundred bytes; a minute of speech is a hundred
   kilobytes or more. Nothing measured that, so the first sign of trouble would
   have been writes failing. */

const DB_LIMIT_BYTES = Number(process.env.VUKA_DB_LIMIT_BYTES || 500 * 1024 * 1024);
/* Recomputed at most this often. The keep-alive query runs on every ping and
   has to stay trivial; measuring the whole database does not. Overridable so a
   test can ask for the real number rather than one from fifteen minutes ago. */
const STORAGE_TTL_MS = Number(process.env.VUKA_STORAGE_TTL_MS ?? 15 * 60_000);
let storageCache = { at: 0, value: null };

/** Total bytes on disk, however this engine likes to be asked. */
async function databaseBytes() {
  if (driver === 'pg') {
    const r = await get('SELECT pg_database_size(current_database()) AS bytes');
    return Number(r?.bytes ?? 0);
  }
  const [pages, size] = await Promise.all([get('PRAGMA page_count'), get('PRAGMA page_size')]);
  return Number(pages?.page_count ?? 0) * Number(size?.page_size ?? 0);
}

async function storageStats() {
  if (storageCache.value && Date.now() - storageCache.at < STORAGE_TTL_MS) return storageCache.value;
  const [bytes, files] = await Promise.all([
    databaseBytes(),
    get('SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM attachments'),
  ]);
  const attachmentBytes = Number(files?.bytes ?? 0);
  const value = {
    dbBytes: bytes,
    limitBytes: DB_LIMIT_BYTES,
    percentUsed: DB_LIMIT_BYTES > 0 ? Math.round((bytes / DB_LIMIT_BYTES) * 1000) / 10 : 0,
    attachmentCount: Number(files?.n ?? 0),
    attachmentBytes,
    /* The number that actually decides when this becomes a problem. Everything
       else in here grows in bytes; attachments grow in hundreds of kilobytes. */
    attachmentShare: bytes > 0 ? Math.round((attachmentBytes / bytes) * 1000) / 10 : 0,
  };
  storageCache = { at: Date.now(), value };
  return value;
}

app.get('/api/health', asyncH(async (_req, res) => {
  /* The keep-alive. Deliberately the cheapest query there is, and deliberately
     not wrapped in anything clever: if this stops running, the free project
     goes quiet and starts counting down to a pause. */
  const started = Date.now();
  let database = { ok: false, latencyMs: null };
  let storage = null;
  try {
    await get('SELECT 1 AS ok');
    database = { ok: true, latencyMs: Date.now() - started };
  } catch (e) {
    captureError(e, 'health:database');
  }

  /* Measured separately, because its failure is not the database's failure.
     pg_database_size needs a privilege the connection may not have on every
     managed host, and the attachments table may not exist yet mid-migration.

     Worth being precise about what this does and does not buy, because the
     first version of this comment claimed more than it should have. Sharing one
     try block with the keep-alive would NOT have reported the database as down:
     `database` is assigned before storageStats() is called, so a throw from the
     measurement leaves it true. What sharing costs is the label — every storage
     failure would have been captured as 'health:database', so the monitoring
     would point at the wrong thing while the real database was fine. That is
     the bug being avoided here: a misdirected alarm, not a false one. */
  if (database.ok) {
    try {
      storage = await storageStats();
    } catch (e) {
      captureError(e, 'health:storage');
    }
  }

  /* Still 200 with the database down, on purpose. Render watches this path to
     decide whether the instance is healthy, and answering 503 during a brief
     database blip would take the whole service down and keep it down —
     replacing a partial outage with a total one. The uptime workflow checks
     `database.ok` and is what raises the alarm. */
  res.json({
    ok: true,
    commit: COMMIT,
    minWage: MIN_WAGE_PER_HOUR,
    store: driver,
    database,
    storage,
    payoutsConfigured: hasEncryptionKey,
    smsConfigured,
    pushConfigured,
    // Msizi's model fallback. False is fine: the app answers from its own
    // knowledge base and says so.
    ai: aiStats(),
    voice: voiceStats(),
    monitoring: monitoringTarget,
    // How many devices are holding a live chat channel open right now. Worth
    // watching: it is the one number that says whether people are getting
    // messages pushed to them or quietly falling back to polling.
    live: connectionStats(),
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
  });
}));


// ---- engine config (single source of truth) ----
// The client ships the same thresholds so it can animate tier-ups instantly,
// but the SERVER is authoritative: the app pulls this at boot and overwrites
// its local copy, so a threshold change here can never disagree with the
// lock/unlock states the user sees.
app.get('/api/config', (_req, res) => res.json({
  minWage: MIN_WAGE_PER_HOUR,
  // How long an employer has to confirm before the job is credited without
  // them. The app counts down against this rather than hardcoding "3 days".
  autoReleaseHours: AUTO_RELEASE_HOURS,
  tiers: TIERS.map((t) => ({ id: t.id, name: t.name, minJobs: t.minJobs, minRating: t.minRating, maxFlags: t.maxFlags })),
  badges: BADGES.map((b) => ({ id: b.id, threshold: b.threshold ?? null, special: b.special ?? null })),
  // Public by design (RFC 8292): the browser needs it to create a subscription.
  // Empty string means push is off, and the app hides the notification prompt.
  vapidPublicKey,
}));

// ---- phone verification (OTP) ----
const OTP_TTL_MS = 10 * 60 * 1000;   // a code is good for 10 minutes
const OTP_MAX_ATTEMPTS = 5;          // then it's burned
const OTP_RESEND_WINDOW_MS = 10 * 60 * 1000;
const OTP_MAX_SENDS = 4;             // per phone, per window
const VERIFY_TOKEN_TTL_S = 30 * 60;  // proof-of-phone is good for 30 minutes

const normPhone = (p) => String(p ?? '').replace(/\D/g, '');
const isPhone = (p) => normPhone(p).length >= 9 && normPhone(p).length <= 15;

/** Codes are only ever echoed back when an operator has explicitly allowed it. */
/* True when the code comes back in the response instead of by SMS — an opted-in
   pilot, or dev with no provider wired up. Named because two things depend on
   it: whether to include the code, and whether a failed SMS actually stranded
   the user or merely didn't matter. */
const codeIsEchoed = otpEcho || (process.env.NODE_ENV !== 'production' && !smsConfigured);
const echoCode = (code) => (codeIsEchoed ? { devCode: code } : {});

app.post('/api/auth/otp', asyncH(async (req, res) => {
  const phone = normPhone(req.body?.phone);
  if (!isPhone(phone)) return res.status(400).json({ error: 'Please enter a valid mobile number.' });

  // Sign-up codes are pointless for a number that already has an account, and
  // saying so here saves the person filling in the whole form first.
  if (await userByPhone(phone)) {
    return res.status(409).json({ error: 'That mobile number is already registered. Try signing in instead.', reason: 'already_registered' });
  }
  if (process.env.NODE_ENV === 'production' && !smsConfigured && !otpEcho) {
    console.error('OTP requested but no SMS provider is configured — set VUKA_SMS_PROVIDER.');
    return res.status(503).json({ error: "We can't send verification codes right now. Please try again a bit later." });
  }

  const since = new Date(Date.now() - OTP_RESEND_WINDOW_MS).toISOString();
  const recent = await get('SELECT COUNT(*) AS c FROM phone_verifications WHERE phone = ? AND purpose = ? AND created_at > ?', [phone, 'register', since]);
  if (Number(recent.c) >= OTP_MAX_SENDS) {
    return res.status(429).json({ error: 'Too many codes requested. Please wait 10 minutes and try again.' });
  }

  // Only the newest code may be used.
  await run('DELETE FROM phone_verifications WHERE phone = ? AND purpose = ? AND verified_at IS NULL', [phone, 'register']);
  const code = randomDigits(4);
  await run('INSERT INTO phone_verifications (id, phone, purpose, code_hash, expires_at, created_at) VALUES (?,?,?,?,?,?)',
    [uuid(), phone, 'register', hashCode(code), new Date(Date.now() + OTP_TTL_MS).toISOString(), new Date().toISOString()]);

  const sms = await sendSms(phone, `Your Vuka Uzenzele code is ${code}. It expires in 10 minutes.`);

  /* A code that was never delivered must not be reported as sent. This answered
     200 regardless, so the app said "check your SMS" and the person waited for
     something that did not exist — the single worst failure in the product,
     because it happens before they have any way to ask for help. */
  if (!sms.delivered && !codeIsEchoed) {
    captureError(new Error(`OTP not delivered to ${phone}: ${sms.error ?? `provider "${sms.provider}"`}`), 'auth/otp:send');
    return res.status(502).json({
      error: "We couldn't send a code to that number. Check the number is right, then try again — if it keeps failing, it's on our side, not yours.",
      reason: 'sms_failed',
    });
  }

  res.json({ ok: true, sent: sms.delivered, expiresInSeconds: OTP_TTL_MS / 1000, ...echoCode(code) });
}));

app.post('/api/auth/otp/verify', asyncH(async (req, res) => {
  const phone = normPhone(req.body?.phone);
  const code = String(req.body?.code ?? '').replace(/\D/g, '');
  if (!phone || !code) return res.status(400).json({ error: 'Enter the code we sent you.' });

  const row = await get(
    'SELECT * FROM phone_verifications WHERE phone = ? AND purpose = ? AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [phone, 'register']
  );
  if (!row) return res.status(400).json({ error: 'That code has expired. Please request a new one.' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await run('DELETE FROM phone_verifications WHERE id = ?', [row.id]);
    return res.status(400).json({ error: 'That code has expired. Please request a new one.' });
  }
  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many wrong codes. Please request a new one.' });
  }
  if (!verifyCode(code, row.code_hash)) {
    await run('UPDATE phone_verifications SET attempts = ? WHERE id = ?', [Number(row.attempts) + 1, row.id]);
    return res.status(400).json({ error: "That code isn't right. Please check and try again." });
  }

  await run('UPDATE phone_verifications SET verified_at = ? WHERE id = ?', [new Date().toISOString(), row.id]);
  res.json({ ok: true, verifyToken: signPurposeToken('phone-verified', { phone }, VERIFY_TOKEN_TTL_S) });
}));

// ---- auth ----
app.post('/api/auth/register', asyncH(async (req, res) => {
  const { role, name, phone, password } = req.body || {};
  // A verified phone is a precondition, not a nice-to-have: it's how a worker
  // is reachable for a job and how account recovery works.
  const proof = verifyPurposeToken(req.body?.verifyToken, 'phone-verified');
  if (!proof || normPhone(proof.phone) !== normPhone(phone)) {
    return res.status(400).json({ error: 'Please confirm your mobile number with the code we sent before creating your account.' });
  }
  if (!name?.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (name.trim().length > 80) return res.status(400).json({ error: 'Please enter a shorter name.' });
  if (!phone || String(phone).replace(/\D/g, '').length < 9) return res.status(400).json({ error: 'Please enter a valid mobile number.' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Please choose a password of at least 8 characters.' });
  if (password.length > 200) return res.status(400).json({ error: 'That password is too long.' });
  if (role !== 'worker' && role !== 'employer') return res.status(400).json({ error: 'Please choose whether you want to work or hire.' });
  /* Eighteen, enforced.

     The terms have always said Vuka is for people 18 and over. Nothing checked
     it: age arrived from the client, `Number(age) || 18` turned anything
     unparseable into a compliant-looking 18, and a stated 16 was written
     straight into the profile. So the app's own terms said one thing and its
     database said another.

     This is not a tidiness point. POPIA s34 prohibits processing a child's
     personal information outright — a child being anyone under 18 — unless a
     competent person has consented, and Vuka has no way to obtain or verify
     that consent. Registering a sixteen-year-old is therefore not a policy
     choice the product is free to make; it is a breach the moment the row is
     written.

     Refused rather than silently corrected: a person who mistyped their age
     needs to know, and one who is genuinely 16 needs a straight answer instead
     of an account that quietly contradicts the terms they accepted. */
  if (role === 'worker') {
    const stated = Number(req.body?.age);
    if (!Number.isFinite(stated) || stated < MIN_AGE) {
      return res.status(400).json({
        error: `You need to be ${MIN_AGE} or older to work through Vuka. Please enter your age.`,
        field: 'age',
        reason: 'under_age',
      });
    }
    if (stated > 120) return res.status(400).json({ error: 'Please enter a valid age.', field: 'age' });
  }
  if (await userByPhone(phone)) return res.status(409).json({ error: 'That mobile number is already registered. Try signing in instead.' });

  const id = uuid();
  await run('INSERT INTO users (id, role, phone, password_hash, name, created_at) VALUES (?,?,?,?,?,?)',
    [id, role, phone, hashPassword(password), name.trim(), new Date().toISOString()]);

  if (role === 'worker') {
    const { age, location, education, bio, skills } = req.body;
    const cap = (v, n) => (typeof v === 'string' ? v.slice(0, n) : v);
    // id_verified is deliberately NOT taken from the client. It is granted only
    // by a reviewed KYC submission (POST /api/me/id-verification).
    await run('INSERT INTO worker_profiles (user_id, age, location, education, bio, skills, id_verified, color, joined, tagline) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, Number(age), cap(location, 120) || 'South Africa', cap(education, 120) || 'New member',
        cap(bio, 600) || 'New to Vuka and ready to work. Building my reputation one job at a time.',
        JSON.stringify(Array.isArray(skills) && skills.length ? skills : ['cleaning']),
        0, DEFAULT_AVATAR_COLOR, 'July 2026', 'New member, ready to work.']);
  }

  const user = await userById(id);
  const extra = role === 'worker' ? await cvFor(id) : {};
  res.status(201).json({ token: signToken(user), user: userOut(user), ...extra });
}));

/**
 * Sign in.
 *
 * "Number or password is incorrect" is the textbook answer, and here it was the
 * wrong one: someone who never registered gets a message implying they typed
 * something wrong, so they retype it, repeatedly, and never learn the actual
 * problem — which is that no account exists.
 *
 * The usual justification is that a precise message lets an attacker discover
 * which numbers are registered. That protection is already absent: requesting a
 * sign-up OTP answers 409 "already registered" for any number that is taken, by
 * design, so enumeration is a request away either side of this. Being vague
 * here therefore costs a real person their sign-in without costing an attacker
 * anything, and the `reason` lets the app offer sign-up instead of a dead end.
 */
app.post('/api/auth/login', asyncH(async (req, res) => {
  /* `identifier` is what the single sign-in field sends; `phone` and `email`
     are accepted too so an older client keeps working. */
  const { identifier, phone, email, password } = req.body || {};
  const credential = identifier ?? email ?? phone;
  const looksLikeEmail = String(credential ?? '').includes('@');
  const user = await userByIdentifier(credential);
  if (!user) {
    return res.status(401).json({
      error: looksLikeEmail
        ? "We don't have an account for that email address. Check it, or sign in with your mobile number instead."
        : "We don't have an account for that number yet. Create one — it takes a minute.",
      reason: 'no_account',
    });
  }
  if (!verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({
      error: 'That password is incorrect. Try again, or reset it if you have forgotten it.',
      reason: 'wrong_password',
    });
  }
  const extra = user.role === 'worker' ? await cvFor(user.id) : {};
  res.json({ token: signToken(user), user: userOut(user), ...extra });
}));

/* ---------------- password reset ----------------
   Two steps: request a code by SMS, then confirm it with a new password.
   The request step always answers the same way whether or not the number is
   registered — otherwise this endpoint becomes a way to enumerate users. */
const RESET_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

app.post('/api/auth/password/request', asyncH(async (req, res) => {
  const phone = normPhone(req.body?.phone);
  if (!isPhone(phone)) return res.status(400).json({ error: 'Please enter a valid mobile number.' });

  const user = await userByPhone(phone);
  const generic = { ok: true, message: "If that number has a Vuka account, we've sent a reset code by SMS." };
  if (!user) return res.json(generic);

  const since = new Date(Date.now() - OTP_RESEND_WINDOW_MS).toISOString();
  const recent = await get('SELECT COUNT(*) AS c FROM password_resets WHERE user_id = ? AND created_at > ?', [user.id, since]);
  if (Number(recent.c) >= OTP_MAX_SENDS) return res.json(generic); // silently stop, same shape

  await run('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL', [user.id]);
  const code = randomDigits(6);
  await run('INSERT INTO password_resets (id, user_id, code_hash, expires_at, created_at) VALUES (?,?,?,?,?)',
    [uuid(), user.id, hashCode(code), new Date(Date.now() + RESET_TTL_MS).toISOString(), new Date().toISOString()]);
  await sendSms(phone, `Your Vuka Uzenzele password reset code is ${code}. It expires in 15 minutes. If this wasn't you, ignore this message.`);

  res.json({ ...generic, ...echoCode(code) });
}));

app.post('/api/auth/password/confirm', asyncH(async (req, res) => {
  const phone = normPhone(req.body?.phone);
  const code = String(req.body?.code ?? '').replace(/\D/g, '');
  const password = req.body?.password;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Please choose a password of at least 8 characters.' });
  if (password.length > 200) return res.status(400).json({ error: 'That password is too long.' });

  const user = await userByPhone(phone);
  const badCode = { error: "That code isn't right or has expired. Please request a new one." };
  if (!user || !code) return res.status(400).json(badCode);

  const row = await get('SELECT * FROM password_resets WHERE user_id = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1', [user.id]);
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json(badCode);
  if (Number(row.attempts) >= RESET_MAX_ATTEMPTS) return res.status(429).json({ error: 'Too many wrong codes. Please request a new one.' });
  if (!verifyCode(code, row.code_hash)) {
    await run('UPDATE password_resets SET attempts = ? WHERE id = ?', [Number(row.attempts) + 1, row.id]);
    return res.status(400).json(badCode);
  }

  /*
   * The cut-off has to be strictly greater than every `iat` we could already
   * have issued — and a JWT's `iat` only has whole-second resolution, so it
   * cannot be derived from the clock alone.
   *
   * `floor(now / 1000)` left a hole: a token minted in the SAME second as the
   * reset compared as not-older and survived it. On a fast machine that isn't a
   * rare edge, it's most of the second, and it lands exactly where the feature
   * matters — the point of ending other sessions is to lock out whoever
   * prompted the reset, so a session they opened moments earlier is precisely
   * the one that has to die.
   *
   * `+1` alone doesn't close it either, because the token this reset hands back
   * is stamped AT the cut-off: a second reset in the same second would compute
   * the same cut-off and the first reset's token would survive. So the cut-off
   * also has to advance past the previous one. It is monotonic by construction,
   * which makes the invariant hold no matter how fast resets arrive:
   *
   *   every token issued before this moment has iat < validFrom
   *
   * The cost is that a cut-off can sit a few seconds in the future after
   * repeated resets. That's bounded — resets are rate-limited — and a token
   * whose `iat` is a second ahead verifies fine; only `exp` and `nbf` gate
   * validity, and `exp` is computed from `iat`.
   */
  const validFrom = Math.max(Math.floor(Date.now() / 1000), Number(user.sessions_valid_from) || 0) + 1;
  await run('UPDATE users SET password_hash = ?, sessions_valid_from = ? WHERE id = ?', [hashPassword(password), validFrom, user.id]);
  await run('UPDATE password_resets SET used_at = ? WHERE id = ?', [new Date().toISOString(), row.id]);

  const fresh = await userById(user.id);
  const extra = fresh.role === 'worker' ? await cvFor(fresh.id) : {};
  res.json({ token: signToken(fresh, { issuedAt: validFrom }), user: userOut(fresh), ...extra });
}));

app.get('/api/auth/me', requireAuth, asyncH(async (req, res) => {
  const user = await userById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Your account could not be found. Please sign in again.' });
  const extra = user.role === 'worker' ? await cvFor(user.id) : {};
  res.json({ user: userOut(user), ...extra });
}));

// ---- gigs ----
app.get('/api/gigs', asyncH(async (req, res) => {
  const from = viewerCoords(req);
  const rows = await all("SELECT g.*, u.id_verified AS employer_verified FROM gigs g LEFT JOIN users u ON u.id = g.employer_id WHERE g.status = 'open' ORDER BY g.created_at DESC LIMIT 500");
  const out = await gigsOut(rows, from);
  // "Work near me" is the whole point, so when we know where the viewer is,
  // the closest gig leads. Without a position we keep newest-first.
  if (from) out.sort(byDistance);
  res.json(out);
}));

app.get('/api/gigs/:id', asyncH(async (req, res) => {
  const g = await get('SELECT g.*, u.id_verified AS employer_verified FROM gigs g LEFT JOIN users u ON u.id = g.employer_id WHERE g.id = ?', [req.params.id]);
  if (!g) return res.status(404).json({ error: 'This gig is no longer available. Browse other gigs near you.' });
  res.json((await gigsOut([g], viewerCoords(req)))[0]);
}));

app.post('/api/gigs', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const { title, category, hours, payPerHour, location, when, description, urgent } = req.body || {};

  /* Validated here, not only in the form. The form is a convenience; this is
     the boundary. Each message names the field and what would fix it, because
     a 400 the app can only render as "something went wrong" is no better than
     a silent failure. */
  if (!title?.trim()) return res.status(400).json({ error: 'Please give your job a title.', field: 'title' });
  if (title.trim().length > 120) return res.status(400).json({ error: 'That title is too long — keep it under 120 characters.', field: 'title' });

  if (category != null && !CATEGORY_IDS.includes(category)) {
    return res.status(400).json({ error: 'Please choose one of the listed job categories.', field: 'category' });
  }

  const hoursNum = Number(hours);
  if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
    return res.status(400).json({ error: 'How many hours is the job? Enter a number greater than zero.', field: 'hours' });
  }
  if (hoursNum > MAX_GIG_HOURS) {
    return res.status(400).json({ error: `A single job can't be longer than ${MAX_GIG_HOURS} hours. Split it into more than one booking.`, field: 'hours' });
  }

  /* The fair-pay floor, enforced rather than merely displayed. The app shows
     every rate against the National Minimum Wage and calls itself fair-pay —
     accepting a rate below it would make that claim false, and the rate is
     unlawful besides. */
  const rate = Number(payPerHour);
  if (!Number.isFinite(rate) || rate <= 0) {
    return res.status(400).json({ error: 'Enter what the job pays per hour.', field: 'payPerHour' });
  }
  if (rate < MIN_WAGE_PER_HOUR) {
    return res.status(400).json({
      error: `R${rate.toFixed(2)}/hour is below South Africa's minimum wage of R${MIN_WAGE_PER_HOUR.toFixed(2)}. Raise the rate to post this job.`,
      field: 'payPerHour',
    });
  }

  if (!String(location ?? '').trim()) {
    return res.status(400).json({ error: 'Where is the job? Workers are shown how far it is from them.', field: 'location' });
  }

  const user = await userById(req.user.id);
  const id = uuid();
  const where = String(location).trim();
  // The employer's device may share exact coordinates; otherwise we place the
  // job from its location text. distance_km stays 0 — an unmeasured distance is
  // shown as "no distance", never as a made-up number.
  const coords = parseCoords(req.body?.lat, req.body?.lng) ?? coordsForPlace(where);
  await run('INSERT INTO gigs (id, employer_id, title, category, employer_name, employer_initials, location, distance_km, lat, lng, hours, pay_per_hour, when_text, description, urgent, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, user.id, title.trim(), category || 'errands', user.name, initialsOf(user.name),
      where, 0, coords?.lat ?? null, coords?.lng ?? null, hoursNum, rate,
      when || 'Flexible', description || '', urgent ? 1 : 0, 'open', new Date().toISOString()]);
  const row = await get('SELECT * FROM gigs WHERE id = ?', [id]);
  // Fire-and-forget: a slow push service must never slow down posting a job.
  void alertNearbyWorkers(row).catch((e) => captureError(e, 'alertNearbyWorkers'));
  res.status(201).json((await gigsOut([row]))[0]);
}));

/* Take down your own listing.
   An employer who posts a mistake, a duplicate, or a job that is no longer
   needed had no way to remove it — the admin route added alongside this is for
   support, not for the person who wrote the thing.

   Same rule as the admin route, for the same reason: once someone has been
   hired this is their pay and their reference, so it refuses and says to
   cancel instead. Applications cascade, so withdrawing an unfilled listing
   also clears the queue behind it — and everyone who applied is told, because
   silence is how a worker ends up waiting on a job that no longer exists. */
app.delete('/api/gigs/:id', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const gig = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!gig) return res.status(404).json({ error: 'That job does not exist.' });
  if (gig.employer_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only remove a job you posted.' });
  }

  const engaged = await get(
    "SELECT status FROM applications WHERE gig_id = ? AND status IN ('hired','worker_done','completed')",
    [gig.id],
  );
  if (engaged) {
    return res.status(409).json({
      error: 'Someone is already hired for this job, so it cannot be removed. Message them instead.',
      status: engaged.status,
    });
  }

  const waiting = await all(
    "SELECT worker_id FROM applications WHERE gig_id = ? AND status = 'applied'",
    [gig.id],
  );

  await run('DELETE FROM gigs WHERE id = ?', [gig.id]);

  /* Tell the people who applied. They cannot see the listing any more, so
     without this the application simply vanishes and they keep waiting. */
  for (const a of waiting) {
    const worker = await userById(a.worker_id);
    reach(
      worker,
      { type: 'gig-withdrawn', title: 'A job you applied for was withdrawn', body: gig.title },
      `The job "${gig.title}" was withdrawn by ${gig.employer_name}. Your other applications are unaffected.`,
    );
  }

  res.json({ ok: true, deleted: gig.id, applicantsNotified: waiting.length });
}));

app.get('/api/me/applications', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const rows = await all('SELECT gig_id, status FROM applications WHERE worker_id = ?', [req.user.id]);
  res.json(rows.map((r) => ({ gigId: r.gig_id, status: r.status })));
}));

app.post('/api/gigs/:id/apply', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!g || g.status !== 'open') return res.status(404).json({ error: 'This gig is no longer accepting applications.' });
  const existing = await get('SELECT * FROM applications WHERE gig_id = ? AND worker_id = ?', [g.id, req.user.id]);
  if (!existing) {
    await run('INSERT INTO applications (id, gig_id, worker_id, status, created_at) VALUES (?,?,?,?,?)',
      [uuid(), g.id, req.user.id, 'applied', new Date().toISOString()]);
  }
  res.json({ ok: true });
}));

/* ============================================================
   The work loop: applied → hired → worker_done → completed

   Neither side can move it alone. The employer chooses who gets the job; the
   worker says when the work is done and rates the employer; the employer
   confirms and rates the worker — and only THAT writes the CV entry. A worker
   can no longer award themselves a reference, and an employer can't quietly
   drop someone who did the work.
   ============================================================ */

/** A worker's own work, with the gig attached (open feed excludes filled gigs). */
app.get('/api/me/jobs', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const rows = await all(
    `SELECT a.id AS app_id, a.status AS app_status, a.hired_at, a.worker_done_at, a.completed_at,
            a.employer_rating, a.employer_review, g.*
     FROM applications a JOIN gigs g ON g.id = a.gig_id
     WHERE a.worker_id = ? ORDER BY a.created_at DESC LIMIT 200`,
    [req.user.id]
  );
  const ratings = await employerRatings(rows.map((r) => r.employer_id));
  res.json(rows.map((r) => ({
    applicationId: r.app_id,
    status: r.app_status,
    hiredAt: r.hired_at,
    workerDoneAt: r.worker_done_at,
    completedAt: r.completed_at,
    employerRatingOfMe: r.employer_rating,
    employerReview: r.employer_review,
    gig: gigOut(r, ratings.get(r.employer_id)),
  })));
}));

/** Everyone who applied to one of my gigs, with their real CV numbers. */
app.get('/api/gigs/:id/applicants', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!g) return res.status(404).json({ error: 'That job could not be found.' });
  if (g.employer_id !== req.user.id) return res.status(403).json({ error: 'You can only see applicants for your own jobs.' });

  const rows = await all(
    `SELECT a.id AS app_id, a.status AS app_status, a.created_at AS applied_at, a.worker_done_at, a.worker_rating,
            u.id AS user_id, u.name, p.*, u.id_verified AS verified
     FROM applications a
     JOIN users u ON u.id = a.worker_id
     LEFT JOIN worker_profiles p ON p.user_id = u.id
     WHERE a.gig_id = ? ORDER BY a.created_at ASC`,
    [g.id]
  );
  const applicants = await Promise.all(rows.map(async (r) => {
    const { cv } = await cvFor(r.user_id);
    return {
      applicationId: r.app_id, status: r.app_status, appliedAt: r.applied_at, workerDoneAt: r.worker_done_at,
      worker: {
        id: r.user_id, name: r.name, initials: initialsOf(r.name),
        age: r.age, location: r.location, tagline: r.tagline, color: r.color || DEFAULT_AVATAR_COLOR,
        skills: JSON.parse(r.skills || '[]'), idVerified: !!r.verified,
        rating: cv.avg, jobsDone: cv.jobsDone, tier: cv.tier, badges: cv.earnedBadges,
      },
    };
  }));
  res.json({ gig: (await gigsOut([g]))[0], applicants });
}));

/** Employer picks the person. Everyone else on that gig is told, not left hanging. */
app.post('/api/gigs/:id/hire', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!g) return res.status(404).json({ error: 'That job could not be found.' });
  if (g.employer_id !== req.user.id) return res.status(403).json({ error: 'You can only hire for your own jobs.' });

  const workerId = req.body?.workerId;
  const app_ = await get('SELECT * FROM applications WHERE gig_id = ? AND worker_id = ?', [g.id, workerId]);
  if (!app_) return res.status(404).json({ error: 'That person has not applied for this job.' });
  if (app_.status !== 'applied') return res.status(409).json({ error: 'That application has already been decided.' });
  const alreadyHired = await get("SELECT * FROM applications WHERE gig_id = ? AND status IN ('hired','worker_done','completed')", [g.id]);
  if (alreadyHired) return res.status(409).json({ error: 'You have already hired someone for this job.' });

  const now = new Date().toISOString();
  await run("UPDATE applications SET status = 'hired', hired_at = ? WHERE id = ?", [now, app_.id]);
  await run("UPDATE applications SET status = 'not_selected' WHERE gig_id = ? AND id != ? AND status = 'applied'", [g.id, app_.id]);
  await run("UPDATE gigs SET status = 'filled' WHERE id = ?", [g.id]);
  await run("UPDATE invitations SET status = 'closed' WHERE gig_id = ? AND status = 'pending'", [g.id]);

  // Being hired is the whole point of the app — tell them, don't make them
  // discover it. Best-effort: a failed SMS must not fail the hire.
  const worker = await userById(workerId);
  if (worker) {
    reach(worker, {
      type: 'hired',
      title: "You've been hired! 🎉",
      body: `${g.employer_name} chose you for "${g.title}".`,
      url: '/?tab=jobs',
      tag: `hired-${g.id}`,
    }, `Good news! ${g.employer_name} hired you for "${g.title}" on Vuka Uzenzele. Open the app for the details.`);
    await run('INSERT INTO messages (id, sender_id, recipient_id, body, created_at) VALUES (?,?,?,?,?)',
      [uuid(), req.user.id, worker.id, `You're hired for "${g.title}" 🎉 Let's arrange the details.`, now]);
  }
  res.json({ ok: true, applicationId: app_.id });
}));

/**
 * Worker marks the work done and rates the employer.
 * Deliberately does NOT touch the CV: the employer's confirmation does that.
 */
app.post('/api/gigs/:id/complete', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!g) return res.status(404).json({ error: 'This gig could not be found. It may already be complete.' });
  const app_ = await get('SELECT * FROM applications WHERE gig_id = ? AND worker_id = ?', [g.id, req.user.id]);
  if (!app_) return res.status(404).json({ error: 'You are not on this job.' });
  if (app_.status === 'applied') return res.status(409).json({ error: "You haven't been hired for this job yet." });
  if (app_.status === 'worker_done') return res.status(409).json({ error: `You've already marked this done — ${g.employer_name} still needs to confirm it.` });
  if (app_.status !== 'hired') return res.status(409).json({ error: 'This job is already finished.' });

  const rating = parseRating(req.body?.rating);
  if (rating === null) {
    return res.status(400).json({ error: 'Choose a star rating for this employer before marking the job done.', field: 'rating' });
  }
  const safetyFlag = req.body?.safetyFlag ? 1 : 0;
  const now = new Date().toISOString();

  await run("UPDATE applications SET status = 'worker_done', worker_done_at = ?, worker_rating = ?, safety_flag = ? WHERE id = ?",
    [now, rating, safetyFlag, app_.id]);

  // Worker → employer rating. This is what the gig's star rating averages.
  if (g.employer_id) {
    await run('INSERT INTO employer_ratings (id, employer_id, worker_id, gig_id, rating, comment, created_at) VALUES (?,?,?,?,?,?,?)',
      [uuid(), g.employer_id, req.user.id, g.id, rating, null, now]);

    const worker = await userById(req.user.id);
    const employer = await userById(g.employer_id);
    if (employer) {
      reach(employer, {
        type: 'work-done',
        title: 'Work marked as done',
        body: `${worker?.name ?? 'Your worker'} finished "${g.title}". Confirm to release their reference.`,
        url: '/?tab=hires',
        tag: `done-${g.id}`,
      }, `${worker?.name ?? 'Your worker'} marked "${g.title}" as done on Vuka Uzenzele. Confirm it in the app to release their reference.`);
      await run('INSERT INTO messages (id, sender_id, recipient_id, body, created_at) VALUES (?,?,?,?,?)',
        [uuid(), req.user.id, employer.id, `I've marked "${g.title}" as done. Please confirm when you're happy 🙏`, now]);
    }
  }
  if (safetyFlag) {
    await run('INSERT INTO safety_reports (id, reporter_id, about_user_id, gig_id, concern, status, created_at) VALUES (?,?,?,?,?,?,?)',
      [uuid(), req.user.id, g.employer_id ?? null, g.id, `Safety flag raised when completing "${g.title}".`, 'open', now]);
    console.warn(`SAFETY FLAG on gig ${g.id} by worker ${req.user.id} — needs triage.`);
  }
  res.json({ ok: true, status: 'worker_done', awaitingConfirmationFrom: g.employer_name });
}));

/** Work awaiting my confirmation, plus what I've already confirmed. */
app.get('/api/me/hires', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const rows = await all(
    `SELECT a.id AS app_id, a.status AS app_status, a.hired_at, a.worker_done_at, a.completed_at,
            u.id AS worker_id, u.name AS worker_name, g.*
     FROM applications a
     JOIN gigs g ON g.id = a.gig_id
     JOIN users u ON u.id = a.worker_id
     WHERE g.employer_id = ? AND a.status IN ('hired','worker_done','completed')
     ORDER BY a.hired_at DESC LIMIT 200`,
    [req.user.id]
  );
  const ratings = await employerRatings(rows.map((r) => r.employer_id));
  res.json(rows.map((r) => ({
    applicationId: r.app_id, status: r.app_status, hiredAt: r.hired_at,
    workerDoneAt: r.worker_done_at, completedAt: r.completed_at,
    worker: { id: r.worker_id, name: r.worker_name, initials: initialsOf(r.worker_name) },
    gig: gigOut(r, ratings.get(r.employer_id)),
  })));
}));

/**
 * Employer confirms the work and rates the worker. THIS is what writes the CV
 * entry — the verified reference a worker's whole ladder is built from.
 */
app.post('/api/applications/:id/confirm', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const app_ = await get('SELECT * FROM applications WHERE id = ?', [req.params.id]);
  if (!app_) return res.status(404).json({ error: 'That job could not be found.' });
  const g = await get('SELECT * FROM gigs WHERE id = ?', [app_.gig_id]);
  if (!g || g.employer_id !== req.user.id) return res.status(403).json({ error: 'You can only confirm your own jobs.' });
  if (app_.status === 'completed') return res.status(409).json({ error: 'You have already confirmed this job.' });
  if (app_.status !== 'worker_done') return res.status(409).json({ error: "You can confirm this once the worker has marked it done." });

  const rating = parseRating(req.body?.rating);
  if (rating === null) {
    return res.status(400).json({ error: 'Choose a star rating before confirming — it goes onto their CV as a verified reference.', field: 'rating' });
  }
  const review = String(req.body?.review ?? '').trim().slice(0, 600) || autoReview(rating);
  const now = new Date().toISOString();

  await run('INSERT INTO history (id, worker_id, job_title, category, employer, employer_initials, employer_id, date, hours, pay, rating, review, safety_flag, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [uuid(), app_.worker_id, g.title, g.category, g.employer_name, g.employer_initials, g.employer_id,
      (g.when_text.split('·')[0] || 'Jul 2026').trim(), g.hours, Math.round(g.hours * g.pay_per_hour),
      rating, review, app_.safety_flag ? 1 : 0, now]);

  await run("UPDATE applications SET status = 'completed', employer_rating = ?, employer_review = ?, completed_at = ? WHERE id = ?",
    [rating, review, now, app_.id]);

  // The worker just proved they can do this category of work.
  const profile = await profileOf(app_.worker_id);
  if (profile) {
    const skills = JSON.parse(profile.skills || '[]');
    if (!skills.includes(g.category)) {
      skills.push(g.category);
      await run('UPDATE worker_profiles SET skills = ? WHERE user_id = ?', [JSON.stringify(skills), app_.worker_id]);
    }
  }

  const worker = await userById(app_.worker_id);
  if (worker) {
    reach(worker, {
      type: 'confirmed',
      title: `${rating}/5 — your CV just grew ⭐`,
      body: `${g.employer_name} confirmed "${g.title}". The reference is on your CV.`,
      url: '/?tab=cv',
      tag: `confirmed-${g.id}`,
    }, `${g.employer_name} confirmed "${g.title}" and rated you ${rating}/5 on Vuka Uzenzele. Your CV has been updated.`);
  }
  res.json({ ok: true, status: 'completed', rating, review });
}));

// ---- formal jobs ----
app.get('/api/formal-jobs', asyncH(async (req, res) => {
  const from = viewerCoords(req);
  const rows = await all('SELECT * FROM formal_jobs ORDER BY min_tier ASC LIMIT 200');
  res.json(rows.map((r) => withDistance(formalOut(r), rowCoords(r), from)));
}));

// Formal roles are curated listings: applying files the worker's verified CV
// against the role. Tier-gated server-side — the client's lock UI is a hint,
// not the rule.
app.post('/api/formal-jobs/:id/apply', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const job = await get('SELECT * FROM formal_jobs WHERE id = ?', [req.params.id]);
  if (!job) return res.status(404).json({ error: 'This role is no longer listed. Browse the formal jobs board for others.' });

  const { cv } = await cvFor(req.user.id);
  if (cv.tier.id < job.min_tier) {
    const needed = TIERS[job.min_tier];
    return res.status(403).json({ error: `This role opens at ${needed.name} tier. Complete more well-rated jobs to unlock it.` });
  }

  const existing = await get('SELECT * FROM formal_applications WHERE job_id = ? AND worker_id = ?', [job.id, req.user.id]);
  if (existing) return res.json({ ok: true, already: true });
  await run('INSERT INTO formal_applications (id, job_id, worker_id, status, created_at) VALUES (?,?,?,?,?)',
    [uuid(), job.id, req.user.id, 'applied', new Date().toISOString()]);
  res.status(201).json({ ok: true });
}));

app.get('/api/me/formal-applications', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const rows = await all('SELECT job_id, status, created_at, note, decided_at FROM formal_applications WHERE worker_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(rows.map((r) => ({
    jobId: r.job_id, status: r.status, appliedAt: r.created_at,
    note: r.note ?? null, decidedAt: r.decided_at ?? null,
  })));
}));

// ---- payout / banking details ----
// Account numbers are encrypted at rest and NEVER returned: reads give back the
// holder, bank, type and last 4 digits only. That's enough for the UI to show
// "Capitec •••• 4321" and nothing more.
const BANKS = new Set(['absa', 'fnb', 'standard', 'nedbank', 'capitec', 'tymebank', 'africanbank', 'discovery', 'investec', 'bankzero', 'postbank']);

const bankingOut = (row) => (row ? {
  holder: row.holder, bank: row.bank, accountType: row.account_type,
  last4: row.account_last4, updatedAt: row.updated_at,
} : null);

/* ---------------- profile ----------------
   Until now a profile could only be written once, during sign-up, and sign-up
   never asked for education or a bio at all — so the Education section of every
   real CV was empty and a typo in a name was permanent. Sign-up stays short
   deliberately (every extra field costs completions); this is where the rest
   gets filled in, at leisure, once there is a reason to. */
const LANGUAGES = [
  'English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sepedi', 'Setswana',
  'Sesotho', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele',
];
app.get('/api/me/profile', requireAuth, asyncH(async (req, res) => {
  const me = await userById(req.user.id);
  res.json({ user: userOut(me), profile: profileOut(await profileOf(req.user.id)), languages: LANGUAGES });
}));

app.put('/api/me/profile', requireAuth, asyncH(async (req, res) => {
  const b = req.body || {};
  const bad = (error, field) => res.status(400).json({ error, field });

  const name = String(b.name ?? '').trim();
  if (!name) return bad('Please enter your name.', 'name');
  if (name.length > 80) return bad('That name is too long — 80 characters at most.', 'name');

  const location = String(b.location ?? '').trim();
  if (!location) return bad('Please enter where you live, so we can show you work nearby.', 'location');
  if (location.length > 120) return bad('That is too long — 120 characters at most.', 'location');

  const education = String(b.education ?? '').trim().slice(0, 160);
  const bio = String(b.bio ?? '').trim().slice(0, 600);

  const languages = Array.isArray(b.languages)
    ? b.languages.filter((l) => LANGUAGES.includes(l)).slice(0, LANGUAGES.length)
    : [];

  /* Email is optional, but if given it has to be usable and unclaimed —
     otherwise the CV carries an address that bounces, and a second account
     could quietly take over this one's sign-in. */
  let email = null;
  if (String(b.email ?? '').trim()) {
    if (!isValidEmail(b.email)) return bad("That email address doesn't look right. Check it and try again.", 'email');
    email = normEmail(b.email);
    const owner = await userByEmail(email);
    if (owner && owner.id !== req.user.id) {
      return bad('That email address is already used by another account.', 'email');
    }
  }

  await run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, req.user.id]);
  if (req.user.role === 'worker') {
    await run(
      'UPDATE worker_profiles SET location = ?, education = ?, bio = ?, languages = ? WHERE user_id = ?',
      [location, education, bio, JSON.stringify(languages), req.user.id]
    );
  }
  const me = await userById(req.user.id);
  res.json({ ok: true, user: userOut(me), profile: profileOut(await profileOf(req.user.id)) });
}));

app.get('/api/me/banking', requireAuth, asyncH(async (req, res) => {
  res.json(bankingOut(await get('SELECT * FROM banking_details WHERE user_id = ?', [req.user.id])));
}));

app.put('/api/me/banking', requireAuth, asyncH(async (req, res) => {
  if (!hasEncryptionKey && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'Payout details are temporarily unavailable. Please try again later.' });
  }
  const { holder, bank, accountType } = req.body || {};
  const digits = String(req.body?.accountNumber ?? '').replace(/\D/g, '');
  const existing = await get('SELECT * FROM banking_details WHERE user_id = ?', [req.user.id]);

  if (!holder?.trim()) return res.status(400).json({ error: 'Enter the account holder name.' });
  if (holder.trim().length > 80) return res.status(400).json({ error: 'That account holder name is too long.' });
  if (!BANKS.has(bank)) return res.status(400).json({ error: 'Choose your bank from the list.' });
  if (accountType !== 'savings' && accountType !== 'cheque') return res.status(400).json({ error: 'Choose either a savings or cheque account.' });
  // An omitted number means "keep the one already stored" — the client can't
  // echo it back, because we never send it.
  if (!digits && !existing) return res.status(400).json({ error: 'Enter your account number (6–13 digits).' });
  if (digits && (digits.length < 6 || digits.length > 13)) return res.status(400).json({ error: 'Enter a valid account number (6–13 digits).' });

  const enc = digits ? encryptField(digits) : existing.account_number_enc;
  const last4 = digits ? digits.slice(-4) : existing.account_last4;
  const now = new Date().toISOString();

  if (existing) {
    await run('UPDATE banking_details SET holder = ?, bank = ?, account_number_enc = ?, account_last4 = ?, account_type = ?, updated_at = ? WHERE user_id = ?',
      [holder.trim(), bank, enc, last4, accountType, now, req.user.id]);
  } else {
    await run('INSERT INTO banking_details (user_id, holder, bank, account_number_enc, account_last4, account_type, updated_at) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, holder.trim(), bank, enc, last4, accountType, now]);
  }
  res.json(bankingOut(await get('SELECT * FROM banking_details WHERE user_id = ?', [req.user.id])));
}));

app.delete('/api/me/banking', requireAuth, asyncH(async (req, res) => {
  await run('DELETE FROM banking_details WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
}));

/* ---------------- ID verification (KYC) ----------------
   The badge is granted by a REVIEWED submission, never by the client. The ID
   number is validated (13 digits, real date of birth, Luhn check) and stored
   encrypted; we only ever show its last 4 digits back.

   Format validity is not identity: a submission lands as 'pending' and is
   decided by the ops route below (or, later, by a Home Affairs / bureau
   integration wired in at the same point). */
const idVerificationOut = (row) => (row ? {
  status: row.status, last4: row.id_number_last4, fullName: row.full_name,
  reason: row.reason, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at,
} : { status: 'none' });

app.get('/api/me/id-verification', requireAuth, asyncH(async (req, res) => {
  const row = await get('SELECT * FROM id_verifications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1', [req.user.id]);
  res.json(idVerificationOut(row));
}));

app.post('/api/me/id-verification', requireAuth, asyncH(async (req, res) => {
  if (!hasEncryptionKey && process.env.NODE_ENV === 'production') {
    return res.status(503).json({ error: 'ID verification is temporarily unavailable. Please try again later.' });
  }
  const fullName = String(req.body?.fullName ?? '').trim();
  if (fullName.length < 3 || fullName.length > 120) return res.status(400).json({ error: 'Please enter your full name exactly as it appears on your ID.' });

  const existing = await get('SELECT * FROM id_verifications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1', [req.user.id]);
  if (existing?.status === 'verified') return res.status(409).json({ error: 'Your identity is already verified.' });
  if (existing?.status === 'pending') return res.status(409).json({ error: "Your ID is already being checked. We'll let you know as soon as it's done." });

  const idNumber = String(req.body?.idNumber ?? '').replace(/\D/g, '');
  const check = validateSaId(idNumber);
  if (!check.ok) return res.status(400).json({ error: check.reason });
  if (check.age < 16) return res.status(400).json({ error: 'You need to be at least 16 to work on Vuka.' });

  const id = uuid();
  const now = new Date().toISOString();
  await run('INSERT INTO id_verifications (id, user_id, full_name, id_number_enc, id_number_last4, date_of_birth, status, provider, submitted_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, req.user.id, fullName, encryptField(idNumber), idNumber.slice(-4), check.dateOfBirth, 'pending', 'manual', now]);

  // The ID is the authoritative source for age, so trust it over what was typed
  // at sign-up.
  if (await profileOf(req.user.id)) {
    await run('UPDATE worker_profiles SET age = ? WHERE user_id = ?', [check.age, req.user.id]);
  }
  console.warn(`ID VERIFICATION ${id} submitted by ${req.user.id} — awaiting review.`);
  res.status(201).json(idVerificationOut(await get('SELECT * FROM id_verifications WHERE id = ?', [id])));
}));

/* Ops-only review routes. Guarded by VUKA_ADMIN_TOKEN (an x-admin-token
   header); if the variable isn't set, the routes are simply off. This is the
   seam a KYC provider would replace. */
function requireAdmin(req, res, next) {
  const expected = process.env.VUKA_ADMIN_TOKEN;
  if (!expected) return res.status(404).json({ error: 'That endpoint does not exist.' });
  const given = req.headers['x-admin-token'];
  if (typeof given !== 'string' || given.length !== expected.length || given !== expected) {
    return res.status(401).json({ error: 'Not authorised.' });
  }
  next();
}

app.get('/api/admin/id-verifications', requireAdmin, asyncH(async (_req, res) => {
  const rows = await all("SELECT v.*, u.name, u.phone FROM id_verifications v JOIN users u ON u.id = v.user_id WHERE v.status = 'pending' ORDER BY v.submitted_at ASC LIMIT 200");
  res.json(rows.map((r) => ({ id: r.id, userId: r.user_id, name: r.name, phone: r.phone, fullName: r.full_name, last4: r.id_number_last4, dateOfBirth: r.date_of_birth, submittedAt: r.submitted_at })));
}));

app.post('/api/admin/id-verifications/:id/decide', requireAdmin, asyncH(async (req, res) => {
  const row = await get('SELECT * FROM id_verifications WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'That submission does not exist.' });
  if (row.status !== 'pending') return res.status(409).json({ error: 'That submission has already been decided.' });

  const approve = !!req.body?.approve;
  const reason = String(req.body?.reason ?? '').slice(0, 300) || null;
  await run('UPDATE id_verifications SET status = ?, reason = ?, reviewed_at = ? WHERE id = ?',
    [approve ? 'verified' : 'rejected', reason, new Date().toISOString(), row.id]);
  /* On users, not worker_profiles: an employer has no profile row, so the old
     statement matched nothing and an approved employer stayed unverified —
     after we had already taken and encrypted their ID number. */
  if (approve) await run('UPDATE users SET id_verified = 1 WHERE id = ?', [row.user_id]);
  res.json({ ok: true, status: approve ? 'verified' : 'rejected' });
}));

/* ---- ops triage --------------------------------------------------------
   These exist so that "who is on the other end of this?" has an answer today,
   with the admin token and curl, before anyone builds a back-office. Every
   route is gated by requireAdmin, so with VUKA_ADMIN_TOKEN unset they don't
   exist at all.
   ---------------------------------------------------------------------- */

const SAFETY_OUTCOMES = new Set(['open', 'actioned', 'dismissed']);

app.get('/api/admin/safety-reports', requireAdmin, asyncH(async (req, res) => {
  const wantAll = req.query?.status === 'all';
  const rows = await all(
    `SELECT s.*, r.name AS reporter_name, r.phone AS reporter_phone, a.name AS about_name, g.title AS gig_title
       FROM safety_reports s
       JOIN users r ON r.id = s.reporter_id
       LEFT JOIN users a ON a.id = s.about_user_id
       LEFT JOIN gigs g ON g.id = s.gig_id
      ${wantAll ? '' : "WHERE s.status = 'open'"}
      ORDER BY s.created_at ASC LIMIT 200`
  );
  res.json(rows.map((r) => ({
    id: r.id, status: r.status, concern: r.concern, createdAt: r.created_at,
    reporter: { id: r.reporter_id, name: r.reporter_name, phone: r.reporter_phone },
    about: r.about_user_id ? { id: r.about_user_id, name: r.about_name } : null,
    gig: r.gig_id ? { id: r.gig_id, title: r.gig_title } : null,
    note: r.note ?? null, resolvedAt: r.resolved_at ?? null,
  })));
}));

app.post('/api/admin/safety-reports/:id/resolve', requireAdmin, asyncH(async (req, res) => {
  const row = await get('SELECT * FROM safety_reports WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'That report does not exist.' });
  const status = String(req.body?.status ?? 'actioned');
  if (!SAFETY_OUTCOMES.has(status)) return res.status(400).json({ error: `status must be one of: ${[...SAFETY_OUTCOMES].join(', ')}.` });
  const note = String(req.body?.note ?? '').slice(0, 1000) || null;
  await run('UPDATE safety_reports SET status = ?, note = ?, resolved_at = ? WHERE id = ?',
    [status, note, status === 'open' ? null : new Date().toISOString(), row.id]);
  res.json({ ok: true, status });
}));

/* Formal roles are curated listings with no employer inbox yet, so until one
   exists these applications land here — visible, decidable, and the worker is
   told the outcome either way. That closes the loop; who does the deciding is
   still a hiring decision, not a code one. */
const FORMAL_OUTCOMES = new Set(['applied', 'shortlisted', 'rejected', 'placed']);

app.get('/api/admin/formal-applications', requireAdmin, asyncH(async (req, res) => {
  const wantAll = req.query?.status === 'all';
  const rows = await all(
    `SELECT fa.*, u.name AS worker_name, u.phone AS worker_phone, j.title AS job_title, j.employer AS job_employer
       FROM formal_applications fa
       JOIN users u ON u.id = fa.worker_id
       JOIN formal_jobs j ON j.id = fa.job_id
      ${wantAll ? '' : "WHERE fa.status = 'applied'"}
      ORDER BY fa.created_at ASC LIMIT 200`
  );
  const out = await Promise.all(rows.map(async (r) => {
    const { cv } = await cvFor(r.worker_id);
    return {
      id: r.id, status: r.status, appliedAt: r.created_at, note: r.note ?? null, decidedAt: r.decided_at ?? null,
      job: { id: r.job_id, title: r.job_title, employer: r.job_employer },
      worker: {
        id: r.worker_id, name: r.worker_name, phone: r.worker_phone,
        tier: cv.tier.name, rating: cv.avg, jobsDone: cv.jobsDone, flags: cv.flags,
      },
    };
  }));
  res.json(out);
}));

app.post('/api/admin/formal-applications/:id/decide', requireAdmin, asyncH(async (req, res) => {
  const row = await get('SELECT * FROM formal_applications WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'That application does not exist.' });
  const status = String(req.body?.status ?? '');
  if (!FORMAL_OUTCOMES.has(status)) return res.status(400).json({ error: `status must be one of: ${[...FORMAL_OUTCOMES].join(', ')}.` });
  const note = String(req.body?.note ?? '').slice(0, 500) || null;
  const job = await get('SELECT title FROM formal_jobs WHERE id = ?', [row.job_id]);
  await run('UPDATE formal_applications SET status = ?, note = ?, decided_at = ? WHERE id = ?',
    [status, note, status === 'applied' ? null : new Date().toISOString(), row.id]);

  // Being told "not this time" is part of the loop working. Silence isn't.
  if (status !== 'applied') {
    const heard = status === 'rejected'
      ? { title: 'An update on your application', body: `${job?.title ?? 'That role'}: not this time. Keep building your record — more roles unlock as you do.` }
      : { title: `Good news about ${job?.title ?? 'a role'} 🎉`, body: status === 'placed' ? "You've been placed. Congratulations!" : "You've been shortlisted. Expect contact soon." };
    void notifyUser(row.worker_id, { type: 'formal-decision', ...heard, url: '/?tab=formal', tag: `formal-${row.id}` })
      .catch((e) => captureError(e, 'notifyUser:formal-decision'));
  }
  res.json({ ok: true, status });
}));

/**
 * Recent server errors, newest first — the free half of error monitoring.
 * In-memory and per-process, so a restart clears it; set SENTRY_DSN when
 * errors need to outlive a deploy.
 */
app.get('/api/admin/errors', requireAdmin, (_req, res) => {
  res.json({ ...errorSummary(), errors: recentErrors() });
});

/* Remove a listing. There is no other way to take one down: an employer who
   posts a mistake, a filled job or something abusive currently cannot, and
   neither can support. A QA probe titled with an HTML tag has been sitting at
   the top of the live demo feed since the September audit for exactly this
   reason.

   Applications cascade (see the schema), so this also clears the queue behind
   the listing. It deliberately refuses once anyone has been hired: a confirmed
   job is somebody's pay and somebody's verified reference, and neither should
   disappear because a listing was tidied up. Those are cancelled, not deleted,
   and that flow does not exist yet. */
app.delete('/api/admin/gigs/:id', requireAdmin, asyncH(async (req, res) => {
  const gig = await get('SELECT id, title FROM gigs WHERE id = ?', [req.params.id]);
  if (!gig) return res.status(404).json({ error: 'That gig does not exist.' });

  const engaged = await get(
    "SELECT status FROM applications WHERE gig_id = ? AND status IN ('hired','worker_done','completed')",
    [gig.id],
  );
  if (engaged) {
    return res.status(409).json({
      error: 'Someone has been hired for this job, so it cannot be deleted. Cancel it instead.',
      status: engaged.status,
    });
  }

  const { count: applicants = 0 } = (await get('SELECT COUNT(*) AS count FROM applications WHERE gig_id = ?', [gig.id])) ?? {};
  await run('DELETE FROM gigs WHERE id = ?', [gig.id]);
  res.json({ ok: true, deleted: gig.id, title: gig.title, applicationsRemoved: Number(applicants) });
}));

// ---- preferences ----
// Only preferences the SERVER must know about live here (job alerts drive
// push/SMS). Device-level choices — data saver, language — stay on the device.
const prefsOut = (row) => ({ jobAlerts: row ? !!row.job_alerts : true });

app.get('/api/me/preferences', requireAuth, asyncH(async (req, res) => {
  res.json(prefsOut(await get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id])));
}));

app.put('/api/me/preferences', requireAuth, asyncH(async (req, res) => {
  if (typeof req.body?.jobAlerts !== 'boolean') return res.status(400).json({ error: 'jobAlerts must be true or false.' });
  const jobAlerts = req.body.jobAlerts ? 1 : 0;
  const now = new Date().toISOString();
  const existing = await get('SELECT user_id FROM user_preferences WHERE user_id = ?', [req.user.id]);
  if (existing) await run('UPDATE user_preferences SET job_alerts = ?, updated_at = ? WHERE user_id = ?', [jobAlerts, now, req.user.id]);
  else await run('INSERT INTO user_preferences (user_id, job_alerts, updated_at) VALUES (?,?,?)', [req.user.id, jobAlerts, now]);
  res.json(prefsOut(await get('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id])));
}));

// ---- push subscriptions ----
// One row per browser that granted permission. The endpoint is the natural key:
// the same person on a phone and a laptop is two subscriptions, and a device
// handed to someone else re-registers the endpoint under the new account.
app.post('/api/push/subscribe', requireAuth, asyncH(async (req, res) => {
  if (!pushConfigured) return res.status(503).json({ error: 'Push notifications are not switched on for this server yet.' });
  const endpoint = String(req.body?.endpoint ?? '');
  const p256dh = String(req.body?.keys?.p256dh ?? '');
  const auth = String(req.body?.keys?.auth ?? '');
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) return res.status(400).json({ error: 'That push endpoint is not valid.' });
  const point = Buffer.from(p256dh, 'base64url');
  if (point.length !== 65 || point[0] !== 0x04 || Buffer.from(auth, 'base64url').length !== 16) {
    return res.status(400).json({ error: 'That push subscription is missing its encryption keys.' });
  }
  const now = new Date().toISOString();
  const existing = await get('SELECT id FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  if (existing) {
    await run('UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ?, failures = 0 WHERE id = ?', [req.user.id, p256dh, auth, existing.id]);
  } else {
    await run('INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at, failures) VALUES (?,?,?,?,?,?,0)',
      [uuid(), req.user.id, endpoint, p256dh, auth, now]);
  }
  res.status(201).json({ ok: true });
}));

app.post('/api/push/unsubscribe', requireAuth, asyncH(async (req, res) => {
  const endpoint = String(req.body?.endpoint ?? '');
  if (endpoint) await run('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?', [endpoint, req.user.id]);
  else await run('DELETE FROM push_subscriptions WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
}));

/** Let someone prove to themselves that notifications work on this device. */
app.post('/api/push/test', requireAuth, asyncH(async (req, res) => {
  if (!pushConfigured) return res.status(503).json({ error: 'Push notifications are not switched on for this server yet.' });
  const sent = await notifyUser(req.user.id, {
    type: 'test',
    title: 'Notifications are on ✅',
    body: "This is how you'll hear about work near you.",
    url: '/',
    tag: 'push-test',
  });
  if (!sent) return res.status(409).json({ error: "We couldn't reach this device. Allow notifications and try again." });
  res.json({ ok: true, devices: sent });
}));

// ---- safety reports ----
/* ---- Msizi, when the knowledge base has no answer ----
   See assistant.mjs for what is sent and what is not. A per-IP limit on top of
   the global one: each call spends a slice of a free daily quota that every
   user shares, so one runaway client must not be able to spend it all. */
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Msizi needs a moment. Try again in a minute.', reason: 'slow_down' },
});

app.post('/api/assistant/ask', requireAuth, assistantLimiter, asyncH(async (req, res) => {
  const question = String(req.body?.question ?? '').trim();
  if (!question) return res.status(400).json({ error: 'Ask a question first.', reason: 'empty' });
  if (!aiConfigured()) return res.status(503).json({ error: 'Msizi is answering from its own notes only.', reason: 'not_configured' });
  try {
    const out = await askAssistant({
      userId: req.user.id,
      question,
      lang: String(req.body?.lang ?? 'en'),
      entries: req.body?.entries,
      history: req.body?.history,
    });
    res.json(out);
  } catch (e) {
    if (e.code === 'over_budget') return res.status(429).json({ error: 'Msizi has answered a lot today. Try again tomorrow.', reason: 'over_budget' });
    captureError(e.cause ?? e, 'assistant:ask');
    res.status(503).json({ error: 'Msizi could not think that through right now.', reason: e.code ?? 'unavailable' });
  }
}));

/* ---- Msizi's natural voice. See voice.mjs. One clip of at most 200
   characters per request, so its own per-IP limit: an answer is a handful of
   clips, and they must not eat the question limit above. */
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Slow down a little.', reason: 'slow_down' },
});

app.post('/api/assistant/voice', requireAuth, voiceLimiter, asyncH(async (req, res) => {
  try {
    const { audio, cached } = await synthesize(req.body?.text, req.body?.voice);
    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'private, max-age=86400');
    res.set('X-Voice-Cache', cached ? 'hit' : 'miss');
    res.send(audio);
  } catch (e) {
    if (e.code === 'empty' || e.code === 'too_long') return res.status(400).json({ error: 'That clip is not speakable.', reason: e.code });
    if (e.code === 'not_configured') return res.status(503).json({ error: 'No natural voice is set up.', reason: e.code });
    if (e.code === 'over_budget') return res.status(429).json({ error: 'The natural voice is resting until tomorrow.', reason: e.code });
    captureError(e, 'assistant:voice');
    res.status(503).json({ error: 'The natural voice is not available right now.', reason: 'unavailable' });
  }
}));

app.post('/api/safety/report', requireAuth, asyncH(async (req, res) => {
  const concern = String(req.body?.concern ?? '').trim();
  if (!concern) return res.status(400).json({ error: 'Describe the concern so we can help.' });
  if (concern.length > 4000) return res.status(400).json({ error: 'Please shorten your report a little.' });

  // Only link a real user/gig — a bad id must never lose the report itself.
  const aboutId = req.body?.aboutUserId ? (await userById(req.body.aboutUserId))?.id ?? null : null;
  const gigId = req.body?.gigId ? (await get('SELECT id FROM gigs WHERE id = ?', [req.body.gigId]))?.id ?? null : null;

  const id = uuid();
  await run('INSERT INTO safety_reports (id, reporter_id, about_user_id, gig_id, concern, status, created_at) VALUES (?,?,?,?,?,?,?)',
    [id, req.user.id, aboutId, gigId, concern.slice(0, 4000), 'open', new Date().toISOString()]);
  console.warn(`SAFETY REPORT ${id} filed by ${req.user.id}${aboutId ? ` about ${aboutId}` : ''} — needs triage.`);
  res.status(201).json({ ok: true, id });
}));

// ---- worker cv ----
app.get('/api/me/cv', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  res.json(await cvFor(req.user.id));
}));

// The signed-in employer's own rating, averaged from worker reviews.
app.get('/api/me/employer-rating', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const r = (await employerRatings([req.user.id])).get(req.user.id);
  res.json({ rating: r?.avg ?? null, count: r?.count ?? 0 });
}));

// ---- talent (employer) ----
app.get('/api/talent', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const workers = await all("SELECT u.id, u.name, p.*, u.id_verified AS verified FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.role = 'worker' AND u.id != ? LIMIT 500", [req.user.id]);
  const list = await Promise.all(workers.map(async (w) => {
    const { cv } = await cvFor(w.id);
    return {
      id: w.id, name: w.name, initials: initialsOf(w.name), age: w.age, location: w.location,
      skills: JSON.parse(w.skills || '[]'), idVerified: !!w.verified, color: w.color,
      tagline: w.tagline, rating: cv.avg, jobsDone: cv.jobsDone, tier: cv.tier, badges: cv.earnedBadges,
    };
  }));
  list.sort((a, b) => b.jobsDone - a.jobsDone);
  res.json(list);
}));

app.get('/api/talent/:id', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const w = await get("SELECT u.id, u.name, p.*, u.id_verified AS verified FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'worker'", [req.params.id]);
  if (!w) return res.status(404).json({ error: 'This worker is no longer available. Browse other verified workers.' });
  const { cv } = await cvFor(w.id);
  res.json({
    id: w.id, name: w.name, initials: initialsOf(w.name), age: w.age, location: w.location,
    skills: JSON.parse(w.skills || '[]'), idVerified: !!w.verified, color: w.color,
    tagline: w.tagline, rating: cv.avg, jobsDone: cv.jobsDone, tier: cv.tier, badges: cv.earnedBadges,
  });
}));

// ---- hiring loop: invitations ----
app.get('/api/me/gigs', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const rows = await all("SELECT * FROM gigs WHERE employer_id = ? AND status = 'open' ORDER BY created_at DESC", [req.user.id]);
  res.json(await gigsOut(rows));
}));

app.post('/api/talent/:id/invite', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const workerId = req.params.id;
  /* An invitation is the other channel that lands on a person's screen, and it
     carries a free-text message. Blocking the chat and leaving this open would
     have moved the problem rather than solved it. */
  const invBlock = await eitherBlocked(req.user.id, req.params.id);
  if (invBlock.any) {
    return res.status(403).json({
      error: invBlock.iBlocked
        ? 'You blocked this person. Unblock them to invite them to a job.'
        : "You can't invite this person.",
      reason: invBlock.iBlocked ? 'you_blocked' : 'blocked',
    });
  }

  const { gigId, message } = req.body || {};
  const worker = await get("SELECT * FROM users WHERE id = ? AND role = 'worker'", [workerId]);
  if (!worker) return res.status(404).json({ error: 'That worker is no longer available.' });
  const gig = await get('SELECT * FROM gigs WHERE id = ?', [gigId]);
  if (!gig || gig.employer_id !== req.user.id) return res.status(400).json({ error: 'Please pick one of your own posted jobs.' });
  if (gig.status !== 'open') return res.status(400).json({ error: 'That job is no longer open.' });

  const existing = await get('SELECT * FROM invitations WHERE gig_id = ? AND worker_id = ?', [gigId, workerId]);
  const msg = (message || '').toString().slice(0, 400) || null;
  if (existing) {
    if (existing.status === 'pending') return res.json({ ok: true, already: true });
    await run("UPDATE invitations SET status = 'pending', message = ?, created_at = ? WHERE id = ?", [msg, new Date().toISOString(), existing.id]);
    return res.json({ ok: true });
  }
  await run('INSERT INTO invitations (id, gig_id, employer_id, worker_id, message, status, created_at) VALUES (?,?,?,?,?,?,?)',
    [uuid(), gigId, req.user.id, workerId, msg, 'pending', new Date().toISOString()]);
  res.status(201).json({ ok: true });
}));

app.get('/api/me/invitations', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const rows = await all(
    "SELECT i.id AS inv_id, i.message AS inv_message, g.* FROM invitations i JOIN gigs g ON g.id = i.gig_id WHERE i.worker_id = ? AND i.status = 'pending' ORDER BY i.created_at DESC",
    [req.user.id]
  );
  const ratings = await employerRatings(rows.map((r) => r.employer_id));
  res.json(rows.map((r) => ({ id: r.inv_id, message: r.inv_message, gig: gigOut(r, ratings.get(r.employer_id)) })));
}));

app.post('/api/invitations/:id/respond', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const inv = await get('SELECT * FROM invitations WHERE id = ? AND worker_id = ?', [req.params.id, req.user.id]);
  if (!inv) return res.status(404).json({ error: 'This invitation is no longer available.' });
  const accept = !!req.body?.accept;
  const now = new Date().toISOString();
  await run('UPDATE invitations SET status = ? WHERE id = ?', [accept ? 'accepted' : 'declined', inv.id]);

  if (accept) {
    // An invitation IS the employer choosing this worker, so accepting hires
    // them outright — no second round of picking.
    const gig = await get('SELECT * FROM gigs WHERE id = ?', [inv.gig_id]);
    const taken = await get("SELECT * FROM applications WHERE gig_id = ? AND worker_id != ? AND status IN ('hired','worker_done','completed')", [inv.gig_id, req.user.id]);
    if (taken) return res.status(409).json({ error: 'Sorry — that job has already been filled by someone else.' });

    const existingApp = await get('SELECT * FROM applications WHERE gig_id = ? AND worker_id = ?', [inv.gig_id, req.user.id]);
    if (existingApp) {
      if (existingApp.status === 'applied' || existingApp.status === 'not_selected') {
        await run("UPDATE applications SET status = 'hired', hired_at = ? WHERE id = ?", [now, existingApp.id]);
      }
    } else {
      await run('INSERT INTO applications (id, gig_id, worker_id, status, hired_at, created_at) VALUES (?,?,?,?,?,?)',
        [uuid(), inv.gig_id, req.user.id, 'hired', now, now]);
    }
    await run("UPDATE applications SET status = 'not_selected' WHERE gig_id = ? AND worker_id != ? AND status = 'applied'", [inv.gig_id, req.user.id]);
    await run("UPDATE gigs SET status = 'filled' WHERE id = ?", [inv.gig_id]);
    await run("UPDATE invitations SET status = 'closed' WHERE gig_id = ? AND status = 'pending'", [inv.gig_id]);

    const employer = gig?.employer_id ? await userById(gig.employer_id) : null;
    if (employer) {
      // Push was never wired up here, so this notice always cost a message.
      // Going through reach() gives it the free channel first, like the rest.
      const who = (await userById(req.user.id))?.name ?? 'A worker';
      reach(employer, {
        type: 'invitation-accepted',
        title: 'Your invitation was accepted',
        body: `${who} accepted your invitation for "${gig.title}".`,
        url: '/?tab=hires',
        tag: `invite-accepted-${inv.gig_id}`,
      }, `${who} accepted your invitation for "${gig.title}" on Vuka Uzenzele.`);
    }
  }
  res.json({ ok: true, accepted: accept, gigId: inv.gig_id });
}));

// ---- chat / direct messages ----

/**
 * A strictly increasing timestamp for chat.
 *
 * Ordering and delta sync both hang off created_at, and two messages written
 * inside the same millisecond would be a tie: the thread could reshuffle
 * between loads, and a "give me everything since T" cursor has no safe way to
 * resume out of the middle of one. Nudging forward by a millisecond when the
 * clock hasn't moved makes the column a total order for this process — which,
 * on one instance, is the whole system. (More than one would need a shared
 * sequence; realtime.mjs carries the same caveat for the same reason.)
 */
let lastChatStamp = 0;
function chatNow() {
  const now = Math.max(Date.now(), lastChatStamp + 1);
  lastChatStamp = now;
  return new Date(now).toISOString();
}

const chatUser = async (u) => {
  const prof = await get('SELECT color FROM worker_profiles WHERE user_id = ?', [u.id]);
  return { id: u.id, name: u.name, role: u.role, initials: initialsOf(u.name), color: prof?.color || DEFAULT_AVATAR_COLOR };
};

/* ---- attachments ----

   A voice note is capped at sixty seconds. Not an arbitrary number: at the
   bitrates browsers actually record speech at, a minute is roughly a hundred
   kilobytes as Opus and several times that as AAC, which is what iOS Safari
   produces below 18.4. The byte ceiling is what really protects the database,
   because the duration is only ever the client's word for it.

   Photos are downscaled in the browser before they are uploaded, so the
   ceiling here is a backstop against something that skipped that path rather
   than the normal case. */
const VOICE_MAX_MS = Number(process.env.VUKA_VOICE_MAX_MS || 60_000);
const ATTACH_MAX_BYTES = Number(process.env.VUKA_ATTACH_MAX_BYTES || 2 * 1024 * 1024);

/* Allow-listed by exact type, not by prefix. "audio/*" would also accept
   audio/x-anything, and what comes back out of this table is handed to a
   browser with the content type it was stored under. */
const AUDIO_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Strip codec parameters: browsers send `audio/webm;codecs=opus`. */
const baseMime = (t) => String(t || '').split(';')[0].trim().toLowerCase();

/** The attachment as the client sees it — everything except the bytes. */
const attachmentOut = (a) => ({
  id: a.id,
  kind: a.kind,
  mime: a.mime,
  size: Number(a.size),
  durationMs: a.duration_ms == null ? null : Number(a.duration_ms),
  waveform: a.waveform ?? null,
  width: a.width == null ? null : Number(a.width),
  height: a.height == null ? null : Number(a.height),
});

/**
 * Take the bytes, before any message refers to them.
 *
 * Two steps rather than one because a voice note is large and a message is
 * small: uploading first keeps the send itself a quick JSON round trip that is
 * safe to retry, and a recording that fails halfway leaves an unattached row
 * instead of a message with a hole in it.
 */
app.post('/api/attachments', requireAuth,
  express.raw({ type: () => true, limit: ATTACH_MAX_BYTES }),
  asyncH(async (req, res) => {
    const bytes = Buffer.isBuffer(req.body) ? req.body : null;
    if (!bytes || bytes.length === 0) {
      return res.status(400).json({ error: 'That upload arrived empty. Please try again.' });
    }

    const mime = baseMime(req.headers['content-type']);
    const kind = req.query.kind === 'image' ? 'image' : 'voice';
    const allowed = kind === 'image' ? IMAGE_TYPES : AUDIO_TYPES;
    if (!allowed.has(mime)) {
      return res.status(415).json({
        error: kind === 'image'
          ? "That image format isn't supported. Use a JPEG, PNG or WebP."
          : "That audio format isn't supported on our side. Please try recording again.",
      });
    }

    const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };
    let durationMs = kind === 'voice' ? num(req.query.durationMs) : null;
    if (kind === 'voice') {
      if (durationMs === null || durationMs < 400) {
        return res.status(400).json({ error: 'That recording was too short. Hold on a little longer.' });
      }
      /* A client could claim any length. Trust it only as far as the cap — the
         bytes are already bounded, so the worst a lie does is mislabel a bubble. */
      durationMs = Math.min(durationMs, VOICE_MAX_MS);
    }

    /* The waveform is measured by the sender while recording and travels with
       the clip, so the receiver never decodes audio just to draw a picture of
       it. One digit 0-9 per bar. */
    const waveform = kind === 'voice'
      ? String(req.query.waveform || '').replace(/[^0-9]/g, '').slice(0, 64) || null
      : null;

    const width = kind === 'image' ? num(req.query.w) : null;
    const height = kind === 'image' ? num(req.query.h) : null;

    const id = uuid();
    await run(
      `INSERT INTO attachments (id, owner_id, kind, mime, bytes, size, duration_ms, waveform, width, height, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, req.user.id, kind, mime, bytes, bytes.length, durationMs, waveform, width, height, new Date().toISOString()],
    );

    res.status(201).json(attachmentOut({
      id, kind, mime, size: bytes.length, duration_ms: durationMs, waveform, width, height,
    }));
  }));

/**
 * Hand the bytes back — to the two people in the conversation and nobody else.
 *
 * Fetched by the app with its Authorization header and turned into a blob URL,
 * rather than pointed at by a bare <audio src>. Two reasons, both practical: a
 * media element cannot send an auth header at all, and Safari expects a server
 * it streams from to answer byte-range requests, which a blob URL takes off the
 * table entirely.
 */
app.get('/api/attachments/:id', requireAuth, asyncH(async (req, res) => {
  const a = await get('SELECT * FROM attachments WHERE id = ?', [req.params.id]);
  if (!a) return res.status(404).json({ error: 'That file is no longer available.' });

  let allowed = a.owner_id === req.user.id;
  if (!allowed && a.message_id) {
    const m = await get('SELECT sender_id, recipient_id, deleted_at FROM messages WHERE id = ?', [a.message_id]);
    allowed = !!m && !m.deleted_at && (m.sender_id === req.user.id || m.recipient_id === req.user.id);
  }
  if (!allowed) return res.status(403).json({ error: "That file isn't yours to open." });

  const bytes = toBytes(a.bytes);
  res.setHeader('Content-Type', a.mime);
  res.setHeader('Content-Length', String(bytes.length));
  /* The id is a uuid and the bytes behind it never change, so this is safe to
     keep indefinitely — and on a metered connection, re-downloading a voice
     note every time the thread is opened is exactly the cost worth not paying. */
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  res.end(bytes);
}));

/* ---- sweeping up abandoned uploads ----

   Attachments are uploaded before the message that refers to them, which is
   what keeps a send small enough to retry safely. The cost of that order is
   that some uploads are never claimed: the send failed permanently and the
   sender pressed Discard, or the app was closed between the two requests.

   Nothing points at those rows and nothing ever will, but on this deployment
   the bytes are in the only durable storage the platform has, so "a few
   hundred kilobytes that leak every time a recording is abandoned" is not a
   rounding error — it is the storage budget, slowly.

   An hour's grace, because the gap between the two requests is measured in
   seconds and anything older than that has definitively been abandoned. */
const ATTACHMENT_GRACE_HOURS = Number(process.env.VUKA_ATTACH_GRACE_HOURS || 1);

export async function sweepOrphanAttachments(now = new Date()) {
  const cutoff = new Date(now.getTime() - ATTACHMENT_GRACE_HOURS * 3_600_000).toISOString();
  const doomed = await all(
    'SELECT id FROM attachments WHERE message_id IS NULL AND created_at < ?',
    [cutoff],
  );
  if (doomed.length === 0) return 0;
  await run('DELETE FROM attachments WHERE message_id IS NULL AND created_at < ?', [cutoff]);
  return doomed.length;
}

/** What a thread preview says when the message isn't words. */
const previewOf = (m) => {
  if (m.deleted_at) return 'Message deleted';
  if (m.kind === 'voice') return '🎤 Voice note';
  if (m.kind === 'image') return m.body ? `📷 ${m.body}` : '📷 Photo';
  return m.body;
};

/** Load every attachment a page of messages points at, in one query. */
async function attachmentsFor(rows) {
  const ids = [...new Set(rows.map((r) => r.attachment_id).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const holes = ids.map(() => '?').join(',');
  const found = await all(
    `SELECT id, kind, mime, size, duration_ms, waveform, width, height FROM attachments WHERE id IN (${holes})`,
    ids,
  );
  return new Map(found.map((a) => [a.id, a]));
}

// Unread message count (for the nav badge).
app.get('/api/messages/unread-count', requireAuth, asyncH(async (req, res) => {
  const r = await get('SELECT COUNT(*) AS c FROM messages WHERE recipient_id = ? AND read_at IS NULL', [req.user.id]);
  res.json({ count: Number(r.c) });
}));

/**
 * Inbox: one entry per conversation partner, newest first.
 *
 * This used to read every message the account had ever sent or received into
 * memory and fold it down in JavaScript. Fine at three messages, ruinous at
 * three thousand — and it is the inbox, the screen opened most often. The
 * grouping now happens in the database, and the unread tallies arrive as one
 * extra query rather than one per conversation.
 */
app.get('/api/messages/conversations', requireAuth, asyncH(async (req, res) => {
  const pairs = await all(
    `SELECT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_id,
            MAX(created_at) AS last_at
       FROM messages
      WHERE sender_id = ? OR recipient_id = ?
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 100`,
    [req.user.id, req.user.id, req.user.id],
  );

  const unreadRows = await all(
    'SELECT sender_id, COUNT(*) AS c FROM messages WHERE recipient_id = ? AND read_at IS NULL GROUP BY sender_id',
    [req.user.id],
  );
  const unreadBy = new Map(unreadRows.map((r) => [r.sender_id, Number(r.c)]));

  const convos = [];
  for (const p of pairs) {
    const u = await get('SELECT id, name, role FROM users WHERE id = ?', [p.other_id]);
    if (!u) continue;
    const last = await get(
      `SELECT * FROM messages
        WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
          AND created_at = ?
        ORDER BY id LIMIT 1`,
      [req.user.id, u.id, u.id, req.user.id, p.last_at],
    );
    if (!last) continue;
    convos.push({
      user: await chatUser(u),
      lastMessage: previewOf(last),
      lastKind: last.kind || 'text',
      lastAt: last.created_at,
      lastFromMe: last.sender_id === req.user.id,
      // Only meaningful on your own last message, but always sent so the list
      // doesn't have to ask a second question to draw one tick.
      lastRead: !!last.read_at,
      lastDelivered: !!(last.delivered_at || last.read_at),
      unread: unreadBy.get(u.id) ?? 0,
      online: isOnline(u.id),
    });
  }
  res.json(convos);
}));

/**
 * Mark everything from one person as delivered, and tell them so.
 *
 * "Delivered" means the bytes reached a device this person is signed in on —
 * which is exactly what fetching the thread, or receiving it over the live
 * stream, proves. The sender is told, because a single tick that never becomes
 * two is how you find out a message went nowhere.
 */
async function markDelivered(recipientId, senderId) {
  const pending = await all(
    'SELECT id FROM messages WHERE recipient_id = ? AND sender_id = ? AND delivered_at IS NULL',
    [recipientId, senderId],
  );
  if (pending.length === 0) return;
  const at = new Date().toISOString();
  await run(
    'UPDATE messages SET delivered_at = ? WHERE recipient_id = ? AND sender_id = ? AND delivered_at IS NULL',
    [at, recipientId, senderId],
  );
  emit(senderId, 'receipt', { state: 'delivered', by: recipientId, at, ids: pending.map((r) => r.id) });
}

/**
 * One conversation.
 *
 * Three shapes, one route:
 *   (no cursor)    the most recent page — what opening a chat needs
 *   ?before=<iso>  the page above that — what scrolling up needs
 *   ?since=<iso>   only what has changed — what staying current needs
 *
 * The last one is the point. The thread used to be re-downloaded in full every
 * four seconds; on a long conversation over a metered bundle that is real money
 * taken from the person least able to spend it. `since` is inclusive and the
 * client deduplicates by id, deliberately: an exclusive cursor has to be exactly
 * right or it skips a message, while a duplicate the client discards costs
 * nothing.
 *
 * Loading the thread no longer marks it read. It marks it delivered. Read is an
 * explicit statement that the messages were put in front of someone — see
 * POST /api/messages/read.
 */
const THREAD_PAGE = 40;
app.get('/api/messages/thread/:userId', requireAuth, asyncH(async (req, res) => {
  const u = await get('SELECT id, name, role FROM users WHERE id = ?', [req.params.userId]);
  if (!u) return res.status(404).json({ error: 'That person is no longer on Vuka.' });

  const limit = Math.min(Math.max(Number(req.query.limit) || THREAD_PAGE, 1), 100);
  const pair = [req.user.id, u.id, u.id, req.user.id];
  const where = '((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))';

  let rows;
  let hasMore = false;
  if (req.query.since) {
    /* Everything at or after the cursor, oldest first. Deliberately no small
       page size: what changed since a few seconds ago is tiny by definition,
       and truncating it would silently drop the tail. */
    rows = await all(
      `SELECT * FROM messages WHERE ${where} AND created_at >= ? ORDER BY created_at ASC LIMIT 200`,
      [...pair, String(req.query.since)],
    );
  } else {
    /* Newest page, or the page above `before`. Fetched descending so the
       database can stop early, then flipped for the client. */
    const clause = req.query.before ? `${where} AND created_at < ?` : where;
    const params = req.query.before ? [...pair, String(req.query.before)] : pair;
    const page = await all(
      `SELECT * FROM messages WHERE ${clause} ORDER BY created_at DESC LIMIT ?`,
      [...params, limit + 1],
    );
    hasMore = page.length > limit;
    rows = page.slice(0, limit).reverse();
  }

  await markDelivered(req.user.id, u.id);

  /* A reply can quote a message older than the page being sent, so parents are
     looked up rather than assumed to be in hand. */
  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = [...new Set(rows.map((r) => r.reply_to_id).filter((pid) => pid && !byId.has(pid)))];
  if (missing.length) {
    const holes = missing.map(() => '?').join(',');
    for (const p of await all(`SELECT * FROM messages WHERE id IN (${holes})`, missing)) byId.set(p.id, p);
  }
  const files = await attachmentsFor(rows);

  const block = await eitherBlocked(req.user.id, u.id);
  res.json({
    other: await chatUser(u),
    /* Their presence is not the blocked person's business, and not much use to
       the blocker either — nobody is expecting a reply through a block. */
    online: block.any ? false : isOnline(u.id),
    /* Only the blocker is told. The other side gets "blocked: false" and a
       refusal if they try to send, which is as much as they should learn. */
    blocked: block.iBlocked,
    messages: rows.map((r) => msgOut(r, r.reply_to_id ? byId.get(r.reply_to_id) ?? null : null, files.get(r.attachment_id) ?? null)),
    hasMore,
    editWindowMinutes: MESSAGE_EDIT_WINDOW_MIN,
    voiceMaxMs: VOICE_MAX_MS,
    attachMaxBytes: ATTACH_MAX_BYTES,
  });
}));

/**
 * Everything new for me, across every conversation.
 *
 * What the app asks for when it comes back from being closed, and what the live
 * stream degrades to when it cannot connect. One request instead of one per
 * open thread.
 */
app.get('/api/messages/sync', requireAuth, asyncH(async (req, res) => {
  const since = String(req.query.since || '');
  const rows = since
    ? await all(
      `SELECT * FROM messages
        WHERE (recipient_id = ? OR sender_id = ?) AND created_at >= ?
        ORDER BY created_at ASC LIMIT 200`,
      [req.user.id, req.user.id, since],
    )
    : [];

  for (const s of [...new Set(rows.filter((r) => r.recipient_id === req.user.id).map((r) => r.sender_id))]) {
    await markDelivered(req.user.id, s);
  }

  const files = await attachmentsFor(rows);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const unread = Number((await get('SELECT COUNT(*) AS c FROM messages WHERE recipient_id = ? AND read_at IS NULL', [req.user.id])).c);

  res.json({
    now: new Date().toISOString(),
    unread,
    messages: rows.map((r) => msgOut(r, r.reply_to_id ? byId.get(r.reply_to_id) ?? null : null, files.get(r.attachment_id) ?? null)),
  });
}));

/**
 * Say that you have actually read them.
 *
 * Separate from loading the thread on purpose. A GET that changes state is
 * wrong on its own terms, but the real reason is that fetching a conversation
 * and reading it are different events: the app syncs threads in the background,
 * and every one of those syncs used to tell the other person their message had
 * been read by somebody who was not looking at it.
 */
app.post('/api/messages/read', requireAuth, asyncH(async (req, res) => {
  const otherId = String(req.body?.userId || '');
  if (!otherId) return res.status(400).json({ error: 'Which conversation?' });
  const upTo = req.body?.upTo ? String(req.body.upTo) : null;

  const params = [req.user.id, otherId];
  const clause = upTo ? 'AND created_at <= ?' : '';
  if (upTo) params.push(upTo);

  const affected = await all(
    `SELECT id FROM messages WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL ${clause}`,
    params,
  );
  if (affected.length) {
    const at = new Date().toISOString();
    await run(
      `UPDATE messages SET read_at = ?, delivered_at = COALESCE(delivered_at, ?)
        WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL ${clause}`,
      [at, at, ...params],
    );
    emit(otherId, 'receipt', { state: 'read', by: req.user.id, at, ids: affected.map((r) => r.id) });
  }
  const unread = Number((await get('SELECT COUNT(*) AS c FROM messages WHERE recipient_id = ? AND read_at IS NULL', [req.user.id])).c);
  res.json({ ok: true, marked: affected.length, unread });
}));

/**
 * "…is typing".
 *
 * Never stored. It is true for about three seconds and then it is a lie, so
 * writing it down would only create something that has to be cleaned up again.
 * If nobody is listening it evaporates, which is the correct outcome.
 */
app.post('/api/messages/typing', requireAuth, asyncH(async (req, res) => {
  const toUserId = String(req.body?.toUserId || '');
  // A blocked person must not still appear to be typing on the other screen.
  if (toUserId && toUserId !== req.user.id && !(await eitherBlocked(req.user.id, toUserId)).any) {
    emit(toUserId, 'typing', { from: req.user.id, at: new Date().toISOString() });
  }
  res.json({ ok: true });
}));

/**
 * The app saying whether it is in front of someone.
 *
 * Sent when the tab is hidden or shown, and when the app is closing. Not
 * stored: it is true for as long as the stream it describes, and the stream
 * closing says the same thing more reliably.
 *
 * Without this, a backgrounded tab held its stream open and so went on
 * counting as present — the other side kept seeing Online, and the send path
 * skipped the push notification because the recipient was "already here".
 */
app.post('/api/messages/presence', requireAuth, asyncH(async (req, res) => {
  setVisibility(req.user.id, req.body?.visible !== false);
  res.json({ ok: true, online: isOnline(req.user.id) });
}));

/**
 * Send a message: a line of text, a voice note, or a photo.
 *
 * `clientId` is what makes this safe to retry. The app mints one before the
 * first attempt and reuses it for every retry of that same message, so a reply
 * sent on a moving taxi — where the request lands but the answer never comes
 * back — is recognised on the second try and returned rather than posted twice.
 * The unique index does the real work; this is the friendly path to the same
 * answer.
 */
app.post('/api/messages', requireAuth, asyncH(async (req, res) => {
  const { toUserId, body, replyToId, clientId, attachmentId } = req.body || {};
  const text = (body || '').toString().trim();

  if (toUserId === req.user.id) return res.status(400).json({ error: "You can't message yourself." });
  const other = await get('SELECT id, name FROM users WHERE id = ?', [toUserId]);
  if (!other) return res.status(404).json({ error: 'That person is no longer on Vuka.' });

  const refusal = await blockRefusal(req.user.id, toUserId);
  if (refusal) return res.status(403).json(refusal);

  const cid = clientId ? String(clientId).slice(0, 64) : null;
  if (cid) {
    const existing = await get('SELECT * FROM messages WHERE sender_id = ? AND client_id = ?', [req.user.id, cid]);
    if (existing) {
      const parent = existing.reply_to_id ? await get('SELECT * FROM messages WHERE id = ?', [existing.reply_to_id]) : null;
      const file = existing.attachment_id ? await get('SELECT * FROM attachments WHERE id = ?', [existing.attachment_id]) : null;
      // 200, not 201: nothing was created this time round.
      return res.json(msgOut(existing, parent, file));
    }
  }

  /* Claim the attachment here rather than trusting the id. It has to be one
     this account uploaded and has not already sent — otherwise any id would let
     someone re-send a stranger's recording as their own. */
  let file = null;
  if (attachmentId) {
    file = await get('SELECT * FROM attachments WHERE id = ?', [String(attachmentId)]);
    if (!file || file.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'That recording is no longer available. Please try again.' });
    }
    if (file.message_id) return res.status(409).json({ error: 'That recording has already been sent.' });
  }

  if (!text && !file) return res.status(400).json({ error: 'Type a message first.' });

  /* A reply must point at a message from THIS conversation. Without that check
     any id would do, and the quoted snippet would happily surface a line from
     someone else's thread to a stranger. */
  let parent = null;
  if (replyToId) {
    parent = await get('SELECT * FROM messages WHERE id = ?', [replyToId]);
    const inThisThread = parent
      && ((parent.sender_id === req.user.id && parent.recipient_id === toUserId)
        || (parent.sender_id === toUserId && parent.recipient_id === req.user.id));
    if (!inThisThread) return res.status(400).json({ error: "That message isn't part of this conversation." });
  }

  const id = uuid();
  const kind = file ? file.kind : 'text';
  try {
    await run(
      `INSERT INTO messages (id, sender_id, recipient_id, body, reply_to_id, created_at, client_id, kind, attachment_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, req.user.id, toUserId, text.slice(0, 2000), parent?.id ?? null, chatNow(), cid, kind, file?.id ?? null],
    );
  } catch (e) {
    /* Two retries of the same message arriving together: one inserted, this one
       lost the unique index. That is deduplication working, so answer with the
       row that won rather than with an error. */
    const won = cid ? await get('SELECT * FROM messages WHERE sender_id = ? AND client_id = ?', [req.user.id, cid]) : null;
    if (!won) throw e;
    const wonFile = won.attachment_id ? await get('SELECT * FROM attachments WHERE id = ?', [won.attachment_id]) : null;
    return res.json(msgOut(won, parent, wonFile));
  }

  if (file) await run('UPDATE attachments SET message_id = ? WHERE id = ?', [id, file.id]);

  const saved = await get('SELECT * FROM messages WHERE id = ?', [id]);
  const out = msgOut(saved, parent, file);

  /* Deliver down every stream they have open, including backgrounded ones —
     the message should be waiting when they come back.

     But the NOTIFICATION decides on whether anyone is actually looking. This
     used to test the socket count, so a tab left open in the background
     suppressed the push and the message arrived to silence. A buzz about a
     line already on screen is noise; a buzz about one nobody has seen is the
     whole point. */
  const live = emit(toUserId, 'message', out);
  // It reached a device, so it is delivered — whether or not anyone is looking.
  if (live > 0) await markDelivered(toUserId, req.user.id);
  if (!isOnline(toUserId)) {
    const me = await userById(req.user.id);
    void notifyUser(toUserId, {
      type: 'message',
      title: me?.name || 'New message',
      body: previewOf(saved).slice(0, 140),
      url: `/?tab=messages&chat=${req.user.id}`,
      /* One notification per conversation, replaced as it goes — twenty
         separate buzzes from one person is how people switch notifications
         off altogether. */
      tag: `chat-${req.user.id}`,
    }).catch((e) => captureError(e, 'notifyUser:message'));
  }
  // Their own other devices should show it too.
  emit(req.user.id, 'message', out);

  res.status(201).json(out);
}));

/**
 * Edit what you said.
 *
 * Sender-only and time-boxed, and the result is always marked `editedAt`. These
 * threads are where a rate and a start time get agreed, so silently rewritable
 * history would be a genuine hazard — the window plus the mark mean a
 * correction stays possible while a quiet rewrite does not.
 */
app.patch('/api/messages/:id', requireAuth, asyncH(async (req, res) => {
  const m = await get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'That message no longer exists.' });
  if (m.sender_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own messages.' });
  if (m.deleted_at) return res.status(409).json({ error: "You can't edit a deleted message." });
  if (m.kind === 'voice') return res.status(409).json({ error: "A voice note can't be edited. Delete it and record another." });

  const text = (req.body?.body ?? '').toString().trim();
  if (!text) return res.status(400).json({ error: 'A message can\'t be empty — delete it instead.' });

  const ageMin = (Date.now() - new Date(m.created_at).getTime()) / 60_000;
  if (ageMin > MESSAGE_EDIT_WINDOW_MIN) {
    return res.status(409).json({ error: `Messages can only be edited for ${MESSAGE_EDIT_WINDOW_MIN} minutes after sending. Send a correction instead.` });
  }

  const now = new Date().toISOString();
  await run('UPDATE messages SET body = ?, edited_at = ? WHERE id = ?', [text.slice(0, 2000), now, m.id]);
  const updated = await get('SELECT * FROM messages WHERE id = ?', [m.id]);
  const parent = updated.reply_to_id ? await get('SELECT * FROM messages WHERE id = ?', [updated.reply_to_id]) : null;
  const file = updated.attachment_id ? await get('SELECT * FROM attachments WHERE id = ?', [updated.attachment_id]) : null;
  const out = msgOut(updated, parent, file);
  emit(m.recipient_id, 'message-changed', out);
  emit(m.sender_id, 'message-changed', out);
  res.json(out);
}));

/**
 * Withdraw a message for both sides.
 *
 * Soft, always: the row stays so replies quoting it still resolve and the
 * thread keeps its shape, but the body is dropped at the database and never
 * serialised again. A tombstone is also the honest outcome here — the other
 * person already read it, and pretending it was never sent would be worse than
 * showing that it was taken back.
 *
 * The bytes are a different matter. A withdrawn voice note has to actually stop
 * existing, not merely stop being linked to, so the attachment row goes.
 */
app.delete('/api/messages/:id', requireAuth, asyncH(async (req, res) => {
  const m = await get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'That message no longer exists.' });
  if (m.sender_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own messages.' });
  if (m.deleted_at) return res.json(msgOut(m));

  await run("UPDATE messages SET deleted_at = ?, body = '' WHERE id = ?", [new Date().toISOString(), m.id]);
  if (m.attachment_id) await run('DELETE FROM attachments WHERE id = ?', [m.attachment_id]);

  const out = msgOut(await get('SELECT * FROM messages WHERE id = ?', [m.id]));
  emit(m.recipient_id, 'message-changed', out);
  emit(m.sender_id, 'message-changed', out);
  res.json(out);
}));

/* ---- the live channel ----

   EventSource cannot set headers, so the session token cannot travel the way it
   does everywhere else. It is also the wrong thing to put in a URL: query
   strings end up in access logs, and this one would be a thirty-day session. So
   the app trades its token for a ticket that is good for sixty seconds and
   opens nothing but this stream. */
app.post('/api/events/ticket', requireAuth, asyncH(async (req, res) => {
  res.json({ ticket: signPurposeToken('sse', { sub: req.user.id, role: req.user.role }, 60), expiresIn: 60 });
}));

app.get('/api/events', asyncH(async (req, res) => {
  const payload = verifyPurposeToken(String(req.query.ticket || ''), 'sse');
  if (!payload?.sub) return res.status(401).json({ error: 'This live connection expired. Reconnecting…' });
  /* The same session check requireAuth does: a password reset ends every
     session, and a stream that outlived one would keep delivering messages
     into it. */
  const row = await get('SELECT sessions_valid_from FROM users WHERE id = ?', [payload.sub]);
  if (!row) return res.status(401).json({ error: 'Your account could not be found. Please sign in again.' });
  if (row.sessions_valid_from && Number(payload.iat) < Number(row.sessions_valid_from)) {
    return res.status(401).json({ error: 'Your password was changed, so this session ended. Please sign in again.' });
  }
  /* A stream can legitimately open while the app is in the background —
     the client rebuilds it on waking — so the connection carries that
     fact rather than the server assuming someone is watching. */
  subscribe(payload.sub, req, res, req.query.hidden !== '1');
}));

/* ---- presence fan-out ----

   Telling the people in a conversation with someone that they have arrived or
   gone. Before this the app asked once, when a thread was opened, and then
   never again — so a status that changed while you were reading stayed wrong
   until you left the screen and came back. That is precisely how it was
   reported: "I might move to another tab and come back to only then see
   offline."

   Only their existing chat partners are told, and only those with a stream
   open right now. Presence is not public: nobody learns whether a stranger is
   at their phone, and a block hides it in both directions, matching what
   GET /api/messages/:id already returns.

   One indexed query per transition. Transitions are a handful per person per
   session — opening the app, backgrounding it, closing it — not per message.
*/
onPresenceChange((userId, online) => {
  void (async () => {
    const partners = await all(
      `SELECT DISTINCT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_id
         FROM messages
        WHERE sender_id = ? OR recipient_id = ?
        LIMIT 200`,
      [userId, userId, userId],
    );
    const at = new Date().toISOString();
    for (const p of partners) {
      const other = p.other_id;
      if (!other || other === userId) continue;
      // Nobody who cannot see the stream needs the event.
      if (!hasStream(other)) continue;
      if ((await eitherBlocked(userId, other)).any) continue;
      emit(other, 'presence', { userId, online, at });
    }
  })().catch((e) => captureError(e, 'presence:fanout'));
});

/* ---- blocking ----

   A safety report goes to a queue and waits for a human. That is the right way
   to get somebody removed, and far too slow to be the only thing available to
   a person being harassed right now — especially now that a conversation can
   carry voice notes and photographs.

   Blocking is the immediate half. It needs nobody's approval and takes effect
   on the next request.

   Both directions are stopped. If A blocks B, B cannot reach A — obviously —
   but neither can A reach B without first undoing it. That is not symmetry for
   its own sake: a one-way block lets someone silence a person's replies while
   continuing to talk at them, which is a worse position than not blocking at
   all. Unblocking is one tap and the history is still there.

   What a block does NOT do: delete the conversation, or hide it. These threads
   are where a rate and a start time were agreed, and someone who has just been
   harassed is exactly the person who may need that record. */

const hasBlock = async (a, b) =>
  !!(await get('SELECT 1 AS x FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [a, b]));

/** Is there a block in either direction between these two? */
async function eitherBlocked(a, b) {
  const row = await get(
    `SELECT
       MAX(CASE WHEN blocker_id = ? THEN 1 ELSE 0 END) AS i_blocked,
       MAX(CASE WHEN blocker_id = ? THEN 1 ELSE 0 END) AS they_blocked
     FROM blocks
     WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
    [a, b, a, b, b, a],
  );
  return {
    iBlocked: !!Number(row?.i_blocked ?? 0),
    theyBlocked: !!Number(row?.they_blocked ?? 0),
    any: !!Number(row?.i_blocked ?? 0) || !!Number(row?.they_blocked ?? 0),
  };
}

/**
 * Why a message cannot be sent, or null.
 *
 * The two sides are told different things on purpose. The person who did the
 * blocking gets a plain statement and a way out, because it is their own
 * decision and they may have forgotten. The person who was blocked is told the
 * message did not go, and nothing about why — confirming a block to someone who
 * has just been blocked is how a bad situation escalates.
 *
 * Silently accepting and dropping it, which is what some messengers do, is the
 * wrong call for this product: a worker who writes "running 20 minutes late"
 * has to know it did not arrive.
 */
async function blockRefusal(me, them) {
  const { iBlocked, theyBlocked } = await eitherBlocked(me, them);
  if (iBlocked) {
    return { error: 'You blocked this person. Unblock them to send a message.', reason: 'you_blocked' };
  }
  if (theyBlocked) {
    return { error: "This message can't be delivered.", reason: 'blocked' };
  }
  return null;
}

/** Block someone. */
app.post('/api/users/:id/block', requireAuth, asyncH(async (req, res) => {
  const target = req.params.id;
  if (target === req.user.id) return res.status(400).json({ error: "You can't block yourself." });
  const u = await userById(target);
  if (!u) return res.status(404).json({ error: 'That person is no longer on Vuka.' });

  if (!(await hasBlock(req.user.id, target))) {
    await run('INSERT INTO blocks (blocker_id, blocked_id, created_at) VALUES (?,?,?)',
      [req.user.id, target, new Date().toISOString()]);
  }

  /* A follow is a standing invitation to see what someone does. Blocking and
     still following them would be an odd thing to leave behind, so both
     directions go. */
  await run('DELETE FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)',
    [req.user.id, target, target, req.user.id]);

  /* Any invitation this employer has outstanding to this worker stops being
     something they have to look at. Declined rather than deleted: the employer
     asked, and the record of that stands. */
  await run("UPDATE invitations SET status = 'declined' WHERE status = 'pending' AND ((employer_id = ? AND worker_id = ?) OR (employer_id = ? AND worker_id = ?))",
    [req.user.id, target, target, req.user.id]);

  res.json({ ok: true, blocked: true });
}));

/** Undo it. */
app.delete('/api/users/:id/block', requireAuth, asyncH(async (req, res) => {
  await run('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [req.user.id, req.params.id]);
  res.json({ ok: true, blocked: false });
}));

/** Everyone this account has blocked, most recent first. */
app.get('/api/me/blocks', requireAuth, asyncH(async (req, res) => {
  const rows = await all(
    `SELECT u.id, u.name, u.role, b.created_at
       FROM blocks b JOIN users u ON u.id = b.blocked_id
      WHERE b.blocker_id = ?
      ORDER BY b.created_at DESC`,
    [req.user.id],
  );
  res.json(await Promise.all(rows.map(async (u) => ({ ...(await chatUser(u)), blockedAt: u.created_at }))));
}));

// ---- follow / social graph ----
const followerCount = async (id) => Number((await get('SELECT COUNT(*) AS c FROM follows WHERE followee_id = ?', [id])).c);
const followingCount = async (id) => Number((await get('SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?', [id])).c);
const amFollowing = async (a, b) => !!(await get('SELECT 1 AS x FROM follows WHERE follower_id = ? AND followee_id = ?', [a, b]));

app.get('/api/me/social', requireAuth, asyncH(async (req, res) => {
  res.json({ followers: await followerCount(req.user.id), following: await followingCount(req.user.id) });
}));

app.get('/api/me/following', requireAuth, asyncH(async (req, res) => {
  const rows = await all('SELECT u.id, u.name, u.role FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ? ORDER BY f.created_at DESC', [req.user.id]);
  res.json(await Promise.all(rows.map((u) => chatUser(u))));
}));

app.get('/api/users/:id/social', requireAuth, asyncH(async (req, res) => {
  const u = await userById(req.params.id);
  if (!u) return res.status(404).json({ error: 'That person is no longer on Vuka.' });
  res.json({ followers: await followerCount(u.id), following: await followingCount(u.id), isFollowing: await amFollowing(req.user.id, u.id) });
}));

app.post('/api/users/:id/follow', requireAuth, asyncH(async (req, res) => {
  const target = req.params.id;
  if (target === req.user.id) return res.status(400).json({ error: "You can't follow yourself." });
  const u = await userById(target);
  if (!u) return res.status(404).json({ error: 'That person is no longer on Vuka.' });
  if ((await eitherBlocked(req.user.id, target)).any) {
    return res.status(403).json({ error: "You can't follow this person.", reason: 'blocked' });
  }
  if (!(await amFollowing(req.user.id, target))) {
    await run('INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)', [req.user.id, target, new Date().toISOString()]);
  }
  res.json({ ok: true, isFollowing: true, followers: await followerCount(target) });
}));

app.delete('/api/users/:id/follow', requireAuth, asyncH(async (req, res) => {
  await run('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?', [req.user.id, req.params.id]);
  res.json({ ok: true, isFollowing: false, followers: await followerCount(req.params.id) });
}));

/* ---- public CV (shareable, no auth) ----
   Shared deliberately, one link at a time, with an employer. Not published.

   A page naming a young person, where they live and everywhere they have
   worked is reasonable when they hand the link over, and not reasonable when
   it surfaces in a search for their name three years later. robots.txt asks
   politely; this header is what actually keeps it out of an index, including
   when the link gets posted somewhere public.

   Age and education level are withheld here for the same reason they are not
   guessed at elsewhere: both are personal information under POPIA with no
   bearing on whether someone can do the work, and age in particular can
   identify a minor. Both still appear on the downloadable CV, which the worker
   hands over on purpose. */
const noIndex = (_req, res, next) => { res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive'); next(); };

app.get('/api/public/cv/:id', noIndex, asyncH(async (req, res) => {
  const u = await userById(req.params.id);
  if (!u || u.role !== 'worker') return res.status(404).json({ error: 'This CV is not available. The link may be old or incorrect.' });
  const { cv, history, profile } = await cvFor(u.id);
  const { age, education, ...publicProfile } = profile ?? {};
  void age; void education;
  res.json({ name: u.name, cv, history, profile: profile ? publicProfile : null, followers: await followerCount(u.id) });
}));

// ---- unknown API routes ----
app.use('/api', (_req, res) => res.status(404).json({ error: 'That endpoint does not exist.' }));

// ---- serve the built front-end (single-service deploy) ----
// STATIC_DIR is resolved in csp.mjs, which has to read index.html at boot to
// hash its inline script — one definition, used by both.
/**
 * Cache policy — this is what makes an installed PWA update predictably.
 *
 * Vite fingerprints everything under /assets (index-A1b2C3.js), so those files
 * can be cached forever: a new build produces new names. But the files that
 * POINT at them — index.html, sw.js, registerSW.js — must be revalidated every
 * time, or a browser or CDN can keep serving a stale service worker and the
 * installed app never notices a deploy. Express's defaults happened to be
 * right; stating the policy means a host or proxy can't quietly change it.
 */
const ALWAYS_FRESH = new Set(['index.html', 'sw.js', 'registerSW.js', 'manifest.webmanifest']);
function staticHeaders(res, path) {
  if (ALWAYS_FRESH.has(basename(path))) res.setHeader('Cache-Control', 'no-cache');
  else if (path.includes(`${sep}assets${sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else res.setHeader('Cache-Control', 'public, max-age=86400');   // icons, fonts
}

if (existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR, { setHeaders: staticHeaders }));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    // The shared-CV route is one HTML shell like every other screen, so the
    // header has to be set by path rather than by what gets rendered into it.
    if (req.path.startsWith('/cv/')) res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.sendFile(join(STATIC_DIR, 'index.html'));
  });
  console.log(`Serving front-end from ${STATIC_DIR}`);
}

// ---- error handler ----
// Every 500 is captured (structured log + ring buffer + Sentry when configured)
// and the caller gets the id back, so "it broke at 14:32" becomes one lookup.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  /* Two of these are the caller's doing, not ours, and reporting them as "went
     wrong on our side" is both untrue and unhelpful — the person who recorded
     a voice note that came out too large has something they can actually do
     about it, but only if they are told which problem they have. */
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'That file is too large to send. Try a shorter recording or a smaller photo.' });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: "That request couldn't be read. Please try again." });
  }
  const ref = captureError(err, `${req.method} ${req.path}`, { role: req.user?.role ?? 'anonymous' });
  res.status(500).json({ error: 'Something went wrong on our side. Please try again in a moment.', ref });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`Vuka API listening on http://localhost:${PORT} (store: ${driver})`));

/* Credit work the employer never came back to confirm. Both sides are told what
   happened: the worker so the silence doesn't read as their job being lost, and
   the employer so an auto-confirmation is never something that quietly happened
   to them. The employer's own rating is untouched — they didn't do anything
   wrong, they just didn't answer. */
/* Abandoned uploads, on their own quarter-hour. Separate from the auto-release
   sweep only so that one failing cannot stop the other. */
const stopAttachmentSweep = (() => {
  const tick = async () => {
    try {
      const gone = await sweepOrphanAttachments();
      if (gone) console.log(`attachments: swept ${gone} upload(s) no message ever claimed`);
    } catch (e) {
      captureError(e, 'attachments:sweep');
    }
  };
  void tick();
  const timer = setInterval(tick, 15 * 60_000);
  timer.unref?.();
  return () => clearInterval(timer);
})();

const stopAutoRelease = startAutoRelease({
  onError: (e) => captureError(e, 'autoRelease:sweep'),
  onRelease: async (job) => {
    const worker = await userById(job.worker_id);
    if (worker) {
      void notifyUser(worker.id, {
        type: 'auto-released',
        title: 'Your job has been counted ✅',
        body: `${job.employer_name} didn't confirm "${job.title}" in time, so we've added it to your CV. It counts as work done — there's just no star rating on this one.`,
        url: '/?tab=cv',
        tag: `auto-released-${job.gig_id}`,
      }).catch((e) => captureError(e, 'notifyUser:auto-released'));
    }
    if (job.employer_id) {
      const employer = await userById(job.employer_id);
      if (employer) {
        void notifyUser(employer.id, {
          type: 'auto-confirmed',
          title: 'We confirmed a job for you',
          body: `"${job.title}" was marked done ${AUTO_RELEASE_HOURS} hours ago and hadn't been confirmed, so we've credited the worker. Rate them next time to help them build their CV.`,
          url: '/?tab=hires',
          tag: `auto-confirmed-${job.gig_id}`,
        }).catch((e) => captureError(e, 'notifyUser:auto-confirmed'));
      }
    }
  },
});

// Graceful shutdown: Render/containers send SIGTERM on deploy or scale-down.
// Stop accepting connections, close the DB, then exit — so no request is cut
// off mid-flight and no DB connection is leaked.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received — shutting down gracefully…`);
  stopAutoRelease();
  stopAttachmentSweep();
  /* An SSE stream never finishes on its own, so server.close() would be waiting
     for something that is never going to happen and the failsafe below would be
     what actually ended the process — taking in-flight requests with it. Drop
     the streams first; the clients reconnect. */
  closeAll();
  server.close(async () => {
    await closeDb();
    console.log('Closed HTTP server and database. Bye.');
    process.exit(0);
  });
  // Failsafe: don't hang forever if a connection won't drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// An error that escapes a route still gets recorded. An uncaught exception
// leaves the process in an unknown state, so we log it and shut down cleanly —
// the host restarts us, which is safer than serving from a broken process.
installProcessHandlers({ onFatal: () => shutdown('uncaughtException') });

export { app };
