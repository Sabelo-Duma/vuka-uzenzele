import { CATEGORIES } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Avatar, Button, Card, ProgressBar, SectionTitle } from '../../components/ui';
import { GigCard, FormalCard } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { ReputationPanel } from './ReputationPanel';

export function WorkerHome() {
  const { state, navigate, setFeed, toast } = useApp();
  const cv = computeCv(state.worker);
  const featured = state.gigs.slice(0, 3);
  const unlockedCount = state.formalJobs.filter((f) => f.minTier <= cv.tier.id).length;
  const lockedFormal = state.formalJobs.filter((f) => f.minTier > cv.tier.id);
  const teaser = lockedFormal[0] ?? state.formalJobs[state.formalJobs.length - 1];

  const nextText = cv.nextTier
    ? <>{cv.jobsToGo === 0 ? <b>Rating up</b> : <b>{cv.jobsToGo} more job{cv.jobsToGo > 1 ? 's' : ''}</b>} to reach <b>{cv.nextTier.name}</b> {cv.nextTier.icon}</>
    : <>You've reached the top tier 🎉</>;

  return (
    <Dashboard aside={<ReputationPanel />}>
      <header className="flex items-center justify-between mb-3">
        <div>
          <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Sawubona 👋</small>
          <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">{(state.worker.name || 'Welcome').split(' ')[0]}, let's hustle<span className="text-red">.</span></h2>
        </div>
        <Avatar initials={state.worker.initials || 'ME'} color={state.worker.color} verified={state.worker.idVerified} tier={cv.tier.icon} />
      </header>

      <div className="bg-navy text-white rounded-[14px] px-3.5 py-2.5 text-[12px] font-semibold flex gap-2 items-center mb-3">
        <span className="bg-red text-white px-2 py-0.5 rounded-full text-[11px] font-bold">FREE DATA</span> Zero-rated — browsing &amp; applying costs you nothing 📶
      </div>

      {/* Tier strip — mobile only; desktop shows the richer rail instead. */}
      <Card className="lg:hidden p-4 text-white mb-1.5" style={{ background: 'linear-gradient(160deg,#0E355A,#123e69)' }}>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-[52px] h-[52px] rounded-[15px] bg-white/15 text-[26px]" aria-hidden="true">{cv.tier.icon}</span>
          <div className="flex-1">
            <small className="text-white/70 text-xs">Your tier</small>
            <h3 className="m-0 text-lg font-bold">{cv.tier.name} · <span className="opacity-80 font-semibold text-sm">{unlockedCount} formal jobs unlocked</span></h3>
          </div>
          <Button size="sm" onClick={() => navigate('cv')}>Ladder</Button>
        </div>
        <div className="text-[12.5px] text-white/85 my-2.5">{nextText}</div>
        <ProgressBar pct={cv.tierProgress} />
      </Card>

      <SectionTitle>What are you good at</SectionTitle>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setFeed('gigs'); navigate('jobs'); toast(`Showing ${c.label} gigs`); }} className="flex flex-col items-center gap-1.5 shrink-0">
            <span className="grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-surface border border-line shadow-e1 text-2xl" style={{ color: c.color }} aria-hidden="true">{c.icon}</span>
            <span className="text-[11px] font-semibold text-muted">{c.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle action={<button className="text-[13px] text-red font-bold" onClick={() => { setFeed('gigs'); navigate('jobs'); }}>See all →</button>}>Gigs near you</SectionTitle>
      {featured.length > 0
        ? <div className="grid sm:grid-cols-2 gap-x-3">{featured.map((g) => <GigCard key={g.id} gig={g} onClick={() => navigate('gigDetail', g.id)} />)}</div>
        : <Card className="p-6 text-center text-muted text-[13px]">No open gigs right now — check back soon, or explore the formal jobs you've unlocked.</Card>}

      {teaser && (
        <>
          <SectionTitle action={<button className="text-[13px] text-red font-bold" onClick={() => { setFeed('formal'); navigate('jobs'); }}>See all →</button>}>Formal jobs</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-x-3"><FormalCard job={teaser} cv={cv} onClick={() => navigate('formalDetail', teaser.id)} /></div>
        </>
      )}

      <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-2">Total earned so far: <b className="text-navy">{money(cv.totalEarned)}</b> across {cv.jobsDone} job{cv.jobsDone !== 1 ? 's' : ''}.</p>
    </Dashboard>
  );
}
