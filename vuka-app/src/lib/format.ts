/** Currency formatter — South African Rand. */
export function money(n: number): string {
  return 'R' + (Math.round(n * 100) / 100).toLocaleString('en-ZA');
}

/** Stars string, e.g. rating 4 -> "★★★★☆". */
export function stars(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

/** True when nobody rated this job — it was auto-confirmed after the employer
 *  went quiet. Rendering it as ☆☆☆☆☆ would read as a zero-star review. */
export function isUnrated(rating: number): boolean {
  return !(rating >= 1);
}

/** Stars for a rated job, or an honest label when there is no rating. */
export function ratingLabel(rating: number): string {
  return isUnrated(rating) ? 'Not rated' : stars(rating);
}

/**
 * How long is left before an unconfirmed job is credited automatically.
 *
 * The server runs this clock whether or not anyone is looking at it, so both
 * sides need to see the same deadline — an auto-confirmation that arrives
 * unannounced reads as something that happened *to* the employer, and a worker
 * staring at "waiting" deserves to know it doesn't wait forever.
 *
 * Two shapes, because the same duration reads differently in a sentence:
 *   `text`      — stands alone: "3 days left"
 *   `remaining` — goes after a preposition: "Confirm within 3 days"
 * Reusing `text` in the second position produced "Confirm within 3 days left"
 * on the screen that releases a worker's pay.
 *
 * Returns null when there is no deadline to show.
 */
export function timeToAutoConfirm(
  workerDoneAt: string | null | undefined,
  windowHours: number,
): { text: string; remaining: string; expired: boolean; soon: boolean } | null {
  if (!workerDoneAt) return null;
  const started = new Date(workerDoneAt).getTime();
  if (Number.isNaN(started)) return null;

  const msLeft = started + windowHours * 3_600_000 - Date.now();
  if (msLeft <= 0) {
    return { text: 'counting automatically now', remaining: '', expired: true, soon: true };
  }

  const hoursLeft = msLeft / 3_600_000;
  let remaining: string;
  if (hoursLeft < 1) {
    const mins = Math.max(1, Math.round(msLeft / 60_000));
    remaining = `${mins} min`;
  } else if (hoursLeft < 24) {
    const h = Math.round(hoursLeft);
    remaining = `${h} hour${h === 1 ? '' : 's'}`;
  } else {
    const d = Math.round(hoursLeft / 24);
    remaining = `${d} day${d === 1 ? '' : 's'}`;
  }
  return { text: `${remaining} left`, remaining, expired: false, soon: hoursLeft < 24 };
}
