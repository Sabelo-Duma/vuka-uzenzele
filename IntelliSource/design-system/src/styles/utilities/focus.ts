/** Focus utilities — universal ring per UX spec §3: 2px solid, 2px offset, ≥3:1 vs adjacent. */

/** Applied globally via :focus-visible in styles/index.css; use these for custom surfaces. */
export const focusRingClasses =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gj-focus';

/** For controls sitting on navy/red surfaces (header, hero) — white ring. */
export const focusRingOnDarkSurfaceClasses =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

/** Roving-tabindex helper for composite widgets (menus, grids). */
export function rovingTabIndex(activeIndex: number, index: number): 0 | -1 {
  return index === activeIndex ? 0 : -1;
}
