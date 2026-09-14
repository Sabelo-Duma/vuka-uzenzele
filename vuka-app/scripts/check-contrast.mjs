/**
 * Contrast test for the design tokens.
 *
 * An external audit found nine text elements below WCAG AA in dark mode — a
 * rating chip at 2.27:1, menu titles at 3.0:1, "Log out" at 3.0:1. None of
 * that was a design decision; it was a light-mode palette that nobody had
 * re-checked after it was remapped for dark.
 *
 * So the palette is a test now. Every foreground/background pair the interface
 * actually puts together is listed below and checked in both themes. Add a
 * colour to src/index.css and you add it here, or CI tells you about it.
 *
 * Run: npm run check:contrast
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/index.css'), 'utf8');

/** Pull one theme's `--v-*` hex values out of index.css. */
function readTokens(selector) {
  const block = css.slice(css.indexOf(selector));
  const body = block.slice(block.indexOf('{') + 1, block.indexOf('}'));
  const tokens = {};
  for (const [, name, value] of body.matchAll(/--v-([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
    tokens[name] = value;
  }
  return tokens;
}

const THEMES = { light: readTokens(':root {'), dark: readTokens("[data-theme='dark']") };

/**
 * Every pairing the interface makes, as [foreground, background, minimum].
 *
 * 4.5 is AA for body text. 3.0 is AA for text at 18.66px bold or 24px plain,
 * and for the boundary of a control — used here only where that is genuinely
 * the case, and named so in the label.
 */
const PAIRS = [
  // Body text, on both the page and a card.
  ['text', 'canvas', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surface-2', 4.5],
  ['text', 'surface-3', 4.5],
  ['text-dim', 'canvas', 4.5],
  ['text-dim', 'surface', 4.5],
  ['text-dim', 'surface-2', 4.5],
  ['text-faint', 'canvas', 4.5],
  ['text-faint', 'surface', 4.5],
  ['text-faint', 'surface-2', 4.5],

  // Brand as text, and as the fill of the one primary action on a screen.
  ['brand', 'canvas', 4.5],
  ['brand', 'surface', 4.5],
  ['brand', 'surface-2', 4.5],
  ['brand', 'brand-soft', 4.5],
  ['on-brand', 'brand-solid', 4.5],

  // Verified — teal, and only ever where something was checked.
  ['verified', 'canvas', 4.5],
  ['verified', 'surface', 4.5],
  ['verified', 'verified-soft', 4.5],

  // Live — vermilion, and only ever for something happening now.
  ['live', 'canvas', 4.5],
  ['live', 'surface', 4.5],
  ['live', 'live-soft', 4.5],

  // Failure states.
  ['danger', 'canvas', 4.5],
  ['danger', 'surface', 4.5],
  ['danger', 'danger-soft', 4.5],

  // Informational notes.
  ['info', 'canvas', 4.5],
  ['info', 'surface', 4.5],
  ['info', 'info-soft', 4.5],

  // The one deep feature band a screen is allowed.
  ['on-feature', 'feature', 4.5],
  ['on-feature', 'feature-2', 4.5],
  ['on-feature-dim', 'feature', 4.5],
  ['on-feature-dim', 'feature-2', 4.5],
  ['on-feature-accent', 'feature', 4.5],
  ['on-feature-accent', 'feature-2', 4.5],
  ['on-feature-ok', 'feature', 4.5],
  ['on-feature-ok', 'feature-2', 4.5],

  // Inverted pill on the feature band.
  ['feature', 'on-feature', 4.5],

  // Non-text: a border only has to be distinguishable from what it separates.
  ['line', 'surface', 1.3, 'card border'],
  ['line', 'canvas', 1.3, 'border on page'],
];

const srgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lum = (hex) =>
  srgb(hex)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);

function ratio(fg, bg) {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

let failures = 0;
for (const [theme, tokens] of Object.entries(THEMES)) {
  const rows = [];
  for (const [fg, bg, min, note] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.error(`  MISSING  ${theme}: --v-${fg} or --v-${bg} is not defined`);
      failures += 1;
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failures += 1;
    rows.push(
      `  ${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ` +
        `${fg} on ${bg}${note ? ` — ${note}` : ''}`,
    );
  }
  console.log(`\n${theme.toUpperCase()}`);
  for (const r of rows) console.log(r);
}

console.log(
  failures === 0
    ? `\nAll ${PAIRS.length * 2} pairings meet their minimum.\n`
    : `\n${failures} pairing(s) below the minimum.\n`,
);
process.exit(failures === 0 ? 0 : 1);
