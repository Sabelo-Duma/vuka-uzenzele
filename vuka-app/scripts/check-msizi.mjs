/**
 * Does Msizi answer the right question, and admit it when it cannot?
 *
 * Msizi fails silently by nature. A matcher that picks the wrong entry returns
 * a confident, well-written, entirely irrelevant answer — and the person who
 * gets it has no way to tell that from a right one. Nothing throws, nothing
 * turns red, and the only symptom is a worker who believes Vuka is holding
 * their wages. So the behaviour is asserted here instead.
 *
 * Four kinds of assertion, and the second and third matter most:
 *
 *  1. The knowledge base is internally sound — every follow-up points at
 *     something real, every {placeholder} is one the engine knows how to fill.
 *  2. Real questions reach the right answer. The phrasings are the ones people
 *     actually use, including in the app's other four languages.
 *  3. Questions Vuka has no business answering reach a MISS. A knowledge base
 *     that answers "what is the weather" with the branch-code page is worse
 *     than one that shrugs.
 *  4. No figure is ever hardcoded into an answer. The minimum wage is
 *     re-gazetted every March and has already gone stale in this codebase
 *     twice; an assistant reciting last year's wage would be the third and the
 *     most convincing.
 *
 * Run: node scripts/check-msizi.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
let checks = 0;

function ok(condition, message, detail) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  FAIL  ${message}`);
    if (detail) console.error(`        ${detail}`);
  }
}

/* The engine is TypeScript and imports other TypeScript. Bundling it with the
   esbuild that Vite already depends on runs the real module rather than a
   reimplementation of it — a test against a copy of the scoring logic would
   pass forever while the app did something else. */
const outDir = mkdtempSync(join(tmpdir(), 'msizi-'));
const outFile = join(outDir, 'msizi.mjs');
await build({
  entryPoints: [join(root, 'src', 'lib', 'msizi.ts')],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'silent',
});

const M = await import(pathToFileURL(outFile).href);
const { KNOWLEDGE } = await import(pathToFileURL(await bundleData()).href);

async function bundleData() {
  const file = join(outDir, 'data.mjs');
  await build({
    entryPoints: [join(root, 'src', 'data', 'msizi.ts')],
    outfile: file,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    logLevel: 'silent',
  });
  return file;
}

console.log(`\nMsizi — ${KNOWLEDGE.length} written answers, ${M.LIVE_INTENTS.length} live answers\n`);

/* ---- A worker and an employer to ask questions as ---------------------- */

const TIER = { id: 1, name: 'Trusted', tagline: 'Proven & reliable', icon: '🥉', minJobs: 3, minRating: 4, maxFlags: 0, unlocks: 'Higher-paying gigs' };
const NEXT_TIER = { id: 2, name: 'Professional', tagline: 'Job-ready', icon: '🥈', minJobs: 8, minRating: 4.3, maxFlags: 0, unlocks: 'Formal work' };

const worker = {
  role: 'worker',
  name: 'Thabo',
  cv: {
    jobsDone: 5, avg: 4.4, totalEarned: 2150, flags: 0, categoriesWorked: 2, rep: 78,
    earnedBadges: new Set(['first', 'reliable']),
    tier: TIER, nextTier: NEXT_TIER, tierProgress: 40, jobsToGo: 3, ratingMet: true, flagBlocked: false,
  },
  minWage: 30.23, autoReleaseHours: 72, applied: 4, gigsNearby: 12, unread: 2, idVerified: true,
};

/** Somebody who signed up an hour ago. Every live answer must cope with this. */
const newcomer = { ...worker, name: 'Nomsa', cv: null, applied: 0, gigsNearby: 0, unread: 0, idVerified: false };

const employer = { ...worker, role: 'employer', name: 'Lerato', cv: null };

/* ---- 1. The knowledge base is internally sound ------------------------- */

const liveIds = new Set(M.LIVE_INTENTS.map((i) => i.id));
const knownIds = new Set([...KNOWLEDGE.map((e) => e.id), ...liveIds]);

ok(knownIds.size === KNOWLEDGE.length + M.LIVE_INTENTS.length, 'no id is used twice');

for (const e of KNOWLEDGE) {
  ok(e.asks.length > 0, `${e.id}: has at least one phrasing`);
  ok(e.body.trim().length > 40, `${e.id}: body is a real answer`);
  ok(e.title.trim().length > 0, `${e.id}: has a title`);
  for (const id of e.next ?? []) {
    ok(knownIds.has(id), `${e.id}: follow-up "${id}" exists`);
  }
}

for (const i of M.LIVE_INTENTS) {
  ok(i.asks.length > 0, `${i.id}: has at least one phrasing`);
  ok(typeof i.resolve === 'function', `${i.id}: resolves`);
}

