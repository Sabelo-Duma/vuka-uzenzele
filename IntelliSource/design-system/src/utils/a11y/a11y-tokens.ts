/**
 * Verified contrast-safe pairings from ux-design-specification.md §2.1/§2.2/§6.
 * Use these when composing dynamic content (charts, emails, canvas) where CSS vars don't apply.
 * AA thresholds: 4.5:1 normal text · 3:1 large text (≥18px regular / ≥14px bold) & UI components.
 */
export interface ContrastPairing {
  fg: string;
  bg: string;
  ratio: number;
  passes: 'AA-normal' | 'AA-large-only' | 'AA-ui-only';
  note?: string;
}

export const lightPairings: readonly ContrastPairing[] = [
  { fg: '#0E355A', bg: '#FFFFFF', ratio: 12.5, passes: 'AA-normal', note: 'navy body/headings on white' },
  { fg: '#767676', bg: '#FFFFFF', ratio: 4.54, passes: 'AA-normal', note: 'muted text (adjusted from #777777)' },
  { fg: '#D40020', bg: '#FFFFFF', ratio: 5.5, passes: 'AA-normal', note: 'AA red for links/text' },
  { fg: '#F20023', bg: '#FFFFFF', ratio: 4.4, passes: 'AA-large-only', note: 'brand red — large/bold text & UI only' },
  { fg: '#FFFFFF', bg: '#F20023', ratio: 4.4, passes: 'AA-large-only', note: 'button label 12px/600 uppercase = OK as UI component (3:1)' },
  { fg: '#FFFFFF', bg: '#0E355A', ratio: 12.5, passes: 'AA-normal', note: 'header/nav text on navy' },
  { fg: '#0E8A09', bg: '#FFFFFF', ratio: 4.6, passes: 'AA-normal', note: 'success text (adjusted)' },
  { fg: '#1273B8', bg: '#FFFFFF', ratio: 4.6, passes: 'AA-normal', note: 'info text (adjusted)' },
  { fg: '#C41230', bg: '#FFFFFF', ratio: 4.9, passes: 'AA-normal', note: 'danger text' },
  { fg: '#5B21B6', bg: '#FFFFFF', ratio: 6.6, passes: 'AA-normal', note: 'AI accent' },
  { fg: '#3D2A00', bg: '#FFB236', ratio: 8.1, passes: 'AA-normal', note: 'warning badge text on fill' },
  { fg: '#0B3D09', bg: '#18CE0F', ratio: 5.4, passes: 'AA-normal', note: 'success badge text on fill' },
] as const;

export const darkPairings: readonly ContrastPairing[] = [
  { fg: '#E8EDF4', bg: '#0D182B', ratio: 13.9, passes: 'AA-normal', note: 'body on deep navy' },
  { fg: '#A8B4C4', bg: '#0D182B', ratio: 7.1, passes: 'AA-normal', note: 'muted' },
  { fg: '#FF4D66', bg: '#0D182B', ratio: 5.5, passes: 'AA-normal', note: 'links on dark' },
  { fg: '#F20023', bg: '#0D182B', ratio: 4.05, passes: 'AA-large-only', note: 'brand red on dark — UI/large only' },
  { fg: '#4ADE80', bg: '#0D182B', ratio: 8.4, passes: 'AA-normal', note: 'success' },
  { fg: '#60A5FA', bg: '#0D182B', ratio: 6.9, passes: 'AA-normal', note: 'info' },
  { fg: '#FBBF24', bg: '#0D182B', ratio: 9.6, passes: 'AA-normal', note: 'warning' },
  { fg: '#F87181', bg: '#0D182B', ratio: 6.3, passes: 'AA-normal', note: 'danger' },
  { fg: '#C4B5FD', bg: '#0D182B', ratio: 9.2, passes: 'AA-normal', note: 'AI accent' },
] as const;

/** Tokens that must NEVER carry essential text at body size. */
export const decorativeOnly = ['#A5A5A5' /* light subtle 2.6:1 */, '#7A8699' /* dark subtle */] as const;
