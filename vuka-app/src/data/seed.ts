import type { FormalJob, Gig, TalentWorker, WorkerProfile } from '../types';

/** Demo worker preset — used by "Open the demo profile". */
export function demoWorker(): WorkerProfile {
  return {
    name: 'Thandeka Mokoena',
    age: 21,
    initials: 'TM',
    location: 'Soweto, Gauteng',
    education: 'Grade 11 · No matric',
    bio: 'Hard-working and reliable. I learn fast and show up on time. Looking to build my name one job at a time.',
    skills: ['cleaning', 'garden', 'errands'],
    idVerified: true,
    joined: 'March 2026',
    color: '#0E355A',
    history: [
      {
        id: 'h1', jobTitle: 'Deep clean 2-bedroom flat', category: 'cleaning',
        employer: 'Mrs. Naidoo', employerInitials: 'PN', date: '12 Jun 2026',
        hours: 4, pay: 220, rating: 5,
        review: 'Thandeka was fantastic — thorough, polite and finished ahead of time. Would book again in a heartbeat.',
        safetyFlag: false,
      },
      {
        id: 'h2', jobTitle: 'Weekly garden tidy-up', category: 'garden',
        employer: 'Mr. van der Merwe', employerInitials: 'JV', date: '28 Jun 2026',
        hours: 3, pay: 150, rating: 4,
        review: 'Good work and friendly. Garden looked great. A little late but messaged me to let me know.',
        safetyFlag: false,
      },
    ],
  };
}

/** Fresh, empty-CV worker built from onboarding answers. */
export function freshWorker(input: {
  name: string; age: number; location: string;
  skills: WorkerProfile['skills']; idVerified: boolean;
}): WorkerProfile {
  const initials = input.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
  return {
    name: input.name || 'New Member',
    age: input.age || 18,
    initials,
    location: input.location || 'South Africa',
    education: 'New member',
    bio: 'New to Vuka and ready to work. Reliable, willing to learn, and building my reputation one job at a time.',
    skills: input.skills.length ? input.skills : ['cleaning'],
    idVerified: input.idVerified,
    joined: 'July 2026',
    color: '#0E355A',
    history: [],
  };
}

export const SEED_GIGS: Gig[] = [
  { id: 'j1', title: 'Wash 2 cars this Saturday', category: 'carwash', employer: 'Sipho Dlamini', employerInitials: 'SD', employerRating: 4.8, location: 'Diepkloof, Soweto', distanceKm: 1.2, hours: 2, payPerHour: 50, when: 'Sat, 26 Jul · 09:00', description: 'Two cars — a hatchback and a bakkie. Exterior wash and interior vacuum. Water and soap provided.', urgent: true },
  { id: 'j2', title: 'Help move furniture to new flat', category: 'moving', employer: 'Lerato Khumalo', employerInitials: 'LK', employerRating: 4.9, location: 'Orlando East, Soweto', distanceKm: 3.4, hours: 3, payPerHour: 55, when: 'Sun, 27 Jul · 08:00', description: 'Moving from a ground-floor flat. Need 1 strong helper to carry boxes and a couch. Bakkie already arranged.', urgent: false },
  { id: 'j3', title: 'Maths tutoring for Grade 9 learner', category: 'tutoring', employer: 'Mrs. Petersen', employerInitials: 'AP', employerRating: 5.0, location: 'Pimville, Soweto', distanceKm: 2.1, hours: 1.5, payPerHour: 80, when: 'Weekdays · 15:30', description: 'My son needs help with algebra and geometry, twice a week. Patient tutor who can explain simply.', urgent: false },
  { id: 'j4', title: 'Walk my two dogs (mornings)', category: 'dogs', employer: 'Kyle Adams', employerInitials: 'KA', employerRating: 4.7, location: 'Meadowlands, Soweto', distanceKm: 4.0, hours: 1, payPerHour: 45, when: 'Mon–Fri · 06:30', description: 'Two friendly Labradors. 45-min walk around the block. Must love dogs and be reliable every morning.', urgent: false },
  { id: 'j5', title: 'Clean & tidy salon before opening', category: 'cleaning', employer: 'Zanele Beauty Bar', employerInitials: 'ZB', employerRating: 4.6, location: 'Dobsonville, Soweto', distanceKm: 5.2, hours: 2, payPerHour: 42, when: 'Tue & Thu · 07:00', description: 'Sweep, mop, wipe mirrors and stations before we open. Regular gig for the right person.', urgent: false },
  { id: 'j6', title: 'Grocery run for elderly gogo', category: 'errands', employer: 'Nomsa Mahlangu', employerInitials: 'NM', employerRating: 5.0, location: 'Zola, Soweto', distanceKm: 2.8, hours: 1.5, payPerHour: 40, when: 'Fri, 25 Jul · 10:00', description: "Collect a shopping list from the shops and drop it at my mother's home. Cash provided for groceries.", urgent: true },
];

