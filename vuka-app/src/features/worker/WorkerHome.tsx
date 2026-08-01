import { useState } from 'react';
import { CATEGORIES, catById } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { Invitation } from '../../lib/api';
import { Avatar, Button, Card, ProgressBar, SectionTitle } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { GigCard, FormalCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { TrustStrip } from '../../components/bits';
import { ReputationPanel } from './ReputationPanel';

export function WorkerHome() {
  const { state, navigate, setFeed, setCategory } = useApp();
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

      <TrustStrip />

      {state.invitations.length > 0 && (
        <div className="mb-1">
          <SectionTitle>You've been invited</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {state.invitations.map((inv) => <InviteCard key={inv.id} inv={inv} />)}
          </div>
        </div>
      )}

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
          <button key={c.id} onClick={() => { setCategory(c.id); setFeed('gigs'); navigate('jobs'); }} className="flex flex-col items-center gap-1.5 shrink-0">
            <span className="grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-surface border border-line shadow-e1 text-2xl" style={{ color: c.color }} aria-hidden="true">{c.icon}</span>
            <span className="text-[11px] font-semibold text-muted">{c.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle action={<button className="text-[13px] text-red font-bold" onClick={() => { setCategory(null); setFeed('gigs'); navigate('jobs'); }}>See all →</button>}>Gigs near you</SectionTitle>
      {state.dataLoading && state.gigs.length === 0
        ? <CardSkeletonGrid count={2} />
        : featured.length > 0
        ? <div className="grid sm:grid-cols-2 gap-x-3">{featured.map((g) => <GigCard key={g.id} gig={g} onClick={() => navigate('gigDetail', g.id)} />)}</div>
        : <Card className="p-6 text-center text-muted text-[13px]">No open gigs right now — check back soon, or explore the formal jobs you've unlocked.</Card>}

      {teaser && (
        <>
          <SectionTitle action={<button className="text-[13px] text-red font-bold" onClick={() => { setCategory(null); setFeed('formal'); navigate('jobs'); }}>See all →</button>}>Formal jobs</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-x-3"><FormalCard job={teaser} cv={cv} onClick={() => navigate('formalDetail', teaser.id)} /></div>
        </>
      )}

      <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-2">Total earned so far: <b className="text-navy">{money(cv.totalEarned)}</b> across {cv.jobsDone} job{cv.jobsDone !== 1 ? 's' : ''}.</p>
    </Dashboard>
  );
}

/** A pending job invitation from an employer, with accept / decline. */
function InviteCard({ inv }: { inv: Invitation }) {
  const { respondInvitation, navigate, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const c = catById(inv.gig.category);
  const total = inv.gig.hours * inv.gig.payPerHour;

  const respond = async (accept: boolean) => {
    setBusy(true);
    try {
      await respondInvitation(inv.id, accept);
      if (accept) { toast('Invitation accepted 🎉'); navigate('gigDetail', inv.gig.id); }
      else toast('Invitation declined');
    } catch (e) { toast((e as Error).message); setBusy(false); }
  };

  return (
    <Card className="p-4 border-l-4 border-red">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red mb-2"><Icon name="bolt" size={13} /> Job invitation</div>
      <div className="flex gap-3 items-start">
        <span className="grid place-items-center w-11 h-11 rounded-[13px] text-[22px] shrink-0" style={{ background: `${c.color}22`, color: c.color }} aria-hidden="true">{c.icon}</span>
        <div className="flex-1 min-w-0">
          <b className="text-[15px] font-extrabold text-navy leading-tight block tracking-tight">{inv.gig.title}</b>
          <div className="text-[12px] text-muted mt-0.5">{inv.gig.employer} · {inv.gig.location} · <b className="text-navy tnum">{money(total)}</b></div>
        </div>
      </div>
      {inv.message && <p className="text-[12.5px] text-ink italic bg-surface-2 rounded-xl px-3 py-2 mt-2.5 leading-snug">“{inv.message}”</p>}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <Button size="sm" disabled={busy} onClick={() => respond(true)}>{busy ? '…' : 'Accept'}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => respond(false)}>Decline</Button>
      </div>
    </Card>
  );
}
