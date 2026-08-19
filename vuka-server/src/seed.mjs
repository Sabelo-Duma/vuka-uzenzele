import { fileURLToPath } from 'node:url';
import { all, get, run, initDb } from './db.mjs';
import { hashPassword, uuid } from './auth.mjs';
import { autoReview } from './engine.mjs';
import { coordsForPlace } from './geo.mjs';

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

/* Each seeded gig belongs to a REAL employer account (so following, messaging
   and ratings resolve to an actual user). `rating`/`ratings` describe the
   worker→employer reviews to generate, from which the displayed rating is then
   averaged — no hardcoded stars anywhere. */
const GIGS = [
  { id: 'j1', title: 'Wash 2 cars this Saturday', category: 'carwash', name: 'Sipho Dlamini', ei: 'SD', phone: null, rating: 4.8, ratings: 10, location: 'Diepkloof, Soweto', dist: 1.2, hours: 2, rate: 50, when: 'Sat, 26 Jul · 09:00', description: 'Two cars — a hatchback and a bakkie. Exterior wash and interior vacuum. Water and soap provided.', urgent: 1 },
  { id: 'j2', title: 'Help move furniture to new flat', category: 'moving', name: 'Lerato Khumalo', ei: 'LK', phone: '0721000002', rating: 4.9, ratings: 10, location: 'Orlando East, Soweto', dist: 3.4, hours: 3, rate: 55, when: 'Sun, 27 Jul · 08:00', description: 'Moving from a ground-floor flat. Need 1 strong helper to carry boxes and a couch. Bakkie arranged.', urgent: 0 },
  { id: 'j3', title: 'Maths tutoring for Grade 9 learner', category: 'tutoring', name: 'Mrs. Petersen', ei: 'AP', phone: '0721000003', rating: 5.0, ratings: 6, location: 'Pimville, Soweto', dist: 2.1, hours: 1.5, rate: 80, when: 'Weekdays · 15:30', description: 'My son needs help with algebra and geometry, twice a week. Patient tutor who can explain simply.', urgent: 0 },
  { id: 'j4', title: 'Walk my two dogs (mornings)', category: 'dogs', name: 'Kyle Adams', ei: 'KA', phone: '0721000004', rating: 4.7, ratings: 10, location: 'Meadowlands, Soweto', dist: 4.0, hours: 1, rate: 45, when: 'Mon–Fri · 06:30', description: 'Two friendly Labradors. 45-min walk around the block. Must love dogs and be reliable every morning.', urgent: 0 },
  { id: 'j5', title: 'Clean & tidy salon before opening', category: 'cleaning', name: 'Zanele Beauty Bar', ei: 'ZB', phone: '0721000005', rating: 4.6, ratings: 10, location: 'Dobsonville, Soweto', dist: 5.2, hours: 2, rate: 42, when: 'Tue & Thu · 07:00', description: 'Sweep, mop, wipe mirrors and stations before we open. Regular gig for the right person.', urgent: 0 },
  { id: 'j6', title: 'Grocery run for elderly gogo', category: 'errands', name: 'Nomsa Mahlangu', ei: 'NM', phone: '0721000006', rating: 5.0, ratings: 4, location: 'Zola, Soweto', dist: 2.8, hours: 1.5, rate: 40, when: 'Fri, 25 Jul · 10:00', description: 'Collect a shopping list from the shops and drop it at my mother\'s home. Cash provided for groceries.', urgent: 1 },
];

const TALENT = [
  { name: 'Bongani Zulu', phone: '0731000001', skills: ['moving', 'garden', 'carwash'], jobs: 27, fours: 3, location: 'Orlando West', age: 23, color: '#5B21B6', verified: 1, tagline: 'Strong, punctual, great with heavy work.' },
  { name: 'Aphiwe Ndlovu', phone: '0731000002', skills: ['tutoring', 'childcare'], jobs: 14, fours: 0, location: 'Pimville', age: 19, color: '#1273B8', verified: 1, tagline: 'Patient tutor, loves working with kids.' },
  { name: 'Thabo Molefe', phone: '0731000003', skills: ['cleaning', 'errands', 'dogs'], jobs: 31, fours: 9, location: 'Meadowlands', age: 24, color: '#C41230', verified: 1, tagline: 'Reliable all-rounder, never misses a day.' },
  { name: 'Naledi Sithole', phone: '0731000004', skills: ['cleaning', 'garden'], jobs: 9, fours: 2, location: 'Diepkloof', age: 20, color: '#B45309', verified: 0, tagline: 'Detail-focused and honest. Building my rep.' },
];

