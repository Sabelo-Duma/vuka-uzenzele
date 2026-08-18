/* ============================================================
   Data layer — dual driver.
   - Postgres (e.g. Supabase) when DATABASE_URL is set  → persistent, production.
   - node:sqlite (local file) otherwise                → zero-setup dev & tests.
   Both expose the same async API: get / all / run / exec + initDb().
   SQL is written with `?` placeholders (translated to $1,$2… for Postgres).
   ============================================================ */

const PG_URL = process.env.DATABASE_URL || process.env.VUKA_DATABASE_URL || '';
export const driver = PG_URL ? 'pg' : 'sqlite';

let pgPool = null;
let sqlite = null;

if (driver === 'pg') {
  const pg = (await import('pg')).default;
  const localish = /localhost|127\.0\.0\.1/.test(PG_URL);
  pgPool = new pg.Pool({
    connectionString: PG_URL,
    ssl: localish ? false : { rejectUnauthorized: false }, // Supabase/managed PG need SSL
    max: 5,
  });
} else {
  const { DatabaseSync } = await import('node:sqlite');
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const { mkdirSync } = await import('node:fs');
  const here = dirname(fileURLToPath(import.meta.url));
  const DB_PATH = process.env.VUKA_DB || join(here, '..', 'data.db');
  try { mkdirSync(dirname(DB_PATH), { recursive: true }); } catch { /* exists */ }
  sqlite = new DatabaseSync(DB_PATH);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');
}

// `?` → `$1, $2, …` for Postgres.
function toPg(sql) { let i = 0; return sql.replace(/\?/g, () => `$${++i}`); }

export async function all(sql, params = []) {
  if (driver === 'pg') { const r = await pgPool.query(toPg(sql), params); return r.rows; }
  return sqlite.prepare(sql).all(...params);
}
export async function get(sql, params = []) {
  if (driver === 'pg') { const r = await pgPool.query(toPg(sql), params); return r.rows[0]; }
  return sqlite.prepare(sql).get(...params);
}
export async function run(sql, params = []) {
  if (driver === 'pg') { await pgPool.query(toPg(sql), params); return; }
  sqlite.prepare(sql).run(...params);
}
/** Multi-statement DDL / no-params execution. */
export async function exec(sql) {
  if (driver === 'pg') { await pgPool.query(sql); return; }
  sqlite.exec(sql);
}

