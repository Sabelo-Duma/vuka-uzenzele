/**
 * Msizi in every language — complete, faithful to its placeholders, and
 * actually findable.
 *
 * A translation file can look finished and still fail the person using it:
 * an entry missing (that answer silently comes back in English), a
 * {minWage} typed out as "R30" (a figure that goes stale every March), or
 * phrasings Msizi cannot match (the answer exists and nobody can reach it).
 * Each of those is checked here, for isiZulu, isiXhosa, Sesotho and Afrikaans:
 *
 *   1. every written answer, live answer and sentence exists and is not blank
 *   2. every {placeholder} in the English survives, and none is invented
 *   3. no rand figure or percentage is typed where English has a placeholder
 *   4. asking the translated question, in that language, returns that answer
 *   5. the answer comes back labelled with that language, and in it
 *
 * Run: node scripts/check-msizi-langs.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(join(tmpdir(), 'msizi-langs-'));
const bundle = async (entry, name) => {
  const out = join(dir, name);
  await build({ entryPoints: [join(root, entry)], outfile: out, bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', logLevel: 'silent' });
  return import(pathToFileURL(out).href);
};
const M = await bundle('src/lib/msizi.ts', 'm.mjs');
const D = await bundle('src/data/msizi.ts', 'd.mjs');
const L = await bundle('src/data/msizi-lang/index.ts', 'l.mjs');
rmSync(dir, { recursive: true, force: true });

let checks = 0, failures = 0;
const fails = [];
const ok = (cond, msg) => { checks++; if (!cond) { failures++; fails.push(msg); } };
const ph = (s) => new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

const EN = L.MSIZI_LANGS.en;
const ctx = (lang, role) => ({
  lang, role, name: 'Thandi', minWage: 30.23, autoReleaseHours: 72, applied: 3, gigsNearby: 5, unread: 2, idVerified: false,
  wallet: { balance: 120, pending: 0, mode: 'test' },
  cv: role === 'worker' ? {
    jobsDone: 4, avg: 4.6, totalEarned: 1800, flags: 0, categoriesWorked: 2, rep: 72,
    tier: { id: 1, name: 'Trusted', tagline: 't', icon: '🥉', minJobs: 3, minRating: 4, maxFlags: 0, unlocks: 'u' },
    nextTier: { id: 2, name: 'Pro', tagline: 't', icon: '🥈', minJobs: 8, minRating: 4.4, maxFlags: 0, unlocks: 'u' },
    jobsToGo: 4, ratingMet: true, flagBlocked: false, earnedBadges: new Set(['first']),
  } : null,
});

const summary = [];
for (const lang of ['zu', 'xh', 'st', 'af']) {
  const T = L.MSIZI_LANGS[lang];
  let found = 0, asked = 0;

  // 1–3: the written answers
  for (const e of D.KNOWLEDGE) {
    const x = T.entries[e.id];
    ok(!!x, `${lang}: written answer "${e.id}" is translated`);
    if (!x) continue;
    ok(x.title?.trim(), `${lang}: ${e.id} has a title`);
    ok(x.body?.trim(), `${lang}: ${e.id} has a body`);
    ok(Array.isArray(x.asks) && x.asks.length >= 2 && x.asks.every((a) => a.trim()), `${lang}: ${e.id} has at least two phrasings`);
    ok(same(ph(e.body), ph(x.body)), `${lang}: ${e.id} keeps its placeholders (en {${[...ph(e.body)]}} vs {${[...ph(x.body)]}})`);
    ok(x.body.split('\n').length === e.body.split('\n').length, `${lang}: ${e.id} keeps the same lines/bullets (${e.body.split('\n').length} vs ${x.body.split('\n').length})`);
    if (ph(e.body).has('minWage')) ok(!/R\s?\d/.test(x.body), `${lang}: ${e.id} types no rand figure — the wage stays a placeholder`);
    ok(x.body !== e.body, `${lang}: ${e.id} body is not the English copied`);
  }
  for (const i of M.LIVE_INTENTS) {
    const x = T.live[i.id];
    ok(!!x && x.title?.trim() && x.asks?.length >= 2, `${lang}: live answer "${i.id}" has a title and two phrasings`);
  }
  for (const [k, v] of Object.entries(EN.text)) {
    const x = T.text[k];
    ok(typeof x === 'string' && x.trim(), `${lang}: sentence "${k}" is translated`);
    if (typeof x === 'string') ok(same(ph(v), ph(x)), `${lang}: sentence "${k}" keeps its placeholders`);
  }
  for (const k of Object.keys(T.text)) {
    const base = k.replace(/_(zero|one|two|few|many|other)$/, '');
    ok(k in EN.text || `${base}_other` in EN.text, `${lang}: sentence "${k}" exists in English`);
  }

  // 4–5: findable, and answered in the language
  for (const e of D.KNOWLEDGE) {
    const x = T.entries[e.id];
    if (!x) continue;
    const role = e.role ?? 'worker';
    for (const q of x.asks.slice(0, 2)) {
      asked++;
      const r = M.ask(q, ctx(lang, role));
      const hit = r.id === e.id;
      if (hit) found++;
      ok(hit, `${lang}: asking "${q}" finds "${e.id}" (got ${r.kind}:${r.id} ${r.score.toFixed(2)})`);
    }
    const byId = M.askById(e.id, ctx(lang, role));
    ok(byId?.lang === lang && byId.title === x.title, `${lang}: ${e.id} comes back labelled ${lang}, with its own title`);
    ok(byId && !/\{\w+\}/.test(byId.body), `${lang}: ${e.id} has no placeholder left once answered`);
  }
  for (const i of M.LIVE_INTENTS) {
    const x = T.live[i.id];
    if (!x) continue;
    const r = M.ask(x.asks[0], ctx(lang, i.role ?? 'worker'));
    asked++;
    if (r.id === i.id) found++;
    ok(r.id === i.id, `${lang}: asking "${x.asks[0]}" finds live "${i.id}" (got ${r.kind}:${r.id})`);
    const live = M.askById(i.id, ctx(lang, i.role ?? 'worker'));
    ok(live?.lang === lang, `${lang}: live ${i.id} comes back labelled ${lang}`);
  }
  summary.push(`${lang}: ${Object.keys(T.entries).length}/${D.KNOWLEDGE.length} answers, ${Object.keys(T.live).length}/${M.LIVE_INTENTS.length} live, ${Object.keys(T.text).length} sentences, ${found}/${asked} phrasings found`);
}

// English must be untouched by all of this.
const en = M.askById('what-is-vuka', ctx('en', 'worker'));
ok(en?.lang === 'en' && en.title === D.KNOWLEDGE.find((e) => e.id === 'what-is-vuka').title, 'English answers are unchanged');

console.log('\nMsizi in every language\n');
for (const line of summary) console.log(`  ${line}`);
if (fails.length) {
  console.log('');
  for (const f of fails.slice(0, 60)) console.log(`  FAIL  ${f}`);
  if (fails.length > 60) console.log(`  … and ${fails.length - 60} more`);
}
console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks\n`);
process.exit(failures === 0 ? 0 : 1);
