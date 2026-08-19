import { useState } from 'react';
import { locationSupported, requestCoords, type Coords } from '../../lib/geo';
import { CATEGORIES, minWagePerHour } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import type { CategoryId } from '../../types';
import { Button } from '../../components/ui';
import { Chip } from '../../components/ui';

const inputCls = 'w-full border-[1.5px] border-line-strong rounded-pill px-4 py-3 text-sm bg-surface text-navy focus:outline-none focus:border-navy';

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

  const submit = async () => {
    if (!title.trim()) { toast('Give your job a title first ✍️'); return; }
    setBusy(true);
    try {
      await postGig({ title, category, hours: Number(hours) || 2, payPerHour: rateNum, location: loc, when, description, urgent: false, ...(pin ?? {}) });
      toast('Job posted! Verified youth nearby can now apply 🚀');
      navigate('home');
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <header className="mb-4">
        <small className="text-subtle text-xs font-semibold uppercase tracking-wide">Reach verified youth nearby</small>
        <h2 className="m-0 mt-0.5 text-[23px] font-extrabold text-navy tracking-tight">Post a job<span className="text-red">.</span></h2>
      </header>

      <Field label="What do you need?">
        <input className={inputCls} placeholder="e.g. Wash my car this Saturday" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Job title" />
      </Field>

      <Field label="Category">
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} aria-label="Category">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </Field>

      <div className="flex gap-2.5 mb-3.5">
        <div className="flex-1"><Field label="Hours"><input className={inputCls} type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} aria-label="Hours" /></Field></div>
        <div className="flex-1"><Field label="Rate / hr"><input className={inputCls} type="number" min={1} value={rate} onChange={(e) => setRate(e.target.value)} aria-label="Rate per hour" /></Field></div>
      </div>

      <Field label="Where">
        <input className={inputCls} placeholder="Suburb, e.g. Diepkloof" value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="Location" />
        {locationSupported() && (
          <div className="flex items-center gap-2 mt-2 text-[12.5px]">
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
      <p className="text-center text-[12px] text-muted leading-relaxed px-4 py-3">We auto-check your rate against SA minimum wage so youth are always paid fairly. ⚖️</p>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
