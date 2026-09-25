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

export function Applicants({ id }: { id: string }) {
  const { navigate, goBack, toast, loadApplicants, hireWorker, confirmWork } = useApp();
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
      toast(`${a.worker.name.split(' ')[0]} is hired 🎉 We've let them know.`);
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
      toast(`${money(res.amount)} secured 🔒 Workers now see "Funds secured", and you can hire.`);
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
      toast(`${money(res.refunded)} returned to you — no fee.`);
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
        ? `Confirmed — ${money(gigTotal(gig))} is in ${first}'s wallet, and the reference is on their CV ⭐`
        : `Confirmed — ${first}'s reference is on their CV ⭐`);
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
        <DetailHeader title="Applicants" onBack={() => goBack('hires')} />
        <EmptyState icon="⚠️" title="Couldn't load applicants" hint={error} action={<Button onClick={load}>Try again</Button>} />
      </>
    );
  }

  const hired = applicants?.find((a) => a.status === 'hired' || a.status === 'worker_done' || a.status === 'completed');
  const waiting = applicants?.filter((a) => a.status === 'applied') ?? [];
  const passedOver = applicants?.filter((a) => a.status === 'not_selected') ?? [];
  const c = gig ? catById(gig.category) : null;

  return (
    <>
      <DetailHeader title="Applicants" onBack={() => goBack('hires')} />

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
                    Secure the <b className="font-mono tnum">{money(gigTotal(gig))}</b> to hire someone. Workers see "Funds secured" on your job, and you can take it back for free until you hire.
                  </p>
                  <Button block size="sm" icon="lock" disabled={funding} onClick={secure}>
                    {funding ? 'Securing…' : `Secure ${money(gigTotal(gig))} now`}
                  </Button>
                </>
              )}
              {gig.funding === 'held' && !hired && (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-small text-dim leading-relaxed m-0 flex-1 min-w-[12rem]">The pay is waiting. You can take it back for free until you hire.</p>
                  <Button size="sm" variant="ghost" disabled={funding} onClick={takeBack}>{funding ? 'Returning…' : 'Take funds back'}</Button>
                </div>
              )}
              {gig.funding === 'held' && hired && (
                <p className="text-small text-dim leading-relaxed m-0">
                  Locked for {hired.worker.name.split(' ')[0]}. It is paid into their wallet when you confirm the work — or automatically if you don't respond in time.
                </p>
              )}
              {gig.funding === 'released' && (
                <p className="text-small text-dim leading-relaxed m-0">Paid into {hired ? hired.worker.name.split(' ')[0] : 'the worker'}'s wallet.</p>
              )}
              {gig.paymentsMode !== 'live' && <TestModeNote className="mt-3" />}
            </div>
          )}
          {/* Withdrawing is only offered while it is still possible — once
              someone is hired this is their pay, and the server refuses. */}
          {!hired && (
            <div className="flex justify-end mt-3 pt-3 border-t border-line-soft">
              <Button size="sm" variant="danger" icon="trash" onClick={() => setWithdrawing(true)}>Withdraw this job</Button>
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
          icon="📭"
          title="No applications yet"
          hint="Verified youth nearby can see this job. You can also invite someone directly from Talent."
          action={<Button onClick={() => navigate('talent')}>Browse talent</Button>}
        />
      ) : (
        <>
          {hired && (
            <>
              <h3 className="font-display text-small font-extrabold text-ink uppercase tracking-wide mb-2.5 mt-1">Working on this job</h3>
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
                {hired ? 'Also applied' : `${waiting.length} ${waiting.length === 1 ? 'person' : 'people'} applied`}
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
              {hired && <p className="text-small text-dim leading-relaxed px-1 mt-1">These applicants have been told the job is taken. Invite them to your next one from Talent.</p>}
            </>
          )}

          {passedOver.length > 0 && (
            <p className="text-small text-dim leading-relaxed px-1 mt-3">
              {passedOver.length} other {passedOver.length === 1 ? 'applicant was' : 'applicants were'} told this job is filled.
            </p>
          )}
        </>
      )}

      {confirming && (
        <ConfirmSheet
          a={confirming}
          gigTitle={gig?.title ?? 'this job'}
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
          <small className="block text-micro text-dim">{a.worker.jobsDone} jobs</small>
        </div>
      </button>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        {a.status === 'hired' && <Chip tone="info" icon="check">Hired — work in progress</Chip>}
        {a.status === 'worker_done' && <Chip tone="live" icon="bolt">Marked done — needs your confirmation</Chip>}
        {a.status === 'worker_done' && autoConfirm && (
          <div className="text-micro text-dim mt-1">
            {autoConfirm.expired
              ? <>This is <b className="text-ink">counting automatically now</b> — it will be recorded as work done, without your rating.</>
              : <>Confirm within <b className="text-ink">{autoConfirm.remaining}</b> — after that it counts automatically, without your rating.</>}
          </div>
        )}
        {a.status === 'completed' && <Chip tone="verified" icon="check">Completed & reviewed</Chip>}
        {a.status === 'not_selected' && <Chip tone="neutral">Not selected</Chip>}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mt-3 [&>*]:flex-1">
        {onHire && (
          <Button size="sm" disabled={busy || needsFunds} onClick={onHire}>
            {busy ? 'Hiring…' : needsFunds ? 'Secure the pay to hire' : 'Hire for this job'}
          </Button>
        )}
        {onConfirm && <Button size="sm" variant="primary" disabled={busy} onClick={onConfirm}>Confirm & rate</Button>}
        <Button size="sm" variant="ghost" icon="chat" onClick={onMessage}>Message</Button>
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
  const [busy, setBusy] = useState(false);

  const withdraw = async () => {
    setBusy(true);
    try {
      const res = await api.deleteGig(gig.id);
      await listMyGigs().catch(() => { /* the list refreshes on its own next time */ });
      const told = res.applicantsNotified > 0
        ? ` — ${res.applicantsNotified} applicant${res.applicantsNotified === 1 ? ' was' : 's were'} told`
        : '';
      const back = res.refunded ? ` ${money(res.refunded)} returned to you, no fee.` : '';
      toast(`Job withdrawn${told}.${back}`);
      onDone();
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title="Withdraw this job" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1">Withdraw this job?</h3>
      <p className="text-small text-dim leading-relaxed mb-4">
        <b className="text-ink">“{gig.title}”</b> will be removed from the feed. This cannot be undone
        {waiting > 0 && <>, and <b className="text-ink font-mono tnum">{waiting}</b> {waiting === 1 ? 'person who applied' : 'people who applied'} will be told</>}.
        {gig.funding === 'held' && <> The <b className="text-ink font-mono tnum">{money(gigTotal(gig))}</b> you secured comes back to you, with no fee.</>}
      </p>
      <Button block variant="danger" disabled={busy} onClick={withdraw}>
        {busy ? 'Withdrawing…' : 'Yes, withdraw it'}
      </Button>
      <Button block variant="ghost" className="mt-2" disabled={busy} onClick={onClose}>Keep it posted</Button>
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
  const first = a.worker.name.split(' ')[0];
  return (
    <Sheet title="Confirm the work" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1 tracking-tight">How did {first} do?</h3>
      <p className="text-dim text-small leading-relaxed mb-4">
        Confirming “{gigTitle}” releases {first}'s pay into their Vuka wallet and writes your review onto their CV as a verified reference. Please be fair — it's the record employers after you will read.
      </p>
      <StarRating value={rating} onChange={setRating} />
      <label className="block text-micro font-bold text-dim uppercase tracking-wide mb-1.5 mt-4">Your review (optional)</label>
      {/* text-base (16px): smaller zooms the viewport on iOS, and this one sits
          in a sheet, so the Confirm button ends up off-screen. */}
      <textarea
        className="w-full border-[1.5px] border-line rounded-xl px-3.5 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-line transition resize-none"
        rows={3}
        maxLength={600}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder={`e.g. ${first} arrived on time and did a thorough job.`}
        aria-label="Your review"
      />
      <p className="text-micro text-dim mt-1.5">Leave it blank and we'll write a short note from your star rating.</p>
      <Button block className="mt-4" disabled={busy || rating === 0} onClick={() => onConfirm(rating, review.trim())}>
        {busy ? 'Confirming…' : rating === 0 ? 'Choose a rating first' : `Confirm & rate ${rating}★`}
      </Button>
    </Sheet>
  );
}