const INS_USER = 'INSERT INTO users (id, role, phone, password_hash, name, created_at) VALUES (?,?,?,?,?,?)';
const INS_PROFILE = 'INSERT INTO worker_profiles (user_id, age, location, education, bio, skills, id_verified, color, joined, tagline) VALUES (?,?,?,?,?,?,?,?,?,?)';
const INS_GIG = 'INSERT INTO gigs (id, employer_id, title, category, employer_name, employer_initials, location, distance_km, lat, lng, hours, pay_per_hour, when_text, description, urgent, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
const INS_FORMAL = 'INSERT INTO formal_jobs (id, title, category, employer, employer_initials, min_tier, type, location, distance_km, lat, lng, salary, education, description, perks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
const INS_HIST = 'INSERT INTO history (id, worker_id, job_title, category, employer, employer_initials, employer_id, date, hours, pay, rating, review, safety_flag, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
const INS_EMP_RATING = 'INSERT INTO employer_ratings (id, employer_id, worker_id, gig_id, rating, comment, created_at) VALUES (?,?,?,?,?,?,?)';

// Deterministic IDs for the demo accounts so their share links survive redeploys.
const DEMO_EMP_ID = 'demo-employer-sipho';
const DEMO_WORKER_ID = 'demo-worker-thandeka';

async function genHistory(workerId, n, fours, cats) {
  for (let i = 0; i < n; i++) {
    const rating = i < fours ? 4 : 5;
    const cat = cats[i % cats.length];
    // employer_id is null: these are pre-platform references, not Vuka accounts.
    await run(INS_HIST, [uuid(), workerId, 'Completed gig', cat, 'Past client', 'PC', null, 'Jun 2026', 2 + (i % 3), 100 + (i % 5) * 20, rating, autoReview(rating), 0, NOW]);
  }
}

/** Generate worker→employer reviews that average to `target` over `n` ratings. */
async function genEmployerRatings(employerId, target, n, workerIds) {
  const fours = Math.round((5 - target) * n);
  for (let i = 0; i < n; i++) {
    await run(INS_EMP_RATING, [uuid(), employerId, workerIds[i % workerIds.length], null, i < fours ? 4 : 5, null, NOW]);
  }
}

