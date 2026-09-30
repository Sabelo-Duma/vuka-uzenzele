import { useEffect, useState } from 'react';
import { api, type NoticeKind, type Preferences } from '../lib/api';
import { currentSubscription, disablePush, enablePush, pushNeedsInstall, pushPermission, pushSupported } from '../lib/push';
import { useApp } from '../store/appStore';
import { Button, Sheet } from './ui';
import { Icon, type IconName } from './Icon';

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
  { kind: 'messages', icon: 'chat', title: 'Messages', sub: 'When someone sends you a chat message' },
  { kind: 'jobs', icon: 'pin', title: 'New gigs near me', sub: 'When a gig is posted close to where you live', worker: true },
  { kind: 'work', icon: 'briefcase', title: 'Job updates', sub: 'Applications, invitations, hires and confirmations' },
  { kind: 'money', icon: 'wallet', title: 'Payments', sub: 'Pay secured for a job, and pay released to your wallet' },
  { kind: 'account', icon: 'id', title: 'Account', sub: 'ID checks and other notices about your account' },
];

/** One line for the Profile row. */
export const notifySummary = (p: Preferences | null, role: string): string => {
  if (!p) return 'Choose what reaches your phone';
  const kinds = KINDS.filter((k) => !k.worker || role === 'worker');
  const on = kinds.filter((k) => p.notify[k.kind]).length;
  return (on === 0 ? 'All off' : `${on} of ${kinds.length} kinds on`) + (p.quietHours ? ' · quiet hours on' : '');
};

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function NotificationSettingsSheet({ onClose }: { onClose: () => void }) {
  const { state, savePrefs, toast } = useApp();
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
    try { await savePrefs(change); } catch (e) { toast((e as Error).message || 'That did not save. Try again.'); }
  };

  const turnOn = async () => {
    setBusy(true);
    try { await enablePush(state.vapidKey); toast('Notifications are on for this phone'); } catch (e) { toast((e as Error).message); }
    await readDevice();
    setBusy(false);
  };
  const turnOff = async () => {
    setBusy(true);
    try { await disablePush(); toast('Notifications are off for this phone'); } catch (e) { toast((e as Error).message); }
    await readDevice();
    setBusy(false);
  };
  const test = async () => {
    setBusy(true);
    try { await api.testPush(); toast('Sent. It should appear in a few seconds.'); } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  const quiet = prefs?.quietHours ?? null;
  const kinds = KINDS.filter((k) => !k.worker || state.role === 'worker');

  return (
    <Sheet title="Notifications" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0">Notifications</h3>
      <p className="text-small text-dim mt-1 mb-4 leading-relaxed">
        Choose what reaches your phone. Anything you switch off still appears under the bell in the app.
      </p>

      {/* 1. This phone */}
      <Section title="This phone">
        <div className="rounded-card border border-line p-3.5">
          <div className="flex items-start gap-3">
            <span className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${device === 'on' ? 'bg-verified-soft text-verified' : 'bg-surface-2 text-ink'}`} aria-hidden="true">
              <Icon name="bell" size={20} />
            </span>
            <div className="flex-1 min-w-0">
              <b className="text-small text-ink block">{DEVICE_TITLE[device]}</b>
              <p className="text-small text-dim m-0 mt-0.5 leading-snug">{DEVICE_HINT[device]}</p>
            </div>
          </div>
          {(device === 'off' || device === 'on') && (
            <div className="flex gap-2 mt-3">
              {device === 'off'
                ? <Button size="sm" className="flex-1" disabled={busy} onClick={turnOn}>Turn on for this phone</Button>
                : <>
                    <Button size="sm" variant="ghost" className="flex-1" disabled={busy} onClick={test}>Send a test</Button>
                    <Button size="sm" variant="ghost" className="flex-1" disabled={busy} onClick={turnOff}>Turn off</Button>
                  </>}
            </div>
          )}
        </div>
      </Section>

      {/* 2. Which kinds */}
      <Section title="Tell me about">
        {prefs === null ? <p className="text-small text-dim m-0">Loading your choices…</p> : (
          <div className="rounded-card border border-line divide-y divide-line">
            {kinds.map((k) => (
              <SwitchRow key={k.kind} icon={k.icon} title={k.title} sub={k.sub} on={prefs.notify[k.kind]}
                onChange={(on) => void save({ notify: { [k.kind]: on } })} />
            ))}
          </div>
        )}
      </Section>

      {/* 3. How */}
      {prefs && (
        <Section title="Privacy and quiet">
          <div className="rounded-card border border-line divide-y divide-line">
            <SwitchRow icon="lock" title="Show details on the lock screen"
              sub={prefs.previews ? 'Names and message text appear in notifications.' : 'Notifications and texts only say that something happened.'}
              on={prefs.previews} onChange={(on) => void save({ previews: on })} />
            <SwitchRow icon="moon" title="Quiet hours"
              sub={quiet ? `No buzz or SMS from ${hourLabel(quiet.start)} to ${hourLabel(quiet.end)}. It all waits in the app.` : 'Off: notifications can arrive at any time.'}
              on={!!quiet} onChange={(on) => void save({ quietHours: on ? { start: 21, end: 7 } : null })} />
            {quiet && (
              <div className="flex items-center gap-3 p-3.5">
                <HourSelect label="From" value={quiet.start} onChange={(start) => start !== quiet.end && void save({ quietHours: { start, end: quiet.end } })} />
                <HourSelect label="To" value={quiet.end} onChange={(end) => end !== quiet.start && void save({ quietHours: { start: quiet.start, end } })} />
              </div>
            )}
          </div>
          {quiet && <p className="text-micro text-faint mt-2 mb-0">South African time.</p>}
        </Section>
      )}
    </Sheet>
  );
}

const DEVICE_TITLE: Record<Device, string> = {
  checking: 'Checking this phone…',
  on: 'On for this phone',
  off: 'Off for this phone',
  blocked: 'Blocked in your settings',
  install: 'Add Vuka to your Home Screen first',
  unsupported: 'Not available in this browser',
};
const DEVICE_HINT: Record<Device, string> = {
  checking: '',
  on: 'The kinds you choose below will buzz this phone.',
  off: 'Nothing will buzz this phone. Important updates may come by SMS instead.',
  blocked: 'Allow notifications for Vuka in your phone or browser settings, then come back here.',
  install: 'On iPhone, notifications only work once Vuka is on your Home Screen. Tap Share, then Add to Home Screen.',
  unsupported: 'Everything still appears under the bell. Important updates may come by SMS.',
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
