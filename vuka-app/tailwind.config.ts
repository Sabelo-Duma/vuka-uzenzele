import type { Config } from 'tailwindcss';

/**
 * Tailwind config — Gijima brand tokens.
 * Colours map to CSS custom properties (see src/index.css) so light/dark
 * theming flows through automatically via the [data-theme] attribute.
 */
export default {
  /* On a touch screen there is no pointer to leave, so a `hover:` style latches
     on after a tap and stays there — after a long-press the sheet opens with a
     row already looking highlighted, as if something were selected. This scopes
     every hover: utility to devices that actually have hover. */
  future: { hoverOnlyWhenSupported: true },
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: 'var(--gj-red)', hover: 'var(--gj-red-hover)' },
        navy: { DEFAULT: 'var(--gj-navy)', deep: 'var(--gj-navy-deep)' },
        ink: 'var(--gj-text)',
        muted: 'var(--gj-text-muted)',
        subtle: 'var(--gj-text-subtle)',
        line: 'var(--gj-border)',
        'line-strong': 'var(--gj-border-strong)',
        surface: 'var(--gj-bg)',
        'surface-2': 'var(--gj-bg-light)',
        'surface-3': 'var(--gj-bg-hover)',
        info: 'var(--gj-info)',
        success: 'var(--gj-success)',
        warning: 'var(--gj-warning)',
        danger: 'var(--gj-danger)',
        // Tier accents
        't-starter': 'var(--t-starter)',
        't-trusted': 'var(--t-trusted)',
        't-pro': 'var(--t-pro)',
        't-elite': 'var(--t-elite)',
      },
      fontFamily: {
        sans: ['"Figtree Variable"', 'Figtree', 'proxima-nova', 'system-ui', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        pill: '35px',
        card: '18px',
        chip: '16px',
      },
      boxShadow: {
        e1: 'var(--gj-shadow-1)',
        e2: 'var(--gj-shadow-2)',
        e3: 'var(--gj-shadow-3)',
      },
      maxWidth: {
        container: '1250px',
      },
      keyframes: {
        slideup: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: { '0%': { transform: 'scale(0)' }, '70%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
        fall: { to: { transform: 'translateY(760px) rotate(560deg)', opacity: '0.9' } },
      },
      animation: {
        slideup: 'slideup .28s cubic-bezier(.2,.8,.2,1)',
        fade: 'fade .2s ease',
        pop: 'pop .5s cubic-bezier(.2,1.4,.4,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
