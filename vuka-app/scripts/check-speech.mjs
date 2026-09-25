/**
 * The microphone always closes, and the voice reads words rather than symbols.
 *
 * Both halves of this file exist because of a real handset.
 *
 * **Listening never stopped.** Chrome on Android ignores `continuous`, and when
 * the platform recogniser underneath it does not report an endpoint, `onend` is
 * never fired and the microphone is simply left open. Nothing throws. The page
 * looks fine. The recording indicator stays on. So the Listener stopped
 * trusting the engine and went onto its own clocks — and those clocks are what
 * this file asserts, by driving the class with an engine that behaves as badly
 * as the real one did.
 *
 * The contract being tested is one sentence: **onEnd fires exactly once, and
 * the recogniser is aborted, no matter what the engine does or fails to do.**
 * The screen drives its listening state off that, so if it can be broken the
 * user gets a pulsing microphone with nothing behind it.
 *
 * **The voice sounded unnatural.** Partly voice selection, mostly that it was
 * being handed text written for eyes: "R30,23" read aloud as "R thirty comma
 * twenty three", tier medals announced as "bronze medal", bullets flattened
 * into one long breathless line. Those rewrites are asserted here against the
 * real strings from data/msizi.ts.
 *
 * Time is virtual. The listener's ceiling is fifteen seconds and this suite
 * runs in milliseconds, because the clock is a fake one the test advances by
 * hand — which also makes the timing assertions exact instead of flaky.
 *
 * Run: node scripts/check-speech.mjs
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
  if (condition) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail !== undefined) console.error(`        ${detail}`);
}

/* ---- A controllable clock ---------------------------------------------- */

let now = 0;
let seq = 0;
let pending = [];

function fakeSetTimeout(fn, ms) {
  const id = ++seq;
  pending.push({ id, at: now + (Number(ms) || 0), fn });
  return id;
}
function fakeClearTimeout(id) {
  const i = pending.findIndex((p) => p.id === id);
  if (i >= 0) pending.splice(i, 1);
}
/** Run every timer due within `ms`, in order, as if that long had passed. */
function advance(ms) {
  const target = now + ms;
  for (;;) {
    const due = pending.filter((p) => p.at <= target).sort((a, b) => a.at - b.at)[0];
    if (!due) break;
    pending = pending.filter((p) => p !== due);
    now = due.at;
    due.fn();
  }
  now = target;
}
function resetClock() { now = 0; seq = 0; pending = []; }

/* ---- An engine that misbehaves exactly like the real one ---------------- */

/**
 * A stand-in for SpeechRecognition whose every callback is fired by the test
 * rather than by a platform. The default instance does NOTHING after start() —
 * which is precisely the Android failure being defended against.
 */
class FakeRecognition {
  static last = null;
  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
    this.onspeechstart = null;
    this.onaudioend = null;
    this.started = false;
    this.stopCalls = 0;
    this.abortCalls = 0;
    /** Set by a test to make stop() behave like an engine that does reply. */
    this.endOnStop = false;
    FakeRecognition.last = this;
  }
  start() { this.started = true; }
  stop() { this.stopCalls += 1; if (this.endOnStop) this.onend?.(); }
  abort() { this.abortCalls += 1; }

  /** Feed a result through, as the platform would. */
  emit(transcript, isFinal) {
    const results = { length: 1, 0: { isFinal, length: 1, 0: { transcript, confidence: 0.9 } } };
    this.onresult?.({ resultIndex: 0, results });
  }
  fail(code) { this.onerror?.({ error: code }); }
}

globalThis.window = {
  SpeechRecognition: FakeRecognition,
  setTimeout: fakeSetTimeout,
  clearTimeout: fakeClearTimeout,
  speechSynthesis: undefined,
  addEventListener() {},
  removeEventListener() {},
};

/* ---- Load the real module ---------------------------------------------- */

