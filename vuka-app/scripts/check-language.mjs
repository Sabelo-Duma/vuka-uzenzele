/**
 * Proves the language actually changes, in a real browser.
 *
 * check-i18n.mjs proves the five catalogues agree with each other. That is a
 * different claim from "choosing isiZulu changes what is on the screen", and
 * the app shipped for months with a Language screen that saved a preference
 * and changed nothing at all. So this drives the real thing: open the app,
 * pick each language, and read the tab bar back.
 *
 * It also checks the two failure modes that look fine in English:
 *   · <html lang> follows the choice, which is what a screen reader reads
 *   · the choice survives a reload, which is where localStorage bugs surface
 *
 * Run:  node scripts/check-language.mjs [baseUrl]
 * Needs the app served (dev, preview or a deployed URL). No API needed: every
 * assertion is about the landing page.
 */
import { chromium } from 'playwright';
import { afterLaunch } from './lib/settle.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Read the expected words out of the catalogues themselves rather than
   restating them here: a copy in this file would be one more thing to drift. */
function catalog(lang) {
  const source = readFileSync(join(root, 'src', 'i18n', 'locales', `${lang}.ts`), 'utf8');
  const open = source.indexOf('{', source.indexOf('export const'));
  return new Function(`return (${source.slice(open, source.lastIndexOf('}') + 1)});`)();
}

const LANGS = ['en', 'zu', 'xh', 'st', 'af'];
const CATALOGS = Object.fromEntries(LANGS.map((l) => [l, catalog(l)]));
const TAGS = { en: 'en-ZA', zu: 'zu-ZA', xh: 'xh-ZA', st: 'st-ZA', af: 'af-ZA' };

let failures = 0;
let checks = 0;
function ok(condition, message, detail) {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail) console.error(`        ${detail}`);
}

/**
 * Wait until React has actually painted the hero.
 *
 * `waitUntil: 'networkidle'` only says the network went quiet — it says
 * nothing about the bundle having executed and rendered. Against a warm local
 * preview the two are indistinguishable; against a cold Render instance they
 * are seconds apart, and reading page.content() in that gap returns the empty
 * shell. This test passed locally and failed intermittently in production for
 * exactly that reason, which is the worst way for a check to be wrong.
 */
async function settled(page) {
  await afterLaunch(page);
  /* afterLaunch proves a screen has rendered; this page's assertions are all
     about the hero text, so wait for that specifically before reading. */
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForFunction(
    () => (document.querySelector('h1')?.textContent ?? '').trim().length > 0,
    null,
    { timeout: 30_000 },
  );
  return page.content();
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

try {
  console.log(`\nLanguage — ${BASE}\n`);

  /* The landing page is the one screen an anonymous visitor sees, and the
     first place a non-English speaker decides whether this app is for them. */
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const headlineEn = CATALOGS.en['landing.headline'];
  ok(
    (await settled(page)).includes(headlineEn),
    'the landing page renders the English headline from the catalogue',
    `looked for: ${headlineEn}`,
  );

  /* Setting the stored preference is what the Language screen does; going in
     this way lets the test cover all five without walking the sheet five
     times, and it exercises the same detectLang() path a returning user hits. */
  for (const lang of LANGS) {
    await page.evaluate((l) => localStorage.setItem('vuka-lang', l), lang);
    await page.reload({ waitUntil: 'networkidle' });

    const want = CATALOGS[lang]['landing.headline'];
    const html = await settled(page);
    ok(html.includes(want), `${lang}: the headline is in ${lang} after a reload`, `looked for: ${want}`);

    const tag = await page.evaluate(() => document.documentElement.lang);
    ok(tag === TAGS[lang], `${lang}: <html lang> is ${TAGS[lang]}`, `got: ${tag}`);

    /* The Get started button is the thing a user has to recognise to sign up.
       If it is still English while the headline is not, the wiring is partial
       in exactly the way that looks finished from a screenshot. */
    const cta = CATALOGS[lang]['action.getStarted'];
    ok(html.includes(cta), `${lang}: the sign-up button says "${cta}"`);
  }

  /* Nothing English-only is allowed to leak into a non-English render of the
     hero. "Get started" appearing under isiZulu means a key was missed. */
  await page.evaluate(() => localStorage.setItem('vuka-lang', 'zu'));
  await page.reload({ waitUntil: 'networkidle' });
  await settled(page);
  const zuHero = await page.locator('h1').first().innerText();
  ok(
    !zuHero.includes('CV should') && zuHero !== CATALOGS.en['landing.headline'],
    'zu: the hero heading is not the English string',
    `got: ${zuHero}`,
  );

  /* An unknown value must not blank the app or leave it stuck: it falls back
     to English. This is the state a stale or corrupted localStorage produces. */
  await page.evaluate(() => localStorage.setItem('vuka-lang', 'kl'));
  await page.reload({ waitUntil: 'networkidle' });
  ok(
    (await settled(page)).includes(CATALOGS.en['landing.headline']),
    'an unrecognised stored language falls back to English rather than blank',
  );

  /* And the key itself must never reach the screen. A missing key renders as
     "nav.home", which is the one failure users report as "it broke". */
  const body = await page.locator('body').innerText();
  const leaked = body.match(/\b(?:nav|action|landing|auth|error|jobs|post|chat|record|me|lang|safety|state)\.[a-zA-Z]+/g);
  ok(!leaked, 'no raw catalogue key is visible on the page', leaked ? `saw: ${leaked.join(', ')}` : '');
} finally {
  await browser.close();
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks\n`);
process.exit(failures === 0 ? 0 : 1);
