import { useEffect, useState } from 'react';
import { BADGES, catById, TIERS } from '../../data/catalog';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { Gig } from '../../types';
import { Avatar, Button, Card, EmptyState, Sheet } from '../../components/ui';
import { DetailHeader, Hero, PayBox, StickyCta } from '../../components/bits';
import { FollowButton } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';

export function WorkerDetail({ id }: { id: string }) {
  const { state, navigate } = useApp();
  const [showInvite, setShowInvite] = useState(false);
  const w = state.talent.find((x) => x.id === id);

  if (!w) {
    return (
      <>
        <DetailHeader title="Worker profile" onBack={() => navigate('talent')} />
        <EmptyState icon="🔍" title="Worker not found" hint="They may no longer be available. Browse other verified workers nearby." action={<Button onClick={() => navigate('talent')}>Back to talent</Button>} />
      </>
    );
  }

  const t = TIERS[w.tier];

  return (
    <>
      <DetailHeader title="Worker profile" onBack={() => navigate('talent')} />
      <Hero
        eyebrow={`${t.icon} ${t.name}`}
        title={w.name}
        sub={<><Icon name="pin" size={13} /> {w.location} · Age {w.age}</>}
        gradient={`linear-gradient(150deg,${w.color},${w.color}cc)`}
      >
        <PayBox cells={[
          { label: 'Tier', value: `${t.icon} ${t.name}` },
          { label: 'Rating', value: `${w.rating.toFixed(1)}★` },
          { label: 'Jobs', value: String(w.jobsDone) },
        ]} />
      </Hero>

      <div className="pt-4"><FollowButton userId={w.id} /></div>
      <div className="py-4"><p className="text-ink leading-relaxed text-sm m-0">{w.tagline}</p></div>

      <Card className="p-4 mb-4">
        <b className="text-[13px] text-navy">Skills</b>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {w.skills.map((s) => <span key={s} className="bg-[#eaf3fb] dark:bg-info/15 text-info text-[12px] font-bold px-3 py-1 rounded-full">{catById(s).icon} {catById(s).label}</span>)}
        </div>
        <b className="text-[13px] text-navy block mt-4">Badges earned</b>
        <div className="grid grid-cols-3 gap-2.5 mt-2">
          {BADGES.filter((b) => w.badges.includes(b.id)).map((b) => (
            <div key={b.id} className="border border-line rounded-[15px] p-3 text-center bg-surface"><div className="text-[26px]" aria-hidden="true">{b.icon}</div><b className="block text-[11.5px] mt-1 text-navy">{b.label}</b></div>
          ))}
        </div>
      </Card>

      {/* proof of identity */}
      <Card className="p-4 mb-4 flex gap-3 items-center">
        <Avatar initials={w.initials} color={w.color} size="sm" verified={w.idVerified} />
        <div className="text-[12.5px] text-muted leading-snug">
          {w.idVerified ? <><b className="text-navy">ID-verified.</b> Identity confirmed via SA ID — safe to invite into your home or business.</> : <><b className="text-navy">Not yet ID-verified.</b> Still building their reputation.</>}
        </div>
      </Card>

      <StickyCta>
        <div className="grid grid-cols-[1fr_auto] gap-2.5">
          <Button variant="navy" icon="briefcase" onClick={() => setShowInvite(true)}>Invite {w.name.split(' ')[0]} to a job</Button>
          <Button variant="ghost" icon="chat" onClick={() => navigate('chat', w.id)}>Message</Button>
        </div>
      </StickyCta>

      {showInvite && <InviteSheet workerId={w.id} workerName={w.name} onClose={() => setShowInvite(false)} />}
    </>
  );
}

/** Sheet: pick one of the employer's open gigs to invite this worker to. */
function InviteSheet({ workerId, workerName, onClose }: { workerId: string; workerName: string; onClose: () => void }) {
  const { listMyGigs, inviteWorker, navigate, toast } = useApp();
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
      toast(res.already ? `${first} was already invited to that job` : `Invitation sent to ${first} 🤝`);
      onClose();
    } catch (e) { toast((e as Error).message); setBusyId(null); }
  };

  return (
    <Sheet title={`Invite ${first}`} onClose={onClose}>
      <h3 className="text-xl font-extrabold text-navy m-0 mb-1 tracking-tight">Invite to a job</h3>
      <p className="text-muted text-[13.5px] leading-relaxed mb-4">Pick one of your open jobs. {first} will see the invitation and can accept it.</p>
      {gigs === null ? (
        <div className="flex flex-col gap-2.5">{[0, 1].map((i) => <div key={i} className="skeleton h-[68px] rounded-2xl" />)}</div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-2">
          <div className="text-4xl mb-2" aria-hidden="true">📋</div>
          <p className="text-muted text-[13.5px] leading-relaxed mb-4">You have no open jobs yet. Post one first, then invite workers to it.</p>
          <Button block onClick={() => { onClose(); navigate('post'); }}>Post a job</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {gigs.map((g) => {
            const c = catById(g.category);
            return (
              <button key={g.id} disabled={busyId !== null} onClick={() => invite(g)}
                className="text-left border border-line-strong rounded-2xl p-3.5 bg-surface flex gap-3 items-center hover:border-red transition active:scale-[.99] disabled:opacity-50">
                <span className="grid place-items-center w-10 h-10 rounded-xl text-xl shrink-0" style={{ background: `${c.color}22`, color: c.color }} aria-hidden="true">{c.icon}</span>
                <div className="flex-1 min-w-0"><b className="text-sm text-navy block truncate">{g.title}</b><span className="text-[12px] text-muted tnum">{money(g.hours * g.payPerHour)} · {g.when}</span></div>
                <span className="text-red font-bold text-[13px] shrink-0">{busyId === g.id ? '…' : 'Invite'}</span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
