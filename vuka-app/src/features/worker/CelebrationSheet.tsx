/**
 * The moment a job becomes real.
 *
 * A worker's CV only grows when the EMPLOYER confirms the work, which happens
 * on the employer's phone. So this isn't shown when the worker marks a job done
 * — it's shown when the confirmation actually lands (see the poll in appStore).
 */
import { BADGES } from '../../data/catalog';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { CvSnapshot } from '../../types';
import { Button, Card, Ring, Sheet, useCountUp } from '../../components/ui';
import { Confetti } from '../../components/Confetti';

export function CelebrationSheet() {
  const { state, dismissCelebration, setFeed, navigate } = useApp();
  const celebrate = state.celebrate;
  if (!celebrate) return null;

  const { before, after, jobTitle } = celebrate;
  const tieredUp = after.tier.id > before.tier.id;
  const unlockedAt = (tierId: number) => state.formalJobs.filter((f) => f.minTier <= tierId).length;
  const newBadges = [...after.earnedBadges]
    .filter((b) => !before.earnedBadges.has(b))
    .map((id) => BADGES.find((b) => b.id === id))
    .filter((b): b is (typeof BADGES)[number] => Boolean(b));

  const go = () => {
    dismissCelebration();
    if (tieredUp) { setFeed('formal'); navigate('jobs'); } else navigate('cv');
  };

  return (
    <Sheet title="Job confirmed" onClose={dismissCelebration}>
      <Confetti />
      <Celebrate
        before={before}
        after={after}
        jobTitle={jobTitle}
        tieredUp={tieredUp}
        newlyUnlocked={tieredUp ? unlockedAt(after.tier.id) - unlockedAt(before.tier.id) : 0}
        newBadges={newBadges.map((b) => ({ icon: b.icon, label: b.label }))}
        onGo={go}
      />
    </Sheet>
  );
}

/* Animated reveal: reputation counts up and the ring fills. */
function Celebrate({ before, after, jobTitle, tieredUp, newlyUnlocked, newBadges, onGo }: {
  before: CvSnapshot; after: CvSnapshot; jobTitle: string; tieredUp: boolean;
  newlyUnlocked: number; newBadges: { icon: string; label: string }[]; onGo: () => void;
}) {
  const rep = useCountUp(after.rep, before.rep);
  const shownRep = Math.round(rep);
  const gained = after.rep - before.rep;
  return (
    <>
      {tieredUp ? (
        <div className="text-center rounded-[18px] p-4 mb-3.5 text-white animate-pop relative overflow-hidden" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#123e69)' }}>
          <span aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 50% 0%, rgba(242,0,35,.35), transparent 70%)' }} />
          <div className="relative">
            <div className="text-jumbo animate-pop" aria-hidden="true">{after.tier.icon}</div>
            <h4 className="m-0 mt-1.5 text-lg font-extrabold tracking-tight">TIER UP — you're now {after.tier.name}!</h4>
            <p className="m-0 text-small text-white/85 leading-snug mt-1">{after.tier.unlocks}</p>
            {newlyUnlocked > 0 && <div className="inline-block mt-2.5 text-small font-bold bg-red rounded-full px-3 py-1 animate-pop">🔓 {newlyUnlocked} new formal job{newlyUnlocked > 1 ? 's' : ''} unlocked</div>}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-mega animate-pop" aria-hidden="true">🎉</div>
          <h3 className="text-xl font-extrabold text-navy mt-2 mb-1 tracking-tight">Confirmed — CV updated!</h3>
          <p className="text-muted text-small leading-relaxed mb-4">
            The employer confirmed <b className="text-navy">“{jobTitle}”</b> and left you a verified reference. Reputation now <b className="tnum">{shownRep}/100</b>.
          </p>
        </div>
      )}

      <Card className="p-3.5 flex gap-3.5 items-center mb-3.5">
        <div className="relative shrink-0">
          <Ring pct={rep} colors={after.tier.ring} size={60} stroke={7} gradId="celebRing"><b className="text-base font-extrabold text-navy tnum">{shownRep}</b></Ring>
          {gained > 0 && <span className="absolute -top-1 -right-1 bg-success text-white text-micro font-extrabold px-1.5 py-0.5 rounded-full shadow-e1 animate-pop">+{gained}</span>}
        </div>
        <div className="flex-1">
          <b className="text-sm text-navy tnum">{after.jobsDone} jobs · {after.avg.toFixed(1)}★ · {after.tier.icon} {after.tier.name}</b>
          <div className="text-small text-muted">
            {money(after.totalEarned)} earned · {after.nextTier
              ? `${after.jobsToGo > 0 ? `${after.jobsToGo} job${after.jobsToGo > 1 ? 's' : ''}` : 'rating'} to ${after.nextTier.name}`
              : 'top tier reached'}
          </div>
        </div>
      </Card>

      {newBadges.length > 0 && (
        <div className="text-center mb-3">
          <b className="text-small text-navy">🏅 New badge{newBadges.length > 1 ? 's' : ''} unlocked!</b>
          <div className="grid gap-2.5 mt-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(newBadges.length, 3)},1fr)` }}>
            {newBadges.map((b) => (
              <div key={b.label} className="relative border border-line rounded-[15px] p-3 text-center bg-surface animate-pop">
                <span className="absolute -top-2 -right-1.5 bg-red text-white text-micro font-extrabold px-1.5 py-0.5 rounded-full">NEW</span>
                <div className="text-display" aria-hidden="true">{b.icon}</div>
                <b className="block text-micro mt-1 text-navy">{b.label}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button block variant="navy" onClick={onGo}>
        {tieredUp ? 'See what I unlocked →' : 'See my updated CV →'}
      </Button>
    </>
  );
}
