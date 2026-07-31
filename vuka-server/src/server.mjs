import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { all, get, run, initDb, driver } from './db.mjs';
import { seedIfEmpty } from './seed.mjs';
import { hashPassword, verifyPassword, signToken, requireAuth, requireRole, uuid } from './auth.mjs';
import { computeCv, autoReview, MIN_WAGE_PER_HOUR } from './engine.mjs';

// Ensure schema + demo data exist before we accept traffic.
await initDb();
await seedIfEmpty();

const app = express();
// CORS: same-origin single-service deploys need none. If you split the
// front-end onto another origin, set VUKA_CORS_ORIGIN (comma-separated).
const corsOrigin = process.env.VUKA_CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((s) => s.trim()) } : {}));
app.use(express.json());

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
  };
}
function gigOut(g) {
  return {
    id: g.id, title: g.title, category: g.category, employer: g.employer_name,
    employerId: g.employer_id, employerInitials: g.employer_initials, employerRating: g.employer_rating,
    location: g.location, distanceKm: g.distance_km, hours: g.hours, payPerHour: g.pay_per_hour,
    when: g.when_text, description: g.description, urgent: !!g.urgent, status: g.status,
  };
}
const msgOut = (m) => ({ id: m.id, senderId: m.sender_id, recipientId: m.recipient_id, body: m.body, createdAt: m.created_at, read: !!m.read_at });
function formalOut(f) {
  return {
    id: f.id, title: f.title, category: f.category, employer: f.employer, employerInitials: f.employer_initials,
    minTier: f.min_tier, type: f.type, location: f.location, distanceKm: f.distance_km,
    salary: f.salary, education: f.education, description: f.description, perks: JSON.parse(f.perks || '[]'),
  };
}

// ---- query helpers ----
const userByPhone = (phone) => get('SELECT * FROM users WHERE phone = ?', [phone]);
const userById = (id) => get('SELECT * FROM users WHERE id = ?', [id]);
const profileOf = (id) => get('SELECT * FROM worker_profiles WHERE user_id = ?', [id]);
const historyOf = (id) => all('SELECT * FROM history WHERE worker_id = ? ORDER BY created_at ASC', [id]);

async function cvFor(userId) {
  const profile = await profileOf(userId);
  const history = await historyOf(userId);
  const cv = computeCv(history.map((h) => ({ rating: h.rating, safety_flag: h.safety_flag, category: h.category, pay: h.pay })), !!profile?.id_verified);
  return { cv, history: history.map(historyOut), profile: profileOut(profile) };
}

// ---- health ----
app.get('/api/health', (_req, res) => res.json({ ok: true, minWage: MIN_WAGE_PER_HOUR, store: driver }));

// ---- auth ----
app.post('/api/auth/register', asyncH(async (req, res) => {
  const { role, name, phone, password } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!phone || String(phone).replace(/\D/g, '').length < 9) return res.status(400).json({ error: 'Please enter a valid mobile number.' });
  if (!password || password.length < 4) return res.status(400).json({ error: 'Please choose a password of at least 4 characters.' });
  if (role !== 'worker' && role !== 'employer') return res.status(400).json({ error: 'Please choose whether you want to work or hire.' });
  if (await userByPhone(phone)) return res.status(409).json({ error: 'That mobile number is already registered. Try signing in instead.' });

  const id = uuid();
  await run('INSERT INTO users (id, role, phone, password_hash, name, created_at) VALUES (?,?,?,?,?,?)',
    [id, role, phone, hashPassword(password), name.trim(), new Date().toISOString()]);

  if (role === 'worker') {
    const { age, location, education, bio, skills, idVerified } = req.body;
    await run('INSERT INTO worker_profiles (user_id, age, location, education, bio, skills, id_verified, color, joined, tagline) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, Number(age) || 18, location || 'South Africa', education || 'New member',
        bio || 'New to Vuka and ready to work. Building my reputation one job at a time.',
        JSON.stringify(Array.isArray(skills) && skills.length ? skills : ['cleaning']),
        idVerified ? 1 : 0, '#0E355A', 'July 2026', 'New member, ready to work.']);
  }

  const user = await userById(id);
  const extra = role === 'worker' ? await cvFor(id) : {};
  res.status(201).json({ token: signToken(user), user: userOut(user), ...extra });
}));

app.post('/api/auth/login', asyncH(async (req, res) => {
  const { phone, password } = req.body || {};
  const user = await userByPhone(phone);
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'That mobile number or password is incorrect. Please try again.' });
  }
  const extra = user.role === 'worker' ? await cvFor(user.id) : {};
  res.json({ token: signToken(user), user: userOut(user), ...extra });
}));

app.get('/api/auth/me', requireAuth, asyncH(async (req, res) => {
  const user = await userById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Your account could not be found. Please sign in again.' });
  const extra = user.role === 'worker' ? await cvFor(user.id) : {};
  res.json({ user: userOut(user), ...extra });
}));

// ---- gigs ----
app.get('/api/gigs', asyncH(async (_req, res) => {
  const rows = await all("SELECT * FROM gigs WHERE status = 'open' ORDER BY created_at DESC");
  res.json(rows.map(gigOut));
}));

app.get('/api/gigs/:id', asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!g) return res.status(404).json({ error: 'This gig is no longer available. Browse other gigs near you.' });
  res.json(gigOut(g));
}));