/* Every opener must resolve, for both roles — an opener chip that points at
   nothing is a dead button on the first screen anybody sees. */
for (const role of ['worker', 'employer']) {
  const ids = M.openers(role);
  ok(ids.length > 0, `${role}: has opening suggestions`);
  for (const id of ids) ok(M.lookup(id) !== null, `${role}: opener "${id}" resolves`);
}

/* ---- 2. Placeholders, and the rule against hardcoded figures ----------- */

const KNOWN_PLACEHOLDERS = new Set([
  'minWage', 'autoReleaseHours', 'tiers', 'categories', 'badges', 'hosting', 'youthUnemployment',
]);

for (const e of KNOWLEDGE) {
  for (const m of e.body.matchAll(/\{(\w+)\}/g)) {
    ok(KNOWN_PLACEHOLDERS.has(m[1]), `${e.id}: placeholder {${m[1]}} is one the engine fills`);
  }
  const filled = M.fill(e.body, worker);
  ok(!/\{\w+\}/.test(filled), `${e.id}: nothing is left unfilled`, filled.match(/\{\w+\}/g)?.join(' '));
}

/* The whole point of the placeholders. A rand figure or a bare hour count
   typed into an answer is a number that cannot be updated from the server, and
   this is the assertion that keeps it out. */
for (const e of KNOWLEDGE) {
  const rand = e.body.match(/R\s?\d/);
  ok(rand === null, `${e.id}: no rand amount is typed into the answer`, rand?.[0]);
  const hours = e.body.match(/\b\d+\s*(hours?|days?)\b/i);
  ok(hours === null, `${e.id}: no confirmation window is typed into the answer`, hours?.[0]);
}

/* And the wage really does come from the context it was given, not a constant. */
{
  const odd = { ...worker, minWage: 99.99 };
  const answer = M.ask('what is minimum wage', odd);
  ok(answer.body.includes('99,99') || answer.body.includes('99.99'),
    'the minimum wage in an answer comes from live config, not a constant', answer.body.slice(0, 120));
}
{
  const odd = { ...worker, autoReleaseHours: 48 };
  const answer = M.ask('what if the employer never confirms', odd);
  ok(answer.body.includes('2 days'),
    'the confirmation window in an answer comes from live config', answer.body.slice(0, 160));
}

/* ---- 3. Real questions reach the right answer -------------------------- */

const SHOULD_MATCH = [
  // Getting started
  ['how do i sign up', 'how-to-start', worker],
  ['how do i create an account', 'how-to-start', worker],
  ['i did not get my otp', 'otp-problems', worker],
  ['the sms code never arrived', 'otp-problems', worker],
  ['i forgot my password', 'forgot-password', worker],
  ['is vuka free', 'is-it-free', worker],
  ['do i have to pay to use this', 'is-it-free', worker],

  // Finding work
  ['how do i find work', 'find-work', worker],
  ['where are the jobs', 'find-work', worker],
  ['what kind of jobs are there', 'job-types', worker],
  ['what happens after i apply', 'after-i-apply', worker],
  ['why has nobody replied to my application', 'after-i-apply', worker],
  ['why is this job locked', 'formal-jobs-locked', worker],
  ['how do i unlock formal jobs', 'formal-jobs-locked', worker],

  // Record and ladder
  ['what is my record', 'my-record', worker],
  ['how is my score calculated', 'vuka-score', worker],
  ['what is the ladder', 'the-ladder', worker],
  ['what are the tiers', 'the-ladder', worker],
  ['how do i move up a tier', 'move-up-tier', worker],
  ['what is a safety flag', 'safety-flag', worker],
  ['how do i share my cv', 'public-cv', worker],

  // Money — the answers that must never be wrong
  ['how do i get paid', 'how-payment-works', worker],
  ['does vuka hold my money', 'how-payment-works', worker],
  ['what is the minimum wage', 'fair-pay', worker],
  ['why does vuka want my bank details', 'banking-details', worker],

  // Safety
  ['is vuka safe', 'is-it-safe', worker],
  ['how do i report someone', 'report-someone', worker],
  ['how do i block someone', 'block-someone', worker],
  ['how do i verify my id', 'id-verification', worker],
  ['what data do you keep about me', 'what-data', worker],
  ['how do i delete my account', 'delete-account', worker],

  // App behaviour
  ['does this work offline', 'works-offline', worker],
  ['how do i install the app', 'install-app', worker],
  ['how do i change the language', 'change-language', worker],
  ['how do i turn on notifications', 'notifications', worker],

  // Msizi itself
  ['who are you', 'who-is-msizi', worker],
  ['can you speak isizulu', 'msizi-languages', worker],

  // Live — about the person asking
  ['what is my score', 'my-score', worker],
  ['what is my tier', 'my-tier', worker],
  ['how many jobs have i done', 'my-jobs', worker],
  ['how much have i earned', 'my-earnings', worker],
  ['what badges do i have', 'my-badges', worker],
  ['am i verified', 'my-verification', worker],

  // Employer
  ['how do i post a job', 'post-a-job', employer],
  ['how do i choose a worker', 'choose-worker', employer],
  ['how do i confirm a job is done', 'employer-confirm', employer],
  ['does vuka take commission', 'employer-cost', employer],

  // The other four languages
  ['hoe kry ek werk', 'find-work', worker],
  ['hoe verander ek die taal', 'change-language', worker],
  ['ngingawuthola kanjani umsebenzi', 'find-work', worker],
];

