/**
 * Screen coverage: is there English on screen that no language can change?
 *
 * check-i18n.mjs compares the catalogues with each other, and all five read
 * 100% — while most screens still showed English whatever language you
 * picked, because their words were typed straight into the screen and never
 * went through t(). Catalogue coverage said nothing about that. This does.
 *
 * It parses every screen with the TypeScript compiler (a regex cannot tell a
 * sentence from a class list) and reports text a person would read that is
 * not passed through t() / tr() / translate():
 *   · JSX text:                      <b>Job alerts</b>
 *   · reading attributes:            aria-label="Dismiss", placeholder, title, alt
 *   · prose in string literals:      toast('Profile saved'), title: 'Messages'
 *
 * Deliberately English (ALLOW below) is listed with the reason, so an
 * exemption is a decision someone made, not a gap nobody saw.
 *
 * Run: node scripts/check-i18n-screens.mjs          (fails if any remain)
 *      node scripts/check-i18n-screens.mjs --list   (every string, by file)
 */
import ts from 'typescript';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const LIST = process.argv.includes('--list');

/** Files and folders scanned: everything that puts words on a screen. */
const SCAN = ['App.tsx', 'features', 'components', 'store', 'lib/push.ts', 'lib/saId.ts', 'lib/banking.ts', 'lib/format.ts', 'lib/camera.ts', 'lib/api.ts'];

/** Deliberately English, and why. */
const ALLOW = new Map([
  ['features/profile/LegalSheets.tsx', 'Legal documents stay in English on purpose: a mistranslated legal term misleads. The Language screen says so.'],
  ['components/Dashboard.tsx', 'Internal ops dashboard, not shown to workers or employers.'],
]);

/** Words that are the same in every language: names, units, brands. */
const SAME_EVERYWHERE = /^(Vuka( Uzenzele)?|Msizi|Sawubona|R\s?\d.*|SA ID|ID|PDF|OK|SMS|WhatsApp|Google|Apple|iPhone|Android|Chrome|Safari|Edge|Firefox|km|—|·|&|\+|%|×|\d+)$/;

const ATTRS_READ = new Set(['aria-label', 'placeholder', 'title', 'alt', 'label', 'aria-description', 'aria-valuetext']);
const ATTRS_CODE = new Set(['className', 'class', 'key', 'id', 'type', 'href', 'src', 'role', 'name', 'rel', 'target', 'inputMode', 'autoComplete',
  'htmlFor', 'style', 'd', 'viewBox', 'fill', 'stroke', 'method', 'action', 'accept', 'capture', 'lang', 'dir', 'enterKeyHint', 'tone', 'variant',
  'size', 'icon', 'kind', 'as', 'data-testid', 'pattern', 'autoCapitalize', 'mode', 'preload', 'crossOrigin', 'loading', 'decoding', 'sizes']);
const TRANSLATE_CALLS = new Set(['t', 'tr', 'translate']);
const NON_UI_CALLS = new Set(['log', 'warn', 'error', 'info', 'debug', 'captureError', 'getItem', 'setItem', 'removeItem', 'querySelector',
  'querySelectorAll', 'addEventListener', 'removeEventListener', 'matchMedia', 'getPref', 'setPref', 'createElement', 'request', 'fetch',
  'setProperty', 'getPropertyValue', 'toggle', 'contains', 'add', 'remove', 'startsWith', 'endsWith', 'includes', 'split', 'replace', 'test',
  'match', 'get', 'has', 'set', 'delete', 'emit', 'postMessage', 'dispatchEvent', 'toLocaleDateString', 'toLocaleTimeString', 'toLocaleString',
  'Intl', 'NumberFormat', 'DateTimeFormat', 'navigate', 'setSheet', 'setTab', 'play', 'mark', 'measure', 'importScripts', 'register', 'open']);

