import { fileURLToPath } from 'node:url';
import { db } from './db.mjs';
import { hashPassword, uuid } from './auth.mjs';
import { autoReview } from './engine.mjs';

const NOW = new Date().toISOString();

const FORMAL_JOBS = [
  { id: 'f1', title: 'Petrol Attendant', category: 'carwash', employer: 'GoFuel Stations', ei: 'GF', minTier: 1, type: 'Shift work', location: 'Nasrec, Johannesburg', dist: 6.1, salary: 'R4 200 / month + tips', education: 'No matric required · we train you', description: 'Fuel vehicles, keep the forecourt clean and give friendly service. Day and night shifts. Reliable, well-rated Vuka workers preferred.', perks: ['Weekly pay', 'On-the-job training', 'Uniform provided'] },
  { id: 'f2', title: 'Warehouse Picker / Packer', category: 'moving', employer: 'SwiftLogistics', ei: 'SL', minTier: 1, type: 'Contract (3 months)', location: 'City Deep, Johannesburg', dist: 8.4, salary: 'R5 000 / month', education: 'Grade 10+ · no experience needed', description: 'Pick, pack and scan orders in a busy distribution centre. A good attendance record from Vuka is a big plus.', perks: ['Overtime available', 'Transport allowance', 'Path to permanent'] },
  { id: 'f3', title: 'General Worker', category: 'moving', employer: 'BuildRight Projects', ei: 'BR', minTier: 1, type: 'Daily / weekly', location: 'Soweto & surrounds', dist: 2.0, salary: 'R230 / day', education: 'None required', description: 'Assist on-site: carrying, cleaning up, basic prep. Steady work for reliable, safety-conscious workers.', perks: ['Paid daily', 'PPE provided', 'Skills training on site'] },
  { id: 'f4', title: 'Retail Cashier', category: 'errands', employer: 'MegaMart Retail', ei: 'MM', minTier: 2, type: 'Permanent (part-time)', location: 'Maponya Mall, Soweto', dist: 3.5, salary: 'R5 800 / month', education: 'Grade 10+ · full till training given', description: "Operate the till, handle cash and card, give warm service. Trust and a clean record matter — that's why we hire from Vuka's top tiers.", perks: ['Staff discount', 'Provident fund', 'Growth to supervisor'] },
  { id: 'f5', title: 'Security Officer (Grade C)', category: 'cleaning', employer: 'SecureGuard SA', ei: 'SG', minTier: 2, type: 'Permanent', location: 'Sandton, Johannesburg', dist: 18.0, salary: 'R6 500 / month', education: 'No matric needed · PSIRA training sponsored', description: 'Access control and patrols at a corporate site. We sponsor your PSIRA Grade C. A verified, no-flags Vuka record is what we screen for.', perks: ['PSIRA course paid', 'Night-shift allowance', 'Permanent contract'] },
  { id: 'f6', title: 'Call-Centre Agent', category: 'tutoring', employer: 'ConnectCall BPO', ei: 'CC', minTier: 2, type: 'Permanent', location: 'Braamfontein, Johannesburg', dist: 14.0, salary: 'R6 000 / month + incentives', education: 'Grade 11+ · clear communication', description: "Inbound customer support for a local telco. Paid 2-week training. Your Vuka reviews prove you're reliable and great with people.", perks: ['Paid training', 'Performance bonus', 'Clear career path'] },
  { id: 'f7', title: 'Retail Floor Assistant', category: 'errands', employer: 'MegaMart Retail', ei: 'MM', minTier: 2, type: 'Permanent (part-time)', location: 'Jabulani, Soweto', dist: 4.2, salary: 'R5 500 / month', education: 'Grade 10+', description: 'Pack shelves, help shoppers and keep the floor neat. Friendly, dependable people from Vuka move up fast here.', perks: ['Staff discount', 'Flexible shifts', 'Growth to cashier'] },
  { id: 'f8', title: 'Cleaning Team Leader', category: 'cleaning', employer: 'CleanCorp Facilities', ei: 'CO', minTier: 3, type: 'Permanent', location: 'Rosebank, Johannesburg', dist: 16.0, salary: 'R8 500 / month', education: 'No matric needed · leadership counts', description: 'Lead a small cleaning crew at a corporate client. Reserved for Vuka Elite — proven leaders with top ratings and a spotless safety record.', perks: ['Manage a team', 'Provident fund', 'Company phone'] },
];

