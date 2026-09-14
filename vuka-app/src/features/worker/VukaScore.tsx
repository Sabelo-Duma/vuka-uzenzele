import { useState } from 'react';
import type { CvSnapshot } from '../../types';
import { Ring, Sheet, useCountUp } from '../../components/ui';
import { Icon } from '../../components/Icon';

/**
 * The Vuka Score, and what it is made of.
 *
 * It used to read "REP SCORE 82" — a number with no units, no explanation and
 * no way to tell what would move it. A reputation figure a worker cannot
 * audit is one they cannot act on, and one an employer has no reason to
 * believe. So the score is now a button, and behind it is the arithmetic.
 *
 * The three parts below are exactly the ones computeCv() uses, in the same
 * weights. If that formula changes, change this with it — a breakdown that
 * does not add up to the number above it is worse than no breakdown.
 */
const MAX_JOBS_COUNTED = 12;

interface Part {
  label: string;
  detail: string;
  earned: number;
  outOf: number;
}

export function scoreParts(cv: CvSnapshot): Part[] {
  // Before any work is confirmed the engine holds the whole score at zero, so
  // the breakdown has to say zero too rather than crediting a safety record
  // nobody has earned yet.
  const started = cv.jobsDone > 0;
  const jobs = Math.round((Math.min(cv.jobsDone, MAX_JOBS_COUNTED) / MAX_JOBS_COUNTED) * 30);
  const safety = cv.flags ? 0 : 10;
  let rating = Math.round((cv.avg / 5) * 60);

  // Each part is rounded for display, so the three can land a point away from
  // the total. The rating carries the correction because it is the largest —
  // a breakdown that does not add up to the number above it is worse than no
  // breakdown at all.
  if (started) rating += cv.rep - (rating + jobs + safety);

  return [
    {
      label: 'Your rating',
      detail: started
        ? `${cv.avg.toFixed(1)} out of 5, averaged over every job an employer rated`
        : 'No ratings yet',
      earned: started ? Math.max(0, rating) : 0,
      outOf: 60,
    },
    {
      label: 'Jobs completed',
      detail: cv.jobsDone >= MAX_JOBS_COUNTED
        ? `${cv.jobsDone} jobs — this part is full at ${MAX_JOBS_COUNTED}`
        : `${cv.jobsDone} of ${MAX_JOBS_COUNTED} jobs counted`,
      earned: started ? jobs : 0,
      outOf: 30,
    },
    {
      label: 'Safety record',
      detail: !started
        ? 'Clean so far — worth 10 once your first job is confirmed'
        : cv.flags === 0
          ? 'No safety flags'
          : `${cv.flags} safety flag${cv.flags === 1 ? '' : 's'} on your record`,
      earned: started ? safety : 0,
      outOf: 10,
    },
  ];
}

/** The score itself — tappable, because the explanation is the point. */
export function ScoreDial({ cv, size = 132, stroke = 11 }: { cv: CvSnapshot; size?: number; stroke?: number }) {
  const [open, setOpen] = useState(false);
  const animated = useCountUp(cv.rep);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full transition active:scale-95"
        aria-label={`Vuka Score ${Math.round(cv.rep)} out of 100. See how it is worked out.`}
      >
        <Ring pct={animated} size={size} stroke={stroke}>
          <b className="font-display text-display font-extrabold text-ink leading-none font-mono tnum">{Math.round(animated)}</b>
          <small className="text-micro text-dim font-bold uppercase tracking-wide mt-1 flex items-center gap-1">
            Vuka Score <Icon name="chev" size={11} />
          </small>
        </Ring>
      </button>
      {open && <ScoreSheet cv={cv} onClose={() => setOpen(false)} />}
    </>
  );
}

function ScoreSheet({ cv, onClose }: { cv: CvSnapshot; onClose: () => void }) {
  const parts = scoreParts(cv);
  return (
    <Sheet title="How your Vuka Score works" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1">Your Vuka Score</h3>
      <p className="text-dim text-small leading-relaxed mb-4">
        One number out of 100, built from work employers confirmed. Nothing here is set by hand,
        and nothing can be bought.
      </p>

      <div className="rounded-2xl border border-line overflow-hidden">
        {parts.map((p) => (
          <div key={p.label} className="p-3.5 border-b border-line-soft last:border-0">
            <div className="flex items-baseline justify-between gap-3">
              <b className="text-small text-ink">{p.label}</b>
              <span className="font-mono tnum text-small font-bold text-ink">
                {p.earned}<span className="text-faint"> / {p.outOf}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-pill bg-surface-3 overflow-hidden my-1.5">
              <div className="h-full rounded-pill bg-brand-solid" style={{ width: `${(p.earned / p.outOf) * 100}%` }} />
            </div>
            <p className="text-micro text-dim m-0 leading-snug">{p.detail}</p>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 p-3.5 bg-surface-2">
          <b className="text-small text-ink">Total</b>
          <span className="font-mono tnum text-lead font-extrabold text-ink">{cv.rep}<span className="text-faint"> / 100</span></span>
        </div>
      </div>

      <p className="text-micro text-dim leading-relaxed mt-4 mb-0">
        The fastest way up is a good rating on the next job — it is worth more than any other part.
        Your score is separate from your tier: the tier sets which jobs you can apply for, the score
        is how employers compare people who can already apply.
      </p>
    </Sheet>
  );
}
