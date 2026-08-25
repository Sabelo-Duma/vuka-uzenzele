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
