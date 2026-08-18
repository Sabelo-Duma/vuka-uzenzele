import { useState } from 'react';
import { catById, minWagePerHour } from '../../data/catalog';
import { money, stars } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Avatar, Button, Card } from '../../components/ui';
import { DetailHeader, FairMeter, Hero, KV, PayBox, StickyCta } from '../../components/bits';
import { FollowButton } from '../../components/FollowButton';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui';
import { ReviewSheet } from './ReviewSheet';

export function GigDetail({ id }: { id: string }) {
  const { state, applyGig, toast, navigate } = useApp();
  const [reviewing, setReviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  // A gig leaves the open feed once it's filled, so a worker's own work is
  // looked up from `myJobs` too — otherwise the job you were hired for vanishes.
  const mine = state.myJobs.find((j) => j.gig.id === id);
  const gig = state.gigs.find((g) => g.id === id) ?? mine?.gig;

  if (!gig) {
    return (
      <>
        <DetailHeader title="Gig details" onBack={() => navigate('jobs')} />
        <EmptyState icon="🔍" title="This gig is no longer available" hint="It may have been filled or you already completed it. Browse other gigs near you." action={<Button onClick={() => navigate('jobs')}>Back to gigs</Button>} />
      </>
    );
  }

  const c = catById(gig.category);
  const total = gig.hours * gig.payPerHour;
  const status = mine?.status ?? (state.appliedGigIds.includes(gig.id) ? 'applied' : null);
  const employerFirstName = gig.employer.split(' ')[0];

  return (
    <>
      <DetailHeader title="Gig details" onBack={() => navigate('jobs')} />
      <Hero
        eyebrow={`${c.icon} ${c.label} · informal gig`}
        title={gig.title}
        sub={<><Icon name="pin" size={13} /> {gig.location} · {gig.distanceKm} km away · {gig.when}</>}
        gradient="linear-gradient(150deg,var(--gj-navy),#123e69)"
      >
        <PayBox cells={[
          { label: "You'll earn", value: money(total) },
          { label: 'Rate', value: `${money(gig.payPerHour)}/hr` },
          { label: 'Time', value: `${gig.hours} hrs` },
        ]} />
      </Hero>

      <div className="py-4">
        <FairMeter ratePerHour={gig.payPerHour} minWage={minWagePerHour()} />
        <p className="text-ink leading-relaxed text-sm m-0">{gig.description}</p>
      </div>

      <Card className="p-4 mb-4">
        <KV k="Posted by"><Avatar initials={gig.employerInitials} color={c.color} size="sm" /> {gig.employer}</KV>
        <KV k="Employer rating">
          {gig.employerRating === null
            ? <span className="text-muted">New employer — no reviews yet</span>
            : <><span style={{ color: '#F59E0B' }}>{stars(gig.employerRating)}</span> {gig.employerRating.toFixed(1)} <span className="text-muted">({gig.employerRatingCount})</span></>}
        </KV>
        <KV k="Safety"><span className="text-info flex items-center gap-1.5"><Icon name="shield" size={14} /> ID-verified employer</span></KV>
        {gig.employerId && (
          <div className="mt-3.5 flex flex-col gap-2.5">
            <FollowButton userId={gig.employerId} />
            <Button variant="ghost" icon="chat" block onClick={() => navigate('chat', gig.employerId!)}>Message {gig.employer.split(' ')[0]}</Button>
          </div>
        )}
      </Card>

      <StickyCta>
        {status === 'applied' && (
          <>
            <Button block variant="ghost" disabled>⏳ Applied — waiting on {employerFirstName}</Button>
            <p className="text-center text-[12px] text-muted mt-2">Your CV and tier were sent with your application. {employerFirstName} picks who gets the job — you'll be notified either way.</p>
          </>
        )}
        {status === 'not_selected' && (
          <>
            <Button block variant="ghost" onClick={() => navigate('jobs')}>Browse other gigs</Button>
            <p className="text-center text-[12px] text-muted mt-2">{employerFirstName} went with someone else this time. Your application still counts — keep applying, nothing is lost.</p>
          </>
        )}
        {status === 'hired' && (
          <>
            <Button block variant="gold" onClick={() => setReviewing(true)}>✅ I've finished this job</Button>
            <p className="text-center text-[12px] text-muted mt-2">You're hired 🎉 When the work is done, mark it here and rate {employerFirstName}. They then confirm it — that's what writes the reference onto your CV.</p>
          </>
        )}
        {status === 'worker_done' && (
          <>
            <Button block variant="ghost" disabled>🕓 Waiting for {employerFirstName} to confirm</Button>
            <p className="text-center text-[12px] text-muted mt-2">You've marked this done. As soon as {employerFirstName} confirms, your pay is released and the verified reference lands on your CV.</p>
          </>
        )}
        {status === 'completed' && (
          <>
            <Button block variant="ghost" onClick={() => navigate('cv')}>See it on my CV →</Button>
            <p className="text-center text-[12px] text-muted mt-2">
              Confirmed by {employerFirstName}{mine?.employerRatingOfMe ? ` · they rated you ${mine.employerRatingOfMe}★` : ''}. This job is now a verified reference.
            </p>
          </>
        )}
        {status === null && (
          <Button block disabled={applying} onClick={async () => {
            setApplying(true);
            try { await applyGig(gig.id); toast('Applied! 🎉 The employer will be in touch.'); }
            catch (e) { toast((e as Error).message); setApplying(false); }
          }}>
            {applying ? 'Applying…' : "Apply for this gig — it's free"}
          </Button>
        )}
      </StickyCta>

      {reviewing && <ReviewSheet gig={gig} onClose={() => setReviewing(false)} />}
    </>
  );
}
