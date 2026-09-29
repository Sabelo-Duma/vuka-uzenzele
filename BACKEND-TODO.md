# Launch checklist

Everything that can be built for free is built and live at
https://vuka-uzenzele.onrender.com. What remains needs **money, a signed
provider, a person, or a decision** — that is the whole list.

Last checked: 29 September 2026. Live commit `e5158de`. Database on Supabase
Postgres (1.8% of the free 500 MB used). Nightly backup, monthly restore drill,
10-minute uptime check and CI all passing.

---

## 1. Running in test mode (built, live, waiting on a provider)

| Feature | What works today | What turns it on |
|---|---|---|
| **Payments (escrow)** | Employer secures the pay before hiring; workers see "Funds secured"; free reversal until hire, locked after; released to the worker's wallet on confirmation or auto-release; withdraw to bank. All as a ledger — no real money moves. | Sign a payment service provider (Ozow, Paystack, PayFast or Stitch). Needs a merchant account, usually a registered company. The seam is `fund` / `reverse` / `withdraw` in `vuka-server/src/escrow.mjs`. |
| **ID verification (Home Affairs)** | Card front photo, live barcode scan of the back, selfie and a random-instruction selfie; checks cross-matched; photos encrypted and deleted after review; one ID per account. A person approves. | Appoint a verification bureau (about R27 to R30 a check, including the R10 Home Affairs fee) and get a written quote. The seam is `homeAffairsCheck()` in `vuka-server/src/idcheck.mjs`. |

## 2. Yours to do (nobody else can)

| # | What | Blocks |
|---|---|---|
| 1 | Fill in **`vuka-app/src/data/legal.ts`**: registered company name, the Information Officer registered with the Information Regulator, and a privacy mailbox someone reads. Until then the privacy notice shows a "not final yet" banner. | Public launch (POPIA) |
| 2 | **Confirm SMS is delivering.** It is configured, but was last seen failing (provider credits). Sign up a new test number and check the code arrives; if not, read `GET /api/admin/errors`. | New sign-ups |
| 3 | Copy **`VUKA_ADMIN_TOKEN`** from the Render dashboard and decide **who reviews**: ID submissions, safety reports, formal applications — and how fast. | Anyone being verified, reports being handled |
| 4 | **Upgrade hosting** from the Render free tier to the Starter instance (R114 a month) before launch, so the site does not sleep after 15 minutes. | A usable first visit |
| 5 | **Test on real phones**: scan a real smart ID card (the barcode layout is not published, so this is the first real test), and a voice conversation with Msizi on an iPhone. | Confidence at launch |

## 3. Decisions

- **Platform fee.** Nothing is charged today. The cost model says it must be a percentage of the job, never a flat amount.
- **Disputes.** What happens when an employer says the work was not done, once real money is held. Needs a queue and an owner.
- **Demo accounts on the live site.** The "demo worker" and "demo employer" logins are still offered. Remove them before a public launch, or keep them for demonstrations.
- **App name.** The rename to "Rung" was decided in July and not applied.

## 4. Worth doing before growth (free or cheap)

- **An admin screen** for the review queues. Today they are worked with the admin token and `curl`, which is fine for one person and not for a team — and reviewing ID photos needs a screen.
- **Object storage** for voice notes and photos (Cloudflare R2, about R23 a month at full volume) before the 500 MB database fills.
- **A domain** of your own (about R25 a month).
- **Error alerts**: a free Sentry account, so errors survive a restart and reach someone.
- **Msizi's free allowances**: the natural voice is capped at about 100 clips a day and the AI at about 1,000 answers a day. Past that it falls back to the phone's voice and to its written answers — it does not break.

## 5. Recurring

- **Minimum wage** is re-gazetted every March. Update `MIN_WAGE_PER_HOUR` in `vuka-server/src/engine.mjs` (and the Fair-Pay meter follows) when the 2027 rate is published.
- **Translations** were not written by first-language speakers. Corrections sent from the Language screen arrive in the safety queue, tagged `[translation:<lang>]`.
