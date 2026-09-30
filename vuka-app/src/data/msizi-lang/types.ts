/**
 * One language's Msizi: the written answers, the live answers' headings and
 * phrasings, and the sentences live answers are assembled from.
 *
 * Everything is keyed by the English entry id in data/msizi.ts, and anything
 * missing falls back to English — so a partly translated language still
 * answers, it just answers that entry in English (and says so to the voice).
 *
 * Placeholders ({minWage}, {autoReleaseHours}, {tiers}, {categories},
 * {badges}, {hosting}, {youthUnemployment} in bodies; {count}, {amount} and
 * friends in `text`) must survive translation exactly: they are filled from
 * the server at the moment of answering, which is what keeps Msizi from ever
 * reciting last year's minimum wage.
 */
export interface MsiziLang {
  entries: Record<string, { title: string; asks: string[]; keywords?: string[]; body: string }>;
  live: Record<string, { title: string; asks: string[]; keywords?: string[] }>;
  text: Record<string, string>;
}
