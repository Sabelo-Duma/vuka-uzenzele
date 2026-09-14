/**
 * Layout test across the devices this app is actually opened on.
 *
 * Written because "the Add button gets cut on my iPhone" is not something the
 * type checker, the contrast test or the class test can see. It drives a real
 * browser at five widths, signs in as the demo worker and the demo employer,
 * walks every primary screen and asserts four things:
 *
 *   1. the page never scrolls sideways
 *   2. nothing sticks out past the right edge, and nothing is wider than the screen
 *   3. the bottom tab bar and its + button are fully on screen
 *   4. every tappable control clears 44px
 *   5. no short label breaks across two lines
 *   6. a sheet can actually be closed
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
    const out = { vw, vh, scrollWidth: document.documentElement.scrollWidth, overflow: [], small: [], wrapped: [], tooWide: [], nav: null };

    /* How many lines a label actually occupies. Measuring height against
       line-height lies as soon as an element has a min-height, which every
       44px control now does, so count the rectangles the text really paints. */
    const lineCount = (el) => {
      const tops = new Set();
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const rc of range.getClientRects()) tops.add(Math.round(rc.top));
      }
      return tops.size || 1;
    };

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
      // Half a pixel of tolerance: a 44px control laid out on a fractional
      // grid measures 43.99, and reporting that as "44x44 is too small" is
      // noise nobody can act on.
      if (tappable && (r.width < 43.5 || r.height < 43.5)) {
        out.small.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height) });
      }

      /* Wider than the screen. The right-edge check above forgives anything
         a scrolling ancestor clips, which is right for a chip rail and wrong
         for a card: a talent card was rendering 455px wide inside a 320px
         phone, with its rating column off the edge, and nothing flagged it.
         A grid item's default min-width is auto, so the column could not
         shrink below the card's min-content width. */
      if (r.width > vw + 1 && el.matches('main *') && !el.closest('[aria-hidden="true"]')) {
        const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll';
        if (!scrolls) out.tooWide.push({ el: describe(el), w: Math.round(r.width) });
      }

      /* A short button label broken across two lines. "Get started" stacked as
         "Get / started" is the tell that a row has run out of room, and it
         looks broken long before anything actually overflows.

         Only simple controls: a heading is meant to wrap, and so is a card
         whose whole body is inside a button, so anything containing block
         content is left alone. */
      const text = (el.textContent ?? '').trim();
      const simpleControl = el.matches('button, [role="button"]') && !el.querySelector('h1, h2, h3, h4, p, div, article, section');
      if (simpleControl && text.length > 0 && text.length <= 24 && lineCount(el) > 1) {
        out.wrapped.push({ el: describe(el), text: text.slice(0, 34) });
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
  for (const w of m.wrapped) {
    note(viewport, screen, `label wraps across lines — “${w.text}”`);
  }
  for (const t of m.tooWide.slice(0, 3)) {
    note(viewport, screen, `${t.w}px wide in a ${m.vw}px screen — ${t.el}`);
  }
  if (m.nav?.visible) {
    if (m.nav.bottom > m.vh + 1) note(viewport, screen, `tab bar is ${m.nav.bottom - m.vh}px below the fold`);
    if (m.nav.fabTop !== null && m.nav.fabTop < 0) note(viewport, screen, `the + button is cut off at the top (${m.nav.fabTop}px)`);
    if (m.nav.fabBottom !== null && m.nav.fabBottom > m.vh + 1) note(viewport, screen, `the + button is cut off at the bottom`);
  }
  return m;
}

async function signIn(page, viewport, role) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();

  // The sign-in form is a screen too, and the walk never reaches it.
  await check(page, viewport, 'Sign in');

  await page.getByRole('button', { name: new RegExp(`demo ${role}`, 'i') }).first().click();

  /* Wait for the app itself, not for a guess. A fixed delay is long enough on
     a dev server and not on a cold one, and the checks then run against the
     sign-in form while reporting it as Home. */
  await page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(600);
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
    // The inbox is a list of links; the conversation behind it is where the
    // composer lives, and the composer is the tightest row in the app.
    if (/^chats$/i.test(name)) await checkThread(page, viewport);
  }
}

