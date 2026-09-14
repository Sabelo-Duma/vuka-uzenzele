import { useState } from 'react';
import { TIERS } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { distanceLabel } from '../../lib/geo';
import { useApp } from '../../store/appStore';
import { Button, Card, EmptyState } from '../../components/ui';
import { DetailHeader, Hero, KV, PayBox, PerkList, StickyCta } from '../../components/bits';
import { Icon } from '../../components/Icon';

export function FormalDetail({ id }: { id: string }) {
  const { state, toast, navigate, setFeed, applyFormal } = useApp();
  const job = state.formalJobs.find((f) => f.id === id);
  const applied = state.appliedFormalIds.includes(id);
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    setApplying(true);
    try {
      await applyFormal(id);
      toast(`Applied ✓ — your verified CV is on file for ${job?.title ?? 'this role'}`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <>
        <DetailHeader title="Formal job" onBack={() => navigate('jobs')} />
        <EmptyState icon="🔍" title="Job not found" hint="This role may have been removed. Browse the formal jobs board for other opportunities." action={<Button onClick={() => { setFeed('formal'); navigate('jobs'); }}>Back to formal jobs</Button>} />
      </>
    );
  }

  const cv = computeCv(state.worker);
  const unlocked = job.minTier <= cv.tier.id;
  const reqTier = TIERS[job.minTier];
  const jobsNeeded = Math.max(0, reqTier.minJobs - cv.jobsDone);

  return (
    <>
      <DetailHeader title="Formal job" onBack={() => navigate('jobs')} />
      <Hero
        eyebrow={`🏢 ${job.employer} · ${job.type}`}
        title={job.title}
        sub={<><Icon name="pin" size={13} /> {job.location}{distanceLabel(job.distanceKm, job.distanceSource) ? ` · ${distanceLabel(job.distanceKm, job.distanceSource)}` : ''}</>}
      >
        <PayBox cells={[{ label: 'Pay', value: job.salary }, { label: 'Type', value: job.type }]} />
      </Hero>

      <Card className="p-4 my-4">
        <KV k="Education">🎓 {job.education}</KV>
        <KV k="Access">
          {unlocked
            ? <span className="text-verified flex items-center gap-1.5"><Icon name="check" size={15} /> Open to you ({cv.tier.name})</span>
            : <span className="flex items-center gap-1.5" style={{ color: 'var(--v-brand)' }}><Icon name="lock" size={15} /> {reqTier.name} tier {reqTier.icon} required</span>}
        </KV>
      </Card>

      <div className="pb-2">
        <p className="text-ink leading-relaxed text-small m-0">{job.description}</p>
        <PerkList perks={job.perks} />
      </div>

      {!unlocked && (
        <Card className="p-4 my-4 text-on-feature feature-band">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-[13px] bg-white/15 text-title"><Icon name="lock" size={20} /></span>
            <div><small className="text-on-feature-dim text-micro uppercase tracking-wide">Locked</small><h3 className="font-display m-0 text-lead font-bold">Reach {reqTier.name} {reqTier.icon}</h3></div>
          </div>
          <div className="flex gap-2 mt-3">
            <Req ok={cv.jobsDone >= reqTier.minJobs} label="Jobs done" value={`${cv.jobsDone}/${reqTier.minJobs}`} />
            <Req ok={cv.avg >= reqTier.minRating} label="Rating" value={`${cv.avg.toFixed(1)}/${reqTier.minRating.toFixed(1)}`} />
            <Req ok={cv.flags <= reqTier.maxFlags} label="Flags" value={`${cv.flags}`} />
          </div>
          <p className="text-small text-on-feature-dim leading-snug mt-3 mb-0">
            {jobsNeeded > 0
              ? <>Complete <b>{jobsNeeded} more good job{jobsNeeded > 1 ? 's' : ''}</b> and keep your rating up — this role is then yours to apply for.</>
              : <>Lift your average rating to <b>{reqTier.minRating.toFixed(1)}★</b> to unlock.</>}
          </p>
        </Card>
      )}

      <StickyCta>
        {unlocked ? (
          <>
            <Button block variant="primary" disabled={applied || applying} onClick={apply}>
              {applied ? '✓ Applied' : applying ? 'Sending your CV…' : 'Apply with my verified CV'}
            </Button>
            <p className="text-center text-small text-dim mt-2">
              {applied
                ? <>Your verified CV is saved for this role. We'll notify you when {job.employer} shortlists.</>
                : <>Your Vuka CV, references and tier are sent as your application — no paperwork.</>}
            </p>
          </>
        ) : (
          <Button block icon="ladder" onClick={() => navigate('cv')}>See how to unlock this</Button>
        )}
      </StickyCta>
    </>
  );
}

function Req({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex-1 rounded-chip p-2 text-center bg-white/10">
      <small className="block text-micro text-on-feature-dim uppercase tracking-wide">{label}</small>
      <b className={`text-small font-mono tnum ${ok ? 'text-on-feature-ok' : 'text-on-feature'}`}>{value}</b>
    </div>
  );
}