export async function seed() {
  await initDb();
  for (const t of [
    'formal_applications', 'employer_ratings', 'safety_reports', 'banking_details', 'user_preferences',
    'follows', 'messages', 'invitations', 'history', 'applications', 'gigs', 'formal_jobs', 'worker_profiles', 'users',
  ]) {
    await run(`DELETE FROM ${t}`);
  }

  // Demo employer (posts gig j1) — fixed id
  await run(INS_USER, [DEMO_EMP_ID, 'employer', '0720000000', hashPassword('demo1234'), 'Sipho Dlamini', NOW]);

  // Demo worker (Thandeka) — fixed id so her public CV / share link is stable across deploys
  await run(INS_USER, [DEMO_WORKER_ID, 'worker', '0710000000', hashPassword('demo1234'), 'Thandeka Mokoena', NOW]);
  await run(INS_PROFILE, [DEMO_WORKER_ID, 21, 'Soweto, Gauteng', 'Grade 11 · No matric', 'Hard-working and reliable. I learn fast and show up on time.', JSON.stringify(['cleaning', 'garden', 'errands']), 1, '#0E355A', 'March 2026', 'Reliable and eager to build my name.']);
  await run(INS_HIST, [uuid(), DEMO_WORKER_ID, 'Deep clean 2-bedroom flat', 'cleaning', 'Mrs. Naidoo', 'PN', null, '12 Jun 2026', 4, 220, 5, 'Thandeka was fantastic — thorough, polite and finished ahead of time. Would book again in a heartbeat.', 0, NOW]);
  await run(INS_HIST, [uuid(), DEMO_WORKER_ID, 'Weekly garden tidy-up', 'garden', 'Mr. van der Merwe', 'JV', null, '28 Jun 2026', 3, 150, 4, 'Good work and friendly. Garden looked great. A little late but messaged me to let me know.', 0, NOW]);

  for (const f of FORMAL_JOBS) {
    const at = coordsForPlace(f.location);
    await run(INS_FORMAL, [f.id, f.title, f.category, f.employer, f.ei, f.minTier, f.type, f.location, f.dist, at?.lat ?? null, at?.lng ?? null, f.salary, f.education, f.description, JSON.stringify(f.perks)]);
  }

  // One real employer account per seeded gig (j1 is the demo employer), so the
  // "Message Lerato" button actually reaches Lerato.
  const gigEmployerIds = new Map();
  for (const g of GIGS) {
    let employerId = DEMO_EMP_ID;
    if (g.phone) {
      employerId = uuid();
      await run(INS_USER, [employerId, 'employer', g.phone, hashPassword('demo1234'), g.name, NOW]);
    }
    gigEmployerIds.set(g.id, employerId);
    const at = coordsForPlace(g.location);
    await run(INS_GIG, [g.id, employerId, g.title, g.category, g.name, g.ei, g.location, g.dist, at?.lat ?? null, at?.lng ?? null, g.hours, g.rate, g.when, g.description, g.urgent, 'open', NOW]);
  }

  const talentIds = [];
  for (const t of TALENT) {
    const id = uuid();
    talentIds.push(id);
    await run(INS_USER, [id, 'worker', t.phone, hashPassword('demo1234'), t.name, NOW]);
    await run(INS_PROFILE, [id, t.age, t.location, 'No matric', t.tagline, JSON.stringify(t.skills), t.verified, t.color, 'Feb 2026', t.tagline]);
    await genHistory(id, t.jobs, t.fours, t.skills);
  }

  // Worker→employer reviews. Every star shown against a gig is averaged from
  // these rows, so the demo's employer ratings are computed, not decorative.
  const raters = [DEMO_WORKER_ID, ...talentIds];
  for (const g of GIGS) {
    await genEmployerRatings(gigEmployerIds.get(g.id), g.rating, g.ratings, raters);
  }

  // Seed a small follow graph so counts look alive:
  // the demo employer + all talent follow the demo worker; she follows the employer back.
  const INS_FOLLOW = 'INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?,?,?)';
  await run(INS_FOLLOW, [DEMO_EMP_ID, DEMO_WORKER_ID, NOW]);
  await run(INS_FOLLOW, [DEMO_WORKER_ID, DEMO_EMP_ID, NOW]);
  for (const id of talentIds) await run(INS_FOLLOW, [id, DEMO_WORKER_ID, NOW]);

  // A pending invitation for the demo worker, from the DEMO EMPLOYER's own gig —
  // so both advertised demo logins can walk the whole loop together:
  // accept → hired → worker marks done & rates → employer confirms & rates → CV grows.
  await run('INSERT INTO invitations (id, gig_id, employer_id, worker_id, message, status, created_at) VALUES (?,?,?,?,?,?,?)',
    [uuid(), 'j1', DEMO_EMP_ID, DEMO_WORKER_ID, 'Hi Thandeka — your reviews are excellent. Can you wash my two cars on Saturday?', 'pending', NOW]);

  // A welcome chat message from the demo employer (so the inbox is populated for
  // both demo logins). Sipho owns the car-wash gig, so that's what he asks about.
  await run('INSERT INTO messages (id, sender_id, recipient_id, body, created_at, read_at) VALUES (?,?,?,?,?,?)',
    [uuid(), DEMO_EMP_ID, DEMO_WORKER_ID, 'Hi Thandeka 👋 Saw your reviews — are you free Saturday morning to wash two cars?', NOW, null]);

  return {
    users: Number((await get('SELECT COUNT(*) AS c FROM users')).c),
    gigs: Number((await get('SELECT COUNT(*) AS c FROM gigs')).c),
    formal: Number((await get('SELECT COUNT(*) AS c FROM formal_jobs')).c),
    history: Number((await get('SELECT COUNT(*) AS c FROM history')).c),
  };
}

export async function seedIfEmpty() {
  await initDb();
  const row = await get('SELECT COUNT(*) AS c FROM formal_jobs');
  if (Number(row.c) === 0) return seed();
  return null;
}

// Run directly: `npm run seed`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = await seed();
  console.log('Seeded:', summary);
  process.exit(0);
}