/**
 * Inside a conversation.
 *
 * Reached separately because the tab walk only ever sees the inbox, and the
 * screen that actually has to survive a 320px phone is the one underneath it:
 * a text box, a photo button, a microphone and a send button on one line —
 * plus a recording bar that replaces all four with a timer, a level meter, a
 * countdown and two more buttons.
 */
async function checkThread(page, viewport) {
  const row = page.locator('button').filter({ hasText: /employer|worker/i }).first();
  if (!(await row.count())) return;
  await row.click().catch(() => {});

  const composer = page.getByRole('textbox', { name: /^message$/i }).first();
  const opened = await composer.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!opened) return;
  await page.waitForTimeout(400);
  await check(page, viewport, 'Chat thread');

  const mic = page.getByRole('button', { name: /record a voice note/i }).first();
  if (await mic.count()) {
    await mic.click().catch(() => {});
    const sendVoice = page.getByRole('button', { name: /send voice note/i }).first();
    const recording = await sendVoice.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    if (recording) {
      await page.waitForTimeout(300);
      await check(page, viewport, 'Recording');
      await page.getByRole('button', { name: /discard/i }).first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }

  /* Out of the thread the way a person actually leaves one now: the Chats tab.
     There is no back arrow in the header any more. */
  await page.getByRole('button', { name: /^chats$/i }).first().click().catch(() => {});
  await page.waitForTimeout(400);
}

/**
 * A sheet you cannot close is a trap. The privacy notice had no close button
 * at all — only Escape, which a phone has no key for, and a backdrop that is
 * an 8% strip above a full-height panel.
 */
async function checkSheetCloses(page, viewport) {
  const opener = page.getByRole('button', { name: /privacy & your data/i }).first();
  if (!(await opener.count())) return;
  await opener.click();
  await page.waitForTimeout(400);

  const dialog = page.getByRole('dialog').first();
  if (!(await dialog.count())) { note(viewport, 'Privacy', 'the sheet never opened'); return; }

  const closer = dialog.getByRole('button', { name: /^close/i }).first();
  if (!(await closer.count())) { note(viewport, 'Privacy', 'the sheet has no close button'); return; }

  /* The close row is sticky and opaque, so anything sharing space with it is
     hidden. Pulling the content up under it with a negative margin sliced the
     top off the first heading of every sheet in the app. */
  const clipped = await dialog.evaluate((d) => {
    const head = d.querySelector('.sticky');
    const heading = d.querySelector('h1, h2, h3, h4');
    if (!head || !heading) return 0;
    return Math.round(head.getBoundingClientRect().bottom - heading.getBoundingClientRect().top);
  });
  if (clipped > 0) note(viewport, 'Privacy', `the sheet header covers the first heading by ${clipped}px`);

  const box = await closer.boundingBox();
  if (!box) { note(viewport, 'Privacy', 'the close button is not visible'); return; }
  if (box.width < 44 || box.height < 44) {
    note(viewport, 'Privacy', `close button is ${Math.round(box.width)}x${Math.round(box.height)}`);
  }
  if (box.y < 0 || box.y + box.height > viewport.height) {
    note(viewport, 'Privacy', 'the close button is off screen');
  }

  await closer.click();
  await page.waitForTimeout(400);
  if (await page.getByRole('dialog').count()) note(viewport, 'Privacy', 'the sheet did not close when asked');
}


const browser = await chromium.launch({
    /* A synthetic microphone, so the recording bar can be measured. Without it
       getUserMedia rejects, the composer shows a permission notice instead, and
       the row that most needs checking is never drawn. */
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
console.log(`\nLayout check against ${BASE}\n`);

for (const v of VIEWPORTS) {
  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: 2,
    isMobile: v.mobile,
    hasTouch: v.mobile,
    userAgent: v.mobile ? devices['iPhone 13'].userAgent : undefined,
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await check(page, v, 'Landing');
  await checkSheetCloses(page, v);

  await signIn(page, v, 'worker');
  await walk(page, v, WORKER_SCREENS);

  await context.clearCookies();
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await signIn(page, v, 'employer');
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
