# Backend TODO — what the frontend is waiting for

The frontend is built and shippable. Everything below is server-side work.
Where the frontend currently uses a **device-local stub** (localStorage), the swap
is a single, clean seam: replace the body of the noted lib functions with an API
call and every caller stays unchanged.

## 1. Persistence (unblocks everything)
- Set **`DATABASE_URL`** (Supabase Postgres) on the host. Without it the server
  uses an ephemeral SQLite file that resets on every deploy — real sign-ups
  won't survive. Dual-driver code is already in place; this is config only.

## 2. Endpoints to add (frontend already calls a local stub)

| Feature | Client seam (swap here) | Endpoint(s) to build |
|---|---|---|
| **Banking / payouts** | `src/lib/banking.ts` → `getBanking / saveBanking / clearBanking` | `GET / PUT / DELETE /api/me/banking` (store **encrypted**; never return full account number — return masked) |
| **Formal-job applications** | `src/lib/appliedFormal.ts` → `isFormalApplied / markFormalApplied` | `POST /api/formal-jobs/:id/apply`, `GET /api/me/formal-applications` (+ an `applications`-style table for formal roles) |
| **Job-alert preference** | `src/lib/prefs.ts` (`jobAlerts`) | `PUT /api/me/preferences` — only needed once alerts become real (push/SMS). `dataSaver` + language can stay device-local. |

## 3. Features with no endpoint yet (also need UI wiring)
- **Phone OTP** — `Onboarding.tsx` OTP step is faked ("demo code 1 2 3 4"). Add
  `POST /api/auth/otp` (send) + `POST /api/auth/otp/verify`. Registration must
  require a verified phone.
- **Password reset** — no endpoint and no UI entry. Add request + confirm routes
  and a "Forgot password?" link on the login screen.
- **ID verification (KYC)** — client currently self-asserts `idVerified`; the
  server trusts the flag. Needs a real verification step before the badge is granted.
- **Safety report** — `SettingsSheets.tsx` (SafetySheet) collects a concern and
  only toasts. Add `POST /api/safety/report`.
- **Employer rating** — currently hardcoded `5.0` (`server.mjs`). Aggregate real
  worker→employer ratings and compute it.
- **Completion flow** — pilot lets the worker self-mark complete + self-rate
  (`GigDetail` → `ReviewSheet`). Real flow needs **employer confirmation** and a
  two-sided rating before pay/CV update.
- **Employer sees gig applicants** — a worker who taps *Apply* is recorded
  (`/me/applications`) but there is **no employer-side view of applicants**, so an
  applied worker currently vanishes. Only invite→accept is a complete loop today.
  Add `GET /api/gigs/:id/applicants` + an employer "Applicants" screen.

## 4. Consolidate to avoid drift (do when touching the engine)
- Reputation/tier logic is computed **both** client-side (`src/lib/engine.ts`,
  `src/data/catalog.ts`) and server-side (`vuka-server/src/engine.mjs`). Values
  are identical today, but if thresholds/formula change on one side only, the
  live tier-up animation and lock/unlock states will disagree with the server.
  The server is authoritative — keep the two in lockstep, or have the client read
  tier/badge config + `minWage` from the server (`/api/health` already returns
  `minWage`; the client still uses its own constant).

## 5. Before real users (see the Costing Model doc)
- Rate-limiting ✅ (done), helmet ✅, JWT-secret enforcement ✅ (done).
- Still needed: automated DB backups, POPIA privacy/terms, encrypted payout
  storage (see §2 banking), error monitoring + uptime pinger.
