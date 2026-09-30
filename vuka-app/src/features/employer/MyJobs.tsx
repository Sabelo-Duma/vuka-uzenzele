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
import { Button, Card, Chip, EmptyState, LiveDot, SectionTitle, Skeleton, Tile, TextAction } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';
import { useRichT } from './EmployerRail';

interface PostedJob { gig: Gig; applicants: Applicant[] }

export function MyJobs() {
  const { navigate, listMyGigs, loadApplicants, loadMyHires, toast } = useApp();
  const t = useT();
  const rt = useRichT();
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
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">{t('employer.myJobs.eyebrow')}</small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('employer.myJobs.title')}<span className="text-brand">.</span></h1>
      </header>

      {needsConfirmation.length > 0 && (
        <>
          <SectionTitle>{t('employer.myJobs.waitingOnYou')}</SectionTitle>
          {needsConfirmation.map((h) => (
            <Card key={h.applicationId} className="p-4 mb-2.5 border-l-4 border-brand">
              <div className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wide text-brand mb-2">
                <Icon name="bolt" size={13} /> {t('employer.markedDone')}
              </div>
              <b className="text-body font-extrabold text-ink block tracking-tight break-words">{h.gig.title}</b>
              <div className="text-small text-dim mt-0.5">
                {rt('employer.myJobs.finished', { name: h.worker.name, amount: <b className="text-ink font-mono tnum">{money(h.gig.hours * h.gig.payPerHour)}</b> })}
              </div>
              <p className="text-small text-dim leading-snug mt-2 mb-0">{t('employer.myJobs.confirmHint')}</p>
              {(() => {
                const auto = timeToAutoConfirm(h.workerDoneAt, autoReleaseHours());
                return auto ? (
                  <p className={`text-small leading-snug mt-1 mb-0 ${auto.soon ? 'text-brand font-semibold' : 'text-dim'}`}>
                    {auto.expired
                      ? t('employer.myJobs.autoNow')
                      : t('employer.myJobs.autoIn', { time: auto.text })}
                  </p>
                ) : null;
              })()}
              <Button block size="sm" variant="primary" className="mt-3" onClick={() => navigate('applicants', h.gig.id)}>{t('employer.myJobs.confirmName', { name: h.worker.name.split(' ')[0] })}</Button>
            </Card>
          ))}
        </>
      )}

      <SectionTitle action={<TextAction onClick={() => navigate('post')}>{t('employer.myJobs.postArrow')}</TextAction>}>{t('employer.myJobs.open')}</SectionTitle>
      {posted === null ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-[86px] w-full rounded-card" />
          <Skeleton className="h-[86px] w-full rounded-card" />
        </div>
      ) : posted.length === 0 ? (
        <EmptyState
          icon="jobs"
          title={t('employer.myJobs.none')}
          hint={t('employer.myJobs.noneHint')}
          action={<Button icon="plus" onClick={() => navigate('post')}>{t('post.title')}</Button>}
        />
      ) : (
        posted.map(({ gig, applicants }) => {
          const c = catById(gig.category);
          const waiting = applicants.filter((a) => a.status === 'applied').length;
          return (
            <button key={gig.id} onClick={() => navigate('applicants', gig.id)} className="w-full text-left mb-2.5 active:scale-[.99] transition">
              <Card className="p-4 flex gap-3.5 items-center hover:bg-surface-2 hover:border-faint transition">
                <Tile emoji={c.icon} />
                <div className="flex-1 min-w-0">
                  <b className="text-body font-extrabold text-ink block leading-tight tracking-tight break-words">{gig.title}</b>
                  <div className="text-small text-dim mt-0.5">{gig.location} · {gig.when}</div>
                  <div className="mt-1.5">
                    {waiting > 0
                      ? <Chip tone="live" icon="bolt">{t('employer.myJobs.toReview', { count: waiting })}</Chip>
                      : <Chip tone="neutral">{t('employer.noApplications')}</Chip>}
                  </div>
                </div>
                <span className="text-faint"><Icon name="chev" size={18} /></span>
              </Card>
            </button>
          );
        })
      )}

      {inProgress.length > 0 && (
        <>
          <SectionTitle action={<LiveDot label={t('employer.myJobs.onSite', { count: inProgress.length })} />}>{t('employer.myJobs.inProgress')}</SectionTitle>
          {inProgress.map((h) => (
            <Card key={h.applicationId} className="p-3.5 mb-2.5 flex gap-3 items-center">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-2 text-ink shrink-0" aria-hidden="true"><Icon name="clock" size={20} /></span>
              <div className="flex-1 min-w-0">
                <b className="text-body text-ink block">{h.gig.title}</b>
                <div className="text-small text-dim">{t('employer.myJobs.onIt', { name: h.worker.name })}</div>
              </div>
              <Button size="sm" variant="ghost" icon="chat" onClick={() => navigate('chat', h.worker.id)}>{t('employer.myJobs.chat')}</Button>
            </Card>
          ))}
        </>
      )}

      {finished.length > 0 && (
        <>
          <SectionTitle>{t('employer.myJobs.completed')}</SectionTitle>
          {finished.map((h) => (
            <Card key={h.applicationId} className="p-3.5 mb-2.5 flex gap-3 items-center">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-verified-soft text-verified shrink-0" aria-hidden="true"><Icon name="check" size={20} /></span>
              <div className="flex-1 min-w-0">
                <b className="text-body text-ink block">{h.gig.title}</b>
                <div className="text-small text-dim">{t('employer.myJobs.reviewed', { name: h.worker.name })}</div>
              </div>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
