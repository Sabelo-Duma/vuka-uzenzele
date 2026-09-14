import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Back header used by detail screens. */
export function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <button
        onClick={onBack}
        aria-label="Go back"
        className="grid place-items-center w-11 h-11 rounded-chip border border-line bg-surface text-ink hover:bg-surface-2 transition active:scale-95"
      >
        <Icon name="back" size={22} />
      </button>
      <h1 className="font-display m-0 text-lead font-extrabold text-ink">{title}</h1>
    </div>
  );
}

/**
 * The one deep band a detail screen is allowed.
 *
 * It used to take a `gradient` prop, and every caller passed a different navy —
 * one of them the worker's own avatar colour. There is one band now, defined
 * once in index.css, so a hero looks like a hero wherever it appears.
 */
export function Hero({ eyebrow, title, sub, children }: { eyebrow: ReactNode; title: string; sub: ReactNode; children?: ReactNode }) {
  return (
    <div className="feature-band relative rounded-card p-5 overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,176,31,.20), transparent 70%)' }}
      />
      <div className="relative">
        <div className="text-micro font-bold uppercase tracking-widest text-on-feature-dim">{eyebrow}</div>
        <h2 className="font-display mt-1.5 mb-1 text-head font-extrabold leading-tight tracking-tight text-on-feature">{title}</h2>
        <div className="text-small text-on-feature-dim flex items-center gap-1.5">{sub}</div>
        {children}
      </div>
    </div>
  );
}

/** Stat cells for the hero. */
export function PayBox({ cells }: { cells: { label: string; value: string }[] }) {
  return (
    <div className="flex gap-2.5 mt-4">
      {cells.map((c) => (
        <div key={c.label} className="flex-1 bg-white/[.10] rounded-chip px-3 py-2.5">
          <small className="block text-micro text-on-feature-dim">{c.label}</small>
          <b className="text-body font-extrabold font-mono tnum text-on-feature">{c.value}</b>
        </div>
      ))}
    </div>
  );
}

/** Key/value row for detail lists. */
export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-line-soft last:border-0 text-small">
      <span className="text-dim w-[120px] shrink-0 font-semibold">{k}</span>
      <span className="font-bold text-ink flex items-center gap-2">{children}</span>
    </div>
  );
}

/**
 * Fair-pay meter — the offer measured against the gazetted minimum wage.
 *
 * It used to say "Above SA minimum" with no figure, which asks the worker to
 * take our word for it on the one number they are entitled to check. It now
 * shows where the legal floor sits on the bar, and what multiple of it the
 * offer is, so the claim can be verified by looking at it.
 */
export function FairMeter({ ratePerHour, minWage }: { ratePerHour: number; minWage: number }) {
  const ceiling = minWage * 2.5;              // the bar's full width
  const markerPct = (minWage / ceiling) * 100; // where the legal floor sits
  const fillPct = Math.min(100, (ratePerHour / ceiling) * 100);
  const above = ratePerHour >= minWage;
  const multiple = minWage > 0 ? ratePerHour / minWage : 0;
  const asMultiple = multiple.toLocaleString('en-ZA', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="my-3.5">
      <div className="flex justify-between items-center gap-3 mb-2">
        <b className="text-small text-ink flex items-center gap-1.5">
          <Icon name="shield" size={14} /> Fair-pay check
        </b>
        <span className={`text-micro font-bold rounded-pill px-2.5 py-1 ${above ? 'bg-verified-soft text-verified' : 'bg-danger-soft text-danger'}`}>
          {above ? `${asMultiple}× the minimum` : 'Below the legal minimum'}
        </span>
      </div>

      <div className="relative h-2.5 bg-surface-3 rounded-pill overflow-hidden">
        <div
          className="h-full rounded-pill"
          style={{ width: `${fillPct}%`, background: above ? 'var(--v-verified)' : 'var(--v-danger)' }}
        />
        {/* The legal floor, drawn where it actually falls on the scale. */}
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 w-[2px] bg-ink"
          style={{ left: `${markerPct}%` }}
        />
      </div>

      <div className="flex justify-between text-micro text-dim font-semibold mt-1.5">
        <span>
          Legal minimum <span className="font-mono tnum">R{minWage}</span>/hr
        </span>
        <span>
          This job <span className="font-mono tnum font-bold text-ink">R{ratePerHour}</span>/hr
        </span>
      </div>
    </div>
  );
}

/** Perk checklist. */
export function PerkList({ perks }: { perks: string[] }) {
  return (
    <div className="grid gap-2 mt-1.5">
      {perks.map((p) => (
        <div key={p} className="flex gap-2.5 items-center text-small text-ink">
          <span className="text-verified shrink-0"><Icon name="check" size={15} /></span>{p}
        </div>
      ))}
    </div>
  );
}

/** Reusable trust strip — the three safety pillars, shown on home screens
 *  (visible on mobile too, where the desktop rails are hidden). */
export function TrustStrip() {
  const pillars: { icon: string; label: string }[] = [
    { icon: '🪪', label: 'ID-verified' },
    { icon: '⚖️', label: 'Fair-pay checked' },
    { icon: '⭐', label: 'Two-way reviews' },
  ];
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap rounded-2xl border border-line bg-surface px-4 py-2.5 mb-3">
      {pillars.map((p, i) => (
        <span key={p.label} className="flex items-center gap-2">
          {i > 0 && <span className="hidden sm:inline w-1 h-1 rounded-full bg-line -ml-2 sm:-ml-3" aria-hidden="true" />}
          <span aria-hidden="true">{p.icon}</span>
          <span className="text-small font-bold text-ink">{p.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Sticky bottom CTA container for detail screens. */
export function StickyCta({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-gradient-to-t from-canvas via-canvas to-transparent">
      {children}
    </div>
  );
}
