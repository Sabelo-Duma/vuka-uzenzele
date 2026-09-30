import { useEffect, useState } from 'react';
import { api, type NoticeKind, type Preferences } from '../lib/api';
import { currentSubscription, disablePush, enablePush, pushNeedsInstall, pushPermission, pushSupported } from '../lib/push';
import { useApp } from '../store/appStore';
import { Button, Sheet } from './ui';
import { Icon, type IconName } from './Icon';
import { tr } from '../i18n';
import { useT } from '../providers/LanguageProvider';

/**
 * Notification settings.
 *
 * People differ: some want every buzz, some want none, most want the ones
 * about being hired and being paid and not the rest. So there are three
 * separate questions, answered separately:
 *   1. Does THIS phone get notifications at all? (the browser's permission)
 *   2. Which kinds? (one switch each, saved on the account, so they follow
 *      you to another phone)
 *   3. How? (details on the lock screen or not; quiet hours)
 * None of them touches the list behind the bell: switching something off here
 * hides the buzz, never the news.
 */

type Device = 'on' | 'off' | 'blocked' | 'install' | 'unsupported' | 'checking';

const KINDS: { kind: NoticeKind; icon: IconName; title: string; sub: string; worker?: boolean }[] = [
  { kind: 'messages', icon: 'chat', title: 'profile.notify.messages', sub: 'profile.notify.messagesSub' },
  { kind: 'jobs', icon: 'pin', title: 'profile.notify.jobs', sub: 'profile.notify.jobsSub', worker: true },
  { kind: 'work', icon: 'briefcase', title: 'profile.notify.work', sub: 'profile.notify.workSub' },
  { kind: 'money', icon: 'wallet', title: 'profile.notify.money', sub: 'profile.notify.moneySub' },
  { kind: 'account', icon: 'id', title: 'profile.notify.account', sub: 'profile.notify.accountSub' },
];

