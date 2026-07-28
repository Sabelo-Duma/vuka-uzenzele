# Frontend Design Generation Report: IntelliSource

**Skill:** bmad-frontend-design · **Date:** 2026-07-24
**Input:** `_bmad-output/planning-artifacts/ux-design-specification.md` (+ architecture.md ADR-02, dev-config.yaml)
**Output:** `design-system/` (npm package `@intellisource/design-system`)

## Validation Results

| Gate | Result |
|------|--------|
| TypeScript (`tsc --noEmit`, strict) | ✅ 0 errors |
| Storybook build (`storybook build`) | ✅ built (preview 5.18s) |
| Components scaffolded | ✅ 20/20 (C01–C20) with all spec states (default/hover/focus/active/disabled/loading/error/empty as applicable) |
| Storybook stories | ✅ 102 stories; **20/20 components have an explicit DarkMode story** (verified against built index.json) |
| Dark mode token coverage | ✅ every color token overridden in `[data-theme="dark"]` (55 declarations in colors.css) |
| Theme provider | ✅ light/dark/system, localStorage persistence, `prefers-color-scheme` default, no-flash bootstrap script |
| A11y scaffolding | ✅ FocusTrap, SkipToContent, VisuallyHidden, useFocusReturn, useAnnounce, a11y-tokens (verified pairings), universal focus ring, reduced-motion kill-switch |
| Token drift | ✅ **ZERO** — programmatic check of light + dark tokens vs UX spec values |
| Collision audit | ✅ Greenfield — no existing components; no renames needed |

## Token Drift Table (spot-checked programmatically; full values in `src/styles/tokens/`)

| Token | UX Spec | Generated | Match |
|-------|---------|-----------|-------|
| --gj-red (light) | #F20023 | #F20023 | ✅ |
| --gj-red-hover / AA link red | #D40020 | #D40020 | ✅ |
| --gj-navy | #0E355A | #0E355A | ✅ |
| --gj-text-muted | #767676 | #767676 | ✅ |
| --gj-ai | #5B21B6 | #5B21B6 | ✅ |
| --gj-seal | #B45309 | #B45309 | ✅ |
| --gj-bg (dark) | #0D182B | #0D182B | ✅ |
| --gj-link (dark) | #FF4D66 | #FF4D66 | ✅ |
| --gj-success (dark) | #4ADE80 | #4ADE80 | ✅ |
| Radius pill / card / textarea / chip | 35 / 8 / 25 / 16px | 35 / 8 / 25 / 16px | ✅ |
| Motion ease + durations | cubic-bezier(0.25,0.1,0.25,1); 150/250/300/400/1200ms | identical | ✅ |
| Type scale | 42/40/30/22/16/15/14/12/13px | identical | ✅ |

## Deliverables

- `src/styles/tokens/` — colors (light+dark), typography (incl. responsive scale), spacing (4px grid), borders, shadows, animations + typed TS constants (`index.ts`)
- `tailwind.config.ts` — full `gj-*` theme mapping; dark mode selector strategy
- `src/providers/theme/` — ThemeProvider + ThemeToggle (+ no-flash script documented in README and .storybook/preview-head.html)
- `src/components/ui/` — 20 components + 20 story files + shared icon set
- `src/layouts/` — AppShell, Dashboard (P02), Auth (P01), Portal (P07/P08 + card grid), Evaluation (P09 + tabs), Detail (P06/P11)
- `src/styles/utilities/` — responsive, animations, focus, **contrast** (WCAG math powering CI token-pair tests)
- `src/utils/a11y/` — full a11y kit incl. verified contrast pairings (light + dark)
- `README.md` — MVC-host integration guide (ADR-02), commands, brand-fidelity deviations table

## Notes & deferred items

1. **axe story-runner** (`@storybook/addon-a11y` is wired; interactive axe runs in Storybook UI now). Automated axe across all stories runs in project CI via Playwright/test-runner — owned by EPIC-01-STORY-010; base-component axe gate re-verified in EPIC-01-STORY-012.
2. **Proxima Nova** — Adobe Fonts kit ID pending (PRD D5); Arial/Helvetica fallback active.
3. **Structure adaptation (documented):** component prop types are exported from component files (no separate `.types.ts`) and flat `ui/` layout with master barrels — suits the React-islands consumption pattern (ADR-02); all types re-exported from the package root.
4. **Brand-fidelity deviations** (3, all documented in README + UX spec §2.1): muted grey #777777→#767676, AA link red, semantic success/info text colors — each forced by WCAG AA contrast.

**Next:** bmad-develop — start EPIC-01 (Foundation); STORY-012 consumes this design system.
