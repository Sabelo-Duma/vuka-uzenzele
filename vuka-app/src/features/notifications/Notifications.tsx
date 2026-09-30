import { useCallback, useEffect, useState } from 'react';
import { api, type Notice, type NoticeKind } from '../../lib/api';
import { onChatEvent } from '../../lib/chatTransport';
import { currentSubscription, pushSupported } from '../../lib/push';
import { useApp } from '../../store/appStore';
import { Card, EmptyState, Skeleton } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { NotificationSettingsSheet } from '../../components/NotificationSettings';

/**
 * What the bell opens: every notice about your work, your pay and your
 * account, whatever you chose to let through to the phone. Chat messages are
 * not repeated here; Chats is their inbox.
 */
const KIND_ICON: Record<NoticeKind, IconName> = { messages: 'chat', jobs: 'pin', work: 'briefcase', money: 'wallet', account: 'id' };

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'Yesterday';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export function Notifications() {
  const { openLink, refreshNotices } = useApp();
  const [items, setItems] = useState<Notice[] | null>(null);
  const [settings, setSettings] = useState(false);
  const [phoneOff, setPhoneOff] = useState(false);

  const load = useCallback(() => {
    api.listNotifications().then((r) => setItems(r.items)).catch(() => setItems((prev) => prev ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);
  // A new notice while the list is open appears in it straight away.
  useEffect(() => onChatEvent((e) => { if (e.type === 'notification') load(); }), [load]);

  useEffect(() => {
    if (!pushSupported()) { setPhoneOff(true); return; }
    void currentSubscription().then((s) => setPhoneOff(!s));
  }, [settings]);

  const open = async (n: Notice) => {
    if (!n.read) {
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? list);
      try { await api.markNotificationsRead(n.id); } catch { /* it stays unread; no harm */ }
      void refreshNotices();
    }
    openLink(n.url);
  };

  const readAll = async () => {
    setItems((list) => list?.map((x) => ({ ...x, read: true })) ?? list);
    try { await api.markNotificationsRead(); } catch { /* retried next time */ }
    void refreshNotices();
  };

  const unread = items?.filter((n) => !n.read) ?? [];
  const earlier = items?.filter((n) => n.read) ?? [];

  return (
    <div className="max-w-[720px] mx-auto">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          <small className="text-faint text-micro font-semibold uppercase tracking-wide">Updates</small>
          <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">Notifications<span className="text-brand">.</span></h1>
        </div>
        <button
          onClick={() => setSettings(true)}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-pill border border-line text-small font-bold text-ink hover:bg-surface-2 transition active:scale-95"
        >
          <Icon name="filter" size={16} /> Settings
        </button>
      </header>

      {phoneOff && (
        <button onClick={() => setSettings(true)} className="w-full text-left mb-3 active:scale-[.99] transition">
          <Card className="p-3.5 flex items-center gap-3 hover:bg-surface-2 transition">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-surface-2 text-ink shrink-0" aria-hidden="true"><Icon name="bell" size={20} /></span>
            <div className="flex-1 min-w-0">
              <b className="text-small text-ink block">Get these on your phone</b>
              <span className="text-small text-dim">Notifications are off for this phone. You choose which kinds.</span>
            </div>
            <span className="text-faint"><Icon name="chev" size={18} /></span>
          </Card>
        </button>
      )}

      {items === null ? (
        <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => (
          <Card key={i} className="p-3.5 flex gap-3 items-center"><Skeleton className="w-10 h-10 rounded-xl" /><div className="flex-1 flex flex-col gap-2"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></Card>
        ))}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="bell" title="Nothing yet" hint="Updates about your jobs, your pay and your account will appear here." />
      ) : (
        <>
          {unread.length > 0 && (
            <Group title="New" action={<button onClick={readAll} className="min-h-[44px] px-2 -mr-2 text-small font-bold text-brand hover:underline">Mark all as read</button>}>
              {unread.map((n) => <Row key={n.id} n={n} onOpen={open} />)}
            </Group>
          )}
          {earlier.length > 0 && (
            <Group title="Earlier">{earlier.map((n) => <Row key={n.id} n={n} onOpen={open} />)}</Group>
          )}
          <p className="text-center text-micro text-faint mt-4">Notifications are kept for 90 days.</p>
        </>
      )}

      {settings && <NotificationSettingsSheet onClose={() => setSettings(false)} />}
    </div>
  );
}

function Group({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-micro text-faint font-bold uppercase tracking-wide m-0">{title}</h2>
        {action}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ n, onOpen }: { n: Notice; onOpen: (n: Notice) => void }) {
  return (
    <button onClick={() => onOpen(n)} className="w-full text-left active:scale-[.99] transition">
      <Card className={`p-3.5 flex gap-3 items-start hover:bg-surface-2 transition ${n.read ? '' : 'border-brand'}`}>
        <span className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${n.read ? 'bg-surface-2 text-dim' : 'bg-brand-soft text-ink'}`} aria-hidden="true">
          <Icon name={KIND_ICON[n.category] ?? 'bell'} size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <b className={`text-small block truncate flex-1 ${n.read ? 'text-dim' : 'text-ink'}`}>{n.title}</b>
            <span className="text-micro text-faint shrink-0">{when(n.createdAt)}</span>
          </div>
          {n.body && <p className="text-small text-dim m-0 mt-0.5 leading-snug">{n.body}</p>}
        </div>
        {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-brand-solid shrink-0 mt-1.5" aria-label="Unread" />}
      </Card>
    </button>
  );
}
