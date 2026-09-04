import { useState } from 'react';
import { locationSupported, requestCoords, type Coords } from '../../lib/geo';
import { CATEGORIES, minWagePerHour } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import type { CategoryId } from '../../types';
import { Button } from '../../components/ui';
import { Chip } from '../../components/ui';

// text-base (16px), not text-sm: iOS Safari zooms the viewport on focus for
// anything smaller, hiding the Post button behind the keyboard.
const inputCls = 'w-full border-[1.5px] border-line-strong rounded-pill px-4 py-3 text-base bg-surface text-navy focus:outline-none focus:border-navy';
/** Same field, outlined in red when it is the one holding up the form. */
const fieldCls = (error?: string) =>
  error
    ? 'w-full border-[1.5px] border-red rounded-pill px-4 py-3 text-base bg-surface text-navy focus:outline-none focus:border-red'
    : inputCls;

export function PostJob() {
  const { navigate, toast, postGig } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('carwash');
  const [hours, setHours] = useState('2');
  const [rate, setRate] = useState('50');
  const [loc, setLoc] = useState('Soweto');
  const [when, setWhen] = useState('This week');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  // Pinning the job to exact coordinates is what lets workers see a real
  // distance instead of an estimate — so it's offered, and it's optional.
  const [pin, setPin] = useState<Coords | null>(null);
  const [pinning, setPinning] = useState(false);

  const pinHere = async () => {
    setPinning(true);
    try {
      setPin(await requestCoords());
      toast('Job pinned to this spot — workers will see the real distance 📍');
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setPinning(false);
    }
  };

  const rateNum = Number(rate) || 0;
  const minWage = minWagePerHour();
  const fair = rateNum >= minWage;

  /**
   * Everything wrong with the form, before anything is sent.
   *
   * Mirrors the server's rules — the server is still the boundary, this just
   * means a mistake is answered next to the field that caused it rather than by
   * a round trip and a message that has scrolled past.
   */
  const problems = (): Record<string, string> => {
    const p: Record<string, string> = {};
    const hoursNum = Number(hours);
    if (!title.trim()) p.title = 'Give the job a title so workers know what it is.';
    else if (title.trim().length > 120) p.title = 'Keep the title under 120 characters.';
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) p.hours = 'Enter how many hours the job takes.';
    else if (hoursNum > 24) p.hours = "A single job can't run longer than 24 hours — split it into more than one booking.";
    if (!Number.isFinite(rateNum) || rateNum <= 0) p.rate = 'Enter what the job pays per hour.';
    else if (rateNum < minWage) p.rate = `R${rateNum.toFixed(2)}/hr is below the national minimum wage of R${minWage.toFixed(2)}. Raise it to post this job.`;
    if (!loc.trim()) p.loc = 'Add a location — workers are shown how far the job is from them.';
    return p;
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (k: string) => setErrors((e) => (e[k] ? { ...e, [k]: '' } : e));

  const submit = async () => {
    const found = problems();
    setErrors(found);
    if (Object.keys(found).length) {
      // Say how many, so a problem scrolled off-screen isn't invisible.
      const n = Object.keys(found).length;
      toast(n === 1 ? 'One thing needs fixing before posting' : `${n} things need fixing before posting`);
      return;
    }
    setBusy(true);
    try {
      await postGig({ title, category, hours: Number(hours), payPerHour: rateNum, location: loc.trim(), when, description, urgent: false, ...(pin ?? {}) });
      toast('Job posted! Verified youth nearby can now apply 🚀');
      navigate('home');
    } catch (e) {
      // The server names the field it rejected; put the message there.
      const err = e as { message: string; field?: string };
      if (err.field) setErrors({ [err.field === 'payPerHour' ? 'rate' : err.field === 'location' ? 'loc' : err.field]: err.message });
      toast(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <header className="mb-4">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Reach verified youth nearby</small>
        <h2 className="m-0 mt-0.5 text-head font-extrabold text-navy tracking-tight">Post a job<span className="text-red">.</span></h2>
      </header>

      <Field label="What do you need?" error={errors.title}>
        <input className={fieldCls(errors.title)} placeholder="e.g. Wash my car this Saturday" value={title} onChange={(e) => { clearError('title'); setTitle(e.target.value); }} aria-label="Job title" aria-invalid={!!errors.title} />
      </Field>

      <Field label="Category">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} aria-label="Category">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </Field>

      <div className="flex gap-2.5 mb-3.5">
        <div className="flex-1"><Field label="Hours" error={errors.hours}><input className={fieldCls(errors.hours)} type="number" min={1} value={hours} onChange={(e) => { clearError('hours'); setHours(e.target.value); }} aria-label="Hours" aria-invalid={!!errors.hours} /></Field></div>
        <div className="flex-1"><Field label="Rate / hr" error={errors.rate}><input className={fieldCls(errors.rate)} type="number" min={1} value={rate} onChange={(e) => { clearError('rate'); setRate(e.target.value); }} aria-label="Rate per hour" aria-invalid={!!errors.rate} /></Field></div>
      </div>

      <Field label="Where" error={errors.loc}>
        <input className={fieldCls(errors.loc)} placeholder="Suburb, e.g. Diepkloof" value={loc} onChange={(e) => { clearError('loc'); setLoc(e.target.value); }} aria-label="Location" aria-invalid={!!errors.loc} />
        {locationSupported() && (
          <div className="flex items-center gap-2 mt-2 text-small">
            {pin ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-navy/[.06] text-navy font-bold px-3 py-1.5">📍 Pinned to this spot</span>
                <button type="button" onClick={() => setPin(null)} className="text-muted font-semibold underline underline-offset-2 hover:text-navy transition">Remove pin</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={pinHere}
                  disabled={pinning}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line-strong text-navy font-bold px-3 py-1.5 hover:bg-surface-2 transition active:scale-95 disabled:opacity-60"
                >
                  📍 {pinning ? 'Getting location…' : 'Pin my exact location'}
                </button>
                <span className="text-subtle">Optional — helps nearby workers find you</span>
              </>
            )}
          </div>
        )}
      </Field>

      <Field label="When"><input className={inputCls} placeholder="e.g. Sat, 09:00" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="When" /></Field>

      <Field label="Details"><input className={inputCls} placeholder="What should they know?" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Details" /></Field>

      <div className="mb-3">
        {fair
          ? <Chip tone="fair" icon="shield">Fair pay — above SA minimum</Chip>
          : <Chip tone="urgent">⚠ Below SA minimum wage (R{minWage}/hr)</Chip>}
      </div>

      <Button block variant="navy" disabled={busy} onClick={submit}>{busy ? 'Posting…' : "Post job — it's free to post"}</Button>
      <p className="text-center text-small text-muted leading-relaxed px-4 py-3">We auto-check your rate against SA minimum wage so youth are always paid fairly. ⚖️</p>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${error ? 'text-red' : 'text-muted'}`}>{label}</label>
      {children}
      {/* Beside the field that caused it, and it stays until that field changes. */}
      {error && <p role="alert" className="text-small font-semibold text-red mt-1.5 leading-snug">{error}</p>}
    </div>
  );
}
