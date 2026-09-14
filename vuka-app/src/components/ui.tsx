import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { money } from '../lib/format';
import { Icon, type IconName } from './Icon';

/* ---------------- useCountUp ----------------
   Animates a number from `from` to `target` (easeOutCubic). Jumps straight to
   the target when the user prefers reduced motion. */
export function useCountUp(target: number, from = 0, duration = 950): number {
  const [val, setVal] = useState(from);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, from, duration]);
  return val;
}

/* ---------------- Button ----------------
   Five variants, and only one of them is amber. A screen gets one primary
   action; everything else is ghost or subtle. If a screen seems to need two
   amber buttons, one of them is not actually the primary action.

   Every size clears 44px so it can be hit with a thumb. */
type Variant = 'primary' | 'solid' | 'ghost' | 'subtle' | 'danger';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
  icon?: IconName;
}
const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand-solid text-brand-on hover:bg-brand-hover shadow-e1',
  solid: 'bg-ink text-canvas hover:opacity-90',
  ghost: 'bg-transparent text-ink border border-line hover:bg-surface-2',
  subtle: 'bg-surface-2 text-ink border border-line-soft hover:bg-surface-3',
  danger: 'bg-transparent text-danger border border-danger hover:bg-danger-soft',
};
export function Button({ variant = 'primary', size = 'md', block, icon, className = '', children, ...rest }: BtnProps) {
  const sz = size === 'sm'
    ? 'min-h-[44px] text-small px-4 py-2.5'
    : 'min-h-[48px] text-body px-5 py-3';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-bold transition
        active:scale-[.975] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANT[variant]} ${sz} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

/* ---------------- IconButton ----------------
   44px square: the smallest target a thumb reliably hits. */
