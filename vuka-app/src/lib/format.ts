/** Currency formatter — South African Rand. */
export function money(n: number): string {
  return 'R' + (Math.round(n * 100) / 100).toLocaleString('en-ZA');
}

/** Stars string, e.g. rating 4 -> "★★★★☆". */
export function stars(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}
