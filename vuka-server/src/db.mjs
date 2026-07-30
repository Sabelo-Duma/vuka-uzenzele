import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.VUKA_DB || join(here, '..', 'data.db');

// Ensure the parent directory exists (e.g. a mounted disk at /data).
try { mkdirSync(dirname(DB_PATH), { recursive: true }); } catch { /* already exists */ }

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initSchema() {
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_history_worker ON history(worker_id);
    CREATE INDEX IF NOT EXISTS idx_apps_worker ON applications(worker_id);
    CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
    CREATE INDEX IF NOT EXISTS idx_inv_worker ON invitations(worker_id);
  `);
}

initSchema();
