import { useState } from 'react';
import { computeCv } from '../../lib/engine';
import { getPref, setPref } from '../../lib/prefs';
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

  const [jobAlerts, setJobAlerts] = useState(() => getPref('jobAlerts', true));
  const [dataSaver, setDataSaver] = useState(() => getPref('dataSaver', true));

  const toggle = (key: string, on: boolean, set: (v: boolean) => void, onMsg: string, offMsg: string) => {
    const next = !on;
    set(next);
    setPref(key, next);
    toast(next ? onMsg : offMsg);
  };

  type Row =
    | { kind: 'link'; ic: string; title: string; sub: string; go: () => void }
    | { kind: 'toggle'; ic: string; title: string; sub: string; on: boolean; act: () => void };

  const rows: Row[] = [
    { kind: 'link', ic: '🪜', title: 'My opportunity ladder', sub: `${cv.tier.name} · ${unlockedCount} formal jobs unlocked`, go: () => navigate('cv') },
    { kind: 'toggle', ic: '🔔', title: 'Job alerts', sub: jobAlerts ? 'On — new gigs & unlocks near you' : 'Off — you won\'t be notified', on: jobAlerts,
      act: () => toggle('jobAlerts', jobAlerts, setJobAlerts, 'Job alerts on 🔔 — we\'ll ping you about new gigs nearby', 'Job alerts off') },
    { kind: 'toggle', ic: '📶', title: 'Data saver', sub: dataSaver ? 'On — zero-rated, lighter images' : 'Off — full-quality images', on: dataSaver,
      act: () => toggle('dataSaver', dataSaver, setDataSaver, 'Data saver on 📶 — browsing stays light on data', 'Data saver off — richer images') },
    { kind: 'link', ic: '🪪', title: 'Identity', sub: w.idVerified ? 'Verified with SA ID ✅' : 'Not verified yet', go: () => toast(w.idVerified ? 'Your identity is verified with your SA ID ✅' : 'ID verification opens at pilot launch — you\'ll verify with your SA ID') },
    { kind: 'link', ic: '💳', title: 'Get paid', sub: 'Instant EFT / cash on completion', go: () => toast('Each job is paid on completion — EFT or cash, agreed with the employer 💳') },
    { kind: 'link', ic: '🛡️', title: 'Safety centre', sub: 'How Vuka keeps you safe', go: () => toast('Only ID-verified users, ratings after every job, and fair-pay checks. In-app report & block are coming for the pilot. 🛡️') },
    { kind: 'link', ic: '🌍', title: 'Language', sub: 'English (more coming)', go: () => toast('isiZulu, Sesotho & Afrikaans are on the way 🌍') },
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
        <button key={r.title} onClick={r.kind === 'toggle' ? r.act : r.go} className="w-full text-left mb-2.5 active:scale-[.99] transition">
          <Card className="p-3.5 flex gap-3.5 items-center cursor-pointer hover:bg-surface-2 hover:border-line-strong transition">
            <div className="text-[22px]" aria-hidden="true">{r.ic}</div>
            <div className="flex-1"><b className="text-sm text-navy block">{r.title}</b><div className="text-[12px] text-muted mt-0.5">{r.sub}</div></div>
            {r.kind === 'toggle'
              ? <Switch on={r.on} />
              : <span className="text-subtle"><Icon name="chev" size={18} /></span>}
          </Card>
        </button>
      ))}

      <div className="mt-4"><AccountBar /></div>
    </>
  );
}

/** Small on/off switch (visual only; state is owned by the row). */
function Switch({ on }: { on: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      className={`relative inline-block w-10 h-6 rounded-full transition ${on ? 'bg-success' : 'bg-line-strong'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </span>
  );
}
