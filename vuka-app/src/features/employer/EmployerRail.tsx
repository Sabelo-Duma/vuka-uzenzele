import { TIERS } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { Button, Card } from '../../components/ui';

/** Desktop side-rail: talent stats + trust note. */
export function EmployerStats() {
  const { state } = useApp();
  const total = state.talent.length;
  const proPlus = state.talent.filter((t) => t.tier >= 2).length;
  const verified = state.talent.filter((t) => t.idVerified).length;
  return (
    <>
      <Card className="p-5">
        <div className="text-[13px] font-bold text-navy mb-3">Talent near you</div>
        <div className="grid grid-cols-3 gap-2">
          <Stat value={String(total)} label="Workers" />
          <Stat value={String(proPlus)} label="Pro+" />
          <Stat value={String(verified)} label="Verified" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-[13px] font-bold text-navy mb-1.5">🛡️ Hire with confidence</div>
        <p className="text-[12px] text-muted leading-relaxed m-0">Every worker is ID-verified with a real, reviewed CV and an earned tier ({TIERS.map((t) => t.icon).join(' ')}). Two-way reviews keep everyone accountable.</p>
      </Card>
    </>
  );
}

/** Desktop side-rail: prominent post-a-job call to action. */
export function PostJobCard() {
  const { navigate } = useApp();
  return (
    <Card className="p-5 text-white" style={{ background: 'linear-gradient(160deg,#3b0764,#5B21B6)' }}>
      <div className="text-2xl" aria-hidden="true">💼</div>
      <b className="block text-[15px] mt-2">Need a hand today?</b>
      <p className="text-[12.5px] text-white/80 my-2 leading-snug">Post a job in 30 seconds. Verified youth nearby apply — you pick by rating and tier.</p>
      <Button block variant="primary" icon="plus" onClick={() => navigate('post')}>Post a job</Button>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-[18px] font-extrabold text-navy leading-tight tnum">{value}</b><span className="text-[10px] text-muted font-bold uppercase tracking-wide">{label}</span></div>;
}
