/**
 * The employer's hiring hub: jobs I've posted (with applicant counts) and work
 * waiting on my confirmation. This is where "someone applied" becomes visible.
 */
import { useCallback, useEffect, useState } from 'react';
import { catById, autoReleaseHours } from '../../data/catalog';
import { money, timeToAutoConfirm } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { Applicant, Hire } from '../../lib/api';
import type { Gig } from '../../types';
import { Button, Card, Chip, EmptyState, SectionTitle, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';

interface PostedJob { gig: Gig; applicants: Applicant[] }

export function MyJobs() {
  const { navigate, listMyGigs, loadApplicants, loadMyHires, toast } = useApp();
  const [posted, setPosted] = useState<PostedJob[] | null>(null);
  const [hires, setHires] = useState<Hire[] | null>(null);

  const load = useCallback(async () => {
    try {
      const [gigs, myHires] = await Promise.all([listMyGigs(), loadMyHires()]);
      setHires(myHires);
      // Applicant counts come per gig; a handful of posts is the realistic case.
      const withApplicants = await Promise.all(gigs.map(async (gig) => {
        try { return { gig, applicants: (await loadApplicants(gig.id)).applicants }; }
        catch { return { gig, applicants: [] }; }
      }));
      setPosted(withApplicants);
    } catch (e) {
      toast((e as Error).message);
      setPosted([]);
      setHires([]);
    }
  }, [listMyGigs, loadApplicants, loadMyHires, toast]);

  useEffect(() => { void load(); }, [load]);

  const needsConfirmation = hires?.filter((h) => h.status === 'worker_done') ?? [];
  const inProgress = hires?.filter((h) => h.status === 'hired') ?? [];
  const finished = hires?.filter((h) => h.status === 'completed') ?? [];

  return (
    <>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Your hiring</small>
        <h2 className="m-0 mt-0.5 text-head font-extrabold text-navy tracking-tight">Jobs & applicants<span className="text-red">.</span></h2>
      </header>

      {needsConfirmation.length > 0 && (
        <>
          <SectionTitle>Waiting on you</SectionTitle>
          {needsConfirmation.map((h) => (
            <Card key={h.applicationId} className="p-4 mb-2.5 border-l-4 border-red">
              <div className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wide text-red mb-2">
                <Icon name="bolt" size={13} /> Marked done — needs your confirmation
              </div>
              <b className="text-body font-extrabold text-navy block tracking-tight">{h.gig.title}</b>
              <div className="text-small text-muted mt-0.5">
                {h.worker.name} finished this job · <b className="text-navy tnum">{money(h.gig.hours * h.gig.payPerHour)}</b>
              </div>
              <p className="text-small text-muted leading-snug mt-2 mb-0">Confirming releases their pay and adds your review to their CV.</p>
              {(() => {
                const auto = timeToAutoConfirm(h.workerDoneAt, autoReleaseHours());
                return auto ? (
                  <p className={`text-small leading-snug mt-1 mb-0 ${auto.soon ? 'text-red font-semibold' : 'text-muted'}`}>
                    {auto.text} to confirm — after that it counts automatically, without your rating.
                  </p>
                ) : null;
              })()}
              <Button block size="sm" variant="gold" className="mt-3" onClick={() => navigate('applicants', h.gig.id)}>Confirm & rate {h.worker.name.split(' ')[0]}</Button>
            </Card>
          ))}
        </>
      )}

      <SectionTitle action={<button className="text-small text-red font-bold" onClick={() => navigate('post')}>Post a job →</button>}>Open jobs</SectionTitle>
      {posted === null ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-[86px] w-full rounded-card" />
          <Skeleton className="h-[86px] w-full rounded-card" />
        </div>
      ) : posted.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No open jobs"
          hint="Post a job and verified youth nearby can apply. You'll see every applicant here with their real rating and tier."
          action={<Button icon="plus" onClick={() => navigate('post')}>Post a job</Button>}
        />
      ) : (
        posted.map(({ gig, applicants }) => {
          const c = catById(gig.category);
          const waiting = applicants.filter((a) => a.status === 'applied').length;
          return (
            <button key={gig.id} onClick={() => navigate('applicants', gig.id)} className="w-full text-left mb-2.5 active:scale-[.99] transition">
              <Card className="p-4 flex gap-3.5 items-center hover:bg-surface-2 hover:border-line-strong transition">
                <span className="grid place-items-center w-11 h-11 rounded-[13px] text-head shrink-0" style={{ background: `${c.color}22`, color: c.color }} aria-hidden="true">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <b className="text-body font-extrabold text-navy block leading-tight tracking-tight">{gig.title}</b>
                  <div className="text-small text-muted mt-0.5">{gig.location} · {gig.when}</div>
                  <div className="mt-1.5">
                    {waiting > 0
                      ? <Chip tone="urgent" icon="bolt">{waiting} {waiting === 1 ? 'applicant' : 'applicants'} to review</Chip>
                      : <Chip tone="neutral">No applications yet</Chip>}
                  </div>
                </div>
                <span className="text-subtle"><Icon name="chev" size={18} /></span>
              </Card>
            </button>
          );
        })
      )}

      {inProgress.length > 0 && (
        <>
          <SectionTitle>Work in progress</SectionTitle>
          {inProgress.map((h) => (
            <Card key={h.applicationId} className="p-3.5 mb-2.5 flex gap-3 items-center">
              <span className="text-title" aria-hidden="true">🔨</span>
              <div className="flex-1 min-w-0">
                <b className="text-body text-navy block">{h.gig.title}</b>
                <div className="text-small text-muted">{h.worker.name} is on it — they'll mark it done when finished</div>
              </div>
              <Button size="sm" variant="ghost" icon="chat" onClick={() => navigate('chat', h.worker.id)}>Chat</Button>
            </Card>
          ))}
        </>
      )}

      {finished.length > 0 && (
        <>
          <SectionTitle>Completed</SectionTitle>
          {finished.map((h) => (
            <Card key={h.applicationId} className="p-3.5 mb-2.5 flex gap-3 items-center">
              <span className="text-title" aria-hidden="true">✅</span>
              <div className="flex-1 min-w-0">
                <b className="text-body text-navy block">{h.gig.title}</b>
                <div className="text-small text-muted">{h.worker.name} · confirmed and reviewed</div>
              </div>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
