/**
 * Typed design-token constants — generated from ux-design-specification.md §2.
 * For TypeScript consumers (charts, canvas, emails) that cannot read CSS vars.
 * CSS custom properties remain the runtime source of truth for themed UI.
 */

export const colorsLight = {
  red: '#F20023',
  redHover: '#D40020',
  navy: '#0E355A',
  headingDark: '#242424',
  entityTitle: '#333333',
  text: '#0E355A',
  textMuted: '#767676',
  textSubtle: '#A5A5A5',
  link: '#D40020',
  bg: '#FFFFFF',
  bgLight: '#F7F7F7',
  bgHover: '#EFEFEF',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.20)',
  success: '#0E8A09',
  successFill: '#18CE0F',
  successOnFill: '#0B3D09',
  info: '#1273B8',
  warning: '#8A5A00',
  warningFill: '#FFB236',
  warningOnFill: '#3D2A00',
  danger: '#C41230',
  dangerFill: '#FF5062',
  ai: '#5B21B6',
  seal: '#B45309',
  focusRing: '#0E355A',
} as const;

export const colorsDark = {
  red: '#F20023',
  redHover: '#FF1A3C',
  navy: '#3E6FA3',
  headingDark: '#E8EDF4',
  entityTitle: '#E8EDF4',
  text: '#E8EDF4',
  textMuted: '#A8B4C4',
  textSubtle: '#7A8699',
  link: '#FF4D66',
  bg: '#0D182B',
  bgLight: '#152238',
  bgHover: '#1D2C47',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.24)',
  success: '#4ADE80',
  successFill: '#4ADE80',
  successOnFill: '#0D182B',
  info: '#60A5FA',
  warning: '#FBBF24',
  warningFill: '#FBBF24',
  warningOnFill: '#0D182B',
  danger: '#F87181',
  dangerFill: '#F87181',
  ai: '#C4B5FD',
  seal: '#FBBF24',
  focusRing: '#FF4D66',
} as const;

/** Chart series palettes (UX spec C17) — patterns required from series ≥4. */
export const chartPaletteLight = ['#0E355A', '#F20023', '#1273B8', '#0E8A09', '#8A5A00', '#5B21B6'] as const;
export const chartPaletteDark = ['#3E6FA3', '#FF4D66', '#60A5FA', '#4ADE80', '#FBBF24', '#C4B5FD'] as const;

export const typography = {
  family: "'proxima-nova', 'Proxima Nova', Arial, Helvetica, sans-serif",
  familyMono: "'JetBrains Mono', Consolas, monospace",
  hero: { size: 42, lineHeight: 1.15, weight: 700 },
  display: { size: 40, lineHeightPx: 50, weight: 100 },
  h3: { size: 30, lineHeightPx: 40, weight: 600 },
  h4: { size: 22, lineHeight: 1.35, weight: 600 },
  widget: { size: 16, lineHeight: 1.4, weight: 600, uppercase: true },
  base: { size: 15, lineHeight: 1.6, weight: 400 },
  small: { size: 14, lineHeight: 1.5, weight: 400 },
  btn: { size: 12, lineHeight: 1, weight: 600, uppercase: true, letterSpacing: 0.3 },
  mono: { size: 13, lineHeight: 1.5, weight: 400 },
} as const;

/** 4px grid (UX spec §2.4) */
export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 60, 80] as const;

export const radii = { pill: 35, card: 8, textarea: 25, chip: 16 } as const;

export const motion = {
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  fast: 150,
  brand: 250,
  panel: 300,
  page: 400,
  shimmer: 1200,
} as const;

export const layout = {
  container: 1250,
  gutter: 24,
  gutterMobile: 16,
  headerH: 71,
  headerHMobile: 60,
  formH: 42,
  breakpoints: { mobileMax: 768, tabletMax: 1024, desktopMin: 1025, wide: 1200 },
} as const;
