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
  ok(/employer pays you directly/i.test(paidText),
    'the payment answer says the employer pays directly', paidText.slice(0, 160));
  ok(/not an escrow|does not hold your money|does not process payments/i.test(paidText),
    'the payment answer is explicit that Vuka does not hold the money', paidText.slice(0, 200));

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
  ok(/do not know that one/i.test(missText),
    'an unanswerable question is honestly refused', missText.slice(0, 200));
  ok(/try asking/i.test(missText),
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
  const notAi = await page.getByText(/does not guess/i).first().isVisible().catch(() => false);
  ok(notAi, 'the screen says plainly that Msizi does not guess');

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
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) {
  console.error(`Msizi UI: ${failures} failure${failures === 1 ? '' : 's'}.\n`);
  process.exit(1);
}
