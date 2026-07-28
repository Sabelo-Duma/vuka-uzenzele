import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.mjs';
import { seedIfEmpty } from './seed.mjs';
import { hashPassword, verifyPassword, signToken, requireAuth, requireRole, uuid } from './auth.mjs';
import { computeCv, autoReview, MIN_WAGE_PER_HOUR } from './engine.mjs';

seedIfEmpty();

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
    employerInitials: g.employer_initials, employerRating: g.employer_rating,
    location: g.location, distanceKm: g.distance_km, hours: g.hours, payPerHour: g.pay_per_hour,
    when: g.when_text, description: g.description, urgent: !!g.urgent, status: g.status,
  };
}
function formalOut(f) {
  return {
    id: f.id, title: f.title, category: f.category, employer: f.employer, employerInitials: f.employer_initials,
    minTier: f.min_tier, type: f.type, location: f.location, distanceKm: f.distance_km,
    salary: f.salary, education: f.education, description: f.description, perks: JSON.parse(f.perks || '[]'),
  };
}

// ---- queries ----
const qUserByPhone = db.prepare('SELECT * FROM users WHERE phone = ?');
const qUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const qProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?');
const qHistory = db.prepare('SELECT * FROM history WHERE worker_id = ? ORDER BY created_at ASC');

function cvFor(userId) {
  const profile = qProfile.get(userId);
  const history = qHistory.all(userId);
  const cv = computeCv(history.map((h) => ({ rating: h.rating, safety_flag: h.safety_flag, category: h.category, pay: h.pay })), !!profile?.id_verified);
  return { cv, history: history.map(historyOut), profile: profileOut(profile) };
}

// ---- health ----
app.get('/api/health', (_req, res) => res.json({ ok: true, minWage: MIN_WAGE_PER_HOUR }));

// ---- auth ----
app.post('/api/auth/register', asyncH((req, res) => {
  const { role, name, phone, password } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!phone || String(phone).replace(/\D/g, '').length < 9) return res.status(400).json({ error: 'Please enter a valid mobile number.' });
  if (!password || password.length < 4) return res.status(400).json({ error: 'Please choose a password of at least 4 characters.' });
  if (role !== 'worker' && role !== 'employer') return res.status(400).json({ error: 'Please choose whether you want to work or hire.' });
  if (qUserByPhone.get(phone)) return res.status(409).json({ error: 'That mobile number is already registered. Try signing in instead.' });

  const id = uuid();
  db.prepare('INSERT INTO users (id, role, phone, password_hash, name, created_at) VALUES (?,?,?,?,?,?)')
    .run(id, role, phone, hashPassword(password), name.trim(), new Date().toISOString());

  if (role === 'worker') {
    const { age, location, education, bio, skills, idVerified } = req.body;
    db.prepare('INSERT INTO worker_profiles (user_id, age, location, education, bio, skills, id_verified, color, joined, tagline) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, Number(age) || 18, location || 'South Africa', education || 'New member',
        bio || 'New to Vuka and ready to work. Building my reputation one job at a time.',
        JSON.stringify(Array.isArray(skills) && skills.length ? skills : ['cleaning']),
        idVerified ? 1 : 0, '#0E355A', 'July 2026', 'New member, ready to work.');
  }

  const user = qUserById.get(id);
  const extra = role === 'worker' ? cvFor(id) : {};
  res.status(201).json({ token: signToken(user), user: userOut(user), ...extra });
}));

app.post('/api/auth/login', asyncH((req, res) => {
  const { phone, password } = req.body || {};
  const user = qUserByPhone.get(phone);
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'That mobile number or password is incorrect. Please try again.' });
  }
  const extra = user.role === 'worker' ? cvFor(user.id) : {};
  res.json({ token: signToken(user), user: userOut(user), ...extra });
}));

app.get('/api/auth/me', requireAuth, asyncH((req, res) => {
  const user = qUserById.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Your account could not be found. Please sign in again.' });
  const extra = user.role === 'worker' ? cvFor(user.id) : {};
  res.json({ user: userOut(user), ...extra });
}));

// ---- gigs ----
app.get('/api/gigs', asyncH((_req, res) => {
  const rows = db.prepare("SELECT * FROM gigs WHERE status = 'open' ORDER BY created_at DESC").all();
  res.json(rows.map(gigOut));
}));

app.get('/api/gigs/:id', asyncH((req, res) => {
  const g = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);
  if (!g) return res.status(404).json({ error: 'This gig is no longer available. Browse other gigs near you.' });
  res.json(gigOut(g));
}));

app.post('/api/gigs', requireAuth, requireRole('employer'), asyncH((req, res) => {
  const { title, category, hours, payPerHour, location, when, description, urgent } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: 'Please give your job a title.' });
  const user = qUserById.get(req.user.id);
  const id = uuid();
  db.prepare('INSERT INTO gigs (id, employer_id, title, category, employer_name, employer_initials, employer_rating, location, distance_km, hours, pay_per_hour, when_text, description, urgent, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, user.id, title.trim(), category || 'errands', user.name, initialsOf(user.name), 5.0,
      location || 'Soweto', 1.5, Number(hours) || 2, Number(payPerHour) || 50,
      when || 'Flexible', description || '', urgent ? 1 : 0, 'open', new Date().toISOString());
  res.status(201).json(gigOut(db.prepare('SELECT * FROM gigs WHERE id = ?').get(id)));
}));

