import { useState } from 'react';
import { CATEGORIES, catById } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { useApp } from '../../store/appStore';
import type { Gig, FormalJob } from '../../types';
import { Button, Card, EmptyState, SectionTitle, Segmented } from '../../components/ui';
import { GigCard, FormalCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { ReputationPanel } from './ReputationPanel';
import { locationSupported } from '../../lib/geo';
import { applyToFormal, applyToGigs, EMPTY_FILTER, FilterBar, type JobFilter } from './JobFilters';

export function JobsFeed() {
  const { state, setFeed, setCategory, navigate, useMyLocation, clearMyLocation } = useApp();
  const cv = computeCv(state.worker);
  const isGigs = state.feed === 'gigs';
  const cat = state.categoryFilter;
  const [filter, setFilter] = useState<JobFilter>(EMPTY_FILTER);

  // Category first, then everything the filter bar asks for.
  const byCat = cat ? state.gigs.filter((g) => g.category === cat) : state.gigs;
  const byCatFormal = cat ? state.formalJobs.filter((f) => f.category === cat) : state.formalJobs;
  const gigs = applyToGigs(byCat, filter);
  const formalJobs = applyToFormal(byCatFormal, filter);
  const catLabel = cat ? catById(cat).label : null;

  return (
    <Dashboard aside={<ReputationPanel />}>
      <header className="mb-3">
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">
          {isGigs
            ? `${gigs.length} gig${gigs.length !== 1 ? 's' : ''}${catLabel ? ` · ${catLabel}` : state.coords ? ' · nearest first' : ` near ${(state.worker.location || 'you').split(',')[0]}`}`
            : `${formalJobs.length} formal role${formalJobs.length !== 1 ? 's' : ''}${catLabel ? ` · ${catLabel}` : ''}`}
        </small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">Find work<span className="text-brand">.</span></h1>
      </header>

      <Segmented
        label="Kind of work"
        value={state.feed}
        onChange={setFeed}
        options={[
          { value: 'gigs', label: <>🔥 Gigs <Cnt n={state.gigs.length} /></> },
          { value: 'formal', label: <>🏢 Formal jobs <Cnt n={state.formalJobs.length} /></> },
        ]}
      />

      <NearMe />

      <FilterBar
        value={filter}
        onChange={setFilter}
        hasCoords={!!state.coords}
        results={isGigs ? gigs.length : formalJobs.length}
      />

      <CategoryBar value={cat} onChange={setCategory} />

      <div className="mt-4">
        {isGigs ? <Gigs list={gigs} /> : <Formal cv={cv} list={formalJobs} />}
      </div>
    </Dashboard>
  );

  /**
   * Distances are only real once the device says where it is, so this is the
   * one place that asks — plainly, and only when tapped. Off, the feed still
   * works on each listing's own estimate; on, it's measured and nearest-first.
   */
  function NearMe() {
    if (!locationSupported()) return null;
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 text-small">
        {state.coords ? (
          <>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill bg-surface-3 text-ink border border-line font-bold px-3 py-1.5">
              📍 Sorted by real distance
            </span>
            <button onClick={clearMyLocation} className="inline-flex items-center min-h-[44px] px-2 -mx-2 text-dim font-semibold underline underline-offset-2 hover:text-ink transition">
              Turn off
            </button>
          </>
        ) : (
          <>
            <button
              onClick={useMyLocation}
              disabled={state.locating}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-line text-ink font-bold px-4 min-h-[44px] hover:bg-surface-2 transition active:scale-95 disabled:opacity-60"
            >
              📍 {state.locating ? 'Finding you…' : 'Show gigs nearest me'}
            </button>
            <span className="text-faint">Distances below are estimates</span>
          </>
        )}
      </div>
    );
  }

  function Gigs({ list }: { list: Gig[] }) {
    if (state.dataLoading && state.gigs.length === 0) return <CardSkeletonGrid count={4} />;
    if (list.length === 0) {
      return cat
        ? <EmptyState icon="🔍" title={`No ${catLabel} gigs right now`} hint="Nothing open in this category yet. Try another category, or see everything." action={<Button size="sm" variant="ghost" onClick={() => setCategory(null)}>Show all gigs</Button>} />
        : <EmptyState icon="✅" title="No open gigs right now" hint="You've applied to or completed everything available. Switch to Formal jobs to see what your tier unlocked." />;
    }
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{list.map((g) => <GigCard key={g.id} gig={g} onClick={() => navigate('gigDetail', g.id)} />)}</div>
        <p className="text-center text-small text-dim leading-relaxed px-4 py-2">New gigs are posted every day. Every completed gig builds your CV and pushes you up the ladder. 🪜</p>
      </>
    );
  }

  function Formal({ cv, list }: { cv: ReturnType<typeof computeCv>; list: FormalJob[] }) {
    if (state.dataLoading && state.formalJobs.length === 0) return <CardSkeletonGrid count={4} />;
    if (list.length === 0) {
      return <EmptyState icon="🔍" title={`No ${catLabel ?? ''} formal roles`} hint="Nothing in this category right now. See all formal roles instead." action={<Button size="sm" variant="ghost" onClick={() => setCategory(null)}>Show all roles</Button>} />;
    }
    const unlocked = list.filter((f) => f.minTier <= cv.tier.id);
    const locked = list.filter((f) => f.minTier > cv.tier.id);
    return (
      <>
        <Card className="p-3.5 mb-3 flex gap-2.5 items-center bg-info-soft border-info dark:border-info">
          <span className="text-title" aria-hidden="true">🪜</span>
          <div className="text-small text-ink leading-snug">
            <b>You're {cv.tier.name} {cv.tier.icon}.</b> {unlocked.length} formal job{unlocked.length !== 1 ? 's' : ''} open to you now{locked.length ? ` · ${locked.length} more unlock as you rise` : ''}.
          </div>
        </Card>
        {unlocked.length > 0 && <><SectionTitle>Open to you now</SectionTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{unlocked.map((f) => <FormalCard key={f.id} job={f} cv={cv} onClick={() => navigate('formalDetail', f.id)} />)}</div></>}
        {locked.length > 0 && <><SectionTitle>Unlock as you rise</SectionTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{locked.map((f) => <FormalCard key={f.id} job={f} cv={cv} onClick={() => navigate('formalDetail', f.id)} />)}</div></>}
        <p className="text-center text-small text-dim leading-relaxed px-4 py-2">Formal employers hire straight from Vuka's higher tiers — your verified record is your application. ⚖️ All pay is fair-pay checked.</p>
      </>
    );
  }
}

/** Horizontal, scrollable category filter. "All" clears the filter. */
function CategoryBar({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const pill = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 rounded-pill border px-4 min-h-[44px] text-small font-bold transition active:scale-95 ${
      active ? 'bg-ink text-canvas border-ink' : 'bg-surface text-dim border-line hover:border-faint hover:text-ink'
    }`;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 -mx-1 px-1">
      <button onClick={() => onChange(null)} className={pill(value === null)}>All</button>
      {CATEGORIES.map((c) => (
        <button key={c.id} onClick={() => onChange(c.id)} className={pill(value === c.id)}>
          <span aria-hidden="true">{c.icon}</span> {c.label}
        </button>
      ))}
    </div>
  );
}

function Cnt({ n }: { n: number }) {
  return <span className="font-mono tnum opacity-70">· {n}</span>;
}
