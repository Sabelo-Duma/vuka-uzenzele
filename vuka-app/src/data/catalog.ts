import type { Badge, Category, Tier } from '../types';

/** National Minimum Wage 2025 reference used by the Fair-Pay meter. */
export const MIN_WAGE_PER_HOUR = 28.79;

export const CATEGORIES: Category[] = [
  { id: 'cleaning', label: 'Cleaning', icon: '🧽', color: '#0E8A09' },
  { id: 'garden', label: 'Gardening', icon: '🌿', color: '#16A34A' },
  { id: 'dogs', label: 'Dog-walking', icon: '🐕', color: '#B45309' },
  { id: 'moving', label: 'Moving help', icon: '📦', color: '#5B21B6' },
  { id: 'errands', label: 'Errands', icon: '🛵', color: '#C41230' },
  { id: 'tutoring', label: 'Tutoring', icon: '📚', color: '#1273B8' },
  { id: 'carwash', label: 'Car wash', icon: '🚗', color: '#0E355A' },
  { id: 'childcare', label: 'Childminding', icon: '🧸', color: '#8A5A00' },
];

export const catById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

/** The opportunity ladder — earned, not bought. */
export const TIERS: Tier[] = [
  {
    id: 0, name: 'Starter', tagline: 'Everyone starts here',
    color: 'var(--t-starter)', ring: ['#16A34A', '#4ADE80'], icon: '🌱',
    minJobs: 0, minRating: 0, maxFlags: 99,
    unlocks: 'Informal gigs near you — cleaning, gardening, errands, car washing.',
  },
  {
    id: 1, name: 'Trusted', tagline: 'Proven & reliable',
    color: 'var(--t-trusted)', ring: ['#B45309', '#F59E0B'], icon: '🥉',
    minJobs: 3, minRating: 4.0, maxFlags: 0,
    unlocks: 'Higher-paying gigs + your first FORMAL shift work: petrol attendant, general worker, warehouse.',
  },
  {
    id: 2, name: 'Professional', tagline: 'Job-ready',
    color: 'var(--t-pro)', ring: ['#0E355A', '#1273B8'], icon: '🥈',
    minJobs: 8, minRating: 4.3, maxFlags: 0,
    unlocks: 'Formal entry-level employment: cashier, security officer, call-centre agent, retail assistant.',
  },
  {
    id: 3, name: 'Elite', tagline: 'Top 5% — employer favourite',
    color: 'var(--t-elite)', ring: ['#D97706', '#FBBF24'], icon: '🥇',
    minJobs: 15, minRating: 4.6, maxFlags: 0,
    unlocks: 'Permanent contracts, team-leader roles, and priority — employers see you first.',
  },
];

export const BADGES: Badge[] = [
  { id: 'first', label: 'First Job', icon: '🌱', desc: 'Completed your very first gig', threshold: 1 },
  { id: 'rising', label: 'Rising Star', icon: '⭐', desc: 'Reached a 4.5+ average rating', special: 'rating45' },
  { id: 'reliable', label: 'Reliable', icon: '🛡️', desc: 'Completed 5 jobs with no safety flags', threshold: 5 },
  { id: 'verified', label: 'ID Verified', icon: '✅', desc: 'Identity confirmed via SA ID', special: 'idverified' },
  { id: 'hustler', label: 'Hustler', icon: '🔥', desc: 'Completed 10 jobs', threshold: 10 },
  { id: 'multi', label: 'Multi-skilled', icon: '🎯', desc: 'Worked across 3+ categories', special: 'multiskill' },
];
