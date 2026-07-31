# Vuka Uzenzele — Production & Costing Model

**Principle:** free-first. We use best-in-class **free tiers** for everything that
can be done well for free, and only pay when a capability (a) needs real scale, or
(b) only exists as a paid service (e.g. SMS, card payments). Costs that only trigger
when money is actually moving (payment fees) are *good* costs — they scale with revenue.

_Last updated: 2026-07-31. Prices are approximate; verify with each provider._

---

## 1. What's live today — R0 / month

| Capability | Provider (free) | Notes |
|---|---|---|
| App hosting (API + PWA) | **Render** free web service | One service serves API + SPA. Sleeps when idle (cold start ~30–50s). |
| Database | **Supabase** Postgres free | 500 MB, ample for a pilot. Set `DATABASE_URL` to switch on (see DEPLOY.md). |
| Source control + CI | **GitHub** + Actions | Free for public repos. CI runs 40 backend tests on both DB drivers each push. |
| Auth (accounts) | Built-in (JWT + scrypt) | No third party; passwords hashed. |
| Reputation / CV engine | Built-in | Server-authoritative. |
| Chat, follow, invitations | Built-in (polling) | No realtime infra needed for a pilot. |

**Everything demo-able today costs nothing.**

---

## 2. Capabilities to add for production — free option first

| # | Capability | Free / pilot option | When it starts costing | Est. paid cost |
|---|---|---|---|---|
| 1 | **Always-on hosting** (no cold start) | Render free (with a free uptime pinger) | When you need instant load + more RAM/CPU | Render **Starter ~$7/mo** |
| 2 | **Managed Postgres at scale** | Supabase free (500 MB) | >500 MB, daily backups, more connections | Supabase **Pro ~$25/mo** |
| 3 | **Phone verification (OTP)** | **WhatsApp OTP** (Meta free allowance) or **email OTP** (Resend 3k/mo free) | Using **SMS** at volume | SMS ~**R0.20–0.40 each** (BulkSMS / Clickatell / Twilio ZA) |
| 4 | **WhatsApp apply / bot** | Meta **Cloud API** free monthly conversations, or **Twilio sandbox** (free) | Beyond the free conversation allowance | ~**R0.10–0.60 / conversation** (varies by type) |
| 5 | **Payments / escrow** | **Paystack** or **Yoco** — free to integrate, **test mode free** | Only on **real transactions** | ~**2.9% + R1** per transaction (no monthly fee) |
| 6 | **File storage** (ID docs, profile photos) | **Supabase Storage** free (1 GB) | >1 GB | Included in Supabase Pro / ~$0.021/GB |
| 7 | **Push notifications** | **Web Push (VAPID)** — free; or **FCM** — free | — | Free |
| 8 | **ID verification** | Manual review (free) for pilot | Automated KYC (Home Affairs / 3rd-party) | ~**R3–R15 / check** (e.g. Smile ID, iiDENTIFii) |
| 9 | **Custom domain** (`vuka.co.za`) | — | Optional, recommended for launch | ~**R100–200 / year** |
| 10 | **Error monitoring** | **Sentry** free tier | High event volume | from ~$26/mo |
| 11 | **Product analytics** | **PostHog** free / **Umami** (self-host) | High volume | usage-based |
| 12 | **Transactional email** | **Resend** (3k/mo) / **Brevo** free | Higher volume | usage-based, cheap |
| 13 | **Maps / distance** | Browser geolocation (free) + **OpenStreetMap / MapLibre** | Heavy map tile usage | usage-based |
| 14 | **Realtime chat** (instant vs 4s poll) | Polling (free, current) | Want instant delivery | **Supabase Realtime** — free tier |

---

## 3. Cost by phase

| Phase | Users / scope | Monthly cost | What's included |
|---|---|---|---|
| **Pilot** | ~0–500, one Soweto area | **≈ R0** (+ optional ~R15/mo domain) | Everything current + Supabase + WhatsApp/email OTP + payments in test mode |
| **Growth** | ~500–5,000 | **≈ $32/mo (~R600)** + usage | Render Starter ($7) + Supabase Pro ($25). SMS/WhatsApp/KYC/payment fees only as used |
| **Scale** | 5,000+ | Variable, revenue-linked | Bigger DB/compute; payment fees scale with GMV (they're a % of money earned) |

**Key point for the pitch:** Vuka can run a **real pilot for essentially R0/month**. The
first meaningful spend is **only when it's working** — real SMS to real users, or a
% fee on real Rand changing hands. That's a business that pays for itself as it grows.

---

## 4. Funding angle (from the strategy doc)

This is a youth-employment impact product, so the running costs above are also
candidates for **grant / CSI / ESG funding** (SA Jobs Fund, DFIs, corporate B-BBEE &
YES-programme budgets). The B2B compliance product (corporates sourcing + reporting
youth hires) is the intended path to it funding itself.

---

## 5. Engineering standards for production (already in place / in progress)

- ✅ **Secrets** via environment variables only — never in client code or git (JWT secret, `DATABASE_URL`).
- ✅ **CI gate** on every push — build + 40 tests on **both** DB drivers before deploy.
- ✅ **Dual-driver DB** — SQLite for dev/CI, Postgres/Supabase for production.
- ✅ **Accessibility** — WCAG-minded (focus states, labels, reduced-motion, contrast).
- ✅ **PWA** — installable, offline-capable, self-hosted fonts (no CDN).
- 🔜 **Rate limiting** on auth/message endpoints (free — in-process or Supabase).
- 🔜 **Backups** — Supabase automated backups (Pro) before real users.
- 🔜 **Real OTP + payments** — wire when a provider account is available.
