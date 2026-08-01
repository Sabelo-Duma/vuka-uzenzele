import { useState } from 'react';
import { bankingSummary } from '../../lib/banking';
import { useApp } from '../../store/appStore';
import { Avatar, Card } from '../../components/ui';
import { AccountBar } from '../../components/AppShell';
import { InstallButton } from '../../components/InstallButton';
import { FollowingCard } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';
import { BankingSheet, IdentitySheet, SafetySheet } from '../profile/SettingsSheets';

type SheetKey = 'banking' | 'identity' | 'safety';

export function EmployerProfile() {
  const { state, toast, navigate, listMyGigs } = useApp();
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [, bump] = useState(0);
  const closeSheet = () => { setSheet(null); bump((n) => n + 1); };

  const bank = bankingSummary();

  const showMyJobs = async () => {
    try {
      const gigs = await listMyGigs();
      if (gigs.length === 0) { toast('No open jobs yet — post one to start hiring 🧾'); navigate('post'); }
      else toast(`You have ${gigs.length} open job${gigs.length !== 1 ? 's' : ''} posted right now 🧾`);
    } catch {
      toast('Could not load your jobs — check your connection and try again.');
    }
  };

  const rows = [
    { ic: '💳', title: 'Banking details', sub: bank ? `${bank} · tap to edit` : 'Add your payment details', go: () => setSheet('banking') },
    { ic: '🪪', title: 'Verify your identity', sub: 'Builds trust with workers', go: () => setSheet('identity') },
    { ic: '🧾', title: 'My posted jobs', sub: 'See your open jobs', go: showMyJobs },
    { ic: '⭐', title: 'Your employer rating', sub: '5.0 — workers rate you too', go: () => toast('Your employer rating is 5.0 ⭐ — workers rate you after each job') },
    { ic: '🛡️', title: 'Safety centre', sub: 'How Vuka keeps hiring safe', go: () => setSheet('safety') },
  ];

  return (
    <>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Your account</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Profile<span className="text-red">.</span></h2>
      </header>

      <Card className="p-5 text-center mb-3.5">
        <div className="flex justify-center mb-2.5"><Avatar initials="You" color="var(--gj-navy)" size="lg" /></div>
        <h3 className="m-0 text-[19px] font-extrabold text-navy tracking-tight">{state.user?.name ?? 'Employer account'}</h3>
        <p className="m-0 mt-1 text-[13px] text-muted">Post jobs · hire verified youth</p>
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

      <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-2">Two-way reviews keep everyone accountable — workers rate employers too.</p>
      <div className="mt-2"><AccountBar /></div>

      {sheet === 'banking' && <BankingSheet onClose={closeSheet} />}
      {sheet === 'identity' && <IdentitySheet verified={false} onClose={closeSheet} />}
      {sheet === 'safety' && <SafetySheet onClose={closeSheet} />}
    </>
  );
}
