import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../store/appStore';
import { useLanguage, useT } from '../../providers/LanguageProvider';
import { api, type OwnerPeople } from '../../lib/api';
import { Avatar, Card, EmptyState, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { OwnerRoleSwitch } from './RoleSwitch';

/**
 * Everyone who has joined, for the owner only.
 *
 * Built so a new sign-up can be thanked and asked what they need: a name and
 * an area are not enough to do that, a number is. Call and WhatsApp open the
 * phone's own apps; Message opens a Vuka chat. The server refuses this list to
 * every other account.
 */

/** 082 123 4567 → 27821234567, the form wa.me wants. */
function waNumber(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('27')) return d;
  if (d.startsWith('0')) return `27${d.slice(1)}`;
  return d;
}

const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

type Filter = 'all' | 'worker' | 'employer';

export function OwnerPeoplePage() {
  const { navigate } = useApp();
  const t = useT();
  const { meta } = useLanguage();
  const [data, setData] = useState<OwnerPeople | null>(null);
  const [failed, setFailed] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.ownerPeople().then(setData).catch((e) => setFailed((e as Error).message));
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.people ?? []).filter((p) => (filter === 'all' || p.role === filter)
      && (!needle || p.name.toLowerCase().includes(needle) || (p.location ?? '').toLowerCase().includes(needle) || p.phone.includes(needle)));
  }, [data, filter, q]);

  const joined = (iso: string) => new Date(iso).toLocaleDateString(meta.tag, { day: 'numeric', month: 'short', year: 'numeric' });

  if (failed) return <div className="max-w-[720px] mx-auto"><EmptyState icon="lock" title={failed} hint="" /></div>;

  const chip = (f: Filter, label: string, n?: number) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      aria-pressed={filter === f}
      className={`min-h-[44px] px-3.5 rounded-pill border text-small font-bold transition ${filter === f ? 'bg-ink text-canvas border-ink' : 'border-line text-ink hover:bg-surface-2'}`}
    >
      {label}{n !== undefined && <span className="ml-1.5 font-mono tnum opacity-80">{n}</span>}
    </button>
  );

  const action = 'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-pill border border-line text-small font-bold text-ink hover:bg-surface-2 transition active:scale-95';

  return (
    <div className="max-w-[720px] mx-auto">
      <header className="mb-3">
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">{t('owner.onlyYou')}</small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('owner.title')}<span className="text-brand">.</span></h1>
        {data && <p className="m-0 mt-1 text-small text-dim">{t('owner.thisWeek', { count: data.totals.thisWeek })}</p>}
      </header>

      <OwnerRoleSwitch className="mb-4" />

      <div className="flex flex-wrap gap-2 mb-3">
        {chip('all', t('owner.all'), data?.totals.all)}
        {chip('worker', t('owner.workers'), data?.totals.workers)}
        {chip('employer', t('owner.employers'), data?.totals.employers)}
      </div>
      <label className="block mb-3">
        <span className="sr-only">{t('owner.search')}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('owner.search')}
          className="w-full min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-body text-ink placeholder:text-faint"
        />
      </label>

      {data === null ? (
        <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => (
          <Card key={i} className="p-3.5 flex gap-3.5 items-center">
            <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" />
            <div className="flex-1 flex flex-col gap-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
          </Card>
        ))}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon="search" title={t('owner.empty')} hint="" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((p) => (
            <Card key={p.id} className="p-3.5">
              <div className="flex gap-3.5 items-start">
                <Avatar initials={initials(p.name)} verified={p.verified} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <b className="text-body font-extrabold text-ink tracking-tight">{p.name}</b>
                    <span className="text-micro font-bold uppercase tracking-wide text-faint">{p.role === 'employer' ? t('owner.employer') : t('owner.worker')}</span>
                  </div>
                  <div className="text-small text-dim mt-0.5">{p.location || t('owner.noArea')} · {t('owner.joined', { date: joined(p.joined) })}</div>
                  <div className="text-small text-ink mt-0.5 font-mono tnum">{p.phone}{p.email ? ` · ${p.email}` : ''}</div>
                  <div className="text-micro text-faint mt-1">
                    {p.role === 'employer'
                      ? t('owner.posted', { count: p.jobsPosted })
                      : t('owner.progress', { applied: p.applications, done: p.jobsDone })}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <a className={action} href={`tel:${p.phone}`}><Icon name="signal" size={14} /> {t('owner.call')}</a>
                <a className={action} href={`https://wa.me/${waNumber(p.phone)}`} target="_blank" rel="noreferrer"><Icon name="send" size={14} /> {t('owner.whatsapp')}</a>
                <button className={action} onClick={() => navigate('chat', p.id)}><Icon name="chat" size={14} /> {t('owner.message')}</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