/** Employer names are fictional — a prototype must not fabricate real companies' listings. */
export const FORMAL_JOBS: FormalJob[] = [
  { id: 'f1', title: 'Petrol Attendant', category: 'carwash', employer: 'GoFuel Stations', employerInitials: 'GF', minTier: 1, type: 'Shift work', location: 'Nasrec, Johannesburg', distanceKm: 6.1, salary: 'R4 200 / month + tips', education: 'No matric required · we train you', description: 'Fuel vehicles, keep the forecourt clean and give friendly service. Day and night shifts available. Reliable, well-rated Vuka workers preferred.', perks: ['Weekly pay', 'On-the-job training', 'Uniform provided'] },
  { id: 'f2', title: 'Warehouse Picker / Packer', category: 'moving', employer: 'SwiftLogistics', employerInitials: 'SL', minTier: 1, type: 'Contract (3 months)', location: 'City Deep, Johannesburg', distanceKm: 8.4, salary: 'R5 000 / month', education: 'Grade 10+ · no experience needed', description: 'Pick, pack and scan orders in a busy distribution centre. Physical role. A good attendance record from Vuka is a big plus.', perks: ['Overtime available', 'Transport allowance', 'Path to permanent'] },
  { id: 'f3', title: 'General Worker', category: 'moving', employer: 'BuildRight Projects', employerInitials: 'BR', minTier: 1, type: 'Daily / weekly', location: 'Soweto & surrounds', distanceKm: 2.0, salary: 'R230 / day', education: 'None required', description: 'Assist on-site: carrying, cleaning up, basic prep. Steady work for reliable, safety-conscious workers.', perks: ['Paid daily', 'PPE provided', 'Skills training on site'] },
  { id: 'f4', title: 'Retail Cashier', category: 'errands', employer: 'MegaMart Retail', employerInitials: 'MM', minTier: 2, type: 'Permanent (part-time)', location: 'Maponya Mall, Soweto', distanceKm: 3.5, salary: 'R5 800 / month', education: 'Grade 10+ · full till training given', description: "Operate the till, handle cash and card, and give warm customer service. Trust and a clean record matter — that's why we hire from Vuka's top tiers.", perks: ['Staff discount', 'Provident fund', 'Growth to supervisor'] },
  { id: 'f5', title: 'Security Officer (Grade C)', category: 'cleaning', employer: 'SecureGuard SA', employerInitials: 'SG', minTier: 2, type: 'Permanent', location: 'Sandton, Johannesburg', distanceKm: 18.0, salary: 'R6 500 / month', education: 'No matric needed · PSIRA training sponsored', description: 'Access control and patrols at a corporate site. We sponsor your PSIRA Grade C. A verified, no-flags Vuka record is exactly what we screen for.', perks: ['PSIRA course paid', 'Night-shift allowance', 'Permanent contract'] },
  { id: 'f6', title: 'Call-Centre Agent', category: 'tutoring', employer: 'ConnectCall BPO', employerInitials: 'CC', minTier: 2, type: 'Permanent', location: 'Braamfontein, Johannesburg', distanceKm: 14.0, salary: 'R6 000 / month + incentives', education: 'Grade 11+ · clear communication', description: "Inbound customer support for a local telco. Paid 2-week training. Your Vuka reviews prove you're reliable and great with people.", perks: ['Paid training', 'Performance bonus', 'Clear career path'] },
  { id: 'f7', title: 'Retail Floor Assistant', category: 'errands', employer: 'MegaMart Retail', employerInitials: 'MM', minTier: 2, type: 'Permanent (part-time)', location: 'Jabulani, Soweto', distanceKm: 4.2, salary: 'R5 500 / month', education: 'Grade 10+', description: 'Pack shelves, help shoppers and keep the floor neat. Friendly, dependable people from Vuka move up fast here.', perks: ['Staff discount', 'Flexible shifts', 'Growth to cashier/supervisor'] },
  { id: 'f8', title: 'Cleaning Team Leader', category: 'cleaning', employer: 'CleanCorp Facilities', employerInitials: 'CO', minTier: 3, type: 'Permanent', location: 'Rosebank, Johannesburg', distanceKm: 16.0, salary: 'R8 500 / month', education: 'No matric needed · leadership counts', description: 'Lead a small cleaning crew at a corporate client. We reserve this for Vuka Elite — proven leaders with top ratings and a spotless safety record.', perks: ['Manage a team', 'Provident fund', 'Company phone'] },
];

export const TALENT: TalentWorker[] = [
  { id: 'w1', name: 'Bongani Zulu', initials: 'BZ', age: 23, location: 'Orlando West', skills: ['moving', 'garden', 'carwash'], rating: 4.9, jobsDone: 27, idVerified: true, tier: 3, color: '#5B21B6', tagline: 'Strong, punctual, great with heavy work.', badges: ['first', 'reliable', 'verified', 'hustler', 'multi'] },
  { id: 'w2', name: 'Aphiwe Ndlovu', initials: 'AN', age: 19, location: 'Pimville', skills: ['tutoring', 'childcare'], rating: 5.0, jobsDone: 14, idVerified: true, tier: 2, color: '#1273B8', tagline: 'Patient tutor, loves working with kids.', badges: ['first', 'rising', 'reliable', 'verified'] },
  { id: 'w3', name: 'Thabo Molefe', initials: 'TM', age: 24, location: 'Meadowlands', skills: ['cleaning', 'errands', 'dogs'], rating: 4.7, jobsDone: 31, idVerified: true, tier: 3, color: '#C41230', tagline: 'Reliable all-rounder, never misses a day.', badges: ['first', 'reliable', 'verified', 'hustler', 'multi'] },
  { id: 'w4', name: 'Naledi Sithole', initials: 'NS', age: 20, location: 'Diepkloof', skills: ['cleaning', 'garden'], rating: 4.8, jobsDone: 9, idVerified: false, tier: 2, color: '#B45309', tagline: 'Detail-focused and honest. Building my rep.', badges: ['first', 'reliable'] },
];