export function IconButton({ name, label, size = 20, className = '', ...rest }: { name: IconName; label: string; size?: number } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      className={`grid place-items-center rounded-chip border border-line bg-surface text-ink
        w-11 h-11 hover:bg-surface-2 transition active:scale-95 ${className}`}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({ className = '', children, ...rest }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-surface border border-line rounded-card shadow-e1 ${className}`} {...rest}>
      {children}
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

/* ---------------- Chip ----------------
   Tones are the palette's rules, spelled out:
     verified — a third party checked this
     live     — this is happening right now
     danger   — this is wrong and has to change
     brand    — this needs your attention
     info     — a note
     solid    — a category, not a state
     neutral  — a fact with no status at all (a date, a count) */
type ChipTone = 'neutral' | 'brand' | 'verified' | 'live' | 'danger' | 'info' | 'solid';
const CHIP: Record<ChipTone, string> = {
  neutral: 'bg-surface-2 text-dim border border-line-soft',
  brand: 'bg-brand-soft text-brand',
  verified: 'bg-verified-soft text-verified',
  live: 'bg-live-soft text-live',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  solid: 'bg-ink text-canvas',
};
export function Chip({ tone = 'neutral', icon, children }: { tone?: ChipTone; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-micro font-bold ${CHIP[tone]}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/* ---------------- LiveDot ----------------
   Vermilion, and the only thing allowed to use it: something in progress
   right now. */
export function LiveDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-micro font-bold uppercase tracking-wide text-live">
      <span className="pulse-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/* ---------------- Avatar ----------------
   A neutral tile. The initials identify the person; colour was doing no work
   here beyond adding an eighth hue to a screen that already had enough. */
export function Avatar({ initials, size = 'md', verified, tier }: { initials: string; size?: 'sm' | 'md' | 'lg'; verified?: boolean; tier?: string }) {
  const dim = size === 'lg' ? 'w-[76px] h-[76px] text-head rounded-[22px]'
    : size === 'sm' ? 'w-9 h-9 text-small rounded-chip'
    : 'w-11 h-11 text-body rounded-[14px]';
  return (
    <div className={`relative grid place-items-center font-display font-extrabold bg-surface-3 text-ink border border-line shrink-0 ${dim}`} aria-hidden="true">
      {initials}
      {verified && (
        <span className="absolute -right-1 -bottom-1 grid place-items-center w-5 h-5 rounded-full bg-verified text-canvas border-2 border-surface">
          <Icon name="shield" size={11} />
        </span>
      )}
      {tier && (
        <span className="absolute -right-1.5 -top-1.5 grid place-items-center w-[22px] h-[22px] rounded-full bg-surface border border-line text-small shadow-e1">{tier}</span>
      )}
    </div>
  );
}

/* ---------------- Tile ----------------
   The square that carries a category emoji. It used to be tinted with a
   per-category colour — eight more hues on screens that already had a brand,
   a verified green and an urgent red on them — and the emoji was carrying the
   identity anyway. Neutral tile, coloured emoji, one less thing to read. */
export function Tile({ emoji, size = 'md' }: { emoji: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-[58px] h-[58px] rounded-[18px] text-head'
    : size === 'sm' ? 'w-10 h-10 rounded-chip text-title'
    : 'w-11 h-11 rounded-chip text-head';
  return <span className={`grid place-items-center bg-surface-3 border border-line shrink-0 ${dim}`} aria-hidden="true">{emoji}</span>;
}

/* ---------------- Ring (circular progress) ----------------
   One colour. The ring used to be painted in a per-tier gradient, which made
   the same number look like a different measurement at each tier. */
export function Ring({ pct, size = 132, stroke = 11, children }: { pct: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--v-surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--v-brand-solid)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">{children}</div>
    </div>
  );
}

/* ---------------- ProgressBar ---------------- */
export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="h-2 rounded-pill overflow-hidden bg-surface-3"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-pill bg-brand-solid transition-[width] duration-500" style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* ---------------- Money ----------------
   Amounts are set in figures — monospace, tabular, heavy — not in a colour.
   A rand amount is usually the reason a card is being read, and typography
   can carry that without spending the screen's one accent on it. */
export function Money({ value, className = '' }: { value: number; className?: string }) {
  return <b className={`font-mono tnum font-bold text-ink ${className}`}>{money(value)}</b>;
}

/* ---------------- TierBadge ----------------
   The medal already carries the tier. It does not also need a fill colour
   that competes with the one action on the screen. */
export function TierBadge({ icon, name }: { icon: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-surface-3 border border-line px-2 py-0.5 text-micro font-extrabold uppercase tracking-wide text-ink">
      <span aria-hidden="true">{icon}</span>{name}
    </span>
  );
}

/* ---------------- SectionTitle ---------------- */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-3">
      <h2 className="font-display text-lead font-extrabold text-ink m-0 tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

/* ---------------- TextAction ----------------
   The "See all →" link beside a section heading, and anything shaped like it.
   Written as bare text it measured 21px tall — half the 44px a thumb needs —
   so the padding here is negative-margined back out, buying the target
   without changing how the row looks. */
export function TextAction({ onClick, children, tone = 'brand' }: { onClick: () => void; children: ReactNode; tone?: 'brand' | 'ink' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 min-h-[44px] px-2 -mx-2 -my-2 rounded-chip text-small font-bold transition
        hover:bg-surface-2 ${tone === 'brand' ? 'text-brand' : 'text-ink'}`}
    >
      {children}
    </button>
  );
}

/* ---------------- Segmented ----------------
   A real tab list: `aria-selected` is the attribute the tab role defines, and
   each button owns the panel it names. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div className="flex bg-surface-2 rounded-pill p-1 border border-line" role="tablist" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-pill py-2.5 min-h-[44px] text-small font-bold transition
              ${active ? 'bg-brand-solid text-brand-on' : 'text-dim hover:text-ink'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Stars (display) ----------------
   Draws the rating it was given. Five full glyphs used to be printed for 4.7
   and four for 4.5, so the picture read up to half a point away from the
   number beside it — on the one measurement this whole product sells. */
