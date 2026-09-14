# Vuka 2.0 — the design system

Vuka means wake up. The palette is the hour before a shift starts: indigo dark,
first light on the horizon.

Everything below is enforced by two tests that run on every build. If you change
a colour, `npm run build` will tell you whether it still works.

---

## The three rules

1. **Amber is the brand and every primary action.** One per screen. If a screen
   seems to need two amber buttons, one of them is not the primary action.
2. **Teal means a third party checked something.** It is never decorative and
   never just means "good". An ID verified against Home Affairs is teal. A
   finished task is not.
3. **Vermilion means happening right now**, and nothing else. Work in progress,
   a countdown, a live indicator. Not "urgent-looking", not errors.

A fourth, quieter rule: **money is not a colour.** A rand amount earns its place
by being set in figures — monospace, tabular, heavy — so it reads as an amount
without spending the screen's one accent on it.

---

## Tokens

Defined once in [`src/index.css`](src/index.css), exposed to Tailwind in
[`tailwind.config.ts`](tailwind.config.ts). Names describe the **job**, not the
hue — the previous names (`red`, `navy`) described hues, which is how one red
ended up meaning brand, action and error at the same time.

| Group | Tokens | Use |
|---|---|---|
| Ground | `canvas` `surface` `surface-2` `surface-3` `surface-veil` | The page, then anything raised onto it. `surface-veil` is for frosted sticky headers. |
| Line | `line` `line-soft` | One weight of border. There is no "strong" variant. |
| Text | `ink` `dim` `faint` | Three steps, no more: what you read, what supports it, what only labels it. |
| Brand | `brand` `brand-solid` `brand-hover` `brand-soft` `brand-on` | `brand` is amber as text; `brand-solid` is the fill of a primary button; `brand-on` is the text that sits on it. |
| Verified | `verified` `verified-soft` | Rule 2. |
| Live | `live` `live-solid` `live-soft` | Rule 3. |
| Danger | `danger` `danger-soft` | Something went wrong or is about to. Distinct from `live`. |
| Info | `info` `info-soft` | A note, not a state. |
| Feature band | `feature` `feature-2` `on-feature` `on-feature-dim` `on-feature-accent` `on-feature-ok` | The one deep band a screen is allowed. Apply with the `.feature-band` class; never hand-write the gradient. |

**A screen gets one feature band, or none.** Fourteen screens used to paint their
own — eight different navies and two stray purples, all in the colour the
headings beside them were set in.

### Things that do not work

`bg-brand/15` and `bg-ink/[.06]` compile to **nothing**. An opacity modifier
cannot be applied to a bare `var(--token)`, Tailwind silently drops the utility,
and the element renders with no background at all. Use the `-soft` token, or
`bg-white/15` on a feature band (white is a real colour, so alpha works).

`npm run check:classes` catches this. It caught three live instances of it,
including two sticky headers that were fully transparent rather than frosted.

---

## Type

Three faces, each with one job.

| Face | Where | Class |
|---|---|---|
| **Bricolage Grotesque** | Headings, tiers, amounts | `font-display` (automatic on `h1`–`h4`) |
| **Public Sans** | Body, labels, buttons | default |
| **Roboto Mono** (subset) | Money, ratings, distances, counts, identifiers | `font-mono` |

The figures face is a 5.9 KB subset of Roboto Mono covering only digits and the
marks between them — 33 KB of Latin was being paid for out of a prepaid data
bundle to draw `R30,23`. It is declared with a matching `unicode-range`, so a
letter inside a monospace element falls through to Public Sans instead of
rendering as tofu. Regenerate with `npm run gen:figures` and keep the range in
[`src/index.css`](src/index.css) in step with `CHARS` in
[`scripts/subset-mono.py`](scripts/subset-mono.py).

### The scale

Eleven named steps, and nothing else:

```
micro 11  small 13  body 15  lead 17  title 20  head 24
display 28  hero 40  jumbo 48  giant 56  mega 64
```

`text-base` (16px) survives in exactly one place: **text fields**. Below 16px,
iOS Safari zooms the viewport on focus, the page sits wider than the screen, and
the button you were reaching for is pushed off it. It is documented as such in
the Tailwind config. Do not "tidy" it away.

---

## Headings

One `h1` per screen — its title. `SectionTitle` renders `h2`. Card titles are
`h3`. The gig detail screen used to open at `h3` and then drop to `h2` with no
`h1` at all, so navigating by heading landed nowhere sensible.

---

## Touch targets

Every button clears 44px, including `size="sm"`. `IconButton` is a 44px square.

---

## The two tests

```
npm run check:contrast   # every foreground/background pair, both themes, WCAG AA
npm run check:classes    # every design-system utility actually compiled (needs a build first)
```

Both run as part of `npm run build`.

The contrast test exists because an external audit found nine text elements
below AA in dark mode — a rating chip at 2.27:1, "Log out" at 3.04:1. None of it
was a decision; it was a light palette nobody re-checked after remapping it for
dark. So the palette is a test now. **Add a colour, add it to the test.**

---

## Naming

Three names for one screen is three screens as far as a user is concerned. The
vocabulary is fixed:

- **My Record** — the credential. Not "My CV & ladder", not "My record".
- **The Ladder** — the progression through tiers.
- **Vuka Score** — the 0–100 reputation figure. Not "Rep score".
- **Find work** / **Chats** — the same labels in the sidebar and the tab bar.

Tier medals live in `TIERS` in [`src/data/catalog.ts`](src/data/catalog.ts) and
nowhere else. The landing page used to draw its own and showed Trusted as
silver while the app showed it as bronze, so the first tier a new user reached
looked like a demotion from what the homepage had promised.

National statistics live in [`src/data/stats.ts`](src/data/stats.ts) with their
source and release date, and the page prints the source underneath them. The
minimum wage is gazetted every March — see `MIN_WAGE_PER_HOUR_FALLBACK`.
