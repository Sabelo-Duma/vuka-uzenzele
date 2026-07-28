# 💚 Vuka Uzenzele — Web App (React + TypeScript)

> **“Vuka Uzenzele”** (isiZulu) — *Rise up and do it for yourself.*
> Connect South Africa's youth to work. **Start with no CV. Let your work write it for you — then let it open real doors.**

This is the **real application** (not the earlier static prototype in the parent folder):
a production-grade, responsive **desktop + mobile** web app built on the
**Gijima BMAD Enterprise SDLC** stack and the **Gijima IntelliSource design system**.

---

## 🚀 Run it

The app now talks to the **backend API** (`../vuka-server`). Start both:

```bash
# Terminal 1 — API
cd vuka-server && npm start          # http://localhost:3001

# Terminal 2 — web app
cd vuka-app && npm run dev           # http://localhost:5173 (proxies /api → :3001)
```

Then open the web URL. **Log in instantly** with a demo account, or register a new one:

| | Phone | Password |
|---|---|---|
| Demo worker (Thandeka) | `0710000000` | `demo1234` |
| Demo employer (Sipho) | `0720000000` | `demo1234` |

The onboarding screen also has one-tap **“Demo worker / Demo employer”** buttons.

> Data is now real and shared: post a gig as the employer, then sign in as a worker
> (different browser/incognito) and it's there. Reputation/tiers are computed server-side.

For a production build, set `VITE_API_URL` to your deployed API origin, then `npm run build`.

Other scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (hot reload) |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only (0 errors) |

**Responsive:** on a phone it's a full-screen app with a bottom tab bar; on desktop it
becomes a sidebar layout with a wider content area and two-column feeds. Resize to see it adapt.

> The service worker only runs in the **built** app. To test install/offline locally use
> `npm run build && npm run preview` (→ http://localhost:4173), not `npm run dev`.

---

## 🌍 Deploy it live (get a shareable URL)

The app is a static SPA — build once (`npm run build` → `dist/`) and host `dist/` anywhere.
Config files for the three easiest hosts are already included.

**Option A — Netlify (drag & drop, no account CLI):**
1. `npm run build`
2. Go to https://app.netlify.com/drop and drag the `dist/` folder in. Done — you get a live URL.
   (Or connect the repo; `netlify.toml` sets build = `npm run build`, publish = `dist`.)

**Option B — Vercel (CLI):**
```bash
npm i -g vercel      # once
vercel --prod        # from the vuka-app/ folder; follow the prompts
```
`vercel.json` sets the build + SPA rewrites.

**Option C — Cloudflare Pages:** connect the repo, set build command `npm run build`,
output directory `dist`.

> **GitHub Pages** (sub-path host): set `base: '/<repo-name>/'` in `vite.config.ts`, rebuild,
> then publish `dist/`. Root-domain hosts (A/B/C) need no change.

*The final publish step uses **your** hosting account — I've made everything up to that
one command/drag ready to go.*

---

## 📲 Install as an app (PWA)

Once it's served over `https` (any host above) or from the local `preview`:

- **Android / Chrome / Edge:** tap the **Install app** button (sidebar on desktop, Profile
  tab on mobile), or the browser's install icon in the address bar.
- **iPhone / Safari:** Share → **Add to Home Screen** (uses the branded icon).

It then opens full-screen like a native app, keeps working **offline** (the service worker
precaches the app shell), and shows the Vuka icon on the home screen — matching the
zero-rated, works-anywhere goal.

---

## 🧱 Tech stack (per BMAD)

- **React 18 + TypeScript (strict)** — `noUnusedLocals`, `noUnusedParameters` on.
- **Vite 5** — fast dev server + optimized production build.
- **Tailwind CSS 3** — Gijima brand tokens mapped to CSS custom properties.
- **No runtime dependencies beyond React** — bundle is **~71 KB gzipped**
  (well under the BMAD 200 KB initial-load budget). No CDNs, works offline once loaded.

## 🎨 Design system (Gijima)

Brand tokens are ported verbatim from `../IntelliSource/design-system`:
navy `#0E355A`, red `#F20023`, Proxima Nova, pill buttons, the red-dot accent, and the
full **light/dark theme** (every token has a dark override; toggle in the top bar/sidebar).
The `ThemeProvider` (light/dark/system + no-flash bootstrap) follows the IntelliSource pattern.

## ✅ Quality (BMAD rules applied)

- **Build success: 100%** — `tsc --noEmit` clean, `vite build` succeeds.
- **UI states** — empty states (`EmptyState`), not-found fallbacks on every detail screen,
  and a **route-level `ErrorBoundary`** with a recovery-oriented message.
- **Accessible** — semantic elements, `aria-*` on nav/dialogs/progress/rating, visible
  focus rings, `prefers-reduced-motion` respected, screen-reader labels on icon buttons.
- **Real error/empty messages** — "what happened + what to do", never bare codes.
- **Verified logic** — the reputation/tier engine is unit-checked (17 assertions:
  tier progression Starter→Trusted→Professional, formal-unlock counts 0→3→7,
  safety-flag gating, fresh-registrant state).

## 🗂️ Structure

```
src/
  types.ts                 Domain types
  data/catalog.ts          Categories, tiers, badges, min wage
  data/seed.ts             Demo worker, gigs, formal jobs, talent
  lib/engine.ts            Reputation + tier computation (pure, tested)
  lib/format.ts            Currency / stars
  providers/ThemeProvider  Light/dark/system theming
  store/appStore.tsx       Context + reducer + localStorage persistence
  components/              Icon, ui primitives, cards, bits, AppShell, Toast, ErrorBoundary
  features/onboarding/     Welcome → role → registration wizard
  features/worker/         Home, JobsFeed, GigDetail, FormalDetail, CvLadder, Profile, ReviewSheet
  features/employer/       Home, Talent, WorkerDetail, PostJob, Profile
```

## ✨ Features (all working, persisted to localStorage)

- **Onboarding & registration** — welcome carousel, role choice, phone + OTP (demo code
  `1234`), skills, optional ID verification → a real blank-CV **Starter** profile.
  ("Open the demo profile" jumps in as Thandeka, one gig from a tier-up.)
- **Opportunity ladder** — 4 earned tiers; formal low-education jobs (cashier, security,
  call-centre, warehouse…) unlock as you rise, with live unlock progress and a **tier-up**
  celebration.
- **Auto-generated verified CV** — reputation ring, badges, and a CV that grows with every
  completed job (real references).
- **Two-way reviews + one-tap safety flag** (a flag blocks tier progress).
- **Fair-Pay meter** — every gig and employer rate checked against SA minimum wage.
- **Employer side** — browse verified/tiered talent, worker profiles, post a job.
- **Light/dark theme**, responsive desktop + mobile.

## ⚠️ Prototype boundaries (honest scope)

This is a complete, working **front-end**. Services that require a backend or paid
providers are **mocked and clearly labelled**: SMS OTP, ID verification, and payments.
Data persists in the browser (localStorage) and resets when cleared. Formal-employer names
are fictional — a prototype must not fabricate real companies' job listings.

*Built with the Gijima BMAD Enterprise SDLC + IntelliSource design system · Prototype for
Sabelo Duma · Gijima Innovation Engine · 2026*