const GIGS = [
  { id: 'j1', title: 'Wash 2 cars this Saturday', category: 'carwash', name: 'Sipho Dlamini', ei: 'SD', rating: 4.8, location: 'Diepkloof, Soweto', dist: 1.2, hours: 2, rate: 50, when: 'Sat, 26 Jul · 09:00', description: 'Two cars — a hatchback and a bakkie. Exterior wash and interior vacuum. Water and soap provided.', urgent: 1 },
  { id: 'j2', title: 'Help move furniture to new flat', category: 'moving', name: 'Lerato Khumalo', ei: 'LK', rating: 4.9, location: 'Orlando East, Soweto', dist: 3.4, hours: 3, rate: 55, when: 'Sun, 27 Jul · 08:00', description: 'Moving from a ground-floor flat. Need 1 strong helper to carry boxes and a couch. Bakkie arranged.', urgent: 0 },
  { id: 'j3', title: 'Maths tutoring for Grade 9 learner', category: 'tutoring', name: 'Mrs. Petersen', ei: 'AP', rating: 5.0, location: 'Pimville, Soweto', dist: 2.1, hours: 1.5, rate: 80, when: 'Weekdays · 15:30', description: 'My son needs help with algebra and geometry, twice a week. Patient tutor who can explain simply.', urgent: 0 },
  { id: 'j4', title: 'Walk my two dogs (mornings)', category: 'dogs', name: 'Kyle Adams', ei: 'KA', rating: 4.7, location: 'Meadowlands, Soweto', dist: 4.0, hours: 1, rate: 45, when: 'Mon–Fri · 06:30', description: 'Two friendly Labradors. 45-min walk around the block. Must love dogs and be reliable every morning.', urgent: 0 },
  { id: 'j5', title: 'Clean & tidy salon before opening', category: 'cleaning', name: 'Zanele Beauty Bar', ei: 'ZB', rating: 4.6, location: 'Dobsonville, Soweto', dist: 5.2, hours: 2, rate: 42, when: 'Tue & Thu · 07:00', description: 'Sweep, mop, wipe mirrors and stations before we open. Regular gig for the right person.', urgent: 0 },
  { id: 'j6', title: 'Grocery run for elderly gogo', category: 'errands', name: 'Nomsa Mahlangu', ei: 'NM', rating: 5.0, location: 'Zola, Soweto', dist: 2.8, hours: 1.5, rate: 40, when: 'Fri, 25 Jul · 10:00', description: 'Collect a shopping list from the shops and drop it at my mother\'s home. Cash provided for groceries.', urgent: 1 },
];

const TALENT = [
  { name: 'Bongani Zulu', phone: '0731000001', skills: ['moving', 'garden', 'carwash'], jobs: 27, fours: 3, location: 'Orlando West', age: 23, color: '#5B21B6', verified: 1, tagline: 'Strong, punctual, great with heavy work.' },
  { name: 'Aphiwe Ndlovu', phone: '0731000002', skills: ['tutoring', 'childcare'], jobs: 14, fours: 0, location: 'Pimville', age: 19, color: '#1273B8', verified: 1, tagline: 'Patient tutor, loves working with kids.' },
  { name: 'Thabo Molefe', phone: '0731000003', skills: ['cleaning', 'errands', 'dogs'], jobs: 31, fours: 9, location: 'Meadowlands', age: 24, color: '#C41230', verified: 1, tagline: 'Reliable all-rounder, never misses a day.' },
  { name: 'Naledi Sithole', phone: '0731000004', skills: ['cleaning', 'garden'], jobs: 9, fours: 2, location: 'Diepkloof', age: 20, color: '#B45309', verified: 0, tagline: 'Detail-focused and honest. Building my rep.' },
];

