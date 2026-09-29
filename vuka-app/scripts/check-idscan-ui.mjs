/**
 * The ID scan, driven end to end in a real browser, against the BUILT app
 * served by the real server — so the Content-Security-Policy that production
 * sends is the one in force. That matters here: the barcode reader is
 * WebAssembly, and without 'wasm-unsafe-eval' it would fail silently on the
 * live site and nowhere else.
 *
 * The camera is Chromium's fake device (a moving test pattern). It cannot show
 * a real card, so the back of the card is read from a generated PDF417 image
 * (scripts/fixtures/id-back-pdf417.png — a made-up person, with a valid,
 * made-up ID number) through the "photo of the back" option. That exercises
 * the same reader and parser the live scan uses.
 *
 * Run: build the app, start vuka-server (it serves vuka-app/dist), then
 *      node scripts/check-idscan-ui.mjs [http://localhost:3001]
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterLaunch } from './lib/settle.mjs';

const BASE = process.argv[2] ?? 'http://localhost:3001';
const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(here, 'fixtures', 'id-back-pdf417.png');
/* SHOTS=<dir> saves a screenshot at each step, for looking at the design. */
const SHOTS = process.env.SHOTS;
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/idscan-${name}.png` }); };

let checks = 0;
let failures = 0;
function ok(cond, message, detail) {
  checks += 1;
  if (cond) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail) console.error(`        ${detail}`);
}

const api = async (path, body, token) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

/* A fresh worker, so the account starts unverified. */
const phone = `082${String(Date.now()).slice(-7)}`;
const otp = await api('/auth/otp', { phone });
if (!otp.devCode) { console.error('No devCode: run the server in development (OTP echo) for this check.'); process.exit(1); }
const { verifyToken } = await api('/auth/otp/verify', { phone, code: otp.devCode });
const reg = await api('/auth/register', { role: 'worker', name: 'Nomsa Dlamini', phone, password: 'test1234', verifyToken, age: 29, location: 'Soweto' });
const token = reg.token;

const browser = await chromium.launch({
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });
const page = await context.newPage();
const cspErrors = [];
page.on('console', (m) => { if (/Content Security Policy|wasm|WebAssembly/i.test(m.text()) && m.type() === 'error') cspErrors.push(m.text()); });

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('vuka-token', t), token);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await afterLaunch(page);
  await page.locator('nav.tabbar').getByRole('button', { name: /^me$/i }).first().click();
  await page.getByText('Identity', { exact: true }).first().click();
  await page.getByRole('button', { name: /scan my id card/i }).click();

  /* 1. consent */
  await shot(page, '1-intro');
  const start = page.getByRole('button', { name: /^start$/i });
  ok(await start.isDisabled(), 'the scan cannot start without consent');
  await page.getByLabel(/i agree/i).check();
  await start.click();

  /* 2. front of the card, from the (fake) camera */
  const takeFront = page.getByRole('button', { name: /take photo/i });
  await takeFront.waitFor({ timeout: 10_000 });
  await page.waitForFunction(() => !document.querySelector('button[disabled]')?.textContent?.includes('Take photo'), null, { timeout: 10_000 }).catch(() => {});
  ok(await takeFront.isEnabled(), 'the camera starts for the front of the card');
  await shot(page, '2-front');
  await takeFront.click();
  await page.getByRole('button', { name: /use this photo/i }).click();

  /* 3. back of the card: a real PDF417, through the photo option */
  await page.getByText(/back of your card/i).waitFor();
  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  await page.getByText(/card read/i).waitFor({ timeout: 20_000 }).catch(() => {});
  const read = await page.locator('body').innerText();
  ok(/card read/i.test(read), 'the barcode reader loads under the production CSP and reads a PDF417', read.slice(0, 300));
  ok(/Nomsa Precious Dlamini/.test(read), 'the details barcode fills in the name', read.slice(0, 300));
  ok(/•+5086/.test(read) && /1997-08-12/.test(read), 'and the ID number (masked) and date of birth');
  await shot(page, '3-back-read');
  ok(cspErrors.length === 0, 'no CSP or WebAssembly errors', cspErrors.join(' | '));
  await page.getByRole('button', { name: /^continue$/i }).click();

  /* 4. name, pre-filled from the card */
  const name = page.getByLabel(/full name/i);
  ok((await name.inputValue()) === 'Nomsa Precious Dlamini', 'the name is pre-filled from the card', await name.inputValue());
  await page.getByRole('button', { name: /continue to selfies/i }).click();

  /* 5. selfie */
  const takeSelfie = page.getByRole('button', { name: /take selfie/i });
  await takeSelfie.waitFor({ timeout: 10_000 });
  await page.waitForTimeout(800);
  await takeSelfie.click();
  await page.getByRole('button', { name: /use this photo/i }).click();

  /* 6. the random instruction, on a count */
  const instruction = await page.locator('b.text-brand').first().innerText();
  ok(instruction.length > 5, 'the second selfie shows the server\'s random instruction', instruction);
  await shot(page, '5-challenge');
  const count = page.getByRole('button', { name: /start the count/i });
  await count.waitFor();
  await page.waitForTimeout(800);
  await count.click();
  await page.getByRole('button', { name: /send for checking/i }).waitFor({ timeout: 8_000 });
  await page.getByRole('button', { name: /send for checking/i }).click();
  await page.getByText(/sent for checking/i).first().waitFor({ timeout: 15_000 });
  await shot(page, '6-done');
  ok(/home affairs check/i.test(await page.locator('body').innerText()), 'the done screen says the Home Affairs check is in test mode');

  /* The server agrees. */
  const mine = await api('/me/id-verification', null, token);
  ok(mine.status === 'pending' && mine.method === 'scan' && mine.last4 === '5086', 'the submission is pending review, as a scan', JSON.stringify(mine));
  ok(mine.homeAffairs?.mode === 'test', 'with the Home Affairs step in test mode');

  /* The camera is released once the flow closes. */
  await page.getByRole('button', { name: /^done$/i }).click();
  const liveTracks = await page.evaluate(() => [...document.querySelectorAll('video')].filter((v) => v.srcObject).length);
  ok(liveTracks === 0, 'no camera stream is left running', String(liveTracks));
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) { console.error(`ID scan UI: ${failures} failure${failures === 1 ? '' : 's'}.\n`); process.exit(1); }