app.get('/api/me/applications', requireAuth, requireRole('worker'), asyncH((req, res) => {
  const rows = db.prepare('SELECT gig_id, status FROM applications WHERE worker_id = ?').all(req.user.id);
  res.json(rows.map((r) => ({ gigId: r.gig_id, status: r.status })));
}));

app.post('/api/gigs/:id/apply', requireAuth, requireRole('worker'), asyncH((req, res) => {
  const g = db.prepare("SELECT * FROM gigs WHERE id = ?").get(req.params.id);
  if (!g || g.status !== 'open') return res.status(404).json({ error: 'This gig is no longer accepting applications.' });
  const existing = db.prepare('SELECT * FROM applications WHERE gig_id = ? AND worker_id = ?').get(g.id, req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO applications (id, gig_id, worker_id, status, created_at) VALUES (?,?,?,?,?)')
      .run(uuid(), g.id, req.user.id, 'applied', new Date().toISOString());
  }
  res.json({ ok: true });
}));

app.post('/api/gigs/:id/complete', requireAuth, requireRole('worker'), asyncH((req, res) => {
  const g = db.prepare('SELECT * FROM gigs WHERE id = ?').get(req.params.id);
  if (!g) return res.status(404).json({ error: 'This gig could not be found. It may already be complete.' });
  const rating = Math.max(1, Math.min(5, Math.round(Number(req.body?.rating) || 5)));
  const safetyFlag = req.body?.safetyFlag ? 1 : 0;

  db.prepare('INSERT INTO history (id, worker_id, job_title, category, employer, employer_initials, date, hours, pay, rating, review, safety_flag, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(uuid(), req.user.id, g.title, g.category, g.employer_name, g.employer_initials,
      (g.when_text.split('·')[0] || 'Jul 2026').trim(), g.hours, Math.round(g.hours * g.pay_per_hour),
      rating, autoReview(rating), safetyFlag, new Date().toISOString());

  db.prepare("UPDATE gigs SET status = 'filled' WHERE id = ?").run(g.id);
  db.prepare("UPDATE applications SET status = 'completed' WHERE gig_id = ? AND worker_id = ?").run(g.id, req.user.id);

  // learn the new skill
  const profile = qProfile.get(req.user.id);
  if (profile) {
    const skills = JSON.parse(profile.skills || '[]');
    if (!skills.includes(g.category)) {
      skills.push(g.category);
      db.prepare('UPDATE worker_profiles SET skills = ? WHERE user_id = ?').run(JSON.stringify(skills), req.user.id);
    }
  }
  res.json(cvFor(req.user.id));
}));

// ---- formal jobs ----
app.get('/api/formal-jobs', asyncH((_req, res) => {
  const rows = db.prepare('SELECT * FROM formal_jobs ORDER BY min_tier ASC').all();
  res.json(rows.map(formalOut));
}));

// ---- worker cv ----
app.get('/api/me/cv', requireAuth, requireRole('worker'), asyncH((req, res) => {
  res.json(cvFor(req.user.id));
}));

// ---- talent (employer) ----
app.get('/api/talent', requireAuth, requireRole('employer'), asyncH((req, res) => {
  const workers = db.prepare("SELECT u.id, u.name, p.* FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.role = 'worker' AND u.id != ?").all(req.user.id);
  const list = workers.map((w) => {
    const { cv } = cvFor(w.id);
    return {
      id: w.id, name: w.name, initials: initialsOf(w.name), age: w.age, location: w.location,
      skills: JSON.parse(w.skills || '[]'), idVerified: !!w.id_verified, color: w.color,
      tagline: w.tagline, rating: cv.avg, jobsDone: cv.jobsDone, tier: cv.tier, badges: cv.earnedBadges,
    };
  }).sort((a, b) => b.jobsDone - a.jobsDone);
  res.json(list);
}));

app.get('/api/talent/:id', requireAuth, requireRole('employer'), asyncH((req, res) => {
  const w = db.prepare("SELECT u.id, u.name, p.* FROM users u JOIN worker_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'worker'").get(req.params.id);
  if (!w) return res.status(404).json({ error: 'This worker is no longer available. Browse other verified workers.' });
  const { cv } = cvFor(w.id);
  res.json({
    id: w.id, name: w.name, initials: initialsOf(w.name), age: w.age, location: w.location,
    skills: JSON.parse(w.skills || '[]'), idVerified: !!w.id_verified, color: w.color,
    tagline: w.tagline, rating: cv.avg, jobsDone: cv.jobsDone, tier: cv.tier, badges: cv.earnedBadges,
  });
}));

// ---- unknown API routes ----
app.use('/api', (_req, res) => res.status(404).json({ error: 'That endpoint does not exist.' }));

// ---- serve the built front-end (single-service deploy) ----
// In production the SPA is served from here, so /api is same-origin (no CORS).
const here = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = process.env.VUKA_STATIC || join(here, '..', '..', 'vuka-app', 'dist');
if (existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR));
  // SPA fallback for any non-API route.
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
app.listen(PORT, () => console.log(`Vuka API listening on http://localhost:${PORT}`));

export { app };
