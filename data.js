/* ============================================================
   Vuka Uzenzele — seed data
   Mock data powering the prototype. No backend, no network.
   "Vuka Uzenzele" (isiZulu): Rise up and do it for yourself.
   Brand: Gijima (navy #0E355A / red #F20023).
   ============================================================ */

// ---- Gig categories (wider than cleaning-only rivals) ----
const CATEGORIES = [
  { id: 'cleaning',  label: 'Cleaning',      icon: '🧽', color: '#0E8A09' },
  { id: 'garden',    label: 'Gardening',     icon: '🌿', color: '#16A34A' },
  { id: 'dogs',      label: 'Dog-walking',   icon: '🐕', color: '#B45309' },
  { id: 'moving',    label: 'Moving help',   icon: '📦', color: '#5B21B6' },
  { id: 'errands',   label: 'Errands',       icon: '🛵', color: '#C41230' },
  { id: 'tutoring',  label: 'Tutoring',      icon: '📚', color: '#1273B8' },
  { id: 'carwash',   label: 'Car wash',      icon: '🚗', color: '#0E355A' },
  { id: 'childcare', label: 'Childminding',  icon: '🧸', color: '#8A5A00' },
];

// SA legal reference used by the "Fair Pay" meter.
// National Minimum Wage 2025: ~R28.79/hour. We round for the demo.
const MIN_WAGE_PER_HOUR = 28.79;

/* ------------------------------------------------------------
   THE OPPORTUNITY LADDER — the heart of the new concept.
   A strong, verified profile unlocks better + more FORMAL work.
   Tier is earned from: jobs completed, average rating, and a
   clean safety record. You cannot buy your way up — only work.
   ------------------------------------------------------------ */
const TIERS = [
  {
    id: 0, name: 'Starter', tagline: 'Everyone starts here',
    color: '#0E8A09', ring: ['#16A34A', '#4ADE80'], icon: '🌱',
    minJobs: 0, minRating: 0, maxFlags: 99,
    unlocks: 'Informal gigs near you — cleaning, gardening, errands, car washing.',
  },
  {
    id: 1, name: 'Trusted', tagline: 'Proven & reliable',
    color: '#B45309', ring: ['#B45309', '#F59E0B'], icon: '🥉',
    minJobs: 3, minRating: 4.0, maxFlags: 0,
    unlocks: 'Higher-paying gigs + your first FORMAL shift work: petrol attendant, general worker, warehouse.',
  },
  {
    id: 2, name: 'Professional', tagline: 'Job-ready',
    color: '#0E355A', ring: ['#0E355A', '#1273B8'], icon: '🥈',
    minJobs: 8, minRating: 4.3, maxFlags: 0,
    unlocks: 'Formal entry-level employment: cashier, security officer, call-centre agent, retail assistant.',
  },
  {
    id: 3, name: 'Elite', tagline: 'Top 5% — employer favourite',
    color: '#F59E0B', ring: ['#D97706', '#FBBF24'], icon: '🥇',
    minJobs: 15, minRating: 4.6, maxFlags: 0,
    unlocks: 'Permanent contracts, team-leader roles, and priority — employers see you first.',
  },
];

// ---- Badges the CV auto-earns as work is completed ----
const BADGES = [
  { id: 'first',     label: 'First Job',        icon: '🌱', desc: 'Completed your very first gig',            threshold: 1 },
  { id: 'rising',    label: 'Rising Star',      icon: '⭐', desc: 'Reached a 4.5+ average rating',            special: 'rating45' },
  { id: 'reliable',  label: 'Reliable',         icon: '🛡️', desc: 'Completed 5 jobs with no safety flags',    threshold: 5 },
  { id: 'verified',  label: 'ID Verified',      icon: '✅', desc: 'Identity confirmed via SA ID',             special: 'idverified' },
  { id: 'hustler',   label: 'Hustler',          icon: '🔥', desc: 'Completed 10 jobs',                        threshold: 10 },
  { id: 'multi',     label: 'Multi-skilled',    icon: '🎯', desc: 'Worked across 3+ categories',              special: 'multiskill' },
];

// ---- The signed-in young worker (the hero of the demo) ----
// Starts light: verified ID, a couple of jobs, on the way up.
const ME = {
  id: 'me',
  name: 'Thandeka Mokoena',
  age: 21,
  initials: 'TM',
  location: 'Soweto, Gauteng',
  education: 'Grade 11 · No matric',
  bio: 'Hard-working and reliable. I learn fast and show up on time. Looking to build my name one job at a time.',
  skills: ['cleaning', 'garden', 'errands'],
  idVerified: true,
  joined: 'March 2026',
  hourlyRate: 45,
  color: '#0E355A',
  history: [
    {
      jobTitle: 'Deep clean 2-bedroom flat', category: 'cleaning',
      employer: 'Mrs. Naidoo', employerInitials: 'PN', date: '12 Jun 2026',
      hours: 4, pay: 220, rating: 5,
      review: 'Thandeka was fantastic — thorough, polite and finished ahead of time. Would book again in a heartbeat.',
      safetyFlag: false,
    },
    {
      jobTitle: 'Weekly garden tidy-up', category: 'garden',
      employer: 'Mr. van der Merwe', employerInitials: 'JV', date: '28 Jun 2026',
      hours: 3, pay: 150, rating: 4,
      review: 'Good work and friendly. Garden looked great. A little late but messaged me to let me know.',
      safetyFlag: false,
    },
  ],
};

