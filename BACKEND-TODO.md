# What's left

Everything that could be built has been built, and everything that could be
solved for free has been. What remains needs **money, a person, or a decision
only you can make** — that's the whole list now.

Last worked: 19 August 2026 · `npm test` → 191 assertions passing · deployed
and verified live on Render (`store: "pg"`, distances measuring, ops queues on).

---

## 1. You have to do these (nobody else can)

| # | What | Why it's yours | Blocks |
|---|---|---|---|
| 1 | Paste a **VAPID keypair** into Render → Environment | Generate it once with `cd vuka-server && npm run vapid:keys`. It's a secret, so it can't live in git, and it can't be auto-generated per deploy — regenerating silently kills every notification permission users already granted. | All notifications (job alerts, hire notices, confirmations) |
| 2 | Fill in **`vuka-app/src/data/legal.ts`** | Three values: registered company name, the appointed Information Officer, and a privacy mailbox that someone actually reads. POPIA requires them; I can't invent them. Until they're set the privacy notice shows a visible "not final yet" banner. | Launching to the public |
| 3 | Add **`DATABASE_URL`** as a GitHub repo *secret* | Turns on the nightly backup workflow. Use Supabase's **session** pooler (port 5432 — the transaction pooler on 6543 can't run `pg_dump`). **Until this is set the workflow fails every night on purpose**, so an unconfigured backup is loud rather than silent. | Automated backups |
| 4 | Run the **restore drill once** | `gunzip -c vuka-backup-*.sql.gz \| psql $DATABASE_URL` against a throwaway database. A backup nobody has restored is a hypothesis. | Trusting the backups |
| 5 | Copy **`VUKA_ADMIN_TOKEN`** out of the Render dashboard | The blueprint sync already generated it on deploy, so the ops queues are **live** — `/api/admin/*` now answers 401 rather than 404. You just need the value to use them. | Nothing — but you can't work the queues without reading it |

Optional, also free, also yours: a **Sentry** DSN (free tier, 5k events/month) if
you want errors to survive a restart and to alert you. Without it errors are
still captured — structured log lines plus `GET /api/admin/errors`.

---

## 2. Needs money

| What | The seam | Roughly what it costs |
|---|---|---|
| **SMS gateway** | `vuka-server/src/notify.mjs` — `console` / `http` / `twilio`, env-only, no caller changes | Per message. **This is the one real blocker: sign-up needs a code that arrives before the app exists on the phone, so without a provider new registrations return 503.** Existing accounts and the demo logins keep working, and `VUKA_OTP_ECHO=1` unblocks a *closed* pilot only (insecure — codes come back in the API response) |
| **Payments** | Payout details are collected and encrypted; nothing moves money | A payments provider, plus the FSP/compliance work that comes with it |
| **ID verification at scale** | `POST /api/admin/id-verifications/:id/decide` is exactly where a Home Affairs or bureau integration drops in | Per lookup — until then, a human decides |

Everything else that used to be on this list is now free and working. Costing
model territory: this table.

---

## 3. Needs a decision, not code

The queues are **live in production right now** — decidable with the generated
`VUKA_ADMIN_TOKEN` and curl, and the person on the other end gets told the
outcome. What's missing is **who**, and **how fast**:

- **ID verifications** — `GET /api/admin/id-verifications`. The ✅ badge gates
  formal roles, so a slow queue is a blocked worker.
- **Safety reports** — `GET /api/admin/safety-reports`, resolve with a note.
  What's the SLA? Who is on call?
- **Formal applications** — `GET /api/admin/formal-applications`, with each
  worker's verified record attached. Deciding one notifies them, including a
  rejection, because silence is the worst outcome. A real employer inbox
  eventually replaces this; a person can work the queue now.
- **Zero-rating** — the copy no longer claims it (see §5). If you want the claim
  back, it needs a signed arrangement with the networks.

---

## 4. Product gaps worth a decision

