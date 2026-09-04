import { catById, minWagePerHour, TIERS } from '../data/catalog';
import { money } from '../lib/format';
import { distanceLabel } from '../lib/geo';
import type { CvSnapshot, FormalJob, Gig, TalentWorker } from '../types';
import { Avatar, Card, Chip, Skeleton, TierBadge } from './ui';
import { Icon } from './Icon';

/** Shimmer placeholder matching a gig/formal card while data loads. */
export function GigCardSkeleton() {
  return (
    <div className="mb-3">
      <Card className="p-4">
        <div className="flex gap-3 items-start">
          <Skeleton className="w-11 h-11 rounded-[13px] shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex gap-2 pt-2.5 mt-2.5 border-t border-dashed border-line">
          <Skeleton className="h-5 w-16 rounded-pill" />
          <Skeleton className="h-5 w-24 rounded-pill" />
        </div>
      </Card>
    </div>
  );
}

/** Shimmer placeholder matching a talent card while data loads. */
export function TalentCardSkeleton() {
  return (
    <div className="mb-3">
      <Card className="p-4 flex gap-3.5 items-center">
        <Skeleton className="w-11 h-11 rounded-[14px] shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-5 w-20 rounded-pill" />
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-3 w-12" />
        </div>
      </Card>
    </div>
  );
}

/** A responsive grid of N card skeletons. */
export function CardSkeletonGrid({ count = 4, talent = false }: { count?: number; talent?: boolean }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (talent ? <TalentCardSkeleton key={i} /> : <GigCardSkeleton key={i} />))}
    </div>
  );
}

