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

import { tr } from '../i18n';

export interface Stat {
  /** Stable name, for code that needs one figure (Msizi's {youthUnemployment}). */
  id: string;
  /** As displayed. South African convention: comma for the decimal. */
  value: string;
  /** In the app's language, read at render (a getter, so it follows a change). */
  readonly label: string;
  /** Which entry in SOURCES this figure comes from. Rendered as a superscript
   *  beside the label, so a reader can trace any number on the page. */
  ref?: number;
}

/** Where every figure below comes from, printed under them on the page. */
export const STATS_SOURCE = 'Statistics South Africa, Quarterly Labour Force Survey Q2 2026 (released 11 August 2026)';

/** The release these figures are taken from, for the "as at" line. */
export const STATS_AS_AT = 'Q2 2026';

const stat = (id: string, value: string, ref: number): Stat => ({
  id, value, ref,
  get label() { return tr(`common.stat.${id}`); },
});

export const HEADLINE_STATS: Stat[] = [
  stat('youthUnemployment', '62,8%', 1),
  stat('neet', '3,8 m', 1),
  stat('minWage', 'R30,23', 2),
  stat('searchCost', 'R1 469', 3),
];

/**
 * The references behind the figures above, numbered as they are cited.
 *
 * Printed under the band rather than hidden in a tooltip: this is the first
 * screen a funder, a journalist or a partner sees, and a statistic nobody can
 * trace is a claim rather than evidence.
 */
export const SOURCES: string[] = [
  'Statistics South Africa, Quarterly Labour Force Survey Q2 2026, released 11 August 2026.',
  'Department of Employment and Labour, Government Gazette 54075 — national minimum wage R30,23 per hour from 1 March 2026.',
  /* Was attributed to "DG Murray Trust, JobStarter" at R1 000. Both were wrong.
     The research is Youth Capital's, run with JOBJACK across more than 10 000
     young respondents, and R1 000 was the older, lower figure. Youth Capital is
     supported by DGMT, which is probably how the attribution drifted. */
  'Youth Capital with JOBJACK, February 2024 — young job-seekers spend an average of R1 469 a month looking for work: R700 transport, R441 data, R328 applications.',
];

/** The same headline figure in a sentence, for the footer, in the app's language.
 *  The sources above stay in English: they cite English publications by title. */
export function youthUnemploymentSentence(): string {
  return tr('common.stat.footer', { rate: HEADLINE_STATS[0].value });
}
