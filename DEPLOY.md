# 🚀 Deploying Vuka Uzenzele

The app deploys as **one service**: the API (`vuka-server`) serves the built
front-end (`vuka-app`) from the same origin. One URL, no CORS, PWA-installable.

Everything here is ready — the only step that needs **your** account is the final
"deploy" click/command (I can't log in to a host on your behalf).

---

## What gets deployed

```
Dockerfile ──> builds vuka-app (React) ──> serves it from vuka-server (Node 22 + SQLite)
                                           └─ /api/*  → JSON API
                                           └─ /*      → the SPA (installable PWA)
```

- **Node 22** (built-in SQLite, no native build).
- **Data**: SQLite. On free tiers it's **ephemeral** (reseeds on each deploy) — perfect
  for a demo/pilot. For persistence, attach a disk/volume (notes in `render.yaml` / `fly.toml`).
- **Secret**: set `VUKA_JWT_SECRET` to a long random string in production (the blueprints do this for you).

---

## Step 0 — put the code on GitHub (once)

The repo is already initialised and committed. Create an empty GitHub repo, then:

```bash
cd "Vuka Uzenzele"
git remote add origin https://github.com/<you>/vuka-uzenzele.git
git branch -M main
git push -u origin main
```

---

## Option A — Render (recommended, uses `render.yaml`)

1. Push to GitHub (Step 0).
2. Go to **render.com → New → Blueprint** and pick the repo.
3. Render reads `render.yaml`, builds the Dockerfile, sets a JWT secret, and deploys.
4. You get a live URL like `https://vuka-uzenzele.onrender.com` — open it, and **Install app** on your phone.

*(Free instances sleep when idle and cold-start in ~30s. Region is set to Frankfurt — the closest Render region to SA.)*

## Option B — Fly.io (uses `fly.toml`, region = Johannesburg)

```bash
# one-time: install flyctl + sign in  (https://fly.io/docs/hands-on/install-flyctl/)
fly launch --copy-config --now         # detects Dockerfile + fly.toml
fly secrets set VUKA_JWT_SECRET=$(openssl rand -hex 32)
fly deploy
fly open
```

## Option C — any Docker host (Railway, a VM, etc.)

```bash
docker build -t vuka-uzenzele .
docker run -p 3001:3001 -e VUKA_JWT_SECRET=$(openssl rand -hex 32) vuka-uzenzele
# open http://localhost:3001
```

---

## Test the production image locally first (recommended)

**With Docker:** use Option C above and open http://localhost:3001.

**Without Docker** (quick check the single-service wiring):

```bash
cd vuka-app && npm run build          # produces vuka-app/dist
cd ../vuka-server && npm start        # detects ../vuka-app/dist and serves it
# open http://localhost:3001  → the whole app from one server
```

---

## Environment variables

| Var | Purpose | Default |
|---|---|---|
| `PORT` | Port to listen on | `3001` (hosts set this) |
| `VUKA_JWT_SECRET` | Signing secret for auth tokens | insecure dev default — **set in prod** |
| `VUKA_ENCRYPTION_KEY` | Encrypts payout details + ID numbers at rest (AES-256-GCM). Without it those endpoints 503 in production. Changing it makes stored values unreadable. | dev-only derived key — **set in prod** |
| `VUKA_SMS_PROVIDER` | `console` \| `http` \| `twilio`. Delivers sign-up codes, password-reset codes and hire notifications. Without a real provider, **nobody can sign up** in production unless `VUKA_OTP_ECHO=1`. | `console` (logs only) |
| `VUKA_SMS_URL` / `VUKA_SMS_AUTH` | Gateway endpoint + `Authorization` header for `provider=http` | unset |
| `VUKA_TWILIO_SID` / `_TOKEN` / `_FROM` | Credentials for `provider=twilio` | unset |
| `VUKA_OTP_ECHO` | **Pilot only, insecure.** `1` returns one-time codes in API responses so sign-up works with no SMS contract. | unset |
| `VUKA_ADMIN_TOKEN` | Enables every ops queue — ID verifications, safety reports, formal applications, recent errors (`x-admin-token` header). Blank = those routes don't exist. | unset |
| `VUKA_VAPID_PUBLIC_KEY` / `_PRIVATE_KEY` | **Free web push** — job alerts, hire notices, confirmations. Generate the pair once: `cd vuka-server && npm run vapid:keys`. Changing them invalidates every subscription already granted. | unset → push off |
| `VUKA_VAPID_SUBJECT` | `mailto:` contact a push service can reach you on (required by RFC 8292) | a placeholder — **set it** |
| `VUKA_ALERT_RADIUS_KM` / `VUKA_ALERT_FANOUT_MAX` | How far "a gig near you" reaches, and the most people one posting may notify | `15` / `200` |
| `SENTRY_DSN` | Optional. Errors are always captured (structured log + `/api/admin/errors`); this also ships them to Sentry's free tier so they survive a restart. | unset |
| `VUKA_ERROR_BUFFER` | Distinct recent errors kept in memory | `100` |
| `NODE_ENV` | `production` enables prod behaviour | — |
| `DATABASE_URL` | **Postgres connection string (e.g. Supabase).** When set, all data persists across deploys. Leave unset to use ephemeral SQLite (demo only). | unset → SQLite |
| `VUKA_DB` | SQLite file path (only used when `DATABASE_URL` is unset) | `./data.db` |
| `VUKA_STATIC` | Path to the built SPA | `/app/public` (Docker) |
| `VUKA_CORS_ORIGIN` | Only needed if you split the SPA onto another origin | unset (same-origin) |

---

## Demo accounts (seeded on first run)

| Role | Phone | Password |
|---|---|---|
| Worker (Thandeka) | `0710000000` | `demo1234` |
| Employer (Sipho) | `0720000000` | `demo1234` |

Or tap **Demo worker / Demo employer** on the login screen.

---

## Automated ops (free, already in the repo)

Two GitHub Actions run on a schedule, on the minutes this repo already has:

| Workflow | Cadence | What it does | Setup |
|---|---|---|---|
| `.github/workflows/uptime.yml` | every 10 min | `GET /api/health`, retries, then **fails the run** (which emails repo watchers) if the API is down *or* is running on ephemeral SQLite instead of Postgres. Also keeps a free-tier instance warm, so nobody waits on a cold start. | Nothing, unless your URL differs — then set a repo **variable** `VUKA_URL`. |
| `.github/workflows/backup.yml` | nightly 01:20 UTC | `pg_dump` → gzip → 90-day workflow artifact. Verifies the archive and fails if the dump came back suspiciously small. | Add `DATABASE_URL` as a repo **secret**, using Supabase's **session** pooler (port 5432, not 6543). |

Restore a nightly backup with:

```bash
gunzip -c vuka-backup-YYYY-MM-DD.sql.gz | psql "$DATABASE_URL"
```

For an on-the-spot snapshot before a risky change, `cd vuka-server && npm run backup`
writes a JSON snapshot that `npm run restore -- <file>` loads back — and it moves between
SQLite and Postgres, which is the migration path off a pilot database.

> **Do the restore drill once, on a throwaway database.** A backup nobody has restored is
> a hypothesis, not a backup.

---

## Before real users

- **Fill in `vuka-app/src/data/legal.ts`** — the registered company name, the Information
  Officer and a monitored privacy mailbox. Until those are set, the in-app privacy notice
  shows a visible "not final yet" banner, on purpose.
- **Set `VUKA_SMS_PROVIDER`** — sign-up needs a code that reaches a phone, so without it
  new registrations return 503. Everything else, including notifications, works without it.
- **Decide who reviews** ID verifications, safety reports and formal applications. The
  queues exist and are decidable today with the admin token; what they need is a person and
  a turnaround time.

---

## After it's live

- Open the URL on a phone → browser menu → **Install app / Add to Home Screen**.
- Installed copies update themselves: the service worker picks up each deploy and refreshes
  on next launch. There's no app store and nothing for users to re-download.
- Share the URL with the Innovation Engine reviewers.
- Post a gig as the employer, then open it as a worker on another device — real shared data.

*Still needs a paid provider: SMS delivery and payments. Formal-employer names in the seed
are fictional.*
