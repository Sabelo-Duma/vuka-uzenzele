/* ============================================================
   Escrow, as the screens show it.

   One vocabulary everywhere, because the same fact is read by both sides:
     Funds secured  — the employer has put the pay in; it is waiting.
     Awaiting funds — not yet; nobody can be hired until it is.
     Paid out       — released to the worker's wallet.

   Teal for "Funds secured": on the design system, teal means a third party
   has vouched for something, and secured pay is exactly that — the money is
   there before anyone travels. And every one of these screens says TEST MODE
   until a payment provider is connected, because a worker deciding whether to
   take a job must not believe real money is waiting when it is not.
   ============================================================ */
import type { Gig } from '../types';
import { money } from '../lib/format';
import { Chip } from './ui';
import { Icon } from './Icon';

/** The pay for a gig, as the server computed it (falls back for old data). */
export function gigTotal(gig: Gig): number {
  return gig.totalPay ?? Math.round(gig.hours * gig.payPerHour);
}

export function FundingChip({ gig }: { gig: Gig }) {
  if (gig.funding === 'held') return <Chip tone="verified" icon="lock">Funds secured</Chip>;
  if (gig.funding === 'released') return <Chip tone="verified" icon="check">Paid out</Chip>;
  if (gig.funding === 'none') return <Chip tone="neutral" icon="clock">Awaiting funds</Chip>;
  return null;
}

/** Said on every money screen while payments are a practice run. */
export function TestModeNote({ className = '' }: { className?: string }) {
  return (
    <p className={`flex gap-2 items-start rounded-2xl border border-line bg-info-soft px-3.5 py-2.5 text-small text-ink leading-snug ${className}`}>
      <Icon name="alert" size={16} />
      <span><b>Test mode.</b> Payments are a practice run for now — no real money moves yet.</span>
    </p>
  );
}

/** What a worker is told about a gig's pay before and after applying. */
export function WorkerFundingPanel({ gig }: { gig: Gig }) {
  if (!gig.funding) return null;
  const total = money(gigTotal(gig));
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
      {gig.funding === 'held' && (
        <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
          <span className="text-verified shrink-0"><Icon name="lock" size={18} /></span>
          <span><b>{total} is secured for this job.</b> The employer has already put the pay in. It goes into your Vuka wallet when the job is confirmed, and you withdraw it to your bank.</span>
        </p>
      )}
      {gig.funding === 'none' && (
        <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
          <span className="text-dim shrink-0"><Icon name="clock" size={18} /></span>
          <span><b>The employer has not secured the pay yet.</b> You can apply now — but nobody can be hired or start work until the {total} is in.</span>
        </p>
      )}
      {gig.funding === 'released' && (
        <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
          <span className="text-verified shrink-0"><Icon name="check" size={18} /></span>
          <span><b>{total} was paid into the wallet</b> when this job was confirmed.</span>
        </p>
      )}
      {gig.paymentsMode !== 'live' && <TestModeNote className="mt-3" />}
    </div>
  );
}
