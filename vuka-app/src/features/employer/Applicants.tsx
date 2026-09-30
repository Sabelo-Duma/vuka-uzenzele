/**
 * Who applied for one of my jobs — and the button that actually hires them.
 *
 * Before this screen existed a worker could tap Apply and simply disappear:
 * recorded server-side, invisible to the person doing the hiring. This is the
 * other half of that loop.
 */
import { useCallback, useEffect, useState } from 'react';
import { catById, TIERS, autoReleaseHours } from '../../data/catalog';
import { money, timeToAutoConfirm } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { api, type Applicant } from '../../lib/api';
import type { Gig } from '../../types';
import { Avatar, Button, Card, Chip, EmptyState, Sheet, StarRating, Stars, TierBadge, Tile } from '../../components/ui';
import { CardSkeletonGrid } from '../../components/cards';
import { DetailHeader } from '../../components/bits';
import { Icon } from '../../components/Icon';
import { FundingChip, TestModeNote, gigTotal } from '../../components/Funding';
import { useT } from '../../providers/LanguageProvider';
import { useRichT } from './EmployerRail';

export function Applicants({ id }: { id: string }) {
  const { navigate, goBack, toast, loadApplicants, hireWorker, confirmWork } = useApp();
  const t = useT();
  const rt = useRichT();
  const [gig, setGig] = useState<Gig | null>(null);
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirming, setConfirming] = useState<Applicant | null>(null);
  const [funding, setFunding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await loadApplicants(id);
      setGig(res.gig);
      setApplicants(res.applicants);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id, loadApplicants]);

  useEffect(() => { void load(); }, [load]);

  const hire = async (a: Applicant) => {
    setBusyId(a.applicationId);
    try {
      await hireWorker(id, a.worker.id);
      toast(t('employer.applicants.hired', { name: a.worker.name.split(' ')[0] }));
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  /* Escrow, test mode. Securing the pay is what unlocks hiring; taking it
     back is free, and only possible until somebody is hired. */
  const secure = async () => {
    if (!gig) return;
    setFunding(true);
    try {
      const res = await api.fundGig(gig.id);
      toast(t('employer.applicants.secured', { amount: money(res.amount) }));
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setFunding(false);
    }
  };

  const takeBack = async () => {
    if (!gig) return;
    setFunding(true);
    try {
      const res = await api.unfundGig(gig.id);
      toast(t('employer.applicants.returned', { amount: money(res.refunded) }));
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setFunding(false);
    }
  };

  const confirm = async (a: Applicant, rating: number, review: string) => {
    setBusyId(a.applicationId);
    try {
      await confirmWork(a.applicationId, rating, review);
      const first = a.worker.name.split(' ')[0];
      toast(gig?.funding === 'held'
        ? t('employer.applicants.confirmedPaid', { amount: money(gigTotal(gig)), name: first })
        : t('employer.applicants.confirmed', { name: first }));
      setConfirming(null);
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return (
      <>
        <DetailHeader title={t('employer.applicants.title')} onBack={() => goBack('hires')} />
        <EmptyState icon="alert" title={t('employer.applicants.loadFailed')} hint={error} action={<Button onClick={load}>{t('action.retry')}</Button>} />
      </>
    );
  }

  const hired = applicants?.find((a) => a.status === 'hired' || a.status === 'worker_done' || a.status === 'completed');
  const waiting = applicants?.filter((a) => a.status === 'applied') ?? [];
  const passedOver = applicants?.filter((a) => a.status === 'not_selected') ?? [];
  const c = gig ? catById(gig.category) : null;

  return (
    <>
      <DetailHeader title={t('employer.applicants.title')} onBack={() => goBack('hires')} />

      {gig && (
        <Card className="p-4 mb-4">
          <div className="flex gap-3 items-start">
            {c && <Tile emoji={c.icon} />}
            <div className="flex-1 min-w-0">
              <h3 className="font-display m-0 text-lead font-extrabold text-ink leading-tight tracking-tight break-words">{gig.title}</h3>
              <div className="text-small text-dim mt-0.5">{gig.location} · {gig.when} · <b className="text-ink font-mono tnum">{money(gigTotal(gig))}</b></div>
            </div>
          </div>

          {/* The pay. Nobody can be hired until it is secured; it can be taken
              back for free until then, and is locked from the moment of hire. */}
          {gig.funding && (
            <div className="mt-3 pt-3 border-t border-line-soft">
              <div className="flex items-center gap-2 flex-wrap mb-2"><FundingChip gig={gig} /></div>
              {gig.funding === 'none' && (
                <>
                  <p className="text-small text-ink leading-relaxed m-0 mb-2.5">
                    {rt('employer.applicants.secureIntro', { amount: <b className="font-mono tnum">{money(gigTotal(gig))}</b> })}
                  </p>
                  <Button block size="sm" icon="lock" disabled={funding} onClick={secure}>
                    {funding ? t('employer.applicants.securing') : t('employer.applicants.secureNow', { amount: money(gigTotal(gig)) })}
                  </Button>
                </>
              )}
              {gig.funding === 'held' && !hired && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-small text-dim leading-relaxed m-0 flex-1 min-w-[12rem]">{t('employer.applicants.payWaiting')}</p>
                  <Button size="sm" variant="ghost" disabled={funding} onClick={takeBack}>{funding ? t('employer.applicants.returning') : t('employer.applicants.takeBack')}</Button>
                </div>
              )}
              {gig.funding === 'held' && hired && (
                <p className="text-small text-dim leading-relaxed m-0">
                  {t('employer.applicants.locked', { name: hired.worker.name.split(' ')[0] })}
                </p>
              )}
              {gig.funding === 'released' && (
                <p className="text-small text-dim leading-relaxed m-0">{hired ? t('employer.applicants.paidTo', { name: hired.worker.name.split(' ')[0] }) : t('employer.applicants.paidToWorker')}</p>
              )}
              {gig.paymentsMode !== 'live' && <TestModeNote className="mt-3" />}
            </div>
          )}
          {/* Withdrawing is only offered while it is still possible — once
              someone is hired this is their pay, and the server refuses. */}
          {!hired && (
            <div className="flex justify-end mt-3 pt-3 border-t border-line-soft">
              <Button size="sm" variant="danger" icon="trash" onClick={() => setWithdrawing(true)}>{t('employer.withdraw.title')}</Button>
            </div>
          )}
        </Card>
      )}

      {withdrawing && gig && (
        <WithdrawSheet
          gig={gig}
          waiting={waiting.length}
          onClose={() => setWithdrawing(false)}
          onDone={() => { setWithdrawing(false); navigate('hires'); }}
        />
      )}

      {applicants === null ? (
        <CardSkeletonGrid count={2} talent />
      ) : applicants.length === 0 ? (
        <EmptyState
          icon="talent"
          title={t('employer.noApplications')}
          hint={t('employer.applicants.noneHint')}
          action={<Button onClick={() => navigate('talent')}>{t('employer.talent.title')}</Button>}
        />
      ) : (
        <>
          {hired && (
            <>
              <h3 className="font-display text-small font-extrabold text-ink uppercase tracking-wide mb-2.5 mt-1">{t('employer.applicants.working')}</h3>
              <ApplicantCard
                a={hired}
                busy={busyId === hired.applicationId}
                onOpen={() => navigate('workerDetail', hired.worker.id)}
                onMessage={() => navigate('chat', hired.worker.id)}
                onConfirm={hired.status === 'worker_done' ? () => setConfirming(hired) : undefined}
              />
            </>
          )}

          {waiting.length > 0 && (
            <>
              <h3 className="font-display text-small font-extrabold text-ink uppercase tracking-wide mb-2.5 mt-4">
                {hired ? t('employer.applicants.alsoApplied') : t('employer.applicants.applied', { count: waiting.length })}
              </h3>
              {waiting.map((a) => (
                <ApplicantCard
                  key={a.applicationId}
                  a={a}
                  busy={busyId === a.applicationId}
                  onOpen={() => navigate('workerDetail', a.worker.id)}
                  onMessage={() => navigate('chat', a.worker.id)}
                  onHire={hired ? undefined : () => hire(a)}
                  needsFunds={gig?.funding === 'none'}
                />
              ))}
              {hired && <p className="text-small text-dim leading-relaxed px-1 mt-1">{t('employer.applicants.toldTaken')}</p>}
            </>
          )}

          {passedOver.length > 0 && (
            <p className="text-small text-dim leading-relaxed px-1 mt-3">
              {t('employer.applicants.passedOver', { count: passedOver.length })}
            </p>
          )}
        </>
      )}

      {confirming && (
        <ConfirmSheet
          a={confirming}
          gigTitle={gig?.title ?? t('employer.applicants.thisJob')}
          busy={busyId === confirming.applicationId}
          onClose={() => setConfirming(null)}
          onConfirm={(rating, review) => confirm(confirming, rating, review)}
        />
      )}
    </>
  );
}

function ApplicantCard({ a, busy, onOpen, onMessage, onHire, onConfirm, needsFunds = false }: {
  a: Applicant; busy: boolean; onOpen: () => void; onMessage: () => void;
  onHire?: () => void; onConfirm?: () => void;
  /** The job is not funded yet, so hiring is not possible — say why. */
  needsFunds?: boolean;
}) {
  const tr = useT();
  const rt = useRichT();
  const t = TIERS[a.worker.tier.id] ?? TIERS[0];
  const autoConfirm = timeToAutoConfirm(a.workerDoneAt, autoReleaseHours());
  return (
    <Card className="p-4 mb-2.5">
      <button onClick={onOpen} className="w-full text-left flex gap-3.5 items-center">
        <Avatar initials={a.worker.initials} verified={a.worker.idVerified} />
        <div className="flex-1 min-w-0">
          <h3 className="font-display m-0 text-body font-extrabold text-ink flex items-center gap-1.5 tracking-tight">
            {a.worker.name}
            {a.worker.idVerified && <span className="text-info"><Icon name="shield" size={14} /></span>}
          </h3>
          <div className="text-small text-dim mt-0.5 truncate">{a.worker.tagline}</div>
          <div className="flex gap-2 flex-wrap items-center mt-1.5">
            <TierBadge icon={t.icon} name={t.name} />
            {a.worker.skills.slice(0, 4).map((s) => <span key={s} className="text-lead" title={catById(s).label} aria-hidden="true">{catById(s).icon}</span>)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="flex items-center gap-1 justify-end">
            <Stars rating={a.worker.rating} size={13} />
            <b className="text-small font-mono tnum text-ink">{a.worker.rating.toFixed(1)}</b>
          </span>
          <small className="block text-micro text-dim">{tr('employer.applicants.jobs', { count: a.worker.jobsDone })}</small>
        </div>
      </button>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        {a.status === 'hired' && <Chip tone="info" icon="check">{tr('employer.applicants.statusHired')}</Chip>}
        {a.status === 'worker_done' && <Chip tone="live" icon="bolt">{tr('employer.markedDone')}</Chip>}
        {a.status === 'worker_done' && autoConfirm && (
          <div className="text-micro text-dim mt-1">
            {autoConfirm.expired
              ? <>{rt('employer.applicants.autoNow', { bold: <b className="text-ink">{tr('employer.applicants.autoNowBold')}</b> })}</>
              : <>{rt('employer.applicants.autoIn', { time: <b className="text-ink">{autoConfirm.remaining}</b> })}</>}
          </div>
        )}
        {a.status === 'completed' && <Chip tone="verified" icon="check">{tr('employer.applicants.statusDone')}</Chip>}
        {a.status === 'not_selected' && <Chip tone="neutral">{tr('employer.applicants.statusNotSelected')}</Chip>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mt-3 [&>*]:flex-1">
        {onHire && (
          <Button size="sm" disabled={busy || needsFunds} onClick={onHire}>
            {busy ? tr('employer.applicants.hiring') : needsFunds ? tr('employer.applicants.needFunds') : tr('employer.applicants.hire')}
          </Button>
        )}
        {onConfirm && <Button size="sm" variant="primary" disabled={busy} onClick={onConfirm}>{tr('employer.confirmRate')}</Button>}
        <Button size="sm" variant="ghost" icon="chat" onClick={onMessage}>{tr('employer.message')}</Button>
      </div>
    </Card>
  );
}

/** Employer's half of finishing a job: confirm it happened and rate the worker. */
/**
 * Confirming a withdrawal.
 *
 * Deliberately a step rather than a single tap: it removes a listing from
 * under everyone who applied, and there is no undo. It says how many people
 * that is, because "3 people applied" is the fact that should change your
 * mind, not a generic "are you sure?".
 */
function WithdrawSheet({ gig, waiting, onClose, onDone }: {
  gig: Gig;
  waiting: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast, listMyGigs } = useApp();
  const t = useT();
  const rt = useRichT();
  const [busy, setBusy] = useState(false);

  const withdraw = async () => {
    setBusy(true);
    try {
      const res = await api.deleteGig(gig.id);
      await listMyGigs().catch(() => { /* the list refreshes on its own next time */ });
      const done = res.applicantsNotified > 0
        ? t('employer.withdraw.doneTold', { count: res.applicantsNotified })
        : t('employer.withdraw.done');
      const back = res.refunded ? ` ${t('employer.withdraw.refunded', { amount: money(res.refunded) })}` : '';
      toast(`${done}${back}`);
      onDone();
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('employer.withdraw.title')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1">{t('employer.withdraw.question')}</h3>
      <p className="text-small text-dim leading-relaxed mb-4">
        {waiting > 0
          ? rt('employer.withdraw.bodyTold', { title: <b className="text-ink">“{gig.title}”</b>, count: <b className="text-ink font-mono tnum">{waiting}</b> }, waiting)
          : rt('employer.withdraw.body', { title: <b className="text-ink">“{gig.title}”</b> })}
        {gig.funding === 'held' && <> {rt('employer.withdraw.bodyRefund', { amount: <b className="text-ink font-mono tnum">{money(gigTotal(gig))}</b> })}</>}
      </p>
      <Button block variant="danger" disabled={busy} onClick={withdraw}>
        {busy ? t('employer.withdraw.withdrawing') : t('employer.withdraw.yes')}
      </Button>
      <Button block variant="ghost" className="mt-2" disabled={busy} onClick={onClose}>{t('employer.withdraw.keep')}</Button>
    </Sheet>
  );
}

function ConfirmSheet({ a, gigTitle, busy, onClose, onConfirm }: {
  a: Applicant; gigTitle: string; busy: boolean; onClose: () => void;
  onConfirm: (rating: number, review: string) => void;
}) {
  // Unset, not five — see the note in ReviewSheet. A pre-filled top score is
  // the one people accept without deciding.
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const t = useT();
  const first = a.worker.name.split(' ')[0];
  return (
    <Sheet title={t('employer.confirm.title')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1 tracking-tight">{t('employer.confirm.question', { name: first })}</h3>
      <p className="text-dim text-small leading-relaxed mb-4">
        {t('employer.confirm.body', { title: gigTitle, name: first })}
      </p>
      <StarRating value={rating} onChange={setRating} />
      <label className="block text-micro font-bold text-dim uppercase tracking-wide mb-1.5 mt-4">{t('employer.confirm.reviewLabel')}</label>
      {/* text-base (16px): smaller zooms the viewport on iOS, and this one sits
          in a sheet, so the Confirm button ends up off-screen. */}
      <textarea
        className="w-full border-[1.5px] border-line rounded-xl px-3.5 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-line transition resize-none"
        rows={3}
        maxLength={600}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder={t('employer.confirm.reviewPlaceholder', { name: first })}
        aria-label={t('employer.confirm.reviewAria')}
      />
      <p className="text-micro text-dim mt-1.5">{t('employer.confirm.blankHint')}</p>
      <Button block className="mt-4" disabled={busy || rating === 0} onClick={() => onConfirm(rating, review.trim())}>
        {busy ? t('employer.confirm.confirming') : rating === 0 ? t('employer.confirm.chooseRating') : t('employer.confirm.submit', { rating })}
      </Button>
    </Sheet>
  );
}
