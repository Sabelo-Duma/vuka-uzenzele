import { useState } from 'react';
import type { CvSnapshot } from '../../types';
import { Ring, Sheet, useCountUp } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { tr } from '../../i18n';
import { useT } from '../../providers/LanguageProvider';

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
      label: tr('worker.score.yourRating'),
      detail: started
        ? tr('worker.score.ratingDetail', { avg: cv.avg.toFixed(1) })
        : tr('worker.score.noRatings'),
      earned: started ? Math.max(0, rating) : 0,
      outOf: 60,
    },
    {
      label: tr('worker.score.jobsCompleted'),
      detail: cv.jobsDone >= MAX_JOBS_COUNTED
        ? tr('worker.score.jobsFull', { jobs: cv.jobsDone, max: MAX_JOBS_COUNTED })
        : tr('worker.score.jobsCounted', { jobs: cv.jobsDone, max: MAX_JOBS_COUNTED }),
      earned: started ? jobs : 0,
      outOf: 30,
    },
    {
      label: tr('worker.score.safetyRecord'),
      detail: !started
        ? tr('worker.score.cleanSoFar')
        : cv.flags === 0
          ? tr('worker.score.noFlags')
          : tr('worker.score.flags', { count: cv.flags }),
      earned: started ? safety : 0,
      outOf: 10,
    },
  ];
}

/**
 * The score itself — tappable, because the explanation is the point.
 *
 * The label sits UNDER the ring, not inside it. Inside, the number and the
 * caption together are taller than the clear space the stroke leaves, so the
 * caption crossed the ring at every size. A dial holds one number.
 */
export function ScoreDial({ cv, size = 132, stroke = 11 }: { cv: CvSnapshot; size?: number; stroke?: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const animated = useCountUp(cv.rep);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex flex-col items-center gap-2 rounded-card px-2 py-1 transition active:scale-95 hover:bg-surface-2"
        aria-label={t('worker.score.aria', { score: Math.round(cv.rep) })}
      >
        <Ring pct={animated} size={size} stroke={stroke}>
          <b
            className="font-display font-extrabold text-ink leading-none font-mono tnum"
            style={{ fontSize: Math.round(size * 0.3) }}
          >
            {Math.round(animated)}
          </b>
        </Ring>
        <span className="inline-flex items-center gap-1 text-micro text-dim font-bold uppercase tracking-wide">
          {t('worker.score.label')} <Icon name="chev" size={11} />
        </span>
      </button>
      {open && <ScoreSheet cv={cv} onClose={() => setOpen(false)} />}
    </>
  );
}

function ScoreSheet({ cv, onClose }: { cv: CvSnapshot; onClose: () => void }) {
  const t = useT();
  const parts = scoreParts(cv);
  return (
    <Sheet title={t('worker.score.sheetTitle')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1">{t('worker.score.yourScore')}</h3>
      <p className="text-dim text-small leading-relaxed mb-4">
        {t('worker.score.intro')}
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
          <b className="text-small text-ink">{t('worker.score.total')}</b>
          <span className="font-mono tnum text-lead font-extrabold text-ink">{cv.rep}<span className="text-faint"> / 100</span></span>
        </div>
      </div>

      <p className="text-micro text-dim leading-relaxed mt-4 mb-0">
        {t('worker.score.foot')}
      </p>
    </Sheet>
  );
}