export function TalentCard({ worker, onClick }: { worker: TalentWorker; onClick: () => void }) {
  const t = TIERS[worker.tier];
  return (
    <button onClick={onClick} className="w-full text-left mb-3 active:scale-[.985] hover:-translate-y-[2px] transition-transform duration-200">
      <Card className="p-4 flex gap-3.5 items-center transition-shadow duration-200 hover:shadow-e2">
        <Avatar initials={worker.initials} color={worker.color} verified={worker.idVerified} />
        <div className="flex-1 min-w-0">
          <h4 className="m-0 text-body font-extrabold text-navy flex items-center gap-1.5 tracking-tight">
            {worker.name}
            {worker.idVerified && <span className="text-info"><Icon name="shield" size={14} /></span>}
          </h4>
          <div className="text-small text-muted mt-0.5 mb-1.5 truncate">{worker.tagline}</div>
          <div className="flex gap-2 flex-wrap items-center">
            <TierBadge icon={t.icon} name={t.name} color={t.color} />
            {worker.skills.map((s) => <span key={s} className="text-base" title={catById(s).label} aria-hidden="true">{catById(s).icon}</span>)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <b className="text-base" style={{ color: '#F59E0B' }}>{worker.rating.toFixed(1)}★</b>
          <small className="block text-micro text-muted">{worker.jobsDone} jobs</small>
        </div>
      </Card>
    </button>
  );
}

export function GigCard({ gig, onClick }: { gig: Gig; onClick: () => void }) {
  const c = catById(gig.category);
  const total = gig.hours * gig.payPerHour;
  const fair = gig.payPerHour >= minWagePerHour();
  return (
    <button onClick={onClick} className="w-full text-left mb-3 active:scale-[.985] hover:-translate-y-[2px] transition-transform duration-200">
      <Card className="p-4 transition-shadow duration-200 hover:shadow-e2">
        <div className="flex gap-3 items-start">
          <span className="grid place-items-center w-11 h-11 rounded-[13px] text-head shrink-0" style={{ background: `${c.color}22`, color: c.color }} aria-hidden="true">{c.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="m-0 text-body font-extrabold text-navy leading-tight tracking-tight">{gig.title}</h4>
            <div className="text-small text-muted flex items-center gap-1.5 mt-0.5">
              <Icon name="pin" size={13} /> {gig.location}{distanceLabel(gig.distanceKm, gig.distanceSource) ? ` · ${distanceLabel(gig.distanceKm, gig.distanceSource)}` : ''}
            </div>
          </div>
          <div className="text-right shrink-0">
            <b className="text-lead font-extrabold text-navy tnum">{money(total)}</b>
            <small className="block text-micro text-muted tnum">{money(gig.payPerHour)}/hr · {gig.hours}h</small>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-2.5 mt-2.5 border-t border-dashed border-line">
          {gig.urgent && <Chip tone="urgent" icon="bolt">Urgent</Chip>}
          {fair && <Chip tone="fair" icon="shield">Fair pay</Chip>}
          <Chip tone="time">🗓 {gig.when}</Chip>
        </div>
      </Card>
    </button>
  );
}

export function FormalCard({ job, cv, onClick }: { job: FormalJob; cv: CvSnapshot; onClick: () => void }) {
  const c = catById(job.category);
  const unlocked = job.minTier <= cv.tier.id;
  const reqTier = TIERS[job.minTier];
  const [amount, per] = job.salary.split('/');

  const head = (
    <div className="flex gap-3 items-start">
      <span className="grid place-items-center w-11 h-11 rounded-[13px] text-head shrink-0" style={{ background: `${c.color}22`, color: c.color }} aria-hidden="true">{c.icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="m-0 text-body font-extrabold text-navy leading-tight tracking-tight">{job.title}</h4>
        <div className="text-micro text-info font-bold mt-0.5">{job.employer} · {job.type}</div>
        <div className="text-small text-muted flex items-center gap-1.5 mt-0.5"><Icon name="pin" size={13} /> {job.location}{distanceLabel(job.distanceKm, job.distanceSource) ? ` · ${distanceLabel(job.distanceKm, job.distanceSource)}` : ''}</div>
      </div>
      <div className="text-right shrink-0">
        <b className="text-body font-extrabold text-navy tnum">{amount.trim()}</b>
        {per && <small className="block text-micro text-muted">/{per.trim()}</small>}
      </div>
    </div>
  );

  if (unlocked) {
    return (
      <button onClick={onClick} className="w-full text-left mb-3 active:scale-[.985] hover:-translate-y-[2px] transition-transform duration-200">
        <Card className="p-4 transition-shadow duration-200 hover:shadow-e2">
          {head}
          <div className="flex items-center gap-2 flex-wrap pt-2.5 mt-2.5 border-t border-dashed border-line">
            <Chip tone="formal" icon="shield">Formal</Chip>
            <Chip tone="time">🎓 {job.education.split('·')[0].trim()}</Chip>
          </div>
        </Card>
      </button>
    );
  }

  const jobsNeeded = Math.max(0, reqTier.minJobs - cv.jobsDone);
  const span = reqTier.minJobs - cv.tier.minJobs;
  const prog = span > 0 ? Math.min(100, Math.round(((cv.jobsDone - cv.tier.minJobs) / span) * 100)) : 0;
  return (
    <button onClick={onClick} className="w-full text-left mb-3 active:scale-[.99] transition">
      <Card className="p-4 pb-0 overflow-hidden">
        <div className="grayscale-[.55] opacity-60">{head}</div>
        <div className="flex items-center gap-2.5 bg-navy text-white -mx-4 mt-2.5 px-4 py-3 rounded-b-card">
          <Icon name="lock" size={16} />
          <div className="flex-1 text-micro leading-snug">
            Unlocks at <b className="text-[#ffd9de]">{reqTier.name} {reqTier.icon}</b> — {jobsNeeded > 0 ? `${jobsNeeded} more good job${jobsNeeded > 1 ? 's' : ''}` : 'raise your rating'} to go
            <div className="h-1.5 bg-white/20 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-red rounded-full" style={{ width: `${prog}%` }} />
            </div>
          </div>
        </div>
      </Card>
    </button>
  );
}
