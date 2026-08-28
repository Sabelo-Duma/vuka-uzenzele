import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { existsSync } from 'node:fs';
import { basename, dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { all, get, run, initDb, closeDb, driver } from './db.mjs';
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

// Ensure schema + demo data exist before we accept traffic.
await initDb();
await seedIfEmpty();

const app = express();
// Render (and most PaaS) put us behind a reverse proxy. Trust the first hop so
// rate-limiting sees the real client IP (via X-Forwarded-For) and HTTPS is
// detected correctly.
app.set('trust proxy', 1);

// Security headers. CSP and COEP are disabled because this same service also
// serves the SPA + PWA (service worker, inline styles) — a strict CSP here
// would break the front-end. The rest of helmet's protections still apply
// (HSTS, X-Content-Type-Options, frameguard, referrer policy, etc.).
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Request logging (concise in prod, readable in dev). Health-check pings are
// skipped so they don't flood the logs.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: (req) => req.path === '/api/health',
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
  max: 300,                     // ~5 req/s per IP — well above real usage
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

const initialsOf = (name) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- serializers ----
const userOut = (u) => ({ id: u.id, role: u.role, name: u.name, phone: u.phone });
function profileOut(p) {
  if (!p) return null;
  return {
    age: p.age, location: p.location, education: p.education, bio: p.bio,
    skills: JSON.parse(p.skills || '[]'), idVerified: !!p.id_verified,
    color: p.color, joined: p.joined, tagline: p.tagline,
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
const msgOut = (m, parent = null) => ({
  id: m.id,
  senderId: m.sender_id,
  recipientId: m.recipient_id,
  body: m.deleted_at ? '' : m.body,
  createdAt: m.created_at,
  read: !!m.read_at,
  editedAt: m.edited_at ?? null,
  deleted: !!m.deleted_at,
  replyTo: parent
    ? {
      id: parent.id,
      senderId: parent.sender_id,
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

async function cvFor(userId) {
  const profile = await profileOf(userId);
  const history = await historyOf(userId);
  const cv = computeCv(history.map((h) => ({ rating: h.rating, safety_flag: h.safety_flag, category: h.category, pay: h.pay })), !!profile?.id_verified);
  return { cv, history: history.map(historyOut), profile: profileOut(profile) };
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
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  minWage: MIN_WAGE_PER_HOUR,
  store: driver,
  payoutsConfigured: hasEncryptionKey,
  smsConfigured,
  pushConfigured,
  monitoring: monitoringTarget,
  uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
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
const echoCode = (code) => (otpEcho || (process.env.NODE_ENV !== 'production' && !smsConfigured) ? { devCode: code } : {});

app.post('/api/auth/otp', asyncH(async (req, res) => {
  const phone = normPhone(req.body?.phone);
  if (!isPhone(phone)) return res.status(400).json({ error: 'Please enter a valid mobile number.' });

  // Sign-up codes are pointless for a number that already has an account, and
  // saying so here saves the person filling in the whole form first.
  if (await userByPhone(phone)) {
    return res.status(409).json({ error: 'That mobile number is already registered. Try signing in instead.' });
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
      [id, Number(age) || 18, cap(location, 120) || 'South Africa', cap(education, 120) || 'New member',
        cap(bio, 600) || 'New to Vuka and ready to work. Building my reputation one job at a time.',
        JSON.stringify(Array.isArray(skills) && skills.length ? skills : ['cleaning']),
        0, '#0E355A', 'July 2026', 'New member, ready to work.']);
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
  const { phone, password } = req.body || {};
  const user = await userByPhone(phone);
  if (!user) {
    return res.status(401).json({
      error: "We don't have an account for that number yet. Create one — it takes a minute.",
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
  const rows = await all("SELECT * FROM gigs WHERE status = 'open' ORDER BY created_at DESC LIMIT 500");
  const out = await gigsOut(rows, from);
  // "Work near me" is the whole point, so when we know where the viewer is,
  // the closest gig leads. Without a position we keep newest-first.
  if (from) out.sort(byDistance);
  res.json(out);
}));

app.get('/api/gigs/:id', asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
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
            u.id AS user_id, u.name, p.*
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
        age: r.age, location: r.location, tagline: r.tagline, color: r.color || '#0E355A',
        skills: JSON.parse(r.skills || '[]'), idVerified: !!r.id_verified,
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
    void sendSms(worker.phone, `Good news! ${g.employer_name} hired you for "${g.title}" on Vuka Uzenzele. Open the app for the details.`);
    void notifyUser(worker.id, {
      type: 'hired',
      title: "You've been hired! 🎉",
      body: `${g.employer_name} chose you for "${g.title}".`,
      url: '/?tab=jobs',
      tag: `hired-${g.id}`,
    }).catch((e) => captureError(e, 'notifyUser:hired'));
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

  const rating = Math.max(1, Math.min(5, Math.round(Number(req.body?.rating) || 5)));
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
      void sendSms(employer.phone, `${worker?.name ?? 'Your worker'} marked "${g.title}" as done on Vuka Uzenzele. Confirm it in the app to release their reference.`);
      void notifyUser(employer.id, {
        type: 'work-done',
        title: 'Work marked as done',
        body: `${worker?.name ?? 'Your worker'} finished "${g.title}". Confirm to release their reference.`,
        url: '/?tab=hires',
        tag: `done-${g.id}`,
      }).catch((e) => captureError(e, 'notifyUser:work-done'));
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

  const rating = Math.max(1, Math.min(5, Math.round(Number(req.body?.rating) || 5)));
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
    void sendSms(worker.phone, `${g.employer_name} confirmed "${g.title}" and rated you ${rating}/5 on Vuka Uzenzele. Your CV has been updated.`);
    void notifyUser(worker.id, {
      type: 'confirmed',
      title: `${rating}/5 — your CV just grew ⭐`,
      body: `${g.employer_name} confirmed "${g.title}". The reference is on your CV.`,
      url: '/?tab=cv',
      tag: `confirmed-${g.id}`,
    }).catch((e) => captureError(e, 'notifyUser:confirmed'));
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
  if (approve) await run('UPDATE worker_profiles SET id_verified = 1 WHERE user_id = ?', [row.user_id]);
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
  const workers = await all("SELECT u.id, u.name, p.* FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.role = 'worker' AND u.id != ? LIMIT 500", [req.user.id]);
  const list = await Promise.all(workers.map(async (w) => {
    const { cv } = await cvFor(w.id);
    return {
      id: w.id, name: w.name, initials: initialsOf(w.name), age: w.age, location: w.location,
      skills: JSON.parse(w.skills || '[]'), idVerified: !!w.id_verified, color: w.color,
      tagline: w.tagline, rating: cv.avg, jobsDone: cv.jobsDone, tier: cv.tier, badges: cv.earnedBadges,
    };
  }));
  list.sort((a, b) => b.jobsDone - a.jobsDone);
  res.json(list);
}));

app.get('/api/talent/:id', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const w = await get("SELECT u.id, u.name, p.* FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'worker'", [req.params.id]);
  if (!w) return res.status(404).json({ error: 'This worker is no longer available. Browse other verified workers.' });
  const { cv } = await cvFor(w.id);
  res.json({
    id: w.id, name: w.name, initials: initialsOf(w.name), age: w.age, location: w.location,
    skills: JSON.parse(w.skills || '[]'), idVerified: !!w.id_verified, color: w.color,
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
      void sendSms(employer.phone, `${(await userById(req.user.id))?.name ?? 'A worker'} accepted your invitation for "${gig.title}" on Vuka Uzenzele.`);
    }
  }
  res.json({ ok: true, accepted: accept, gigId: inv.gig_id });
}));

// ---- chat / direct messages ----
const chatUser = async (u) => {
  const prof = await get('SELECT color FROM worker_profiles WHERE user_id = ?', [u.id]);
  return { id: u.id, name: u.name, role: u.role, initials: initialsOf(u.name), color: prof?.color || '#0E355A' };
};

// Unread message count (for the nav badge).
app.get('/api/messages/unread-count', requireAuth, asyncH(async (req, res) => {
  const r = await get('SELECT COUNT(*) AS c FROM messages WHERE recipient_id = ? AND read_at IS NULL', [req.user.id]);
  res.json({ count: Number(r.c) });
}));

// Inbox: one entry per conversation partner, newest first.
app.get('/api/messages/conversations', requireAuth, asyncH(async (req, res) => {
  const rows = await all('SELECT * FROM messages WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC', [req.user.id, req.user.id]);
  const byOther = new Map();
  for (const m of rows) {
    const otherId = m.sender_id === req.user.id ? m.recipient_id : m.sender_id;
    let c = byOther.get(otherId);
    if (!c) { c = { otherId, last: null, unread: 0 }; byOther.set(otherId, c); }
    c.last = m; // rows are ascending, so the final assignment is the newest
    if (m.recipient_id === req.user.id && !m.read_at) c.unread++;
  }
  const convos = [];
  for (const c of byOther.values()) {
    const u = await get('SELECT id, name, role FROM users WHERE id = ?', [c.otherId]);
    if (!u) continue;
    convos.push({
      user: await chatUser(u),
      // The inbox preview must respect a deletion too — otherwise the thread
      // shows the tombstone while the list still quotes what was withdrawn.
      lastMessage: c.last.deleted_at ? 'Message deleted' : c.last.body,
      lastAt: c.last.created_at,
      lastFromMe: c.last.sender_id === req.user.id,
      unread: c.unread,
    });
  }
  convos.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  res.json(convos);
}));

// Full thread with one user (and mark their messages to me as read).
app.get('/api/messages/thread/:userId', requireAuth, asyncH(async (req, res) => {
  const u = await get('SELECT id, name, role FROM users WHERE id = ?', [req.params.userId]);
  if (!u) return res.status(404).json({ error: 'That person is no longer on Vuka.' });
  const rows = await all(
    'SELECT * FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?) ORDER BY created_at ASC',
    [req.user.id, u.id, u.id, req.user.id]
  );
  await run('UPDATE messages SET read_at = ? WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL', [new Date().toISOString(), req.user.id, u.id]);
  // Every message in this thread is already in hand, so a reply's parent is a
  // map lookup rather than a query per message.
  const byId = new Map(rows.map((r) => [r.id, r]));
  res.json({
    other: await chatUser(u),
    messages: rows.map((r) => msgOut(r, r.reply_to_id ? byId.get(r.reply_to_id) ?? null : null)),
    editWindowMinutes: MESSAGE_EDIT_WINDOW_MIN,
  });
}));

// Send a message, optionally as a reply to one already in this thread.
app.post('/api/messages', requireAuth, asyncH(async (req, res) => {
  const { toUserId, body, replyToId } = req.body || {};
  const text = (body || '').toString().trim();
  if (!text) return res.status(400).json({ error: 'Type a message first.' });
  if (toUserId === req.user.id) return res.status(400).json({ error: "You can't message yourself." });
  const other = await get('SELECT id FROM users WHERE id = ?', [toUserId]);
  if (!other) return res.status(404).json({ error: 'That person is no longer on Vuka.' });

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
  await run('INSERT INTO messages (id, sender_id, recipient_id, body, reply_to_id, created_at) VALUES (?,?,?,?,?,?)',
    [id, req.user.id, toUserId, text.slice(0, 2000), parent?.id ?? null, new Date().toISOString()]);
  res.status(201).json(msgOut(await get('SELECT * FROM messages WHERE id = ?', [id]), parent));
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
  res.json(msgOut(updated, parent));
}));

/**
 * Withdraw a message for both sides.
 *
 * Soft, always: the row stays so replies quoting it still resolve and the
 * thread keeps its shape, but the body is dropped at the database and never
 * serialised again. A tombstone is also the honest outcome here — the other
 * person already read it, and pretending it was never sent would be worse than
 * showing that it was taken back.
 */
app.delete('/api/messages/:id', requireAuth, asyncH(async (req, res) => {
  const m = await get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'That message no longer exists.' });
  if (m.sender_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own messages.' });
  if (m.deleted_at) return res.json(msgOut(m));

  await run("UPDATE messages SET deleted_at = ?, body = '' WHERE id = ?", [new Date().toISOString(), m.id]);
  res.json(msgOut(await get('SELECT * FROM messages WHERE id = ?', [m.id])));
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
  if (!(await amFollowing(req.user.id, target))) {
    await run('INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)', [req.user.id, target, new Date().toISOString()]);
  }
  res.json({ ok: true, isFollowing: true, followers: await followerCount(target) });
}));

app.delete('/api/users/:id/follow', requireAuth, asyncH(async (req, res) => {
  await run('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?', [req.user.id, req.params.id]);
  res.json({ ok: true, isFollowing: false, followers: await followerCount(req.params.id) });
}));

// ---- public CV (shareable, no auth) ----
app.get('/api/public/cv/:id', asyncH(async (req, res) => {
  const u = await userById(req.params.id);
  if (!u || u.role !== 'worker') return res.status(404).json({ error: 'This CV is not available. The link may be old or incorrect.' });
  const { cv, history, profile } = await cvFor(u.id);
  res.json({ name: u.name, cv, history, profile, followers: await followerCount(u.id) });
}));

// ---- unknown API routes ----
app.use('/api', (_req, res) => res.status(404).json({ error: 'That endpoint does not exist.' }));

// ---- serve the built front-end (single-service deploy) ----
const here = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = process.env.VUKA_STATIC || join(here, '..', '..', 'vuka-app', 'dist');
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
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(join(STATIC_DIR, 'index.html'));
  });
  console.log(`Serving front-end from ${STATIC_DIR}`);
}

// ---- error handler ----
// Every 500 is captured (structured log + ring buffer + Sentry when configured)
// and the caller gets the id back, so "it broke at 14:32" becomes one lookup.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
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
