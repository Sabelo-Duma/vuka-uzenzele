import { CATEGORIES } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { EmptyState } from '../../components/ui';
import { TalentCard } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { EmployerStats, PostJobCard } from './EmployerRail';

export function Talent() {
  const { state, navigate } = useApp();
  return (
    <Dashboard aside={<><PostJobCard /><EmployerStats /></>}>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">{state.talent.length} verified workers nearby</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Browse talent<span className="text-red">.</span></h2>
      </header>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 mb-3">
        <span className="grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-surface border border-navy shadow-e1 text-2xl text-navy shrink-0" aria-hidden="true">👥</span>
        {CATEGORIES.map((c) => (
          <span key={c.id} className="grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-surface border border-line shadow-e1 text-2xl shrink-0" style={{ color: c.color }} aria-hidden="true">{c.icon}</span>
        ))}
      </div>

      {state.talent.length > 0
        ? <div className="grid sm:grid-cols-2 gap-x-3">{state.talent.map((w) => <TalentCard key={w.id} worker={w} onClick={() => navigate('workerDetail', w.id)} />)}</div>
        : <EmptyState icon="👥" title="No workers yet" hint="Verified youth near you will show up here as they join and complete jobs." />}
    </Dashboard>
  );
}
