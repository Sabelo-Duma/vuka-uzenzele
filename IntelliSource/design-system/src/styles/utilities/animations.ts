/** Motion tokens + helpers — ux-design-specification.md §2.4. All motion must respect reduced-motion. */
export const easing = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

export const durations = {
  fast: 150,   // hover/focus
  brand: 250,  // buttons/links (brand .25s ease)
  panel: 300,  // panels/modals
  page: 400,   // page-level
  shimmer: 1200,
} as const;

export function transition(props: string[], duration: keyof typeof durations = 'brand'): string {
  return props.map((p) => `${p} ${durations[duration]}ms ${easing}`).join(', ');
}

/** Tailwind class fragments for common motion patterns. */
export const motionClasses = {
  hover: 'transition-colors duration-gj-brand ease-gj',
  panel: 'transition-all duration-gj-panel ease-gj',
  pressScale: 'active:scale-[0.98] motion-reduce:active:scale-100',
  pulse: 'animate-gj-pulse-soft motion-reduce:animate-none',
  shimmer: 'animate-gj-shimmer motion-reduce:animate-none',
} as const;
