/* ============================================================
   South African ID number validation.

   A 13-digit SA ID is YYMMDD SSSS C A Z:
     YYMMDD  date of birth
     SSSS    sequence (0000–4999 female, 5000–9999 male)
     C       citizenship (0 = SA citizen, 1 = permanent resident)
     A       historically a race digit, now always 8 (or 9 on old books)
     Z       Luhn check digit over the first 12

   This proves the number is well-FORMED and self-consistent. It does NOT prove
   the number belongs to the person presenting it — that needs a Home Affairs /
   bureau check (see kyc verification status 'pending').
   ============================================================ */

/** Luhn checksum over a numeric string (last digit is the check digit). */
function luhnValid(digits) {
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

/**
 * @param {string} raw
 * @param {Date} [today] injectable for testability
 * @returns {{ok: true, dateOfBirth: string, age: number, gender: 'female'|'male', citizen: boolean}
 *          | {ok: false, reason: string}}
 */
export function validateSaId(raw, today = new Date()) {
  const id = String(raw ?? '').replace(/\D/g, '');
  if (id.length !== 13) return { ok: false, reason: 'A South African ID number has 13 digits.' };

  const yy = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const dd = Number(id.slice(4, 6));
  if (mm < 1 || mm > 12) return { ok: false, reason: "That ID number's date of birth isn't valid." };

  // Two-digit years: anything that would put the birthday in the future belongs
  // to the previous century.
  const currentYear = today.getFullYear();
  let year = Math.floor(currentYear / 100) * 100 + yy;
  if (year > currentYear) year -= 100;

  const dob = new Date(Date.UTC(year, mm - 1, dd));
  if (dob.getUTCMonth() !== mm - 1 || dob.getUTCDate() !== dd) {
    return { ok: false, reason: "That ID number's date of birth isn't valid." };
  }
  if (dob.getTime() > today.getTime()) return { ok: false, reason: "That ID number's date of birth is in the future." };

  const citizenDigit = id[10];
  if (citizenDigit !== '0' && citizenDigit !== '1') {
    return { ok: false, reason: 'That ID number is not a valid citizen or permanent-resident number.' };
  }
  if (!luhnValid(id)) return { ok: false, reason: "That ID number's check digit is wrong — please re-type it." };

  let age = currentYear - year;
  const beforeBirthday =
    today.getMonth() < mm - 1 || (today.getMonth() === mm - 1 && today.getDate() < dd);
  if (beforeBirthday) age -= 1;

  return {
    ok: true,
    dateOfBirth: dob.toISOString().slice(0, 10),
    age,
    gender: Number(id.slice(6, 10)) < 5000 ? 'female' : 'male',
    citizen: citizenDigit === '0',
  };
}
