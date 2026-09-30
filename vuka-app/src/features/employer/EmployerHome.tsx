import { useApp } from '../../store/appStore';
import { Avatar, Button, Card, EmptyState, SectionTitle, TextAction } from '../../components/ui';
import { TalentCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { TrustStrip } from '../../components/bits';
import { EmployerStats, useRichT } from './EmployerRail';
import { useT } from '../../providers/LanguageProvider';

export function EmployerHome() {
  const { state, navigate } = useApp();
  const t = useT();
  const rt = useRichT();
  const top = state.talent.slice(0, 3);
  const verified = state.talent.filter((w) => w.idVerified).length;
  const jobsTotal = state.talent.reduce((sum, w) => sum + w.jobsDone, 0);
  return (
    <Dashboard aside={<EmployerStats />}>
      <header className="flex items-center justify-between mb-3">
        <div>
          <small className="text-faint text-micro font-semibold uppercase tracking-wide">{t('employer.needAHand')}</small>
          <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('employer.home.title')}<span className="text-brand">.</span></h1>
        </div>
        <Avatar initials={t('nav.you')} />
      </header>

      <div className="text-on-feature rounded-[14px] px-3.5 py-2.5 text-small font-semibold flex gap-2 items-center mb-3 feature-band">
        <span className="bg-on-feature text-feature px-2 py-0.5 rounded-full text-micro font-bold">{t('employer.home.safe')}</span>
        {verified > 0
          ? <span>{rt('employer.home.trustCounts', { verified: <b className="font-mono tnum">{verified}</b>, jobs: <b className="font-mono tnum">{jobsTotal}</b> })}</span>
          : <span>{t('employer.home.trustNone')}</span>}
      </div>

      <TrustStrip />

      {state.pendingConfirmations > 0 && (
        <Card className="p-4 mb-3.5 border-l-4 border-brand">
          <b className="text-body text-ink">
            {t('employer.home.waiting', { count: state.pendingConfirmations })}
          </b>
          <p className="text-small text-dim my-1.5 leading-snug">
            {t('employer.home.waitingHint')}
          </p>
          <Button block variant="primary" onClick={() => navigate('hires')}>{t('employer.home.confirmNow')}</Button>
        </Card>
      )}

      <Card className="p-4 mb-3.5">
        <b className="text-body text-ink">{t('employer.home.postFast')}</b>
        <p className="text-small text-dim my-1.5 leading-snug">{t('employer.home.postPitch')}</p>
        <Button block variant={state.pendingConfirmations > 0 ? 'solid' : 'primary'} icon="plus" onClick={() => navigate('post')}>{t('post.title')}</Button>
        <Button block variant="ghost" className="mt-2" onClick={() => navigate('hires')}>{t('employer.home.seeMyJobs')}</Button>
      </Card>

      <SectionTitle action={<TextAction onClick={() => navigate('talent')}>{t('employer.home.browseAll')}</TextAction>}>{t('employer.home.topRated')}</SectionTitle>
      {state.dataLoading && top.length === 0
        ? <CardSkeletonGrid count={2} talent />
        : top.length > 0
        ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{top.map((w) => <TalentCard key={w.id} worker={w} onClick={() => navigate('workerDetail', w.id)} />)}</div>
        : <EmptyState icon="talent" title={t('employer.home.finding')} hint={t('employer.home.findingHint')} />}
    </Dashboard>
  );
}
