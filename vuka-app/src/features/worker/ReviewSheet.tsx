/**
 * The worker's half of finishing a job: say it's done and rate the employer.
 *
 * It does NOT claim the CV has been updated, because it hasn't — the employer
 * has to confirm the work first. Pretending otherwise is exactly the kind of
 * thing that makes a reference worthless. The celebration lives in
 * CelebrationSheet and fires when the confirmation lands.
 */
import { useState } from 'react';
import { useApp } from '../../store/appStore';
import type { Gig } from '../../types';
import { Button, Sheet } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';
import { fill } from './fill';

export function ReviewSheet({ gig, onClose }: { gig: Gig; onClose: () => void }) {
  const { completeGig, navigate, toast } = useApp();
  const t = useT();
  const [phase, setPhase] = useState<'review' | 'sent'>('review');
  /* Starts unset, not at five.
     Both dialogs opened on 5★ and the fastest way out was to accept it, so
     every rating nobody thought about became the highest one. Ratings are
     what this platform sells; a default that flatters them makes the whole
     scale mean less. 0 means "not chosen yet" and the button waits. */
  const [rating, setRating] = useState(0);
  const [flag, setFlag] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await completeGig(gig.id, rating, flag);
      setPhase('sent');
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  if (phase === 'review') {
    return (
      <Sheet title={t('worker.review.markDone')} onClose={onClose}>
        <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1 tracking-tight">{t('worker.review.howWas')}</h3>
        <p className="text-dim text-small leading-relaxed mb-4">
          {fill(t('worker.review.rateIntro', { title: gig.title }), { employer: <b>{gig.employer}</b> })}
        </p>
        <RatingInput value={rating} onChange={setRating} />
        <label className="flex gap-2.5 items-start bg-brand-soft border border-brand rounded-2xl p-3 my-4 cursor-pointer">
          <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0 accent-[var(--v-danger)]" />
          <span className="text-small text-brand leading-snug"><b>{t('worker.review.unsafe')}</b> {t('worker.review.unsafeBody')}</span>
        </label>
        <Button block disabled={busy || rating === 0} onClick={submit}>{busy ? t('action.sending') : rating === 0 ? t('worker.review.chooseFirst') : t('worker.review.markRate', { rating })}</Button>
        <p className="text-center text-small text-dim mt-3">
          {t('worker.review.thenConfirms', { name: gig.employer.split(' ')[0] })}
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet title={t('worker.review.waiting')} onClose={onClose}>
      <div className="text-center">
        <div className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-surface-2 border border-line text-ink animate-pop" aria-hidden="true"><Icon name="clock" size={30} /></div>
        <h3 className="font-display text-title font-extrabold text-ink mt-2 mb-1 tracking-tight">{t('worker.review.sentTo', { name: gig.employer.split(' ')[0] })}<span className="text-brand">.</span></h3>
        <p className="text-dim text-small leading-relaxed">
          {fill(t('worker.review.ratingIn'), { employer: <b className="text-ink">{gig.employer}</b> })}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">
        <Step done label={t('worker.review.step1')} />
        <Step label={t('worker.review.step2', { employer: gig.employer })} />
        <Step label={t('worker.review.step3')} last />
      </div>

      <div className="flex gap-2.5 items-start bg-info-soft rounded-xl px-3.5 py-3 mt-4">
        <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
        <span className="text-small text-ink leading-snug">{t('worker.review.bothSides')}</span>
      </div>

      <Button block variant="primary" className="mt-5" onClick={() => { onClose(); navigate('home'); }}>{t('worker.review.gotIt')}</Button>
      <button onClick={() => { onClose(); navigate('chat', gig.employerId ?? ''); }} className="w-full text-center text-small text-ink font-bold mt-3 hover:text-brand transition">
        {t('worker.message', { name: gig.employer.split(' ')[0] })}
      </button>
    </Sheet>
  );
}

function Step({ label, done, last }: { label: string; done?: boolean; last?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center shrink-0">
        <span className={`grid place-items-center w-6 h-6 rounded-full text-small font-extrabold ${done ? 'bg-verified text-canvas' : 'bg-surface border-[1.5px] border-line text-faint'}`}>
          {done ? '✓' : ''}
        </span>
        {!last && <span className="w-0.5 flex-1 min-h-[18px] bg-line" />}
      </div>
      <span className={`text-small leading-snug ${done ? 'text-ink font-semibold' : 'text-dim'} ${last ? '' : 'pb-3'}`}>{label}</span>
    </div>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useT();
  return (
    <div className="flex justify-center gap-2.5 my-2" role="radiogroup" aria-label={t('worker.review.ratingOutOf5')}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={value === n} aria-label={t('worker.review.stars', { count: n })} onClick={() => onChange(n)}
          className={`text-hero leading-none transition active:scale-90 ${n <= value ? 'grayscale-0 opacity-100 scale-105' : 'grayscale opacity-40'}`}>⭐</button>
      ))}
    </div>
  );
}
