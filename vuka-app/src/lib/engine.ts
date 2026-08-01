import { BADGES, TIERS } from '../data/catalog';
import type { CvSnapshot, Tier, WorkerProfile } from '../types';

/** Highest tier whose thresholds are all satisfied. */
export function tierFor(jobsDone: number, avg: number, flags: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (jobsDone >= t.minJobs && avg >= t.minRating && flags <= t.maxFlags) current = t;
  }
  return current;
}

/** Derive the full reputation + tier snapshot from a worker's history. */
export function computeCv(worker: WorkerProfile): CvSnapshot {
  const h = worker.history;
  const jobsDone = h.length;
  const avg = jobsDone ? h.reduce((s, j) => s + j.rating, 0) / jobsDone : 0;
  const totalEarned = h.reduce((s, j) => s + j.pay, 0);
  const flags = h.filter((j) => j.safetyFlag).length;
  const categoriesWorked = new Set(h.map((j) => j.category)).size;

  let rep = 0;
  if (jobsDone) {
    rep = Math.min(
      100,
      Math.round((avg / 5) * 60 + (Math.min(jobsDone, 12) / 12) * 30 + (flags ? 0 : 10)),
    );
  }

  const earnedBadges = new Set<string>();
  for (const b of BADGES) {
    if (b.threshold && jobsDone >= b.threshold) earnedBadges.add(b.id);
    if (b.special === 'rating45' && avg >= 4.5) earnedBadges.add(b.id);
    if (b.special === 'idverified' && worker.idVerified) earnedBadges.add(b.id);
    if (b.special === 'multiskill' && categoriesWorked >= 3) earnedBadges.add(b.id);
  }

  const tier = tierFor(jobsDone, avg, flags);
  const nextTier = TIERS[tier.id + 1] ?? null;

  let tierProgress = 100;
  let jobsToGo = 0;
  let ratingMet = true;
  let flagBlocked = false;
  if (nextTier) {
    jobsToGo = Math.max(0, nextTier.minJobs - jobsDone);
    ratingMet = avg >= nextTier.minRating;
    flagBlocked = flags > nextTier.maxFlags;
    const span = nextTier.minJobs - tier.minJobs;
    tierProgress = span > 0 ? Math.min(100, Math.round(((jobsDone - tier.minJobs) / span) * 100)) : 100;
  }

  return {
    jobsDone, avg, totalEarned, flags, categoriesWorked,
    rep, earnedBadges, tier, nextTier, tierProgress, jobsToGo, ratingMet, flagBlocked,
  };
}

/** Auto-generated employer review text keyed by star rating. */
export function autoReview(rating: number): string {
  const map: Record<number, string> = {
    5: 'Excellent work — punctual, professional and went the extra mile. Highly recommend.',
    4: 'Good job overall, friendly and reliable. Happy to book again.',
    3: 'Job was done, room for improvement but fair effort.',
    2: 'Completed but a few issues. Communication could be better.',
    1: 'Did not meet expectations this time.',
  };
  return map[Math.max(1, Math.min(5, Math.round(rating)))];
}
