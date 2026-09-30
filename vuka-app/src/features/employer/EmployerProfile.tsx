import { useEffect, useState } from 'react';
import { bankingSummaryText, useBanking } from '../../lib/banking';
import { api } from '../../lib/api';
import { useApp } from '../../store/appStore';
import { Avatar, Card } from '../../components/ui';
import { AccountBar } from '../../components/AppShell';
import { InstallButton } from '../../components/InstallButton';
import { FollowingCard } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';
import { BankingSheet, BlockedSheet, IdentitySheet, SafetySheet } from '../profile/SettingsSheets';
import { PrivacySheet, TermsSheet } from '../profile/LegalSheets';
import { NotificationSettingsSheet, notifySummary } from '../../components/NotificationSettings';
import { useT } from '../../providers/LanguageProvider';

type SheetKey = 'notifications' | 'banking' | 'identity' | 'safety' | 'blocked' | 'privacy' | 'terms';

export function EmployerProfile() {
  const { state, toast, navigate } = useApp();
  const t = useT();
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
    ? t('action.loading')
    : rating.rating === null
      ? t('employer.profile.noReviews')
      : t('employer.profile.ratingSub', { rating: rating.rating.toFixed(1), count: rating.count });

  const rows = [
    { ic: 'card' as const, title: t('employer.profile.banking'), sub: bank ? t('employer.profile.bankingSub', { bank }) : t('employer.profile.bankingAdd'), go: () => setSheet('banking') },
    { ic: 'id' as const, title: t('employer.profile.verify'), sub: t('employer.profile.verifySub'), go: () => setSheet('identity') },
    {
      ic: 'jobs' as const,
      title: t('employer.profile.myJobs'),
      sub: state.pendingConfirmations > 0
        ? t('employer.profile.myJobsWaiting', { count: state.pendingConfirmations })
        : t('employer.profile.myJobsSub'),
      go: () => navigate('hires'),
    },
    { ic: 'star' as const, title: t('employer.profile.rating'), sub: ratingSub, go: () => toast(rating?.rating === null || rating === null ? t('employer.profile.ratingNone') : t('employer.profile.ratingToast', { rating: rating.rating.toFixed(1), count: rating.count })) },
    { ic: 'bell' as const, title: t('me.notifications'), sub: notifySummary(state.prefs, state.role), go: () => setSheet('notifications') },
    { ic: 'shield' as const, title: t('me.safety'), sub: t('employer.profile.safetySub'), go: () => setSheet('safety') },
    { ic: 'ban' as const, title: t('employer.profile.blocked'), sub: t('employer.profile.blockedSub'), go: () => setSheet('blocked') },
    { ic: 'lock' as const, title: t('employer.profile.privacy'), sub: t('employer.profile.privacySub'), go: () => setSheet('privacy') },
    { ic: 'doc' as const, title: t('employer.profile.terms'), sub: t('employer.profile.termsSub'), go: () => setSheet('terms') },
  ];

  return (
    <>
      <header className="mb-3">
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">{t('employer.profile.eyebrow')}</small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('employer.profile.title')}<span className="text-brand">.</span></h1>
      </header>

      <Card className="p-5 text-center mb-3.5">
        <div className="flex justify-center mb-2.5"><Avatar initials={t('nav.you')} size="lg" /></div>
        <h3 className="font-display m-0 text-title font-extrabold text-ink tracking-tight">{state.user?.name ?? t('nav.accountEmployer')}</h3>
        <p className="m-0 mt-1 text-small text-dim">{t('employer.profile.tagline')}</p>
      </Card>

      <div className="lg:hidden mb-2.5"><InstallButton className="w-full py-3" /></div>

      <FollowingCard />

      {rows.map((r) => (
        <button key={r.title} onClick={r.go} className="w-full text-left mb-2.5 active:scale-[.99] transition">
          <Card className="p-3.5 flex gap-3.5 items-center cursor-pointer hover:bg-surface-2 hover:border-faint transition">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-2 text-ink shrink-0" aria-hidden="true"><Icon name={r.ic} size={20} /></span>
            <div className="flex-1"><b className="text-small text-ink block">{r.title}</b><div className="text-small text-dim mt-0.5">{r.sub}</div></div>
            <span className="text-faint"><Icon name="chev" size={18} /></span>
          </Card>
        </button>
      ))}

      <p className="text-center text-small text-dim leading-relaxed px-4 py-2">{t('employer.profile.twoWay')}</p>
      <div className="mt-2"><AccountBar /></div>

      {sheet === 'notifications' && <NotificationSettingsSheet onClose={closeSheet} />}
      {sheet === 'banking' && <BankingSheet onClose={closeSheet} />}
      {sheet === 'identity' && <IdentitySheet verified={false} onClose={closeSheet} />}
      {sheet === 'safety' && <SafetySheet onClose={closeSheet} />}
      {sheet === 'blocked' && <BlockedSheet onClose={closeSheet} />}
      {sheet === 'privacy' && <PrivacySheet onClose={closeSheet} />}
      {sheet === 'terms' && <TermsSheet onClose={closeSheet} />}
    </>
  );
}
