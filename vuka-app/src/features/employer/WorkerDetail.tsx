import { useEffect, useState } from 'react';
import { BADGES, catById, TIERS } from '../../data/catalog';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { Gig } from '../../types';
import { Avatar, Button, Card, EmptyState, Sheet, Tile } from '../../components/ui';
import { DetailHeader, Hero, PayBox, StickyCta } from '../../components/bits';
import { FollowButton } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';

export function WorkerDetail({ id }: { id: string }) {
  const { state, navigate, goBack } = useApp();
  const tr = useT();
  const [showInvite, setShowInvite] = useState(false);
  const w = state.talent.find((x) => x.id === id);

  if (!w) {
    return (
      <>
        <DetailHeader title={tr('employer.worker.title')} onBack={() => goBack('talent')} />
        <EmptyState icon="search" title={tr('employer.worker.notFound')} hint={tr('employer.worker.notFoundHint')} action={<Button onClick={() => navigate('talent')}>{tr('employer.worker.backToTalent')}</Button>} />
      </>
    );
  }

  const t = TIERS[w.tier];

  return (
    <>
      <DetailHeader title={tr('employer.worker.title')} onBack={() => goBack('talent')} />
      <Hero
        eyebrow={`${t.icon} ${t.name}`}
        title={w.name}
        sub={<><Icon name="pin" size={13} /> {w.location} · {tr('employer.worker.age', { age: w.age })}</>}
      >
        <PayBox cells={[
          { label: tr('record.tier'), value: `${t.icon} ${t.name}` },
          { label: tr('record.rating'), value: `${w.rating.toFixed(1)}★` },
          { label: tr('employer.worker.jobs'), value: String(w.jobsDone) },
        ]} />
      </Hero>

      <div className="pt-4"><FollowButton userId={w.id} /></div>
      <div className="py-4"><p className="text-ink leading-relaxed text-small m-0">{w.tagline}</p></div>

      <Card className="p-4 mb-4">
        <b className="text-small text-ink">{tr('record.skills')}</b>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {w.skills.map((s) => <span key={s} className="bg-info-soft text-info text-small font-bold px-3 py-1 rounded-full">{catById(s).icon} {catById(s).label}</span>)}
        </div>
        <b className="text-small text-ink block mt-4">{tr('employer.worker.badges')}</b>
        <div className="grid grid-cols-3 gap-2.5 mt-2">
          {BADGES.filter((b) => w.badges.includes(b.id)).map((b) => (
            <div key={b.id} className="border border-line rounded-[15px] p-3 text-center bg-surface"><div className="text-display" aria-hidden="true">{b.icon}</div><b className="block text-micro mt-1 text-ink">{b.label}</b></div>
          ))}
        </div>
      </Card>

      {/* proof of identity */}
      <Card className="p-4 mb-4 flex gap-3 items-center">
        <Avatar initials={w.initials} size="sm" verified={w.idVerified} />
        <div className="text-small text-dim leading-snug">
          {w.idVerified ? <><b className="text-ink">{tr('employer.worker.idVerified')}</b> {tr('employer.worker.idVerifiedHint')}</> : <><b className="text-ink">{tr('employer.worker.notVerified')}</b> {tr('employer.worker.notVerifiedHint')}</>}
        </div>
      </Card>

      <StickyCta>
        <div className="grid grid-cols-[1fr_auto] gap-2.5">
          <Button variant="primary" icon="briefcase" onClick={() => setShowInvite(true)}>{tr('employer.worker.inviteName', { name: w.name.split(' ')[0] })}</Button>
          <Button variant="ghost" icon="chat" onClick={() => navigate('chat', w.id)}>{tr('employer.message')}</Button>
        </div>
      </StickyCta>

      {showInvite && <InviteSheet workerId={w.id} workerName={w.name} onClose={() => setShowInvite(false)} />}
    </>
  );
}

/** Sheet: pick one of the employer's open gigs to invite this worker to. */
function InviteSheet({ workerId, workerName, onClose }: { workerId: string; workerName: string; onClose: () => void }) {
  const { listMyGigs, inviteWorker, navigate, toast } = useApp();
  const t = useT();
  const [gigs, setGigs] = useState<Gig[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const first = workerName.split(' ')[0];

  useEffect(() => {
    let cancelled = false;
    listMyGigs().then((g) => { if (!cancelled) setGigs(g); }).catch(() => { if (!cancelled) setGigs([]); });
    return () => { cancelled = true; };
  }, [listMyGigs]);

  const invite = async (gig: Gig) => {
    setBusyId(gig.id);
    try {
      const res = await inviteWorker(workerId, gig.id);
      toast(res.already ? t('employer.invite.already', { name: first }) : t('employer.invite.sent', { name: first }));
      onClose();
    } catch (e) { toast((e as Error).message); setBusyId(null); }
  };

  return (
    <Sheet title={t('employer.invite.sheetTitle', { name: first })} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1 tracking-tight">{t('employer.invite.title')}</h3>
      <p className="text-dim text-small leading-relaxed mb-4">{t('employer.invite.intro', { name: first })}</p>
      {gigs === null ? (
        <div className="flex flex-col gap-2.5">{[0, 1].map((i) => <div key={i} className="skeleton h-[68px] rounded-2xl" />)}</div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-2">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-surface-2 border border-line text-dim mb-3" aria-hidden="true"><Icon name="jobs" size={26} /></div>
          <p className="text-dim text-small leading-relaxed mb-4">{t('employer.invite.noJobs')}</p>
          <Button block onClick={() => { onClose(); navigate('post'); }}>{t('post.title')}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {gigs.map((g) => {
            const c = catById(g.category);
            return (
              <button key={g.id} disabled={busyId !== null} onClick={() => invite(g)}
                className="text-left border border-line rounded-2xl p-3.5 bg-surface flex gap-3 items-center hover:border-brand transition active:scale-[.99] disabled:opacity-50">
                <Tile emoji={c.icon} size="sm" />
                <div className="flex-1 min-w-0"><b className="text-small text-ink block truncate">{g.title}</b><span className="text-small text-dim font-mono tnum">{money(g.hours * g.payPerHour)} · {g.when}</span></div>
                <span className="text-brand font-bold text-small shrink-0">{busyId === g.id ? '…' : t('employer.invite.button')}</span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
