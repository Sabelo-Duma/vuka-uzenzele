/**
 * The launch screen: that it appears, that it holds, and that it leaves.
 *
 * Three failure modes, in order of how bad they are:
 *
 *  1. It never leaves. A fixed, full-screen, z-index 9999 element that outlives
 *     the boot is an app that opens to a logo and accepts no taps. Nothing
 *     throws; the user just closes it.
 *  2. It flashes. A splash visible for 90ms reads as a rendering glitch, and
 *     the whole point was a deliberate first impression.
 *  3. The two copies drift. The splash is drawn twice — once in index.html so
 *     it paints before the bundle arrives, once in Splash.tsx for after — and
 *     if the mark, ground or wordmark stop matching, the handover becomes a
 *     visible jump.
 *
 * Run:  node scripts/check-splash.mjs [baseUrl]
 * Needs the app served (dev, preview or a deployed URL). No API needed: this
 * never signs in.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
let checks = 0;
function ok(condition, message, detail) {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail) console.error(`        ${detail}`);
}

console.log(`\nSplash — ${BASE}\n`);

/* ---- 1. The two copies still describe the same picture ------------------ */

const html = readFileSync(join(root, 'index.html'), 'utf8');
const tsx = readFileSync(join(root, 'src', 'components', 'Splash.tsx'), 'utf8');

/* Values that must appear in both files. Any of these changed in one place
   only is a visible jump at the handover. */
const SHARED = [
  ['the indigo ground', 'linear-gradient(180deg, #172134 0%, #0B1220 100%)'],
  ['the amber of the mark', '#F5A200'],
  ['the sun arc', 'M156 254a100 100 0 0 1 200 0z'],
  ['the upper rule', 'x="120" y="288" width="272" height="30" rx="15"'],
  ['the lower rule', 'x="186" y="346" width="140" height="24" rx="12"'],
  ['the wordmark', 'Vuka Uzenzele'],
];
for (const [what, value] of SHARED) {
  ok(html.includes(value), `index.html carries ${what}`);
  ok(tsx.includes(value), `Splash.tsx carries ${what}`);
}

/* The mark is sized in px in both, and a mismatch is the jump you would
   actually notice. */
const htmlSize = html.match(/#boot svg \{[^}]*width:\s*(\d+)px/);
const tsxSize = tsx.match(/width:\s*(\d+),\s*height:\s*\d+\s*\}\}/);
ok(
  htmlSize && tsxSize && htmlSize[1] === tsxSize[1],
  'the mark is the same size in both copies',
  htmlSize && tsxSize ? `index.html ${htmlSize[1]}px vs Splash.tsx ${tsxSize[1]}px` : 'could not read one of them',
);

/* ---- 2. It behaves, in a browser ---------------------------------------- */

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

try {
  /* 'commit' returns as soon as navigation commits, so this observes the
     markup the server sent rather than the page React later replaced. */
  await page.goto(BASE, { waitUntil: 'commit' });

  const appearedAt = Date.now();
  await page.locator('#boot').waitFor({ state: 'attached', timeout: 10_000 });
  ok(true, 'the splash is in the HTML the server sends, before any script runs');

  const ground = await page.evaluate(() => {
    const el = document.getElementById('boot');
    return el ? getComputedStyle(el).backgroundImage : '';
  });
  ok(ground.includes('rgb(23, 33, 52)'), 'the splash paints the indigo ground', `got: ${ground.slice(0, 80)}`);

  /* The status bar has to come with it. Without the override a light-mode
     phone puts a pale strip across the top of a dark splash — and an override
     left behind keeps the whole app's status bar indigo for the session, which
     is the more annoying half of the bug. */
  const barDuring = await page.evaluate(
    () => document.querySelector('meta[name="theme-color"]')?.content ?? '',
  );
  ok(barDuring === '#172134', 'the status bar matches the splash while it is up', `got: ${barDuring}`);

  /* It must go. 20s is far past the 5s cap in lib/boot.ts, so this fails only
     when something is genuinely stuck rather than merely slow. */
  await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 20_000 });
  const heldMs = Date.now() - appearedAt;
  ok(true, `the splash is removed from the DOM (after ${heldMs}ms)`);

  /* Removed, not hidden: a hidden one still swallows every tap. */
  const stillThere = await page.evaluate(() => Boolean(document.getElementById('boot')));
  ok(!stillThere, 'the splash element is gone rather than hidden');

  const overrideGone = await page.evaluate(() => !document.getElementById('boot-theme'));
  ok(overrideGone, 'the status-bar override is handed back to the theme');
  const barAfter = await page.evaluate(
    () => document.querySelector('meta[name="theme-color"]')?.content ?? '',
  );
  ok(barAfter !== '#172134', 'the status bar is no longer stuck on the splash colour', `got: ${barAfter}`);

  /* The minimum exists so the splash is a decision, not a flicker. Compared
     against 1000ms rather than the 1400ms constant because this clock starts
     at navigation, not at first paint. */
  ok(heldMs >= 1000, 'the splash holds long enough to be seen, not flashed', `held ${heldMs}ms`);

  /* And the app is actually usable underneath — the failure a leftover
     overlay causes, which no screenshot would reveal. */
  const cta = page.getByRole('button', { name: /get started|qalisa|qala|begin/i }).first();
  await cta.waitFor({ state: 'visible', timeout: 15_000 });
  await cta.click({ timeout: 5_000 });
  ok(true, 'a control on the page below the splash can be tapped');
} finally {
  await browser.close();
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks\n`);
process.exit(failures === 0 ? 0 : 1);