const outDir = mkdtempSync(join(tmpdir(), 'speech-'));
const outFile = join(outDir, 'speech.mjs');
await build({
  entryPoints: [join(root, 'src', 'lib', 'speech.ts')],
  outfile: outFile,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'silent',
});
const S = await import(pathToFileURL(outFile).href);

console.log('\nSpeech — listening contract and spoken-text rewrites\n');

/* ---- 1. The timings are sane relative to each other --------------------- */

const T = S.LISTEN_TIMINGS;
ok(T.SILENCE_AFTER_SPEECH_MS < T.SILENCE_BEFORE_SPEECH_MS,
  'the pause after speaking is shorter than the wait for speech to begin');
ok(T.SILENCE_BEFORE_SPEECH_MS < T.MAX_LISTEN_MS,
  'the no-speech wait is inside the absolute ceiling');
ok(T.MAX_LISTEN_MS <= 30_000,
  'the microphone can never be held for more than half a minute', T.MAX_LISTEN_MS);
ok(T.END_WATCHDOG_MS > 0 && T.END_WATCHDOG_MS < 5_000,
  'the watchdog after stop() is short');

/* ---- 2. The reported bug: an engine that never ends --------------------- */

function session(lang = 'en') {
  resetClock();
  const seen = { partial: [], final: [], error: [], end: 0 };
  const listener = new S.Listener(lang, {
    onPartial: (t) => seen.partial.push(t),
    onFinal: (t) => seen.final.push(t),
    onError: (e) => seen.error.push(e),
    onEnd: () => { seen.end += 1; },
  });
  const started = listener.start();
  return { listener, seen, started, rec: FakeRecognition.last };
}

{
  /* The exact Android failure: start listening, and the engine does nothing at
     all. No result, no error, no onend. Before this fix the microphone stayed
     open and the screen pulsed forever. */
  const { seen, started, rec } = session();
  ok(started, 'a session starts');
  ok(rec.started, 'the recogniser was started');
  ok(seen.end === 0, 'it is still listening before any time passes');

  advance(T.SILENCE_BEFORE_SPEECH_MS + 10);
  ok(rec.stopCalls === 1, 'silence asks the engine to stop', `stop() x${rec.stopCalls}`);

  /* ...and the engine ignores stop() too, which is the same bug one step on. */
  advance(T.END_WATCHDOG_MS + 10);
  ok(seen.end === 1, 'onEnd fires even though the engine never ended', `end x${seen.end}`);
  ok(rec.abortCalls === 1, 'the microphone is force-released', `abort() x${rec.abortCalls}`);
  ok(seen.error.includes('no-speech'), 'the user is told nothing was heard', seen.error.join(','));

  /* And nothing fires a second time however long it runs. */
  advance(60_000);
  ok(seen.end === 1, 'onEnd never fires twice', `end x${seen.end}`);
}

{
  /* The absolute ceiling: somebody talking continuously into a recogniser that
     never decides they have finished. */
  const { seen, rec } = session();
  for (let t = 0; t < T.MAX_LISTEN_MS; t += 1_000) {
    rec.emit('and another thing', false);
    advance(1_000);
  }
  ok(seen.end === 0 || rec.stopCalls > 0, 'continuous speech is eventually wound up');
  advance(T.MAX_LISTEN_MS + T.END_WATCHDOG_MS);
  ok(seen.end === 1, 'the ceiling closes the microphone exactly once', `end x${seen.end}`);
  ok(rec.abortCalls >= 1, 'the ceiling releases the microphone');
}

/* ---- 3. The ordinary paths still behave -------------------------------- */

{
  const { seen, rec } = session();
  rec.emit('how do i get paid', true);
  ok(seen.final.length === 1, 'a final result is delivered once', seen.final.join(' | '));
  ok(seen.final[0] === 'how do i get paid', 'the transcript is what was said', seen.final[0]);
  ok(seen.end === 1, 'the session ends on a final result');
  ok(rec.abortCalls === 1, 'a delivered answer releases the microphone');
  advance(60_000);
  ok(seen.end === 1, 'and stays ended', `end x${seen.end}`);
  ok(seen.final.length === 1, 'the answer is not delivered twice');
}