- **One hire per gig** — a job is filled by one worker. Multi-worker jobs would
  need the applications lifecycle to allow several `hired` rows per gig.
- **Formal roles are curated listings** — no employer-side posting or inbox for
  them yet.
- **Languages** — the picker saves a preference; only English is translated.

---

## 5. Done since the last pass (all free)

**Distance is measured, not typed in.** `vuka-server/src/geo.mjs`. Listings carry
coordinates — from the employer's device at post time, or from a local gazetteer
of the townships and suburbs this product serves — and the browser optionally
offers the viewer's position. Where both are known the server measures a
great-circle distance and marks it `measured`, and the feed sorts nearest-first;
where they aren't, the listing's own label comes back as `listed` and the app
renders it as an estimate. No geocoding API, no maps bill, and the seeded
`distanceKm` numbers are no longer presented as facts.

**Job alerts actually arrive.** `vuka-server/src/push.mjs` implements web push
against RFC 8291 / 8188 / 8292 with Node's built-in crypto — no dependency, no
gateway, nothing per message. The encryption is verified in `npm test` against
the known-answer vector published in RFC 8291 §5, byte for byte. Posting a gig
notifies opted-in workers within `VUKA_ALERT_RADIUS_KM`; hires, work-done notices
and confirmations push too. If a gig can't be placed, nobody is notified — "a gig
near you" that isn't near you is worse than silence. Dead subscriptions are
pruned on the push service's own 404/410.

**Error monitoring, free by default.** `vuka-server/src/monitor.mjs`: every error
becomes one structured JSON line (greppable in `render logs`) plus an in-memory
ring buffer at `GET /api/admin/errors`, deduplicated with a repeat count. A 500
hands the caller a `ref` id that matches the record, so "it broke at 14:32" is
one lookup. `SENTRY_DSN` is optional and adds no dependency.

**Uptime monitoring, free.** `.github/workflows/uptime.yml` pings
`/api/health` every 10 minutes, retries before crying outage, and **fails the run
— which emails repo watchers — if the API is down or is quietly running on
ephemeral SQLite instead of Postgres**. It also keeps a free-tier instance warm.

**Automated backups, free.** `.github/workflows/backup.yml` takes a nightly
`pg_dump`, gzips it, verifies the archive, fails if it came back suspiciously
small, and keeps 90 days of artifacts. Plus `npm run backup` / `npm run restore`
for an on-the-spot snapshot that moves between SQLite and Postgres.

**POPIA privacy notice + terms of use.** `vuka-app/src/features/profile/LegalSheets.tsx`,
reachable from both profiles, from the landing footer, and at the point of
consent on sign-up. Written to claim only what the code does — ID numbers and
account numbers encrypted and shown masked, location asked for and never taken,
no money moving through Vuka — and it names the Information Regulator as the
place to complain.

**Ops triage queues.** Safety reports and formal applications are now listable,
decidable and resolvable with a note, and the worker is notified of a formal
decision either way.

**Honest data claims.** The "Zero-rated · costs no data" copy is gone from the
app, the prototype and the README. What's there instead is true: the shell is
cached, so browsing is light on data and works offline. Actual zero-rating needs
a network arrangement.

**Predictable PWA updates.** Static serving now states its cache policy instead
of relying on Express defaults: `/assets/*` is immutable for a year (Vite
fingerprints it), and `index.html` / `sw.js` / `registerSW.js` always revalidate
— so a host or CDN can't quietly serve a stale service worker and strand
installed copies on an old build.

**Coverage.** 180 assertions, up from 138: the RFC push vector, distance
measurement and ordering, gazetteer and coordinate validation, push subscription
lifecycle, and every ops-triage route.

---

## Reference: the earlier pass

Phone OTP, password reset with session invalidation, two-sided completion
(`applied → hired → worker_done → completed`), the employer's applicants screen,
real employer ratings, server-side ID verification, encrypted banking, and
`/api/config` as the single source of truth for thresholds. See git history.
