import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import {
  IconCheck, IconClock, IconGavel, IconLock, IconMegaphone, IconPencil,
  IconScales, IconShield, IconSlash, IconTrophy, IconX,
} from './icons';

/** C03 StatusBadge — pill, 12px/600 uppercase, ALWAYS icon + text (never color alone). */
export type RfxStatus =
  | 'Draft' | 'PendingReview' | 'PendingApproval' | 'Published' | 'Closed'
  | 'Evaluating' | 'AwardPendingApproval' | 'Awarded' | 'Unsuccessful'
  | 'Rejected' | 'Withdrawn' | 'Sealed';

export interface StatusBadgeProps {
  status: RfxStatus;
  /** Tooltip/context, e.g. "Sealed until 2026-08-01 17:00". */
  title?: string;
  className?: string;
}

const config: Record<RfxStatus, { label: string; icon: ReactNode; classes: string }> = {
  Draft: { label: 'Draft', icon: <IconPencil size={12} />, classes: 'border border-gj-border-strong text-gj-text-muted bg-transparent' },
  PendingReview: { label: 'Pending review', icon: <IconClock size={12} />, classes: 'bg-gj-warning-fill text-gj-warning-on-fill' },
  PendingApproval: { label: 'Pending approval', icon: <IconShield size={12} />, classes: 'bg-gj-warning-fill text-gj-warning-on-fill' },
  Published: { label: 'Published', icon: <IconMegaphone size={12} />, classes: 'bg-gj-info text-white' },
  Closed: { label: 'Closed', icon: <IconLock size={12} />, classes: 'bg-gj-navy text-white' },
  Evaluating: { label: 'Evaluating', icon: <IconScales size={12} />, classes: 'border border-gj-info text-gj-info bg-transparent' },
  AwardPendingApproval: { label: 'Award pending', icon: <IconGavel size={12} />, classes: 'bg-gj-warning-fill text-gj-warning-on-fill' },
  Awarded: { label: 'Awarded', icon: <IconTrophy size={12} />, classes: 'bg-gj-success-fill text-gj-success-on-fill' },
  Unsuccessful: { label: 'Unsuccessful', icon: <IconSlash size={12} />, classes: 'bg-gj-bg-hover text-gj-text-muted' },
  Rejected: { label: 'Rejected', icon: <IconX size={12} />, classes: 'border border-gj-danger text-gj-danger bg-transparent' },
  Withdrawn: { label: 'Withdrawn', icon: <IconX size={12} />, classes: 'border border-gj-danger text-gj-danger bg-transparent' },
  Sealed: { label: 'Sealed', icon: <IconLock size={12} />, classes: 'border border-gj-seal text-gj-seal bg-transparent' },
};

export function StatusBadge({ status, title, className }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-gj-1 rounded-pill px-3 py-[3px] text-gj-btn uppercase whitespace-nowrap',
        c.classes,
        className,
      )}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

/** Acknowledgement/participation variant used on supplier cards. */
export function AckBadge({ acknowledged }: { acknowledged: boolean }) {
  return acknowledged ? (
    <span className="inline-flex items-center gap-gj-1 rounded-pill bg-gj-success-fill px-3 py-[3px] text-gj-btn uppercase text-gj-success-on-fill">
      <IconCheck size={12} /> Acknowledged
    </span>
  ) : (
    <span className="inline-flex items-center gap-gj-1 rounded-pill border border-gj-border-strong px-3 py-[3px] text-gj-btn uppercase text-gj-text-muted">
      <IconClock size={12} /> Not acknowledged
    </span>
  );
}