for (const [question, expected, ctx] of SHOULD_MATCH) {
  const reply = M.ask(question, ctx);
  ok(reply.id === expected,
    `"${question}" → ${expected}`,
    reply.id === null
      ? `missed entirely (best score ${reply.score.toFixed(2)})`
      : `got ${reply.id} (score ${reply.score.toFixed(2)})`);
  if (reply.id === expected) {
    ok(reply.body.trim().length > 0, `"${question}" produces a body`);
  }
}

/* ---- 4. Questions Vuka has no business answering must MISS ------------- */

const SHOULD_MISS = [
  'what is the weather today',
  'who won the soccer last night',
  'how do i cook rice',
  'tell me a joke',
  'what is the capital of france',
  'sell me a car',
  'what is your favourite colour',
];

for (const question of SHOULD_MISS) {
  const reply = M.ask(question, worker);
  ok(reply.kind === 'miss',
    `"${question}" is honestly refused`,
    `answered with ${reply.id} at ${reply.score.toFixed(2)}`);
  ok(reply.suggestions.length > 0, `"${question}" still offers somewhere to go`);
}

/* An empty or nonsense question is a miss, not a crash. */
for (const junk of ['', '   ', '?!?!', '...']) {
  const reply = M.ask(junk, worker);
  ok(reply.kind === 'miss', `"${junk}" is a miss rather than an answer`);
}

/* ---- 5. Live answers survive a brand-new account ----------------------- */

for (const intent of M.LIVE_INTENTS) {
  const reply = M.askById(intent.id, newcomer);
  ok(reply !== null, `${intent.id}: answers for a new account`);
  ok(reply && reply.body.trim().length > 20,
    `${intent.id}: gives a new account a real sentence, not a blank`,
    reply?.body);
  ok(reply && !/NaN|undefined|null/.test(reply.body),
    `${intent.id}: no NaN or undefined leaks into a new account's answer`, reply?.body);
}

/* And for a worker with a record, the figures are actually theirs. */
{
  const score = M.askById('my-score', worker);
  ok(score.body.includes('78'), 'my-score reads the real score back', score.body);
  const earned = M.askById('my-earnings', worker);
  ok(earned.body.includes('2') && /R\s?2/.test(earned.body), 'my-earnings reads the real total back', earned.body);
  const tier = M.askById('my-tier', worker);
  ok(tier.body.includes('Trusted'), 'my-tier names the real tier', tier.body);
  ok(tier.body.includes('3 more'), 'my-tier says what is still missing', tier.body);
}

/* ---- 6. The two roles do not get each other's answers ------------------ */

{
  /* An employer's answer must never outrank a worker's on a worker's phone. */
  const workerAsking = M.ask('how do i get work', worker);
  ok(workerAsking.id !== 'post-a-job', 'a worker asking for work is not told how to post a job', workerAsking.id);

  const employerAsking = M.ask('how do i hire someone', employer);
  ok(employerAsking.id === 'post-a-job' || employerAsking.id === 'choose-worker',
    'an employer asking to hire gets an employer answer', employerAsking.id);

  /* Follow-up chips are never cross-role. */
  for (const role of ['worker', 'employer']) {
    const ctx = role === 'worker' ? worker : employer;
    for (const e of KNOWLEDGE) {
      const reply = M.askById(e.id, ctx);
      if (!reply) continue;
      for (const id of reply.suggestions) {
        const target = KNOWLEDGE.find((k) => k.id === id) ?? M.LIVE_INTENTS.find((l) => l.id === id);
        ok(!target?.role || target.role === role,
          `${role}: "${e.id}" does not suggest the other role's "${id}"`);
      }
    }
  }
}

/* ---- 7. Every written answer is reachable by its own first phrasing ---- */

for (const e of KNOWLEDGE) {
  const ctx = e.role === 'employer' ? employer : worker;
  const reply = M.ask(e.asks[0], ctx);
  ok(reply.id === e.id,
    `"${e.asks[0]}" reaches its own entry (${e.id})`,
    `got ${reply.id} at ${reply.score.toFixed(2)}`);
}