export function Stars({ rating, size = 14, className = '' }: { rating: number; size?: number; className?: string }) {
  const pct = Math.max(0, Math.min(5, rating)) / 5 * 100;
  return (
    <span className={`relative inline-flex align-middle ${className}`} role="img" aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="inline-flex text-line" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={size} />)}
      </span>
      <span className="absolute inset-0 inline-flex overflow-hidden text-brand" style={{ width: `${pct}%` }} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={size} className="shrink-0" />)}
      </span>
    </span>
  );
}

/* ---------------- StarRating (input) ----------------
   The single rating control. There were two of these, and only one of them
   had accessible names, so a screen-reader user could rate an employer but
   not a worker.

   It opens unset. Both dialogs used to open on five stars with the fastest
   way out being to accept it, which quietly turned every rating nobody
   thought about into the highest one. */
export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-center gap-2 my-2" role="radiogroup" aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className={`grid place-items-center w-12 h-12 rounded-chip transition active:scale-90
            ${n <= value ? 'text-brand' : 'text-line hover:text-dim'}`}
        >
          <Icon name="star" size={32} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint: string; action?: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <div className="text-hero mb-2" aria-hidden="true">{icon}</div>
      <h3 className="font-display text-ink font-extrabold text-lead m-0">{title}</h3>
      <p className="text-dim text-small leading-relaxed mt-1.5 mb-0">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

/* ---------------- Sheet (bottom modal) ----------------
   Escape closes it, focus moves into it, Tab stays inside it, and focus goes
   back to whatever opened it. A dialog that keeps focus behind itself is one
   a keyboard or screen-reader user cannot get out of. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  const focusables = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null),
    [],
  );

  useEffect(() => {
    openerRef.current = document.activeElement;
    const first = focusables()[0];
    (first ?? panelRef.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const [first, last] = [items[0], items[items.length - 1]];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose, focusables]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-[2px] animate-fade" style={{ background: 'var(--v-scrim)' }} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full sm:max-w-md bg-surface border border-line rounded-t-[26px] sm:rounded-card
          pb-[max(22px,env(safe-area-inset-bottom))] animate-slideup max-h-[92%] overflow-y-auto scroll-area outline-none shadow-e3"
      >
        {/* A close button, always in reach.
            There used to be none: the only ways out were Escape, which a phone
            has no key for, and tapping the backdrop — which on a sheet that is
            92% of the screen is an 8% strip most thumbs never find. The privacy
            notice, the longest sheet in the app, was effectively a trap. It is
            sticky so it stays reachable however far you scroll. */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-surface px-5 pt-4 pb-2">
          <div className="w-11 h-1.5 rounded-pill bg-line absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" aria-hidden="true" />
          <span className="sr-only">{title}</span>
          <span aria-hidden="true" className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="grid place-items-center w-11 h-11 -mr-2 -mt-1 shrink-0 rounded-chip text-dim hover:bg-surface-2 hover:text-ink transition active:scale-95"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="px-5 -mt-2">{children}</div>
      </div>
    </div>
  );
}

/**
 * A problem the user has to act on, shown where it happened and left there.
 *
 * Deliberately not a toast. A toast is right for "Saved" and wrong for anything
 * the user must respond to: it disappears after a couple of seconds, and on a
 * phone the keyboard is usually covering wherever it appeared. Failures that
 * block a flow belong on the form, in view, until the thing that caused them
 * changes.
 *
 * `action` is the way out — "Sign in instead", "Send a new code". A message
 * that only says no leaves the person exactly where they were stuck.
 */
export function InlineError({ children, action, tone = 'error' }: {
  children: ReactNode;
  action?: { label: string; onClick: () => void };
  tone?: 'error' | 'warning';
}) {
  const isWarning = tone === 'warning';
  return (
    <div
      role="alert"
      className={`rounded-2xl border px-4 py-3 my-3.5 ${isWarning ? 'border-brand bg-brand-soft' : 'border-danger bg-danger-soft'}`}
    >
      <p className={`text-small font-semibold leading-snug m-0 ${isWarning ? 'text-brand' : 'text-danger'}`}>
        {children}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 text-small font-extrabold text-ink underline underline-offset-2 hover:text-brand transition"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}
