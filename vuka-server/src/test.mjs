/**
 * End-to-end API smoke test (no framework).
 * Uses a throwaway DB, starts the real server, and drives the full
 * multi-user flow with fetch. Run: `npm test`.
 */
import { unlinkSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TEST_DB = join(here, '..', 'test.db');
for (const suffix of ['', '-wal', '-shm']) { const f = TEST_DB + suffix; if (existsSync(f)) unlinkSync(f); }

process.env.VUKA_DB = TEST_DB;
process.env.PORT = '3999';
const BASE = 'http://localhost:3999/api';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.log('  ✗ FAIL: ' + msg); } };

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null; try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function run() {
  // Seed a fresh DB, then start the server.
  const { seed } = await import('./seed.mjs');
  await seed();
  await import('./server.mjs');
  await new Promise((r) => setTimeout(r, 400)); // let it bind

  // 1) health
  ok((await api('GET', '/health')).json?.ok === true, 'health ok');

  // 2) register worker + employer
  const wReg = await api('POST', '/auth/register', { body: { role: 'worker', name: 'Lwazi Khumalo', phone: '0829990001', password: 'test1234', age: 22, location: 'Katlehong', skills: ['carwash', 'moving'], idVerified: true } });
  ok(wReg.status === 201 && wReg.json?.token, 'worker registers');
  const wTok = wReg.json.token;
  ok(wReg.json?.cv?.tier?.name === 'Starter' && wReg.json?.cv?.jobsDone === 0, 'new worker is Starter with 0 jobs');

  const eReg = await api('POST', '/auth/register', { body: { role: 'employer', name: 'Grace Mthembu', phone: '0829990002', password: 'test1234' } });
  ok(eReg.status === 201 && eReg.json?.token, 'employer registers');
  const eTok = eReg.json.token;

  // 3) duplicate phone rejected
  ok((await api('POST', '/auth/register', { body: { role: 'worker', name: 'X', phone: '0829990001', password: 'test1234' } })).status === 409, 'duplicate phone rejected');

  // 4) auth guard
  ok((await api('GET', '/me/cv')).status === 401, 'cv requires auth');

  // 5) seeded gigs visible
  const gigs = await api('GET', '/gigs');
  ok(Array.isArray(gigs.json) && gigs.json.length === 6, 'six seeded gigs, got ' + gigs.json?.length);

  // 6) employer posts a gig -> visible to everyone (multi-user)
  const posted = await api('POST', '/gigs', { token: eTok, body: { title: 'Paint my fence', category: 'garden', hours: 4, payPerHour: 60, location: 'Katlehong', when: 'Sat 09:00', description: 'Two coats.' } });
  ok(posted.status === 201 && posted.json?.id, 'employer posts a gig');
  const postedId = posted.json.id;
  const gigs2 = await api('GET', '/gigs');
  ok(gigs2.json.some((g) => g.id === postedId), 'posted gig visible in public feed (multi-user)');
  ok((await api('POST', '/gigs', { token: wTok, body: { title: 'x' } })).status === 403, 'worker cannot post a gig');

  // 7) worker applies then completes 3 gigs -> tiers up to Trusted
  await api('POST', '/gigs/j1/apply', { token: wTok });
  const apps = await api('GET', '/me/applications', { token: wTok });
  ok(apps.json?.some((a) => a.gigId === 'j1'), 'application recorded');

  let cv;
  for (const id of ['j1', 'j2', 'j3']) {
    const r = await api('POST', `/gigs/${id}/complete`, { token: wTok, body: { rating: 5 } });
    cv = r.json?.cv;
  }
  ok(cv?.jobsDone === 3, 'worker has 3 completed jobs, got ' + cv?.jobsDone);
  ok(cv?.tier?.name === 'Trusted', 'worker tiered up to Trusted, got ' + cv?.tier?.name);
  ok(cv?.history?.length === undefined, 'cv snapshot returned'); // cv is snapshot; history is sibling

  // completed gigs leave the open feed
  ok(!(await api('GET', '/gigs')).json.some((g) => g.id === 'j1'), 'completed gig left the open feed');

  // 8) formal jobs
  const formal = await api('GET', '/formal-jobs');
  ok(Array.isArray(formal.json) && formal.json.length === 8, 'eight formal jobs');

  // 9) employer browses talent -> sees seeded workers + the new one
  const talent = await api('GET', '/talent', { token: eTok });
  ok(Array.isArray(talent.json) && talent.json.length >= 5, 'talent list populated, got ' + talent.json?.length);
  const bongani = talent.json.find((t) => t.name === 'Bongani Zulu');
  ok(bongani?.tier?.name === 'Elite', 'seeded Bongani is Elite, got ' + bongani?.tier?.name);
  ok(talent.json.some((t) => t.name === 'Lwazi Khumalo' && t.jobsDone === 3), 'the newly-active worker appears in talent with 3 jobs');

  // 9b) hiring loop: employer invites the worker to their posted gig
  const wId = wReg.json.user.id;
  const myGigs = await api('GET', '/me/gigs', { token: eTok });
  ok(myGigs.json?.some((g) => g.id === postedId), 'employer sees their own posted gig');
  const inv = await api('POST', `/talent/${wId}/invite`, { token: eTok, body: { gigId: postedId, message: 'Please help' } });
  ok(inv.status === 201 && inv.json?.ok, 'employer invites worker to a gig');
  ok((await api('POST', `/talent/${wId}/invite`, { token: wTok, body: { gigId: postedId } })).status === 403, 'worker cannot invite');
  const invs = await api('GET', '/me/invitations', { token: wTok });
  ok(invs.json?.length === 1 && invs.json[0]?.gig?.id === postedId, 'worker sees the pending invitation');
  const resp = await api('POST', `/invitations/${invs.json[0].id}/respond`, { token: wTok, body: { accept: true } });
  ok(resp.json?.ok && resp.json?.accepted === true, 'worker accepts invitation');
  ok((await api('GET', '/me/applications', { token: wTok })).json?.some((a) => a.gigId === postedId), 'accepting the invite filed an application');
  ok((await api('GET', '/me/invitations', { token: wTok })).json?.length === 0, 'accepted invitation is no longer pending');

  // 10) demo login works with seeded credentials
  const demo = await api('POST', '/auth/login', { body: { phone: '0710000000', password: 'demo1234' } });
  ok(demo.status === 200 && demo.json?.user?.name === 'Thandeka Mokoena', 'demo worker login works');
  ok(demo.json?.cv?.jobsDone === 2 && demo.json?.cv?.jobsToGo === 1, 'demo worker: 2 jobs, 1 to Trusted');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
