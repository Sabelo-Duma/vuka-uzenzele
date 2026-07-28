import { useState } from 'react';
import { cx } from '../../utils/cx';
import { IconAlert, IconCheck, IconSparkle } from './icons';

/** C16 AuditTimeline — immutable trail; actor chips (person/system/AI), old→new diffs, chain-verify chip. */
export type AuditActorKind = 'person' | 'system' | 'ai';

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorKind: AuditActorKind;
  /** e.g. "gpt-frontier-2026-05 · prompt a41f…" shown for AI actors. */
  aiModelInfo?: string;
  timestampUtc: string;
  timestampLocal?: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface AuditTimelineProps {
  entries: AuditEntry[];
  chainStatus?: 'verified' | 'failed' | 'pending';
  className?: string;
}

function ActorChip({ entry }: { entry: AuditEntry }) {
  const styles: Record<AuditActorKind, string> = {
    person: 'border-gj-navy text-gj-navy',
    system: 'border-gj-border-strong text-gj-text-muted',
    ai: 'border-gj-ai text-gj-ai',
  };
  return (
    <span
      title={entry.actorKind === 'ai' ? entry.aiModelInfo : undefined}
      className={cx('inline-flex items-center gap-gj-1 rounded-chip border px-2 py-[2px] text-[11px] font-semibold', styles[entry.actorKind])}
    >
      {entry.actorKind === 'ai' && <IconSparkle size={11} />}
      {entry.actor}
    </span>
  );
}

export function ChainStatusChip({ status }: { status: 'verified' | 'failed' | 'pending' }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-gj-1 rounded-chip bg-gj-success-fill/20 px-2 py-[2px] text-[11px] font-semibold text-gj-success">
        <IconCheck size={11} /> Hash chain verified
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span role="alert" className="inline-flex items-center gap-gj-1 rounded-chip bg-gj-danger-fill/15 px-2 py-[2px] text-[11px] font-semibold text-gj-danger">
        <IconAlert size={11} /> Chain verification FAILED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-gj-1 rounded-chip bg-gj-bg-hover px-2 py-[2px] text-[11px] font-semibold text-gj-text-muted">
      Verifying…
    </span>
  );
}

function DiffBlock({ oldValue, newValue }: { oldValue?: string; newValue?: string }) {
  return (
    <div className="mt-gj-2 overflow-x-auto rounded-card bg-gj-bg-light p-gj-3 font-gj-mono text-gj-mono">
      {oldValue !== undefined && (
        <div className="text-gj-danger"><span aria-hidden="true">− </span><span className="gj-sr-only">Removed: </span>{oldValue}</div>
      )}
      {newValue !== undefined && (
        <div className="text-gj-success"><span aria-hidden="true">+ </span><span className="gj-sr-only">Added: </span>{newValue}</div>
      )}
    </div>
  );
}

export function AuditTimeline({ entries, chainStatus = 'verified', className }: AuditTimelineProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={className}>
      <div className="mb-gj-4"><ChainStatusChip status={chainStatus} /></div>
      <ol className="relative m-0 list-none space-y-gj-5 border-l-2 border-gj-border p-0 pl-gj-5">
        {entries.map((e) => {
          const hasDiff = e.oldValue !== undefined || e.newValue !== undefined;
          const isOpen = expanded.has(e.id);
          return (
            <li key={e.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-gj-navy bg-gj-bg"
              />
              <div className="flex flex-wrap items-center gap-gj-2">
                <span className="font-semibold text-gj-text">{e.action}</span>
                <ActorChip entry={e} />
                <time
                  dateTime={e.timestampUtc}
                  title={e.timestampLocal ? `Local: ${e.timestampLocal}` : undefined}
                  className="font-gj-mono text-gj-mono text-gj-text-muted"
                >
                  {e.timestampUtc}
                </time>
              </div>
              {e.details && <p className="m-0 mt-gj-1 text-gj-small text-gj-text-muted">{e.details}</p>}
              {hasDiff && (
                <>
                  <button
                    type="button"
                    onClick={() => toggle(e.id)}
                    aria-expanded={isOpen}
                    className="mt-gj-1 text-gj-small text-gj-link underline hover:no-underline"
                  >
                    {isOpen ? 'Hide change' : 'Show change'}
                  </button>
                  {isOpen && <DiffBlock oldValue={e.oldValue} newValue={e.newValue} />}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
