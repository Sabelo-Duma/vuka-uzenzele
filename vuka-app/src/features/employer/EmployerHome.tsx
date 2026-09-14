import { useApp } from '../../store/appStore';
import { Avatar, Button, Card, EmptyState, SectionTitle } from '../../components/ui';
import { TalentCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { TrustStrip } from '../../components/bits';
import { EmployerStats } from './EmployerRail';

export function EmployerHome() {
  const { state, navigate } = useApp();
  const top = state.talent.slice(0, 3);
  const verified = state.talent.filter((t) => t.idVerified).length;
  const jobsTotal = state.talent.reduce((sum, t) => sum + t.jobsDone, 0);
  return (
    <Dashboard aside={<EmployerStats />}>
      <header className="flex items-center justify-between mb-3">
        <div>
          <small className="text-faint text-micro font-semibold uppercase tracking-wide">Need a hand today?</small>
          <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">Find trusted help<span className="text-brand">.</span></h1>
        </div>
        <Avatar initials="You" />
      </header>

      <div className="text-on-feature rounded-[14px] px-3.5 py-2.5 text-small font-semibold flex gap-2 items-center mb-3 feature-band">
        <span className="bg-on-feature text-feature px-2 py-0.5 rounded-full text-micro font-bold">SAFE</span>
        {verified > 0
          ? <span><b className="font-mono tnum">{verified}</b> ID-verified workers nearby · <b className="font-mono tnum">{jobsTotal}</b> jobs completed with reviews 🛡️</span>
          : <span>Every worker is ID-verified with a real, reviewed CV and an earned tier 🛡️</span>}
      </div>

      <TrustStrip />

      {state.pendingConfirmations > 0 && (
        <Card className="p-4 mb-3.5 border-l-4 border-brand">
          <b className="text-body text-ink">
            {state.pendingConfirmations} job{state.pendingConfirmations === 1 ? '' : 's'} waiting on you
          </b>
          <p className="text-small text-dim my-1.5 leading-snug">
            A worker has marked the job done. Confirming releases their pay and adds your review to their CV — it's how they build a track record.
          </p>
          <Button block variant="primary" onClick={() => navigate('hires')}>Confirm & rate now</Button>
        </Card>
      )}

      <Card className="p-4 mb-3.5">
        <b className="text-body text-ink">Post a job in 30 seconds</b>
        <p className="text-small text-dim my-1.5 leading-snug">Describe what you need. Verified youth nearby apply — you pick by rating, reviews and tier.</p>
        <Button block variant={state.pendingConfirmations > 0 ? 'solid' : 'primary'} icon="plus" onClick={() => navigate('post')}>Post a job</Button>
        <Button block variant="ghost" className="mt-2" onClick={() => navigate('hires')}>See my jobs & applicants</Button>
      </Card>

      <SectionTitle action={<button className="text-small text-brand font-bold" onClick={() => navigate('talent')}>Browse all →</button>}>Top-rated near you</SectionTitle>
      {state.dataLoading && top.length === 0
        ? <CardSkeletonGrid count={2} talent />
        : top.length > 0
        ? <div className="grid sm:grid-cols-2 gap-x-3">{top.map((w) => <TalentCard key={w.id} worker={w} onClick={() => navigate('workerDetail', w.id)} />)}</div>
        : <EmptyState icon="👥" title="Finding workers near you…" hint="Verified youth in your area will appear here. Post a job to start receiving applications." />}
    </Dashboard>
  );
}
