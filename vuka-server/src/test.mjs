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
// A throwaway VAPID keypair so the push routes are switched on for the run.
// Generated here with node:crypto rather than via push.mjs, because that module
// reads its keys at import time — importing it first would freeze them as empty.
// Nothing leaves the machine: the only endpoint we post to is an unresolvable
// .invalid host.
{
  const { generateKeyPairSync } = await import('node:crypto');
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = privateKey.export({ format: 'jwk' });
  const point = Buffer.concat([Buffer.from([0x04]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]);
  process.env.VUKA_VAPID_PUBLIC_KEY = point.toString('base64url');
  process.env.VUKA_VAPID_PRIVATE_KEY = jwk.d;
  process.env.VUKA_VAPID_SUBJECT = 'mailto:test@vuka.invalid';
  void publicKey;
}
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

  /** Run the OTP dance and return the proof-of-phone token registration needs. */
  async function verifyPhone(phone) {
    const sent = await api('POST', '/auth/otp', { body: { phone } });
    if (!sent.json?.devCode) throw new Error('devCode not returned — OTP echo should be on in dev');
    const v = await api('POST', '/auth/otp/verify', { body: { phone, code: sent.json.devCode } });
    return v.json.verifyToken;
  }

  // 2) phone verification gates registration
  ok((await api('POST', '/auth/register', { body: { role: 'worker', name: 'No OTP', phone: '0829990007', password: 'test1234' } })).status === 400, 'registration without a verified phone is refused');
  const otp1 = await api('POST', '/auth/otp', { body: { phone: '0829990001' } });
  ok(otp1.status === 200 && otp1.json?.devCode?.length === 4, 'OTP requested');
  ok((await api('POST', '/auth/otp/verify', { body: { phone: '0829990001', code: '0000' === otp1.json.devCode ? '1111' : '0000' } })).status === 400, 'wrong OTP rejected');
  const v1 = await api('POST', '/auth/otp/verify', { body: { phone: '0829990001', code: otp1.json.devCode } });
  ok(v1.status === 200 && v1.json?.verifyToken, 'correct OTP returns a proof token');
  ok((await api('POST', '/auth/otp/verify', { body: { phone: '0829990001', code: otp1.json.devCode } })).status === 400, 'a used OTP cannot be replayed');

  // a proof token for one number cannot register another
  ok((await api('POST', '/auth/register', { body: { role: 'worker', name: 'Wrong Phone', phone: '0829990008', password: 'test1234', verifyToken: v1.json.verifyToken } })).status === 400, 'proof token is bound to its phone number');

  // 2b) register worker + employer (with verified phones)
  const wReg = await api('POST', '/auth/register', { body: { role: 'worker', name: 'Lwazi Khumalo', phone: '0829990001', password: 'test1234', age: 22, location: 'Katlehong', skills: ['carwash', 'moving'], idVerified: true, verifyToken: v1.json.verifyToken } });
  ok(wReg.status === 201 && wReg.json?.token, 'worker registers');
  const wTok = wReg.json.token;
  ok(wReg.json?.cv?.tier?.name === 'Starter' && wReg.json?.cv?.jobsDone === 0, 'new worker is Starter with 0 jobs');
  ok(wReg.json?.profile?.idVerified === false, 'a client cannot self-assert ID verification');

  const eReg = await api('POST', '/auth/register', { body: { role: 'employer', name: 'Grace Mthembu', phone: '0829990002', password: 'test1234', verifyToken: await verifyPhone('0829990002') } });
  ok(eReg.status === 201 && eReg.json?.token, 'employer registers');
  const eTok = eReg.json.token;

  // 3) duplicate phone rejected — at the OTP step, before the form is filled in
  ok((await api('POST', '/auth/otp', { body: { phone: '0829990001' } })).status === 409, 'already-registered number is rejected up front');

  // 3a) a number that already has an account is turned away at the OTP step,
  // and says so in a way the app can act on rather than a dead end.
  {
    const dup = await api('POST', '/auth/otp', { body: { phone: '0829990001' } });
    ok(dup.status === 409 && dup.json?.reason === 'already_registered',
      'an already-registered number is flagged so the app can offer sign-in');
    ok(/sign/i.test(dup.json?.error ?? ''), 'and the message points at signing in');
  }

  // 3b) weak password rejected (min 8 chars)
  ok((await api('POST', '/auth/register', { body: { role: 'worker', name: 'Weak Pass', phone: '0829990009', password: 'short', verifyToken: await verifyPhone('0829990009') } })).status === 400, 'password under 8 chars rejected');

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

  // 6b) posting a job is validated at the boundary, not just in the form, and
  // every rejection names the field so the app can show it in the right place.
  {
    const bad = async (body) => api('POST', '/gigs', { token: eTok, body: { title: 'Test job', category: 'garden', hours: 2, payPerHour: 60, location: 'Soweto', ...body } });

    const noTitle = await bad({ title: '  ' });
    ok(noTitle.status === 400 && noTitle.json?.field === 'title', 'a job needs a title');

    const belowWage = await bad({ payPerHour: 25 });
    ok(belowWage.status === 400 && belowWage.json?.field === 'payPerHour', 'a rate below minimum wage is refused');
    ok(/minimum wage/i.test(belowWage.json?.error ?? ''), 'and the refusal says why, with the legal figure');

    ok((await bad({ payPerHour: 0 })).status === 400, 'a zero rate is refused');
    ok((await bad({ payPerHour: -50 })).status === 400, 'a negative rate is refused');
    ok((await bad({ payPerHour: 'free' })).status === 400, 'a non-numeric rate is refused');

    ok((await bad({ hours: 0 })).status === 400, 'zero hours is refused');
    ok((await bad({ hours: 100 })).status === 400, 'an implausible number of hours is refused');

    const badCat = await bad({ category: 'rocket-science' });
    ok(badCat.status === 400 && badCat.json?.field === 'category', 'an unknown category is refused rather than silently mislabelled');

    ok((await bad({ location: '   ' })).status === 400, 'a job needs a location');

    // Exactly at the floor is lawful, so it must post.
    const atFloor = await bad({ payPerHour: 30.23, title: 'Exactly minimum wage' });
    ok(atFloor.status === 201, 'a rate exactly at minimum wage is accepted');
  }

  // 7) the two-sided work loop: apply → employer hires → worker marks done →
  //    employer confirms & rates → only then does the CV grow.
  const wId = wReg.json.user.id;
  const loginAs = async (phone) => (await api('POST', '/auth/login', { body: { phone, password: 'demo1234' } })).json.token;
  const GIG_OWNER = { j1: '0720000000', j2: '0721000002', j3: '0721000003' };

  await api('POST', '/gigs/j1/apply', { token: wTok });
  const apps = await api('GET', '/me/applications', { token: wTok });
  ok(apps.json?.some((a) => a.gigId === 'j1' && a.status === 'applied'), 'application recorded');

  const owner1 = await loginAs(GIG_OWNER.j1);
  const applicants = await api('GET', '/gigs/j1/applicants', { token: owner1 });
  ok(applicants.json?.applicants?.some((a) => a.worker.id === wId && a.status === 'applied'), 'employer sees the applicant (they no longer vanish)');
  ok(applicants.json?.applicants?.[0]?.worker?.tier?.name !== undefined, 'applicants carry their real tier and rating');
  ok((await api('GET', '/gigs/j1/applicants', { token: eTok })).status === 403, 'only the gig owner sees its applicants');
  ok((await api('GET', '/gigs/j1/applicants', { token: wTok })).status === 403, 'workers cannot list applicants');

  ok((await api('POST', '/gigs/j1/complete', { token: wTok, body: { rating: 5 } })).status === 409, 'a worker cannot complete a job they were not hired for');
  ok((await api('POST', '/gigs/j1/hire', { token: eTok, body: { workerId: wId } })).status === 403, 'only the owner can hire for a gig');
  ok((await api('POST', '/gigs/j1/hire', { token: owner1, body: { workerId: eReg.json.user.id } })).status === 404, 'cannot hire someone who never applied');
  ok((await api('POST', '/gigs/j1/hire', { token: owner1, body: { workerId: wId } })).json?.ok, 'employer hires the applicant');
  ok((await api('POST', '/gigs/j1/hire', { token: owner1, body: { workerId: wId } })).status === 409, 'cannot hire twice for one gig');
  ok(!(await api('GET', '/gigs')).json.some((g) => g.id === 'j1'), 'a filled gig leaves the open feed');

  const myJobs = await api('GET', '/me/jobs', { token: wTok });
  ok(myJobs.json?.some((j) => j.gig.id === 'j1' && j.status === 'hired'), 'the hired worker can still see the job');

  const done = await api('POST', '/gigs/j1/complete', { token: wTok, body: { rating: 5 } });
  ok(done.json?.status === 'worker_done', 'worker marks the work done and rates the employer');
  ok((await api('POST', '/gigs/j1/complete', { token: wTok, body: { rating: 5 } })).status === 409, 'cannot mark done twice');
  ok((await api('GET', '/me/cv', { token: wTok })).json?.cv?.jobsDone === 0, 'the CV does NOT move until the employer confirms');

  const hires = await api('GET', '/me/hires', { token: owner1 });
  const appJ1 = hires.json?.find((h) => h.gig.id === 'j1');
  ok(appJ1?.status === 'worker_done', 'employer sees work awaiting confirmation');
  ok((await api('POST', `/applications/${appJ1.applicationId}/confirm`, { token: eTok, body: { rating: 5 } })).status === 403, 'only the gig owner can confirm');
  const confirmed = await api('POST', `/applications/${appJ1.applicationId}/confirm`, { token: owner1, body: { rating: 4, review: 'Great work on both cars, arrived early.' } });
  ok(confirmed.json?.ok && confirmed.json?.rating === 4, 'employer confirms and rates the worker');
  ok((await api('POST', `/applications/${appJ1.applicationId}/confirm`, { token: owner1, body: { rating: 5 } })).status === 409, 'cannot confirm the same job twice');

  const afterOne = await api('GET', '/me/cv', { token: wTok });
  ok(afterOne.json?.cv?.jobsDone === 1, 'confirmation writes the CV entry, got ' + afterOne.json?.cv?.jobsDone);
  ok(afterOne.json?.history?.[0]?.review === 'Great work on both cars, arrived early.', "the employer's own words land on the CV");
  ok(afterOne.json?.history?.[0]?.rating === 4, "the CV rating is the EMPLOYER's rating of the worker");
  ok(afterOne.json?.profile?.skills?.includes('carwash'), 'a confirmed job teaches the worker a new skill');

  // Two more full loops to reach the Trusted tier.
  let cv = afterOne.json.cv;
  for (const id of ['j2', 'j3']) {
    const owner = await loginAs(GIG_OWNER[id]);
    await api('POST', `/gigs/${id}/apply`, { token: wTok });
    await api('POST', `/gigs/${id}/hire`, { token: owner, body: { workerId: wId } });
    await api('POST', `/gigs/${id}/complete`, { token: wTok, body: { rating: 5 } });
    const h = await api('GET', '/me/hires', { token: owner });
    const a = h.json.find((x) => x.gig.id === id);
    await api('POST', `/applications/${a.applicationId}/confirm`, { token: owner, body: { rating: 5 } });
    cv = (await api('GET', '/me/cv', { token: wTok })).json.cv;
  }
  ok(cv?.jobsDone === 3, 'worker has 3 completed jobs, got ' + cv?.jobsDone);
  ok(cv?.tier?.name === 'Trusted', 'worker tiered up to Trusted, got ' + cv?.tier?.name);
  ok(cv?.history?.length === undefined, 'cv snapshot returned'); // cv is snapshot; history is sibling

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
  const myGigs = await api('GET', '/me/gigs', { token: eTok });
  ok(myGigs.json?.some((g) => g.id === postedId), 'employer sees their own posted gig');
  const inv = await api('POST', `/talent/${wId}/invite`, { token: eTok, body: { gigId: postedId, message: 'Please help' } });
  ok(inv.status === 201 && inv.json?.ok, 'employer invites worker to a gig');
  ok((await api('POST', `/talent/${wId}/invite`, { token: wTok, body: { gigId: postedId } })).status === 403, 'worker cannot invite');
  const invs = await api('GET', '/me/invitations', { token: wTok });
  ok(invs.json?.length === 1 && invs.json[0]?.gig?.id === postedId, 'worker sees the pending invitation');
  const resp = await api('POST', `/invitations/${invs.json[0].id}/respond`, { token: wTok, body: { accept: true } });
  ok(resp.json?.ok && resp.json?.accepted === true, 'worker accepts invitation');
  // An invitation is the employer already choosing this worker, so accepting hires them.
  ok((await api('GET', '/me/applications', { token: wTok })).json?.some((a) => a.gigId === postedId && a.status === 'hired'), 'accepting an invitation hires the worker outright');
  ok((await api('GET', '/me/invitations', { token: wTok })).json?.length === 0, 'accepted invitation is no longer pending');
  ok((await api('GET', '/me/hires', { token: eTok })).json?.some((h) => h.gig.id === postedId && h.status === 'hired'), 'the inviting employer sees the hire');

  // 9c) chat: employer and worker message each other.
  // Baseline first — being hired also drops a message in the worker's inbox.
  const eId = eReg.json.user.id;
  const unreadBefore = (await api('GET', '/messages/unread-count', { token: wTok })).json.count;
  ok(unreadBefore >= 1, 'being hired lands a message in the worker\'s inbox');
  const send1 = await api('POST', '/messages', { token: eTok, body: { toUserId: wId, body: 'Hi, are you free Saturday?' } });
  ok(send1.status === 201 && send1.json?.id, 'employer sends a message');
  ok((await api('POST', '/messages', { token: eTok, body: { toUserId: eId, body: 'x' } })).status === 400, 'cannot message yourself');
  const unread = await api('GET', '/messages/unread-count', { token: wTok });
  ok(unread.json?.count === unreadBefore + 1, `a new message raises unread by one (got ${unread.json?.count}, expected ${unreadBefore + 1})`);
  const thread = await api('GET', `/messages/thread/${eId}`, { token: wTok });
  // The employer's own hire message for `postedId` is in this thread too.
  ok(thread.json?.messages?.length >= 1 && thread.json?.other?.id === eId, 'worker reads the thread');
  ok((await api('GET', '/messages/unread-count', { token: wTok })).json?.count === unreadBefore, 'reading a thread clears only that thread\'s unread');
  await api('POST', '/messages', { token: wTok, body: { toUserId: eId, body: 'Yes, morning works.' } });
  const convos = await api('GET', '/messages/conversations', { token: eTok });
  ok(convos.json?.length === 1 && convos.json[0]?.user?.id === wId && convos.json[0]?.unread === 1, 'employer sees the conversation with 1 unread reply');

  // 9c-ii) replying, editing and withdrawing a message.
  {
    const reply = await api('POST', '/messages', { token: wTok, body: { toUserId: eId, body: 'Saturday from 8am?', replyToId: send1.json.id } });
    ok(reply.status === 201 && reply.json?.replyTo?.id === send1.json.id, 'a message can quote one already in the thread');
    ok(reply.json?.replyTo?.body === 'Hi, are you free Saturday?', 'the quote carries the original text');

    // A reply id from outside this conversation must not resolve — otherwise
    // the quote leaks a stranger's message into someone else's thread.
    const outsider = await api('POST', '/messages', { token: eTok, body: { toUserId: wId, body: 'unrelated' } });
    const thirdParty = await loginAs(GIG_OWNER.j2);
    ok((await api('POST', '/messages', { token: thirdParty, body: { toUserId: wId, body: 'x', replyToId: outsider.json.id } })).status === 400,
      'cannot quote a message from a conversation you are not part of');

    // Edit: sender only, and always marked.
    ok((await api('PATCH', `/messages/${reply.json.id}`, { token: eTok, body: { body: 'hacked' } })).status === 403, 'only the sender can edit a message');
    ok((await api('PATCH', `/messages/${reply.json.id}`, { token: wTok, body: { body: '   ' } })).status === 400, 'an edit cannot blank a message');
    const edited = await api('PATCH', `/messages/${reply.json.id}`, { token: wTok, body: { body: 'Saturday from 9am?' } });
    ok(edited.status === 200 && edited.json?.body === 'Saturday from 9am?', 'the sender edits their message');
    ok(edited.json?.editedAt, 'an edited message is marked as edited');
    ok(edited.json?.replyTo?.id === send1.json.id, 'editing keeps the quoted message attached');

    // Delete: sender only, soft, and the body never comes back.
    ok((await api('DELETE', `/messages/${reply.json.id}`, { token: eTok })).status === 403, 'only the sender can delete a message');
    const deleted = await api('DELETE', `/messages/${reply.json.id}`, { token: wTok });
    ok(deleted.status === 200 && deleted.json?.deleted === true, 'the sender withdraws their message');
    ok(deleted.json?.body === '', 'a withdrawn message returns no body');
    ok((await api('PATCH', `/messages/${reply.json.id}`, { token: wTok, body: { body: 'back again' } })).status === 409, 'a deleted message cannot be edited back');

    const after = await api('GET', `/messages/thread/${wId}`, { token: eTok });
    const tomb = after.json.messages.find((m) => m.id === reply.json.id);
    ok(tomb?.deleted === true && tomb?.body === '', 'the thread serves the tombstone, never the withdrawn text');
    ok(after.json?.editWindowMinutes > 0, 'the thread publishes the edit window');

    // Deleting twice is a no-op rather than an error — the button may well be
    // tapped twice on a slow connection.
    ok((await api('DELETE', `/messages/${reply.json.id}`, { token: wTok })).status === 200, 'deleting an already-deleted message is harmless');
  }

  // 9c-iii) the SMS payload template. A provider whose field names differ is an
  // env change, not a code change — but only if the template survives real
  // message text.
  {
    const { renderSmsBody, DEFAULT_SMS_BODY, toE164 } = await import('./notify.mjs');

    ok(JSON.parse(renderSmsBody(DEFAULT_SMS_BODY, '+27821234567', 'Your code is 1234')).to === '+27821234567',
      'the default template carries the number');
    ok(JSON.parse(renderSmsBody(DEFAULT_SMS_BODY, '+27821234567', 'Your code is 1234')).body === 'Your code is 1234',
      'the default template carries the message');

    // The reason values are JSON-escaped rather than interpolated raw.
    const risky = [
      'Sipho', String.fromCharCode(34), 's gig',
      String.fromCharCode(10), 'line two ', String.fromCharCode(92), ' end',
    ].join('');
    const out = JSON.parse(renderSmsBody(DEFAULT_SMS_BODY, '+27821234567', risky));
    ok(out.body === risky, 'quotes, newlines and backslashes survive the template intact');

    // A different provider's field names, purely via the template.
    const alt = renderSmsBody('{"msisdn":"{{to}}","text":"{{text}}"}', '+27831112222', 'hi');
    ok(JSON.parse(alt).msisdn === '+27831112222' && JSON.parse(alt).text === 'hi',
      'a provider with different field names needs no code change');

    let threw = false;
    try { renderSmsBody('{"to":"{{to}}", oops}', '+27821234567', 'x'); } catch { threw = true; }
    ok(threw, 'a malformed template fails loudly rather than posting broken JSON');

    ok(toE164('0821234567') === '+27821234567', 'a local number is normalised to E.164');
    ok(toE164('27821234567') === '+27821234567', 'an international number is left alone');

    // Not every gateway wants the leading plus (SMS Messenger does not).
    const digits = JSON.parse(renderSmsBody('{"recipientNumber":"{{to_digits}}","message":"{{text}}"}', '+27821234567', 'hi'));
    ok(digits.recipientNumber === '27821234567', '{{to_digits}} drops the leading plus');
    ok(digits.message === 'hi', 'and still carries the message');

    // {{to}} must not be substituted inside {{to_digits}} first.
    const both = JSON.parse(renderSmsBody('{"a":"{{to}}","b":"{{to_digits}}"}', '+27821234567', 'x'));
    ok(both.a === '+27821234567' && both.b === '27821234567', 'both number placeholders resolve independently');

    // Providers that authenticate with their own named headers.
    const { authHeaders } = await import('./notify.mjs');
    const prevHeaders = process.env.VUKA_SMS_HEADERS;
    process.env.VUKA_SMS_HEADERS = '{"email":"me@example.co.za","token":"abc123"}';
    const h = authHeaders();
    ok(h.email === 'me@example.co.za' && h.token === 'abc123', 'custom auth headers are passed through');
    ok(h.Authorization === undefined, 'and no Authorization header is invented');

    process.env.VUKA_SMS_HEADERS = 'not json';
    let hdrThrew = false;
    try { authHeaders(); } catch { hdrThrew = true; }
    ok(hdrThrew, 'a malformed header map fails loudly rather than sending unauthenticated');

    delete process.env.VUKA_SMS_HEADERS;
    process.env.VUKA_SMS_USER = 'u'; process.env.VUKA_SMS_PASS = 'p';
    ok(authHeaders().Authorization === `Basic ${Buffer.from('u:p').toString('base64')}`, 'user/pass still builds Basic auth');
    delete process.env.VUKA_SMS_USER; delete process.env.VUKA_SMS_PASS;
    if (prevHeaders === undefined) delete process.env.VUKA_SMS_HEADERS; else process.env.VUKA_SMS_HEADERS = prevHeaders;
  }

  // 9c-iv) sign-in tells you which thing went wrong. Someone who never
  // registered was previously told their "number or password" was incorrect,
  // so they retyped a correct password forever.
  {
    const unknown = await api('POST', '/auth/login', { body: { phone: '0839990404', password: 'whatever123' } });
    ok(unknown.status === 401, 'an unknown number cannot sign in');
    ok(unknown.json?.reason === 'no_account', 'and the app is told there is no account, so it can offer sign-up');

    const wrongPw = await api('POST', '/auth/login', { body: { phone: '0829990001', password: 'definitely-wrong' } });
    ok(wrongPw.status === 401, 'a wrong password cannot sign in');
    ok(wrongPw.json?.reason === 'wrong_password', 'and is reported as a password problem, not a missing account');
    ok(wrongPw.json?.error !== unknown.json?.error, 'the two failures no longer read identically');
  }

  // 9d) follow graph
  const soc0 = await api('GET', `/users/${wId}/social`, { token: eTok });
  ok(soc0.json?.isFollowing === false, 'employer not yet following the worker');
  const foll = await api('POST', `/users/${wId}/follow`, { token: eTok });
  ok(foll.json?.isFollowing === true && foll.json?.followers >= 1, 'employer follows the worker');
  ok((await api('GET', `/users/${wId}/social`, { token: eTok })).json?.isFollowing === true, 'follow state persists');
  ok((await api('POST', `/users/${eId}/follow`, { token: eTok })).status === 400, 'cannot follow yourself');
  const mine = await api('GET', '/me/following', { token: eTok });
  ok(mine.json?.some((u) => u.id === wId), 'worker appears in employer\'s following list');
  const unf = await api('DELETE', `/users/${wId}/follow`, { token: eTok });
  ok(unf.json?.isFollowing === false, 'employer unfollows the worker');

  // 9e) engine config is served and matches the server's own engine
  const cfg = await api('GET', '/config');
  ok(cfg.json?.minWage > 0, 'config exposes the fair-pay minimum wage');
  ok(cfg.json?.tiers?.length === 4 && cfg.json.tiers[1]?.minJobs === 3, 'config exposes tier thresholds');
  ok(cfg.json?.badges?.some((b) => b.id === 'first' && b.threshold === 1), 'config exposes badge thresholds');

  // 9f) employer rating is a real average of worker→employer reviews
  const j4 = (await api('GET', '/gigs/j4')).json; // untouched by this run
  ok(j4?.employerRating === 4.7 && j4?.employerRatingCount === 10, `seeded employer rating is averaged (got ${j4?.employerRating} / ${j4?.employerRatingCount})`);
  // j2 was completed above, so its employer picked up one extra 5★ review.
  const j2 = (await api('GET', '/gigs/j2')).json;
  ok(j2?.employerRatingCount === 11, `completing a gig records a worker→employer rating (got ${j2?.employerRatingCount})`);
  const newGig = (await api('GET', `/gigs/${postedId}`)).json;
  ok(newGig?.employerRating === null && newGig?.employerRatingCount === 0, 'a brand-new employer has no invented rating');
  const eRating = await api('GET', '/me/employer-rating', { token: eTok });
  ok(eRating.json?.rating === null && eRating.json?.count === 0, 'employer with no completed jobs has no rating yet');
  ok((await api('GET', '/me/employer-rating', { token: wTok })).status === 403, 'workers have no employer rating');

  // 9g) formal-job applications are server-side and tier-gated
  ok((await api('POST', '/formal-jobs/f1/apply')).status === 401, 'formal apply requires auth');
  const fApply = await api('POST', '/formal-jobs/f1/apply', { token: wTok }); // worker is Trusted (tier 1)
  ok(fApply.status === 201 && fApply.json?.ok, 'Trusted worker applies to a tier-1 formal role');
  ok((await api('POST', '/formal-jobs/f1/apply', { token: wTok })).json?.already === true, 'applying twice is idempotent');
  ok((await api('POST', '/formal-jobs/f8/apply', { token: wTok })).status === 403, 'tier-3 role is refused to a Trusted worker');
  ok((await api('POST', '/formal-jobs/nope/apply', { token: wTok })).status === 404, 'unknown formal role 404s');
  const fApps = await api('GET', '/me/formal-applications', { token: wTok });
  ok(fApps.json?.length === 1 && fApps.json[0]?.jobId === 'f1', 'formal application is listed back');
  ok((await api('GET', '/me/formal-applications', { token: eTok })).status === 403, 'employers have no formal applications');

  // 9h) banking details: stored encrypted, returned masked
  ok((await api('GET', '/me/banking')).status === 401, 'banking requires auth');
  ok((await api('GET', '/me/banking', { token: wTok })).json === null, 'no banking details to start');
  ok((await api('PUT', '/me/banking', { token: wTok, body: { holder: 'L Khumalo', bank: 'nope', accountType: 'savings', accountNumber: '1234567890' } })).status === 400, 'unknown bank rejected');
  ok((await api('PUT', '/me/banking', { token: wTok, body: { holder: 'L Khumalo', bank: 'capitec', accountType: 'savings', accountNumber: '123' } })).status === 400, 'short account number rejected');
  const bSave = await api('PUT', '/me/banking', { token: wTok, body: { holder: 'L Khumalo', bank: 'capitec', accountType: 'savings', accountNumber: '1234567890' } });
  ok(bSave.status === 200 && bSave.json?.last4 === '7890', 'banking details saved and masked to last 4');
  ok(bSave.json?.accountNumber === undefined && JSON.stringify(bSave.json).includes('1234567890') === false, 'full account number is never returned');
  const bRead = await api('GET', '/me/banking', { token: wTok });
  ok(bRead.json?.holder === 'L Khumalo' && bRead.json?.bank === 'capitec' && bRead.json?.last4 === '7890', 'banking details read back masked');
  // Stored ciphertext must not contain the number in the clear.
  const { get: dbGet } = await import('./db.mjs');
  const bRow = await dbGet('SELECT * FROM banking_details WHERE user_id = ?', [wId]);
  ok(!bRow.account_number_enc.includes('1234567890') && bRow.account_number_enc.startsWith('v1:'), 'account number is encrypted at rest');
  const bKeep = await api('PUT', '/me/banking', { token: wTok, body: { holder: 'Lwazi Khumalo', bank: 'capitec', accountType: 'cheque' } });
  ok(bKeep.json?.last4 === '7890' && bKeep.json?.accountType === 'cheque', 'omitting the number keeps the stored account');
  ok((await api('DELETE', '/me/banking', { token: wTok })).json?.ok, 'banking details deleted');
  ok((await api('GET', '/me/banking', { token: wTok })).json === null, 'deleted banking details are gone');

  // 9i) account-level preferences
  ok((await api('GET', '/me/preferences', { token: wTok })).json?.jobAlerts === true, 'job alerts default to on');
  ok((await api('PUT', '/me/preferences', { token: wTok, body: { jobAlerts: 'yes' } })).status === 400, 'non-boolean preference rejected');
  ok((await api('PUT', '/me/preferences', { token: wTok, body: { jobAlerts: false } })).json?.jobAlerts === false, 'job alerts turned off');
  ok((await api('GET', '/me/preferences', { token: wTok })).json?.jobAlerts === false, 'preference persists');
  ok((await api('PUT', '/me/preferences', { token: wTok, body: { jobAlerts: true } })).json?.jobAlerts === true, 'job alerts turned back on');

  // 9j) safety reports are stored, not just toasted
  ok((await api('POST', '/safety/report', { body: { concern: 'x' } })).status === 401, 'safety report requires auth');
  ok((await api('POST', '/safety/report', { token: wTok, body: { concern: '  ' } })).status === 400, 'empty safety report rejected');
  const rep = await api('POST', '/safety/report', { token: wTok, body: { concern: 'The address was not what was agreed.', gigId: 'j4', aboutUserId: eId } });
  ok(rep.status === 201 && rep.json?.id, 'safety report filed');
  const repRow = await dbGet('SELECT * FROM safety_reports WHERE id = ?', [rep.json.id]);
  ok(repRow?.concern.startsWith('The address') && repRow?.gig_id === 'j4' && repRow?.about_user_id === eId, 'safety report persisted with its links');
  const repBad = await api('POST', '/safety/report', { token: wTok, body: { concern: 'Something happened.', gigId: 'does-not-exist', aboutUserId: 'nobody' } });
  ok(repBad.status === 201, 'a bad gig/user reference never loses the report');
  ok((await dbGet('SELECT * FROM safety_reports WHERE id = ?', [repBad.json.id]))?.gig_id === null, 'unknown references are dropped, not stored');

  // 9k) SA ID validation (unit-level — the gate KYC submissions pass through)
  const { validateSaId } = await import('./said.mjs');
  ok(validateSaId('0001015009085').ok === true, 'a valid SA ID passes');
  ok(validateSaId('0001015009086').ok === false, 'a wrong check digit fails');
  ok(validateSaId('000101500908').ok === false, '12 digits fail');
  ok(validateSaId('0013015009085').ok === false, 'month 13 fails');
  ok(validateSaId('0001015009085').gender === 'male' && validateSaId('0001010009080').gender === 'female', 'gender digit read correctly');
  ok(validateSaId('0001015009085').dateOfBirth === '2000-01-01', 'date of birth is read from the ID');

  // 9l) ID verification is reviewed, never self-asserted
  ok((await api('GET', '/me/id-verification', { token: wTok })).json?.status === 'none', 'no ID submission to start');
  ok((await api('POST', '/me/id-verification', { token: wTok, body: { fullName: 'Lwazi Khumalo', idNumber: '0001015009086' } })).status === 400, 'an invalid ID number is refused');
  ok((await api('POST', '/me/id-verification', { token: wTok, body: { fullName: 'L', idNumber: '0001015009085' } })).status === 400, 'a too-short name is refused');
  const kyc = await api('POST', '/me/id-verification', { token: wTok, body: { fullName: 'Lwazi Khumalo', idNumber: '0001015009085' } });
  ok(kyc.status === 201 && kyc.json?.status === 'pending' && kyc.json?.last4 === '9085', 'a valid submission lands as pending, masked to last 4');
  ok((await api('POST', '/me/id-verification', { token: wTok, body: { fullName: 'Lwazi Khumalo', idNumber: '0001015009085' } })).status === 409, 'a second submission while pending is refused');
  ok((await api('GET', '/me/cv', { token: wTok })).json?.profile?.idVerified === false, 'a pending submission does NOT grant the badge');
  const kycRow = await dbGet("SELECT * FROM id_verifications WHERE user_id = ?", [wId]);
  ok(!kycRow.id_number_enc.includes('0001015009085') && kycRow.id_number_enc.startsWith('v1:'), 'the ID number is encrypted at rest');
  ok((await api('GET', '/me/cv', { token: wTok })).json?.profile?.age === validateSaId('0001015009085').age, 'age is taken from the ID, not from what was typed');

  // ops review grants the badge (the seam a KYC provider would replace)
  ok((await api('GET', '/admin/id-verifications')).status === 404, 'admin routes are off without VUKA_ADMIN_TOKEN');
  process.env.VUKA_ADMIN_TOKEN = 'test-admin-token';
  const pending = await fetch(BASE + '/admin/id-verifications', { headers: { 'x-admin-token': 'test-admin-token' } }).then((r) => r.json());
  ok(pending.some((p) => p.userId === wId && p.last4 === '9085'), 'ops can list pending submissions');
  const decideRes = await fetch(BASE + `/admin/id-verifications/${pending[0].id}/decide`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': 'test-admin-token' }, body: JSON.stringify({ approve: true }),
  });
  ok(decideRes.status === 200, 'ops approves the submission');
  ok((await api('GET', '/me/cv', { token: wTok })).json?.profile?.idVerified === true, 'approval grants the verified badge');
  ok((await fetch(BASE + `/admin/id-verifications/${pending[0].id}/decide`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': 'wrong-length-tok' }, body: '{}' })).status === 401, 'a wrong admin token is refused');
  delete process.env.VUKA_ADMIN_TOKEN;

  // 9n) distance is measured, not typed in
  {
    const noPos = await api('GET', '/gigs');
    ok(noPos.json.every((g) => g.distanceSource === 'listed'), 'with no viewer position every distance is flagged as a label, not a measurement');

    // Sandton — a long way from the Soweto gigs, so the ordering is unambiguous.
    const from = 'lat=-26.1076&lng=28.0567';
    const measured = await api('GET', `/gigs?${from}`);
    ok(measured.json.every((g) => g.distanceSource === 'measured'), 'a viewer position turns every seeded gig into a measured distance');
    const kms = measured.json.map((g) => g.distanceKm);
    ok(kms.every((k, i) => i === 0 || k >= kms[i - 1]), 'the measured feed comes back nearest-first');
    ok(kms.every((k) => k > 5 && k < 60), 'Soweto gigs measure a plausible distance from Sandton');

    // Same gig, viewed from next door, is closer than when viewed from Sandton.
    const pimville = await api('GET', '/gigs?lat=-26.2686&lng=27.8956');
    const near = pimville.json[0];
    const far = measured.json.find((g) => g.id === near?.id);
    ok(near && far && near.distanceKm < far.distanceKm, 'the same gig is nearer to a viewer who is nearer to it');

    ok((await api('GET', '/gigs?lat=999&lng=abc')).json.every((g) => g.distanceSource === 'listed'), 'a nonsense position is ignored rather than trusted');

    // A gig posted with device coordinates is placed on those, not on its text.
    const exact = await api('POST', '/gigs', { token: eTok, body: { title: 'Fix a gate', category: 'garden', hours: 2, payPerHour: 70, location: 'Sandton', when: 'Mon', description: 'Hinges.', lat: -26.1076, lng: 28.0567 } });
    ok(exact.status === 201, 'a gig posts with coordinates from the employer device');
    const atSandton = (await api('GET', `/gigs?${from}`)).json.find((g) => g.id === exact.json.id);
    ok(atSandton?.distanceKm === 0, 'a gig at the viewer position measures 0 km away');
    ok(exact.json.distanceKm === 0 && exact.json.distanceSource === 'listed', 'an unmeasured distance is 0/listed — never an invented number');

    // A gig we can't place has no meaningful distance, and its label is 0 —
    // so it must NOT lead a "nearest first" feed just because 0 sorts lowest.
    const nowhere = await api('POST', '/gigs', { token: eTok, body: { title: 'Somewhere unlisted', category: 'errands', hours: 1, payPerHour: 60, location: 'Qqzzx Unlisted Place', when: 'Tue', description: 'No coordinates for this one.' } });
    ok(nowhere.status === 201, 'a gig posts even when its location cannot be placed');
    const ranked = (await api('GET', `/gigs?${from}`)).json;
    ok(ranked.find((g) => g.id === nowhere.json.id)?.distanceSource === 'listed', 'an unplaceable gig is reported as unmeasured');
    ok(ranked[0].distanceSource === 'measured', 'the nearest-first feed still leads with a measured distance');
    const lastMeasured = ranked.findLastIndex((g) => g.distanceSource === 'measured');
    const firstListed = ranked.findIndex((g) => g.distanceSource === 'listed');
    ok(firstListed === -1 || firstListed > lastMeasured, 'unmeasured listings sort after every measured one, not among them');

    const { haversineKm, coordsForPlace, parseCoords } = await import('./geo.mjs');
    ok(Math.abs(haversineKm({ lat: -26.2041, lng: 28.0473 }, { lat: -33.9249, lng: 18.4241 }) - 1265) < 25, 'Johannesburg to Cape Town measures ~1265 km');
    ok(haversineKm({ lat: 1, lng: 2 }, { lat: 1, lng: 2 }) === 0, 'a point is zero km from itself');
    ok(coordsForPlace('Orlando West, Soweto').lat === coordsForPlace('orlando west').lat, 'a place name is found inside free text, case-insensitively');
    ok(coordsForPlace('Somewhere Unlisted') === null, 'an unknown place resolves to null rather than a guess');
    ok(parseCoords(0, 0) === null && parseCoords('abc', 1) === null && parseCoords(91, 0) === null, 'null island, non-numbers and out-of-range are all rejected');
  }

  // 9o) web push — the free channel job alerts now ride on
  {
    const { encryptPayload } = await import('./push.mjs');
    // RFC 8291 §5 known-answer vector. Hand-rolled crypto that isn't checked
    // against the spec's own numbers is not worth trusting.
    const vector = encryptPayload(
      'When I grow up, I want to be a watermelon',
      'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
      'BTBZMqHH6r4Tts7J_aSIgg',
      { salt: Buffer.from('DGv6ra1nlYgDCS1FRnbzlw', 'base64url'), serverPrivateKey: Buffer.from('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', 'base64url') }
    );
    ok(vector.body.toString('base64url') === 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
      'push payload encryption reproduces the RFC 8291 test vector byte for byte');

    const keys = { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' };
    const endpoint = 'https://push.vuka.invalid/sub/abc123';
    ok((await api('POST', '/push/subscribe', { body: { endpoint, keys } })).status === 401, 'subscribing requires auth');
    ok((await api('POST', '/push/subscribe', { token: wTok, body: { endpoint: 'http://insecure.example/x', keys } })).status === 400, 'a non-https endpoint is refused');
    ok((await api('POST', '/push/subscribe', { token: wTok, body: { endpoint, keys: { p256dh: 'tooshort', auth: keys.auth } } })).status === 400, 'a subscription with malformed keys is refused');
    ok((await api('POST', '/push/subscribe', { token: wTok, body: { endpoint, keys } })).status === 201, 'a valid subscription is stored');
    const subCount = async () => Number((await dbGet('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?', [wId]))?.n ?? -1);
    ok((await subCount()) === 1, 'one row per device');
    ok((await api('POST', '/push/subscribe', { token: wTok, body: { endpoint, keys } })).status === 201, 're-subscribing the same endpoint updates rather than duplicates');
    ok((await subCount()) === 1, 'still one row after re-subscribing');

    // The endpoint host does not resolve, so this exercises the failure path
    // without touching the network — and proves a dead device is reported, not
    // silently swallowed.
    ok((await api('POST', '/push/test', { token: wTok })).status === 409, 'a test push to an unreachable device reports failure instead of pretending');
    ok((await api('POST', '/push/unsubscribe', { token: wTok, body: { endpoint } })).status === 200, 'unsubscribing works');
    ok((await subCount()) === 0, 'the subscription is gone');

    ok((await api('GET', '/config')).json?.vapidPublicKey === process.env.VUKA_VAPID_PUBLIC_KEY, 'the client can fetch the VAPID public key it needs to subscribe');
    ok((await api('GET', '/health')).json?.pushConfigured === true, 'health reports whether push can actually be delivered');
  }

  // 9o-ii) push is the free channel and SMS is the paid fallback — never both.
  // Three lifecycle SMS per completed job was the largest avoidable cost the
  // platform had. A regression here doubles the bill in silence, so it is
  // guarded in both directions rather than assumed.
  {
    const { smsAttempts } = await import('./notify.mjs');
    const { run: dbRun } = await import('./db.mjs');
    const { createServer } = await import('node:http');
    const { randomUUID } = await import('node:crypto');

    // A push endpoint that actually accepts, unlike the .invalid host above —
    // that one can only ever exercise the failure path.
    let pushed = 0;
    const pushHost = createServer((req, res) => { pushed++; res.writeHead(201); res.end(); });
    await new Promise((r) => pushHost.listen(0, '127.0.0.1', r));
    const endpoint = `http://127.0.0.1:${pushHost.address().port}/sub/live`;

    const emp = (await api('POST', '/auth/register', { body: { role: 'employer', name: 'Thandi Mokoena', phone: '0829990008', password: 'test1234', verifyToken: await verifyPhone('0829990008') } })).json.token;

    /** Post a gig, hire the worker, and wait for the detached notify to settle. */
    const hireOnce = async (title) => {
      const g = await api('POST', '/gigs', { token: emp, body: { title, category: 'cleaning', hours: 2, payPerHour: 60, location: 'Soweto', when: 'Wed 09:00' } });
      await api('POST', `/gigs/${g.json.id}/apply`, { token: wTok });
      await api('POST', `/gigs/${g.json.id}/hire`, { token: emp, body: { workerId: wId } });
      await new Promise((r) => setTimeout(r, 400));   // reach() runs detached
    };

    await dbRun('INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?,?,?,?,?,?)',
      [randomUUID(), wId, endpoint,
       'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
       'BTBZMqHH6r4Tts7J_aSIgg', new Date().toISOString()]);

    const smsBefore = smsAttempts();
    await hireOnce('Kitchen deep clean');
    ok(pushed === 1, 'a hire notice goes out over push when the worker has a live subscription');
    ok(smsAttempts() === smsBefore, 'and costs no SMS — the free channel is not duplicated');

    // Same event, no reachable device: the notice must still arrive.
    await dbRun('DELETE FROM push_subscriptions WHERE user_id = ?', [wId]);
    const smsMid = smsAttempts();
    await hireOnce('Windows and stoep');
    ok(pushed === 1, 'no further push once the subscription is gone');
    ok(smsAttempts() === smsMid + 1, 'SMS carries the notice instead — the fallback still fires');

    await new Promise((r) => pushHost.close(r));
  }

  // 9p) ops triage — someone can now receive safety reports and formal applications
  {
    ok((await api('GET', '/admin/safety-reports')).status === 404, 'triage routes are off without VUKA_ADMIN_TOKEN');
    process.env.VUKA_ADMIN_TOKEN = 'test-admin-token';
    const admin = (method, path, body) => fetch(BASE + path, {
      method, headers: { 'Content-Type': 'application/json', 'x-admin-token': 'test-admin-token' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));

    const open = await admin('GET', '/admin/safety-reports');
    ok(open.status === 200 && open.json.length >= 1, 'open safety reports are listed for triage');
    const withLinks = open.json.find((r) => r.gig?.id === 'j4');
    ok(withLinks?.reporter?.name && withLinks?.about?.name, 'a report arrives with the people and the gig attached');
    ok((await admin('POST', `/admin/safety-reports/${withLinks.id}/resolve`, { status: 'nonsense' })).status === 400, 'an unknown outcome is refused');
    ok((await admin('POST', `/admin/safety-reports/${withLinks.id}/resolve`, { status: 'actioned', note: 'Called both parties.' })).status === 200, 'a report can be resolved with a note');
    ok(!(await admin('GET', '/admin/safety-reports')).json.some((r) => r.id === withLinks.id), 'a resolved report leaves the open queue');
    ok((await admin('GET', '/admin/safety-reports?status=all')).json.some((r) => r.id === withLinks.id && r.note === 'Called both parties.'), 'the full history keeps the note');
    ok((await admin('POST', '/admin/safety-reports/nope/resolve', { status: 'actioned' })).status === 404, 'resolving an unknown report 404s');

    const fApps = await admin('GET', '/admin/formal-applications');
    ok(fApps.status === 200 && fApps.json.some((a) => a.job.id === 'f1'), "the worker's formal application actually reaches someone");
    const app1 = fApps.json.find((a) => a.job.id === 'f1');
    ok(app1.worker?.tier && typeof app1.worker?.jobsDone === 'number', 'the reviewer sees the verified record, not just a name');
    ok((await admin('POST', `/admin/formal-applications/${app1.id}/decide`, { status: 'maybe' })).status === 400, 'an unknown decision is refused');
    ok((await admin('POST', `/admin/formal-applications/${app1.id}/decide`, { status: 'rejected', note: 'Filled internally.' })).status === 200, 'an application can be decided');
    const seen = (await api('GET', '/me/formal-applications', { token: wTok })).json.find((a) => a.jobId === 'f1');
    ok(seen?.status === 'rejected' && seen?.note === 'Filled internally.' && seen?.decidedAt, 'the worker is told the outcome — not left in silence');
    ok(!(await admin('GET', '/admin/formal-applications')).json.some((a) => a.id === app1.id), 'a decided application leaves the queue');

    const errs = await admin('GET', '/admin/errors');
    ok(errs.status === 200 && errs.json?.target === 'log' && Array.isArray(errs.json?.errors), 'recent errors are readable without a paid monitoring plan');
    delete process.env.VUKA_ADMIN_TOKEN;
  }

  // 9m) password reset by SMS code
  ok((await api('POST', '/auth/password/request', { body: { phone: '0000' } })).status === 400, 'reset needs a valid number');
  const unknown = await api('POST', '/auth/password/request', { body: { phone: '0899999999' } });
  ok(unknown.status === 200 && unknown.json?.devCode === undefined, 'an unknown number gets the same answer, with no code');
  const reqReset = await api('POST', '/auth/password/request', { body: { phone: '0829990002' } });
  ok(reqReset.status === 200 && reqReset.json?.devCode?.length === 6, 'a registered number gets a 6-digit reset code');
  ok((await api('POST', '/auth/password/confirm', { body: { phone: '0829990002', code: '000000', password: 'newpass123' } })).status === 400, 'a wrong reset code is refused');
  ok((await api('POST', '/auth/password/confirm', { body: { phone: '0829990002', code: reqReset.json.devCode, password: 'short' } })).status === 400, 'a weak new password is refused');
  const confirmReset = await api('POST', '/auth/password/confirm', { body: { phone: '0829990002', code: reqReset.json.devCode, password: 'brand-new-pass' } });
  ok(confirmReset.status === 200 && confirmReset.json?.token, 'reset succeeds and signs the user straight in');
  ok((await api('POST', '/auth/password/confirm', { body: { phone: '0829990002', code: reqReset.json.devCode, password: 'another-pass' } })).status === 400, 'a used reset code cannot be replayed');
  ok((await api('POST', '/auth/login', { body: { phone: '0829990002', password: 'brand-new-pass' } })).status === 200, 'the new password works');
  // The old session must die with the old password.
  ok((await api('GET', '/me/gigs', { token: eTok })).status === 401, 'sessions from before the reset are ended');
  ok((await api('GET', '/me/gigs', { token: confirmReset.json.token })).status === 200, 'the session issued by the reset works');

  // A session opened in the same second as a reset must not outlive it. Timing
  // makes this hard to hit by accident — the previous whole-second comparison
  // passed locally and failed on a faster machine — so it is pinned here: the
  // token the first reset issued is itself only a moment old when the second
  // reset lands on it.
  const resetAgain = await api('POST', '/auth/password/request', { body: { phone: '0829990002' } });
  ok(resetAgain.json?.devCode?.length === 6, 'a second reset code can be requested');
  const secondReset = await api('POST', '/auth/password/confirm', { body: { phone: '0829990002', code: resetAgain.json.devCode, password: 'third-password-x' } });
  ok(secondReset.status === 200 && secondReset.json?.token, 'the second reset succeeds');
  ok((await api('GET', '/me/gigs', { token: confirmReset.json.token })).status === 401, 'a session minted moments before a reset is ended by it, same second or not');
  ok((await api('GET', '/me/gigs', { token: secondReset.json.token })).status === 200, "a reset's own token survives its own cut-off");

  // Three resets inside one second is where a clock-derived cut-off breaks
  // down, so the monotonic one is checked twice over.
  const thirdRequest = await api('POST', '/auth/password/request', { body: { phone: '0829990002' } });
  const thirdReset = await api('POST', '/auth/password/confirm', { body: { phone: '0829990002', code: thirdRequest.json.devCode, password: 'fourth-password-x' } });
  ok(thirdReset.status === 200, 'a third reset succeeds');
  ok((await api('GET', '/me/gigs', { token: secondReset.json.token })).status === 401, 'back-to-back resets each end the session the previous one issued');
  ok((await api('GET', '/me/gigs', { token: thirdReset.json.token })).status === 200, 'and the newest session still works');

  // 10) demo login works with seeded credentials
  const demo = await api('POST', '/auth/login', { body: { phone: '0710000000', password: 'demo1234' } });
  ok(demo.status === 200 && demo.json?.user?.name === 'Thandeka Mokoena', 'demo worker login works');
  ok(demo.json?.cv?.jobsDone === 2 && demo.json?.cv?.jobsToGo === 1, 'demo worker: 2 jobs, 1 to Trusted');

  // 10b) auto-release: work the employer never came back to confirm.
  // The whole point is that an employer's silence can no longer cancel a
  // worker's progress — but it must not manufacture a reputation either.
  {
    const { releaseDueJobs } = await import('./autorelease.mjs');
    const { computeCv } = await import('./engine.mjs');

    const mixed = computeCv([
      { rating: 4, pay: 100, safety_flag: 0, category: 'garden' },
      { rating: 0, pay: 200, safety_flag: 0, category: 'errands' },
    ], false);
    ok(mixed.jobsDone === 2, 'unrated work still counts as a job done');
    ok(mixed.totalEarned === 300, 'unrated work still counts toward total earned');
    ok(mixed.avg === 4, 'an unrated job does not drag the average down');

    const unratedOnly = computeCv([{ rating: 0, pay: 50, safety_flag: 0, category: 'errands' }], false);
    ok(unratedOnly.jobsDone === 1 && unratedOnly.avg === 0, 'a worker with only unrated work has jobs but no average yet');

    ok((await api('GET', '/config')).json?.autoReleaseHours > 0, 'config publishes the confirmation window');

    // A fresh employer: the one above owns phone 0829990002, whose sessions the
    // password-reset section deliberately invalidates.
    const arEmp = (await api('POST', '/auth/register', { body: { role: 'employer', name: 'Sipho Ndlovu', phone: '0829990007', password: 'test1234', verifyToken: await verifyPhone('0829990007') } })).json.token;

    const posted = await api('POST', '/gigs', { token: arEmp, body: { title: 'Move some boxes', category: 'errands', hours: 3, payPerHour: 55, location: 'Soweto', when: 'Tue 08:00' } });
    const gigId = posted.json.id;
    await api('POST', `/gigs/${gigId}/apply`, { token: wTok });
    await api('POST', `/gigs/${gigId}/hire`, { token: arEmp, body: { workerId: wId } });
    ok((await api('POST', `/gigs/${gigId}/complete`, { token: wTok, body: { rating: 5 } })).json?.status === 'worker_done', 'worker marks the job done');

    const idle = await releaseDueJobs({ hours: 72 });
    ok(!idle.some((r) => r.gig_id === gigId), 'a job still inside the window is left alone');

    const before = (await api('GET', '/me/cv', { token: wTok })).json.cv;
    const later = new Date(Date.now() + 73 * 3_600_000);
    const released = await releaseDueJobs({ now: later, hours: 72 });
    ok(released.some((r) => r.gig_id === gigId), 'a job past the window is auto-released');

    // Other fixtures may come due in the same sweep, so measure against what
    // this sweep actually credited to this worker rather than a fixed number.
    const mine = released.filter((r) => r.worker_id === wId);
    const earned = mine.reduce((s, r) => s + Math.round(r.hours * r.pay_per_hour), 0);

    const after = (await api('GET', '/me/cv', { token: wTok })).json;
    ok(after.cv.jobsDone === before.jobsDone + mine.length, 'auto-released work lands on the CV');
    ok(after.cv.totalEarned === before.totalEarned + earned, 'auto-released work counts toward total earned');
    ok(Math.abs(after.cv.avg - before.avg) < 1e-9, "an employer's silence does not move the worker's average");

    const row = after.history.find((h) => h.jobTitle === 'Move some boxes');
    ok(row?.autoReleased === true, 'the CV entry is flagged as auto-released');
    ok(row?.rating === 0, 'the auto-released entry carries no rating rather than a zero-star one');

    ok(!(await releaseDueJobs({ now: later, hours: 72 })).some((r) => r.gig_id === gigId), 'a released job is never released twice');
    ok((await api('GET', '/me/cv', { token: wTok })).json.cv.jobsDone === after.cv.jobsDone, 'a second sweep does not double-count');

    const hire = (await api('GET', '/me/hires', { token: arEmp })).json?.find((h) => h.gig.id === gigId);
    ok(hire?.status === 'completed', 'the employer sees it as completed');
    ok((await api('POST', `/applications/${hire.applicationId}/confirm`, { token: arEmp, body: { rating: 5 } })).status === 409,
      'an employer cannot retro-rate a job that was already auto-released');
  }

  // 11) auth rate limiting: repeated failed logins eventually get throttled (429).
  // Runs last so tripping the limiter doesn't affect earlier assertions.
  let saw429 = false;
  for (let i = 0; i < 30; i++) {
    const r = await api('POST', '/auth/login', { body: { phone: '0710000000', password: 'wrong-password' } });
    if (r.status === 429) { saw429 = true; break; }
  }
  ok(saw429, 'auth endpoint rate-limits repeated failed logins (429)');

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
