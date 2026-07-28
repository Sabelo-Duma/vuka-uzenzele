import { computeCv } from '../../lib/engine';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Button, Card, ProgressBar, Ring } from '../../components/ui';

/** Desktop side-rail: reputation ring, stats, tier progress and ladder link. */
export function ReputationPanel() {
  const { state, navigate } = useApp();
  const cv = computeCv(state.worker);
  const unlockedCount = state.formalJobs.filter((f) => f.minTier <= cv.tier.id).length;

  return (
    <>
      <Card className="p-5 text-center">
        <div className="flex justify-center">
          <Ring pct={cv.rep} colors={cv.tier.ring} size={116} stroke={9} gradId="railRing">
            <b className="text-[26px] font-bold text-navy leading-none">{cv.rep}</b>
            <small className="text-[9px] text-muted font-bold uppercase tracking-wide mt-1">Rep score</small>
          </Ring>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat value={String(cv.jobsDone)} label="Jobs" />
          <Stat value={`${cv.avg.toFixed(1)}★`} label="Rating" />
          <Stat value={money(cv.totalEarned)} label="Earned" />
        </div>
      </Card>

      <Card className="p-4 text-white" style={{ background: 'linear-gradient(160deg,#0E355A,#123e69)' }}>
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/15 text-lg" aria-hidden="true">{cv.tier.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-white/60 uppercase tracking-wide font-bold">Your tier</div>
            <div className="font-bold">{cv.tier.name}</div>
          </div>
          <div className="text-right"><div className="text-lg font-bold leading-none">{unlockedCount}</div><div className="text-[10px] text-white/60">unlocked</div></div>
        </div>
        <div className="text-[12px] text-white/80 my-2.5 leading-snug">
          {cv.nextTier
            ? <>{cv.jobsToGo > 0 ? <><b>{cv.jobsToGo} more job{cv.jobsToGo > 1 ? 's' : ''}</b></> : <><b>Lift your rating</b></>} to reach <b>{cv.nextTier.name}</b> {cv.nextTier.icon}</>
            : <>Top tier reached — employers see you first 🎉</>}
        </div>
        {cv.nextTier && <ProgressBar pct={cv.tierProgress} />}
        <Button block variant="primary" className="mt-3.5" icon="ladder" onClick={() => navigate('cv')}>View my ladder</Button>
      </Card>

      <Card className="p-4">
        <div className="text-[13px] font-bold text-navy mb-1.5">🪜 How the ladder works</div>
        <p className="text-[12px] text-muted leading-relaxed m-0">Complete gigs and earn good ratings to climb tiers. Each tier unlocks better, more formal jobs — cashier, security, call-centre — no matric needed.</p>
      </Card>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-[15px] font-bold text-navy leading-tight">{value}</b><span className="text-[10px] text-muted font-bold uppercase tracking-wide">{label}</span></div>;
}