function files(rel) {
  const full = join(src, rel);
  if (!statSync(full, { throwIfNoEntry: false })) return [];
  if (statSync(full).isFile()) return [full];
  const out = [];
  for (const e of readdirSync(full, { withFileTypes: true })) {
    const p = join(full, e.name);
    if (e.isDirectory()) out.push(...files(relative(src, p)));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/** A class list, a CSS value, a key or a path — not something anyone reads. */
function looksLikeCode(s) {
  const v = s.trim();
  if (!/[A-Za-z]{2,}/.test(v)) return true;
  if (/^[a-z][\w]*(\.[\w]+)+$/.test(v)) return true;                 // i18n key, dotted path
  if (/^(\/|\.\/|\.\.\/|https?:|mailto:|tel:|data:|#|\?|[a-z]+:\/\/)/.test(v)) return true;
  if (/^[a-z0-9_-]+$/.test(v)) return true;                          // one lowercase token: an id, a kind
  if (/^[A-Z_][A-Z0-9_]+$/.test(v)) return true;                     // CONSTANT
  const tokens = v.split(/\s+/);
  const classy = tokens.filter((tk) => /^[!-]?[a-z0-9:[\]\-/.%()#,_]+$/.test(tk) && /[-:[\]/]/.test(tk));
  if (classy.length && classy.length >= tokens.length / 2) return true; // Tailwind
  if (/^[a-z-]+\([^)]*\)/.test(v)) return true;                        // calc(), var()
  return false;
}

/** Would a person read this as words? */
function isProse(s, strict) {
  const v = s.replace(/\s+/g, ' ').trim();
  if (!v || looksLikeCode(v) || SAME_EVERYWHERE.test(v)) return false;
  if (strict) return /[A-Za-z]{2,}/.test(v);                          // JSX text, reading attributes
  return /[A-Za-z]{2,}[^\n]*\s[^\n]*[A-Za-z]{2,}/.test(v) || /^[A-Z][a-z]{2,}[.!?]?$/.test(v);
}

function calleeName(expr) {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return '';
}

/** Is this node inside something that is never shown, or already translated? */
function exempt(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
    if (ts.isJsxAttribute(p)) {
      const n = p.name.getText();
      if (ATTRS_CODE.has(n)) return true;
      if (ATTRS_READ.has(n)) return false;
    }
    if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
      const name = calleeName(p.expression);
      if (TRANSLATE_CALLS.has(name)) return true;
      if (NON_UI_CALLS.has(name)) return true;
      if (name === 'Error' && p.parent && ts.isThrowStatement(p.parent)) return false; // shown in toasts
    }
    if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(p.operatorToken.kind)) return true;
    if (ts.isCaseClause(p) && p.expression === node) return true;
    if (ts.isElementAccessExpression(p)) return true;
    if (ts.isPropertyAssignment(p) && p.name === node) return true;
    if (ts.isTypeNode(p) || ts.isLiteralTypeNode(p)) return true;
    if (ts.isPropertyAssignment(p) && /^(labelKey|key|id|kind|type|icon|ic|screen|tone|variant|cls|className|to|url|tag|href|value)$/.test(p.name.getText())) return true;
    if (ts.isFunctionLike(p) || ts.isSourceFile(p)) break;
  }
  return false;
}

const report = new Map();
let total = 0;
for (const rel of SCAN) {
  for (const file of files(rel)) {
    const where = relative(src, file).split(sep).join('/');
    if (where.startsWith('i18n/')) continue;
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const hits = [];
    const visit = (node) => {
      let value = null, strict = false;
      if (ts.isJsxText(node)) { value = node.text; strict = true; }
      else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        value = node.text;
        strict = !!(node.parent && ts.isJsxAttribute(node.parent) && ATTRS_READ.has(node.parent.name.getText()));
      } else if (ts.isTemplateExpression(node)) {
        value = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(' {} ');
      }
      if (value !== null && isProse(value, strict) && !exempt(node)) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
        /* An explicit, reviewable exemption: `// i18n-ignore: why` on the line
           or the line above. For text no person reads (a header name, a
           developer error). */
        const lines = text.split('\n');
        if (/i18n-ignore/.test(lines[line] ?? '') || /i18n-ignore/.test(lines[line - 1] ?? '')) { ts.forEachChild(node, visit); return; }
        hits.push({ line: line + 1, text: value.replace(/\s+/g, ' ').trim().slice(0, 90) });
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    if (hits.length) { report.set(where, hits); if (!ALLOW.has(where)) total += hits.length; }
  }
}

const rows = [...report.entries()].sort((a, b) => b[1].length - a[1].length);
console.log('\ni18n screens — English that no language can change\n');
for (const [where, hits] of rows) {
  const why = ALLOW.get(where);
  console.log(`  ${String(hits.length).padStart(4)}  ${where}${why ? `   (allowed: ${why})` : ''}`);
  if (LIST && !why) for (const h of hits) console.log(`          ${h.line}: ${h.text}`);
}
console.log(`\n${total === 0 ? 'PASS' : 'FAIL'} — ${total} untranslated string${total === 1 ? '' : 's'} on screen${LIST ? '' : ' (run with --list to see them)'}\n`);
process.exit(total === 0 ? 0 : 1);