let initialised = false;
/** Create the schema if it does not exist. Idempotent; safe to call repeatedly. */
export async function initDb() {
  if (initialised) return;
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS worker_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      location TEXT,
      education TEXT,
      bio TEXT,
      skills TEXT NOT NULL DEFAULT '[]',
      id_verified INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL DEFAULT '#0E355A',
      joined TEXT,
      tagline TEXT
    );

    CREATE TABLE IF NOT EXISTS gigs (
      id TEXT PRIMARY KEY,
      employer_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      employer_name TEXT NOT NULL,
      employer_initials TEXT NOT NULL,
      employer_rating REAL NOT NULL DEFAULT 5.0,
      location TEXT NOT NULL,
      distance_km REAL NOT NULL DEFAULT 0,
      hours REAL NOT NULL,
      pay_per_hour REAL NOT NULL,
      when_text TEXT NOT NULL,
      description TEXT NOT NULL,
      urgent INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS formal_jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      employer TEXT NOT NULL,
      employer_initials TEXT NOT NULL,
      min_tier INTEGER NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      distance_km REAL NOT NULL,
      salary TEXT NOT NULL,
      education TEXT NOT NULL,
      description TEXT NOT NULL,
      perks TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'applied',
      created_at TEXT NOT NULL,
      UNIQUE(gig_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_title TEXT NOT NULL,
      category TEXT NOT NULL,
      employer TEXT NOT NULL,
      employer_initials TEXT NOT NULL,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      pay REAL NOT NULL,
      rating INTEGER NOT NULL,
      review TEXT NOT NULL,
      safety_flag INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      gig_id TEXT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
      employer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      UNIQUE(gig_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, followee_id)
    );

    /* Payout details. account_number_enc is AES-256-GCM sealed (see crypto.mjs);
       last4 is stored in the clear purely so the UI can show a masked hint
       without ever decrypting. */
    CREATE TABLE IF NOT EXISTS banking_details (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      holder TEXT NOT NULL,
      bank TEXT NOT NULL,
      account_number_enc TEXT NOT NULL,
      account_last4 TEXT NOT NULL,
      account_type TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS formal_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES formal_jobs(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'applied',
      created_at TEXT NOT NULL,
      UNIQUE(job_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      job_alerts INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS safety_reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      about_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      gig_id TEXT,
      concern TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );

    /* One-time SMS codes proving someone holds a phone number. Codes are
       hashed; the purpose column stops a sign-up code being reused elsewhere. */
    CREATE TABLE IF NOT EXISTS phone_verifications (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      verified_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    /* KYC submissions. The ID number is encrypted (crypto.mjs) and only the
       last 4 digits are ever shown back. A row reaching status 'verified' is
       what grants the badge — the client cannot assert it. */
    CREATE TABLE IF NOT EXISTS id_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      id_number_enc TEXT NOT NULL,
      id_number_last4 TEXT NOT NULL,
      date_of_birth TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reason TEXT,
      provider TEXT,
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT
    );

    /* Worker → employer ratings. The employer rating shown on a gig is an
       average of these rows — never a hardcoded number. */
    CREATE TABLE IF NOT EXISTS employer_ratings (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gig_id TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_history_worker ON history(worker_id);
    CREATE INDEX IF NOT EXISTS idx_apps_worker ON applications(worker_id);
    CREATE INDEX IF NOT EXISTS idx_apps_gig ON applications(gig_id);
    CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
    CREATE INDEX IF NOT EXISTS idx_gigs_employer ON gigs(employer_id);
    CREATE INDEX IF NOT EXISTS idx_inv_worker ON invitations(worker_id);
    CREATE INDEX IF NOT EXISTS idx_msg_recipient ON messages(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages(sender_id, recipient_id);
    CREATE INDEX IF NOT EXISTS idx_follow_followee ON follows(followee_id);
    CREATE INDEX IF NOT EXISTS idx_formalapps_worker ON formal_applications(worker_id);
    CREATE INDEX IF NOT EXISTS idx_empratings_employer ON employer_ratings(employer_id);
    CREATE INDEX IF NOT EXISTS idx_safety_reporter ON safety_reports(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_phoneverif_phone ON phone_verifications(phone);
    CREATE INDEX IF NOT EXISTS idx_pwreset_user ON password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_idverif_user ON id_verifications(user_id);
  `);

  // Migrations for databases created by an earlier version. Additive only.
  await addColumn('history', 'employer_id', 'TEXT');
  // Unix seconds; tokens issued before this stop working (password reset).
  await addColumn('users', 'sessions_valid_from', 'INTEGER');
  // Two-sided completion: applied → hired → worker_done → completed.
  await addColumn('applications', 'hired_at', 'TEXT');
  await addColumn('applications', 'worker_rating', 'INTEGER');   // worker → employer
  await addColumn('applications', 'worker_done_at', 'TEXT');
  await addColumn('applications', 'safety_flag', 'INTEGER');
  await addColumn('applications', 'employer_rating', 'INTEGER'); // employer → worker
  await addColumn('applications', 'employer_review', 'TEXT');
  await addColumn('applications', 'completed_at', 'TEXT');

  initialised = true;
}

/**
 * Does a column already exist? (Both drivers, no error-swallowing.)
 *
 * The Postgres lookup is scoped to the connection's own schema: an unrelated
 * table of the same name in another schema must not make us skip a migration
 * and then fail every query against the missing column.
 */
async function columnExists(table, column) {
  if (driver === 'pg') {
    const r = await get(
      'SELECT 1 AS x FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?',
      [table, column]
    );
    return !!r;
  }
  const rows = await all(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

/** Add a column if it isn't there yet — safe to run on every boot. */
export async function addColumn(table, column, type) {
  if (await columnExists(table, column)) return;
  await exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
}

/** Close the database cleanly (for graceful shutdown). */
export async function closeDb() {
  try {
    if (driver === 'pg') { await pgPool?.end(); }
    else { sqlite?.close(); }
  } catch { /* already closed */ }
}