/** One line for the Profile row. */
export const notifySummary = (p: Preferences | null, role: string): string => {
  if (!p) return tr('profile.notify.summaryNone');
  const kinds = KINDS.filter((k) => !k.worker || role === 'worker');
  const on = kinds.filter((k) => p.notify[k.kind]).length;
  return (on === 0 ? tr('profile.notify.allOff') : tr('profile.notify.kindsOn', { on, total: kinds.length })) + (p.quietHours ? ` · ${tr('profile.notify.quietOn')}` : '');
};

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function NotificationSettingsSheet({ onClose }: { onClose: () => void }) {
  const { state, savePrefs, toast } = useApp();
  const t = useT();
  const prefs = state.prefs;
  const [device, setDevice] = useState<Device>('checking');
  const [busy, setBusy] = useState(false);

  const readDevice = async () => {
    if (!pushSupported()) return setDevice('unsupported');
    if (pushNeedsInstall()) return setDevice('install');
    if (pushPermission() === 'denied') return setDevice('blocked');
    setDevice((await currentSubscription()) ? 'on' : 'off');
  };
  useEffect(() => { void readDevice(); }, []);

  const save = async (change: Parameters<typeof savePrefs>[0]) => {
    try { await savePrefs(change); } catch (e) { toast((e as Error).message || t('profile.notify.saveFailed')); }
  };

  const turnOn = async () => {
    setBusy(true);
    try { await enablePush(state.vapidKey); toast(t('profile.notify.onToast')); } catch (e) { toast((e as Error).message); }
    await readDevice();
    setBusy(false);
  };
  const turnOff = async () => {
    setBusy(true);
    try { await disablePush(); toast(t('profile.notify.offToast')); } catch (e) { toast((e as Error).message); }
    await readDevice();
    setBusy(false);
  };
  const test = async () => {
    setBusy(true);
    try { await api.testPush(); toast(t('profile.notify.testSent')); } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  const quiet = prefs?.quietHours ?? null;
  const kinds = KINDS.filter((k) => !k.worker || state.role === 'worker');

  return (
    <Sheet title={t('me.notifications')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0">{t('me.notifications')}</h3>
      <p className="text-small text-dim mt-1 mb-4 leading-relaxed">
        {t('profile.notify.intro')}
      </p>

      {/* 1. This phone */}
      <Section title={t('profile.notify.thisPhone')}>
        <div className="rounded-card border border-line p-3.5">
          <div className="flex items-start gap-3">
            <span className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${device === 'on' ? 'bg-verified-soft text-verified' : 'bg-surface-2 text-ink'}`} aria-hidden="true">
              <Icon name="bell" size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <b className="text-small text-ink block">{t(DEVICE_TITLE[device])}</b>
              <p className="text-small text-dim m-0 mt-0.5 leading-snug">{DEVICE_HINT[device] && t(DEVICE_HINT[device])}</p>
            </div>
          </div>
          {(device === 'off' || device === 'on') && (
            <div className="flex gap-2 mt-3">
              {device === 'off'
                ? <Button size="sm" className="flex-1" disabled={busy} onClick={turnOn}>{t('profile.notify.turnOn')}</Button>
                : <>
                    <Button size="sm" variant="ghost" className="flex-1" disabled={busy} onClick={test}>{t('profile.notify.test')}</Button>
                    <Button size="sm" variant="ghost" className="flex-1" disabled={busy} onClick={turnOff}>{t('profile.notify.turnOff')}</Button>
                  </>}
            </div>
          )}
        </div>
      </Section>

      {/* 2. Which kinds */}
      <Section title={t('profile.notify.tellMe')}>
        {prefs === null ? <p className="text-small text-dim m-0">{t('profile.notify.loading')}</p> : (
          <div className="rounded-card border border-line divide-y divide-line">
            {kinds.map((k) => (
              <SwitchRow key={k.kind} icon={k.icon} title={t(k.title)} sub={t(k.sub)} on={prefs.notify[k.kind]}
                onChange={(on) => void save({ notify: { [k.kind]: on } })} />
            ))}
          </div>
        )}
      </Section>

      {/* 3. How */}
      {prefs && (
        <Section title={t('profile.notify.privacy')}>
          <div className="rounded-card border border-line divide-y divide-line">
            <SwitchRow icon="lock" title={t('profile.notify.lockScreen')}
              sub={prefs.previews ? t('profile.notify.previewsOn') : t('profile.notify.previewsOff')}
              on={prefs.previews} onChange={(on) => void save({ previews: on })} />
            <SwitchRow icon="moon" title={t('profile.notify.quiet')}
              sub={quiet ? t('profile.notify.quietRange', { start: hourLabel(quiet.start), end: hourLabel(quiet.end) }) : t('profile.notify.quietOff')}
              on={!!quiet} onChange={(on) => void save({ quietHours: on ? { start: 21, end: 7 } : null })} />
            {quiet && (
              <div className="flex items-center gap-3 p-3.5">
                <HourSelect label={t('profile.notify.from')} value={quiet.start} onChange={(start) => start !== quiet.end && void save({ quietHours: { start, end: quiet.end } })} />
                <HourSelect label={t('profile.notify.to')} value={quiet.end} onChange={(end) => end !== quiet.start && void save({ quietHours: { start: quiet.start, end } })} />
              </div>
            )}
          </div>
          {quiet && <p className="text-micro text-faint mt-2 mb-0">{t('profile.notify.saTime')}</p>}
        </Section>
      )}
    </Sheet>
  );
}

/* Catalogue keys, looked up with t() where they are shown. */
const DEVICE_TITLE: Record<Device, string> = {
  checking: 'profile.notify.device.checking',
  on: 'profile.notify.device.on',
  off: 'profile.notify.device.off',
  blocked: 'profile.notify.device.blocked',
  install: 'profile.notify.device.install',
  unsupported: 'profile.notify.device.unsupported',
};
const DEVICE_HINT: Record<Device, string> = {
  checking: '',
  on: 'profile.notify.hint.on',
  off: 'profile.notify.hint.off',
  blocked: 'profile.notify.hint.blocked',
  install: 'profile.notify.hint.install',
  unsupported: 'profile.notify.hint.unsupported',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h4 className="text-micro text-faint font-bold uppercase tracking-wide m-0 mb-2">{title}</h4>
      {children}
    </section>
  );
}

function SwitchRow({ icon, title, sub, on, onChange }: { icon: IconName; title: string; sub: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-surface-2 transition first:rounded-t-card last:rounded-b-card">
      <span className="text-dim shrink-0" aria-hidden="true"><Icon name={icon} size={20} /></span>
      <span className="flex-1 min-w-0">
        <b className="text-small text-ink block">{title}</b>
        <span className="text-small text-dim block mt-0.5 leading-snug">{sub}</span>
      </span>
      <span className={`relative inline-block w-10 h-6 rounded-full shrink-0 transition ${on ? 'bg-verified' : 'bg-line'}`} aria-hidden="true">
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

function HourSelect({ label, value, onChange }: { label: string; value: number; onChange: (h: number) => void }) {
  return (
    <label className="flex-1 flex flex-col gap-1">
      <span className="text-micro text-dim font-bold">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border-[1.5px] border-line rounded-chip px-3 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-ink">
        {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
      </select>
    </label>
  );
}
