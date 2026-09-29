/* ============================================================
   Checking a scanned ID — what the server can confirm itself, and the seam
   where the Home Affairs check will go.

   A scanned submission arrives with three things: what the person typed, what
   the barcode on the back of their card said, and three images (the front of
   the card, a selfie, and a second selfie following a random instruction).

   The server confirms what it can for free:
     · the ID number is well-formed (validateSaId: date, citizenship digit,
       check digit)
     · the barcode agrees with it: the same number, the same date of birth,
       the same sex
     · the name typed matches the name on the card
   These catch typos, made-up numbers and careless fakes. They do NOT prove the
   card is genuine or that it belongs to the person holding it — only a check
   against the Home Affairs population register does that, through a
   commercial verification bureau (about R27 to R30 a check; private
   businesses do not connect to Home Affairs directly).

   HOME AFFAIRS: TEST MODE. `homeAffairsCheck` is the seam. Until a bureau is
   appointed it reports that it did not run, and a person reviews every
   submission — comparing the selfies with the card, and checking the second
   selfie follows the instruction it was given. When a bureau is signed, this
   is the one function that changes.
   ============================================================ */
import { randomInt } from 'node:crypto';

export const HOME_AFFAIRS_MODE = 'test';

/**
 * The instruction for the second selfie, chosen by the server so the phone
 * cannot pick an easy one. A printed photo or a screen held up to the camera
 * cannot follow an instruction it did not know in advance.
 */
const CHALLENGES = [
  'Turn your head to your left',
  'Turn your head to your right',
  'Look up',
  'Smile with your teeth showing',
  'Close your eyes',
  'Tilt your head to one side',
];
export function pickChallenge() {
  return CHALLENGES[randomInt(CHALLENGES.length)];
}

const norm = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Accepts the barcode's date in the forms cards use: 1990-05-17, 17 MAY 1990, 17/05/1990. */
function isoDate(raw) {
  const s = String(raw ?? '').trim().toUpperCase();
  let m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[-/ ](\d{2})[-/ ](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  m = s.match(/^(\d{1,2})\s+([A-Z]{3})[A-Z]*\s+(\d{4})$/);
  if (m && months.includes(m[2])) return `${m[3]}-${String(months.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

/**
 * Compare what was typed, the ID number, and the barcode. Each check is
 * true (agrees), false (disagrees) or null (the barcode did not carry it).
 * `idCheck` is validateSaId's result for the number.
 */
export function crossCheck({ fullName, idNumber, idCheck, scan }) {
  const s = scan ?? {};
  const checks = {
    barcodeRead: !!s.source && s.source !== 'typed',
    idFromBarcode: s.idNumber ? String(s.idNumber).replace(/\D/g, '') === idNumber : null,
    dateOfBirth: null,
    sex: null,
    name: null,
  };
  const dob = isoDate(s.dateOfBirth);
  if (dob) checks.dateOfBirth = dob === idCheck.dateOfBirth;
  const sex = norm(s.sex).charAt(0);
  if (sex === 'M' || sex === 'F') checks.sex = (sex === 'F') === (idCheck.gender === 'female');
  const surname = norm(s.surname);
  if (surname) {
    const typed = norm(fullName).split(' ');
    const first = norm(s.names).split(' ').filter(Boolean);
    /* The surname must appear, and at least one of the card's first names —
       people often type only the name they use. */
    checks.name = surname.split(' ').every((w) => typed.includes(w))
      && (first.length === 0 || first.some((w) => typed.includes(w)));
  }
  /* Only a DISAGREEMENT is a problem; a field the barcode lacked is not. */
  const mismatches = ['idFromBarcode', 'dateOfBirth', 'sex', 'name'].filter((k) => checks[k] === false);
  return { ...checks, mismatches };
}

/** Only the fields worth keeping from the barcode, trimmed and bounded. */
export function cleanScan(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const pick = (v, n = 80) => (v == null ? null : String(v).slice(0, n).trim() || null);
  const source = ['pdf417', 'code39', 'typed'].includes(raw.source) ? raw.source : 'typed';
  return {
    source,
    surname: pick(raw.surname), names: pick(raw.names), sex: pick(raw.sex, 10),
    nationality: pick(raw.nationality, 40), dateOfBirth: pick(raw.dateOfBirth, 20),
    countryOfBirth: pick(raw.countryOfBirth, 40), citizenship: pick(raw.citizenship, 40),
    issueDate: pick(raw.issueDate, 20),
    /* The ID number from the barcode is compared, then dropped: the number is
       stored once, encrypted, in its own column. */
    idNumber: pick(raw.idNumber, 20),
  };
}

/**
 * The Home Affairs check, through a verification bureau. TEST MODE: not run.
 * Returns what to record against the submission.
 */
export async function homeAffairsCheck(/* { idNumber, fullName, selfie } */) {
  return {
    mode: HOME_AFFAIRS_MODE,
    status: 'not_run',
    note: 'Home Affairs check not connected yet. A person reviews this submission.',
    at: new Date().toISOString(),
  };
}
