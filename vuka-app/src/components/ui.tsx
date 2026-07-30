import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/* ---------------- Button ---------------- */
type Variant = 'primary' | 'navy' | 'gold' | 'ghost' | 'subtle';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  block?: boolean;
  icon?: IconName;
}
const VARIANT: Record<Variant, string> = {
  primary: 'bg-red text-white hover:bg-red-hover',
  navy: 'bg-navy text-white hover:bg-navy-2 dark:text-navy-deep',
  gold: 'text-[#3a2900]',
  ghost: 'bg-surface text-navy border border-line-strong hover:bg-surface-2',
  subtle: 'bg-surface-2 text-ink hover:bg-surface-3',
};
export function Button({ variant = 'primary', size = 'md', block, icon, className = '', children, ...rest }: BtnProps) {
  const sz = size === 'sm' ? 'text-xs px-4 py-2.5 uppercase tracking-wide' : 'text-sm px-5 py-3.5';
  const gold = variant === 'gold' ? 'bg-gradient-to-br from-[#D97706] to-[#FBBF24]' : '';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-bold font-sans transition
        active:scale-[.975] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${VARIANT[variant]} ${gold} ${sz} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

/* ---------------- IconButton ---------------- */
export function IconButton({ name, label, size = 20, className = '', ...rest }: { name: IconName; label: string; size?: number } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      className={`grid place-items-center rounded-xl border border-line-strong bg-surface text-navy
        w-10 h-10 hover:bg-surface-2 transition active:scale-95 ${className}`}
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

/* ---------------- Chip ---------------- */
type ChipTone = 'neutral' | 'urgent' | 'fair' | 'time' | 'formal' | 'info';
const CHIP: Record<ChipTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  urgent: 'bg-[#fdecef] text-red dark:bg-red/15',
  fair: 'bg-[#e6f5e6] text-success dark:bg-success/15',
  time: 'bg-[#eaf3fb] text-info dark:bg-info/15',
  formal: 'bg-navy text-white dark:text-navy-deep',
  info: 'bg-[#eaf3fb] text-info dark:bg-info/15',
};
export function Chip({ tone = 'neutral', icon, children }: { tone?: ChipTone; icon?: IconName; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-bold ${CHIP[tone]}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ initials, color, size = 'md', verified, tier }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg'; verified?: boolean; tier?: string }) {
  const dim = size === 'lg' ? 'w-[76px] h-[76px] text-2xl rounded-[22px]' : size === 'sm' ? 'w-9 h-9 text-[13px] rounded-xl' : 'w-11 h-11 text-[15px] rounded-[14px]';
  return (
    <div className={`relative grid place-items-center font-bold text-white shadow-e1 shrink-0 ${dim}`} style={{ background: color }} aria-hidden="true">
      {initials}
      {verified && (
        <span className="absolute -right-1 -bottom-1 grid place-items-center w-5 h-5 rounded-full bg-info text-white border-2 border-surface">
          <Icon name="shield" size={11} />
        </span>
      )}
      {tier && (
        <span className="absolute -right-1.5 -top-1.5 grid place-items-center w-[22px] h-[22px] rounded-full bg-surface border-2 border-surface text-[12px] shadow-e1">{tier}</span>
      )}
    </div>
  );
}

/* ---------------- Ring (circular progress) ---------------- */
export function Ring({ pct, colors, size = 132, stroke = 11, gradId, children }: { pct: number; colors: [string, string]; size?: number; stroke?: number; gradId: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gj-border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors[0]} />
            <stop offset="1" stopColor={colors[1]} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">{children}</div>
    </div>
  );
}

/* ---------------- ProgressBar ---------------- */
export function ProgressBar({ pct, tone = 'red', track = 'rgba(255,255,255,.16)' }: { pct: number; tone?: 'red' | 'success'; track?: string }) {
  const fill = tone === 'success' ? 'linear-gradient(90deg,var(--gj-success),#4ade80)' : 'linear-gradient(90deg,var(--gj-red),#ff5062)';
  return (
    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: track }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: fill }} />
    </div>
  );
}

/* ---------------- TierBadge ---------------- */
export function TierBadge({ icon, name, color }: { icon: string; name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white" style={{ background: color }}>
      <span aria-hidden="true">{icon}</span>{name}
    </span>
  );
}

/* ---------------- SectionTitle ---------------- */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-3 px-1">
      <h3 className="text-[17px] font-extrabold text-navy m-0 tracking-tight">{children}<span className="text-red">.</span></h3>
      {action}
    </div>
  );
}

/* ---------------- Segmented ---------------- */
export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="flex bg-surface-2 rounded-pill p-1 border border-line" role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-[13px] font-bold transition
              ${active ? 'bg-red text-white' : 'text-muted hover:text-navy'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- StarRating (input) ---------------- */
export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-center gap-2.5 my-2" role="radiogroup" aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className={`text-[38px] leading-none transition active:scale-90 ${n <= value ? 'grayscale-0 opacity-100 scale-105' : 'grayscale opacity-40'}`}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint: string; action?: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <div className="text-5xl mb-2" aria-hidden="true">{icon}</div>
      <h4 className="text-navy font-bold text-base m-0">{title}</h4>
      <p className="text-muted text-[13px] leading-relaxed mt-1.5 mb-0">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

/* ---------------- Sheet (bottom modal) ---------------- */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(13,24,43,.58)] backdrop-blur-[2px] animate-fade" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full sm:max-w-md bg-surface rounded-t-[26px] sm:rounded-card
          p-5 pb-[max(22px,env(safe-area-inset-bottom))] animate-slideup max-h-[92%] overflow-y-auto scroll-area outline-none shadow-e3"
      >
        <div className="w-11 h-1.5 rounded-full bg-line-strong mx-auto mb-3.5 sm:hidden" />
        {children}
      </div>
    </div>
  );
}
