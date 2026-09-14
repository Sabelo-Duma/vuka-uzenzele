/**
 * Layout test across the devices this app is actually opened on.
 *
 * Written because "the Add button gets cut on my iPhone" is not something the
 * type checker, the contrast test or the class test can see. It drives a real
 * browser at five widths, signs in as the demo worker and the demo employer,
 * walks every primary screen and asserts four things:
 *
 *   1. the page never scrolls sideways
 *   2. nothing sticks out past the right edge
 *   3. the bottom tab bar and its + button are fully on screen
 *   4. every tappable control clears 44px
 *
 * Run:  node scripts/check-responsive.mjs [baseUrl]
 * Needs a dev or preview server running (default http://localhost:5173).
 */
import { chromium, devices } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5173';

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, mobile: true },
  { name: 'iPhone 14', width: 390, height: 844, mobile: true },
  { name: 'iPad portrait', width: 768, height: 1024, mobile: true },
  { name: 'iPad landscape', width: 1024, height: 768, mobile: false },
  { name: 'Desktop', width: 1440, height: 900, mobile: false },
];

/** Controls that are allowed under 44px, with the reason. */
const SMALL_TARGET_ALLOWANCE = [
  /^Go back$/,          // paired with a large title row, and the whole row is tappable
];

let failures = 0;
const note = (v, screen, msg) => {
  failures += 1;
  console.log(`  FAIL  ${v.name.padEnd(15)} ${screen.padEnd(14)} ${msg}`);
};

async function measure(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const out = { vw, vh, scrollWidth: document.documentElement.scrollWidth, overflow: [], small: [], nav: null };

    const describe = (el) => {
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return `<${el.tagName.toLowerCase()}> ${label || '(no label)'}`;
    };

    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      // Something sticking out past the right edge that is not deliberately
      // decorative (aria-hidden blobs are allowed to bleed).
      if (r.right > vw + 1 && !el.closest('[aria-hidden="true"]') && style.position !== 'fixed') {
        // Not a problem if an ancestor already clips or scrolls it — a
        // horizontal chip rail is meant to run past the edge.
        let clipped = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const o = getComputedStyle(a);
          if (o.overflowX !== 'visible' || o.overflow !== 'visible') { clipped = true; break; }
        }
        if (!clipped) out.overflow.push({ el: describe(el), right: Math.round(r.right) });
      }

      // Tappable and too small for a thumb.
      const tappable = el.matches('button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="radio"], [role="tab"]');
      if (tappable && (r.width < 44 || r.height < 44)) {
        out.small.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }

    const nav = document.querySelector('nav[aria-label="Primary"]:not(.hidden)');
    if (nav) {
      const navRect = nav.getBoundingClientRect();
      const fab = nav.querySelector('button[aria-label="Find work"], button[aria-label="Post a job"]');
      const fabRect = fab?.firstElementChild?.getBoundingClientRect() ?? null;
      out.nav = {
        visible: getComputedStyle(nav).display !== 'none',
        bottom: Math.round(navRect.bottom),
        top: Math.round(navRect.top),
        fabTop: fabRect ? Math.round(fabRect.top) : null,
        fabBottom: fabRect ? Math.round(fabRect.bottom) : null,
      };
    }
    return out;
  });
}

async function check(page, viewport, screen) {
  await page.waitForTimeout(350);
  const m = await measure(page);

  if (m.scrollWidth > m.vw + 1) {
    note(viewport, screen, `page scrolls sideways (${m.scrollWidth}px wide in ${m.vw}px)`);
  }
  for (const o of m.overflow.slice(0, 3)) {
    note(viewport, screen, `overflows right edge by ${o.right - m.vw}px — ${o.el}`);
  }
  for (const s of m.small) {
    if (SMALL_TARGET_ALLOWANCE.some((re) => re.test(s.el.replace(/^<\w+> /, '')))) continue;
    note(viewport, screen, `touch target ${s.w}x${s.h} — ${s.el}`);
  }
  if (m.nav?.visible) {
    if (m.nav.bottom > m.vh + 1) note(viewport, screen, `tab bar is ${m.nav.bottom - m.vh}px below the fold`);
    if (m.nav.fabTop !== null && m.nav.fabTop < 0) note(viewport, screen, `the + button is cut off at the top (${m.nav.fabTop}px)`);
    if (m.nav.fabBottom !== null && m.nav.fabBottom > m.vh + 1) note(viewport, screen, `the + button is cut off at the bottom`);
  }
  return m;
}

async function signIn(page, role) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();
  await page.getByRole('button', { name: new RegExp(`demo ${role}`, 'i') }).first().click();
  await page.waitForTimeout(1200);
}

const WORKER_SCREENS = ['Home', 'Find work', 'My Record', 'Chats', 'Me'];
const EMPLOYER_SCREENS = ['Home', 'My jobs', 'Chats', 'Me'];

async function walk(page, viewport, screens) {
  for (const name of screens) {
    const tab = page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }).first();
    if (await tab.count()) {
      await tab.click().catch(() => {});
      await page.waitForTimeout(500);
    }
    await check(page, viewport, name);
  }
}

const browser = await chromium.launch();
console.log(`\nLayout check against ${BASE}\n`);

for (const v of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 2,
    isMobile: v.mobile,
    hasTouch: v.mobile,
    userAgent: v.mobile ? devices['iPhone 13'].userAgent : undefined,
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await check(page, v, 'Landing');

  await signIn(page, 'worker');
  await walk(page, v, WORKER_SCREENS);

  await context.clearCookies();
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await signIn(page, 'employer');
  await walk(page, v, EMPLOYER_SCREENS);

  console.log(`  done  ${v.name} (${v.width}x${v.height})`);
  await context.close();
}

await browser.close();

console.log(
  failures === 0
    ? '\nEvery screen fits, at every width.\n'
    : `\n${failures} layout problem(s).\n`,
);
process.exit(failures === 0 ? 0 : 1);
