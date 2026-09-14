import type { Config } from 'tailwindcss';

/**
 * Tailwind config — Vuka 2.0 design tokens.
 *
 * Every colour here points at a CSS custom property in src/index.css, so
 * light and dark flow through the [data-theme] attribute automatically and
 * there is exactly one place a value can be changed.
 *
 * The names describe the JOB, not the hue. `bg-brand` is the one primary
 * action on a screen; `text-verified` is something a third party checked.
 * The previous names (`red`, `navy`) described hues, which is how the same
 * red ended up meaning brand, action and error at once.
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
        /* Ground */
        canvas: 'var(--v-canvas)',
        surface: 'var(--v-surface)',
        'surface-2': 'var(--v-surface-2)',
        'surface-3': 'var(--v-surface-3)',
        'surface-veil': 'var(--v-surface-veil)',   // frosted sticky headers
        line: 'var(--v-line)',
        'line-soft': 'var(--v-line-soft)',

        /* Text — three steps and no more. */
        ink: 'var(--v-text)',
        dim: 'var(--v-text-dim)',
        faint: 'var(--v-text-faint)',

        /* Brand, and every primary action. One per screen. */
        brand: {
          DEFAULT: 'var(--v-brand)',       // brand as text
          solid: 'var(--v-brand-solid)',   // the fill of a primary button
          hover: 'var(--v-brand-hover)',
          soft: 'var(--v-brand-soft)',     // tinted background
          on: 'var(--v-on-brand)',         // text sitting on `solid`
        },

        /* Verified by someone other than us. Never decorative. */
        verified: { DEFAULT: 'var(--v-verified)', soft: 'var(--v-verified-soft)' },

        /* Happening right now. Never anything else. */
        live: { DEFAULT: 'var(--v-live)', solid: 'var(--v-live-solid)', soft: 'var(--v-live-soft)' },

        /* Something went wrong, or is about to. */
        danger: { DEFAULT: 'var(--v-danger)', soft: 'var(--v-danger-soft)' },

        /* A note, not a state. */
        info: { DEFAULT: 'var(--v-info)', soft: 'var(--v-info-soft)' },

        /* The one deep band a screen is allowed — behind a hero, a CV header
           or a tier card. A screen gets one, or none. */
        feature: 'var(--v-feature)',
        'feature-2': 'var(--v-feature-2)',
        'on-feature': 'var(--v-on-feature)',
        'on-feature-dim': 'var(--v-on-feature-dim)',
        'on-feature-accent': 'var(--v-on-feature-accent)',
        'on-feature-ok': 'var(--v-on-feature-ok)',
      },
      fontFamily: {
        /* Body. 'Vuka Figures' sits in front carrying a unicode-range that
           covers only digits and the marks around them, so figures come out
           monospaced and tabular wherever they appear and everything else
           falls through to Public Sans. */
        sans: ['"Vuka Figures"', '"Public Sans Variable"', '"Public Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        /* Headings, tiers and amounts. */
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', '"Public Sans Variable"', 'system-ui', 'sans-serif'],
        /* Explicit figures: money, ratings, identifiers, counters. */
        mono: ['"Vuka Figures"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /**
       * The type scale.
       *
       * The app had grown 23 distinct arbitrary sizes — text-[9px] through
       * text-[64px], often a single pixel apart — sitting alongside Tailwind's
       * own scale. A heading, the line under it and the card title beside it
       * could each be a different size for no reason anyone chose, which reads
       * as visual noise rather than hierarchy.
       *
       * Eleven steps, each a deliberate jump. Sizes only, no paired
       * line-height: these replace bare `text-[Npx]`, which never set one, so
       * adding one here would silently reflow every screen. Existing
       * `text-sm` / `text-base` and friends keep Tailwind's defaults, including
       * the 16px `text-base` that stops iOS zooming a focused input.
       */
      fontSize: {
        micro: '11px',
        small: '13px',
        body: '15px',
        lead: '17px',
        title: '20px',
        head: '24px',
        display: '28px',
        hero: '40px',
        jumbo: '48px',
        giant: '56px',
        mega: '64px',
      },
      borderRadius: {
        pill: '999px',
        card: '18px',
        chip: '10px',
      },
      boxShadow: {
        e1: 'var(--v-shadow-1)',
        e2: 'var(--v-shadow-2)',
        e3: 'var(--v-shadow-3)',
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
