import type { Badge, Category, Tier } from '../types';
import { tr } from '../i18n';

/**
 * National Minimum Wage reference used by the Fair-Pay meter — a FALLBACK for
 * first paint and offline use. The live value comes from the server (see
 * applyServerConfig / minWagePerHour below), which is authoritative.
 *
 * Gazetted annually, effective 1 March. Keep in step with MIN_WAGE_PER_HOUR in
 * vuka-server/src/engine.mjs: R28.79 (2025) → R30.23 (effective 1 March 2026).
 */
export const MIN_WAGE_PER_HOUR_FALLBACK = 30.23;

let runtimeMinWage = MIN_WAGE_PER_HOUR_FALLBACK;

/** The fair-pay reference to use right now (server value once loaded). */
export const minWagePerHour = (): number => runtimeMinWage;

/**
 * Hours an employer has to confirm finished work before the server credits it
 * without them. Fallback only — the server owns this clock and publishes the
 * real value at /api/config, so never hardcode "3 days" in copy.
 */
const AUTO_RELEASE_HOURS_FALLBACK = 72;
let runtimeAutoReleaseHours = AUTO_RELEASE_HOURS_FALLBACK;

/** The confirmation window in force right now. */
export const autoReleaseHours = (): number => runtimeAutoReleaseHours;

/**
 * Adopt the server's engine config. Tier/badge thresholds exist on both sides
 * so the client can animate a tier-up the instant a job completes; overwriting
 * them here means the two can never disagree about what is locked. Presentation
 * (names, colours, taglines, copy) stays client-owned.
 */
export function applyServerConfig(cfg: {
  minWage: number;
  autoReleaseHours?: number;
  tiers: { id: number; minJobs: number; minRating: number; maxFlags: number }[];
  badges: { id: string; threshold: number | null; special: string | null }[];
}): void {
  if (typeof cfg.minWage === 'number' && cfg.minWage > 0) runtimeMinWage = cfg.minWage;
  if (typeof cfg.autoReleaseHours === 'number' && cfg.autoReleaseHours > 0) runtimeAutoReleaseHours = cfg.autoReleaseHours;

  for (const t of cfg.tiers ?? []) {
    const local = TIERS.find((x) => x.id === t.id);
    if (local) Object.assign(local, { minJobs: t.minJobs, minRating: t.minRating, maxFlags: t.maxFlags });
    else if (import.meta.env.DEV) console.warn(`Server tier ${t.id} has no local presentation — add it to TIERS.`);
  }

  for (const b of cfg.badges ?? []) {
    const local = BADGES.find((x) => x.id === b.id);
    if (local) Object.assign(local, { threshold: b.threshold ?? undefined, special: (b.special ?? undefined) as Badge['special'] });
    else if (import.meta.env.DEV) console.warn(`Server badge "${b.id}" has no local presentation — add it to BADGES.`);
  }
}

/* The words below are catalogue keys resolved on every read, not stored text:
   a getter per field, so every screen that reads `CATEGORIES[i].label` or
   `tier.name` shows the language chosen right now without changing. Nothing
   copies these objects (no spreads, no JSON), which is what keeps that true —
   a `{ ...cat }` would freeze the language it was copied in. */
export const CATEGORIES: Category[] = [
  { id: 'cleaning', get label() { return tr('common.cat.cleaning'); }, icon: '🧽' },
  { id: 'garden', get label() { return tr('common.cat.garden'); }, icon: '🌿' },
  { id: 'dogs', get label() { return tr('common.cat.dogs'); }, icon: '🐕' },
  { id: 'moving', get label() { return tr('common.cat.moving'); }, icon: '📦' },
  { id: 'errands', get label() { return tr('common.cat.errands'); }, icon: '🛵' },
  { id: 'tutoring', get label() { return tr('common.cat.tutoring'); }, icon: '📚' },
  { id: 'carwash', get label() { return tr('common.cat.carwash'); }, icon: '🚗' },
  { id: 'childcare', get label() { return tr('common.cat.childcare'); }, icon: '🧸' },
];

export const catById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

/**
 * The occupational title a category maps to on a CV.
 *
 * A category label describes the work we advertise ("Moving help"); a job title
 * describes the person who did it ("Removals Assistant"). An employer reading a
 * CV is scanning for the second. This is the difference between a log of gigs
 * and a work history someone can be hired from, and it costs us nothing — the
 * data is already there, it was only ever labelled for the wrong reader.
 */
const ROLE_TITLES: Record<string, () => string> = {
  cleaning: () => tr('common.role.cleaning'),
  garden: () => tr('common.role.garden'),
  dogs: () => tr('common.role.dogs'),
  moving: () => tr('common.role.moving'),
  errands: () => tr('common.role.errands'),
  tutoring: () => tr('common.role.tutoring'),
  carwash: () => tr('common.role.carwash'),
  childcare: () => tr('common.role.childcare'),
};

export const roleTitleFor = (categoryId: string): string =>
  ROLE_TITLES[categoryId]?.() ?? tr('common.role.general');

/** The opportunity ladder — earned, not bought. */
export const TIERS: Tier[] = [
  {
    id: 0, get name() { return tr('common.tier.starter.name'); }, get tagline() { return tr('common.tier.starter.tagline'); },
    icon: '🌱',
    minJobs: 0, minRating: 0, maxFlags: 99,
    get unlocks() { return tr('common.tier.starter.unlocks'); },
  },
  {
    id: 1, get name() { return tr('common.tier.trusted.name'); }, get tagline() { return tr('common.tier.trusted.tagline'); },
    icon: '🥉',
    minJobs: 3, minRating: 4.0, maxFlags: 0,
    get unlocks() { return tr('common.tier.trusted.unlocks'); },
  },
  {
    id: 2, get name() { return tr('common.tier.professional.name'); }, get tagline() { return tr('common.tier.professional.tagline'); },
    icon: '🥈',
    minJobs: 8, minRating: 4.3, maxFlags: 0,
    get unlocks() { return tr('common.tier.professional.unlocks'); },
  },
  {
    id: 3, get name() { return tr('common.tier.elite.name'); }, get tagline() { return tr('common.tier.elite.tagline'); },
    icon: '🥇',
    minJobs: 15, minRating: 4.6, maxFlags: 0,
    get unlocks() { return tr('common.tier.elite.unlocks'); },
  },
];

export const BADGES: Badge[] = [
  { id: 'first', get label() { return tr('common.badge.first.label'); }, icon: '🌱', get desc() { return tr('common.badge.first.desc'); }, threshold: 1 },
  { id: 'rising', get label() { return tr('common.badge.rising.label'); }, icon: '⭐', get desc() { return tr('common.badge.rising.desc'); }, special: 'rating45' },
  { id: 'reliable', get label() { return tr('common.badge.reliable.label'); }, icon: '🛡️', get desc() { return tr('common.badge.reliable.desc'); }, threshold: 5 },
  { id: 'verified', get label() { return tr('common.badge.verified.label'); }, icon: '✅', get desc() { return tr('common.badge.verified.desc'); }, special: 'idverified' },
  { id: 'hustler', get label() { return tr('common.badge.hustler.label'); }, icon: '🔥', get desc() { return tr('common.badge.hustler.desc'); }, threshold: 10 },
  { id: 'multi', get label() { return tr('common.badge.multi.label'); }, icon: '🎯', get desc() { return tr('common.badge.multi.desc'); }, special: 'multiskill' },
];
