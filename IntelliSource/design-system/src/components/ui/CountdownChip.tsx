import { useEffect, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { IconClock, IconLock } from './icons';

/** C07 CountdownChip — deadline urgency: >24h navy outline, ≤24h warning, ≤1h danger+pulse, past=Closed. */
export interface CountdownChipProps {
  /** Closing date/time (UTC or with offset). */
  closesAt: Date | string;
  /** Injectable clock for tests/stories. */
  now?: Date;
  className?: string;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function CountdownChip({ closesAt, now, className }: CountdownChipProps) {
  const target = useMemo(() => (typeof closesAt === 'string' ? new Date(closesAt) : closesAt), [closesAt]);
  const [tick, setTick] = useState(() => (now ?? new Date()).getTime());

  useEffect(() => {
    if (now) return; // fixed clock (stories/tests)
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [now]);

  const remaining = target.getTime() - tick;
  const closed = remaining <= 0;
  const underHour = !closed && remaining <= 3_600_000;
  const underDay = !closed && remaining <= 86_400_000;

  const classes = closed
    ? 'bg-gj-navy text-white'
    : underHour
      ? 'bg-gj-danger-fill text-white animate-gj-pulse-soft motion-reduce:animate-none'
      : underDay
        ? 'bg-gj-warning-fill text-gj-warning-on-fill'
        : 'border border-gj-navy text-gj-navy bg-transparent';

  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={
        closed
          ? `Closed on ${target.toLocaleString()}`
          : `Closes in ${fmt(remaining)}`
      }
      data-numeric
      className={cx(
        'inline-flex items-center gap-gj-1 rounded-pill px-3 py-[3px] text-gj-btn uppercase whitespace-nowrap',
        classes,
        className,
      )}
    >
      {closed ? <IconLock size={12} /> : <IconClock size={12} />}
      {closed ? `Closed ${target.toLocaleDateString()}` : `Closes in ${fmt(remaining)}`}
    </span>
  );
}
