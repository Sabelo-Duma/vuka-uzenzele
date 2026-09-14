import { computeCv } from '../../lib/engine';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Button, Card, ProgressBar } from '../../components/ui';
import { ScoreDial } from './VukaScore';

/** Desktop side-rail: reputation ring, stats, tier progress and ladder link. */
export function ReputationPanel() {
  const { state, navigate } = useApp();
  const cv = computeCv(state.worker);
  const unlockedCount = state.formalJobs.filter((f) => f.minTier <= cv.tier.id).length;

  return (
    <>
      <Card className="p-5 text-center">
        <div className="flex justify-center">
          <ScoreDial cv={cv} size={116} stroke={9} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat value={String(cv.jobsDone)} label="Jobs" />
          <Stat value={`${cv.avg.toFixed(1)}★`} label="Rating" />
          <Stat value={money(cv.totalEarned)} label="Earned" />
        </div>
      </Card>

      <Card className="p-4 text-on-feature feature-band">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/15 text-lead" aria-hidden="true">{cv.tier.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-micro text-on-feature-dim uppercase tracking-wide font-bold">Your tier</div>
            <div className="font-bold">{cv.tier.name}</div>
          </div>
          <div className="text-right"><div className="text-lead font-bold leading-none">{unlockedCount}</div><div className="text-micro text-on-feature-dim">unlocked</div></div>
        </div>
        <div className="text-small text-on-feature-dim my-2.5 leading-snug">
          {cv.nextTier
            ? <>{cv.jobsToGo > 0 ? <><b>{cv.jobsToGo} more job{cv.jobsToGo > 1 ? 's' : ''}</b></> : <><b>Lift your rating</b></>} to reach <b>{cv.nextTier.name}</b> {cv.nextTier.icon}</>
            : <>Top tier reached — employers see you first 🎉</>}
        </div>
        {cv.nextTier && <ProgressBar pct={cv.tierProgress} label={`Progress to ${cv.nextTier.name}`} />}
        <Button block variant="primary" className="mt-3.5" icon="ladder" onClick={() => navigate('cv')}>Open My Record</Button>
      </Card>

      <Card className="p-4">
        <div className="text-small font-bold text-ink mb-1.5">🪜 How The Ladder works</div>
        <p className="text-small text-dim leading-relaxed m-0">Complete gigs and earn good ratings to climb tiers. Each tier unlocks better, more formal jobs — cashier, security, call-centre — no matric needed.</p>
      </Card>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-body font-extrabold text-ink leading-tight font-mono tnum">{value}</b><span className="text-micro text-dim font-bold uppercase tracking-wide">{label}</span></div>;
}
