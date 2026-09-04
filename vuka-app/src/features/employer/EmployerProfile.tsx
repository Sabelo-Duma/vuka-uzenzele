import { useEffect, useState } from 'react';
import { bankingSummaryText, useBanking } from '../../lib/banking';
import { api } from '../../lib/api';
import { useApp } from '../../store/appStore';
import { Avatar, Card } from '../../components/ui';
import { AccountBar } from '../../components/AppShell';
import { InstallButton } from '../../components/InstallButton';
import { FollowingCard } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';
import { BankingSheet, IdentitySheet, SafetySheet } from '../profile/SettingsSheets';
import { PrivacySheet, TermsSheet } from '../profile/LegalSheets';

type SheetKey = 'banking' | 'identity' | 'safety' | 'privacy' | 'terms';

export function EmployerProfile() {
  const { state, toast, navigate } = useApp();
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const closeSheet = () => setSheet(null);

  const { banking } = useBanking();
  const bank = bankingSummaryText(banking);

  // Real rating, averaged from the workers this employer has hired.
  const [rating, setRating] = useState<{ rating: number | null; count: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.myEmployerRating().then((r) => { if (!cancelled) setRating(r); }).catch(() => { /* leave it unknown */ });
    return () => { cancelled = true; };
  }, []);

  const ratingSub = rating === null
    ? 'Loading…'
    : rating.rating === null
      ? 'No reviews yet — workers rate you after each job'
      : `${rating.rating.toFixed(1)} ⭐ from ${rating.count} worker review${rating.count === 1 ? '' : 's'}`;

  const rows = [
    { ic: '💳', title: 'Banking details', sub: bank ? `${bank} · tap to edit` : 'Add your payment details', go: () => setSheet('banking') },
    { ic: '🪪', title: 'Verify your identity', sub: 'Builds trust with workers', go: () => setSheet('identity') },
    {
      ic: '🧾',
      title: 'My jobs & applicants',
      sub: state.pendingConfirmations > 0
        ? `${state.pendingConfirmations} job${state.pendingConfirmations === 1 ? '' : 's'} waiting on your confirmation`
        : 'See your open jobs and who applied',
      go: () => navigate('hires'),
    },
    { ic: '⭐', title: 'Your employer rating', sub: ratingSub, go: () => toast(rating?.rating === null || rating === null ? 'Workers rate you after each completed job — your rating appears here.' : `Your employer rating is ${rating.rating.toFixed(1)} ⭐ from ${rating.count} review${rating.count === 1 ? '' : 's'}`) },
    { ic: '🛡️', title: 'Safety centre', sub: 'How Vuka keeps hiring safe', go: () => setSheet('safety') },
    { ic: '🔒', title: 'Privacy & data', sub: 'What we collect and why', go: () => setSheet('privacy') },
    { ic: '📄', title: 'Terms of use', sub: 'The deal between you and Vuka', go: () => setSheet('terms') },
  ];

  return (
    <>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Your account</small>
        <h2 className="m-0 mt-0.5 text-head font-extrabold text-navy tracking-tight">Profile<span className="text-red">.</span></h2>
      </header>

      <Card className="p-5 text-center mb-3.5">
        <div className="flex justify-center mb-2.5"><Avatar initials="You" color="var(--gj-navy)" size="lg" /></div>
        <h3 className="m-0 text-title font-extrabold text-navy tracking-tight">{state.user?.name ?? 'Employer account'}</h3>
        <p className="m-0 mt-1 text-small text-muted">Post jobs · hire verified youth</p>
      </Card>

      <div className="lg:hidden mb-2.5"><InstallButton className="w-full py-3" /></div>

      <FollowingCard />

      {rows.map((r) => (
        <button key={r.title} onClick={r.go} className="w-full text-left mb-2.5 active:scale-[.99] transition">
          <Card className="p-3.5 flex gap-3.5 items-center cursor-pointer hover:bg-surface-2 hover:border-line-strong transition">
            <div className="text-head" aria-hidden="true">{r.ic}</div>
            <div className="flex-1"><b className="text-sm text-navy block">{r.title}</b><div className="text-small text-muted mt-0.5">{r.sub}</div></div>
            <span className="text-subtle"><Icon name="chev" size={18} /></span>
          </Card>
        </button>
      ))}

      <p className="text-center text-small text-muted leading-relaxed px-4 py-2">Two-way reviews keep everyone accountable — workers rate employers too.</p>
      <div className="mt-2"><AccountBar /></div>

      {sheet === 'banking' && <BankingSheet onClose={closeSheet} />}
      {sheet === 'identity' && <IdentitySheet verified={false} onClose={closeSheet} />}
      {sheet === 'safety' && <SafetySheet onClose={closeSheet} />}
      {sheet === 'privacy' && <PrivacySheet onClose={closeSheet} />}
      {sheet === 'terms' && <TermsSheet onClose={closeSheet} />}
    </>
  );
}
