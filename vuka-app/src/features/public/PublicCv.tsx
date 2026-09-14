import { useEffect, useState } from 'react';
import { api, ApiError, type PublicCvResult } from '../../lib/api';
import { catById, roleTitleFor } from '../../data/catalog';
import { ratingLabel, isUnrated } from '../../lib/format';
import { Card } from '../../components/ui';
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
    <header className="sticky top-0 z-10 bg-surface-veil backdrop-blur border-b border-line">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-extrabold text-ink tracking-tight">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-solid" />Vuka Uzenzele
        </a>
        {showCta && <a href="/" className="rounded-pill bg-brand-solid text-brand-on text-small font-bold px-4 py-2 hover:bg-brand-hover transition active:scale-95">Create your free CV</a>}
      </div>
    </header>
  );
}

function CvBody({ data }: { data: PublicCvResult }) {
  const { name, cv, profile, history } = data;
  const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';
  const ordered = [...(history ?? [])].reverse();
  // CV-shaped evidence, computed from the same confirmed jobs.
  const hoursWorked = (history ?? []).reduce((n, h) => n + h.hours, 0);
  const verifiedRefs = (history ?? []).filter((h) => !isUnrated(h.rating)).length;
  const jobsPerCategory = (history ?? []).reduce<Record<string, number>>(
    (acc, h) => ({ ...acc, [h.category]: (acc[h.category] ?? 0) + 1 }), {});
  const cvRole = roleTitleFor(
    Object.entries(jobsPerCategory).sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? profile?.skills?.[0] ?? ''
  );

  return (
    <>
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-verified-soft text-verified text-micro font-bold px-3 py-1">
          <Icon name="shield" size={13} /> Verified Vuka CV
        </span>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden mb-3.5">
        <div className="p-6 text-on-feature relative overflow-hidden feature-band">
          <span aria-hidden="true" className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,176,31,.20), transparent 70%)' }} />
          <div className="relative flex items-center gap-4">
            <span className="grid place-items-center w-16 h-16 rounded-[20px] bg-white/15 text-head font-extrabold shrink-0">{initials}</span>
            <div className="min-w-0">
              <h1 className="font-display m-0 text-display font-extrabold leading-tight tracking-tight truncate">{name}</h1>
              <p className="m-0 mt-0.5 text-small font-bold text-on-feature-dim">{cvRole}</p>
              {/* Suburb only. Age and education level are personal information
                  with no bearing on whether someone can do the work, and the
                  server no longer sends them to this page at all. */}
              <p className="m-0 mt-1 text-small text-on-feature-dim">{profile?.location}</p>
            </div>
          </div>
          {/* Tier and reputation score are gone from here on purpose: they rank
              someone inside this marketplace and mean nothing to an employer,
              which is who opens this link. */}
          <div className="relative flex flex-wrap gap-2 mt-4">
            {profile?.idVerified && <Badge tone="verified"><Icon name="shield" size={12} /> Identity verified</Badge>}
            {typeof data.followers === 'number' && data.followers > 0 && <Badge>{data.followers} follower{data.followers === 1 ? '' : 's'}</Badge>}
          </div>
        </div>
        {/* Evidence of work, not a scoreboard — and deliberately not earnings.
            This page is public, and telling whoever is about to make an offer
            exactly what this person has accepted before bargains against them. */}
        <div className="p-4 grid grid-cols-3 gap-2">
          <Stat value={String(cv.jobsDone)} label="Jobs completed" />
          <Stat value={String(hoursWorked)} label="Hours worked" />
          <Stat value={String(verifiedRefs)} label="References" />
        </div>
      </Card>

      {profile?.bio && (
        <Card className="p-5 mb-3.5">
          <H>About</H>
          <p className="m-0 text-small text-ink leading-relaxed">{profile.bio}</p>
        </Card>
      )}

      {/* Languages, but deliberately not the email address. This page is a public
          URL: a phone number is already the account identity and an employer can
          reach the candidate through the platform, whereas publishing an inbox
          invites everything that finds it. The address goes on the downloadable
          CV instead, which the worker hands over on purpose. */}
      {profile?.languages && profile.languages.length > 0 && (
        <Card className="p-5 mb-3.5">
          <H>Languages</H>
          <p className="m-0 text-small text-ink">{profile.languages.join(', ')}</p>
        </Card>
      )}

      {profile?.skills && profile.skills.length > 0 && (
        <Card className="p-5 mb-3.5">
          <H>Skills</H>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => <span key={s} className="bg-info-soft text-info text-small font-bold px-3 py-1 rounded-full">{catById(s).label}</span>)}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <H>Verified work history · {cv.jobsDone}</H>
        {ordered.length === 0
          ? <p className="text-small text-dim m-0">No completed jobs yet.</p>
          : ordered.map((h) => {
              return (
                <div key={h.id} className="border-l-2 border-line pl-3.5 ml-1 pb-3.5 last:pb-0 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-solid border-2 border-surface" />
                  <div className="flex justify-between items-baseline gap-3">
                    <b className="text-small text-ink">{roleTitleFor(h.category)} <span className="font-semibold text-dim">· {h.employer}</span></b>
                    <span className="text-micro text-dim font-bold whitespace-nowrap">{h.date}</span>
                  </div>
                  <div className="text-small text-dim mt-0.5">{h.jobTitle} · {h.hours}h · <span className={isUnrated(h.rating) ? undefined : 'text-brand'}>{ratingLabel(h.rating)}</span></div>
                  <div className="text-small text-ink italic my-1.5 leading-snug">“{h.review}”</div>
                  {isUnrated(h.rating)
                    ? <div className="text-micro text-dim flex items-center gap-1.5"><Icon name="shield" size={13} /> Work confirmed — {h.employer} did not leave a rating</div>
                    : <div className="text-micro text-dim flex items-center gap-1.5"><span className="text-info"><Icon name="shield" size={13} /></span> Verified reference — {h.employer}</div>}
                </div>
              );
            })}
      </Card>

      <div className="text-center mt-6 mb-2">
        <p className="text-small text-dim leading-relaxed mb-3">Every reference above is verified by Vuka — built automatically from real, completed jobs. No self-written claims.</p>
        <a href="/" className="inline-flex items-center gap-2 rounded-pill bg-ink text-canvas font-bold text-small px-5 py-3 hover:bg-ink transition active:scale-95">
          Build your own verified CV — free →
        </a>
      </div>
    </>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: 'verified' }) {
  const cls = tone === 'verified' ? 'bg-verified text-canvas' : 'bg-white/15 text-on-feature';
  return <span className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-small font-bold ${cls}`}>{children}</span>;
}
function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-lead font-extrabold text-ink leading-tight font-mono tnum">{value}</b><span className="text-micro text-dim font-bold uppercase tracking-wide">{label}</span></div>;
}
function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display m-0 mb-2.5 text-micro uppercase tracking-widest text-dim font-bold">{children}</h2>;
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
      <div className="text-jumbo mb-2" aria-hidden="true">🔍</div>
      <h2 className="font-display text-ink font-extrabold text-lead m-0">{title}</h2>
      <p className="text-dim text-small leading-relaxed mt-1.5 mb-4">{body}</p>
      <a href="/" className="inline-flex rounded-pill bg-brand-solid text-brand-on font-bold text-small px-5 py-3 hover:bg-brand-hover transition">Go to Vuka Uzenzele</a>
    </Card>
  );
}
function Footer() {
  return <p className="text-center text-micro text-faint pb-8 px-4">Vuka Uzenzele · Rise up &amp; do it for yourself</p>;
}
