import { useState } from 'react';
import { CATEGORIES, catById, autoReleaseHours } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { money, timeToAutoConfirm } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { Invitation, MyJob } from '../../lib/api';
import { Avatar, Button, Card, ProgressBar, SectionTitle, Tile, TextAction } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { GigCard, FormalCard, CardSkeletonGrid } from '../../components/cards';
import { Dashboard } from '../../components/Dashboard';
import { TrustStrip } from '../../components/bits';
import { ReputationPanel } from './ReputationPanel';
import { useT } from '../../providers/LanguageProvider';
import { fill } from './fill';

export function WorkerHome() {
  const { state, navigate, setFeed, setCategory } = useApp();
  const t = useT();
  const cv = computeCv(state.worker);
  const featured = state.gigs.slice(0, 3);
  const unlockedCount = state.formalJobs.filter((f) => f.minTier <= cv.tier.id).length;
  const lockedFormal = state.formalJobs.filter((f) => f.minTier > cv.tier.id);
  const teaser = lockedFormal[0] ?? state.formalJobs[state.formalJobs.length - 1];

  // Work that still needs something to happen: you're on it, or you're waiting
  // on the employer to confirm.
  const activeWork = state.myJobs.filter((j) => j.status === 'hired' || j.status === 'worker_done');
  // Finished but not yet confirmed: earned, not yet paid. Worth naming.
  const awaitingPayment = activeWork
    .filter((j) => j.status === 'worker_done')
    .reduce((sum, j) => sum + j.gig.hours * j.gig.payPerHour, 0);

  const nextText = cv.nextTier
    ? <>{fill(t('worker.toReach'), {
        what: cv.jobsToGo === 0 ? <b>{t('worker.home.ratingUp')}</b> : <b>{t('worker.moreJobs', { count: cv.jobsToGo })}</b>,
        tier: <b>{cv.nextTier.name}</b>,
      })} {cv.nextTier.icon}</>
    : <>{t('worker.home.topReached')}</>;

  return (
    <Dashboard aside={<ReputationPanel />}>
      <header className="flex items-center justify-between mb-3">
        <div>
          <small className="text-faint text-micro font-semibold uppercase tracking-wide">Sawubona</small>
          <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('worker.home.greeting', { name: (state.worker.name || t('worker.home.welcome')).split(' ')[0] })}<span className="text-brand">.</span></h1>
        </div>
        <Avatar initials={state.worker.initials || 'ME'} verified={state.worker.idVerified} tier={cv.tier.icon} />
      </header>

      {/* Money first, then work, then everything else.
          Nobody opens this screen to look at a badge — they open it because they
          need to earn. So the top of the screen is the sentence a worker would
          actually repeat to a friend ("I've made R2 480 on here"), and the one
          red button on the screen takes them straight to more of it. The tier
          card and the trust and low-data strips still say true and useful
          things; they just don't get to stand between arrival and work. */}

      <Card className="p-4 mb-3 text-on-feature feature-band">
        <small className="text-micro font-extrabold uppercase tracking-widest text-on-feature-dim">{t('worker.home.earnedOnVuka')}</small>
        <div className="font-display text-hero font-extrabold tracking-tight leading-none font-mono tnum mt-1">{money(cv.totalEarned)}</div>
        <div className="text-small text-on-feature-dim mt-1.5">
          {t('worker.home.across', { count: cv.jobsDone })}
          {awaitingPayment > 0 && <> · {fill(t('worker.home.stillToCome'), { amount: <b className="text-on-feature">{money(awaitingPayment)}</b> })}</>}
        </div>
      </Card>

      <Button className="w-full mb-4" onClick={() => { setCategory(null); setFeed('gigs'); navigate('jobs'); }}>
        {t('worker.home.findNearMe')}
      </Button>

      {state.invitations.length > 0 && (
        <div className="mb-1">
          <SectionTitle>{t('worker.home.invited')}</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {state.invitations.map((inv) => <InviteCard key={inv.id} inv={inv} />)}
          </div>
        </div>
      )}

      {activeWork.length > 0 && (
        <div className="mb-1">
          <SectionTitle>{t('worker.home.yourWork')}</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {activeWork.map((j) => <MyWorkCard key={j.applicationId} job={j} />)}
          </div>
        </div>
      )}

      <SectionTitle>{t('worker.home.goodAt')}</SectionTitle>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setCategory(c.id); setFeed('gigs'); navigate('jobs'); }} className="flex flex-col items-center gap-1.5 shrink-0">
            <Tile emoji={c.icon} size="lg" />
            <span className="text-micro font-semibold text-dim">{c.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle action={<TextAction tone="ink" onClick={() => { setCategory(null); setFeed('gigs'); navigate('jobs'); }}>{t('worker.home.seeAll')}</TextAction>}>{t('worker.home.gigsNearYou')}</SectionTitle>
      {state.dataLoading && state.gigs.length === 0
        ? <CardSkeletonGrid count={2} />
        : featured.length > 0
        ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0">{featured.map((g) => <GigCard key={g.id} gig={g} onClick={() => navigate('gigDetail', g.id)} />)}</div>
        : <Card className="p-6 text-center text-dim text-small">{t('worker.home.noGigs')}</Card>}

      {teaser && (
        <>
          <SectionTitle action={<TextAction tone="ink" onClick={() => { setCategory(null); setFeed('formal'); navigate('jobs'); }}>{t('worker.home.seeAll')}</TextAction>}>{t('worker.formalJobs')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 [&>*]:min-w-0"><FormalCard job={teaser} cv={cv} onClick={() => navigate('formalDetail', teaser.id)} /></div>
        </>
      )}

      {/* Tier strip — mobile only; desktop shows the richer rail instead. */}
      <Card className="lg:hidden p-4 mt-1 mb-1.5">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-[52px] h-[52px] rounded-[15px] bg-surface-3 border border-line text-display" aria-hidden="true">{cv.tier.icon}</span>
          <div className="flex-1 min-w-0">
            <small className="text-faint text-micro uppercase tracking-wide font-bold">{t('worker.yourTier')}</small>
            <h3 className="font-display m-0 text-lead font-extrabold text-ink">{cv.tier.name}</h3>
            <span className="text-small text-dim">{t('worker.unlockedFormal', { count: unlockedCount })}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('cv')}>{t('worker.theLadder')}</Button>
        </div>
        <div className="text-small text-dim my-2.5">{nextText}</div>
        <ProgressBar pct={cv.tierProgress} label={cv.nextTier ? t('worker.progressTo', { tier: cv.nextTier.name }) : t('worker.progressTop')} />
      </Card>

      <TrustStrip />

      <p className="text-center text-micro text-faint leading-relaxed px-4 pb-2">
        {t('worker.home.lowData')}
      </p>
    </Dashboard>
  );
}

