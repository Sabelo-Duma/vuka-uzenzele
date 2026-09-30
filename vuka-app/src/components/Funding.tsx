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
import { BoldText, Chip } from './ui';
import { useT } from '../providers/LanguageProvider';
import { Icon } from './Icon';

/** The pay for a gig, as the server computed it (falls back for old data). */
export function gigTotal(gig: Gig): number {
  return gig.totalPay ?? Math.round(gig.hours * gig.payPerHour);
}

export function FundingChip({ gig }: { gig: Gig }) {
  const t = useT();
  if (gig.funding === 'held') return <Chip tone="verified" icon="lock">{t('common.funding.held')}</Chip>;
  if (gig.funding === 'released') return <Chip tone="verified" icon="check">{t('common.funding.released')}</Chip>;
  if (gig.funding === 'none') return <Chip tone="neutral" icon="clock">{t('common.funding.none')}</Chip>;
  return null;
}

/** Said on every money screen while payments are a practice run. */
export function TestModeNote({ className = '' }: { className?: string }) {
  const t = useT();
  return (
    <p className={`flex gap-2 items-start rounded-2xl border border-line bg-info-soft px-3.5 py-2.5 text-small text-ink leading-snug ${className}`}>
      <Icon name="alert" size={16} />
      <span><BoldText text={t('common.funding.testMode')} /></span>
    </p>
  );
}

/** What a worker is told about a gig's pay before and after applying. */
export function WorkerFundingPanel({ gig }: { gig: Gig }) {
  const t = useT();
  if (!gig.funding) return null;
  const total = money(gigTotal(gig));
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
      {gig.funding === 'held' && (
        <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
          <span className="text-verified shrink-0"><Icon name="lock" size={18} /></span>
          <span><BoldText text={t('common.funding.heldBody', { total })} /></span>
        </p>
      )}
      {gig.funding === 'none' && (
        <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
          <span className="text-dim shrink-0"><Icon name="clock" size={18} /></span>
          <span><BoldText text={t('common.funding.noneBody', { total })} /></span>
        </p>
      )}
      {gig.funding === 'released' && (
        <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
          <span className="text-verified shrink-0"><Icon name="check" size={18} /></span>
          <span><BoldText text={t('common.funding.releasedBody', { total })} /></span>
        </p>
      )}
      {gig.paymentsMode !== 'live' && <TestModeNote className="mt-3" />}
    </div>
  );
}
