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

export function ReviewSheet({ gig, onClose }: { gig: Gig; onClose: () => void }) {
  const { completeGig, navigate, toast } = useApp();
  const [phase, setPhase] = useState<'review' | 'sent'>('review');
  const [rating, setRating] = useState(5);
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
      <Sheet title="Mark the job done" onClose={onClose}>
        <h3 className="text-xl font-extrabold text-navy m-0 mb-1 tracking-tight">How was the job?</h3>
        <p className="text-muted text-small leading-relaxed mb-4">
          Rate <b>{gig.employer}</b> for “{gig.title}”. Your rating is part of their public employer score.
        </p>
        <RatingInput value={rating} onChange={setRating} />
        <label className="flex gap-2.5 items-start bg-[#fff7ed] dark:bg-warning/10 border border-[#fed7aa] dark:border-warning/30 rounded-2xl p-3 my-4 cursor-pointer">
          <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0 accent-[var(--gj-danger)]" />
          <span className="text-small text-[#9a3412] dark:text-warning leading-snug"><b>I felt unsafe or something went wrong.</b> Flagging opens a report with our Safety team and is kept confidential. Your safety comes first.</span>
        </label>
        <Button block disabled={busy} onClick={submit}>{busy ? 'Sending…' : 'Mark done & rate employer'}</Button>
        <p className="text-center text-small text-muted mt-3">
          {gig.employer.split(' ')[0]} then confirms the work — that's what writes the verified reference onto your CV.
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet title="Waiting for confirmation" onClose={onClose}>
      <div className="text-center">
        <div className="text-giant animate-pop" aria-hidden="true">🕓</div>
        <h3 className="text-xl font-extrabold text-navy mt-2 mb-1 tracking-tight">Sent to {gig.employer.split(' ')[0]}<span className="text-red">.</span></h3>
        <p className="text-muted text-small leading-relaxed">
          Your rating is in. As soon as <b className="text-navy">{gig.employer}</b> confirms the work, the reference and your pay are released — and your CV updates on the spot.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">
        <Step done label="You marked the job done and rated the employer" />
        <Step label={`${gig.employer} confirms and rates you`} />
        <Step label="Verified reference added to your CV" last />
      </div>

      <div className="flex gap-2.5 items-start bg-[#eaf3fb] dark:bg-info/10 rounded-xl px-3.5 py-3 mt-4">
        <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
        <span className="text-small text-navy leading-snug">Both sides have to review before pay is released — that's what keeps everyone honest, including your employers.</span>
      </div>

      <Button block variant="navy" className="mt-5" onClick={() => { onClose(); navigate('home'); }}>Got it</Button>
      <button onClick={() => { onClose(); navigate('chat', gig.employerId ?? ''); }} className="w-full text-center text-small text-navy font-bold mt-3 hover:text-red transition">
        Message {gig.employer.split(' ')[0]}
      </button>
    </Sheet>
  );
}

function Step({ label, done, last }: { label: string; done?: boolean; last?: boolean }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center shrink-0">
        <span className={`grid place-items-center w-6 h-6 rounded-full text-small font-extrabold ${done ? 'bg-success text-white' : 'bg-surface border-[1.5px] border-line-strong text-subtle'}`}>
          {done ? '✓' : ''}
        </span>
        {!last && <span className="w-0.5 flex-1 min-h-[18px] bg-line-strong" />}
      </div>
      <span className={`text-small leading-snug ${done ? 'text-navy font-semibold' : 'text-muted'} ${last ? '' : 'pb-3'}`}>{label}</span>
    </div>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-center gap-2.5 my-2" role="radiogroup" aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)}
          className={`text-hero leading-none transition active:scale-90 ${n <= value ? 'grayscale-0 opacity-100 scale-105' : 'grayscale opacity-40'}`}>⭐</button>
      ))}
    </div>
  );
}