{
  /* Interim words, then quiet. The natural end of a spoken question. */
  const { seen, rec } = session();
  rec.emit('what is my', false);
  advance(500);
  rec.emit('what is my tier', false);
  ok(seen.partial.length >= 1, 'interim words reach the screen');
  ok(seen.end === 0, 'a pause mid-sentence does not end it');
  advance(T.SILENCE_AFTER_SPEECH_MS + 10);
  ok(rec.stopCalls === 1, 'a real silence winds the session up');
  advance(T.END_WATCHDOG_MS + 10);
  ok(seen.end === 1, 'and it ends');
}

{
  /* Android delivering its final result in the gap between stop() and onend —
     called out in the Chromium issue as a real race. It must not be lost. */
  const { seen, rec } = session();
  rec.emit('is vuka safe', false);
  advance(T.SILENCE_AFTER_SPEECH_MS + 10);
  rec.emit('is vuka safe', true);
  ok(seen.final.length === 1, 'a result arriving after stop() is still delivered', seen.final.join('|'));
  ok(seen.final[0] === 'is vuka safe', 'and it is the right one', seen.final[0]);
  ok(seen.end === 1, 'the session ends once');
}

{
  const { seen } = session();
  const rec = FakeRecognition.last;
  rec.fail('not-allowed');
  ok(seen.error[0] === 'denied', 'a refused microphone is reported as denied', seen.error[0]);
  ok(seen.end === 1, 'a denied microphone still ends the session');
  ok(rec.abortCalls === 1, 'and releases it');
}

{
  const { seen } = session('zu');
  const rec = FakeRecognition.last;
  rec.fail('language-not-supported');
  ok(seen.error[0] === 'no-language', 'an unsupported language is reported as such', seen.error[0]);
  ok(seen.end === 1, 'and the session ends');
}

{
  /* Leaving the screen mid-session. */
  const { listener, seen } = session();
  const rec = FakeRecognition.last;
  listener.cancel();
  ok(rec.abortCalls === 1, 'cancelling releases the microphone');
  ok(seen.end === 1, 'cancelling ends the session');
  ok(seen.final.length === 0, 'cancelling delivers nothing');
  ok(seen.error.length === 0, 'cancelling is not an error');
  advance(60_000);
  ok(seen.end === 1, 'and nothing fires afterwards');
}

{
  /* Tapping stop with words already heard. */
  const { listener, seen } = session();
  const rec = FakeRecognition.last;
  rec.emit('what is the ladder', false);
  rec.endOnStop = true;
  listener.stop();
  ok(seen.end === 1, 'tapping stop ends the session');
  ok(seen.final.length === 1 && seen.final[0] === 'what is the ladder',
    'tapping stop keeps what was heard', seen.final.join('|'));
}

/* ---- 4. Spoken text is rewritten for the ear --------------------------- */

const spoken = S.toSpeech;

ok(!/R\s?30/.test(spoken('The national minimum wage is R30,23 per hour.')),
  'a rand amount is not read as the letter R', spoken('The national minimum wage is R30,23 per hour.'));
ok(/30 rand 23/.test(spoken('R30,23 per hour')),
  'R30,23 is read as 30 rand 23', spoken('R30,23 per hour'));
ok(/1469 rand/.test(spoken('about R1 469 a month')),
  'a thousands space does not split the number in two', spoken('about R1 469 a month'));
ok(/2150 rand/.test(spoken('You have earned R2 150 from 5 jobs.')),
  'earnings read as one number', spoken('You have earned R2 150 from 5 jobs.'));
ok(/62,8 percent|62,8 percent/.test(spoken('Unemployment is 62,8% for ages 15 to 24.')),
  'a percentage is read as the word', spoken('Unemployment is 62,8% for ages 15 to 24.'));