for (const i of M.LIVE_INTENTS) {
  const ctx = i.role === 'employer' ? employer : worker;
  const reply = M.ask(i.asks[0], ctx);
  ok(reply.id === i.id,
    `"${i.asks[0]}" reaches its own live answer (${i.id})`,
    `got ${reply.id} at ${reply.score.toFixed(2)}`);
}

/* ---- Conversation: "hello" must never be "I do not know that one" ----- */

/* Reported from a real phone: the first thing a person typed was "hello" and
   the answer was a refusal. Small talk is its own layer, checked here in all
   five languages, and it must NOT swallow real questions. */
const chatFile = join(outDir, 'chat.mjs');
await build({
  entryPoints: [join(root, 'src', 'lib', 'msiziChat.ts')],
  outfile: chatFile, bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', logLevel: 'silent',
});
const C = await import(pathToFileURL(chatFile).href);

const SMALL_TALK = [
  ['hello', 'greet'], ['Hello!', 'greet'], ['hi msizi', 'greet'], ['Sawubona', 'greet'], ['Molo', 'greet'],
  ['Dumela', 'greet'], ['Hallo', 'greet'], ['howzit', 'greet'], ['good morning', 'greet'],
  ['how are you?', 'howAreYou'], ['unjani', 'howAreYou'], ['hoe gaan dit', 'howAreYou'], ['o kae', 'howAreYou'],
  ['thank you', 'thanks'], ['thanks Msizi!', 'thanks'], ['ngiyabonga', 'thanks'], ['enkosi', 'thanks'],
  ['ke a leboha', 'thanks'], ['dankie', 'thanks'],
  ['bye', 'bye'], ['sala kahle', 'bye'], ['totsiens', 'bye'],
  ['what can you do', 'capabilities'], ['help', 'capabilities'], ['ngisize', 'capabilities'],
  ['are you a robot?', 'areYouAi'], ['who are you', 'whoAreYou'], ['tell me a joke', 'joke'], ['ok', 'ack'],
];
for (const [text, intent] of SMALL_TALK) {
  const r = C.smallTalk(text, 'en', 'Thandeka', 'worker');
  ok(r?.intent === intent, `"${text}" is small talk (${intent})`, `got ${r?.intent ?? 'nothing'}`);
}

/* Replies exist and are filled in every language, with no placeholder left. */
for (const lang of ['en', 'zu', 'xh', 'st', 'af']) {
  for (const [text] of SMALL_TALK) {
    const r = C.smallTalk(text, lang, 'Thandeka', 'worker');
    ok(r && r.body.length > 5 && !/\{\w+\}/.test(r.body), `${lang}: "${text}" has a real reply`, r?.body);
  }
}
ok(C.smallTalk('hello', 'en', 'Thandeka', 'worker').body.includes('Thandeka'), 'a greeting uses the first name');
ok(C.smallTalk('Sawubona', 'en', '', 'worker').body.startsWith('Sawubona!'), 'a greeting is returned in the words it came in');

/* Real questions are NOT small talk. */
for (const q of ['how do i get paid', 'hello how do i get paid', 'thanks but what about my bank details',
  'help me find work', 'is it safe', 'what is my score']) {
  ok(C.smallTalk(q, 'en', '', 'worker') === null, `"${q}" is a question, not small talk`);
}

/* A greeting in front of a question is peeled off and the question answered. */
for (const [q, id] of [['Hi, how do I get paid?', 'how-payment-works'], ['Sawubona Msizi how do I find work', 'find-work'],
  ['hello! what is my score', 'my-score']]) {
  const { rest } = C.peelGreeting(q);
  const reply = M.ask(rest, worker);
  ok(reply.id === id, `"${q}" is answered as "${rest}" (${id})`, `got ${reply.id}`);
}

/* The model fallback is grounded on written answers, never on the record. */
{
  const g = M.groundingFor('does vuka keep my money', worker);
  ok(g.length > 0 && g.length <= 4, 'grounding sends a handful of entries');
  ok(g.every((e) => !/\{\w+\}/.test(e.body)), 'grounding bodies have their figures resolved');
  const titles = new Set(M.LIVE_INTENTS.map((i) => i.title));
  ok(M.groundingFor('what is my score', worker).every((e) => !titles.has(e.title)),
    'a live answer (the person\'s own record) is never sent as grounding');
  ok(M.groundingFor('zzzz qqqq', worker).length > 0, 'a question with nothing near still gets the basics');
}

/* ---- done -------------------------------------------------------------- */

rmSync(outDir, { recursive: true, force: true });

console.log(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) {
  console.error(`Msizi: ${failures} failure${failures === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
