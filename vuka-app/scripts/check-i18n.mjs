/**
 * Keeps the five catalogues honest about each other, and about the app.
 *
 * Translation bugs are quiet. A missing key falls back to English and looks
 * fine to whoever wrote it; a dropped {placeholder} turns "R180 per hour" into
 * "per hour"; a typo'd t('nav.hoem') renders the key itself as a label and
 * nobody reviewing English ever sees it. None of these throw. So they get
 * asserted here instead.
 *
 * Run: node scripts/check-i18n.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const localeDir = join(root, 'src', 'i18n', 'locales');
const srcDir = join(root, 'src');

let failures = 0;
let checks = 0;
const notes = [];

function ok(condition, message, detail) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  FAIL  ${message}`);
    if (detail) console.error(`        ${detail}`);
  }
}

/**
 * Read a locale file as data.
 *
 * The catalogues are plain object literals of string values, so the module
 * body can be evaluated directly once the TypeScript wrapper is stripped.
 * Parsing them with a regex instead would mis-read every entry containing an
 * apostrophe — which in Afrikaans is most of them.
 */
function loadCatalog(file) {
  const source = readFileSync(join(localeDir, file), 'utf8');
  const open = source.indexOf('{', source.indexOf('export const'));
  const close = source.lastIndexOf('}');
  if (open === -1 || close === -1) throw new Error(`${file}: no object literal found`);
  const literal = source.slice(open, close + 1);
  return new Function(`return (${literal});`)();
}

const files = readdirSync(localeDir).filter((f) => f.endsWith('.ts')).sort();
const catalogs = new Map();
for (const file of files) catalogs.set(file.replace(/\.ts$/, ''), loadCatalog(file));

const en = catalogs.get('en');
ok(Boolean(en), 'en.ts loads');
if (!en) process.exit(1);

const enKeys = Object.keys(en);
ok(enKeys.length > 0, 'the English catalogue is not empty');

console.log(`\ni18n — ${catalogs.size} languages, ${enKeys.length} keys\n`);

/* ---- 1. English itself is well formed ---------------------------------- */

for (const key of enKeys) {
  ok(typeof en[key] === 'string' && en[key].trim() !== '', `en: ${key} has a value`);
}

/* A plural key needs both halves, or the fallback silently drops to the
   singular for every count. */
for (const key of enKeys) {
  if (key.endsWith('_one')) {
    const other = `${key.slice(0, -4)}_other`;
    ok(enKeys.includes(other), `en: ${key} has a matching ${other}`);
  }
  if (key.endsWith('_other')) {
    const one = `${key.slice(0, -6)}_one`;
    ok(enKeys.includes(one), `en: ${key} has a matching ${one}`);
  }
}

/* A plural string that never mentions {count} is a plural nobody can read. */
for (const key of enKeys) {
  if (key.endsWith('_one') || key.endsWith('_other')) {
    ok(en[key].includes('{count}'), `en: ${key} uses {count}`, `got: ${en[key]}`);
  }
}

/* ---- 2. Each translation against English ------------------------------- */

const placeholders = (s) => new Set(Array.from(s.matchAll(/\{(\w+)\}/g), (m) => m[1]));

const coverageReport = [];

