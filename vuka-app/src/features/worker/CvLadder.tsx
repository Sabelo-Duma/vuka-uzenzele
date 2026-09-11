import { createPortal } from 'react-dom';
import { BADGES, catById, roleTitleFor, TIERS } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { money, ratingLabel, isUnrated } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { CvSnapshot, HistoryEntry, Tier, WorkerProfile } from '../../types';
import { Button, Card, Ring, ProgressBar, SectionTitle, useCountUp } from '../../components/ui';
import { Icon } from '../../components/Icon';

export function CvLadder() {
  const { state, toast } = useApp();
  const cv = computeCv(state.worker);
  const w = state.worker;
  const animRep = useCountUp(cv.rep);
  // The job title this record qualifies them for, taken from where they have
  // the most completed work rather than whatever they happened to do last.
  const jobsPerCategory = w.history.reduce<Record<string, number>>(
    (acc, h) => ({ ...acc, [h.category]: (acc[h.category] ?? 0) + 1 }), {});
  const mostWorked = Object.entries(jobsPerCategory).sort((a, b) => b[1] - a[1])[0]?.[0];
  const cvRole = roleTitleFor(mostWorked ?? w.skills[0] ?? '');

  return (
    <>
      <header className="mb-3">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Auto-generated · always up to date</small>
        <h2 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">My CV &amp; ladder<span className="text-red">.</span></h2>
      </header>

      {/* Reputation ring */}
      <Card className="p-5 text-center mb-4" style={{ background: 'linear-gradient(165deg,var(--gj-bg),var(--gj-bg-light))' }}>
        <div className="flex justify-center">
          <Ring pct={animRep} colors={cv.tier.ring} gradId="repRing">
            <b className="text-3xl font-extrabold text-navy leading-none tnum">{Math.round(animRep)}</b>
            <small className="text-micro text-muted font-bold uppercase tracking-wide mt-1">Rep score</small>
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

      <SectionTitle action={<span className="text-small text-muted">{cv.earnedBadges.size}/{BADGES.length} earned</span>}>Badges</SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {BADGES.map((b) => {
          const earned = cv.earnedBadges.has(b.id);
          return (
            <div key={b.id} title={b.desc} className={`border border-line rounded-[15px] p-3 text-center bg-surface ${earned ? '' : 'opacity-40 grayscale'}`}>
              <div className="text-display" aria-hidden="true">{b.icon}</div>
              <b className="block text-micro mt-1 text-navy">{b.label}</b>
            </div>
          );
        })}
      </div>

      <SectionTitle>Your CV document</SectionTitle>
      <Card className="overflow-hidden">
        <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#1A3B68)' }}>
          <h3 className="font-display m-0 text-head font-extrabold tracking-tight">{w.name}</h3>
          {/* The role, then how to reach them. Tier and rep score are deliberately
              absent: they rank someone inside this marketplace and mean nothing to
              an employer reading a CV — and a CV with no contact number is unusable
              however good the history behind it is. */}
          <p className="m-0 mt-0.5 text-small font-bold opacity-95">{cvRole}</p>
          <p className="m-0 mt-1.5 text-small opacity-80">{[state.user?.phone, state.user?.email, w.location, w.age ? `Age ${w.age}` : ''].filter(Boolean).join(' · ')}</p>
          {w.idVerified && (
            <span className="inline-flex gap-1.5 items-center mt-2.5 bg-white/15 px-2.5 py-1 rounded-full text-micro font-bold">
              <Icon name="shield" size={13} /> Identity verified against SA ID
            </span>
          )}
        </div>
        <div className="p-4.5 p-4">
          <H5>About me</H5>
          <p className="m-0 text-small text-ink leading-relaxed">{w.bio}</p>
          <H5>Skills</H5>
          <div className="flex flex-wrap gap-1.5">
            {w.skills.map((s) => <span key={s} className="bg-[#eaf3fb] dark:bg-info/15 text-info text-small font-bold px-3 py-1 rounded-full">{catById(s).label}</span>)}
          </div>
          <H5>Verified work history</H5>
          {cv.jobsDone === 0
            ? <p className="text-small text-muted m-0 leading-relaxed">No jobs yet — complete your first gig and it appears here automatically. 🌱</p>
            : [...w.history].reverse().map((h) => <CvEntry key={h.id} h={h} />)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <Button variant="navy" onClick={() => window.print()}>📄 Download PDF</Button>
        <Button variant="ghost" onClick={() => {
          const id = state.user?.id;
          if (!id) { toast('Sign in to get a shareable link'); return; }
          const link = `${window.location.origin}/cv/${id}`;
          if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(() => toast('Share link copied — anyone can view your CV 📋')).catch(() => toast('Share link: ' + link));
          else toast('Share link: ' + link);
        }}>🔗 Copy share link</Button>
      </div>
      <p className="text-center text-small text-muted leading-relaxed px-4 py-3">A proper CV — your contact details, profile, skills, dated work experience and references — built from jobs you actually completed. No writing required. Tap <b>Download PDF</b>, then choose “Save as PDF”.</p>

      <PrintableCv w={w} cv={cv} phone={state.user?.phone} email={state.user?.email} />
    </>
  );
}

/* ---------------- Printable CV document (browser Save-as-PDF) ----------------
   Written to the shape a South African employer or recruiter expects: contact
   details first, then a profile, key skills, dated work experience with duties,
   education and references.

   The previous version led with tier and reputation score — numbers that rank a
   person inside this marketplace and mean nothing outside it — and it carried no
   phone number at all, which makes a CV unusable however good the work history
   behind it is.

   Everything here is assembled from completed, employer-confirmed jobs. That is
   the whole promise: the worker writes nothing. */
function PrintableCv({ w, cv, phone, email }: { w: WorkerProfile; cv: CvSnapshot; phone?: string; email?: string | null }) {
  const generated = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const history = [...w.history].reverse();
  const navy = '#0E355A';
  const ink = '#101826';
  const soft = '#5D6B7E';
  const green = '#067A4E';

  // Experience per skill, counted from real jobs — the evidence behind each
  // claim, so the skills list is not just a list of assertions.
  const bySkill = history.reduce<Record<string, { jobs: number; hours: number }>>((acc, h) => {
    const cur = acc[h.category] ?? { jobs: 0, hours: 0 };
    acc[h.category] = { jobs: cur.jobs + 1, hours: cur.hours + h.hours };
    return acc;
  }, {});
  const skillRows = Object.entries(bySkill).sort((a, b) => b[1].jobs - a[1].jobs);

  // The role this person can apply for, taken from where they actually have the
  // most jobs rather than from whatever they happened to do last.
  const topCategory = skillRows[0]?.[0] ?? w.skills[0];
  const targetRole = topCategory ? roleTitleFor(topCategory) : 'General Worker';

  // A profile paragraph nobody had to write. It only ever states what the record
  // can support, so it stays true on day one as well as after fifty jobs.
  const totalHours = history.reduce((n, h) => n + h.hours, 0);
  // Read as a sentence, not a comma list: "cleaning, gardening and moving help".
  const spreadParts = skillRows.slice(0, 3).map(([c]) => catById(c).label.toLowerCase());
  const spread = spreadParts.length > 1
    ? spreadParts.slice(0, -1).join(', ') + ' and ' + spreadParts[spreadParts.length - 1]
    : spreadParts[0] ?? '';
  const autoProfile = history.length === 0
    ? targetRole + ' based in ' + (w.location || 'South Africa') + ', available for work and building a verified record of completed jobs through Vuka Uzenzele.'
    : targetRole + ' based in ' + (w.location || 'South Africa') + ' with ' + totalHours + ' hours across '
      + history.length + ' completed job' + (history.length === 1 ? '' : 's')
      + (skillRows.length > 1 ? ' in ' + spread : '')
      + '. Every role below was confirmed by the employer who hired me, and each reference is verified by the platform rather than written by me.';

  const referees = history.filter((h) => !isUnrated(h.rating));
  const refereeNames = Array.from(new Set(referees.map((h) => h.employer)));

  const doc = (
    <div className="print-cv-root">
      <div style={{ maxWidth: 720, margin: '0 auto', color: ink, fontFamily: "'Figtree Variable', system-ui, sans-serif", fontSize: 12.5, lineHeight: 1.5 }}>

        {/* Identity and contact. A CV without these cannot be acted on. */}
        <div style={{ borderBottom: '3px solid ' + navy, paddingBottom: 12, marginBottom: 14 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: ink, letterSpacing: '-.02em', fontFamily: "'Archivo Variable', system-ui, sans-serif" }}>
            {w.name || 'Your name'}
          </h1>
          <div style={{ fontSize: 14, fontWeight: 700, color: navy, marginTop: 2 }}>{targetRole}</div>
          <div style={{ color: soft, fontSize: 12, marginTop: 6 }}>
            {[phone, email, w.location, w.age ? 'Age ' + w.age : ''].filter(Boolean).join('  ·  ')}
          </div>
          {w.idVerified && (
            <div style={{ marginTop: 7, display: 'inline-block', background: '#E6F4EC', color: green, border: '1px solid #B8E0CB', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
              Identity verified against SA ID
            </div>
          )}
        </div>

        <PH>Profile</PH>
        <p style={{ margin: '0 0 14px' }}>{w.bio || autoProfile}</p>

        {skillRows.length > 0 && (
          <>
            <PH>Key skills</PH>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
              <tbody>
                {skillRows.map(([cat, v]) => (
                  <tr key={cat}>
                    <td style={{ padding: '3px 0', fontWeight: 700, width: '45%' }}>{catById(cat).label}</td>
                    <td style={{ padding: '3px 0', color: soft }}>
                      {v.jobs} job{v.jobs === 1 ? '' : 's'} · {v.hours} hour{v.hours === 1 ? '' : 's'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <PH>Work experience</PH>
        {history.length === 0
          ? <p style={{ color: soft, margin: '0 0 14px' }}>No completed jobs yet. Every job you finish is added here automatically.</p>
          : history.map((h) => (
              <div key={h.id} style={{ marginBottom: 13, breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <b style={{ color: ink, fontSize: 13.5 }}>{roleTitleFor(h.category)}</b>
                  <span style={{ color: soft, fontSize: 11.5, whiteSpace: 'nowrap' }}>{h.date}</span>
                </div>
                <div style={{ color: navy, fontSize: 12, fontWeight: 600 }}>{h.employer}</div>
                <div style={{ color: soft, fontSize: 11.5, margin: '1px 0 3px' }}>{h.jobTitle} · {h.hours} hour{h.hours === 1 ? '' : 's'}</div>
                {h.review && <div style={{ fontStyle: 'italic', margin: '0 0 3px' }}>“{h.review}”</div>}
                <div style={{ fontSize: 11, color: isUnrated(h.rating) ? soft : green, fontWeight: 700 }}>
                  {isUnrated(h.rating)
                    ? 'Work confirmed by ' + h.employer
                    : 'Reference verified · rated ' + h.rating + '/5 by ' + h.employer}
                </div>
              </div>
            ))}

        {w.education && (<><PH>Education</PH><p style={{ margin: '0 0 14px' }}>{w.education}</p></>)}

        {w.languages.length > 0 && (<><PH>Languages</PH><p style={{ margin: '0 0 14px' }}>{w.languages.join(', ')}</p></>)}

        <PH>References</PH>
        <p style={{ margin: '0 0 4px' }}>
          {referees.length > 0
            ? referees.length + ' verified reference' + (referees.length === 1 ? '' : 's') + ' from ' + refereeNames.join(', ') + '.'
            : 'References are added automatically as employers confirm completed work.'}
        </p>
        <p style={{ margin: 0, color: soft, fontSize: 11.5 }}>
          Contactable on request through Vuka Uzenzele, which confirmed each job above was completed.
        </p>

        <div style={{ marginTop: 18, paddingTop: 10, borderTop: '1px solid #dbe3ec', fontSize: 10.5, color: soft }}>
          Generated {generated} · Vuka Uzenzele. Built from {cv.jobsDone} completed job{cv.jobsDone === 1 ? '' : 's'}, each one confirmed by the employer who hired this candidate. No self-written claims.
        </div>
      </div>
    </div>
  );
  return createPortal(doc, document.body);
}

function PH({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: '#0E355A', fontWeight: 800, margin: '0 0 5px', borderBottom: '1px solid #eef2f7', paddingBottom: 3, fontFamily: "'Archivo Variable', system-ui, sans-serif" }}>{children}</h2>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-xl font-extrabold text-navy tnum">{value}</b><span className="text-micro text-muted font-bold uppercase tracking-wide">{label}</span></div>;
}
function H5({ children }: { children: React.ReactNode }) {
  return <h5 className="mt-4 first:mt-0 mb-2 text-micro uppercase tracking-widest text-muted font-bold">{children}</h5>;
}

function TierCard({ cv }: { cv: CvSnapshot }) {
  if (!cv.nextTier) {
    return (
      <Card className="p-4.5 p-4 text-white" style={{ background: 'linear-gradient(160deg,#0E355A,#123e69)' }}>
        <div className="flex items-center gap-3"><span className="grid place-items-center w-[52px] h-[52px] rounded-[15px] bg-white/15 text-display">{cv.tier.icon}</span>
          <div><small className="text-white/70 text-xs">Your tier · top of the ladder</small><h3 className="font-display m-0 text-lg font-bold">{cv.tier.name}</h3></div>
        </div>
        <p className="text-small text-white/85 leading-snug mt-3 mb-0">You're in the top 5% — employers see you first, and every formal job is open to you. 🎉</p>
      </Card>
    );
  }
  const n = cv.nextTier;
  return (
    <Card className="p-4.5 p-4 text-white" style={{ background: 'linear-gradient(160deg,#0E355A,#123e69)' }}>
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-[52px] h-[52px] rounded-[15px] bg-white/15 text-display">{cv.tier.icon}</span>
        <div className="flex-1"><small className="text-white/70 text-xs">Your tier</small><h3 className="font-display m-0 text-lg font-bold">{cv.tier.name}</h3></div>
        <div className="text-right"><small className="text-white/70 text-micro uppercase">Next</small><div className="font-bold">{n.icon} {n.name}</div></div>
      </div>
      <div className="text-small text-white/85 my-2.5 leading-snug">Reach <b>{n.name}</b> to unlock: {n.unlocks}</div>
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
  return <div className={`flex-1 rounded-xl p-2 text-center ${ok ? 'bg-[rgba(24,206,15,.22)]' : 'bg-white/10'}`}><small className="block text-micro text-white/70 uppercase tracking-wide">{label}</small><b className="text-sm">{value}</b></div>;
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
          <h4 className={`font-display m-0 text-body font-bold ${reached ? 'text-ink' : 'text-subtle'}`}>{tier.name}</h4>
          {current && <span className="text-micro font-extrabold uppercase tracking-wide bg-red text-white px-2 py-0.5 rounded-full">You are here</span>}
          {!reached && <span className="text-micro text-subtle font-bold ml-auto">{tier.minJobs}+ jobs · {tier.minRating.toFixed(1)}★</span>}
        </div>
        <div className="text-small text-muted mt-1 leading-snug">{tier.unlocks}</div>
      </div>
    </div>
  );
}

function CvEntry({ h }: { h: HistoryEntry }) {
  const c = catById(h.category);
  return (
    <div className="border-l-2 border-navy pl-3.5 ml-1 pb-3 relative">
      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-red border-2 border-surface" />
      <div className="flex justify-between items-baseline"><b className="text-sm text-navy">{h.jobTitle}</b><span className="text-micro text-muted font-bold">{h.date}</span></div>
      <div className="text-small text-muted mt-0.5">{c.icon} {c.label} · {h.hours}h · <span style={isUnrated(h.rating) ? undefined : { color: '#F59E0B' }}>{ratingLabel(h.rating)}</span></div>
      <div className="text-small text-ink italic my-1.5 leading-snug">“{h.review}”</div>
      {isUnrated(h.rating)
        ? <div className="text-micro text-muted flex items-center gap-1.5"><Icon name="shield" size={13} /> Work confirmed — {h.employer} did not leave a rating</div>
        : <div className="text-micro text-muted flex items-center gap-1.5"><span className="text-info"><Icon name="shield" size={13} /></span> Verified reference — {h.employer}</div>}
    </div>
  );
}