// ---- Informal gigs in the feed (near "me") — Tier 0, open to all ----
const JOBS = [
  { id: 'j1', title: 'Wash 2 cars this Saturday', category: 'carwash', employer: 'Sipho Dlamini', employerInitials: 'SD',
    employerRating: 4.8, location: 'Diepkloof, Soweto', distanceKm: 1.2, hours: 2, payPerHour: 50, when: 'Sat, 26 Jul · 09:00',
    description: 'Two cars — a hatchback and a bakkie. Exterior wash and interior vacuum. Water and soap provided.', urgent: true },
  { id: 'j2', title: 'Help move furniture to new flat', category: 'moving', employer: 'Lerato Khumalo', employerInitials: 'LK',
    employerRating: 4.9, location: 'Orlando East, Soweto', distanceKm: 3.4, hours: 3, payPerHour: 55, when: 'Sun, 27 Jul · 08:00',
    description: 'Moving from a ground-floor flat. Need 1 strong helper to carry boxes and a couch. Bakkie already arranged.', urgent: false },
  { id: 'j3', title: 'Maths tutoring for Grade 9 learner', category: 'tutoring', employer: 'Mrs. Petersen', employerInitials: 'AP',
    employerRating: 5.0, location: 'Pimville, Soweto', distanceKm: 2.1, hours: 1.5, payPerHour: 80, when: 'Weekdays · 15:30',
    description: 'My son needs help with algebra and geometry, twice a week. Patient tutor who can explain simply.', urgent: false },
  { id: 'j4', title: 'Walk my two dogs (mornings)', category: 'dogs', employer: 'Kyle Adams', employerInitials: 'KA',
    employerRating: 4.7, location: 'Meadowlands, Soweto', distanceKm: 4.0, hours: 1, payPerHour: 45, when: 'Mon–Fri · 06:30',
    description: 'Two friendly Labradors. 45-min walk around the block. Must love dogs and be reliable every morning.', urgent: false },
  { id: 'j5', title: 'Clean & tidy salon before opening', category: 'cleaning', employer: 'Zanele Beauty Bar', employerInitials: 'ZB',
    employerRating: 4.6, location: 'Dobsonville, Soweto', distanceKm: 5.2, hours: 2, payPerHour: 42, when: 'Tue & Thu · 07:00',
    description: 'Sweep, mop, wipe mirrors and stations before we open. Regular gig for the right person.', urgent: false },
  { id: 'j6', title: 'Grocery run for elderly gogo', category: 'errands', employer: 'Nomsa Mahlangu', employerInitials: 'NM',
    employerRating: 5.0, location: 'Zola, Soweto', distanceKm: 2.8, hours: 1.5, payPerHour: 40, when: 'Fri, 25 Jul · 10:00',
    description: 'Collect a shopping list from Shoprite and drop it at my mother\'s home. Cash provided for groceries.', urgent: true },
];

/* ------------------------------------------------------------
   FORMAL, LOW-EDUCATION-BARRIER JOBS — tier-gated.
   These are the "better opportunities" a strong profile unlocks.
   Employer names are fictional (a prototype must not fabricate
   real companies' listings). Pay reflects realistic SA ranges.
   ------------------------------------------------------------ */
