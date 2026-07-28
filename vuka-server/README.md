# 🔌 Vuka Uzenzele — API server

The backend for Vuka Uzenzele: real accounts, a real database, and shared multi-user
data (a gig one person posts is visible to everyone; a worker's completed jobs build a
server-authoritative reputation and tier).

## Stack

- **Node 22 + Express** — REST API.
- **Built-in SQLite** (`node:sqlite`, no native compilation) — real SQL, file-backed.
- **JWT auth** with password hashing via Node's `crypto` (scrypt). No plaintext passwords.
- **Zero heavy dependencies** — `express`, `cors`, `jsonwebtoken` only.

> Requires Node ≥ 22.5. SQLite is still behind a flag, so scripts run with
> `node --experimental-sqlite` (already wired into the npm scripts).

## Run

```bash
cd vuka-server
npm install          # already done during setup
npm run seed         # create + populate data.db (demo accounts, gigs, talent)
npm start            # http://localhost:3001
```

| Script | Does |
|---|---|
| `npm start` | Start the API on :3001 (auto-seeds if the DB is empty) |
| `npm run dev` | Same, with `--watch` auto-restart |
| `npm run seed` | Wipe + reseed the database |
| `npm test` | End-to-end API test (21 assertions, throwaway DB) — **all passing** |

## Demo accounts (seeded)

| Role | Phone | Password |
|---|---|---|
| Worker (Thandeka, 2 jobs, 1 from a tier-up) | `0710000000` | `demo1234` |
| Employer (Sipho) | `0720000000` | `demo1234` |

Four seeded talent workers (Bongani, Aphiwe, Thabo, Naledi) have generated histories so
their tiers are computed for real (Elite/Professional).

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | Health + min-wage constant |
| POST | `/api/auth/register` | – | Create worker/employer account → `{token,user,cv?}` |
| POST | `/api/auth/login` | – | Sign in → `{token,user,cv?}` |
| GET | `/api/auth/me` | Bearer | Current user (+ cv for workers) |
| GET | `/api/gigs` | – | Open gigs |
| GET | `/api/gigs/:id` | – | One gig |
| POST | `/api/gigs` | employer | Post a gig |
| POST | `/api/gigs/:id/apply` | worker | Apply |
| POST | `/api/gigs/:id/complete` | worker | Complete + review → updated `cv` |
| GET | `/api/me/applications` | worker | My applied gig ids |
| GET | `/api/me/cv` | worker | History + reputation/tier snapshot |
| GET | `/api/formal-jobs` | – | Tier-gated formal jobs |
| GET | `/api/talent` | employer | Browse verified workers (with tier) |
| GET | `/api/talent/:id` | employer | One worker profile |

Reputation and tier are computed **server-side** (`src/engine.mjs`) so the client can't
fake them — the same thresholds as the app (Starter → Trusted → Professional → Elite).

Error responses are recovery-oriented (what happened + what to do), never bare HTTP codes.

## Deploy (production)

Host on any Node platform (Render / Railway / Fly.io / a VM). Set:

- `PORT` — provided by most hosts.
- `VUKA_JWT_SECRET` — a long random string (**required** in production).
- `VUKA_DB` — a path on a persistent disk (or swap `node:sqlite` for Postgres — the schema
  in `src/db.mjs` and queries are standard SQL and port directly).

Then point the frontend at it via `VITE_API_URL` (see the frontend integration step).

## ⚠️ Scope

Auth is phone + password (real). SMS OTP, ID verification, and payments remain **mocked in
the UI** — they need paid providers and are a later integration. Employer names in the seed
are fictional.

*Built for the Gijima Innovation Engine · 2026*
