/**
 * Drives Msizi in a real browser.
 *
 * check-msizi.mjs proves the matcher picks the right answer. That is a
 * different claim from "the screen works", and this codebase has already been
 * bitten once by exactly that gap: the Language screen saved a preference and
 * changed nothing on screen, and every catalogue test passed the whole time.
 *
 * Two assertions here are worth more than the rest.
 *
 *  · **Msizi must not disagree with the app.** It reads a worker's score back
 *    to them; My Record draws the same number from the same engine. If those
 *    two ever differ, one of them is lying to somebody about their own
 *    reputation, and the user has no way to tell which. So the test reads both
 *    and compares.
 *
 *  · **A question Vuka cannot answer must visibly fail.** The honest miss is a
 *    feature, not an edge case, and it is the first thing that would quietly
 *    regress if the confidence floor were ever nudged to make some other test
 *    pass.
 *
 * Voice is asserted as a contract rather than as a behaviour: headless
 * Chromium has no speech recogniser and no voices, and that is a perfectly
 * ordinary state for a cheap handset too. What must hold on every device is
 * that the user is either offered the control or told why not — never given a
 * button that silently does nothing.
 *
 * Run:  node scripts/check-assistant.mjs [baseUrl]
 * Needs the app AND the API served (the demo accounts do the signing in).
 */
import { chromium } from 'playwright';
import { afterLaunch } from './lib/settle.mjs';

const BASE = process.argv[2] ?? 'http://localhost:5173';

let failures = 0;
let checks = 0;
function ok(condition, message, detail) {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail) console.error(`        ${detail}`);
}

/** Sign in as one of the seeded demo accounts. */
async function signIn(page, role) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await afterLaunch(page);
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();
  await page.getByRole('button', { name: new RegExp(`demo ${role}`, 'i') }).first().click();
  await page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30_000 });
}

/** Open Msizi from whichever entry point this viewport shows. */
async function openMsizi(page) {
  await page.getByRole('button', { name: /ask msizi/i }).first().click();
  await page.getByRole('heading', { name: /^msizi$/i }).first().waitFor({ timeout: 10_000 });
}

/** Ask a question by typing it, and return the answer card that comes back. */
async function askText(page, question) {
  await page.getByRole('textbox', { name: /ask a question/i }).fill(question);
  await page.getByRole('button', { name: /^ask$/i }).click();
  const answers = page.locator('article');
  await answers.last().waitFor({ timeout: 10_000 });
  /* A question the written answers do not cover goes to the model fallback
     first and shows "Thinking..." until that settles. Wait it out — against a
     server with no key it comes straight back as the honest refusal. */
  await answers.last().getByText(/thinking/i).waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
  return answers.last();
}

const browser = await chromium.launch();