const FORMAL_JOBS = [
  { id: 'f1', title: 'Petrol Attendant', category: 'carwash', employer: 'GoFuel Stations', employerInitials: 'GF',
    minTier: 1, type: 'Shift work', location: 'Nasrec, Johannesburg', distanceKm: 6.1,
    salary: 'R4 200 / month + tips', education: 'No matric required · we train you',
    description: 'Fuel vehicles, keep the forecourt clean and give friendly service. Day and night shifts available. Reliable, well-rated Vuka workers preferred.',
    perks: ['Weekly pay', 'On-the-job training', 'Uniform provided'] },
  { id: 'f2', title: 'Warehouse Picker / Packer', category: 'moving', employer: 'SwiftLogistics', employerInitials: 'SL',
    minTier: 1, type: 'Contract (3 months)', location: 'City Deep, Johannesburg', distanceKm: 8.4,
    salary: 'R5 000 / month', education: 'Grade 10+ · no experience needed',
    description: 'Pick, pack and scan orders in a busy distribution centre. Physical role. Good attendance record from Vuka is a big plus.',
    perks: ['Overtime available', 'Transport allowance', 'Path to permanent'] },
  { id: 'f3', title: 'General Worker', category: 'moving', employer: 'BuildRight Projects', employerInitials: 'BR',
    minTier: 1, type: 'Daily / weekly', location: 'Soweto & surrounds', distanceKm: 2.0,
    salary: 'R230 / day', education: 'None required',
    description: 'Assist on-site: carrying, cleaning up, basic prep. Steady work for reliable, safety-conscious workers.',
    perks: ['Paid daily', 'PPE provided', 'Skills training on site'] },
  { id: 'f4', title: 'Retail Cashier', category: 'errands', employer: 'MegaMart Retail', employerInitials: 'MM',
    minTier: 2, type: 'Permanent (part-time)', location: 'Maponya Mall, Soweto', distanceKm: 3.5,
    salary: 'R5 800 / month', education: 'Grade 10+ · full till training given',
    description: 'Operate the till, handle cash and card, and give warm customer service. Trust and a clean record matter — that\'s why we hire from Vuka\'s top tiers.',
    perks: ['Staff discount', 'Provident fund', 'Growth to supervisor'] },
  { id: 'f5', title: 'Security Officer (Grade C)', category: 'cleaning', employer: 'SecureGuard SA', employerInitials: 'SG',
    minTier: 2, type: 'Permanent', location: 'Sandton, Johannesburg', distanceKm: 18.0,
    salary: 'R6 500 / month', education: 'No matric needed · PSIRA training sponsored',
    description: 'Access control and patrols at a corporate site. We sponsor your PSIRA Grade C. A verified, no-flags Vuka record is exactly what we screen for.',
    perks: ['PSIRA course paid', 'Night-shift allowance', 'Permanent contract'] },
  { id: 'f6', title: 'Call-Centre Agent', category: 'tutoring', employer: 'ConnectCall BPO', employerInitials: 'CC',
    minTier: 2, type: 'Permanent', location: 'Braamfontein, Johannesburg', distanceKm: 14.0,
    salary: 'R6 000 / month + incentives', education: 'Grade 11+ · clear communication',
    description: 'Inbound customer support for a local telco. Paid 2-week training. Your Vuka reviews prove you\'re reliable and great with people.',
    perks: ['Paid training', 'Performance bonus', 'Clear career path'] },
  { id: 'f7', title: 'Retail Floor Assistant', category: 'errands', employer: 'MegaMart Retail', employerInitials: 'MM',
    minTier: 2, type: 'Permanent (part-time)', location: 'Jabulani, Soweto', distanceKm: 4.2,
    salary: 'R5 500 / month', education: 'Grade 10+',
    description: 'Pack shelves, help shoppers and keep the floor neat. Friendly, dependable people from Vuka move up fast here.',
    perks: ['Staff discount', 'Flexible shifts', 'Growth to cashier/supervisor'] },
  { id: 'f8', title: 'Cleaning Team Leader', category: 'cleaning', employer: 'CleanCorp Facilities', employerInitials: 'CO',
    minTier: 3, type: 'Permanent', location: 'Rosebank, Johannesburg', distanceKm: 16.0,
    salary: 'R8 500 / month', education: 'No matric needed · leadership counts',
    description: 'Lead a small cleaning crew at a corporate client. We reserve this for Vuka Elite — proven leaders with top ratings and a spotless safety record.',
    perks: ['Manage a team', 'Provident fund', 'Company phone'] },
];

// ---- Other workers (for the Employer "browse talent" screen) ----
const WORKERS = [
  { id: 'w1', name: 'Bongani Zulu', initials: 'BZ', age: 23, location: 'Orlando West',
    skills: ['moving', 'garden', 'carwash'], rating: 4.9, jobsDone: 27, idVerified: true, tier: 3,
    color: '#5B21B6', tagline: 'Strong, punctual, great with heavy work.', badges: ['first', 'reliable', 'verified', 'hustler', 'multi'] },
  { id: 'w2', name: 'Aphiwe Ndlovu', initials: 'AN', age: 19, location: 'Pimville',
    skills: ['tutoring', 'childcare'], rating: 5.0, jobsDone: 14, idVerified: true, tier: 2,
    color: '#1273B8', tagline: 'Patient tutor, loves working with kids.', badges: ['first', 'rising', 'reliable', 'verified'] },
  { id: 'w3', name: 'Thabo Molefe', initials: 'TM', age: 24, location: 'Meadowlands',
    skills: ['cleaning', 'errands', 'dogs'], rating: 4.7, jobsDone: 31, idVerified: true, tier: 3,
    color: '#C41230', tagline: 'Reliable all-rounder, never misses a day.', badges: ['first', 'reliable', 'verified', 'hustler', 'multi'] },
  { id: 'w4', name: 'Naledi Sithole', initials: 'NS', age: 20, location: 'Diepkloof',
    skills: ['cleaning', 'garden'], rating: 4.8, jobsDone: 9, idVerified: false, tier: 2,
    color: '#B45309', tagline: 'Detail-focused and honest. Building my rep.', badges: ['first', 'reliable'] },
];
