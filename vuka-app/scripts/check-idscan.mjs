/**
 * The ID scan's parsing, checked without a camera.
 *
 * The camera cannot be tested here, but everything the scan DECIDES can: is
 * this a real ID number, what did the barcode say, which field is which. A
 * wrong answer here is silent — a misread number that passes, or a card's
 * details put in the wrong fields — so it is asserted.
 *
 * Home Affairs does not publish the smart ID card's PDF417 layout, so the
 * parser finds the ID-number field and reads the others relative to it. These
 * cases hold it to that: shifted layouts, extra fields, number-only barcodes,
 * encrypted noise.
 *
 * Run: node scripts/check-idscan.mjs
 */
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
let failures = 0;
function ok(cond, message, detail) {
  checks += 1;
  if (cond) return;
  failures += 1;
  console.error(`  FAIL  ${message}`);
  if (detail !== undefined) console.error(`        ${detail}`);
}

const outDir = mkdtempSync(join(tmpdir(), 'idscan-'));
const outFile = join(outDir, 'said.mjs');
await build({
  entryPoints: [join(root, 'src', 'lib', 'saId.ts')],
  outfile: outFile, bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', logLevel: 'silent',
});
const S = await import(pathToFileURL(outFile).href);

/* Build valid IDs by completing the Luhn digit, so the tests do not depend on
   anybody's real number. */
function withCheckDigit(first12) {
  for (let d = 0; d <= 9; d++) {
    const id = first12 + d;
    let sum = 0; let dbl = false;
    for (let i = id.length - 1; i >= 0; i--) {
      let n = Number(id[i]);
      if (dbl) { n *= 2; if (n > 9) n -= 9; }
      sum += n; dbl = !dbl;
    }
    if (sum % 10 === 0) return id;
  }
  throw new Error('unreachable');
}
const FEMALE = withCheckDigit('950517012308');   // 17 May 1995, sequence 0123 → female
const MALE = withCheckDigit('880229567808');     // 29 Feb 1988, sequence 5678 → male
const today = new Date('2026-09-29T12:00:00Z');

console.log('\nID scan — numbers and barcodes\n');

/* ---- ID numbers ---- */
{
  const f = S.checkIdNumber(FEMALE, today);
  ok(f.ok && f.dateOfBirth === '1995-05-17' && f.sex === 'F', 'a valid female ID is read correctly', JSON.stringify(f));
  const m = S.checkIdNumber(MALE, today);
  ok(m.ok && m.dateOfBirth === '1988-02-29' && m.sex === 'M', 'a leap-day male ID is read correctly', JSON.stringify(m));
  ok(!S.checkIdNumber(FEMALE.slice(0, 12) + ((Number(FEMALE[12]) + 1) % 10), today).ok, 'one wrong check digit is caught');
  ok(!S.checkIdNumber('950230012308' + '0', today).ok, '30 February is caught');
  ok(!S.checkIdNumber('12345', today).ok, 'a short number is caught');
  ok(!S.checkIdNumber(withCheckDigit('950517012328'), today).ok, 'a citizenship digit other than 0 or 1 is caught');
  const y2k = S.checkIdNumber(withCheckDigit('050101012308'), today);
  ok(y2k.ok && y2k.dateOfBirth === '2005-01-01', 'a 2000s birth year is not read as 1900s', JSON.stringify(y2k));
}

/* ---- the smart ID card's details barcode ---- */
{
  const text = `MOKOENA|THANDEKA LERATO|F|RSA|${FEMALE}|17 MAY 1995|RSA|CITIZEN|15 MAR 2019|12345|123456789|`;
  const p = S.parseIdBarcode(text, 'PDF417');
  ok(p?.source === 'pdf417' && p.idNumber === FEMALE, 'the ID number is found in the details barcode', JSON.stringify(p));
  ok(p?.surname === 'MOKOENA' && p?.names === 'THANDEKA LERATO', 'surname and names land in the right fields');
  ok(p?.sex === 'F' && p?.nationality === 'RSA' && p?.dateOfBirth === '17 MAY 1995', 'sex, nationality and date of birth too');
  ok(p?.countryOfBirth === 'RSA' && p?.citizenship === 'CITIZEN' && p?.issueDate === '15 MAR 2019', 'and the fields after the number');
  ok(S.displayName(p) === 'Thandeka Lerato Mokoena', 'the name is offered as "First Names Surname"', S.displayName(p));

  /* A layout with an extra leading field: positions shift, meaning does not. */
  const shifted = S.parseIdBarcode(`V2|MOKOENA|THANDEKA|F|RSA|${FEMALE}|17 MAY 1995`, 'PDF417');
  ok(shifted?.surname === 'MOKOENA' && shifted?.dateOfBirth === '17 MAY 1995', 'fields are read relative to the number, not by fixed position');

  /* A 13-digit field that is NOT a valid ID (a card number, say) is not taken for one. */
  const decoy = S.parseIdBarcode(`MOKOENA|THANDEKA|F|RSA|1234567890123|${FEMALE}|17 MAY 1995`, 'PDF417');
  ok(decoy?.idNumber === FEMALE, 'an invalid 13-digit field is skipped for the real ID number', decoy?.idNumber);
}

/* ---- number-only barcodes: the card's Code 39, the green ID book ---- */
{
  const c39 = S.parseIdBarcode(MALE, 'Code39');
  ok(c39?.source === 'code39' && c39.idNumber === MALE && !c39.surname, 'a number-only barcode yields the ID number');
  const padded = S.parseIdBarcode(`*${MALE}*`, 'Code39');
  ok(padded?.idNumber === MALE, 'start and stop characters around the number are tolerated');
}

/* ---- things that are not an ID ---- */
{
  ok(S.parseIdBarcode('', 'PDF417') === null, 'an empty read is nothing');
  ok(S.parseIdBarcode('\u0001ÿ\u0017binary-noise\u0003', 'PDF417') === null, 'encrypted bytes (a driving licence) are nothing');
  ok(S.parseIdBarcode('1234567890123', 'Code39') === null, 'a 13-digit number that fails the check is nothing');
  ok(S.parseIdBarcode('https://example.com', 'PDF417') === null, 'a URL is nothing');
}

rmSync(outDir, { recursive: true, force: true });
console.log(`\n${checks - failures}/${checks} checks passed\n`);
if (failures > 0) { console.error(`ID scan: ${failures} failure${failures === 1 ? '' : 's'}.\n`); process.exit(1); }
