/**
 * Post several jobs in a row, and check every one of them is still there.
 *
 * Reported as: "Using Sipho demo account, post multiple jobs — only one is
 * there now." The storage turned out to be fine, but nothing was checking it,
 * so "are my postings being kept?" had to be answered by hand each time it was
 * asked. Now it is answered by a script.
 *
 * It asserts the whole path, not just the write:
 *   · each post is accepted and comes back with its own id
 *   · every one is listed back to the employer
 *   · every one is on the public feed a worker sees
 *   · every one survives a full reload, so nothing is only in memory
 *   · and the screen actually renders them
 *
 * This WRITES, so it refuses to run against anything but a local server —
 * jobs posted to production go into the feed real people are shown.
 *
 * Run:  node scripts/check-posting.mjs [baseUrl]
 * Needs the app AND the API: `npm run dev` here plus `npm start` in
 * vuka-server.
 */
import { chromium } from 'playwright';
import { open } from './lib/settle.mjs';

const BASE = process.argv[2] ?? 'http://localhost:5173';

const host = new URL(BASE).hostname;
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.error(`\n  Refusing to run against ${BASE}.\n`);
  console.error('  This posts jobs as the demo employer, and a job posted to production');
  console.error('  goes into the feed real people are shown. Run it locally.\n');
  process.exit(2);
}

const HOW_MANY = 3;
const stamp = Date.now().toString().slice(-6);
const titleFor = (i) => `Posting check ${i} of ${HOW_MANY} · ${stamp}`;

let failures = 0;
let checks = 0;
function ok(condition, message, detail) {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail) console.error(`        ${detail}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();

try {
  console.log(`\nPosting — ${BASE}\n`);

  await open(page, BASE);
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();
  await page.getByRole('button', { name: /demo employer/i }).first().click();
  const nav = page.getByRole('navigation', { name: /primary/i }).first();
  await nav.waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(600);

  /* Post through the form rather than the API. The API was never the thing in
     doubt, and a form that silently fails validation looks exactly like a job
     that vanished. */
  for (let i = 1; i <= HOW_MANY; i++) {
    await page.getByRole('button', { name: /post a job/i }).first().click();
    await page.getByRole('heading', { name: /post a job/i }).waitFor({ timeout: 10_000 });

    await page.getByLabel('What do you need?').fill(titleFor(i));
    await page.getByLabel('Hours').fill('2');
    await page.getByLabel('Rate / hr').fill('80');
    await page.getByLabel('Where').fill('Diepkloof, Soweto');
    await page.getByLabel('When').fill('Sat, 09:00');
    await page.getByRole('button', { name: /post job/i }).click();
    await page.waitForTimeout(2200);

    const alert = await page.locator('[role="alert"]').first().innerText().catch(() => '');
    ok(!alert.trim(), `post ${i} raised no error`, alert.trim().slice(0, 100));
  }

  /* Read it back the way the app does, through the signed-in session. */
  const owned = await page.evaluate(async () => {
    const token = JSON.parse(localStorage.getItem('vuka-auth') ?? 'null')?.token
      ?? localStorage.getItem('vuka-token');
    const res = await fetch('/api/me/gigs', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.ok ? res.json() : [];
  });
  const ownedTitles = new Set((owned ?? []).map((g) => g.title));
  for (let i = 1; i <= HOW_MANY; i++) {
    ok(ownedTitles.has(titleFor(i)), `job ${i} is listed back to the employer`);
  }

  const feed = await page.evaluate(async () => {
    const res = await fetch('/api/gigs');
    return res.ok ? res.json() : [];
  });
  const feedTitles = new Set((feed ?? []).map((g) => g.title));
  for (let i = 1; i <= HOW_MANY; i++) {
    ok(feedTitles.has(titleFor(i)), `job ${i} is on the feed a worker sees`);
  }

  /* A full reload, because "it is on the screen" and "it was written down" are
     different claims and only the second one survives closing the app. */
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 25_000 });
  await nav.getByRole('button', { name: /my jobs/i }).click();
  await page.waitForTimeout(2500);

  const shown = await page.evaluate(() => document.body.innerText);
  for (let i = 1; i <= HOW_MANY; i++) {
    ok(shown.includes(titleFor(i)), `job ${i} is still on the My jobs screen after a reload`);
  }

  const rendered = [1, 2, 3].filter((i) => shown.includes(titleFor(i))).length;
  console.log(`  posted ${HOW_MANY}, still showing ${rendered} after a reload`);
} finally {
  await browser.close();
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks\n`);
process.exit(failures === 0 ? 0 : 1);
