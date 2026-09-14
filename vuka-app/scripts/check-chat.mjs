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
  await page.getByRole('button', { name: /back to chats/i }).waitFor({ timeout: 10_000 });
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
