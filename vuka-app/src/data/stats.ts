/**
 * The national figures the landing page argues from.
 *
 * These used to be typed into the markup as "~60%" and "~3.4m" with no source
 * and no date, so nobody could tell whether they were current, and nobody
 * noticed when they stopped being. A statistic with a tilde in front of it and
 * no citation behind it is a claim, not evidence — and this is the first thing
 * a funder or a journalist reads.
 *
 * Each figure carries the release it came from and the date that release was
 * published, and the landing page prints the source underneath them. When the
 * next Quarterly Labour Force Survey lands, change the numbers here and the
 * attribution follows automatically.
 *
 * Same discipline as MIN_WAGE_PER_HOUR_FALLBACK in catalog.ts, which goes stale
 * every March when the wage is gazetted.
 */

export interface Stat {
  /** As displayed. South African convention: comma for the decimal. */
  value: string;
  label: string;
}

/** Where every figure below comes from, printed under them on the page. */
export const STATS_SOURCE = 'Statistics South Africa, Quarterly Labour Force Survey Q2 2026 (released 11 August 2026)';

/** The release these figures are taken from, for the "as at" line. */
export const STATS_AS_AT = 'Q2 2026';

export const HEADLINE_STATS: Stat[] = [
  { value: '62,8%', label: 'Unemployment, ages 15–24' },
  { value: '3,8 m', label: 'Aged 15–24 not in work, education or training' },
  { value: 'R0', label: 'To browse and apply — always' },
  { value: '1st', label: 'Job made possible with no CV' },
];

/** The same headline figure in a sentence, for the footer. */
export const YOUTH_UNEMPLOYMENT_SENTENCE =
  'Built to help close South Africa’s youth unemployment gap — 62,8% for ages 15–24.';