const insUser = db.prepare('INSERT INTO users (id, role, phone, password_hash, name, created_at) VALUES (?,?,?,?,?,?)');
const insProfile = db.prepare('INSERT INTO worker_profiles (user_id, age, location, education, bio, skills, id_verified, color, joined, tagline) VALUES (?,?,?,?,?,?,?,?,?,?)');
const insGig = db.prepare('INSERT INTO gigs (id, employer_id, title, category, employer_name, employer_initials, employer_rating, location, distance_km, hours, pay_per_hour, when_text, description, urgent, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const insFormal = db.prepare('INSERT INTO formal_jobs (id, title, category, employer, employer_initials, min_tier, type, location, distance_km, salary, education, description, perks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
const insHist = db.prepare('INSERT INTO history (id, worker_id, job_title, category, employer, employer_initials, date, hours, pay, rating, review, safety_flag, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');

function genHistory(workerId, n, fours, cats) {
  for (let i = 0; i < n; i++) {
    const rating = i < fours ? 4 : 5;
    const cat = cats[i % cats.length];
    insHist.run(uuid(), workerId, 'Completed gig', cat, 'Past client', 'PC', 'Jun 2026', 2 + (i % 3), 100 + (i % 5) * 20, rating, autoReview(rating), 0, NOW);
  }
}

export function seed() {
  for (const t of ['history', 'applications', 'gigs', 'formal_jobs', 'worker_profiles', 'users']) {
    db.exec(`DELETE FROM ${t};`);
  }

  // Demo employer (posts the seed gigs)
  const empId = uuid();
  insUser.run(empId, 'employer', '0720000000', hashPassword('demo1234'), 'Sipho Dlamini', NOW);

  // Demo worker (Thandeka) — one gig from a tier-up
  const demoId = uuid();
  insUser.run(demoId, 'worker', '0710000000', hashPassword('demo1234'), 'Thandeka Mokoena', NOW);
  insProfile.run(demoId, 21, 'Soweto, Gauteng', 'Grade 11 · No matric', 'Hard-working and reliable. I learn fast and show up on time.', JSON.stringify(['cleaning', 'garden', 'errands']), 1, '#0E355A', 'March 2026', 'Reliable and eager to build my name.');
  insHist.run(uuid(), demoId, 'Deep clean 2-bedroom flat', 'cleaning', 'Mrs. Naidoo', 'PN', '12 Jun 2026', 4, 220, 5, 'Thandeka was fantastic — thorough, polite and finished ahead of time. Would book again in a heartbeat.', 0, NOW);
  insHist.run(uuid(), demoId, 'Weekly garden tidy-up', 'garden', 'Mr. van der Merwe', 'JV', '28 Jun 2026', 3, 150, 4, 'Good work and friendly. Garden looked great. A little late but messaged me to let me know.', 0, NOW);

  // Formal jobs
  for (const f of FORMAL_JOBS) {
    insFormal.run(f.id, f.title, f.category, f.employer, f.ei, f.minTier, f.type, f.location, f.dist, f.salary, f.education, f.description, JSON.stringify(f.perks));
  }

  // Gigs
  for (const g of GIGS) {
    insGig.run(g.id, empId, g.title, g.category, g.name, g.ei, g.rating, g.location, g.dist, g.hours, g.rate, g.when, g.description, g.urgent, 'open', NOW);
  }

  // Talent workers (with generated history → real tiers)
  for (const t of TALENT) {
    const id = uuid();
    insUser.run(id, 'worker', t.phone, hashPassword('demo1234'), t.name, NOW);
    insProfile.run(id, t.age, t.location, 'No matric', t.tagline, JSON.stringify(t.skills), t.verified, t.color, 'Feb 2026', t.tagline);
    genHistory(id, t.jobs, t.fours, t.skills);
  }

  return {
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    gigs: db.prepare('SELECT COUNT(*) c FROM gigs').get().c,
    formal: db.prepare('SELECT COUNT(*) c FROM formal_jobs').get().c,
    history: db.prepare('SELECT COUNT(*) c FROM history').get().c,
  };
}

export function seedIfEmpty() {
  const row = db.prepare('SELECT COUNT(*) c FROM formal_jobs').get();
  if (row.c === 0) return seed();
  return null;
}

// Run directly: `npm run seed`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = seed();
  console.log('Seeded:', summary);
}
