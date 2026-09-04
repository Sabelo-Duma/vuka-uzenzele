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
import type { Applicant } from '../../lib/api';
import type { Gig } from '../../types';
import { Avatar, Button, Card, Chip, EmptyState, Sheet, StarRating, TierBadge } from '../../components/ui';
import { CardSkeletonGrid } from '../../components/cards';
import { DetailHeader } from '../../components/bits';
import { Icon } from '../../components/Icon';

export function Applicants({ id }: { id: string }) {
  const { navigate, toast, loadApplicants, hireWorker, confirmWork } = useApp();
  const [gig, setGig] = useState<Gig | null>(null);
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Applicant | null>(null);

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

  const confirm = async (a: Applicant, rating: number, review: string) => {
    setBusyId(a.applicationId);
    try {
      await confirmWork(a.applicationId, rating, review);
      toast(`Confirmed — ${a.worker.name.split(' ')[0]}'s reference is on their CV ⭐`);
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
        <DetailHeader title="Applicants" onBack={() => navigate('hires')} />
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
      <DetailHeader title="Applicants" onBack={() => navigate('hires')} />

      {gig && (
        <Card className="p-4 mb-4">
          <div className="flex gap-3 items-start">
            {c && <span className="grid place-items-center w-11 h-11 rounded-[13px] text-head shrink-0" style={{ background: `${c.color}22`, color: c.color }} aria-hidden="true">{c.icon}</span>}
            <div className="flex-1 min-w-0">
              <h3 className="m-0 text-lead font-extrabold text-navy leading-tight tracking-tight">{gig.title}</h3>
              <div className="text-small text-muted mt-0.5">{gig.location} · {gig.when} · <b className="text-navy tnum">{money(gig.hours * gig.payPerHour)}</b></div>
            </div>
          </div>
        </Card>
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
              <h4 className="text-small font-extrabold text-navy uppercase tracking-wide mb-2.5 mt-1">Working on this job</h4>
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
              <h4 className="text-small font-extrabold text-navy uppercase tracking-wide mb-2.5 mt-4">
                {hired ? 'Also applied' : `${waiting.length} ${waiting.length === 1 ? 'person' : 'people'} applied`}
              </h4>
              {waiting.map((a) => (
                <ApplicantCard
                  key={a.applicationId}
                  a={a}
                  busy={busyId === a.applicationId}
                  onOpen={() => navigate('workerDetail', a.worker.id)}
                  onMessage={() => navigate('chat', a.worker.id)}
                  onHire={hired ? undefined : () => hire(a)}
                />
              ))}
              {hired && <p className="text-small text-muted leading-relaxed px-1 mt-1">These applicants have been told the job is taken. Invite them to your next one from Talent.</p>}
            </>
          )}

          {passedOver.length > 0 && (
            <p className="text-small text-muted leading-relaxed px-1 mt-3">
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

function ApplicantCard({ a, busy, onOpen, onMessage, onHire, onConfirm }: {
  a: Applicant; busy: boolean; onOpen: () => void; onMessage: () => void;
  onHire?: () => void; onConfirm?: () => void;
}) {
  const t = TIERS[a.worker.tier.id] ?? TIERS[0];
  const autoConfirm = timeToAutoConfirm(a.workerDoneAt, autoReleaseHours());
  return (
    <Card className="p-4 mb-2.5">
      <button onClick={onOpen} className="w-full text-left flex gap-3.5 items-center">
        <Avatar initials={a.worker.initials} color={a.worker.color} verified={a.worker.idVerified} />
        <div className="flex-1 min-w-0">
          <h4 className="m-0 text-body font-extrabold text-navy flex items-center gap-1.5 tracking-tight">
            {a.worker.name}
            {a.worker.idVerified && <span className="text-info"><Icon name="shield" size={14} /></span>}
          </h4>
          <div className="text-small text-muted mt-0.5 truncate">{a.worker.tagline}</div>
          <div className="flex gap-2 flex-wrap items-center mt-1.5">
            <TierBadge icon={t.icon} name={t.name} color={t.color} />
            {a.worker.skills.slice(0, 4).map((s) => <span key={s} className="text-base" title={catById(s).label} aria-hidden="true">{catById(s).icon}</span>)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <b className="text-base" style={{ color: '#F59E0B' }}>{a.worker.rating.toFixed(1)}★</b>
          <small className="block text-micro text-muted">{a.worker.jobsDone} jobs</small>
        </div>
      </button>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        {a.status === 'hired' && <Chip tone="info" icon="check">Hired — work in progress</Chip>}
        {a.status === 'worker_done' && <Chip tone="urgent" icon="bolt">Marked done — needs your confirmation</Chip>}
        {a.status === 'worker_done' && autoConfirm && (
          <div className="text-micro text-muted mt-1">
            Confirm within <b className="text-navy">{autoConfirm.text}</b> — after that it counts automatically, without your rating.
          </div>
        )}
        {a.status === 'completed' && <Chip tone="fair" icon="check">Completed & reviewed</Chip>}
        {a.status === 'not_selected' && <Chip tone="neutral">Not selected</Chip>}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {onHire && <Button size="sm" disabled={busy} onClick={onHire}>{busy ? 'Hiring…' : 'Hire for this job'}</Button>}
        {onConfirm && <Button size="sm" variant="gold" disabled={busy} onClick={onConfirm}>Confirm & rate</Button>}
        <Button size="sm" variant="ghost" icon="chat" onClick={onMessage}>Message</Button>
      </div>
    </Card>
  );
}

/** Employer's half of finishing a job: confirm it happened and rate the worker. */
function ConfirmSheet({ a, gigTitle, busy, onClose, onConfirm }: {
  a: Applicant; gigTitle: string; busy: boolean; onClose: () => void;
  onConfirm: (rating: number, review: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const first = a.worker.name.split(' ')[0];
  return (
    <Sheet title="Confirm the work" onClose={onClose}>
      <h3 className="text-xl font-extrabold text-navy m-0 mb-1 tracking-tight">How did {first} do?</h3>
      <p className="text-muted text-small leading-relaxed mb-4">
        Confirming “{gigTitle}” releases {first}'s pay and writes your review onto their CV as a verified reference. Please be fair — it's the record employers after you will read.
      </p>
      <StarRating value={rating} onChange={setRating} />
      <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5 mt-4">Your review (optional)</label>
      {/* text-base (16px): smaller zooms the viewport on iOS, and this one sits
          in a sheet, so the Confirm button ends up off-screen. */}
      <textarea
        className="w-full border-[1.5px] border-line-strong rounded-xl px-3.5 py-2.5 text-base bg-surface text-navy focus:outline-none focus:border-navy transition resize-none"
        rows={3}
        maxLength={600}
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder={`e.g. ${first} arrived on time and did a thorough job.`}
        aria-label="Your review"
      />
      <p className="text-micro text-muted mt-1.5">Leave it blank and we'll write a short note from your star rating.</p>
      <Button block className="mt-4" disabled={busy} onClick={() => onConfirm(rating, review.trim())}>
        {busy ? 'Confirming…' : `Confirm & rate ${rating}★`}
      </Button>
    </Sheet>
  );
}
