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
| `npm test` | End-to-end API test (138 assertions, throwaway DB) — **all passing** |

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
| GET | `/api/health` | – | Health, store driver, whether payouts are configured |
| GET | `/api/config` | – | **Authoritative** min wage + tier/badge thresholds (the app adopts these at boot) |
| POST | `/api/auth/otp` | – | Send an SMS sign-up code to a phone number |
| POST | `/api/auth/otp/verify` | – | Check the code → `{verifyToken}` |
| POST | `/api/auth/register` | – | Create account. **Requires `verifyToken`** → `{token,user,cv?}` |
| POST | `/api/auth/login` | – | Sign in → `{token,user,cv?}` |
| POST | `/api/auth/password/request` | – | SMS a reset code (same reply for unknown numbers) |
| POST | `/api/auth/password/confirm` | – | Set a new password, ends older sessions, signs in |
| GET | `/api/auth/me` | Bearer | Current user (+ cv for workers) |
| GET | `/api/gigs` · `/api/gigs/:id` | – | Open gigs / one gig (with the employer's real rating) |
| POST | `/api/gigs` | employer | Post a gig |
| POST | `/api/gigs/:id/apply` | worker | Apply |
| GET | `/api/gigs/:id/applicants` | employer (owner) | Everyone who applied, with their real CV numbers |
| POST | `/api/gigs/:id/hire` | employer (owner) | Hire one applicant; the rest are told |
| POST | `/api/gigs/:id/complete` | worker (hired) | Mark work done + rate the employer |
| POST | `/api/applications/:id/confirm` | employer (owner) | Confirm + rate the worker → **writes the CV entry** |
| GET | `/api/me/jobs` | worker | My work: hired / awaiting confirmation / completed |
| GET | `/api/me/hires` | employer | Work I've hired, incl. what needs confirming |
| GET | `/api/me/applications` | worker | My applied gig ids + status |
| GET | `/api/me/cv` | worker | History + reputation/tier snapshot |
| GET | `/api/formal-jobs` | – | Tier-gated formal jobs |
| POST | `/api/formal-jobs/:id/apply` | worker | Apply with the verified CV (tier-gated server-side) |
| GET | `/api/me/formal-applications` | worker | Formal roles I've applied to |
| GET/PUT/DELETE | `/api/me/banking` | Bearer | Payout details — **encrypted at rest, returned masked** |
| GET | `/api/me/id-verification` | Bearer | My KYC status |
| POST | `/api/me/id-verification` | Bearer | Submit an SA ID number for checking (validated + encrypted) |
| GET/PUT | `/api/me/preferences` | Bearer | Account-level preferences (job alerts) |
| POST | `/api/safety/report` | Bearer | File a safety concern |
| GET | `/api/me/employer-rating` | employer | My rating, averaged from worker reviews |
| GET | `/api/talent` · `/api/talent/:id` | employer | Browse verified workers (with tier) |
| GET/POST | `/api/admin/id-verifications*` | `x-admin-token` | Ops: review pending KYC. Off unless `VUKA_ADMIN_TOKEN` is set |

Plus invitations, chat, follows and the public CV — see `src/server.mjs`.

**Reputation and tier** are computed server-side (`src/engine.mjs`) so the client can't
fake them (Starter → Trusted → Professional → Elite), and `/api/config` publishes those
thresholds so the app can't drift from them.

**Finishing a job takes both sides**: `applied → hired → worker_done → completed`. The
worker rates the employer when they mark the work done; the employer's confirmation is
what writes the verified reference onto the CV. Neither side can advance it alone, and a
worker can't award themselves a reference.

Error responses are recovery-oriented (what happened + what to do), never bare HTTP codes.

## Deploy (production)

Host on any Node platform (Render / Railway / Fly.io / a VM). Set:

- `PORT` — provided by most hosts.
- `VUKA_JWT_SECRET` — a long random string (**required** in production).
- `VUKA_ENCRYPTION_KEY` — required before workers can save payout details or submit an ID.
- `VUKA_SMS_PROVIDER` (+ its credentials) — **required for sign-up**, which needs an SMS
  code. Without a provider, set `VUKA_OTP_ECHO=1` for a closed pilot only (insecure).
- `DATABASE_URL` — Postgres (e.g. Supabase) so data survives deploys. Without it the
  server falls back to an ephemeral SQLite file.

See `.env.example` for every variable, and `../DEPLOY.md` for the full table.

## ⚠️ Scope

Real and enforced server-side: phone-verified sign-up, password reset, payout details
(encrypted), the two-sided hiring/completion loop, employer ratings, safety reports.

Still needs a provider or a person:
- **SMS** is a seam (`src/notify.mjs`) — it needs a paid gateway before real users.
- **ID verification** validates the ID number (13 digits, real date of birth, Luhn check)
  and stores it encrypted, then waits for a decision. A Home Affairs / bureau integration
  drops into the same place; until then approvals go through the ops route.
- **Payments** — payout details are stored securely, but no money moves yet.

Employer names in the seed are fictional.

*Built for the Gijima Innovation Engine · 2026*
