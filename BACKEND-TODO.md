# Backend TODO — what's left

Everything the frontend was waiting on has been built. What remains needs a
**paid provider, a person, or an ops decision** — not more code.

## 1. Config the pilot cannot launch without

| Variable | Why it blocks | Without it |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres. Dual-driver code is in place; this is config only. | Ephemeral SQLite — real sign-ups vanish on every deploy |
| `VUKA_SMS_PROVIDER` (+ credentials) | Sign-up requires an SMS code | **Nobody can register.** Set `VUKA_OTP_ECHO=1` for a closed pilot only (insecure: codes come back in the API response) |
| `VUKA_ENCRYPTION_KEY` | Encrypts payout details + ID numbers | Those endpoints return 503 in production (the rest of the API is unaffected) |
| `VUKA_JWT_SECRET` | Session signing | Server refuses to start ✅ |

## 2. Needs a provider or a person

- **SMS gateway** — `vuka-server/src/notify.mjs` is the seam: `console` (dev),
  `http` (most SA aggregators — Clickatell, BulkSMS, Panacea), or `twilio`.
  Provider choice is env-only; no caller changes. Needs a contract + sender ID.
- **ID verification (KYC)** — submissions are validated (13 digits, real date of
  birth, Luhn check), stored **encrypted**, and land as `pending`. Approval grants
  the ✅ badge. Today that decision is made through the ops route
  (`POST /api/admin/id-verifications/:id/decide`, `x-admin-token`); a Home Affairs
  or bureau integration drops in at exactly that point.
  → **Decide: who reviews these, and how fast?** The badge gates formal roles.
- **Payments** — payout details are collected and encrypted, but no money moves.
  Needs a payments provider (and the FSP/compliance work that comes with it).
- **Safety reports** — `POST /api/safety/report` stores them and logs a warning;
  raising a safety flag when completing a job files one automatically.
  → **Decide: who is on the other end of these, and what's the SLA?**

## 3. Before real users (see the Costing Model doc)

- Rate-limiting ✅, helmet ✅, JWT-secret enforcement ✅, encrypted payout
  storage ✅, session invalidation on password reset ✅.
- Still needed: **automated DB backups**, **POPIA privacy policy + terms**,
  **error monitoring** (e.g. Sentry) and an **uptime pinger** on `/api/health`.
- Zero-rating: the app claims browsing is zero-rated — that needs an actual
  arrangement with the networks, or the copy should change.

## 4. Product gaps worth a decision (not bugs)

- **Job alerts** — the preference is stored per account (`/api/me/preferences`),
  but nothing sends them yet. Wiring them to the SMS seam (or web push) is the
  next obvious use of §2's gateway.
- **Formal-job applications** — stored server-side and tier-gated, but formal
  roles are curated listings with no employer inbox. Someone has to actually
  receive and act on these applications.
- **Distance** — `distanceKm` is seeded, not computed. Real proximity needs
  location capture + a geo query.
- **One hire per gig** — a job is filled by one worker. Multi-worker jobs would
  need the applications lifecycle to allow several `hired` rows per gig.

---

## What changed (reference)

Previously listed as missing, now built and covered by `npm test` (138 assertions):

- **Phone OTP** — real codes, hashed, rate-limited, 10-min expiry; registration
  requires a proof-of-phone token bound to the number.
- **Password reset** — SMS code + "Forgot password?" in the app. Confirming ends
  every older session, so a reset actually locks the other person out.
- **Two-sided completion** — `applied → hired → worker_done → completed`. The
  worker rates the employer when marking work done; the **employer's
  confirmation** is what writes the verified reference onto the CV. A worker can
  no longer award themselves a reference.
- **Employer sees applicants** — `GET /api/gigs/:id/applicants` plus an
  Applicants screen with Hire and Confirm & rate. Applicants no longer vanish;
  the ones not chosen are told.
- **Employer ratings** — averaged from real worker→employer reviews. A new
  employer shows "New employer", not an invented 5.0.
- **ID verification** — client self-assertion removed; the server ignores
  `idVerified` at registration. Age now comes from the ID number.
- **Banking** — server-side, AES-256-GCM at rest, only ever returned masked
  (`•••• 4321`); nothing sensitive touches the device.
- **Formal applications, job-alert preference, safety reports** — all real
  endpoints; the localStorage stubs are gone.
- **Engine drift** — `GET /api/config` publishes the authoritative min wage and
  tier/badge thresholds, and the app adopts them at boot.
