/* ============================================================
   Auto-release — crediting work the employer never confirmed.

   The two-sided loop is `applied → hired → worker_done → completed`, and
   everything a worker actually cares about is written on that last step: the
   history row that drives their rating, tier and total earned, the skill unlock,
   and the notification. So an employer who simply never taps Confirm doesn't
   delay a worker's progress — they cancel it, permanently and silently. The
   worker did the job and has no way to make it count.

   This closes that hole. Once the confirmation window lapses, the job is
   credited without the employer, and stored UNRATED (rating 0) rather than
   guessed at. See computeCv in engine.mjs: unrated work counts toward jobs done
   and total earned but is excluded from the average, so an employer's silence
   can move neither the worker's rating nor their own.

   Later this is also the seam escrow needs — the same window, releasing money
   instead of a reference.
   ============================================================ */

import { all, run } from './db.mjs';
import { uuid } from './auth.mjs';

/**
 * Hours an employer gets to confirm before the job is credited without them.
 * Long enough that a busy weekend doesn't trip it, short enough that a worker
 * isn't left waiting on someone who is never coming back.
 */
export const AUTO_RELEASE_HOURS = (() => {
  const raw = Number(process.env.VUKA_AUTO_RELEASE_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : 72;
})();

/** The `date` label on a history row, matching the manual-confirm path. */
function dateLabel(whenText) {
  return (String(whenText ?? '').split('·')[0] || 'Jul 2026').trim();
}

/**
 * Credit every job whose confirmation window has lapsed.
 *
 * @param {object}   [opts]
 * @param {Date}     [opts.now]       treat this as the current time (tests)
 * @param {number}   [opts.hours]     window override (tests)
 * @param {Function} [opts.onRelease] called per released job, after it is
 *   committed — notifications live here so this module stays free of any
 *   dependency on the express layer (and of a circular import).
 * @returns {Promise<Array>} the jobs released this pass
 */
export async function releaseDueJobs({ now = new Date(), hours = AUTO_RELEASE_HOURS, onRelease } = {}) {
  const cutoff = new Date(now.getTime() - hours * 3_600_000).toISOString();

  const due = await all(
    `SELECT a.id AS app_id, a.worker_id, a.safety_flag,
            g.id AS gig_id, g.title, g.category, g.employer_name,
            g.employer_initials, g.employer_id, g.when_text, g.hours, g.pay_per_hour
       FROM applications a
       JOIN gigs g ON g.id = a.gig_id
      WHERE a.status = 'worker_done'
        AND a.worker_done_at IS NOT NULL
        AND a.worker_done_at <= ?`,
    [cutoff],
  );

  const released = [];
  for (const r of due) {
    const ts = now.toISOString();

    /* Claim the row first, and only proceed if this pass is the one that moved
       it. RETURNING makes that atomic, so an overlapping sweep — or an employer
       confirming at the same moment — can't produce two history rows for one
       job. Ordering it this way means a crash between the two statements loses
       a credit rather than double-counting one; a lost credit is one job on one
       worker, a double-count corrupts the reputation engine. */
    const claimed = await all(
      `UPDATE applications SET status = 'completed', completed_at = ?
        WHERE id = ? AND status = 'worker_done' RETURNING id`,
      [ts, r.app_id],
    );
    if (!claimed.length) continue;

    await run(
      `INSERT INTO history (id, worker_id, job_title, category, employer, employer_initials,
                            employer_id, date, hours, pay, rating, review, safety_flag,
                            auto_released, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uuid(), r.worker_id, r.title, r.category, r.employer_name, r.employer_initials,
        r.employer_id, dateLabel(r.when_text), r.hours, Math.round(r.hours * r.pay_per_hour),
        0, `Confirmed automatically — ${r.employer_name} did not respond within ${hours} hours. The work counts; it carries no rating.`,
        r.safety_flag ? 1 : 0, 1, ts],
    );

    released.push(r);
    if (onRelease) {
      try {
        await onRelease(r);
      } catch {
        /* A failed notification must not roll back credited work, and must not
           stop the rest of the batch. The job is already committed. */
      }
    }
  }

  return released;
}

/**
 * Run the sweep now, then on an interval, and hand back a stop function.
 *
 * The startup pass matters as much as the interval: on a free-tier host the
 * process sleeps, and anything that came due while it was down would otherwise
 * wait for the next tick.
 */
export function startAutoRelease({ everyMinutes = 15, onRelease, onError } = {}) {
  const tick = async () => {
    try {
      const released = await releaseDueJobs({ onRelease });
      if (released.length) {
        console.log(`auto-release: credited ${released.length} job(s) the employer never confirmed`);
      }
    } catch (e) {
      if (onError) onError(e);
    }
  };

  void tick();
  const timer = setInterval(tick, everyMinutes * 60_000);
  timer.unref?.();          // never hold the process open on shutdown
  return () => clearInterval(timer);
}
