import { useState } from 'react';
import { catById, minWagePerHour, autoReleaseHours } from '../../data/catalog';
import { money, timeToAutoConfirm } from '../../lib/format';
import { distanceLabel } from '../../lib/geo';
import { useApp } from '../../store/appStore';
import { Avatar, Button, Card, EmptyState, Stars } from '../../components/ui';
import { DetailHeader, FairMeter, Hero, KV, PayBox, StickyCta } from '../../components/bits';
import { FollowButton } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';
import { ReviewSheet } from './ReviewSheet';
import { WorkerFundingPanel } from '../../components/Funding';
import { useT } from '../../providers/LanguageProvider';
import { fill } from './fill';

export function GigDetail({ id }: { id: string }) {
  const { state, applyGig, toast, navigate, goBack } = useApp();
  const t = useT();
  const [reviewing, setReviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  // A gig leaves the open feed once it's filled, so a worker's own work is
  // looked up from `myJobs` too — otherwise the job you were hired for vanishes.
  const mine = state.myJobs.find((j) => j.gig.id === id);
  const gig = state.gigs.find((g) => g.id === id) ?? mine?.gig;

  if (!gig) {
    return (
      <>
        <DetailHeader title={t('worker.gig.details')} onBack={() => goBack('jobs')} />
        <EmptyState icon="search" title={t('worker.gig.gone')} hint={t('worker.gig.goneHint')} action={<Button onClick={() => navigate('jobs')}>{t('worker.gig.backToGigs')}</Button>} />
      </>
    );
  }

  const c = catById(gig.category);
  const total = gig.hours * gig.payPerHour;
  const status = mine?.status ?? (state.appliedGigIds.includes(gig.id) ? 'applied' : null);
  const autoConfirm = timeToAutoConfirm(mine?.workerDoneAt, autoReleaseHours());
  const employerFirstName = gig.employer.split(' ')[0];

  return (
    <>
      <DetailHeader title={t('worker.gig.details')} onBack={() => goBack('jobs')} />
      <Hero
        eyebrow={t('worker.gig.eyebrow', { icon: c.icon, category: c.label })}
        title={gig.title}
        sub={<><Icon name="pin" size={13} /> {gig.location}{distanceLabel(gig.distanceKm, gig.distanceSource) ? ` · ${distanceLabel(gig.distanceKm, gig.distanceSource)}` : ''} · {gig.when}</>}
      >
        <PayBox cells={[
          { label: t('worker.gig.youEarn'), value: money(total) },
          { label: t('worker.gig.rate'), value: t('worker.perHour', { amount: money(gig.payPerHour) }) },
          { label: t('worker.gig.time'), value: t('worker.gig.hrs', { hours: gig.hours }) },
        ]} />
      </Hero>

      <div className="py-4">
        <WorkerFundingPanel gig={gig} />
        <FairMeter ratePerHour={gig.payPerHour} minWage={minWagePerHour()} />
        <p className="text-ink leading-relaxed text-small m-0">{gig.description}</p>
      </div>

      <Card className="p-4 mb-4">
        <KV k={t('worker.gig.postedBy')}><Avatar initials={gig.employerInitials} size="sm" /> {gig.employer}</KV>
        <KV k={t('worker.gig.employerRating')}>
          {gig.employerRating === null
            ? <span className="text-dim">{t('worker.gig.newEmployer')}</span>
            : <><Stars rating={gig.employerRating} /> <span className="font-mono tnum">{gig.employerRating.toFixed(1)}</span> <span className="text-dim font-mono tnum">({gig.employerRatingCount})</span></>}
        </KV>
        {/* This said "ID-verified employer" on every gig, whether or not the
            employer had verified anything. A safety badge that is always shown
            tells a worker nothing and is worse than showing none, because they
            act on it when deciding whose address to go to. */}
        <KV k={t('worker.gig.safety')}>
          {gig.employerVerified
            ? <span className="text-verified flex items-center gap-1.5"><Icon name="shield" size={14} /> {t('worker.idVerifiedSaId')}</span>
            : <span className="text-dim flex items-center gap-1.5"><Icon name="shield" size={14} /> {t('worker.gig.notVerified')}</span>}
        </KV>
        {gig.employerId && (
          <div className="mt-3.5 flex flex-col gap-2.5">
            <FollowButton userId={gig.employerId} />
            <Button variant="ghost" icon="chat" block onClick={() => navigate('chat', gig.employerId!)}>{t('worker.message', { name: gig.employer.split(' ')[0] })}</Button>
          </div>
        )}
      </Card>

      <StickyCta>
        {status === 'applied' && (
          <>
            <Button block variant="ghost" icon="clock" disabled>{t('worker.gig.appliedWaiting', { name: employerFirstName })}</Button>
            <p className="text-center text-small text-dim mt-2">{t('worker.gig.appliedNote', { name: employerFirstName })}</p>
          </>
        )}
        {status === 'not_selected' && (
          <>
            <Button block variant="ghost" onClick={() => navigate('jobs')}>{t('worker.gig.browseOther')}</Button>
            <p className="text-center text-small text-dim mt-2">{t('worker.gig.notSelected', { name: employerFirstName })}</p>
          </>
        )}
        {status === 'hired' && (
          <>
            <Button block variant="primary" icon="check" onClick={() => setReviewing(true)}>{t('worker.gig.finishedJob')}</Button>
            <p className="text-center text-small text-dim mt-2">{t('worker.gig.hiredNote', { name: employerFirstName })}</p>
          </>
        )}
        {status === 'worker_done' && (
          <>
            <Button block variant="ghost" icon="clock" disabled>{t('worker.waitingConfirm', { name: employerFirstName })}</Button>
            <p className="text-center text-small text-dim mt-2">{t('worker.gig.doneNote', { name: employerFirstName })}</p>
            {autoConfirm && (
              <p className="text-center text-small text-dim mt-1.5">
                {fill(t('worker.gig.autoNote'), { when: <b className="text-ink">{autoConfirm.text}</b> })}
              </p>
            )}
          </>
        )}
        {status === 'completed' && (
          <>
            <Button block variant="ghost" onClick={() => navigate('cv')}>{t('worker.gig.seeOnRecord')}</Button>
            <p className="text-center text-small text-dim mt-2">
              {mine?.employerRatingOfMe
                ? t('worker.gig.confirmedByRated', { name: employerFirstName, rating: mine.employerRatingOfMe })
                : t('worker.gig.confirmedBy', { name: employerFirstName })}
            </p>
          </>
        )}
        {status === null && (
          <Button block disabled={applying} onClick={async () => {
            setApplying(true);
            try { await applyGig(gig.id); toast(t('worker.gig.appliedToast')); }
            catch (e) { toast((e as Error).message); setApplying(false); }
          }}>
            {applying ? t('worker.gig.applying') : t('worker.gig.applyFree')}
          </Button>
        )}
      </StickyCta>

      {reviewing && <ReviewSheet gig={gig} onClose={() => setReviewing(false)} />}
    </>
  );
}