/** A job the worker is actually on: hired, or done and awaiting confirmation. */
function MyWorkCard({ job }: { job: MyJob }) {
  const { navigate } = useApp();
  const t = useT();
  const c = catById(job.gig.category);
  const total = job.gig.hours * job.gig.payPerHour;
  const waiting = job.status === 'worker_done';
  const autoConfirm = timeToAutoConfirm(job.workerDoneAt, autoReleaseHours());
  const first = job.gig.employer.split(' ')[0];
  return (
    <Card className={`p-4 border-l-4 ${waiting ? 'border-[color:var(--v-brand,#F59E0B)]' : 'border-verified'}`}>
      <div className={`flex items-center gap-1.5 text-micro font-bold uppercase tracking-wide mb-2 ${waiting ? 'text-dim' : 'text-verified'}`}>
        <Icon name={waiting ? 'clock' : 'check'} size={13} /> {waiting ? t('worker.waitingConfirm', { name: first }) : t('worker.home.hired')}
      </div>
      {waiting && autoConfirm && (
        <div className="text-micro text-dim -mt-1 mb-2">{t('worker.home.autoCounts', { when: autoConfirm.text })}</div>
      )}
      <div className="flex gap-3 items-start">
        <Tile emoji={c.icon} />
        <div className="flex-1 min-w-0">
          <b className="text-body font-extrabold text-ink leading-tight block tracking-tight">{job.gig.title}</b>
          <div className="text-small text-dim mt-0.5">{job.gig.employer} · {job.gig.when} · <b className="text-ink font-mono tnum">{money(total)}</b></div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 mt-3 [&>*]:flex-1">
        <Button size="sm" variant={waiting ? 'ghost' : 'primary'} onClick={() => navigate('gigDetail', job.gig.id)}>
          {waiting ? t('worker.home.viewJob') : t('worker.home.finished')}
        </Button>
        <Button size="sm" variant="ghost" icon="chat" onClick={() => navigate('chat', job.gig.employerId ?? '')}>{t('worker.message', { name: first })}</Button>
      </div>
    </Card>
  );
}

/** A pending job invitation from an employer, with accept / decline. */
function InviteCard({ inv }: { inv: Invitation }) {
  const { respondInvitation, navigate, toast } = useApp();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const c = catById(inv.gig.category);
  const total = inv.gig.hours * inv.gig.payPerHour;

  const respond = async (accept: boolean) => {
    setBusy(true);
    try {
      await respondInvitation(inv.id, accept);
      if (accept) { toast(t('worker.home.inviteAccepted')); navigate('gigDetail', inv.gig.id); }
      else toast(t('worker.home.inviteDeclined'));
    } catch (e) { toast((e as Error).message); setBusy(false); }
  };

  return (
    <Card className="p-4 border-l-4 border-brand">
      <div className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wide text-brand mb-2"><Icon name="bolt" size={13} /> {t('worker.home.jobInvitation')}</div>
      <div className="flex gap-3 items-start">
        <Tile emoji={c.icon} />
        <div className="flex-1 min-w-0">
          <b className="text-body font-extrabold text-ink leading-tight block tracking-tight">{inv.gig.title}</b>
          <div className="text-small text-dim mt-0.5">{inv.gig.employer} · {inv.gig.location} · <b className="text-ink font-mono tnum">{money(total)}</b></div>
        </div>
      </div>
      {inv.message && <p className="text-small text-ink italic bg-surface-2 rounded-xl px-3 py-2 mt-2.5 leading-snug">“{inv.message}”</p>}
      <div className="flex flex-col sm:flex-row gap-2.5 mt-3 [&>*]:flex-1">
        <Button size="sm" disabled={busy} onClick={() => respond(true)}>{busy ? '…' : t('worker.home.accept')}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => respond(false)}>{t('worker.home.decline')}</Button>
      </div>
    </Card>
  );
}
