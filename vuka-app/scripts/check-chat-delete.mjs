/**
 * Deleting in chat, driven in two real browsers: what one person deletes is
 * gone for them, and still there for the other.
 *
 *   npm run check:chat-delete          (needs `npm run dev` and the API on :3001)
 *
 * Covers the four "for me / for everyone" actions and the one people asked for
 * by name: deleting a whole chat straight from the Chats list, by the ⋯ button
 * and by a long-press on a phone. Local only: it deletes demo conversations.
 */
import { chromium } from 'playwright';
import { open } from './lib/settle.mjs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const host = (() => { try { return new URL(BASE).hostname; } catch { return ''; } })();
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
  console.error(`Refusing to run against ${BASE}: this suite deletes conversations. Local servers only.`);
  process.exit(2);
}

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ok    ${msg}`);
  else { failures++; console.log(`  FAIL  ${msg}`); }
};
const seen = (loc, timeout = 8_000) => loc.waitFor({ timeout }).then(() => true).catch(() => false);
const gone = (loc, timeout = 8_000) => loc.waitFor({ state: 'detached', timeout }).then(() => true).catch(() => false);

async function signIn(page, role) {
  await open(page, BASE);
  const login = page.getByRole('button', { name: /^log in$/i }).first();
  if (await login.count()) await login.click();
  await page.getByRole('button', { name: new RegExp(`demo ${role}`, 'i') }).first().click();
  await page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(600);
}

async function toChats(page) {
  await page.getByRole('navigation', { name: /primary/i }).getByRole('button', { name: /chats/i }).first().click();
  await page.getByRole('heading', { name: /^chats/i }).waitFor({ timeout: 10_000 });
}

/** The ⋯ button on a row, found by the other person's name. */
const rowMenu = (page, name) => page.getByRole('button', { name: `Options for ${name}` }).first();

async function openChatWith(page, name) {
  await toChats(page);
  await page.getByRole('button', { name: new RegExp(name) }).filter({ hasNot: page.locator('[aria-haspopup]') }).first().click();
  await page.getByRole('textbox', { name: /^message$/i }).waitFor({ timeout: 10_000 });
}

async function send(page, text) {
  await page.getByRole('textbox', { name: /^message$/i }).fill(text);
  await page.getByRole('button', { name: /send message/i }).click();
  await page.getByText(text, { exact: true }).waitFor({ timeout: 8_000 });
}

/** Hold a message for the actions sheet: right-click is the desktop route to the same menu. */
async function messageMenu(page, text) {
  await page.getByText(text, { exact: true }).first().click({ button: 'right' });
  await page.getByRole('dialog', { name: /message actions/i }).waitFor({ timeout: 5_000 });
}

async function run() {
  const browser = await chromium.launch();
  const mk = async (opts = {}) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    return { ctx, page, errors };
  };
  const worker = await mk();
  const employer = await mk();

  try {
    await signIn(worker.page, 'worker');
    await signIn(employer.page, 'employer');

    // Who is on the other end of the first conversation, by name.
    await toChats(employer.page);
    const workerName = (await employer.page.locator('[aria-label^="Options for "]').first().getAttribute('aria-label')).replace('Options for ', '');
    await toChats(worker.page);
    const employerName = (await worker.page.locator('[aria-label^="Options for "]').first().getAttribute('aria-label')).replace('Options for ', '');
    ok(!!workerName && !!employerName, `every chat in the list has its own ⋯ button (${employerName} ↔ ${workerName})`);

    console.log('\ndelete a message for me');
    await openChatWith(employer.page, workerName);
    const stamp = Date.now();
    const a = `delete-for-me ${stamp}`;
    await send(employer.page, a);
    await openChatWith(worker.page, employerName);
    ok(await seen(worker.page.getByText(a, { exact: true })), 'the message arrives');
    await messageMenu(worker.page, a);
    await worker.page.getByRole('button', { name: /^delete$/i }).click();
    ok(await seen(worker.page.getByRole('button', { name: /delete for me/i })), 'Delete asks first, and offers "Delete for me"');
    ok(!(await worker.page.getByRole('button', { name: /delete for everyone/i }).count()), 'and not "for everyone" on someone else\'s message');
    await worker.page.getByRole('button', { name: /delete for me/i }).click();
    ok(await gone(worker.page.getByText(a, { exact: true })), 'it is gone from my screen');
    ok(await employer.page.getByText(a, { exact: true }).isVisible(), 'and still on theirs');
    await worker.page.reload();
    await worker.page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30_000 });
    await openChatWith(worker.page, employerName);
    ok(!(await worker.page.getByText(a, { exact: true }).count()), 'and stays gone after a reload');

    console.log('\ndelete for everyone');
    const b = `delete-for-everyone ${stamp}`;
    await send(employer.page, b);
    ok(await seen(worker.page.getByText(b, { exact: true })), 'the message arrives');
    await messageMenu(employer.page, b);
    await employer.page.getByRole('button', { name: /^delete$/i }).click();
    await employer.page.getByRole('button', { name: /delete for everyone/i }).click();
    ok(await gone(worker.page.getByText(b, { exact: true })), 'it disappears from the other screen too');

    console.log('\nclear a chat');
    const c = `clear-me ${stamp}`;
    await send(employer.page, c);
    ok(await seen(worker.page.getByText(c, { exact: true })), 'the message arrives');
    await worker.page.getByRole('button', { name: /more options|options for/i }).first().click();
    await worker.page.getByRole('button', { name: /^clear chat$/i }).click();
    await worker.page.getByRole('alertdialog').getByRole('button', { name: /^clear chat$/i }).click();
    ok(await gone(worker.page.getByText(c, { exact: true })), 'Clear chat empties the conversation');
    ok(await employer.page.getByText(c, { exact: true }).isVisible(), 'the other person keeps every message');
    await toChats(worker.page);
    ok(await seen(rowMenu(worker.page, employerName)), 'a cleared chat stays in the list');

    console.log('\ndelete a whole chat from the Chats list');
    const d = `delete-chat ${stamp}`;
    await send(employer.page, d);
    await worker.page.waitForTimeout(1500);
    await rowMenu(worker.page, employerName).click();
    await worker.page.getByRole('button', { name: /^delete chat$/i }).click();
    ok(await seen(worker.page.getByRole('alertdialog', { name: /delete this chat/i })), 'it asks before deleting');
    await worker.page.getByRole('alertdialog').getByRole('button', { name: /^delete chat$/i }).click();
    ok(await gone(rowMenu(worker.page, employerName)), 'the chat leaves the list');
    await worker.page.reload();
    await worker.page.getByRole('navigation', { name: /primary/i }).first().waitFor({ state: 'attached', timeout: 30_000 });
    await toChats(worker.page);
    await worker.page.waitForTimeout(1000);
    ok(!(await rowMenu(worker.page, employerName).count()), 'and stays gone after a reload');
    await toChats(employer.page);
    ok(await seen(rowMenu(employer.page, workerName)), 'the other person still has the chat');

    const e = `comes-back ${stamp}`;
    await openChatWith(employer.page, workerName);
    await send(employer.page, e);
    ok(await seen(rowMenu(worker.page, employerName), 10_000), 'a new message brings the chat back');
    await worker.page.getByRole('button', { name: new RegExp(employerName) }).filter({ hasNot: worker.page.locator('[aria-haspopup]') }).first().click();
    await worker.page.getByRole('textbox', { name: /^message$/i }).waitFor({ timeout: 10_000 });
    ok(await seen(worker.page.getByText(e, { exact: true })), 'with the new message in it');
    ok(!(await worker.page.getByText(d, { exact: true }).count()) && !(await worker.page.getByText(c, { exact: true }).count()),
      'and none of what was deleted');

    console.log('\nlong-press on a phone');
    const phone = await mk({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await signIn(phone.page, 'worker');
    await toChats(phone.page);
    const row = phone.page.getByRole('button', { name: new RegExp(employerName) }).filter({ hasNot: phone.page.locator('[aria-haspopup]') }).first();
    const box = await row.boundingBox();
    const touch = { identifier: 1, clientX: box.x + 40, clientY: box.y + box.height / 2 };
    await row.dispatchEvent('touchstart', { touches: [touch], changedTouches: [touch], targetTouches: [touch] });
    await phone.page.waitForTimeout(700);
    await row.dispatchEvent('touchend', { touches: [], changedTouches: [touch], targetTouches: [] });
    ok(await seen(phone.page.getByRole('dialog', { name: `Options for ${employerName}` }), 3_000), 'holding a chat opens its options');
    ok(await phone.page.getByRole('textbox', { name: /^message$/i }).count() === 0, 'without also opening the chat');
    await phone.page.getByRole('button', { name: /^cancel$/i }).click();
    ok(phone.errors.length === 0, `no uncaught errors on the phone${phone.errors.length ? `: ${phone.errors[0]}` : ''}`);
    await phone.ctx.close();

    ok(worker.errors.length === 0, `no uncaught errors for the worker${worker.errors.length ? `: ${worker.errors[0]}` : ''}`);
    ok(employer.errors.length === 0, `no uncaught errors for the employer${employer.errors.length ? `: ${employer.errors[0]}` : ''}`);
  } finally {
    await browser.close();
  }
}

run().then(() => {
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
}).catch((e) => { console.error(e); process.exit(1); });