{
  const medals = spoken('You are 🥉 Trusted — proven and reliable.');
  ok(!/[\u{1F300}-\u{1FAFF}]/u.test(medals), 'tier medals are not read aloud', medals);
  ok(/Trusted/.test(medals), 'and the words around them survive', medals);
}

{
  const bullets = spoken('Three conditions:\n• Enough completed jobs.\n• A good average.\n• No safety flags.');
  ok(!bullets.includes('•'), 'bullet characters are gone', bullets);
  ok(!bullets.includes('\n'), 'newlines are gone', bullets);
  ok((bullets.match(/\./g) ?? []).length >= 3, 'each bullet becomes its own sentence', bullets);
}

ok(spoken('A line with no full stop').endsWith('.'),
  'a line without punctuation gains a full stop so the voice pauses');
ok(!spoken('the entry — your rating — and tier').includes('—'),
  'em dashes become commas rather than being spoken');

/* ---- 5. Sentence splitting keeps utterances short ---------------------- */

{
  const long = 'One. Two! Three? Four: five. ' + 'A fairly long clause, '.repeat(30);
  const parts = S.toSentences(long);
  ok(parts.length > 4, 'text is split into several utterances', parts.length);
  ok(parts.every((p) => p.length <= 260),
    'no utterance is long enough to hit the fifteen-second cutoff',
    parts.map((p) => p.length).join(','));
  ok(parts.every((p) => p.trim().length > 0), 'no empty utterances');
}

ok(S.toSentences('').length === 0, 'empty text produces nothing to say');
ok(S.toSentences('   \n  ').length === 0, 'blank text produces nothing to say');

/* ---- 6. Voice ranking prefers the good ones ---------------------------- */

const voice = (name, lang, opts = {}) => ({
  name, lang, localService: opts.local ?? true, default: opts.def ?? false, voiceURI: name,
});

ok(S.voiceScore(voice('Google UK English Female', 'en-GB')) > S.voiceScore(voice('English Compact', 'en-GB')),
  'a Google voice outranks a compact one');
ok(S.voiceScore(voice('Microsoft Aria Natural', 'en-US')) > S.voiceScore(voice('Microsoft David', 'en-US')),
  'a natural voice outranks a plain one');
ok(S.voiceScore(voice('eSpeak English', 'en')) < 0,
  'eSpeak is actively avoided', S.voiceScore(voice('eSpeak English', 'en')));
ok(S.voiceScore(voice('Some Voice', 'en', { local: true })) > S.voiceScore(voice('Some Voice', 'en', { local: false })),
  'a local voice wins a tie, because a remote one would send the sentence away');
ok(S.voiceScore(voice('Unknown Engine', 'en')) >= 0,
  'an unrecognised voice is not penalised', S.voiceScore(voice('Unknown Engine', 'en')));

/* Msizi is a woman's voice — asked for by the product owner. */
const pairs = [
  ['Tessa', 'Daniel'],                                                  // iOS / macOS
  ['Samantha', 'Alex'],
  ['Google UK English Female', 'Google UK English Male'],               // Chrome
  ['Microsoft Zira - English (United States)', 'Microsoft David - English (United States)'],
  ['en-us-x-sfg-local', 'en-us-x-iom-local'],                           // Android codes
];
for (const [f, m] of pairs) {
  ok(S.voiceScore(voice(f, 'en-US')) > S.voiceScore(voice(m, 'en-US')),
    `female "${f}" outranks male "${m}" at the same quality`);
}
ok(S.voiceScore(voice('Microsoft Luke Online (Natural) - English (South Africa)', 'en-ZA', { local: false }))
  > S.voiceScore(voice('English Compact', 'en-ZA')),
  'a natural male voice still beats a robotic unnamed one — quality is not traded away entirely');
ok(S.voiceScore(voice('Samantha', 'en-US')) > S.voiceScore(voice('Grandma', 'en-US')),
  'novelty voices (Grandma, Bubbles, Zarvox...) are never Msizi');
