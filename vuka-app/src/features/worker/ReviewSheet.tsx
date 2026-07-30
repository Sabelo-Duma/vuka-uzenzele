import { useState } from 'react';
import { BADGES } from '../../data/catalog';
import { unlockedFormalCount } from '../../lib/engine';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { Gig } from '../../types';
import { Button, Card, Ring, Sheet } from '../../components/ui';
import { Confetti } from '../../components/Confetti';

interface Outcome {
  tieredUp: boolean;
  newTierName: string;
  newTierIcon: string;
  newTierUnlocks: string;
  rep: number;
  jobsDone: number;
  avg: number;
  totalEarned: number;
  ring: [string, string];
  nextLabel: string;
  newBadges: { icon: string; label: string }[];
  newlyUnlocked: number;
  flagged: boolean;
}

export function ReviewSheet({ gig, onClose }: { gig: Gig; onClose: () => void }) {
  const { completeGig, setFeed, navigate, toast } = useApp();
  const [phase, setPhase] = useState<'review' | 'celebrate'>('review');
  const [rating, setRating] = useState(5);
  const [flag, setFlag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const submit = async () => {
    setBusy(true);
    try {
      const { before, after } = await completeGig(gig.id, rating, flag);
      const tieredUp = after.tier.id > before.tier.id;
      const newBadges = [...after.earnedBadges]
        .filter((b) => !before.earnedBadges.has(b))
        .map((id) => BADGES.find((b) => b.id === id))
        .filter((b): b is (typeof BADGES)[number] => Boolean(b))
        .map((b) => ({ icon: b.icon, label: b.label }));

      setOutcome({
        tieredUp,
        newTierName: after.tier.name,
        newTierIcon: after.tier.icon,
        newTierUnlocks: after.tier.unlocks,
        rep: after.rep,
        jobsDone: after.jobsDone,
        avg: after.avg,
        totalEarned: after.totalEarned,
        ring: after.tier.ring,
        nextLabel: after.nextTier ? `${after.jobsToGo > 0 ? `${after.jobsToGo} job${after.jobsToGo > 1 ? 's' : ''}` : 'rating'} to ${after.nextTier.name}` : 'top tier reached',
        newBadges,
        newlyUnlocked: tieredUp ? unlockedFormalCount(after.tier.id) - unlockedFormalCount(before.tier.id) : 0,
        flagged: flag,
      });
      setPhase('celebrate');
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  if (phase === 'review') {
    return (
      <Sheet title="Rate the job" onClose={onClose}>
        <h3 className="text-xl font-extrabold text-navy m-0 mb-1 tracking-tight">How was the gig?</h3>
        <p className="text-muted text-[13.5px] leading-relaxed mb-4">
          Rate <b>{gig.employer}</b> for “{gig.title}”. They rate you too — that's what builds your CV and lifts your tier.
        </p>
        <RatingInput value={rating} onChange={setRating} />
        <label className="flex gap-2.5 items-start bg-[#fff7ed] dark:bg-warning/10 border border-[#fed7aa] dark:border-warning/30 rounded-2xl p-3 my-4 cursor-pointer">
          <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} className="w-5 h-5 mt-0.5 shrink-0 accent-[var(--gj-danger)]" />
          <span className="text-[12.5px] text-[#9a3412] dark:text-warning leading-snug"><b>I felt unsafe or something went wrong.</b> Flagging alerts our Safety team and is kept confidential. Your safety comes first.</span>
        </label>
        <Button block disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit & update my CV'}</Button>
        <p className="text-center text-[12px] text-muted mt-3">Both reviews must be submitted before pay is released — keeping everyone honest.</p>
      </Sheet>
    );
  }

  const o = outcome!;
  return (
    <Sheet title="Job complete" onClose={() => { onClose(); }}>
      <Confetti />
      {o.tieredUp ? (
        <div className="text-center rounded-[18px] p-4 mb-3.5 text-white" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#123e69)' }}>
          <div className="text-[44px]" aria-hidden="true">{o.newTierIcon}</div>
          <h4 className="m-0 mt-1.5 text-lg font-extrabold tracking-tight">TIER UP — you're now {o.newTierName}!</h4>
          <p className="m-0 text-[12.5px] text-white/85 leading-snug mt-1">{o.newTierUnlocks}</p>
          {o.newlyUnlocked > 0 && <div className="inline-block mt-2.5 text-[12px] font-bold bg-red rounded-full px-3 py-1">🔓 {o.newlyUnlocked} new formal job{o.newlyUnlocked > 1 ? 's' : ''} unlocked</div>}
        </div>
      ) : (
        <div className="text-center">
          <div className="text-[64px] animate-pop" aria-hidden="true">🎉</div>
          <h3 className="text-xl font-extrabold text-navy mt-2 mb-1 tracking-tight">Gig complete — CV updated!</h3>
          <p className="text-muted text-[13.5px] leading-relaxed mb-4">A new verified reference just wrote itself into your CV. Reputation now <b>{o.rep}/100</b>.</p>
        </div>
      )}

      <Card className="p-3.5 flex gap-3.5 items-center mb-3.5">
        <Ring pct={o.rep} colors={o.ring} size={60} stroke={7} gradId="celebRing"><b className="text-base font-extrabold text-navy tnum">{o.rep}</b></Ring>
        <div className="flex-1">
          <b className="text-sm text-navy tnum">{o.jobsDone} jobs · {o.avg.toFixed(1)}★ · {o.newTierIcon} {o.newTierName}</b>
          <div className="text-[12px] text-muted">{money(o.totalEarned)} earned · {o.nextLabel}</div>
        </div>
      </Card>

      {o.newBadges.length > 0 && (
        <div className="text-center mb-3">
          <b className="text-[13px] text-navy">🏅 New badge{o.newBadges.length > 1 ? 's' : ''} unlocked!</b>
          <div className="grid gap-2.5 mt-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(o.newBadges.length, 3)},1fr)` }}>
            {o.newBadges.map((b) => (
              <div key={b.label} className="relative border border-line rounded-[15px] p-3 text-center bg-surface">
                <span className="absolute -top-2 -right-1.5 bg-red text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">NEW</span>
                <div className="text-[26px]" aria-hidden="true">{b.icon}</div>
                <b className="block text-[11.5px] mt-1 text-navy">{b.label}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {o.flagged && (
        <div className="flex gap-2.5 items-start bg-[#fdecef] dark:bg-red/10 border border-[#f5c2cb] dark:border-red/30 rounded-2xl p-3 mb-3.5">
          <span className="text-lg" aria-hidden="true">🛡️</span>
          <span className="text-[12.5px] text-[#991b1b] dark:text-danger leading-snug"><b>Safety flag received.</b> Our team will follow up privately. Thank you for speaking up — you're never penalised for reporting.</span>
        </div>
      )}

      <Button block variant="navy" onClick={() => { onClose(); if (o.tieredUp) { setFeed('formal'); navigate('jobs'); } else { navigate('cv'); } }}>
        {o.tieredUp ? 'See what I unlocked →' : 'See my updated CV →'}
      </Button>
    </Sheet>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-center gap-2.5 my-2" role="radiogroup" aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)}
          className={`text-[38px] leading-none transition active:scale-90 ${n <= value ? 'grayscale-0 opacity-100 scale-105' : 'grayscale opacity-40'}`}>⭐</button>
      ))}
    </div>
  );
}
