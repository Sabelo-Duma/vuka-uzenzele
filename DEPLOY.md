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

## After it's live

- Open the URL on a phone → browser menu → **Install app / Add to Home Screen**.
- Share the URL with the Innovation Engine reviewers.
- Post a gig as the employer, then open it as a worker on another device — real shared data.

*Prototype scope: SMS OTP, ID verification and payments remain mocked (they need paid
providers). Formal-employer names are fictional.*
