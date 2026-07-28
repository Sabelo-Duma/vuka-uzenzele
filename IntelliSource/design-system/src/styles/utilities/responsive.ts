/** Breakpoint constants + media helpers — ux-design-specification.md §2.4 (Woodmart/brand breakpoints). */
export const breakpoints = {
  /** Mobile ≤768px */
  mobileMax: 768,
  /** Tablet 769–1024px */
  tabletMin: 769,
  tabletMax: 1024,
  /** Desktop ≥1025px */
  desktopMin: 1025,
  /** Wide reference 1200px */
  wide: 1200,
} as const;

export const media = {
  mobile: `(max-width: ${breakpoints.mobileMax}px)`,
  tablet: `(min-width: ${breakpoints.tabletMin}px) and (max-width: ${breakpoints.tabletMax}px)`,
  desktop: `(min-width: ${breakpoints.desktopMin}px)`,
  wide: `(min-width: ${breakpoints.wide}px)`,
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkScheme: '(prefers-color-scheme: dark)',
} as const;

export function matches(query: keyof typeof media): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(media[query]).matches;
}
