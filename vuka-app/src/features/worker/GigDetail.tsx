import { useState } from 'react';
import { catById, MIN_WAGE_PER_HOUR } from '../../data/catalog';
import { money, stars } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Avatar, Button, Card } from '../../components/ui';
import { DetailHeader, FairMeter, Hero, KV, PayBox, StickyCta } from '../../components/bits';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/ui';
import { ReviewSheet } from './ReviewSheet';

export function GigDetail({ id }: { id: string }) {
  const { state, applyGig, toast, navigate } = useApp();
  const [reviewing, setReviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const gig = state.gigs.find((g) => g.id === id);

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
  const applied = state.appliedGigIds.includes(gig.id);

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
        <FairMeter ratePerHour={gig.payPerHour} minWage={MIN_WAGE_PER_HOUR} />
        <p className="text-ink leading-relaxed text-sm m-0">{gig.description}</p>
      </div>

      <Card className="p-4 mb-4">
        <KV k="Posted by"><Avatar initials={gig.employerInitials} color={c.color} size="sm" /> {gig.employer}</KV>
        <KV k="Employer rating"><span className="text-[var(--gj-warning-fill,#FFB236)]" style={{ color: '#F59E0B' }}>{stars(gig.employerRating)}</span> {gig.employerRating.toFixed(1)}</KV>
        <KV k="Safety"><span className="text-info flex items-center gap-1.5"><Icon name="shield" size={14} /> ID-verified employer</span></KV>
      </Card>

      <StickyCta>
        {applied ? (
          <>
            <Button block variant="gold" onClick={() => setReviewing(true)}>✅ Mark gig as complete</Button>
            <p className="text-center text-[12px] text-muted mt-2">You applied! In the real app the employer confirms — for the demo, tap above to finish and watch your CV + tier update.</p>
          </>
        ) : (
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
