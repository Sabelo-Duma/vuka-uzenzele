/**
 * The chat, driven in a real browser by two people at once.
 *
 * The API suite already proves the server's half. What it cannot prove is the
 * half that only exists in a browser: that a microphone can be opened, that
 * whatever this engine records is a format the server will accept and hand
 * back, that a message reaches the other person's screen without either of them
 * asking for it, and that the ticks change when it does.
 *
 * The microphone is Chromium's fake capture device — a real MediaRecorder over
 * a real audio track, just with a tone instead of a voice. That is enough to
 * exercise every piece that is not the person speaking.
 *
 * Run:  node scripts/check-chat.mjs [baseUrl]
 * Needs the app and the API running (npm run dev + the server on :3001).
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5173';

/* This suite SENDS things. It posts messages and uploads voice notes as the two
   demo accounts, and every one of them stays in that conversation afterwards —
   there is no hard delete, so a withdrawn message leaves a tombstone rather
   than disappearing.

   Which is fine against a throwaway local database and not fine against the
   live one, where that thread is what gets shown to people. Run against
   anything but localhost it stops and asks, because "verify the deploy" is a
   reasonable thing to want and pasting a production URL by reflex is a
   reasonable thing to do. */
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ""; } };
const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostOf(BASE));
if (!isLocal && process.argv[3] !== '--i-know-this-writes') {
  console.error(`
  Refusing to run against ${BASE}.

  This suite posts messages and voice notes as the demo accounts, and they stay
  in that conversation — messages are withdrawn, never erased.

  Against a local server that costs nothing. Against production it leaves test
  chatter in the thread people are shown.

  If you really do want to verify a deploy this way:
      npm run check:chat -- ${BASE} --i-know-this-writes
  and expect to tidy the demo thread afterwards.
`);
  process.exit(2);
}

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ok    ${msg}`);
  else { failures++; console.log(`  FAIL  ${msg}`); }
};

/** Sign in on the landing page as one of the two demo accounts. */
async function signIn(page, role) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();
  await page.getByRole('button', { name: new RegExp(`demo ${role}`, 'i') }).first().click();
  await page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(600);
}

/** Open the Chats tab and the first conversation in it. */
async function openFirstChat(page) {
  await page.getByRole('navigation', { name: /primary/i }).getByRole('button', { name: /chats/i }).click();
  await page.getByRole('heading', { name: /^chats/i }).waitFor({ timeout: 10_000 });
  const first = page.locator('button:has(article), button:has(> div)').filter({ hasText: /employer|worker/i }).first();
  await first.click();
  /* The composer is the sign that a thread is open. It used to be the back
     arrow, which is no longer there — the header is a name and a status now,
     and going back is the swipe, the tab bar or the sidebar. */
  await page.getByRole('textbox', { name: /^message$/i }).waitFor({ timeout: 10_000 });
}

async function run() {
  const browser = await chromium.launch({
    args: [
      // A real audio track from a synthetic device, and no permission prompt.
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const mk = async () => {
    const ctx = await browser.newContext({ permissions: ['microphone'] });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    return { ctx, page, errors };
  };

  const worker = await mk();
  const employer = await mk();

  try {
    console.log('\nsigning in as both sides');
    await signIn(worker.page, 'worker');
    await signIn(employer.page, 'employer');
    ok(true, 'both accounts signed in');

    // The live channel is what everything below depends on.
    const live = await worker.page.evaluate(async () => {
      const started = Date.now();
      while (Date.now() - started < 15_000) {
        const res = await fetch('/api/health').then((r) => r.json()).catch(() => null);
        if (res?.live?.connections >= 1) return res.live.connections;
        await new Promise((r) => setTimeout(r, 250));
      }
      return 0;
    });
    ok(live >= 1, `the live channel connects (${live} open)`);

    console.log('\nopening the conversation');
    await openFirstChat(worker.page);
    await openFirstChat(employer.page);
    ok(true, 'both sides have the thread open');

    console.log('\ntext, end to end');
    const line = `Playwright says hello ${Date.now()}`;
    await worker.page.getByRole('textbox', { name: /^message$/i }).fill(line);
    await worker.page.getByRole('button', { name: /send message/i }).click();

    // It appears for the sender straight away, before any answer comes back.
    await worker.page.getByText(line, { exact: true }).waitFor({ timeout: 5_000 });
    ok(true, 'the sender sees their message immediately');

    // …and arrives on the other screen without that screen asking.
    await employer.page.getByText(line, { exact: true }).waitFor({ timeout: 10_000 });
    ok(true, 'it arrives on the other side over the live channel');

    // Which turns the sender's single tick into a pair.
    const delivered = await worker.page
      .locator(`text=${line}`).locator('xpath=../../..')
      .getByLabel(/delivered|read/i).first()
      .waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
    ok(delivered, 'the sender is told it was delivered');

    console.log('\nvoice note, end to end');
    await worker.page.getByRole('button', { name: /record a voice note/i }).click();
    await worker.page.getByRole('button', { name: /send voice note/i }).waitFor({ timeout: 10_000 });
    ok(true, 'recording starts and shows a way to send or discard');

    // Long enough to clear the "too short to be speech" floor on the server.
    await worker.page.waitForTimeout(2200);
    const elapsed = await worker.page.locator('text=/^0:0[0-9]$/').first().textContent().catch(() => null);
    ok(elapsed !== null, `the timer runs while recording (${elapsed ?? 'not shown'})`);

    await worker.page.getByRole('button', { name: /send voice note/i }).click();

    const sentVoice = await worker.page.getByRole('button', { name: /play voice note/i }).first()
      .waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
    ok(sentVoice, 'the voice note uploads and appears in the thread');

    const gotVoice = await employer.page.getByRole('button', { name: /play voice note/i }).first()
      .waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
    ok(gotVoice, 'the voice note reaches the other side');

    // The bubble knows how long the clip is before anybody plays it.
    const hasLength = await employer.page.locator('text=/^0:0[0-9]$/').first().isVisible().catch(() => false);
    ok(hasLength, 'the clip shows its length without being played');

    /* That it actually plays. Asserted through what the bubble shows rather
       than by reaching for an <audio> element: these players are built with
       new Audio() and are never attached to the document, deliberately, so
       there is nothing in the DOM to find. The label only flips on the
       element's own play event, which means the bytes came back and decoded. */
    const before = await employer.page.locator('text=/^0:0[0-9]$/').first().textContent();
    await employer.page.getByRole('button', { name: /play voice note/i }).first().click();
    const playing = await employer.page.getByRole('button', { name: /pause voice note/i }).first()
      .waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
    ok(playing, 'the received clip loads and starts playing');

    const moved = await employer.page.waitForFunction(
      (was) => [...document.querySelectorAll('*')].some((el) => el.children.length === 0 && /^0:0[0-9]$/.test(el.textContent ?? '') && el.textContent !== was),
      before, { timeout: 15_000 },
    ).then(() => true).catch(() => false);
    ok(moved, 'the countdown moves as it plays');

    const scrubber = employer.page.getByRole('slider', { name: /voice note position/i }).first();
    ok(await scrubber.isVisible(), 'the clip can be scrubbed with a keyboard or a screen reader');

    console.log('\nthe photo button');
    /* The file input behind it is display:none so it is not a 1x1 control
       failing the touch-target floor. A hidden input can still be opened
       programmatically — but that is the kind of thing that quietly stops
       being true, so it is asserted rather than assumed. */
    const chooser = worker.page.waitForEvent('filechooser', { timeout: 8_000 }).then(() => true).catch(() => false);
    await worker.page.getByRole('button', { name: /send a photo/i }).click();
    ok(await chooser, 'the photo button opens a file picker');
    await worker.page.keyboard.press('Escape').catch(() => {});

    console.log('\nthe read receipt');
    // The employer has the thread open, so the worker's messages are read.
    const read = await worker.page
      .locator(`text=${line}`).locator('xpath=../../..')
      .getByLabel(/^read$/i).first()
      .waitFor({ timeout: 20_000 }).then(() => true).catch(() => false);
    ok(read, 'the sender is told it was read');

    console.log('\nthe thread header');
    {
      const header = worker.page.getByRole('button', { name: /back to chats/i });
      ok((await header.count()) === 0, 'there is no back arrow sitting where the name should be');

      const name = await worker.page.locator('.sticky b').first().textContent();
      ok(!!name && name.trim().length > 0, `the header leads with who you are talking to (${name?.trim()})`);

      /* Online or Offline, never the person's role. The role used to be the
         fallback, so "not here right now" and "is an employer" shared one line
         and neither read as the other's absence. */
      const status = await worker.page.locator('.sticky').first().getByText(/^(Online|Offline|typing…)$/).first()
        .textContent().catch(() => null);
      ok(status !== null, `and says whether they are there (${status})`);

      // The employer has this thread open, so they really are online.
      ok(status === 'Online', 'someone with the conversation open reads as Online');
    }

    console.log('\nthe keyboard');
    /* A real soft keyboard cannot be opened from a test. What can be tested is
       the wiring: every current browser signals the keyboard by shrinking the
       visual viewport and leaving the layout viewport alone (Chrome 108+ on
       Android, and iOS Safari before it), so this stands a controllable
       visualViewport in for the real one and drives it the same way. The
       browser's half of the contract is documented; this is our half. */
    {
      /* At a phone width, deliberately. The tab bar only exists below lg —
         above it the navigation is the sidebar, which has the same accessible
         name and never goes anywhere, so a desktop-sized run would have been
         watching the wrong element and passing regardless. */
      const kbCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      });
      const kb = { ctx: kbCtx, page: await kbCtx.newPage() };
      await kb.ctx.addInitScript(() => {
        const bus = new EventTarget();
        let inset = 0;
        Object.defineProperty(window, 'visualViewport', {
          configurable: true,
          get: () => ({
            get height() { return document.documentElement.clientHeight - inset; },
            addEventListener: bus.addEventListener.bind(bus),
            removeEventListener: bus.removeEventListener.bind(bus),
          }),
        });
        Object.defineProperty(window, '__keyboard', {
          configurable: true,
          value: (px) => { inset = px; bus.dispatchEvent(new Event('resize')); },
        });
      });
      await signIn(kb.page, 'worker');

      const tabs = kb.page.locator('nav.tabbar');
      ok(await tabs.isVisible(), 'the tab bar is there with no keyboard up');

      await kb.page.evaluate(() => window.__keyboard(320));
      const hidden = await tabs.waitFor({ state: 'detached', timeout: 5_000 })
        .then(() => true).catch(() => false);
      ok(hidden, 'it stands down when the keyboard comes up');

      await kb.page.evaluate(() => window.__keyboard(0));
      const restored = await tabs.waitFor({ state: 'visible', timeout: 5_000 })
        .then(() => true).catch(() => false);
      ok(restored, 'and comes back when the keyboard goes away');

      /* The browser's own chrome moves the visual viewport by 50-90px when the
         URL bar hides. That must not read as a keyboard, or the tab bar would
         flicker away every time somebody scrolls. */
      await kb.page.evaluate(() => window.__keyboard(90));
      await kb.page.waitForTimeout(400);
      ok(await tabs.isVisible(), 'a hiding URL bar is not mistaken for a keyboard');

      await kb.ctx.close();
    }


    console.log('\nwith no live stream at all');
    /* Some networks and proxies will not carry an event stream. The app is not
       allowed to simply stop working there, so this blocks the stream outright
       and checks that messages still arrive — on the delta poll, which asks
       only for what changed rather than re-downloading the conversation. */
    {
      const blocked = await mk();
      await blocked.page.route(
        (url) => url.pathname === '/api/events',
        (route) => (route.request().method() === 'GET' ? route.abort() : route.continue()),
      );
      await signIn(blocked.page, 'worker');
      await openFirstChat(blocked.page);

      const streamless = await blocked.page.evaluate(() => typeof EventSource !== 'undefined');
      ok(streamless, 'EventSource exists but its requests are being refused');

      const offline = `No stream ${Date.now()}`;
      await employer.page.getByRole('textbox', { name: /^message$/i }).fill(offline);
      await employer.page.getByRole('button', { name: /send message/i }).click();

      const arrived = await blocked.page.getByText(offline, { exact: true })
        .waitFor({ timeout: 25_000 }).then(() => true).catch(() => false);
      ok(arrived, 'a message still arrives when the live stream is unavailable');
      await blocked.ctx.close();
    }

    console.log('\nwritten with no signal');
    /* The reason the outbox exists. A message written in a lift used to be
       lost with a toast; now it waits, and goes when the phone can. */
    {
      await worker.ctx.setOffline(true);
      const queued = `Sent from a lift ${Date.now()}`;
      await worker.page.getByRole('textbox', { name: /^message$/i }).fill(queued);
      await worker.page.getByRole('button', { name: /send message/i }).click();

      const shown = await worker.page.getByText(queued, { exact: true })
        .waitFor({ timeout: 5_000 }).then(() => true).catch(() => false);
      ok(shown, 'a message written with no signal is on screen straight away');

      const stillThere = await worker.page.getByLabel(/^sending$/i).first()
        .waitFor({ timeout: 5_000 }).then(() => true).catch(() => false);
      ok(stillThere, 'it is marked as still sending rather than sent');

      /* It has to survive the app being closed, not just this render — which
         means it is written down, not held in a component. Reloading the page
         to prove that is not an option while the network is cut, so the check
         is on the thing a reload would read back. */
      const onDisk = await worker.page.evaluate((text) => {
        try { return (localStorage.getItem('vuka-outbox') ?? '').includes(text); } catch { return false; }
      }, queued);
      ok(onDisk, 'it is written down, so closing the app does not lose it');

      await worker.ctx.setOffline(false);

      const sentAtLast = await employer.page.getByText(queued, { exact: true })
        .waitFor({ timeout: 30_000 }).then(() => true).catch(() => false);
      ok(sentAtLast, 'it goes by itself once the signal comes back');

      // And exactly once — the whole point of the clientId.
      const copies = await employer.page.getByText(queued, { exact: true }).count();
      ok(copies === 1, `it arrives exactly once (found ${copies})`);
    }


    console.log('\nblocking');
    /* The whole point of blocking is that it works immediately and from where
       the problem is — inside the conversation. Driven from both sides at once
       because the two of them are told deliberately different things. */
    {
      await worker.page.getByRole('button', { name: /more options for/i }).click();
      const blockBtn = worker.page.getByRole('button', { name: /^block /i }).first();
      ok(await blockBtn.isVisible(), 'a conversation offers a way to block the other person');
      ok(await worker.page.getByRole('button', { name: /report a safety concern/i }).isVisible(),
        'and a way to report them, which are not the same thing');
      await blockBtn.click();

      const gone = await worker.page.getByText(/^You blocked /).first()
        .waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
      ok(gone, 'the composer is replaced by what happened, not a dead text box');
      ok((await worker.page.getByRole('textbox', { name: /^message$/i }).count()) === 0,
        'there is no message box to type into');
      ok(await worker.page.getByRole('button', { name: /^unblock$/i }).isVisible(), 'and a way back');

      // The history is exactly what somebody who has just been harassed needs.
      ok(await worker.page.getByText(line, { exact: true }).isVisible(), 'the conversation is still readable');

      /* The other side. It must not announce the block — but the message has
         to visibly fail, because a worker who writes "running late" cannot be
         left believing it arrived. */
      const after = `After the block ${Date.now()}`;
      await employer.page.getByRole('textbox', { name: /^message$/i }).fill(after);
      await employer.page.getByRole('button', { name: /send message/i }).click();

      const failed = await employer.page.getByText(/couldn't send|can't be delivered/i).first()
        .waitFor({ timeout: 15_000 }).then(() => true).catch(() => false);
      ok(failed, 'the blocked person is shown that the message did not go');

      const employerScreen = await employer.page.locator('body').innerText();
      ok(!/blocked/i.test(employerScreen), 'and is not told they were blocked');

      ok(!(await worker.page.getByText(after, { exact: true }).isVisible().catch(() => false)),
        'and nothing of theirs reaches the other screen');

      // Undo, from the same place.
      await worker.page.getByRole('button', { name: /^unblock$/i }).click();
      const back = await worker.page.getByRole('textbox', { name: /^message$/i })
        .waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
      ok(back, 'unblocking brings the composer back');
    }


    console.log('\nnothing broke along the way');
    ok(worker.errors.length === 0, `no uncaught errors for the worker${worker.errors.length ? `: ${worker.errors[0]}` : ''}`);
    ok(employer.errors.length === 0, `no uncaught errors for the employer${employer.errors.length ? `: ${employer.errors[0]}` : ''}`);
  } finally {
    await worker.ctx.close();
    await employer.ctx.close();
    await browser.close();
  }

  console.log(failures === 0 ? '\nChat works end to end.\n' : `\n${failures} chat check(s) failed.\n`);
  process.exit(failures ? 1 : 0);
}

run().catch((e) => { console.error(e); process.exit(1); });
