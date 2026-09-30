import { useState } from 'react';
import { TIERS } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { distanceLabel } from '../../lib/geo';
import { useApp } from '../../store/appStore';
import { Button, Card, EmptyState } from '../../components/ui';
import { DetailHeader, Hero, KV, PayBox, PerkList, StickyCta } from '../../components/bits';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';
import { fill } from './fill';

export function FormalDetail({ id }: { id: string }) {
  const { state, toast, navigate, goBack, setFeed, applyFormal } = useApp();
  const t = useT();
  const job = state.formalJobs.find((f) => f.id === id);
  const applied = state.appliedFormalIds.includes(id);
  const [applying, setApplying] = useState(false);

  const apply = async () => {
    setApplying(true);
    try {
      await applyFormal(id);
      toast(t('worker.formal.appliedToast', { title: job?.title ?? t('worker.formal.thisRole') }));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setApplying(false);
    }
  };

  if (!job) {
    return (
      <>
        <DetailHeader title={t('worker.formal.title')} onBack={() => goBack('jobs')} />
        <EmptyState icon="search" title={t('worker.formal.notFound')} hint={t('worker.formal.notFoundHint')} action={<Button onClick={() => { setFeed('formal'); navigate('jobs'); }}>{t('worker.formal.back')}</Button>} />
      </>
    );
  }

  const cv = computeCv(state.worker);
  const unlocked = job.minTier <= cv.tier.id;
  const reqTier = TIERS[job.minTier];
  const jobsNeeded = Math.max(0, reqTier.minJobs - cv.jobsDone);

  return (
    <>
      <DetailHeader title={t('worker.formal.title')} onBack={() => goBack('jobs')} />
      <Hero
        eyebrow={`${job.employer} · ${job.type}`}
        title={job.title}
        sub={<><Icon name="pin" size={13} /> {job.location}{distanceLabel(job.distanceKm, job.distanceSource) ? ` · ${distanceLabel(job.distanceKm, job.distanceSource)}` : ''}</>}
      >
        <PayBox cells={[{ label: t('jobs.payLabel'), value: job.salary }, { label: t('worker.formal.type'), value: job.type }]} />
      </Hero>

      <Card className="p-4 my-4">
        <KV k={t('record.education')}>{job.education}</KV>
        <KV k={t('worker.formal.access')}>
          {unlocked
            ? <span className="text-verified flex items-center gap-1.5"><Icon name="check" size={15} /> {t('worker.formal.openToYou', { tier: cv.tier.name })}</span>
            : <span className="flex items-center gap-1.5" style={{ color: 'var(--v-brand)' }}><Icon name="lock" size={15} /> {t('worker.formal.tierRequired', { tier: reqTier.name, icon: reqTier.icon })}</span>}
        </KV>
      </Card>

      <div className="pb-2">
        <p className="text-ink leading-relaxed text-small m-0">{job.description}</p>
        <PerkList perks={job.perks} />
      </div>

      {!unlocked && (
        <Card className="p-4 my-4 text-on-feature feature-band">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-[13px] bg-white/15 text-title"><Icon name="lock" size={20} /></span>
            <div><small className="text-on-feature-dim text-micro uppercase tracking-wide">{t('worker.formal.locked')}</small><h3 className="font-display m-0 text-lead font-bold">{t('worker.formal.reach', { tier: reqTier.name, icon: reqTier.icon })}</h3></div>
          </div>
          {/* Same shape as the ladder's own chips, and for the same reason:
              a rating over a threshold reads as a fraction out of that
              threshold, and ratings are out of five. See CvLadder. */}
          <div className="flex gap-2 mt-3">
            <Req ok={cv.jobsDone >= reqTier.minJobs} label={t('worker.reqJobs', { jobs: reqTier.minJobs })} value={String(cv.jobsDone)} />
            <Req ok={cv.avg >= reqTier.minRating} label={t('worker.reqRating', { rating: reqTier.minRating.toFixed(1) })} value={cv.avg === 0 ? '—' : `${cv.avg.toFixed(1)}★`} />
            <Req ok={cv.flags <= reqTier.maxFlags} label={t('worker.formal.flags')} value={String(cv.flags)} />
          </div>
          <p className="text-small text-on-feature-dim leading-snug mt-3 mb-0">
            {jobsNeeded > 0
              ? <>{fill(t('worker.formal.completeMore'), { jobs: <b>{t('worker.formal.moreGoodJobs', { count: jobsNeeded })}</b> })}</>
              : <>{fill(t('worker.formal.liftRating'), { rating: <b>{reqTier.minRating.toFixed(1)}★</b> })}</>}
          </p>
        </Card>
      )}

      <StickyCta>
        {unlocked ? (
          <>
            <Button block variant="primary" disabled={applied || applying} onClick={apply}>
              {applied ? t('worker.formal.applied') : applying ? t('worker.formal.sending') : t('worker.formal.apply')}
            </Button>
            <p className="text-center text-small text-dim mt-2">
              {applied
                ? <>{t('worker.formal.savedNote', { employer: job.employer })}</>
                : <>{t('worker.formal.applyNote')}</>}
            </p>
          </>
        ) : (
          <Button block icon="ladder" onClick={() => navigate('cv')}>{t('worker.formal.howUnlock')}</Button>
        )}
      </StickyCta>
    </>
  );
}

function Req({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex-1 rounded-chip p-2 text-center bg-white/10">
      <small className="block text-micro text-on-feature-dim uppercase tracking-wide">{label}</small>
      <b className={`text-small font-mono tnum ${ok ? 'text-on-feature-ok' : 'text-on-feature'}`}>{value}</b>
    </div>
  );
}
