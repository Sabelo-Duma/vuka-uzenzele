import { computeCv } from '../../lib/engine';
import { useApp } from '../../store/appStore';
import { Card, EmptyState, SectionTitle, Segmented } from '../../components/ui';
import { GigCard, FormalCard } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { ReputationPanel } from './ReputationPanel';

export function JobsFeed() {
  const { state, setFeed, navigate } = useApp();
  const cv = computeCv(state.worker);
  const isGigs = state.feed === 'gigs';

  return (
    <Dashboard aside={<ReputationPanel />}>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">{isGigs ? `${state.gigs.length} gigs near ${(state.worker.location || 'you').split(',')[0]}` : `${state.formalJobs.length} formal roles`}</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Find work<span className="text-red">.</span></h2>
      </header>

      <Segmented
        value={state.feed}
        onChange={setFeed}
        options={[
          { value: 'gigs', label: <>🔥 Gigs <Cnt n={state.gigs.length} /></> },
          { value: 'formal', label: <>🏢 Formal jobs <Cnt n={state.formalJobs.length} /></> },
        ]}
      />

      <div className="mt-4">
        {isGigs ? <Gigs /> : <Formal cv={cv} />}
      </div>
    </Dashboard>
  );

  function Gigs() {
    if (state.gigs.length === 0) {
      return <EmptyState icon="✅" title="No open gigs right now" hint="You've applied to or completed everything available. Switch to Formal jobs to see what your tier unlocked." />;
    }
    return (
      <>
        <div className="grid sm:grid-cols-2 gap-x-3">{state.gigs.map((g) => <GigCard key={g.id} gig={g} onClick={() => navigate('gigDetail', g.id)} />)}</div>
        <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-2">New gigs are posted every day. Every completed gig builds your CV and pushes you up the ladder. 🪜</p>
      </>
    );
  }

  function Formal({ cv }: { cv: ReturnType<typeof computeCv> }) {
    const unlocked = state.formalJobs.filter((f) => f.minTier <= cv.tier.id);
    const locked = state.formalJobs.filter((f) => f.minTier > cv.tier.id);
    return (
      <>
        <Card className="p-3.5 mb-3 flex gap-2.5 items-center bg-[#eaf3fb] dark:bg-info/10 border-[#cfe3f5] dark:border-info/25">
          <span className="text-xl" aria-hidden="true">🪜</span>
          <div className="text-[12.5px] text-navy leading-snug">
            <b>You're {cv.tier.name} {cv.tier.icon}.</b> {unlocked.length} formal job{unlocked.length !== 1 ? 's' : ''} open to you now{locked.length ? ` · ${locked.length} more unlock as you rise` : ''}.
          </div>
        </Card>
        {unlocked.length > 0 && <><SectionTitle>Open to you now</SectionTitle><div className="grid sm:grid-cols-2 gap-x-3">{unlocked.map((f) => <FormalCard key={f.id} job={f} cv={cv} onClick={() => navigate('formalDetail', f.id)} />)}</div></>}
        {locked.length > 0 && <><SectionTitle>Unlock as you rise</SectionTitle><div className="grid sm:grid-cols-2 gap-x-3">{locked.map((f) => <FormalCard key={f.id} job={f} cv={cv} onClick={() => navigate('formalDetail', f.id)} />)}</div></>}
        <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-2">Formal employers hire straight from Vuka's higher tiers — your verified record is your application. ⚖️ All pay is fair-pay checked.</p>
      </>
    );
  }
}

function Cnt({ n }: { n: number }) {
  return <span className="text-[10px] bg-white/25 px-1.5 rounded-full">{n}</span>;
}
