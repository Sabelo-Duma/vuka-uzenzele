import { useState } from 'react';
import { computeCv } from '../../lib/engine';
import { getPref, setPref } from '../../lib/prefs';
import { bankingSummaryText, useBanking } from '../../lib/banking';
import { useApp } from '../../store/appStore';
import { Avatar, Card, Chip, TierBadge } from '../../components/ui';
import { AccountBar } from '../../components/AppShell';
import { InstallButton } from '../../components/InstallButton';
import { FollowingCard } from '../../components/FollowButton';
import { Icon, type IconName } from '../../components/Icon';
import { BankingSheet, BlockedSheet, EditProfileSheet, IdentitySheet, SafetySheet, LanguageSheet } from '../profile/SettingsSheets';
import { PrivacySheet, TermsSheet } from '../profile/LegalSheets';
import { WalletSheet } from './WalletSheet';
import { NotificationSettingsSheet, notifySummary } from '../../components/NotificationSettings';
import { useT } from '../../providers/LanguageProvider';

type SheetKey = 'notifications' | 'editProfile' | 'wallet' | 'banking' | 'identity' | 'safety' | 'blocked' | 'language' | 'privacy' | 'terms';

export function WorkerProfile() {
  const { state, navigate, toast } = useApp();
  const t = useT();
  const cv = computeCv(state.worker);
  const w = state.worker;
  const unlockedCount = state.formalJobs.filter((f) => f.minTier <= cv.tier.id).length;

  const [dataSaver, setDataSaver] = useState(() => getPref('dataSaver', true));
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const closeSheet = () => setSheet(null);

  /** Device-local toggle (data saver): instant, no round trip. */
  const toggleLocal = (key: string, on: boolean, set: (v: boolean) => void, onMsg: string, offMsg: string) => {
    const next = !on;
    set(next);
    setPref(key, next);
    toast(next ? onMsg : offMsg);
  };

  const { banking } = useBanking();
  const bank = bankingSummaryText(banking);

  type Row =
    | { kind: 'link'; ic: IconName; title: string; sub: string; go: () => void }
    | { kind: 'toggle'; ic: IconName; title: string; sub: string; on: boolean; act: () => void };

  const rows: Row[] = [
    { kind: 'link', ic: 'ladder', title: t('worker.profile.ladder'), sub: `${cv.tier.name} · ${t('worker.unlockedFormal', { count: unlockedCount })}`, go: () => navigate('cv') },
    { kind: 'link', ic: 'bell', title: t('me.notifications'), sub: notifySummary(state.prefs, state.role), go: () => setSheet('notifications') },
    { kind: 'toggle', ic: 'signal', title: t('me.dataSaver'), sub: dataSaver ? t('worker.profile.dataOn') : t('worker.profile.dataOff'), on: dataSaver,
      act: () => toggleLocal('dataSaver', dataSaver, setDataSaver, t('worker.profile.dataOnToast'), t('worker.profile.dataOffToast')) },
    { kind: 'link', ic: 'edit', title: t('worker.profile.edit'), sub: t('worker.profile.editSub'), go: () => setSheet('editProfile') },
    { kind: 'link', ic: 'wallet', title: t('worker.myWallet'), sub: t('worker.profile.walletSub'), go: () => setSheet('wallet') },
    { kind: 'link', ic: 'card', title: t('worker.getPaid'), sub: bank ? t('worker.profile.bankEdit', { bank }) : t('worker.profile.addBank'), go: () => setSheet('banking') },
    { kind: 'link', ic: 'id', title: t('worker.profile.identity'), sub: w.idVerified ? t('worker.profile.verifiedSaId') : t('worker.profile.notVerified'), go: () => setSheet('identity') },
    { kind: 'link', ic: 'shield', title: t('me.safety'), sub: t('worker.profile.safetySub'), go: () => setSheet('safety') },
    { kind: 'link', ic: 'ban', title: t('worker.profile.blocked'), sub: t('worker.profile.blockedSub'), go: () => setSheet('blocked') },
    { kind: 'link', ic: 'globe', title: t('me.language'), sub: t('worker.profile.languageSub'), go: () => setSheet('language') },
    { kind: 'link', ic: 'lock', title: t('worker.profile.privacy'), sub: t('worker.profile.privacySub'), go: () => setSheet('privacy') },
    { kind: 'link', ic: 'doc', title: t('worker.profile.terms'), sub: t('worker.profile.termsSub'), go: () => setSheet('terms') },
  ];

  return (
    <>
      <header className="mb-3">
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">{t('worker.profile.yourAccount')}</small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('worker.profile.title')}<span className="text-brand">.</span></h1>
      </header>

      <Card className="p-5 text-center mb-3.5">
        <div className="flex justify-center mb-2.5"><Avatar initials={w.initials} size="lg" verified={w.idVerified} tier={cv.tier.icon} /></div>
        <h3 className="font-display m-0 text-title font-extrabold text-ink tracking-tight">{w.name}</h3>
        <p className="m-0 mt-1 text-small text-dim flex items-center justify-center gap-1.5"><Icon name="pin" size={13} /> {w.location} · {t('worker.age', { age: w.age })}</p>
        <div className="flex justify-center gap-2 flex-wrap mt-2.5">
          <TierBadge icon={cv.tier.icon} name={cv.tier.name} />
          {w.idVerified && <Chip tone="verified" icon="shield">{t('worker.profile.idVerified')}</Chip>}
          <Chip tone="neutral" icon="star">{t('worker.profile.rating', { rating: cv.avg.toFixed(1) })}</Chip>
        </div>
      </Card>

      <div className="lg:hidden mb-2.5"><InstallButton className="w-full py-3" /></div>

      <FollowingCard />

      {rows.map((r) => (
        <button key={r.title} onClick={r.kind === 'toggle' ? r.act : r.go} className="w-full text-left mb-2.5 active:scale-[.99] transition">
          <Card className="p-3.5 flex gap-3.5 items-center cursor-pointer hover:bg-surface-2 hover:border-faint transition">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-2 text-ink shrink-0" aria-hidden="true"><Icon name={r.ic} size={20} /></span>
            <div className="flex-1"><b className="text-small text-ink block">{r.title}</b><div className="text-small text-dim mt-0.5">{r.sub}</div></div>
            {r.kind === 'toggle'
              ? <Switch on={r.on} />
              : <span className="text-faint"><Icon name="chev" size={18} /></span>}
          </Card>
        </button>
      ))}

      <div className="mt-4"><AccountBar /></div>

      {sheet === 'notifications' && <NotificationSettingsSheet onClose={closeSheet} />}
      {sheet === 'editProfile' && <EditProfileSheet onClose={closeSheet} />}
      {sheet === 'wallet' && <WalletSheet onClose={closeSheet} onNeedBank={() => setSheet('banking')} />}
      {sheet === 'banking' && <BankingSheet onClose={closeSheet} />}
      {sheet === 'identity' && <IdentitySheet verified={w.idVerified} onClose={closeSheet} />}
      {sheet === 'safety' && <SafetySheet onClose={closeSheet} />}
      {sheet === 'blocked' && <BlockedSheet onClose={closeSheet} />}
      {sheet === 'language' && <LanguageSheet onClose={closeSheet} />}
      {sheet === 'privacy' && <PrivacySheet onClose={closeSheet} />}
      {sheet === 'terms' && <TermsSheet onClose={closeSheet} />}
    </>
  );
}

/** Small on/off switch (visual only; state is owned by the row). */
function Switch({ on }: { on: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      className={`relative inline-block w-10 h-6 rounded-full transition ${on ? 'bg-verified' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
    </span>
  );
}
