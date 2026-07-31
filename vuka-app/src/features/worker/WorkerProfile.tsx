import { computeCv } from '../../lib/engine';
import { useApp } from '../../store/appStore';
import { Avatar, Card, Chip, TierBadge } from '../../components/ui';
import { AccountBar } from '../../components/AppShell';
import { InstallButton } from '../../components/InstallButton';
import { FollowingCard } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';

export function WorkerProfile() {
  const { state, navigate, toast } = useApp();
  const cv = computeCv(state.worker);
  const w = state.worker;
  const unlockedCount = state.formalJobs.filter((f) => f.minTier <= cv.tier.id).length;

  const rows: { ic: string; title: string; sub: string; go: () => void }[] = [
    { ic: '🪜', title: 'My opportunity ladder', sub: `${cv.tier.name} · ${unlockedCount} formal jobs unlocked`, go: () => navigate('cv') },
    { ic: '🔔', title: 'Job alerts', sub: 'Get notified of new gigs & unlocks near you', go: () => toast('Job alerts are on 🔔 — we\'ll ping you about new gigs nearby') },
    { ic: '📶', title: 'Data saver', sub: 'On — zero-rated mode active', go: () => toast('Data saver is on 📶 — browsing and applying stay zero-rated') },
    { ic: '🪪', title: 'Identity', sub: w.idVerified ? 'Verified with SA ID ✅' : 'Not verified — verify to unlock more', go: () => toast(w.idVerified ? 'Your identity is verified ✅' : 'Identity verification coming soon') },
    { ic: '💳', title: 'Get paid', sub: 'Instant EFT / cash on completion', go: () => toast('Payments are handled per job — EFT or cash on completion 💳') },
    { ic: '🛡️', title: 'Safety centre', sub: 'Report, block & emergency contacts', go: () => toast('Safety centre — report, block, or reach emergency contacts 🛡️') },
    { ic: '🌍', title: 'Language', sub: 'English · isiZulu · Sesotho · Afrikaans', go: () => toast('More languages are on the way 🌍') },
  ];

  return (
    <>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Your account</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Profile<span className="text-red">.</span></h2>
      </header>

      <Card className="p-5 text-center mb-3.5">
        <div className="flex justify-center mb-2.5"><Avatar initials={w.initials} color={w.color} size="lg" verified={w.idVerified} tier={cv.tier.icon} /></div>
        <h3 className="m-0 text-[19px] font-extrabold text-navy tracking-tight">{w.name}</h3>
        <p className="m-0 mt-1 text-[13px] text-muted flex items-center justify-center gap-1.5"><Icon name="pin" size={13} /> {w.location} · Age {w.age}</p>
        <div className="flex justify-center gap-2 flex-wrap mt-2.5">
          <TierBadge icon={cv.tier.icon} name={cv.tier.name} color={cv.tier.color} />
          {w.idVerified && <Chip tone="fair" icon="shield">ID Verified</Chip>}
          <Chip tone="time">⭐ {cv.avg.toFixed(1)} rating</Chip>
        </div>
      </Card>

      <div className="lg:hidden mb-2.5"><InstallButton className="w-full py-3" /></div>

      <FollowingCard />

      {rows.map((r) => (
        <button key={r.title} onClick={r.go} className="w-full text-left mb-2.5 active:scale-[.99] transition">
          <Card className="p-3.5 flex gap-3.5 items-center cursor-pointer hover:bg-surface-2 hover:border-line-strong transition">
            <div className="text-[22px]" aria-hidden="true">{r.ic}</div>
            <div className="flex-1"><b className="text-sm text-navy block">{r.title}</b><div className="text-[12px] text-muted mt-0.5">{r.sub}</div></div>
            <span className="text-subtle"><Icon name="chev" size={18} /></span>
          </Card>
        </button>
      ))}

      <div className="mt-4"><AccountBar /></div>
    </>
  );
}
