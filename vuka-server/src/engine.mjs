// Reputation + opportunity-tier engine (authoritative, server-side).
// Mirrors the frontend engine so the client can trust server values.

/**
 * South Africa's National Minimum Wage, in rands per hour. Authoritative — the
 * app serves this at /api/config and the client's Fair-Pay meter renders it as
 * "SA min R…/hr", so a stale value here tells an employer that an unlawful rate
 * is fair.
 *
 * The NMW is gazetted annually and takes effect on 1 March. Check it every
 * March: R28.79 (2025) → R30.23 (effective 1 March 2026).
 */
export const MIN_WAGE_PER_HOUR = 30.23;

export const TIERS = [
  { id: 0, name: 'Starter', icon: '🌱', minJobs: 0, minRating: 0, maxFlags: 99, unlocks: 'Informal gigs near you.' },
  { id: 1, name: 'Trusted', icon: '🥉', minJobs: 3, minRating: 4.0, maxFlags: 0, unlocks: 'Higher-paying gigs + first formal shift work.' },
  { id: 2, name: 'Professional', icon: '🥈', minJobs: 8, minRating: 4.3, maxFlags: 0, unlocks: 'Formal entry-level employment.' },
  { id: 3, name: 'Elite', icon: '🥇', minJobs: 15, minRating: 4.6, maxFlags: 0, unlocks: 'Permanent contracts & priority.' },
];

export const BADGES = [
  { id: 'first', threshold: 1 },
  { id: 'rising', special: 'rating45' },
  { id: 'reliable', threshold: 5 },
  { id: 'verified', special: 'idverified' },
  { id: 'hustler', threshold: 10 },
  { id: 'multi', special: 'multiskill' },
];

export function tierFor(jobsDone, avg, flags) {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (jobsDone >= t.minJobs && avg >= t.minRating && flags <= t.maxFlags) current = t;
  }
  return current;
}

/**
 * Compute the reputation/tier snapshot from a worker's completed history.
 *
 * A job the employer never confirmed is auto-released and stored unrated
 * (rating 0). The work still happened, so it counts toward jobs done and total
 * earned — but it carries no opinion, so it is kept out of the average. An
 * employer's silence must not be able to move a worker's rating in either
 * direction: scoring it 0 would punish the worker for someone else's inaction,
 * and scoring it 5 would let silence manufacture a reputation.
 *
 * @param {Array} history rows {rating, safety_flag, category, pay}
 * @param {boolean} idVerified
 */
export function computeCv(history, idVerified) {
  const jobsDone = history.length;
  const rated = history.filter((j) => j.rating >= 1);
  const avg = rated.length ? rated.reduce((s, j) => s + j.rating, 0) / rated.length : 0;
  const totalEarned = history.reduce((s, j) => s + j.pay, 0);
  const flags = history.filter((j) => j.safety_flag).length;
  const categoriesWorked = new Set(history.map((j) => j.category)).size;

  let rep = 0;
  if (jobsDone) {
    rep = Math.min(100, Math.round((avg / 5) * 60 + (Math.min(jobsDone, 12) / 12) * 30 + (flags ? 0 : 10)));
  }

  const earnedBadges = [];
  for (const b of BADGES) {
    if (b.threshold && jobsDone >= b.threshold) earnedBadges.push(b.id);
    if (b.special === 'rating45' && avg >= 4.5) earnedBadges.push(b.id);
    if (b.special === 'idverified' && idVerified) earnedBadges.push(b.id);
    if (b.special === 'multiskill' && categoriesWorked >= 3) earnedBadges.push(b.id);
  }

  const tier = tierFor(jobsDone, avg, flags);
  const nextTier = TIERS[tier.id + 1] ?? null;
  let tierProgress = 100, jobsToGo = 0, ratingMet = true, flagBlocked = false;
  if (nextTier) {
    jobsToGo = Math.max(0, nextTier.minJobs - jobsDone);
    ratingMet = avg >= nextTier.minRating;
    flagBlocked = flags > nextTier.maxFlags;
    const span = nextTier.minJobs - tier.minJobs;
    tierProgress = span > 0 ? Math.min(100, Math.round(((jobsDone - tier.minJobs) / span) * 100)) : 100;
  }

  return {
    jobsDone, avg: Number(avg.toFixed(2)), totalEarned, flags, categoriesWorked,
    rep, earnedBadges,
    tier, nextTier, tierProgress, jobsToGo, ratingMet, flagBlocked,
  };
}

export function autoReview(rating) {
  const map = {
    5: 'Excellent work — punctual, professional and went the extra mile. Highly recommend.',
    4: 'Good job overall, friendly and reliable. Happy to book again.',
    3: 'Job was done, room for improvement but fair effort.',
    2: 'Completed but a few issues. Communication could be better.',
    1: 'Did not meet expectations this time.',
  };
  return map[Math.max(1, Math.min(5, Math.round(rating)))];
}
