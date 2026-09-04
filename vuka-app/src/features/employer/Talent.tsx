import { useState } from 'react';
import { CATEGORIES, catById } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { Button, EmptyState } from '../../components/ui';
import { TalentCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { EmployerStats, PostJobCard } from './EmployerRail';

export function Talent() {
  const { state, navigate } = useApp();
  const [cat, setCat] = useState<string | null>(null);

  // Real filtering: match workers who list the selected skill/category.
  const workers = cat ? state.talent.filter((w) => (w.skills as string[]).includes(cat)) : state.talent;
  const catLabel = cat ? catById(cat).label : null;

  const railBtn = (active: boolean) =>
    `grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-surface shadow-e1 text-2xl shrink-0 transition active:scale-95 ${
      active ? 'border-2 border-navy' : 'border border-line hover:border-line-strong'
    }`;

  return (
    <Dashboard aside={<><PostJobCard /><EmployerStats /></>}>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">
          {workers.length} verified worker{workers.length !== 1 ? 's' : ''}{catLabel ? ` · ${catLabel}` : ' nearby'}
        </small>
        <h2 className="m-0 mt-0.5 text-head font-extrabold text-navy tracking-tight">Browse talent<span className="text-red">.</span></h2>
      </header>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 mb-3">
        <button onClick={() => setCat(null)} className={`${railBtn(cat === null)} text-navy`} aria-label="All workers" aria-pressed={cat === null}>👥</button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat((v) => (v === c.id ? null : c.id))}
            className={railBtn(cat === c.id)}
            style={{ color: c.color }}
            aria-label={`Filter by ${c.label}`}
            aria-pressed={cat === c.id}
            title={c.label}
          >
            {c.icon}
          </button>
        ))}
      </div>

      {state.dataLoading && state.talent.length === 0
        ? <CardSkeletonGrid count={4} talent />
        : workers.length > 0
        ? <div className="grid sm:grid-cols-2 gap-x-3">{workers.map((w) => <TalentCard key={w.id} worker={w} onClick={() => navigate('workerDetail', w.id)} />)}</div>
        : cat
        ? <EmptyState icon="🔍" title={`No ${catLabel} workers yet`} hint="No verified workers list this skill right now. Try another category or view everyone." action={<Button size="sm" variant="ghost" onClick={() => setCat(null)}>Show all talent</Button>} />
        : <EmptyState icon="👥" title="No workers yet" hint="Verified youth near you will show up here as they join and complete jobs." />}
    </Dashboard>
  );
}