try {
  /* ---- Worker ---------------------------------------------------------- */
  const page = await browser.newPage({ viewport: { width: 420, height: 880 } });
  await signIn(page, 'worker');

  /* The number the app itself believes, read off My Record before Msizi is
     ever opened. This is the yardstick everything below is measured against. */
  await page.getByRole('navigation', { name: /primary/i }).getByRole('button', { name: /my record/i }).first().click();
  /* Read it off the accessible name rather than the text. The figure on screen
     counts up from zero when the panel mounts, so innerText caught mid-animation
     is whatever number it happened to be passing through. The aria-label is
     written from the real value and does not animate. */
  const scoreControl = page.locator('[aria-label*="Vuka Score"]').first();
  await scoreControl.waitFor({ timeout: 15_000 });
  const scoreLabel = await scoreControl.getAttribute('aria-label');
  const scoreOnRecord = (String(scoreLabel).match(/Vuka Score (\d{1,3}) out of 100/) ?? [])[1] ?? null;
  ok(scoreOnRecord !== null, 'My Record exposes the Vuka Score to read', String(scoreLabel));

  await openMsizi(page);

  /* --- it opens, and offers somewhere to start --- */
  const introShown = await page.getByText(/ask me anything about vuka/i).first().isVisible().catch(() => false);
  ok(introShown, 'Msizi opens with its tagline');

  const openerChips = page.getByRole('button', { name: /\?$/ });
  const openerCount = await openerChips.count();
  ok(openerCount >= 3, 'opening suggestions are offered', `found ${openerCount}`);

  /* --- tapping a suggestion answers it --- */
  const firstChip = await openerChips.first().innerText();
  await openerChips.first().click();
  await page.locator('article').last().waitFor({ timeout: 10_000 });
  const firstAnswer = await page.locator('article').last().innerText();
  ok(firstAnswer.includes(firstChip.trim()), 'the question asked is echoed back', firstChip);
  ok(firstAnswer.length > 200, 'a tapped suggestion produces a real answer', `${firstAnswer.length} chars`);

  /* --- typing a question reaches the right answer --- */
  const paid = await askText(page, 'how do i get paid');
  const paidText = await paid.innerText();
  ok(/secured before the work starts/i.test(paidText),
    'the payment answer says the pay is secured before work starts', paidText.slice(0, 160));
  ok(/test mode/i.test(paidText) && /no real money/i.test(paidText),
    'the payment answer is explicit that it is test mode and no real money moves', paidText.slice(0, 400));

  /* --- the wage it quotes is the one the server is serving --- */
  const config = await page.evaluate(async () => {
    const res = await fetch('/api/config');
    return res.json();
  });
  const wage = await askText(page, 'what is the minimum wage');
  const wageText = await wage.innerText();
  const expected = `R${config.minWage.toLocaleString('en-ZA')}`;
  ok(wageText.includes(expected),
    'the minimum wage quoted is the live server value',
    `server says ${expected}; Msizi said ${(wageText.match(/R[\d  ,.]+/) ?? [])[0]}`);

  /* --- it reads the person's own record back, and agrees with My Record --- */
  const score = await askText(page, 'what is my score');
  const scoreText = await score.innerText();
  ok(/out of 100/i.test(scoreText), 'the score answer reads a score back', scoreText.slice(0, 160));
  if (scoreOnRecord) {
    ok(scoreText.includes(scoreOnRecord),
      'Msizi and My Record report the SAME Vuka Score',
      `My Record showed ${scoreOnRecord}; Msizi said ${(scoreText.match(/\b\d{1,3} out of 100/) ?? [])[0]}`);
  }

  const tier = await askText(page, 'what is my tier');
  const tierText = await tier.innerText();
  ok(/starter|trusted|professional|elite/i.test(tierText),
    'the tier answer names a real tier', tierText.slice(0, 160));

  /* --- and it admits what it does not know --- */
  const miss = await askText(page, 'who won the soccer last night');
  const missText = await miss.innerText();
  /* With a model configured this may instead be a short, labelled AI reply
     steering back to Vuka; either is honest, a confident KB answer is not. */
  ok(/do not know that one/i.test(missText) || /worked out by ai/i.test(missText),
    'an unanswerable question is honestly refused, or answered as labelled AI', missText.slice(0, 200));
  ok(/try asking|ask me next/i.test(missText),
    'a refusal still offers somewhere to go', missText.slice(0, 200));

  /* --- voice: offered, or explained. Never a dead button. --- */
  const micCount = await page.getByRole('button', { name: /ask by voice/i }).count();
  const cannotListen = await page.getByText(/cannot listen/i).count();
  ok(micCount > 0 || cannotListen > 0,
    'voice input is either offered or explained as unavailable',
    `mic buttons ${micCount}, notices ${cannotListen}`);

  const speakCount = await page.getByRole('button', { name: /read this out loud/i }).count();
  const cannotSpeak = await page.getByText(/cannot read answers out loud/i).count();
  ok(speakCount > 0 || cannotSpeak > 0,
    'reading aloud is either offered or explained as unavailable',
    `speak buttons ${speakCount}, notices ${cannotSpeak}`);

  /* --- the honesty line is on the screen, not buried --- */
  const notAi = await page.getByText(/never your record/i).first().isVisible().catch(() => false);
  ok(notAi, 'the screen says plainly what is sent to the AI, and that the record never is');

  /* --- conversation: "hello" is greeted, not refused (reported from a phone) --- */
  const hello = await askText(page, 'hello');
  const helloText = await hello.innerText();
  ok(/i am msizi/i.test(helloText) && !/do not know/i.test(helloText),
    '"hello" is answered with a greeting', helloText.slice(0, 160));
  const hiQ = await askText(page, 'Hi, how do I get paid?');
  ok(/paid|pay/i.test(await hiQ.innerText()) && !/i am msizi/i.test(await hiQ.innerText()),
    'a greeting in front of a question does not swallow the question');

  /* --- starting again clears the conversation --- */
  await page.getByRole('button', { name: /start again/i }).click();
  await page.waitForTimeout(400);
  ok(await page.locator('article').count() === 0, 'Start again clears the conversation');

  await page.close();

  /* ---- Employer -------------------------------------------------------- */
  const emp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await signIn(emp, 'employer');
  await openMsizi(emp);

  const empChips = await emp.getByRole('button', { name: /\?$/ }).allInnerTexts();
  ok(empChips.some((c) => /post a job|hire/i.test(c)),
    'an employer is offered employer questions', empChips.join(' | '));
  ok(!empChips.some((c) => /find work|my score/i.test(c)),
    'an employer is NOT offered worker questions', empChips.join(' | '));

  const hiring = await askText(emp, 'how do i post a job');
  const hiringText = await hiring.innerText();
  ok(/fair-pay|minimum wage|per hour/i.test(hiringText),
    'the posting answer mentions the pay reference', hiringText.slice(0, 200));

  await emp.close();

  /* ---- Listening always stops ------------------------------------------
     The reported bug, driven through the real screen: tap the microphone on a
     phone whose recogniser accepts start() and then does nothing at all — no
     result, no error, no onend, which is what Chrome on Android does when the
     platform engine does not report an endpoint. The microphone stayed open
     and the button pulsed until the app was closed.

     check-speech.mjs proves the Listener's own contract against a fake engine.
     This proves the screen is actually wired to it. */
  const dead = await browser.newPage({ viewport: { width: 420, height: 880 } });
  await dead.addInitScript(() => {
    class DeadRecognition {
      constructor() {
        this.lang = ''; this.continuous = false; this.interimResults = false; this.maxAlternatives = 1;
        this.onresult = null; this.onerror = null; this.onend = null;
        this.onstart = null; this.onspeechstart = null; this.onaudioend = null;
        window.__micOpen = false; window.__aborted = false;
      }
      start() { window.__micOpen = true; }          // ...and then nothing, ever.
      stop() { /* ignored, exactly like the real one */ }
      abort() { window.__micOpen = false; window.__aborted = true; }
    }
    Object.defineProperty(window, 'SpeechRecognition', { value: DeadRecognition, configurable: true });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: DeadRecognition, configurable: true });
  });

  await signIn(dead, 'worker');
  await openMsizi(dead);

  const mic = dead.getByRole('button', { name: /ask by voice/i }).first();
  ok(await mic.count() > 0, 'the microphone button is offered when a recogniser exists');
  await mic.click();

  await dead.getByText(/listening/i).first().waitFor({ timeout: 5_000 }).catch(() => {});
  ok(await dead.getByText(/listening/i).count() > 0, 'tapping the microphone starts listening');
  ok(await dead.evaluate(() => window.__micOpen === true), 'the recogniser was started');

  /* Nothing is ever said and the engine never replies. It must give up anyway. */
  await dead.waitForFunction(
    () => !/listening/i.test(document.body.innerText),
    null,
    { timeout: 20_000 },
  ).catch(() => {});

  ok(await dead.getByText(/listening/i).count() === 0,
    'listening stops on its own when the engine never ends',
    await dead.getByText(/listening/i).count() > 0 ? 'still listening after 20s' : '');
  ok(await dead.evaluate(() => window.__aborted === true),
    'the microphone is force-released rather than left open');
  ok(await dead.evaluate(() => window.__micOpen === false),
    'the microphone is not still open');
  ok(await dead.getByText(/did not hear|type your question/i).count() > 0,
    'the user is told what happened rather than left guessing');

  /* And the screen is usable again afterwards — not stuck mid-session. */
  const after = await askText(dead, 'how do i get paid');
  ok((await after.innerText()).length > 100, 'the screen still works after a failed voice attempt');

  await dead.close();
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) {
  console.error(`Msizi UI: ${failures} failure${failures === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
