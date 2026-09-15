/**
 * Does the other side actually see you go?
 *
 * Reported as: "when a user closes the app it must show that they are offline
 * — it takes time to reflect, I might move to another tab and come back to
 * only then see offline."
 *
 * That was exactly right. The app read presence once, when a thread was
 * opened, and never again, so a status that changed while you were reading
 * stayed wrong until you navigated away and came back. And the server counted
 * any open socket as present, which a backgrounded tab is.
 *
 * The server suite proves the events are emitted. This proves the screen in
 * front of a person changes — which is a different claim, and the one that was
 * broken.
 *
 * Two real browsers, two demo accounts, one conversation between them.
 *
 * Run:  node scripts/check-presence.mjs [baseUrl]
 * Needs the app AND the API: `npm run dev` here plus `npm start` in
 * vuka-server. Signing in is the whole point, so a preview server alone is not
 * enough.
 */
import { chromium } from 'playwright';
import { open } from './lib/settle.mjs';

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

async function signIn(page, role) {
  await open(page, BASE);
  /* Reopening the app is one of the things under test, and a second page in
     the same browser context still has the token — so it lands signed in and
     there is no Log in button to press. Treat that as already done rather than
     waiting thirty seconds for a button that will never appear. */
  const nav = page.getByRole('navigation', { name: /primary/i }).first();
  if (await nav.count()) {
    await page.waitForTimeout(400);
    return;
  }
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();
  await page.getByRole('button', { name: new RegExp(`demo ${role}`, 'i') }).first().click();
  await nav.waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(600);
}

async function openFirstChat(page) {
  await page.getByRole('navigation', { name: /primary/i }).getByRole('button', { name: /chats/i }).click();
  await page.getByRole('heading', { name: /^chats/i }).waitFor({ timeout: 10_000 });
  const first = page.locator('button:has(article), button:has(> div)').filter({ hasText: /employer|worker/i }).first();
  await first.click();
  await page.waitForTimeout(800);
}

/** The status line under the other person's name in the chat header. */
function statusLine(page) {
  return page.locator('header, .sticky').getByText(/^(Online|Offline|typing…|Blocked)$/).first();
}

/** Poll the status line until it reads `want`, or give up. */
async function waitForStatus(page, want, ms) {
  const until = Date.now() + ms;
  let seen = '(never rendered)';
  while (Date.now() < until) {
    try {
      seen = (await statusLine(page).innerText()).trim();
      if (seen === want) return { ok: true, ms: ms - (until - Date.now()), seen };
    } catch { /* not painted yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  return { ok: false, ms, seen };
}

const browser = await chromium.launch();
const worker = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const employer = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

try {
  console.log(`\nPresence — ${BASE}\n`);

  const wPage = await worker.newPage();
  const ePage = await employer.newPage();
  await signIn(wPage, 'worker');
  await signIn(ePage, 'employer');
  await openFirstChat(wPage);
  await openFirstChat(ePage);

  /* Both are looking at the conversation, so each should see the other as
     online without either of them doing anything. */
  const bothOn = await waitForStatus(wPage, 'Online', 15_000);
  ok(bothOn.ok, 'with both apps open, each side shows the other as Online', `saw: ${bothOn.seen}`);

  /* The reported case. The employer closes the app. Nothing is clicked on the
     worker's screen — the question is whether it changes by itself. */
  await ePage.close();
  const wentOff = await waitForStatus(wPage, 'Offline', 15_000);
  console.log(`  time for "closed the app" to reach the other screen: ${wentOff.ms}ms`);
  ok(wentOff.ok, 'closing the app shows as Offline on the other side', `saw: ${wentOff.seen}`);

  /* And promptly. Before this the status only changed when the screen was left
     and reopened, so any number here would have been "never". Ten seconds is
     generous for a local round trip and still far inside "I switched tab and
     came back". */
  ok(wentOff.ok && wentOff.ms < 10_000, 'and does so without the reader touching anything', `took ${wentOff.ms}ms`);

  /* Coming back has to work too — a presence system that only ever goes one
     way is a worse lie than one that never updates. */
  const ePage2 = await employer.newPage();
  await signIn(ePage2, 'employer');
  await openFirstChat(ePage2);
  const cameBack = await waitForStatus(wPage, 'Online', 20_000);
  console.log(`  time for "reopened the app" to reach the other screen:  ${cameBack.ms}ms`);
  ok(cameBack.ok, 'reopening the app shows as Online again', `saw: ${cameBack.seen}`);

  /* Backgrounding is the other half of what was reported. The stream stays
     open, so without visibility tracking the server would still call this
     present. */
  await wPage.bringToFront();
  await ePage2.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const away = await waitForStatus(wPage, 'Offline', 15_000);
  console.log(`  time for "backgrounded" to reach the other screen:      ${away.ms}ms`);
  ok(away.ok, 'putting the app in the background also shows as Offline', `saw: ${away.seen}`);
} finally {
  await browser.close();
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks\n`);
process.exit(failures === 0 ? 0 : 1);
