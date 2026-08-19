/* ============================================================
   Vuka Uzenzele — domain types
   ============================================================ */

export type CategoryId =
  | 'cleaning' | 'garden' | 'dogs' | 'moving'
  | 'errands' | 'tutoring' | 'carwash' | 'childcare';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

export type TierId = 0 | 1 | 2 | 3;

export interface Tier {
  id: TierId;
  name: string;
  tagline: string;
  color: string;
  ring: [string, string];
  icon: string;
  minJobs: number;
  minRating: number;
  maxFlags: number;
  unlocks: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  desc: string;
  threshold?: number;
  special?: 'rating45' | 'idverified' | 'multiskill';
}

/** A completed job that lives on the auto-generated CV. */
export interface HistoryEntry {
  id: string;
  jobTitle: string;
  category: CategoryId;
  employer: string;
  employerInitials: string;
  date: string;
  hours: number;
  pay: number;
  rating: number;      // 1..5 the employer gave the worker
  review: string;
  safetyFlag: boolean;
}

/** The signed-in worker. */
export interface WorkerProfile {
  name: string;
  age: number;
  initials: string;
  location: string;
  education: string;
  bio: string;
  skills: CategoryId[];
  idVerified: boolean;
  joined: string;
  color: string;
  history: HistoryEntry[];
}

/** Informal gig in the feed. */
export interface Gig {
  id: string;
  title: string;
  category: CategoryId;
  employer: string;
  employerId?: string;
  employerInitials: string;
  /** Average worker→employer rating; null until real workers have rated them. */
  employerRating: number | null;
  employerRatingCount: number;
  location: string;
  distanceKm: number;
  /**
   * Whether distanceKm was actually measured from the viewer's position, or is
   * just the listing's own label. The UI must not present the second as the
   * first — see distanceLabel() in lib/geo.
   */
  distanceSource?: 'measured' | 'listed';
  hours: number;
  payPerHour: number;
  when: string;
  description: string;
  urgent: boolean;
}

/** Formal, tier-gated job. */
export interface FormalJob {
  id: string;
  title: string;
  category: CategoryId;
  employer: string;
  employerInitials: string;
  minTier: TierId;
  type: string;
  location: string;
  distanceKm: number;
  distanceSource?: 'measured' | 'listed';
  salary: string;
  education: string;
  description: string;
  perks: string[];
}

/** Another worker shown on the employer's talent screen. */
export interface TalentWorker {
  id: string;
  name: string;
  initials: string;
  age: number;
  location: string;
  skills: CategoryId[];
  rating: number;
  jobsDone: number;
  idVerified: boolean;
  tier: TierId;
  color: string;
  tagline: string;
  badges: string[];
}

/** Derived reputation + tier snapshot for the worker. */
export interface CvSnapshot {
  jobsDone: number;
  avg: number;
  totalEarned: number;
  flags: number;
  categoriesWorked: number;
  rep: number;
  earnedBadges: Set<string>;
  tier: Tier;
  nextTier: Tier | null;
  tierProgress: number;
  jobsToGo: number;
  ratingMet: boolean;
  flagBlocked: boolean;
}

export type Role = 'worker' | 'employer';
