import { useEffect, useState } from 'react';
import { api, ApiError, type PublicCvResult } from '../../lib/api';
import { catById, TIERS } from '../../data/catalog';
import { money, stars } from '../../lib/format';
import { Card, Ring } from '../../components/ui';
import { Icon } from '../../components/Icon';

/**
 * Public, read-only CV page — resolves the "Copy share link" URL (/cv/:id).
 * No authentication required: anyone (e.g. an employer) can open it.
 */
export function PublicCv({ id }: { id: string }) {
  const [data, setData] = useState<PublicCvResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    api.getPublicCv(id)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'This CV could not be loaded.'); });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="min-h-screen bg-surface-2 text-ink">
      <TopBar showCta={!error} />
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6">
        {error ? <Notice title="This CV link isn't available" body={error} />
          : !data ? <LoadingCv />
          : <CvBody data={data} />}
      </div>
      <Footer />
    </div>
  );
}

function TopBar({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-line">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-extrabold text-navy tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-red" />Vuka Uzenzele
        </a>
        {showCta && <a href="/" className="rounded-pill bg-red text-white text-[13px] font-bold px-4 py-2 hover:bg-red-hover transition active:scale-95">Create your free CV</a>}
      </div>
    </header>
  );
}

function CvBody({ data }: { data: PublicCvResult }) {
  const { name, cv, profile, history } = data;
  const tier = TIERS[cv.tier.id];
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
  const ordered = [...history].reverse();

  return (
    <>
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-[#e6f5e6] dark:bg-success/15 text-success text-[11.5px] font-bold px-3 py-1">
          <Icon name="shield" size={13} /> Verified Vuka CV
        </span>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden mb-3.5">
        <div className="p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(150deg,var(--gj-navy),#123e69)' }}>
          <span aria-hidden="true" className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,0,35,.28), transparent 70%)' }} />
          <div className="relative flex items-center gap-4">
            <span className="grid place-items-center w-16 h-16 rounded-[20px] bg-white/15 text-2xl font-extrabold shrink-0">{initials}</span>
            <div className="min-w-0">
              <h1 className="m-0 text-[26px] font-extrabold leading-tight tracking-tight truncate">{name}</h1>
              <p className="m-0 mt-0.5 text-[13px] text-white/85">{[profile?.location, profile?.age ? `Age ${profile.age}` : '', profile?.education].filter(Boolean).join('  ·  ')}</p>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2 mt-4">
            <Badge>{tier.icon} {cv.tier.name} tier</Badge>
            <Badge>Reputation {cv.rep}/100</Badge>
            {profile?.idVerified && <Badge tone="verified"><Icon name="shield" size={12} /> Identity verified</Badge>}
            {typeof data.followers === 'number' && data.followers > 0 && <Badge>{data.followers} follower{data.followers === 1 ? '' : 's'}</Badge>}
          </div>
        </div>
        <div className="p-4 flex items-center gap-4">
          <Ring pct={cv.rep} colors={tier.ring} size={72} stroke={8} gradId="publicRing">
            <b className="text-lg font-extrabold text-navy leading-none tnum">{cv.rep}</b>
          </Ring>
          <div className="grid grid-cols-3 gap-2 flex-1">
            <Stat value={String(cv.jobsDone)} label="Verified jobs" />
            <Stat value={`${cv.avg.toFixed(1)}★`} label="Avg rating" />
            <Stat value={money(cv.totalEarned)} label="Earned" />
          </div>
        </div>
      </Card>

      {profile?.bio && (
        <Card className="p-5 mb-3.5">
          <H>About</H>
          <p className="m-0 text-[13.5px] text-ink leading-relaxed">{profile.bio}</p>
        </Card>
      )}

      {profile?.skills && profile.skills.length > 0 && (
        <Card className="p-5 mb-3.5">
          <H>Skills</H>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => <span key={s} className="bg-[#eaf3fb] dark:bg-info/15 text-info text-[12px] font-bold px-3 py-1 rounded-full">{catById(s).label}</span>)}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <H>Verified work history · {cv.jobsDone}</H>
        {ordered.length === 0
          ? <p className="text-[13px] text-muted m-0">No completed jobs yet.</p>
          : ordered.map((h) => {
              const c = catById(h.category);
              return (
                <div key={h.id} className="border-l-2 border-navy pl-3.5 ml-1 pb-3.5 last:pb-0 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-red border-2 border-surface" />
                  <div className="flex justify-between items-baseline gap-3">
                    <b className="text-sm text-navy">{h.jobTitle}</b>
                    <span className="text-[11px] text-muted font-bold whitespace-nowrap">{h.date}</span>
                  </div>
                  <div className="text-[12px] text-muted mt-0.5">{c.icon} {c.label} · {h.hours}h · <span style={{ color: '#F59E0B' }}>{stars(h.rating)}</span></div>
                  <div className="text-[12.5px] text-ink italic my-1.5 leading-snug">“{h.review}”</div>
                  <div className="text-[11.5px] text-muted flex items-center gap-1.5"><span className="text-info"><Icon name="shield" size={13} /></span> Verified reference — {h.employer}</div>
                </div>
              );
            })}
      </Card>

      <div className="text-center mt-6 mb-2">
        <p className="text-[12.5px] text-muted leading-relaxed mb-3">Every reference above is verified by Vuka — built automatically from real, completed jobs. No self-written claims.</p>
        <a href="/" className="inline-flex items-center gap-2 rounded-pill bg-navy text-white dark:text-navy-deep font-bold text-sm px-5 py-3 hover:bg-navy-2 transition active:scale-95">
          Build your own verified CV — free →
        </a>
      </div>
    </>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: 'verified' }) {
  const cls = tone === 'verified' ? 'bg-success text-white' : 'bg-white/15 text-white';
  return <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[12px] font-bold ${cls}`}>{children}</span>;
}
function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-[16px] font-extrabold text-navy leading-tight tnum">{value}</b><span className="text-[10px] text-muted font-bold uppercase tracking-wide">{label}</span></div>;
}
function H({ children }: { children: React.ReactNode }) {
  return <h2 className="m-0 mb-2.5 text-[11px] uppercase tracking-widest text-muted font-bold">{children}</h2>;
}

function LoadingCv() {
  return (
    <>
      <Card className="p-6 mb-3.5"><div className="flex items-center gap-4">
        <div className="skeleton w-16 h-16 rounded-[20px]" />
        <div className="flex-1 flex flex-col gap-2"><div className="skeleton h-5 w-1/2 rounded" /><div className="skeleton h-3 w-3/4 rounded" /></div>
      </div></Card>
      <Card className="p-5 mb-3.5 flex flex-col gap-2"><div className="skeleton h-3 w-full rounded" /><div className="skeleton h-3 w-5/6 rounded" /></Card>
      <Card className="p-5 flex flex-col gap-3">{[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-1.5"><div className="skeleton h-4 w-2/3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>)}</Card>
    </>
  );
}
function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="text-5xl mb-2" aria-hidden="true">🔍</div>
      <h2 className="text-navy font-extrabold text-lg m-0">{title}</h2>
      <p className="text-muted text-[13.5px] leading-relaxed mt-1.5 mb-4">{body}</p>
      <a href="/" className="inline-flex rounded-pill bg-red text-white font-bold text-sm px-5 py-3 hover:bg-red-hover transition">Go to Vuka Uzenzele</a>
    </Card>
  );
}
function Footer() {
  return <p className="text-center text-[11px] text-subtle pb-8 px-4">Vuka Uzenzele · Rise up &amp; do it for yourself</p>;
}
