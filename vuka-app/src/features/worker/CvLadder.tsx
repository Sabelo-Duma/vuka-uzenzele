import { BADGES, catById, TIERS } from '../../data/catalog';
import { computeCv } from '../../lib/engine';
import { money, stars } from '../../lib/format';
import { useApp } from '../../store/appStore';
import type { CvSnapshot, HistoryEntry, Tier } from '../../types';
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

      <Button block variant="navy" className="mt-4" onClick={() => toast('CV link copied — ready to share with any employer 📄')}>📄 Download / share my CV</Button>
      <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-3">This CV was built automatically from real, completed jobs and verified references — no writing required.</p>
    </>
  );
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
