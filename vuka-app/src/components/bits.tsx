import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Back header used by detail screens. */
export function DetailHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <button onClick={onBack} aria-label="Go back" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy hover:bg-surface-2 transition active:scale-95">
        <Icon name="back" size={22} />
      </button>
      <h3 className="m-0 text-base font-bold text-navy uppercase tracking-wide">{title}</h3>
    </div>
  );
}

/** Coloured hero band for detail screens. */
export function Hero({ eyebrow, title, sub, gradient, children }: { eyebrow: ReactNode; title: string; sub: ReactNode; gradient: string; children?: ReactNode }) {
  return (
    <div className="rounded-card p-5 text-white" style={{ background: gradient }}>
      <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">{eyebrow}</div>
      <h2 className="mt-1.5 mb-1 text-[23px] font-bold leading-tight">{title}</h2>
      <div className="text-[13px] opacity-90 flex items-center gap-1.5">{sub}</div>
      {children}
    </div>
  );
}

/** Stat cells for the hero. */
export function PayBox({ cells }: { cells: { label: string; value: string }[] }) {
  return (
    <div className="flex gap-2.5 mt-4">
      {cells.map((c) => (
        <div key={c.label} className="flex-1 bg-white/[.13] rounded-[13px] px-3 py-2.5">
          <small className="block text-[11px] opacity-80">{c.label}</small>
          <b className="text-[15px] font-bold">{c.value}</b>
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
        <b className="text-[13px] text-navy flex items-center gap-1.5"><Icon name="shield" size={14} /> Fair Pay check</b>
        <span className={`text-[11px] font-bold rounded-pill px-2.5 py-1 ${above ? 'bg-[#e6f5e6] text-success dark:bg-success/15' : 'bg-[#fdecef] text-red dark:bg-red/15'}`}>
          {above ? 'Above minimum wage' : 'Below minimum'}
        </span>
      </div>
      <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--gj-success),#4ade80)' }} />
      </div>
      <div className="flex justify-between text-[11px] text-muted font-semibold mt-1.5">
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
        <div key={p} className="flex gap-2.5 items-center text-[13.5px] text-ink">
          <span className="text-success shrink-0"><Icon name="check" size={15} /></span>{p}
        </div>
      ))}
    </div>
  );
}

/** Sticky bottom CTA container for detail screens. */
export function StickyCta({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-gradient-to-t from-surface-2 via-surface-2 to-transparent">{children}</div>;
}
