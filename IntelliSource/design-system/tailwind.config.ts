import type { Config } from 'tailwindcss';

/**
 * Tailwind theme extension — generated from ux-design-specification.md §2.
 * Every value maps to a CSS custom property defined in src/styles/tokens/*.css
 * (single source of truth; dark mode overrides via [data-theme="dark"]).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'gj-red': 'var(--gj-red)',
        'gj-red-hover': 'var(--gj-red-hover)',
        'gj-navy': 'var(--gj-navy)',
        'gj-heading-dark': 'var(--gj-heading-dark)',
        'gj-entity-title': 'var(--gj-entity-title)',
        'gj-text': 'var(--gj-text)',
        'gj-text-muted': 'var(--gj-text-muted)',
        'gj-text-subtle': 'var(--gj-text-subtle)',
        'gj-text-on-dark': 'var(--gj-text-on-dark)',
        'gj-link': 'var(--gj-link)',
        'gj-bg': 'var(--gj-bg)',
        'gj-bg-light': 'var(--gj-bg-light)',
        'gj-bg-hover': 'var(--gj-bg-hover)',
        'gj-border': 'var(--gj-border)',
        'gj-border-strong': 'var(--gj-border-strong)',
        'gj-success': 'var(--gj-success)',
        'gj-success-fill': 'var(--gj-success-fill)',
        'gj-success-on-fill': 'var(--gj-success-on-fill)',
        'gj-info': 'var(--gj-info)',
        'gj-warning': 'var(--gj-warning)',
        'gj-warning-fill': 'var(--gj-warning-fill)',
        'gj-warning-on-fill': 'var(--gj-warning-on-fill)',
        'gj-danger': 'var(--gj-danger)',
        'gj-danger-fill': 'var(--gj-danger-fill)',
        'gj-ai': 'var(--gj-ai)',
        'gj-seal': 'var(--gj-seal)',
        'gj-focus': 'var(--gj-focus-ring)',
      },
      fontFamily: {
        gj: 'var(--gj-font)',
        'gj-mono': 'var(--gj-font-mono)',
      },
      fontSize: {
        'gj-hero': ['var(--gj-fs-hero)', { lineHeight: '1.15', fontWeight: '700' }],
        'gj-display': ['var(--gj-fs-display)', { lineHeight: '50px', fontWeight: '100' }],
        'gj-h3': ['var(--gj-fs-h3)', { lineHeight: '40px', fontWeight: '600' }],
        'gj-h4': ['var(--gj-fs-h4)', { lineHeight: '1.35', fontWeight: '600' }],
        'gj-widget': ['var(--gj-fs-widget)', { lineHeight: '1.4', fontWeight: '600' }],
        'gj-base': ['var(--gj-fs-base)', { lineHeight: '1.6', fontWeight: '400' }],
        'gj-small': ['var(--gj-fs-small)', { lineHeight: '1.5', fontWeight: '400' }],
        'gj-btn': ['var(--gj-fs-btn)', { lineHeight: '1', fontWeight: '600' }],
        'gj-mono': ['var(--gj-fs-mono)', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        'gj-1': 'var(--gj-sp-1)',
        'gj-2': 'var(--gj-sp-2)',
        'gj-3': 'var(--gj-sp-3)',
        'gj-4': 'var(--gj-sp-4)',
        'gj-5': 'var(--gj-sp-5)',
        'gj-6': 'var(--gj-sp-6)',
        'gj-7': 'var(--gj-sp-7)',
        'gj-8': 'var(--gj-sp-8)',
        'gj-9': 'var(--gj-sp-9)',
        'gj-10': 'var(--gj-sp-10)',
        'gj-11': 'var(--gj-sp-11)',
        'gj-12': 'var(--gj-sp-12)',
      },
      borderRadius: {
        pill: 'var(--gj-radius-pill)',
        card: 'var(--gj-radius-card)',
        textarea: 'var(--gj-radius-textarea)',
        chip: 'var(--gj-radius-chip)',
      },
      boxShadow: {
        'gj-1': 'var(--gj-shadow-1)',
        'gj-2': 'var(--gj-shadow-2)',
        'gj-3': 'var(--gj-shadow-3)',
      },
      transitionTimingFunction: {
        gj: 'var(--gj-ease)',
      },
      transitionDuration: {
        'gj-fast': 'var(--gj-dur-fast)',
        'gj-brand': 'var(--gj-dur-brand)',
        'gj-panel': 'var(--gj-dur-panel)',
        'gj-page': 'var(--gj-dur-page)',
      },
      maxWidth: {
        'gj-container': 'var(--gj-container)',
      },
      height: {
        'gj-header': 'var(--gj-header-h)',
        'gj-header-mobile': 'var(--gj-header-h-mobile)',
        'gj-form': 'var(--gj-form-h)',
      },
      screens: {
        // UX spec §2.4: mobile ≤768 · tablet 769–1024 · desktop ≥1025 · wide 1200
        tablet: '769px',
        desktop: '1025px',
        wide: '1200px',
      },
      keyframes: {
        'gj-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gj-pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
      animation: {
        'gj-shimmer': 'gj-shimmer 1200ms linear infinite',
        'gj-pulse-soft': 'gj-pulse-soft 1200ms var(--gj-ease) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
