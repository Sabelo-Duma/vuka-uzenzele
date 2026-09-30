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
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';

export function JobsFeed() {
  const { state, setFeed, setCategory, navigate, useMyLocation, clearMyLocation } = useApp();
  const t = useT();
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
            ? catLabel
              ? t('worker.feed.gigsCat', { count: gigs.length, category: catLabel })
              : state.coords
                ? t('worker.feed.gigsNearest', { count: gigs.length })
                : state.worker.location
                  ? t('worker.feed.gigsNear', { count: gigs.length, place: state.worker.location.split(',')[0] })
                  : t('worker.feed.gigsNearYou', { count: gigs.length })
            : catLabel
              ? t('worker.feed.formalCat', { count: formalJobs.length, category: catLabel })
              : t('worker.feed.formal', { count: formalJobs.length })}
        </small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('jobs.title')}<span className="text-brand">.</span></h1>
      </header>

      <Segmented
        label={t('worker.feed.kindOfWork')}
        value={state.feed}
        onChange={setFeed}
        options={[
          { value: 'gigs', label: <>{t('worker.feed.gigs')} <Cnt n={state.gigs.length} /></> },
          { value: 'formal', label: <>{t('worker.formalJobs')} <Cnt n={state.formalJobs.length} /></> },
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
              <Icon name="pin" size={15} /> {t('worker.feed.sortedReal')}
            </span>
            <button onClick={clearMyLocation} className="inline-flex items-center min-h-[44px] px-2 -mx-2 text-dim font-semibold underline underline-offset-2 hover:text-ink transition">
              {t('worker.feed.turnOff')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={useMyLocation}
              disabled={state.locating}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-line text-ink font-bold px-4 min-h-[44px] hover:bg-surface-2 transition active:scale-95 disabled:opacity-60"
            >
              <Icon name="pin" size={16} /> {state.locating ? t('worker.feed.finding') : t('worker.showNearest')}
            </button>
            <span className="text-faint">{t('worker.feed.estimates')}</span>
          </>
        )}
      </div>
    );
  }

  function Gigs({ list }: { list: Gig[] }) {
    if (state.dataLoading && state.gigs.length === 0) return <CardSkeletonGrid count={4} />;
    if (list.length === 0) {
      return cat
        ? <EmptyState icon="search" title={t('worker.feed.noCatGigs', { category: catLabel ?? '' })} hint={t('worker.feed.noCatGigsHint')} action={<Button size="sm" variant="ghost" onClick={() => setCategory(null)}>{t('worker.feed.showAllGigs')}</Button>} />
        : <EmptyState icon="check" title={t('worker.feed.noGigs')} hint={t('worker.feed.noGigsHint')} />;
    }
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{list.map((g) => <GigCard key={g.id} gig={g} onClick={() => navigate('gigDetail', g.id)} />)}</div>
        <p className="text-center text-small text-dim leading-relaxed px-4 py-2">{t('worker.feed.gigsFoot')}</p>
      </>
    );
  }

  function Formal({ cv, list }: { cv: ReturnType<typeof computeCv>; list: FormalJob[] }) {
    if (state.dataLoading && state.formalJobs.length === 0) return <CardSkeletonGrid count={4} />;
    if (list.length === 0) {
      return <EmptyState icon="search" title={t('worker.feed.noCatFormal', { category: catLabel ?? '' })} hint={t('worker.feed.noCatFormalHint')} action={<Button size="sm" variant="ghost" onClick={() => setCategory(null)}>{t('worker.feed.showAllRoles')}</Button>} />;
    }
    const unlocked = list.filter((f) => f.minTier <= cv.tier.id);
    const locked = list.filter((f) => f.minTier > cv.tier.id);
    return (
      <>
        <Card className="p-3.5 mb-3 flex gap-2.5 items-center bg-info-soft border-info dark:border-info">
          <span className="text-info shrink-0" aria-hidden="true"><Icon name="ladder" size={22} /></span>
          <div className="text-small text-ink leading-snug">
            <b>{t('worker.feed.youAre', { tier: cv.tier.name, icon: cv.tier.icon })}</b> {locked.length
              ? t('worker.feed.openNowMore', { count: unlocked.length, locked: locked.length })
              : t('worker.feed.openNow', { count: unlocked.length })}
          </div>
        </Card>
        {unlocked.length > 0 && <><SectionTitle>{t('worker.feed.openToYou')}</SectionTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{unlocked.map((f) => <FormalCard key={f.id} job={f} cv={cv} onClick={() => navigate('formalDetail', f.id)} />)}</div></>}
        {locked.length > 0 && <><SectionTitle>{t('worker.feed.unlockAsRise')}</SectionTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{locked.map((f) => <FormalCard key={f.id} job={f} cv={cv} onClick={() => navigate('formalDetail', f.id)} />)}</div></>}
        <p className="text-center text-small text-dim leading-relaxed px-4 py-2">{t('worker.feed.formalFoot')}</p>
      </>
    );
  }
}

/** Horizontal, scrollable category filter. "All" clears the filter. */
function CategoryBar({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const t = useT();
  const pill = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 rounded-pill border px-4 min-h-[44px] text-small font-bold transition active:scale-95 ${
      active ? 'bg-ink text-canvas border-ink' : 'bg-surface text-dim border-line hover:border-faint hover:text-ink'
    }`;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pt-3 -mx-1 px-1">
      <button onClick={() => onChange(null)} className={pill(value === null)}>{t('worker.feed.all')}</button>
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