for (const [lang, catalog] of catalogs) {
  if (lang === 'en') continue;
  const keys = Object.keys(catalog);

  /* Extra keys are dead weight at best and a renamed key at worst. */
  for (const key of keys) {
    ok(enKeys.includes(key), `${lang}: ${key} exists in English`);
  }

  let present = 0;
  for (const key of enKeys) {
    const value = catalog[key];
    if (typeof value === 'string' && value.trim() !== '') {
      present += 1;
      const want = placeholders(en[key]);
      const got = placeholders(value);
      const missing = [...want].filter((p) => !got.has(p));
      const unknown = [...got].filter((p) => !want.has(p));
      ok(
        missing.length === 0,
        `${lang}: ${key} keeps every placeholder`,
        missing.length ? `dropped {${missing.join('}, {')}}` : '',
      );
      ok(
        unknown.length === 0,
        `${lang}: ${key} invents no placeholder`,
        unknown.length ? `unknown {${unknown.join('}, {')}}` : '',
      );
    } else if (value !== undefined) {
      ok(false, `${lang}: ${key} is not blank`, 'present but empty — remove it or fill it in');
    }
  }

  const pct = Math.round((present / enKeys.length) * 100);
  coverageReport.push({ lang, present, pct });

  /* Every language shipped in the picker has to be worth picking. Below this
     the screen is mostly English and the option is a lie. */
  ok(pct >= 90, `${lang}: coverage is at least 90%`, `at ${pct}%`);

  /* An untranslated line that happens to be identical is fine — "Filters",
     "{km} km". A lot of them means someone copied en.ts and stopped. */
  const identical = enKeys.filter((k) => catalog[k] === en[k]);
  if (identical.length > enKeys.length * 0.2) {
    notes.push(
      `${lang}: ${identical.length} of ${enKeys.length} strings are byte-identical to English — worth a look`,
    );
  }
}

/* ---- 3. The app against the catalogue ---------------------------------- */

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name) && !full.includes(join('src', 'i18n'))) out.push(full);
  }
  return out;
}

const used = new Map(); // key -> first file that references it at all
const asked = new Map(); // key -> file, for keys handed to a translate call
for (const file of walk(srcDir)) {
  const source = readFileSync(file, 'utf8');
  const where = relative(root, file);

  /* Two different questions, so two scans.

     `asked` is every key passed to a translation function — t('x'),
     translate(lang, 'x'). A key here that the catalogue lacks is a bug: it
     renders as the literal text "nav.hoem" on screen.

     `used` is broader, because keys also travel as data. The nav bar holds
     `labelKey: 'nav.home'` and resolves it at render, so a scan that only
     looked for call sites reported the whole navigation as dead code. Any
     string literal shaped like a key, and known to the catalogue, counts. */
  for (const [, key] of source.matchAll(/\b(?:t|translate)\(\s*(?:[\w.]+\s*,\s*)?'([a-zA-Z][\w.]*)'/g)) {
    if (!asked.has(key)) asked.set(key, where);
    if (!used.has(key)) used.set(key, where);
  }
  for (const [, key] of source.matchAll(/'([a-z][\w]*\.[\w.]+)'/g)) {
    if (enKeys.includes(key) && !used.has(key)) used.set(key, where);
  }
}

/* A key the app asks for that no catalogue has renders as the raw key on
   screen — "nav.hoem" in the tab bar. This is the check that catches it. */
for (const [key, file] of asked) {
  const base = key.replace(/_(one|other|few|many|zero|two)$/, '');
  const known = enKeys.includes(key) || enKeys.includes(`${base}_other`) || enKeys.includes(base);
  ok(known, `${key} is defined in en.ts`, `used in ${file}`);
}

/* The reverse: keys nobody uses. Not a failure — a catalogue legitimately
   runs ahead of the wiring — but it should be visible rather than silent. */
const unused = enKeys.filter((key) => {
  const base = key.replace(/_(one|other)$/, '');
  return !used.has(key) && !used.has(base);
});
if (unused.length) {
  notes.push(`${unused.length} keys are defined but not yet used: ${unused.slice(0, 8).join(', ')}${unused.length > 8 ? '…' : ''}`);
}

/* ---- Report ------------------------------------------------------------ */

console.log('  Coverage');
console.log(`    en  100%  (${enKeys.length}/${enKeys.length})  source`);
for (const { lang, present, pct } of coverageReport) {
  console.log(`    ${lang}  ${String(pct).padStart(3)}%  (${present}/${enKeys.length})`);
}
console.log(`\n  ${used.size} keys wired into the app  (${asked.size} through a translate call)`);

if (notes.length) {
  console.log('\n  Notes');
  for (const note of notes) console.log(`    · ${note}`);
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks\n`);
process.exit(failures === 0 ? 0 : 1);
