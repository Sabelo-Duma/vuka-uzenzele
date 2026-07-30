import { useApp } from '../../store/appStore';
import { Avatar, Button, Card, EmptyState, SectionTitle } from '../../components/ui';
import { TalentCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { EmployerStats } from './EmployerRail';

export function EmployerHome() {
  const { state, navigate } = useApp();
  const top = state.talent.slice(0, 3);
  return (
    <Dashboard aside={<EmployerStats />}>
      <header className="flex items-center justify-between mb-3">
        <div>
          <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Need a hand today?</small>
          <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Find trusted help<span className="text-red">.</span></h2>
        </div>
        <Avatar initials="You" color="var(--gj-navy)" />
      </header>

      <div className="text-white rounded-[14px] px-3.5 py-2.5 text-[12px] font-semibold flex gap-2 items-center mb-3" style={{ background: 'linear-gradient(90deg,#3b0764,#5B21B6)' }}>
        <span className="bg-white text-[#6d28d9] px-2 py-0.5 rounded-full text-[11px] font-bold">SAFE</span> Every worker is ID-verified with a real, reviewed CV and an earned tier 🛡️
      </div>

      <Card className="p-4 mb-3.5" style={{ background: 'linear-gradient(150deg,#faf5ff,var(--gj-bg))' }}>
        <b className="text-[15px] text-navy">Post a job in 30 seconds</b>
        <p className="text-[13px] text-muted my-1.5 leading-snug">Describe what you need. Verified youth nearby apply — you pick by rating, reviews and tier.</p>
        <Button block variant="navy" icon="plus" onClick={() => navigate('post')}>Post a job</Button>
      </Card>

      <SectionTitle action={<button className="text-[13px] text-red font-bold" onClick={() => navigate('talent')}>Browse all →</button>}>Top-rated near you</SectionTitle>
      {state.dataLoading && top.length === 0
        ? <CardSkeletonGrid count={2} talent />
        : top.length > 0
        ? <div className="grid sm:grid-cols-2 gap-x-3">{top.map((w) => <TalentCard key={w.id} worker={w} onClick={() => navigate('workerDetail', w.id)} />)}</div>
        : <EmptyState icon="👥" title="Finding workers near you…" hint="Verified youth in your area will appear here. Post a job to start receiving applications." />}
    </Dashboard>
  );
}