ok(S.voiceScore(voice('Emmanuel', 'en-US')) === S.voiceScore(voice('Unknown Engine', 'en-US')),
  'names are matched as whole words — "Emmanuel" is not read as "Emma" or "man"');

/* pickVoice end to end, against a device list shaped like a real iPhone's. */
{
  const saved = globalThis.window;
  const list = [
    voice('Daniel', 'en-GB'), voice('Samantha', 'en-US', { def: true }),
    voice('Tessa', 'en-ZA'), voice('Bubbles', 'en-US'), voice('Microsoft Thando Online (Natural)', 'zu-ZA', { local: false }),
  ];
  globalThis.window = { ...(saved ?? {}), speechSynthesis: { getVoices: () => list } };
  try {
    ok(S.pickVoice('en').voice?.name === 'Tessa', 'English on an iPhone is read by Tessa, the South African woman',
      S.pickVoice('en').voice?.name);
    ok(S.pickVoice('zu').voice?.name === 'Microsoft Thando Online (Natural)', 'isiZulu uses a real isiZulu voice where one exists');
    ok(S.pickVoice('zu', { localOnly: true }).voice?.name === 'Tessa',
      'a personal answer never goes to a remote voice — it falls back to a local one');
    ok(S.pickVoice('zu', { localOnly: true }).coverage === 'fallback', 'and says it is a fallback');
  } finally {
    globalThis.window = saved;
  }
}

/* ---- 7. Every answer Msizi can say is actually speakable ---------------- */

/* The rules above are asserted against hand-written examples, which proves the
   rules and not the content. This runs the real knowledge base through them, so
   an answer added later that quotes a figure or an icon in a new shape fails
   here rather than being read aloud as punctuation on somebody's phone. */
const dataFile = join(outDir, 'msizi-data.mjs');
await build({
  entryPoints: [join(root, 'src', 'data', 'msizi.ts')],
  outfile: dataFile,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'silent',
});
const { KNOWLEDGE } = await import(pathToFileURL(dataFile).href);

for (const entry of KNOWLEDGE) {
  /* Placeholders are resolved before speaking, so stand something in that has
     the shape of what they become — a medal, a rand amount, a percentage. */
  const filled = entry.body
    .replace(/\{minWage\}/g, 'R30,23')
    .replace(/\{autoReleaseHours\}/g, '3 days')
    .replace(/\{tiers\}/g, '• \u{1F949} Trusted — 3 completed jobs, 4.0 stars or better.')
    .replace(/\{categories\}/g, '• Cleaning, Gardening.')
    .replace(/\{badges\}/g, '• \u{1F331} First Job — completed your very first gig.')
    .replace(/\{hosting\}/g, 'Frankfurt, Germany (EU)')
    .replace(/\{youthUnemployment\}/g, '62,8%');

  const said = spoken(filled);
  ok(!/[\u{1F300}-\u{1FAFF}]/u.test(said), `${entry.id}: no pictograph is read aloud`, said.slice(0, 90));
  ok(!said.includes('•'), `${entry.id}: no bullet character is read aloud`);
  ok(!said.includes('\n'), `${entry.id}: no newline survives into an utterance`);
  ok(!/\bR\s?\d/.test(said), `${entry.id}: no rand amount is left as the letter R`, said.slice(0, 90));
  ok(!/\{\w+\}/.test(said), `${entry.id}: no placeholder is read aloud`);

  const parts = S.toSentences(filled);
  ok(parts.length > 0, `${entry.id}: produces something to say`);
  ok(parts.every((s) => s.length <= 260), `${entry.id}: every utterance is short enough`,
    parts.map((s) => s.length).filter((n) => n > 260).join(','));
}

/* ---- done -------------------------------------------------------------- */

rmSync(outDir, { recursive: true, force: true });

console.log(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) {
  console.error(`Speech: ${failures} failure${failures === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
