/* ============================================================
   South African ID numbers, and what the barcode on the card says.

   The server is the authority (vuka-server/src/said.mjs). This is the same
   check on the phone, so a mistyped or misread number is caught before
   anything is sent — and so a barcode read can be told apart from noise.

   A 13-digit ID is YYMMDD SSSS C A Z: date of birth, sequence (0000–4999
   female, 5000–9999 male), citizenship, a legacy digit, and a Luhn check.
   ============================================================ */

export interface IdNumberInfo {
  ok: boolean;
  /** YYYY-MM-DD. */
  dateOfBirth?: string;
  sex?: 'F' | 'M';
  reason?: string;
}

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Is this a well-formed South African ID number? */
export function checkIdNumber(raw: string, today = new Date()): IdNumberInfo {
  const id = String(raw ?? '').replace(/\D/g, '');
  if (id.length !== 13) return { ok: false, reason: 'A South African ID number has 13 digits.' };
  const yy = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const dd = Number(id.slice(4, 6));
  /* The century is not in the number: take the one that is not in the future. */
  const thisYY = today.getFullYear() % 100;
  const year = yy <= thisYY ? 2000 + yy : 1900 + yy;
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (mm < 1 || mm > 12 || date.getUTCDate() !== dd) return { ok: false, reason: 'The first six digits must be a real date of birth.' };
  if (!['0', '1'].includes(id[10])) return { ok: false, reason: 'That ID number does not look right. Please check it.' };
  if (!luhn(id)) return { ok: false, reason: 'That ID number does not add up. Please check each digit.' };
  return {
    ok: true,
    dateOfBirth: `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    sex: Number(id.slice(6, 10)) < 5000 ? 'F' : 'M',
  };
}

/** What a barcode on an ID told us. Fields are absent when it did not carry them. */
export interface IdBarcode {
  source: 'pdf417' | 'code39';
  idNumber: string;
  surname?: string;
  names?: string;
  sex?: string;
  nationality?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  citizenship?: string;
  issueDate?: string;
}

/**
 * Read an ID barcode's text.
 *
 * The smart ID card carries two barcodes on the back: a Code 39 with the ID
 * number, and a PDF417 with the holder's details separated by "|". Home
 * Affairs does not publish the PDF417 layout, so this does not trust fixed
 * positions: it finds the field that IS a valid ID number and reads the others
 * relative to it (surname, names, sex, nationality before it; date of birth,
 * country of birth, citizenship, issue date after). Any barcode that contains
 * a valid ID number at all — the green ID book's included — yields at least
 * that. Anything else (a driving licence's encrypted barcode, a misread) is
 * null, and the scanner simply keeps looking.
 */
export function parseIdBarcode(text: string, format: string): IdBarcode | null {
  const clean = String(text ?? '').replace(/\u0000/g, '').trim();
  if (!clean) return null;
  const source: IdBarcode['source'] = /pdf ?417/i.test(format) ? 'pdf417' : 'code39';

  if (clean.includes('|')) {
    const f = clean.split('|').map((x) => x.trim());
    const at = f.findIndex((x) => /^\d{13}$/.test(x) && checkIdNumber(x).ok);
    if (at >= 0) {
      const field = (i: number) => (i >= 0 && i < f.length && f[i] ? f[i] : undefined);
      return {
        source,
        idNumber: f[at],
        surname: field(at - 4),
        names: field(at - 3),
        sex: field(at - 2),
        nationality: field(at - 1),
        dateOfBirth: field(at + 1),
        countryOfBirth: field(at + 2),
        citizenship: field(at + 3),
        issueDate: field(at + 4),
      };
    }
  }

  for (const m of clean.matchAll(/\d{13}/g)) {
    if (checkIdNumber(m[0]).ok) return { source, idNumber: m[0] };
  }
  return null;
}

/** "SURNAME" + "FIRST SECOND" → "First Second Surname", for the name field. */
export function displayName(scan: Pick<IdBarcode, 'surname' | 'names'>): string {
  const title = (s: string) => s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase());
  return [scan.names, scan.surname].filter(Boolean).map((s) => title(String(s))).join(' ').trim();
}
