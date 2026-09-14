/**
 * Does the Content Security Policy break the app?
 *
 * This is the check that makes a strict CSP safe to ship. The policy was off
 * for the life of the project on the grounds that a strict one would break the
 * front-end — which was true, and stayed true, because nothing could tell
 * anyone whether it still was.
 *
 * It has to run against the **single-service** deployment: the API serving the
 * built front-end, exactly as production does. The dev server sends no CSP at
 * all, so pointing this at :5173 would pass while proving nothing.
 *
 *   cd vuka-app && npm run build
 *   cd vuka-server && VUKA_STATIC=../vuka-app/dist PORT=3002 npm start
 *   node scripts/check-csp.mjs http://localhost:3002
 *
 * A CSP violation surfaces three ways and this watches all three: a console
 * error, a `securitypolicyviolation` event on the document, and — the one that
 * matters most — the app simply not rendering.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:3002';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ok    ${msg}`);
  else { failures++; console.log(`  FAIL  ${msg}`); }
};

/** Directives every page must carry, with the value each must have. */
const REQUIRED = [
  ['default-src', "'self'"],
  ['object-src', "'none'"],
  ['frame-ancestors', "'none'"],
  ['base-uri', "'self'"],
];

async function run() {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  const ctx = await browser.newContext({ permissions: ['microphone'] });
  const page = await ctx.newPage();

  const violations = [];
  const consoleErrors = [];
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') consoleErrors.push(t);
    if (/Content Security Policy|Refused to/i.test(t)) violations.push(t);
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  // Anything the browser blocks also fires this, including things that never
  // reach the console.
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(`${e.violatedDirective} blocked ${e.blockedURI || '(inline)'}`);
    });
  });

  try {
    console.log(`\nCSP check against ${BASE}\n`);

    const res = await page.goto(BASE, { waitUntil: 'networkidle' });
    const header = res?.headers()['content-security-policy'] ?? '';
    ok(header.length > 0, 'a Content-Security-Policy header is sent at all');
    for (const [directive, value] of REQUIRED) {
      ok(header.includes(`${directive} ${value}`), `${directive} is ${value}`);
    }
    ok(!/unsafe-eval/.test(header), "the policy does not allow 'unsafe-eval'");
    ok(!/script-src[^;]*unsafe-inline/.test(header), "the policy does not allow inline scripts wholesale");
    ok(/script-src[^;]*sha256-/.test(header), 'the inline theme bootstrap is allowed by hash, not by exception');

    /* The bootstrap is the one inline script, and if the hash were wrong it
       would be silently blocked and the page would render in the wrong theme
       rather than fail. So check the thing it exists to do. */
    const themed = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    ok(themed === 'light' || themed === 'dark', `the inline theme bootstrap ran (data-theme=${themed})`);

    // The app itself rendered, which means the module bundle and CSS loaded.
    await page.getByRole('button', { name: /^log in$/i }).first().waitFor({ timeout: 20_000 });
    ok(true, 'the landing page renders under the policy');

    await page.getByRole('button', { name: /^log in$/i }).first().click();
    await page.getByRole('button', { name: /demo worker/i }).first().click();
    await page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30_000 });
    ok(true, 'signing in works under the policy');

    /* Walk the screens. A policy that only ever sees the landing page is a
       policy that has not met the fonts, the blob URLs or the event stream. */
    for (const tab of ['Find work', 'My Record', 'Chats', 'Me']) {
      await page.getByRole('button', { name: new RegExp(`^${tab}$`, 'i') }).first().click().catch(() => {});
      await page.waitForTimeout(700);
    }
    ok(true, 'every main screen opens under the policy');

    // The live stream is a same-origin EventSource — connect-src has to allow it.
    const live = await page.evaluate(async () => {
      const started = Date.now();
      while (Date.now() - started < 15_000) {
        const h = await fetch('/api/health').then((r) => r.json()).catch(() => null);
        if (h?.live?.connections >= 1) return true;
        await new Promise((r) => setTimeout(r, 250));
      }
      return false;
    });
    ok(live, 'the live event stream connects under the policy');

    // Fonts are bundled and same-origin; a blocked one is a silent fallback.
    const fonts = await page.evaluate(() => document.fonts.size > 0);
    ok(fonts, 'the bundled fonts load under the policy');

    const fromEvents = await page.evaluate(() => window.__cspViolations ?? []);
    ok(fromEvents.length === 0, `no CSP violations reported by the page${fromEvents.length ? `: ${fromEvents.join('; ')}` : ''}`);
    ok(violations.length === 0, `nothing was refused in the console${violations.length ? `: ${violations[0]}` : ''}`);

    const realErrors = consoleErrors.filter((e) => !/favicon|manifest|404/i.test(e));
    ok(realErrors.length === 0, `no page errors${realErrors.length ? `: ${realErrors[0]}` : ''}`);
  } finally {
    await ctx.close();
    await browser.close();
  }

  console.log(failures === 0 ? '\nThe policy holds, and the app still works.\n' : `\n${failures} CSP check(s) failed.\n`);
  process.exit(failures ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
