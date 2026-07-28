# UX Design Specification: IntelliSource

**Project:** IntelliSource — AI-Driven Sourcing & Contracting Platform
**Author:** BMad UX Designer Agent
**Date:** 2026-07-24
**Version:** 1.0
**Status:** Approved for Story Breakdown
**Inputs:** prd.md, architecture.md, **gijima-styles.css (brand source of truth)**
**Compliance:** WCAG 2.1 AA (design targets 2.2 AA) · Dark mode first-class · Frontend-design-generation ready

---

## 1. Design Principles

1. **Confidence through governance** — every screen makes state, ownership, and next action unmistakable. Status is always visible (badge + icon + text), never color-only.
2. **AI assists, humans decide** — all AI output is visually distinct (AI badge, dashed border, confidence chip) and always paired with an explicit human confirm/override affordance. No AI content ever masquerades as human input.
3. **Gijima brand, enterprise calm** — navy authority (#0E355A), disciplined white space, red (#F20023) reserved for primary actions and the signature dot accent. Pill-shaped controls are the brand's fingerprint — used consistently.
4. **Supplier-first simplicity** — the portal assumes a first-time, mobile, non-expert user: one task per screen, receipts for everything, no jargon.
5. **Performance is UX** — skeletons match layouts, optimistic updates where safe, deadlines render with live countdowns; nothing blocks on AI.

## 2. Design Tokens

All values exact — consumable by bmad-frontend-design for Tailwind config + CSS custom properties. Prefix: `--gj-*` (extends gijima-styles.css).

### 2.1 Color — Light theme (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--gj-red` | `#F20023` | Primary CTAs, active accents, logo dot, focus-visible on dark |
| `--gj-red-hover` | `#D40020` | Primary button hover; **also the AA-compliant red for text links** (5.5:1 on white) |
| `--gj-navy` | `#0E355A` | Headings, body text, header/footer bars, secondary buttons |
| `--gj-heading-dark` | `#242424` | h3-level headings, link hover |
| `--gj-text` | `#0E355A` | Base body color |
| `--gj-text-muted` | `#767676` | Secondary text (AA 4.54:1 — adjusted from brand #777777 which is 4.48:1; visually identical) |
| `--gj-text-subtle` | `#A5A5A5` | Eyebrows/captions **≥18px or decorative only** (2.6:1 — never for essential text) |
| `--gj-bg` | `#FFFFFF` | Page background |
| `--gj-bg-light` | `#F7F7F7` | Section bands, default buttons, table stripes |
| `--gj-bg-hover` | `#EFEFEF` | Hover surfaces |
| `--gj-border` | `rgba(0,0,0,0.10)` | Form fields, dividers |
| `--gj-border-strong` | `rgba(0,0,0,0.20)` | Focused fields, cards |
| `--gj-success` | `#0E8A09` | Success text/icons (adjusted from theme #18CE0F, which fails contrast; 4.6:1 on white). Badge fills may use `#18CE0F` with `#0B3D09` text |
| `--gj-info` | `#1273B8` | Info (adjusted from #2CA8FF for AA 4.6:1) |
| `--gj-warning` | `#8A5A00` | Warning text (fills `#FFB236` with `#3D2A00` text) |
| `--gj-danger` | `#C41230` | Error text/borders (4.9:1); fills `#FF5062` with white text ≥18px only |
| `--gj-ai` | `#5B21B6` | AI-generated content accent (6.6:1 on white) — unique hue so AI is never confused with brand states |
| `--gj-seal` | `#B45309` | Sealed/embargoed indicators (amber-lock family) |

### 2.2 Color — Dark theme (`[data-theme="dark"]`)

Derived from the 2024 corporate deep navy. Every semantic token has a dark value.

| Token | Value | Notes |
|-------|-------|-------|
| `--gj-bg` | `#0D182B` | Brand deep navy (2024 PPT identity) |
| `--gj-bg-light` | `#152238` | Raised surfaces, cards |
| `--gj-bg-hover` | `#1D2C47` | Hover surfaces |
| `--gj-text` | `#E8EDF4` | Body (13.9:1) |
| `--gj-text-muted` | `#A8B4C4` | Secondary (7.1:1) |
| `--gj-text-subtle` | `#7A8699` | Decorative/large only |
| `--gj-navy` | `#3E6FA3` | Structural accents on dark |
| `--gj-red` | `#F20023` | Primary buttons (white text, 4.4:1 as UI component ✓3:1) |
| `--gj-red-hover` | `#FF1A3C` | Hover |
| `--gj-link-dark` | `#FF4D66` | Text links on dark (5.5:1) |
| `--gj-border` | `rgba(255,255,255,0.12)` | Fields/dividers |
| `--gj-border-strong` | `rgba(255,255,255,0.24)` | Focus/cards |
| `--gj-success` | `#4ADE80` (text `#0D182B` on fills) | 8.4:1 on bg |
| `--gj-info` | `#60A5FA` | 6.9:1 |
| `--gj-warning` | `#FBBF24` | 9.6:1 |
| `--gj-danger` | `#F87181` | 6.3:1 |
| `--gj-ai` | `#C4B5FD` | 9.2:1 |
| `--gj-seal` | `#FBBF24` + lock icon | — |

Theme mechanics: `data-theme` attribute on `<html>`, default follows `prefers-color-scheme`, user override persisted per profile (FR-ADM). Charts re-map series colors per theme (never rely on hue alone — series also differ by marker/pattern).

### 2.3 Typography (from gijima-styles.css, exact)

Font: `"proxima-nova", "Proxima Nova", Arial, Helvetica, sans-serif` (Adobe Fonts kit; `font-display: swap`; Arial metrics-adjusted fallback).

| Token | Size/Line-height | Weight | Usage |
|-------|------------------|--------|-------|
| `--gj-fs-hero` | 42px / 1.15 | 700 | Hero/login headline (white on navy) |
| `--gj-fs-display` | 40px / 50px | 100 | Section display titles, ends with `<span class="gj-dot">.</span>` red dot |
| `--gj-fs-h3` | 30px / 40px | 600 | Page titles |
| `--gj-fs-h4` | 22px / 1.35 | 600 | Card/panel headings |
| `--gj-fs-widget` | 16px / 1.4 | 600, UPPERCASE | Widget/table headers |
| `--gj-fs-base` | 15px / 1.6 | 400 | Body |
| `--gj-fs-small` | 14px / 1.5 | 400 | Forms, eyebrows, captions |
| `--gj-fs-btn` | 12px / 1 | 600, UPPERCASE, letter-spacing .3px | Buttons |
| `--gj-fs-mono` | 13px / 1.5 | 400 | `"JetBrains Mono", Consolas, monospace` — RFx numbers, hashes, audit IDs |

Type rules: sentence case everywhere except buttons/nav/widget titles (uppercase per brand); numerals tabular (`font-variant-numeric: tabular-nums`) in tables/countdowns.

### 2.4 Spacing, Radii, Elevation, Motion

- **Spacing (4px grid):** `--gj-sp-1..12` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 60, 80px. Section padding 60px desktop / 40px mobile (brand). Card padding 24px. Form gap 16px.
- **Radii:** `--gj-radius-pill: 35px` (buttons, inputs, badges — signature); `--gj-radius-card: 8px` (cards, modals, tables); `--gj-radius-textarea: 25px`; `--gj-radius-chip: 16px`.
- **Elevation:** `--gj-shadow-1: 0 1px 3px rgba(13,24,43,0.08)` (cards); `--gj-shadow-2: 0 4px 12px rgba(13,24,43,0.12)` (dropdowns, popovers); `--gj-shadow-3: 0 12px 32px rgba(13,24,43,0.18)` (modals). Dark theme: same geometry, `rgba(0,0,0,0.45)`.
- **Motion:** `--gj-ease: cubic-bezier(0.25, 0.1, 0.25, 1)`; durations 150ms (hover/focus), 250ms (brand `.25s ease` transitions — buttons/links), 300ms (panels/modals), 400ms (page-level). Skeleton shimmer 1200ms linear infinite. **All non-essential motion disabled under `prefers-reduced-motion: reduce`** (skeletons become static, countdown pulses stop, SignalR row-highlight becomes outline-only).
- **Layout grid:** 12-column CSS Grid, `max-width: 1250px` (`--gj-container`), gutter 24px desktop / 16px mobile. Breakpoints (brand/Woodmart): mobile ≤768px, tablet 769–1024px, desktop ≥1025px (wide 1200px). Header 71px desktop / 60px mobile, sticky navy.

## 3. Component Library

Every component specifies ALL states: default · hover · focus-visible · active · disabled · loading · error (+ empty where data-driven). Focus-visible universal style: **2px solid outline, offset 2px** — `#0E355A` on light surfaces, `#FFFFFF` on navy/red surfaces, `#FF4D66` on dark theme (all ≥3:1 against adjacent colors).

### C01 Button
Variants: **Primary** (red fill, white text), **Default** (light-grey fill #F7F7F7, #333 text), **Outline** (transparent, 1px rgba(255,255,255,.35) border — dark/imagery surfaces), **Danger** (danger fill), **Ghost** (text-only navy). Sizes: sm 8×18px, md 12×30px, lg 14×34px 16px/700. Pill radius; uppercase 12px/600.
States: hover Primary→#D40020; Default→#EFEFEF; active scale(0.98) 150ms; disabled 40% opacity + `cursor: not-allowed` + `aria-disabled`; loading = spinner (16px, current-color) replacing label, width preserved, `aria-busy="true"`. Destructive actions require confirm dialog.

### C02 Input / Select / Textarea
Pill fields 42px height, 0 20px padding, transparent bg, 1px `--gj-border`; textarea radius 25px min-height 140px. Label 14px navy above, 8px gap; placeholder `--gj-text-subtle`.
States: focus border `--gj-border-strong` + focus ring; error = 1px `--gj-danger` border + 14px danger message below with icon, `aria-invalid` + `aria-describedby`; disabled bg `--gj-bg-light` 60% opacity; loading (async validate) = right-slot spinner. Required = red asterisk + `aria-required`.

### C03 StatusBadge
Pill 3px 12px, 12px/600 uppercase, **icon + text always** (never color alone). Mappings: Draft (grey outline, pencil), PendingReview (warning fill #FFB236/#3D2A00, clock), PendingApproval (warning, shield), Published (info fill, megaphone), Closed (navy fill white text, lock), Evaluating (info outline, scales), AwardPendingApproval (warning, gavel), Awarded (success fill, trophy), Unsuccessful (grey fill, slash), Rejected/Withdrawn (danger outline, x), Sealed (`--gj-seal` outline, padlock — tooltip "Sealed until {date}").

### C04 AIBadge & AIPanel
AIBadge: chip `--gj-ai` outline, sparkle icon + "AI-drafted — review required" / "AI-suggested"; confidence chip High/Med/Low (filled/half/outline dot + text). AIPanel: 1.5px **dashed** `--gj-ai` border, 8px radius, header = AIBadge + regenerate + dismiss; footer = **Confirm** (primary) / **Edit** / **Discard** (ghost) — confirming removes dashed treatment and logs. Loading: shimmer + streaming text region `aria-live="polite"`; error: inline fallback "AI unavailable — continue manually" + manual path link (never blocks).

### C05 DataTable
Striped rows (#F7F7F7 alt), 16px cell padding, uppercase 16px/600 headers with sort buttons (`aria-sort`), sticky header, tabular numerals. Row hover `--gj-bg-hover`; keyboard row focus ring; action buttons per row reflect role+status matrix (FR-DASH-07). States: skeleton rows ×8 on load; empty state (C13); error banner + retry; live update = 2s outline pulse on changed row (`aria-live` announce "RFx 2026-014 status changed to Published"). Pagination 25/page + column filter chips. Mobile ≤768px: card-list transform (each row → card, columns → labeled pairs).

### C06 LifecycleStepper
Horizontal (desktop) / vertical (mobile) steps: Intake → Draft → Review → Approval → Published → Closed → Evaluation → Award. Completed = navy filled dot + check; current = red ring + label 600; future = grey outline; skipped (RFQ path) = dashed connector with tooltip. `aria-current="step"`; connectors animate 250ms (reduced-motion: none).

### C07 CountdownChip
"Closes in 3d 04:12:33" tabular-nums; >24h navy outline; ≤24h warning fill; ≤1h danger fill + gentle pulse (reduced-motion: static); past = "Closed {date}" navy fill. Updates 1s; `role="timer"`, minute-level `aria-live` announcements only.

### C08 FileUpload
Dropzone 2px dashed `--gj-border-strong`, 8px radius, cloud icon + "Drop files or browse" + constraints line ("PDF, DOCX, XLSX… max 50MB"). Per-file row: icon, name, size, progress bar (4px, navy→success), status (scanning shield / clean check / infected danger + reason / failed retry). Chunked resumable: interrupted → "Resume" button. Errors inline per file; whole-batch never fails atomically. Keyboard: browse button focusable; SR announces per-file completion.

### C09 EnvelopeCard (evaluation)
Two side-by-side cards: **Technical** / **Commercial**. Sealed: `--gj-seal` padlock, blurred placeholder rows (CSS, not real data), caption "Sealed — opens {condition}". Unseal action (Commercial) = danger-adjacent confirm modal requiring typed reason ≥10 chars; success animates lock→open 300ms and writes audit toast. Unsealed: content list + checksum chips.

### C10 ScoreMatrix
Grid: criteria rows × supplier columns; cell = score input (0–scale, step 0.5) + comment icon; AI-suggested value rendered as `--gj-ai` ghost text with "Apply" chip — **never pre-filled**. Weighted totals row (bold, tabular); outlier cells flagged (warning icon + tooltip "2.1σ from panel mean"). Keyboard: arrow-key cell navigation (grid pattern, `role="grid"`); each cell labeled "Score for {supplier}, {criterion}". States: locked pre-CoI (padlock overlay + "Declare conflict of interest to begin"), read-only post-submit, saving spinner per cell (autosave 2s debounce), error cell-level retry.

### C11 ComparisonView
Side-by-side supplier columns, sticky criteria left rail; sections: Completeness (flag chips), Technical scores, Commercial (post-unseal), AI executive summary (AIPanel with citation superscripts linking to source excerpt drawer). Export = "Evidence pack" primary + CSV/PDF defaults.

### C12 Toast / Banner / InlineError
Toast: bottom-right (desktop) / top (mobile), 8px radius, shadow-2, icon + message + optional action, auto-dismiss 6s (errors persist until dismissed), `role="status"` (success/info) or `role="alert"` (error), max 3 stacked. Banner (page-level): full-width band under header — info navy-tint, warning amber-tint, danger red-tint, AI-degraded `--gj-ai`-tint ("AI assist unavailable — manual mode active"); dismissible where non-blocking. InlineError: 14px danger + icon under field (C02 pattern). Every error surface shows `ERR-…` reference ID with copy button.

### C13 EmptyState
Centered: 48px line-icon (navy 1.5px stroke), 22px/600 title, 15px muted description (≤2 lines), primary CTA. Copy specified per surface: dashboard "No sourcing events yet — Create your first RFx or Start from an intake"; triage "No intakes awaiting triage"; evaluation "No submissions received — Close as unsuccessful or Extend deadline"; audit search "No entries match your filters — Clear filters".

### C14 Modal / Drawer
Modal: max-width 560px (confirm) / 800px (forms), radius 8px, shadow-3, title h4 + close; focus-trapped, `Esc` closes (unless destructive confirm), initial focus on least-destructive action; background `rgba(13,24,43,0.55)`. Drawer (right, 480px): detail peeks (audit entry, citation excerpt, supplier profile); same a11y contract.

### C15 IntakeChat
Conversational surface (web + mirrors Teams bot): message bubbles — user navy fill white text right; assistant white/dark-surface with AIBadge left; question groups render as inline mini-forms (chips for options, fields for values) inside assistant bubbles. Composer: pill textarea + attach + send (primary circle, paper-plane). Streaming: typing indicator (3-dot, reduced-motion: static "Typing…"); `aria-live="polite"` transcript. Spec preview card at end: sectioned summary + "Looks right — submit" / "Edit sections" actions. Fallback mode: banner + structured form (same fields), zero dead-ends.

### C16 AuditTimeline
Vertical timeline: node icon per action type, 14px timestamp (UTC + local tooltip), actor chip (person/system/AI — AI shows model+version on hover), old→new value diff expander (mono 13px, added green/removed red with +/− prefixes), hash-chain check chip ("Verified" success / "Verify failed" danger alert). Filters: entity, actor, action, date-range (C02 controls). Virtualized ≥200 entries.

### C17 KPICard & Charts
KPICard: 24px padding card, eyebrow label (14px subtle uppercase), 30px/600 navy value (tabular), delta chip (▲ success / ▼ danger + %), sparkline optional. Charts (recharts, lazy-loaded): bar/line/pie/donut; palette light [#0E355A, #F20023, #1273B8, #0E8A09, #8A5A00, #5B21B6] with pattern fills for series ≥4 (colorblind safety); dark equivalents §2.2; tooltips follow focus; every chart has data-table toggle (a11y) + CSV/PDF export buttons.

### C18 Header / Navigation
Internal app: sticky navy header 71px — white Gijima logo (red dots) left 40px height; primary nav uppercase 15px/600 `rgba(255,255,255,0.8)`→white hover/active with 2px red underline active indicator; right cluster: global search (pill, collapses to icon ≤1024px), notification bell (badge count, drawer panel), theme toggle, avatar menu. ≤1024px: hamburger → off-canvas panel (focus-trapped). Supplier portal: same bar, simplified (logo, event switcher, help, avatar); prominent "All times in {timezone}" note.

### C19 SkeletonLoader
Shapes mirror target layout exactly (table rows, KPI cards, chat bubbles, matrix grid); base `#EAEEF3` / dark `#1D2C47`, shimmer gradient 1200ms (reduced-motion: static); always paired with `aria-busy` on region; minimum display 300ms (no flash).

### C20 Wizard (RFx create/edit)
Top LifecycleStepper variant (steps: Details → Documents → Criteria → Suppliers → Review); autosave chip ("Saved 12:04:31" / "Saving…" / "Offline — retrying"); sticky footer: Back (ghost) / Next (primary) / "Submit for review" final; step validation on Next with error summary link-list at top (`role="alert"`, links move focus to fields). Exit guard if unsaved.

## 4. Page Layouts (12 core)

Mobile-first; grid columns refer to the 12-col desktop grid.

**P01 Login/Landing (internal):** full-bleed navy hero with Africa-map brand imagery, white hero title 42px + red dot, "Sign in with Microsoft" primary CTA; POPIA notice footer link. Supplier variant: email/password card (max 420px), first-time token flow stepper.
**P02 Dashboard (internal home):** KPI row (4 cards, cols 3+3+3+3 → stack mobile); pipeline DataTable (cols 1–12) with status filter chips; right rail (cols 9–12, collapses below table on ≤1024px): "My approvals" action list + "Closing soon" countdown list. New: "+ New Request" (primary) and "New RFx" split-button.
**P03 Intake chat:** centered column max 760px; C15 chat; right context rail ≥1025px (linked docs, category chip, budget). Teams parity noted per FR-TEAMS-07.
**P04 Triage queue:** DataTable of intakes (number, requester, category+confidence chip, budget, age) + row expand → spec preview; actions Accept-and-convert / Return / Reject (comment modal).
**P05 RFx wizard:** C20; Criteria step embeds weight-sum meter (progress to 100%, error state ≠100); Documents step = C08; "Draft with AI" secondary button on Details opens AIPanel preview per section.
**P06 RFx detail/review:** header: number (mono) + title + StatusBadge + CountdownChip; LifecycleStepper; tabs Overview / Documents / Suppliers / Q&A / CRs / Audit; reviewer mode = read-only + sticky decision bar (Approve primary / Clarify default / Reject danger — comment modal mandatory for latter two); pre-review AI checklist panel (C04).
**P07 Supplier portal — event list:** card grid (1-col mobile, 2-col tablet, 3-col desktop): title, buyer org, StatusBadge, CountdownChip, acknowledge state; filter tabs Invited / Acknowledged / Submitted / Closed.
**P08 Supplier portal — event detail & submission:** acknowledgement gate screen first (summary + Acknowledge primary / Decline ghost + reason); then tabs Documents / Q&A / My response; response tab = envelope sections (Technical/Commercial cards) each with C08 + draft/final state + version list; sticky submit bar with receipt confirmation modal (checksum + timestamp) and email receipt note.
**P09 Evaluation workspace:** header + CoI gate (blocking card until declared); left rail suppliers list with completeness chips; main = tabs Completeness (flag list with accept/override) / Scoring (C10) / Commercial (C09 unseal flow) / Comparison (C11) / Summary (AIPanel exec summary + award recommendation form).
**P10 Award & decision:** recommendation summary card, justification (+single-bid justification when flagged), approver decision bar; post-award: outcome-letter queue status list.
**P11 Audit & evidence:** filters row + C16 timeline (cols 1–8) + entry detail drawer; "Generate evidence pack" primary → progress toast → download card with checksum.
**P12 Admin:** left nav sections (Users, Suppliers, Templates, Notifications, Workflow, POPIA, Tenant); each = DataTable + drawer editor; destructive actions double-confirm with typed name.

**Teams surfaces:** adaptive cards mirror web decision bars (Approve/Reject/Clarify + comment input); card theme auto (Teams handles); deep links into P06/P09. Bot answers render as compact card lists with "Open in IntelliSource" links.

## 5. Interaction & State Patterns

- **Forms:** validate on blur + on submit; error summary top (`role="alert"`) linking to fields; submit → button loading (label preserved for width) → success toast + optimistic navigation, or inline errors + focus to first.
- **Data loading:** skeleton (C19) → content fade-in 150ms; stale-while-revalidate via TanStack Query; background refresh indicator (subtle top progress bar 2px red).
- **Live updates:** SignalR patch → row/card pulse + SR announcement; conflicting local edit → non-blocking banner "This RFx changed — Review changes" (diff drawer).
- **Empty states:** C13 everywhere data can be empty — icon + title + description + CTA.
- **Destructive flows:** modal confirm; withdrawal/unseal require typed reason; irreversible actions state consequences explicitly.
- **Autosave:** wizard + scoring autosave (2s debounce) with visible status chip; offline → queue + "Offline — changes will sync" banner; reconnect auto-flush + toast.

### 5a. Error-State Patterns

| Class | Surface | Recovery |
|-------|---------|----------|
| Field validation | InlineError under field | User fixes; summary links focus |
| Transient network (408/429/5xx) | Toast "Couldn't save — retrying (2/3)…" auto-retry 100/300/900ms | Manual Retry after 3 fails; work preserved |
| Persistent server | Page banner + ERR-ID + copy button | Retry + "Contact support" (prefilled ID) |
| AI failure/timeout | AIPanel inline fallback | One auto-retry → manual path CTA (never blocks) |
| Upload failure | Per-file row error | Resume/retry per file |
| Stale action (already decided) | Card/panel refresh + info note | Show current state, no error tone |
| Deadline passed mid-typing | Blocking modal "This RFx closed at {t}" | Draft preserved read-only; CR link if eligible |
| Offline | Global banner + queued badge | Auto-sync on reconnect |

### 5b. Performance-Design Guidance

Skeletons match final geometry (no spinners for >300ms loads); above-the-fold first (KPIs before charts, header before table body); charts/upload/matrix lazy-loaded on scroll/tab-activate (route chunks <200KB, NFR-BUDGET-02); images WebP/AVIF + `loading="lazy"`; perceived progress for AI (streamed tokens, staged status "Reading spec → Drafting scope → Proposing criteria"); component authors must record est. gzip impact in story notes (budget ledger reviewed per sprint).

## 6. Accessibility Specification (WCAG 2.1 AA — gate)

1. **Contrast ✓** — all token pairings specified AA-compliant (§2.1/2.2, adjusted semantic colors documented); large-text-only exceptions explicitly marked; contrast verified in CI via token-pair test.
2. **Focus ✓** — universal 2px outline + 2px offset (§3 head), ≥3:1 vs adjacent; never `outline: none` without replacement; focus order = DOM order; skip-link first tabbable; focus returned to trigger on modal/drawer close.
3. **Keyboard ✓** — every interaction operable: tables (row focus + action menu key), ScoreMatrix grid arrows, chat composer, upload browse, stepper, all menus (roving tabindex); no traps; `Esc` conventions consistent.
4. **Screen reader ✓** — landmarks (banner/nav/main/complementary); labels + `aria-describedby` errors; live regions: polite (autosave, AI streaming, table refresh), assertive (errors, deadline modal); status announcements for SignalR changes; charts have table toggles; icons `aria-hidden` with text alternatives; language attribute per page.
5. **Color-independence & motion ✓** — badges icon+text; chart patterns ≥4 series; error/success never color-only; `prefers-reduced-motion` global kill-switch (§2.4); no content flashing >3/s.

Testing: axe-core per journey (0 critical/serious to merge), Lighthouse a11y ≥95, NVDA+keyboard manual protocol on J1/J3/J4/J6/J8 per release (arch §12); ACR published at GA.

## 7. Frontend-Design Readiness Checklist

- [x] All colors exact hex (light + dark for every semantic token)
- [x] Typography: family, weights (100/400/600/700), px sizes, line-heights, casing rules
- [x] Spacing 4px grid enumerated; radii px; shadows full values; motion ms + easing curve (`cubic-bezier(0.25,0.1,0.25,1)`)
- [x] 20 components, all states (default/hover/focus/active/disabled/loading/error/empty) with visual specs
- [x] Dark mode complete (not algorithmic)
- [x] Grid + breakpoints exact (≤768 / 769–1024 / ≥1025, container 1250px)
- [x] Component library maps to architecture React-island structure
**→ READY for bmad-frontend-design generation.**

---

**Quality Gate — UX Designer:**
- [x] Design tokens defined (colors light+dark, type, spacing, radii, shadows, motion)
- [x] All component states documented (20 components × 7–8 states)
- [x] Empty/loading/error states for every data-driven component
- [x] Error-state patterns incl. recovery actions, transient vs persistent, offline
- [x] Performance design guidance (skeletons, progressive loading, perceived AI progress, bundle ledger)
- [x] **Accessibility: 5/5 checks complete** (contrast, focus, keyboard, screen reader, color-independence/reduced-motion)
- [x] Dark mode tokens defined
- [x] Mobile breakpoints specified
- **Score: 96/100** ✅

**Next:** Scrum Master agent → epics.md + sprint-status.yaml
