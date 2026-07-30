import { createPortal } from 'react-dom';
import { BADGES, catById, TIERS } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { money, stars } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { CvSnapshot, HistoryEntry, Tier, WorkerProfile } from '../../types';
import { Button, Card, Ring, ProgressBar, SectionTitle } from '../../components/ui';
import { Icon } from '../../components/Icon';

export function CvLadder() {
  const { state, toast } = useApp();
  const cv = computeCv(state.worker);
  const w = state.worker;

  return (
    <>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Auto-generated · always up to date</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">My CV &amp; ladder<span className="text-red">.</span></h2>
      </header>

      {/* Reputation ring */}
      <Card className="p-5 text-center mb-4" style={{ background: 'linear-gradient(165deg,var(--gj-bg),var(--gj-bg-light))' }}>
        <div className="flex justify-center">
          <Ring pct={cv.rep} colors={cv.tier.ring} gradId="repRing">
            <b className="text-3xl font-extrabold text-navy leading-none tnum">{cv.rep}</b>
            <small className="text-[10px] text-muted font-bold uppercase tracking-wide mt-1">Rep score</small>
          </Ring>
        </div>
        <div className="flex justify-center gap-7 mt-2">
          <Stat value={String(cv.jobsDone)} label="Jobs done" />
          <Stat value={`${cv.avg.toFixed(1)}★`} label="Rating" />
          <Stat value={money(cv.totalEarned)} label="Earned" />
        </div>
      </Card>

      <TierCard cv={cv} />

      <SectionTitle>Your opportunity ladder</SectionTitle>
      <Card className="overflow-hidden">
        {TIERS.map((t) => <Rung key={t.id} tier={t} cv={cv} />)}
      </Card>

      <SectionTitle action={<span className="text-[12px] text-muted">{cv.earnedBadges.size}/{BADGES.length} earned</span>}>Badges</SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {BADGES.map((b) => {
          const earned = cv.earnedBadges.has(b.id);
          return (
            <div key={b.id} title={b.desc} className={`border border-line rounded-[15px] p-3 text-center bg-surface ${earned ? '' : 'opacity-40 grayscale'}`}>
              <div className="text-[26px]" aria-hidden="true">{b.icon}</div>
              <b className="block text-[11.5px] mt-1 text-navy">{b.label}</b>
            </div>
          );
        })}
      </div>

      <SectionTitle>Your CV document</SectionTitle>
      <Card className="overflow-hidden">
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#1A3B68)' }}>
          <h3 className="m-0 text-[22px] font-extrabold tracking-tight">{w.name}</h3>
          <p className="m-0 mt-1 text-[12.5px] opacity-90">{w.location} · Age {w.age} · {w.education} · Member since {w.joined}</p>
          {w.idVerified && (
            <span className="inline-flex gap-1.5 items-center mt-2.5 bg-white/15 px-2.5 py-1 rounded-full text-[11.5px] font-bold">
              <Icon name="shield" size={13} /> Identity verified · {cv.tier.name} tier · {cv.jobsDone} verified references
            </span>
          )}
        </div>
        <div className="p-4.5 p-4">
          <H5>About me</H5>
          <p className="m-0 text-[13.5px] text-ink leading-relaxed">{w.bio}</p>
          <H5>Skills</H5>
          <div className="flex flex-wrap gap-1.5">
            {w.skills.map((s) => <span key={s} className="bg-[#eaf3fb] dark:bg-info/15 text-info text-[12px] font-bold px-3 py-1 rounded-full">{catById(s).label}</span>)}
          </div>
          <H5>Verified work history</H5>
          {cv.jobsDone === 0
            ? <p className="text-[13px] text-muted m-0 leading-relaxed">No jobs yet — complete your first gig and it appears here automatically. 🌱</p>
            : [...w.history].reverse().map((h) => <CvEntry key={h.id} h={h} />)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <Button variant="navy" onClick={() => window.print()}>📄 Download PDF</Button>
        <Button variant="ghost" onClick={() => {
          const link = `${window.location.origin}/cv/${(w.name || 'me').toLowerCase().replace(/\s+/g, '-')}`;
          if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(() => toast('Share link copied 📋')).catch(() => toast('Share link: ' + link));
          else toast('Share link: ' + link);
        }}>🔗 Copy share link</Button>
      </div>
      <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-3">This CV was built automatically from real, completed jobs and verified references — no writing required. Tap <b>Download PDF</b>, then choose “Save as PDF”.</p>

      <PrintableCv w={w} cv={cv} />
    </>
  );
}

/* ---------------- Printable CV document (browser Save-as-PDF) ---------------- */
function PrintableCv({ w, cv }: { w: WorkerProfile; cv: CvSnapshot }) {
  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const history = [...w.history].reverse();
  const navy = '#0E355A';
  const doc = (
    <div className="print-cv-root">
      <div style={{ maxWidth: 720, margin: '0 auto', color: '#243447', fontFamily: "'Figtree Variable', system-ui, sans-serif", fontSize: 13, lineHeight: 1.5 }}>
        {/* Header */}
        <div style={{ borderBottom: `3px solid ${navy}`, paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#F20023' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#F20023', display: 'inline-block' }} />Vuka Uzenzele · Verified CV
          </div>
          <h1 style={{ margin: '8px 0 2px', fontSize: 30, fontWeight: 800, color: navy, letterSpacing: '-.02em' }}>{w.name || 'Your name'}</h1>
          <div style={{ color: '#5a6b7b', fontSize: 13 }}>{[w.location, w.age ? `Age ${w.age}` : '', w.education].filter(Boolean).join('  ·  ')}</div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, fontWeight: 700 }}>
            <span style={{ background: navy, color: '#fff', borderRadius: 999, padding: '3px 10px' }}>{cv.tier.icon} {cv.tier.name} tier</span>
            <span style={{ border: `1px solid ${navy}`, color: navy, borderRadius: 999, padding: '3px 10px' }}>Reputation {cv.rep}/100</span>
            {w.idVerified && <span style={{ background: '#0E8A09', color: '#fff', borderRadius: 999, padding: '3px 10px' }}>✔ Identity verified</span>}
          </div>
        </div>

        {/* Summary numbers */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <PStat n={String(cv.jobsDone)} l="Verified jobs" />
          <PStat n={`${cv.avg.toFixed(1)}★`} l="Avg rating" />
          <PStat n={money(cv.totalEarned)} l="Total earned" />
          <PStat n={w.joined || '—'} l="Member since" />
        </div>

        {/* About */}
        {w.bio && (<><PH>About</PH><p style={{ margin: '0 0 14px' }}>{w.bio}</p></>)}

        {/* Skills */}
        {w.skills.length > 0 && (
          <><PH>Skills</PH>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {w.skills.map((s) => <span key={s} style={{ border: '1px solid #cfd8e3', borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 600, color: navy }}>{catById(s).label}</span>)}
          </div></>
        )}

        {/* Work history */}
        <PH>Verified work history ({cv.jobsDone})</PH>
        {history.length === 0
          ? <p style={{ color: '#5a6b7b', margin: 0 }}>No completed jobs yet.</p>
          : history.map((h) => {
              const c = catById(h.category);
              return (
                <div key={h.id} style={{ paddingLeft: 14, borderLeft: `2px solid ${navy}`, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <b style={{ color: navy, fontSize: 14 }}>{h.jobTitle}</b>
                    <span style={{ color: '#5a6b7b', fontSize: 12, whiteSpace: 'nowrap' }}>{h.date}</span>
                  </div>
                  <div style={{ color: '#5a6b7b', fontSize: 12, margin: '2px 0' }}>{c.label} · {h.hours}h · {stars(h.rating)}</div>
                  <div style={{ fontStyle: 'italic', margin: '3px 0' }}>“{h.review}”</div>
                  <div style={{ fontSize: 11.5, color: '#0E8A09', fontWeight: 700 }}>✔ Verified reference — {h.employer}</div>
                </div>
              );
            })}

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #dbe3ec', fontSize: 11, color: '#5a6b7b' }}>
          Generated {generated} from real, completed jobs on Vuka Uzenzele. Every reference above is verified by the platform — no self-written claims.
        </div>
      </div>
    </div>
  );
  return createPortal(doc, document.body);
}
function PStat({ n, l }: { n: string; l: string }) {
  return <div><div style={{ fontSize: 18, fontWeight: 800, color: '#0E355A' }}>{n}</div><div style={{ fontSize: 11, color: '#5a6b7b', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{l}</div></div>;
}
function PH({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: '#0E355A', fontWeight: 800, margin: '0 0 6px', borderBottom: '1px solid #eef2f7', paddingBottom: 4 }}>{children}</h2>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-xl font-extrabold text-navy tnum">{value}</b><span className="text-[10.5px] text-muted font-bold uppercase tracking-wide">{label}</span></div>;
}
function H5({ children }: { children: React.ReactNode }) {
  return <h5 className="mt-4 first:mt-0 mb-2 text-[11px] uppercase tracking-widest text-muted font-bold">{children}</h5>;
}

function TierCard({ cv }: { cv: CvSnapshot }) {
  if (!cv.nextTier) {
    return (
      <Card className="p-4.5 p-4 text-white" style={{ background: 'linear-gradient(160deg,#0E355A,#123e69)' }}>
        <div className="flex items-center gap-3"><span className="grid place-items-center w-[52px] h-[52px] rounded-[15px] bg-white/15 text-[26px]">{cv.tier.icon}</span>
          <div><small className="text-white/70 text-xs">Your tier · top of the ladder</small><h3 className="m-0 text-lg font-bold">{cv.tier.name}</h3></div>
        </div>
        <p className="text-[12.5px] text-white/85 leading-snug mt-3 mb-0">You're in the top 5% — employers see you first, and every formal job is open to you. 🎉</p>
      </Card>
    );
  }
  const n = cv.nextTier;
  return (
    <Card className="p-4.5 p-4 text-white" style={{ background: 'linear-gradient(160deg,#0E355A,#123e69)' }}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-[52px] h-[52px] rounded-[15px] bg-white/15 text-[26px]">{cv.tier.icon}</span>
        <div className="flex-1"><small className="text-white/70 text-xs">Your tier</small><h3 className="m-0 text-lg font-bold">{cv.tier.name}</h3></div>
        <div className="text-right"><small className="text-white/70 text-[11px] uppercase">Next</small><div className="font-bold">{n.icon} {n.name}</div></div>
      </div>
      <div className="text-[12.5px] text-white/85 my-2.5 leading-snug">Reach <b>{n.name}</b> to unlock: {n.unlocks}</div>
      <ProgressBar pct={cv.tierProgress} />
      <div className="flex gap-2 mt-3">
        <Req ok={cv.jobsDone >= n.minJobs} label="Jobs" value={`${cv.jobsDone}/${n.minJobs}`} />
        <Req ok={cv.ratingMet} label="Rating" value={`${cv.avg.toFixed(1)}/${n.minRating.toFixed(1)}`} />
        <Req ok={!cv.flagBlocked} label="No flags" value={cv.flags === 0 ? '✓' : String(cv.flags)} />
      </div>
    </Card>
  );
}
function Req({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return <div className={`flex-1 rounded-xl p-2 text-center ${ok ? 'bg-[rgba(24,206,15,.22)]' : 'bg-white/10'}`}><small className="block text-[10px] text-white/70 uppercase tracking-wide">{label}</small><b className="text-sm">{value}</b></div>;
}

function Rung({ tier, cv }: { tier: Tier; cv: CvSnapshot }) {
  const reached = cv.tier.id >= tier.id;
  const current = cv.tier.id === tier.id;
  return (
    <div className="flex gap-3 px-4 py-3.5 relative">
      {tier.id < TIERS.length - 1 && <span className="absolute left-[33px] top-[38px] bottom-[-2px] w-0.5 bg-line-strong" />}
      <div className={`grid place-items-center w-10 h-10 rounded-xl text-xl shrink-0 z-[1] border ${reached ? 'bg-navy text-white border-navy dark:text-navy-deep' : 'bg-surface-2 border-line-strong'} ${current ? 'ring-4 ring-red/20' : ''}`} style={current ? { background: tier.color, color: '#fff', borderColor: tier.color } : undefined}>
        {reached ? <span aria-hidden="true">{tier.icon}</span> : <Icon name="lock" size={18} />}
      </div>
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <h4 className={`m-0 text-[15px] font-bold ${reached ? 'text-navy' : 'text-subtle'}`}>{tier.name}</h4>
          {current && <span className="text-[10px] font-extrabold uppercase tracking-wide bg-red text-white px-2 py-0.5 rounded-full">You are here</span>}
          {!reached && <span className="text-[11px] text-subtle font-bold ml-auto">{tier.minJobs}+ jobs · {tier.minRating.toFixed(1)}★</span>}
        </div>
        <div className="text-[12px] text-muted mt-1 leading-snug">{tier.unlocks}</div>
      </div>
    </div>
  );
}

function CvEntry({ h }: { h: HistoryEntry }) {
  const c = catById(h.category);
  return (
    <div className="border-l-2 border-navy pl-3.5 ml-1 pb-3 relative">
      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-red border-2 border-surface" />
      <div className="flex justify-between items-baseline"><b className="text-sm text-navy">{h.jobTitle}</b><span className="text-[11px] text-muted font-bold">{h.date}</span></div>
      <div className="text-[12px] text-muted mt-0.5">{c.icon} {c.label} · {h.hours}h · <span style={{ color: '#F59E0B' }}>{stars(h.rating)}</span></div>
      <div className="text-[12.5px] text-ink italic my-1.5 leading-snug">“{h.review}”</div>
      <div className="text-[11.5px] text-muted flex items-center gap-1.5"><span className="text-info"><Icon name="shield" size={13} /></span> Verified reference — {h.employer}</div>
    </div>
  );
}
