import { useState } from 'react';
import { CATEGORIES, catById } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { Button, EmptyState } from '../../components/ui';
import { TalentCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { EmployerStats, PostJobCard } from './EmployerRail';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';

export function Talent() {
  const { state, navigate } = useApp();
  const t = useT();
  const [cat, setCat] = useState<string | null>(null);

  // Real filtering: match workers who list the selected skill/category.
  const workers = cat ? state.talent.filter((w) => (w.skills as string[]).includes(cat)) : state.talent;
  const catLabel = cat ? catById(cat).label : null;

  const railBtn = (active: boolean) =>
    `grid place-items-center w-[58px] h-[58px] rounded-[18px] bg-surface shadow-e1 text-head shrink-0 transition active:scale-95 ${
      active ? 'border-2 border-brand-solid' : 'border border-line hover:border-faint'
    }`;

  return (
    <Dashboard aside={<><PostJobCard /><EmployerStats /></>}>
      <header className="mb-3">
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">
          {catLabel
            ? t('employer.talent.countIn', { count: workers.length, category: catLabel })
            : t('employer.talent.countNearby', { count: workers.length })}
        </small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('employer.talent.title')}<span className="text-brand">.</span></h1>
      </header>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 mb-3">
        <button onClick={() => setCat(null)} className={`${railBtn(cat === null)} text-ink`} aria-label={t('employer.talent.all')} aria-pressed={cat === null}><Icon name="talent" size={20} /></button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat((v) => (v === c.id ? null : c.id))}
            className={railBtn(cat === c.id)}
            aria-label={t('employer.talent.filterBy', { category: c.label })}
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
        ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{workers.map((w) => <TalentCard key={w.id} worker={w} onClick={() => navigate('workerDetail', w.id)} />)}</div>
        : cat
        ? <EmptyState icon="search" title={t('employer.talent.noneIn', { category: catLabel ?? '' })} hint={t('employer.talent.noneInHint')} action={<Button size="sm" variant="ghost" onClick={() => setCat(null)}>{t('employer.talent.showAll')}</Button>} />
        : <EmptyState icon="talent" title={t('employer.talent.none')} hint={t('employer.talent.noneHint')} />}
    </Dashboard>
  );
}
