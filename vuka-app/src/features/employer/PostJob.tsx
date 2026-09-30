import { useId, useState } from 'react';
import { locationSupported, requestCoords, type Coords } from '../../lib/geo';
import { CATEGORIES, minWagePerHour } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import type { CategoryId } from '../../types';
import { Button } from '../../components/ui';
import { FairMeter } from '../../components/bits';
import { TestModeNote } from '../../components/Funding';
import { money } from '../../lib/format';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';
import { useRichT } from './EmployerRail';

// text-base (16px), not text-small: iOS Safari zooms the viewport on focus for
// anything smaller, hiding the Post button behind the keyboard.
const inputCls = 'w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink';
/** Multi-line fields keep the same skin but not the pill radius. */
const areaCls = 'w-full border-[1.5px] border-line rounded-card px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink resize-y min-h-[96px]';
/** Same field, outlined in red when it is the one holding up the form. */
const fieldCls = (error?: string) =>
  error
    ? 'w-full border-[1.5px] border-danger rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-danger'
    : inputCls;

export function PostJob() {
  const { navigate, toast, postGig } = useApp();
  const t = useT();
  const rt = useRichT();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('carwash');
  const [hours, setHours] = useState('2');
  const [rate, setRate] = useState('50');
  // i18n-ignore: a place name, the same in every language
  const [loc, setLoc] = useState('Soweto');
  const [when, setWhen] = useState(() => t('employer.post.defaultWhen'));
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  /* Escrow: secure the pay now, or later — but before hiring either way. On by
     default, because a funded job is the one workers trust enough to take. */
  const [fundNow, setFundNow] = useState(true);
  // Pinning the job to exact coordinates is what lets workers see a real
  // distance instead of an estimate — so it's offered, and it's optional.
  const [pin, setPin] = useState<Coords | null>(null);
  const [pinning, setPinning] = useState(false);

  const pinHere = async () => {
    setPinning(true);
    try {
      setPin(await requestCoords());
      toast(t('employer.post.pinned'));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setPinning(false);
    }
  };

  const rateNum = Number(rate) || 0;
  const minWage = minWagePerHour();
  /* Rounded to the rand, the same way the server computes what is secured. */
  const total = Math.round((Number(hours) || 0) * rateNum);

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
    if (!title.trim()) p.title = t('employer.post.errTitle');
    else if (title.trim().length > 120) p.title = t('employer.post.errTitleLong');
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) p.hours = t('employer.post.errHours');
    else if (hoursNum > 24) p.hours = t('employer.post.errHoursLong');
    if (!Number.isFinite(rateNum) || rateNum <= 0) p.rate = t('employer.post.errRate');
    else if (rateNum < minWage) p.rate = t('employer.post.errRateLow', { rate: rateNum.toFixed(2), min: minWage.toFixed(2) });
    if (!loc.trim()) p.loc = t('employer.post.errLoc');
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
      toast(n === 1 ? t('employer.post.fixOne') : t('employer.post.fixMany', { count: n }));
      return;
    }
    setBusy(true);
    try {
      await postGig({ title, category, hours: Number(hours), payPerHour: rateNum, location: loc.trim(), when, description, urgent: false, fund: fundNow, ...(pin ?? {}) });
      toast(fundNow
        ? t('employer.post.postedFunded', { amount: money(total) })
        : t('employer.post.postedUnfunded'));
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
        <small className="text-faint text-micro font-semibold uppercase tracking-wide">{t('employer.post.eyebrow')}</small>
        <h1 className="font-display m-0 mt-0.5 text-head font-extrabold text-ink tracking-tight">{t('post.title')}<span className="text-brand">.</span></h1>
      </header>

      <Field label={t('employer.post.what')} error={errors.title}>
        {(f) => <input {...f} className={fieldCls(errors.title)} placeholder={t('employer.post.whatPlaceholder')} value={title} onChange={(e) => { clearError('title'); setTitle(e.target.value); }} />}
      </Field>

      <Field label={t('employer.post.category')}>
        {(f) => (
          <select {...f} className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        )}
      </Field>

      <div className="flex gap-2.5 mb-3.5">
        <div className="flex-1"><Field label={t('employer.post.hours')} error={errors.hours}>{(f) => <input {...f} className={fieldCls(errors.hours)} type="number" min={1} value={hours} onChange={(e) => { clearError('hours'); setHours(e.target.value); }} />}</Field></div>
        <div className="flex-1"><Field label={t('employer.post.rate')} error={errors.rate}>{(f) => <input {...f} className={fieldCls(errors.rate)} type="number" min={1} value={rate} onChange={(e) => { clearError('rate'); setRate(e.target.value); }} />}</Field></div>
      </div>

      <Field label={t('jobs.whereLabel')} error={errors.loc}>
        {(f) => (<>
        <input {...f} className={fieldCls(errors.loc)} placeholder={t('employer.post.wherePlaceholder')} value={loc} onChange={(e) => { clearError('loc'); setLoc(e.target.value); }} />
        {locationSupported() && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-small">
            {pin ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-3 text-ink border border-line font-bold px-3 py-1.5"><Icon name="pin" size={15} /> {t('employer.post.pinnedChip')}</span>
                <button type="button" onClick={() => setPin(null)} className="inline-flex items-center min-h-[44px] px-2 -mx-2 text-dim font-semibold underline underline-offset-2 hover:text-ink transition">{t('employer.post.removePin')}</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={pinHere}
                  disabled={pinning}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-line text-ink font-bold px-4 min-h-[44px] hover:bg-surface-2 transition active:scale-95 disabled:opacity-60"
                >
                  <Icon name="pin" size={16} /> {pinning ? t('employer.post.locating') : t('employer.post.pinMe')}
                </button>
                <span className="text-faint">{t('employer.post.pinHint')}</span>
              </>
            )}
          </div>
        )}
        </>)}
      </Field>

      <Field label={t('jobs.whenLabel')}>{(f) => <input {...f} className={inputCls} placeholder={t('employer.post.whenPlaceholder')} value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>

      <Field label={t('employer.post.details')} hint={t('employer.post.detailsHint')}>
        {(f) => (
          <textarea
            {...f}
            className={areaCls}
            rows={4}
            maxLength={600}
            placeholder={t('employer.post.detailsPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>

      {/* The same meter the worker will see on the listing, so an employer
          knows exactly what is about to be published about their offer. */}
      <FairMeter ratePerHour={rateNum} minWage={minWage} />

      {/* The pay, secured up front. Workers see whether it is before applying,
          and nobody can be hired until it is. */}
      <div className="rounded-2xl border border-line bg-surface p-4 mb-3.5">
        <label className="flex gap-3 items-start cursor-pointer min-h-[44px]">
          <input type="checkbox" className="mt-1 w-5 h-5 accent-[var(--v-brand)] shrink-0" checked={fundNow} onChange={(e) => setFundNow(e.target.checked)} />
          <span className="text-small text-ink leading-relaxed">
            <b>{rt('employer.post.secureNow', { amount: <span className="font-mono tnum">{money(total)}</span> })}</b><br />
            {rt('employer.post.secureExplain', { funds: <b>{t('employer.fundsSecured')}</b> })}
            {!fundNow && <><br /><span className="text-dim">{t('employer.post.addLater')}</span></>}
          </span>
        </label>
        <TestModeNote className="mt-3" />
      </div>

      <Button block variant="primary" disabled={busy} onClick={submit}>
        {busy ? t('post.publishing') : fundNow ? t('employer.post.submitFunded', { amount: money(total) }) : t('employer.post.submitUnfunded')}
      </Button>
      <p className="text-center text-small text-dim leading-relaxed px-4 py-3">{t('employer.post.fairPayNote')}</p>
    </>
  );
}

/**
 * A labelled form row.
 *
 * The label used to be a bare <label> with nothing to point at, and the error
 * was a paragraph with no relationship to the field that caused it — so a
 * screen reader announced neither when the form failed. It now hands the
 * control its id, its description and its validity, and the caller spreads
 * them. That is one line per field and it cannot fall out of step.
 */
interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}
function Field({ label, hint, error, children }: {
  label: string;
  hint?: string;
  error?: string;
  children: (control: FieldControlProps) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className={`block text-micro font-bold uppercase tracking-wide mb-1.5 ${error ? 'text-danger' : 'text-dim'}`}>{label}</label>
      {hint && <p id={hintId} className="text-micro text-faint mt-0 mb-1.5 leading-snug">{hint}</p>}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {/* Beside the field that caused it, and it stays until that field changes. */}
      {error && <p id={errorId} role="alert" className="text-small font-semibold text-danger mt-1.5 leading-snug">{error}</p>}
    </div>
  );
}
