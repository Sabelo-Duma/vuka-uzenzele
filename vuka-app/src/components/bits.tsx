import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Back header used by detail screens. */
export function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <button onClick={onBack} aria-label="Go back" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy hover:bg-surface-2 transition active:scale-95">
        <Icon name="back" size={22} />
      </button>
      <h3 className="m-0 text-base font-extrabold text-navy uppercase tracking-wide">{title}</h3>
    </div>
  );
}

/** Coloured hero band for detail screens. */
export function Hero({ eyebrow, title, sub, gradient, children }: { eyebrow: ReactNode; title: string; sub: ReactNode; gradient: string; children?: ReactNode }) {
  return (
    <div className="relative rounded-card p-5 text-white overflow-hidden" style={{ background: gradient }}>
      <span aria-hidden="true" className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,0,35,.28), transparent 70%)' }} />
      <div className="relative">
        <div className="text-micro font-bold uppercase tracking-widest text-white/70">{eyebrow}</div>
        <h2 className="mt-1.5 mb-1 text-head font-extrabold leading-tight tracking-tight">{title}</h2>
        <div className="text-small opacity-90 flex items-center gap-1.5">{sub}</div>
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
        <div key={c.label} className="flex-1 bg-white/[.13] rounded-[13px] px-3 py-2.5">
          <small className="block text-micro opacity-80">{c.label}</small>
          <b className="text-body font-extrabold tnum">{c.value}</b>
        </div>
      ))}
    </div>
  );
}

/** Key/value row for detail lists. */
export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-line last:border-0 text-sm">
      <span className="text-muted w-[120px] shrink-0 font-semibold">{k}</span>
      <span className="font-bold text-navy flex items-center gap-2">{children}</span>
    </div>
  );
}

/** Fair-pay meter: rate vs SA minimum wage. */
export function FairMeter({ ratePerHour, minWage }: { ratePerHour: number; minWage: number }) {
  const pct = Math.min(100, Math.round((ratePerHour / (minWage * 1.8)) * 100));
  const above = ratePerHour >= minWage;
  return (
    <div className="my-3.5">
      <div className="flex justify-between items-center mb-1.5">
        <b className="text-small text-navy flex items-center gap-1.5"><Icon name="shield" size={14} /> Fair Pay check</b>
        <span className={`text-micro font-bold rounded-pill px-2.5 py-1 ${above ? 'bg-[#e6f5e6] text-success dark:bg-success/15' : 'bg-[#fdecef] text-red dark:bg-red/15'}`}>
          {above ? 'Above minimum wage' : 'Below minimum'}
        </span>
      </div>
      <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--gj-success),#4ade80)' }} />
      </div>
      <div className="flex justify-between text-micro text-muted font-semibold mt-1.5">
        <span>SA min R{minWage}/hr</span>
        <span>R{ratePerHour}/hr</span>
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
          <span className="text-success shrink-0"><Icon name="check" size={15} /></span>{p}
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
          {i > 0 && <span className="hidden sm:inline w-1 h-1 rounded-full bg-line-strong -ml-2 sm:-ml-3" aria-hidden="true" />}
          <span aria-hidden="true">{p.icon}</span>
          <span className="text-small font-bold text-navy">{p.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Sticky bottom CTA container for detail screens. */
export function StickyCta({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-gradient-to-t from-surface-2 via-surface-2 to-transparent">{children}</div>;
}
