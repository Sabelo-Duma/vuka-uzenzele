# 💚 Vuka Uzenzele — Interactive Prototype

> **“Vuka Uzenzele”** (isiZulu) — *Rise up and do it for yourself.*
>
> **The pitch:** *Start with no CV. Let your work write it for you — then let it open real doors.*

A free, mobile-first platform that connects South Africa's unemployed youth to everyday
informal work **and** turns their verified track record into a **pathway to formal
employment**. No CV, matric or qualification needed to start.

Built for the **Gijima Innovation Engine** (brief from Sabelo Duma), and styled in the
official **Gijima brand** — navy `#0E355A`, red `#F20023`, the signature red-dot accent,
sourced from the Gijima IntelliSource design system in this repo.

---

## 🪜 The big idea: the Opportunity Ladder

This is what makes Vuka more than a gig app. Work isn't just income — it's **evidence**.

```
🌱 STARTER      →   🥉 TRUSTED       →   🥈 PROFESSIONAL      →   🥇 ELITE
everyone            3 jobs · 4.0★         8 jobs · 4.3★             15 jobs · 4.6★
informal gigs       + first FORMAL        cashier · security ·      permanent contracts,
                    shift work            call-centre · retail      team-lead, seen first
```

A strong, verified profile **unlocks better and more formal jobs** — cashier, security
officer, warehouse packer, call-centre agent, petrol attendant, general worker — **none
of which require matric**. Access is *earned*, not bought: only completed jobs, good
ratings and a clean safety record move you up. A single safety flag blocks progression —
so the incentive to be safe, reliable and honest is built into the economics.

> This reframes the product: from "another gig platform" to **a verified on-ramp from
> informal hustle into formal employment** — exactly the gap South Africa's youth face.

---

## ▶️ How to run it

No installation, no build step, no internet required.

**Just double-click `index.html`.**

Best viewed as a phone. On a laptop you'll see the phone mock-up next to a pitch panel;
on a real phone it fills the screen.

> Plain HTML/CSS/JavaScript — **no frameworks, no CDNs, no network calls** — deliberately,
> to honour the product's *low-data / works-offline* promise.

---

## 🚪 Onboarding & registration

On first open you land in a short, youth-friendly sign-up:

1. **Welcome carousel** (3 slides) — the pitch, the auto-CV, the ladder.
2. **Choose a role** — *I want to work* or *I need help*.
3. **Register** — mobile number → free SMS code (demo code `1234`) → your name/age/area →
   pick your skills → optional **ID verification** (earns the ✅ badge).
4. You land as a brand-new **Starter 🌱 with a blank CV** — the truest form of the pitch.

> In a hurry to demo the later stages? Tap **“Open the demo profile →”** on any onboarding
> screen to skip straight in as **Thandeka** (2 jobs, one gig from a tier-up).

## 🎬 60-second demo script (see the magic)

1. Sign up (or tap **Open the demo profile** to jump in as **Thandeka**, 21, no matric,
   Soweto — a **Starter** one gig away from her first tier-up).
2. Tap **Jobs → Formal jobs**: notice the roles are **locked** with a live "unlock at
   Trusted" progress bar. This is the hook.
3. Switch to **Gigs**, open one (e.g. *Wash 2 cars*), tap **Apply → Mark gig complete**.
4. Rate the employer (optionally tick the **safety flag**) → **Submit**.
5. 🎉 **TIER UP!** Thandeka becomes **Trusted** — and **3 formal jobs unlock**
   (petrol attendant, warehouse, general worker). A verified reference also writes itself
   into her CV.
6. Open the **Ladder** tab to see her career path, reputation ring and auto-built CV.
7. Flip to the **employer side** (top toggle → *"I need help"*) to browse verified,
   tiered youth and post a job.

Keep completing gigs and she climbs to **Professional**, unlocking cashier, security and
call-centre roles.

---

## 🧠 Why this can win (grounded in research)

| Competitor | What they do | Where Vuka Uzenzele goes further |
|---|---|---|
| **SweepSouth** | Cleaning/gardening only, vetted, ratings gate jobs | 8 gig types **+ a ladder into formal jobs**, youth-first |
| **Kandua** | Tradespeople & manual skills | No qualification needed to start; verified auto-CV |
| **Uptooyoo** | Broader informal services | Reputation becomes a **portable CV and a tier that unlocks employment** |

- Youth unemployment (15–24) sits at **~58.5%** (Stats SA, Q3 2025).
- **UNICEF** is piloting *blockchain-style verification* to unlock youth employment —
  validating verified reputation as a genuine access mechanism, not a gimmick.
- SweepSouth faced **Fairwork / unpaid-labour criticism** — so we make **fair pay a
  first-class, visible feature** (every rate checked against SA minimum wage, R30.23/hr).

## ✨ What the prototype demonstrates

- **🚪 Onboarding & registration** — welcome carousel, role choice, phone + OTP, skills
  selection and optional ID verification; produces a real, blank-CV Starter profile.
- **🪜 Opportunity ladder** — 4 earned tiers; formal, low-education jobs unlock as you rise,
  with live "how to unlock" progress and a **tier-up celebration** on completion.
- **🧾 Auto-generated verified CV** — reputation ring, badges, and a CV document that grows
  with every completed job (real references included).
- **🏢 Formal + informal in one app** — segmented *Gigs / Formal jobs* feed.
- **🛡️ Trust by design** — ID verification, two-way reviews, one-tap safety flag that
  gates tier progress.
- **⚖️ Fair Pay meter** — live minimum-wage check on every job and every employer rate.
- **📶 Low-data ethos** — no external requests; the shell is cached, so browsing and
  applying use very little data and work offline. (Actual *zero-rating* would need a
  signed arrangement with the mobile networks — the copy deliberately does not claim it.)
- **🎨 Gijima brand + youth energy** — navy/red brand, red-dot accents, pill buttons,
  plus bright tier colours, gamification and big-tap cards that stay catchy for youth.

---

## 📁 Files

| File | Purpose |
|---|---|
| `index.html` | Entry point — open this |
| `styles.css` | All styling (Gijima brand tokens, mobile-first) |
| `app.js` | The app: SPA router, all screens, tier engine, review→CV→tier loop |
| `data.js` | Mock seed data (worker, gigs, formal jobs, tiers, badges) |

Brand + design guidance drawn from `IntelliSource/_input/gijima-styles.css` and
`IntelliSource/design-system/` (Gijima's own design system) in this repo.

*Prototype only — data lives in memory and resets on refresh. No real accounts, payments
or personal data. Formal-employer names are fictional (a prototype must not fabricate real
companies' listings).*

---

*Prototype for **Sabelo Duma** · Gijima Innovation Engine · 2026*
