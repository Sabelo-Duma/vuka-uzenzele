/* ============================================================
   Local snapshot: `npm run backup`  /  `npm run restore <file>`

   The nightly off-site backup is the pg_dump in .github/workflows/backup.yml.
   This is the other thing you need: a snapshot you can take right now, before a
   risky migration, and put back if it goes wrong — on either driver.

   It reads through the app's own db layer, so:
   · it works against SQLite and Postgres without pg_dump installed;
   · a SQLite snapshot restores into Postgres and vice versa, which is exactly
     the move when you graduate a pilot onto a real database.

   Format is JSON, one key per table, insert order dependency-first so foreign
   keys hold. Restore requires an EMPTY table to write into and says so rather
   than merging two datasets into a mess.

   Usage:
     npm run backup                       → backups/vuka-<timestamp>.json
     npm run backup -- path/to/file.json  → an explicit destination
     npm run restore -- path/to/file.json → load it back
   ============================================================ */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { all, get, run, initDb, closeDb, driver } from '../src/db.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Every table, parents before children. A missing table is skipped rather than
 * fatal, so an older database can still be snapshotted.
 */
const TABLES = [
  'users', 'worker_profiles', 'gigs', 'formal_jobs', 'applications', 'history',
  'employer_ratings', 'formal_applications', 'user_preferences', 'safety_reports',
  'phone_verifications', 'password_resets', 'id_verifications', 'banking_details',
  'invitations', 'messages', 'follows', 'push_subscriptions',
];

const tableExists = async (t) => {
  try { await get(`SELECT 1 FROM ${t} LIMIT 1`); return true; } catch { return false; }
};

async function backup(dest) {
  await initDb();
  const data = {};
  let rows = 0;
  for (const table of TABLES) {
    if (!(await tableExists(table))) { console.log(`  – ${table} (not in this database)`); continue; }
    data[table] = await all(`SELECT * FROM ${table}`);
    rows += data[table].length;
    console.log(`  ✓ ${table}: ${data[table].length}`);
  }
  const out = { meta: { takenAt: new Date().toISOString(), driver, tables: Object.keys(data), rows }, data };
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(out, null, 2));
  console.log(`\nSnapshot of ${rows} rows written to ${dest}`);
  await closeDb();
}

async function restore(src) {
  if (!existsSync(src)) throw new Error(`No such file: ${src}`);
  const snapshot = JSON.parse(readFileSync(src, 'utf8'));
  if (!snapshot?.data) throw new Error('That file is not a Vuka snapshot.');
  await initDb();

  // Refuse to merge. Restoring on top of live rows produces a database that
  // looks fine and is silently wrong — far worse than a clear refusal.
  for (const table of Object.keys(snapshot.data)) {
    if (!(await tableExists(table))) continue;
    const existing = await get(`SELECT COUNT(*) AS n FROM ${table}`);
    if (Number(existing?.n ?? 0) > 0) {
      throw new Error(`${table} already has ${existing.n} row(s). Restore into an empty database — drop it or point VUKA_DB / DATABASE_URL somewhere fresh.`);
    }
  }

  let rows = 0;
  for (const table of TABLES) {
    const list = snapshot.data[table];
    if (!list?.length || !(await tableExists(table))) continue;
    for (const row of list) {
      const cols = Object.keys(row);
      await run(
        `INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
        cols.map((c) => row[c])
      );
    }
    rows += list.length;
    console.log(`  ✓ ${table}: ${list.length}`);
  }
  console.log(`\nRestored ${rows} rows from ${snapshot.meta?.takenAt ?? 'an unknown time'} (taken on ${snapshot.meta?.driver ?? '?'}) into ${driver}.`);
  await closeDb();
}

// `npm run backup -- out.json` puts the path in argv[2]; `npm run restore --
// in.json` puts "restore" there and the path in argv[3]. Handle both shapes.
const args = process.argv.slice(2);
const mode = args[0] === 'restore' ? 'restore' : 'backup';
const file = mode === 'restore' ? args[1] : args[0];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = file ? resolve(file) : join(here, '..', 'backups', `vuka-${stamp}.json`);

try {
  if (mode === 'restore') await restore(target);
  else await backup(target);
} catch (e) {
  console.error(`\n${e.message}`);
  await closeDb();
  process.exit(1);
}