app.post('/api/gigs', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const { title, category, hours, payPerHour, location, when, description, urgent } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Please give your job a title.' });
  const user = await userById(req.user.id);
  const id = uuid();
  await run('INSERT INTO gigs (id, employer_id, title, category, employer_name, employer_initials, employer_rating, location, distance_km, hours, pay_per_hour, when_text, description, urgent, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [id, user.id, title.trim(), category || 'errands', user.name, initialsOf(user.name), 5.0,
      location || 'Soweto', 1.5, Number(hours) || 2, Number(payPerHour) || 50,
      when || 'Flexible', description || '', urgent ? 1 : 0, 'open', new Date().toISOString()]);
  res.status(201).json(gigOut(await get('SELECT * FROM gigs WHERE id = ?', [id])));
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

app.post('/api/gigs/:id/complete', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const g = await get('SELECT * FROM gigs WHERE id = ?', [req.params.id]);
  if (!g) return res.status(404).json({ error: 'This gig could not be found. It may already be complete.' });
  const rating = Math.max(1, Math.min(5, Math.round(Number(req.body?.rating) || 5)));
  const safetyFlag = req.body?.safetyFlag ? 1 : 0;

  await run('INSERT INTO history (id, worker_id, job_title, category, employer, employer_initials, date, hours, pay, rating, review, safety_flag, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [uuid(), req.user.id, g.title, g.category, g.employer_name, g.employer_initials,
      (g.when_text.split('·')[0] || 'Jul 2026').trim(), g.hours, Math.round(g.hours * g.pay_per_hour),
      rating, autoReview(rating), safetyFlag, new Date().toISOString()]);

  await run("UPDATE gigs SET status = 'filled' WHERE id = ?", [g.id]);
  await run("UPDATE applications SET status = 'completed' WHERE gig_id = ? AND worker_id = ?", [g.id, req.user.id]);

  // learn the new skill
  const profile = await profileOf(req.user.id);
  if (profile) {
    const skills = JSON.parse(profile.skills || '[]');
    if (!skills.includes(g.category)) {
      skills.push(g.category);
      await run('UPDATE worker_profiles SET skills = ? WHERE user_id = ?', [JSON.stringify(skills), req.user.id]);
    }
  }
  res.json(await cvFor(req.user.id));
}));

// ---- formal jobs ----
app.get('/api/formal-jobs', asyncH(async (_req, res) => {
  const rows = await all('SELECT * FROM formal_jobs ORDER BY min_tier ASC');
  res.json(rows.map(formalOut));
}));

// ---- worker cv ----
app.get('/api/me/cv', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  res.json(await cvFor(req.user.id));
}));

// ---- talent (employer) ----
app.get('/api/talent', requireAuth, requireRole('employer'), asyncH(async (req, res) => {
  const workers = await all("SELECT u.id, u.name, p.* FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.role = 'worker' AND u.id != ?", [req.user.id]);
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
  res.json(rows.map(gigOut));
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
  res.json(rows.map((r) => ({ id: r.inv_id, message: r.inv_message, gig: gigOut(r) })));
}));

app.post('/api/invitations/:id/respond', requireAuth, requireRole('worker'), asyncH(async (req, res) => {
  const inv = await get('SELECT * FROM invitations WHERE id = ? AND worker_id = ?', [req.params.id, req.user.id]);
  if (!inv) return res.status(404).json({ error: 'This invitation is no longer available.' });
  const accept = !!req.body?.accept;
  await run('UPDATE invitations SET status = ? WHERE id = ?', [accept ? 'accepted' : 'declined', inv.id]);
  if (accept) {
    const existingApp = await get('SELECT * FROM applications WHERE gig_id = ? AND worker_id = ?', [inv.gig_id, req.user.id]);
    if (!existingApp) {
      await run('INSERT INTO applications (id, gig_id, worker_id, status, created_at) VALUES (?,?,?,?,?)',
        [uuid(), inv.gig_id, req.user.id, 'applied', new Date().toISOString()]);
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
    convos.push({ user: await chatUser(u), lastMessage: c.last.body, lastAt: c.last.created_at, lastFromMe: c.last.sender_id === req.user.id, unread: c.unread });
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
  res.json({ other: await chatUser(u), messages: rows.map(msgOut) });
}));

// Send a message.
app.post('/api/messages', requireAuth, asyncH(async (req, res) => {
  const { toUserId, body } = req.body || {};
  const text = (body || '').toString().trim();
  if (!text) return res.status(400).json({ error: 'Type a message first.' });
  if (toUserId === req.user.id) return res.status(400).json({ error: "You can't message yourself." });
  const other = await get('SELECT id FROM users WHERE id = ?', [toUserId]);
  if (!other) return res.status(404).json({ error: 'That person is no longer on Vuka.' });
  const id = uuid();
  await run('INSERT INTO messages (id, sender_id, recipient_id, body, created_at) VALUES (?,?,?,?,?)',
    [id, req.user.id, toUserId, text.slice(0, 2000), new Date().toISOString()]);
  res.status(201).json(msgOut(await get('SELECT * FROM messages WHERE id = ?', [id])));
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
if (existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  app.get('*', (_req, res) => res.sendFile(join(STATIC_DIR, 'index.html')));
  console.log(`Serving front-end from ${STATIC_DIR}`);
}

// ---- error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again in a moment.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Vuka API listening on http://localhost:${PORT} (store: ${driver})`));

export { app };
