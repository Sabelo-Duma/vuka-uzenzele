import { BADGES, catById, TIERS } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { Avatar, Button, Card, EmptyState } from '../../components/ui';
import { DetailHeader, Hero, PayBox, StickyCta } from '../../components/bits';
import { Icon } from '../../components/Icon';

export function WorkerDetail({ id }: { id: string }) {
  const { state, navigate, toast } = useApp();
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
        <Button block variant="navy" onClick={() => toast(`Request sent to ${w.name.split(' ')[0]}! They'll confirm shortly. 🤝`)}>Book {w.name.split(' ')[0]}</Button>
      </StickyCta>
    </>
  );
}
