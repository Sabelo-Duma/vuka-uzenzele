/**
 * Catches colour utilities that the source uses but Tailwind never emitted.
 *
 * This class of bug is invisible: Tailwind silently drops a utility it cannot
 * resolve, the element renders with no background at all, and nothing errors.
 * The app shipped with `bg-info/15`, `bg-red/5` and a dozen more like them —
 * an opacity modifier cannot be applied to a bare `var(--token)`, so those
 * chips had been transparent in dark mode for months, and the sticky headers
 * on the landing and public-CV pages were fully see-through rather than
 * frosted.
 *
 * Run after a build: node scripts/check-classes.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Colour names owned by the design system, read from the config itself so this
// never drifts from it.
const config = readFileSync(join(root, 'tailwind.config.ts'), 'utf8');
const colorsBlock = config.slice(config.indexOf('colors: {'), config.indexOf('fontFamily:'));
const names = new Set();
for (const [, name] of colorsBlock.matchAll(/^\s*'?([a-z][a-z0-9-]*)'?:\s*(?:'var\(|\{)/gm)) {
  names.add(name);
}
// Nested keys: brand.solid -> brand-solid, verified.soft -> verified-soft.
for (const [, parent, body] of colorsBlock.matchAll(/^\s*'?([a-z][a-z0-9-]*)'?:\s*\{([^}]*)\}/gms)) {
  for (const [, key] of body.matchAll(/(?:^|[\s{,])([A-Za-z][A-Za-z0-9-]*):\s*'var\(/g)) {
    names.add(key === 'DEFAULT' ? parent : `${parent}-${key}`);
  }
}

/**
 * Colour names the 2.0 rename retired. A utility naming one of these compiles
 * to nothing and is invisible on the page, and because the name is gone from
 * the config the check above cannot see it either — `text-money` survived the
 * rename in exactly that way. Add to this list whenever a token is removed.
 */
const RETIRED = new Set([
  'red', 'red-hover', 'navy', 'navy-2', 'navy-deep', 'muted', 'subtle', 'money',
  'success', 'warning', 'line-strong', 't-starter', 't-trusted', 't-pro', 't-elite',
]);

const PROPS = 'bg|text|border|ring|from|via|to|fill|stroke|divide|placeholder|accent|caret|outline|decoration|shadow';
// Variants come along for the ride: `dark:hover:bg-brand-soft` is emitted as a
// single escaped selector, so it has to be looked for as one.
const CLASS_RE = new RegExp(
  String.raw`((?:[a-z][a-z0-9-]*:)*)(?:` + PROPS + String.raw`)-([a-z][a-z0-9-]*)(/(?:\d+|\[[^\]]+\]))?`,
  'g',
);

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

const used = new Map(); // full class -> first file that used it
for (const file of sourceFiles(join(root, 'src'))) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(CLASS_RE)) {
    // Only judge utilities naming one of OUR colours. Tailwind's own palette
    // and its non-colour utilities are not this test's business.
    if (!names.has(m[2]) && !RETIRED.has(m[2])) continue;
    if (!used.has(m[0])) used.set(m[0], file.slice(root.length + 1).replace(/\\/g, '/'));
  }
}

const assets = join(root, 'dist/assets');
let css = '';
try {
  for (const f of readdirSync(assets)) if (f.endsWith('.css')) css += readFileSync(join(assets, f), 'utf8');
} catch {
  console.error('No dist/assets — run `npm run build` first.');
  process.exit(1);
}

/** Tailwind backslash-escapes `:` `/` `.` `[` `]` `%` in the selector it emits. */
function asSelector(cls) {
  return cls
    .replace(/[:/.[\]%]/g, (ch) => '\\\\' + ch)
    .replace(/[*+?^${}()|]/g, '\\$&');
}

const missing = [...used].filter(([cls]) => !new RegExp('\\.' + asSelector(cls) + '(?![\\w-])').test(css));

if (missing.length) {
  console.error(`\n${missing.length} colour utility class(es) used in source but not emitted by Tailwind:\n`);
  for (const [cls, file] of missing) console.error(`  ${cls.padEnd(28)} ${file}`);
  console.error('\nThese render as nothing. Usually an opacity modifier on a var() colour,');
  console.error('or a token renamed or retired in tailwind.config.ts but not in the source.\n');
  process.exit(1);
}

console.log(`All ${used.size} design-system colour utilities resolve.\n`);
