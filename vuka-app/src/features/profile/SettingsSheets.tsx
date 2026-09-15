import { useEffect, useState } from 'react';
import { useApp } from '../../store/appStore';
import { api, ApiError, type BlockedUser, type IdVerification } from '../../lib/api';
import { Avatar, Button, InlineError, Sheet, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { SA_BANKS, bankById, saveBanking, clearBanking, useBanking, type BankingSummary } from '../../lib/banking';
import { useLanguage } from '../../providers/LanguageProvider';
import { LANGS, coverage, langMeta, translate, type Lang } from '../../i18n';

// text-base (16px), not text-small: iOS Safari zooms the viewport on focus for
// anything smaller, and these sit inside a bottom sheet that then can't scroll
// back into view.
const field =
  'w-full border-[1.5px] border-line rounded-xl px-3.5 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-line transition';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-micro font-bold text-dim uppercase tracking-wide mb-1.5">{children}</label>;
}

/* ---------------- Banking details ---------------- */
export function BankingSheet({ onClose }: { onClose: () => void }) {
  const { banking, loading } = useBanking();
  if (loading) {
    return (
      <Sheet title="Banking details" onClose={onClose}>
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </Sheet>
    );
  }
  return <BankingForm existing={banking} onClose={onClose} />;
}

function BankingForm({ existing, onClose }: { existing: BankingSummary | null; onClose: () => void }) {
  const { toast } = useApp();
  const [holder, setHolder] = useState(existing?.holder ?? '');
  const [bank, setBank] = useState(existing?.bank ?? '');
  // Never prefilled: the server does not return the stored number. Left blank
  // it means "keep the account already on file".
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<BankingSummary['accountType']>(existing?.accountType ?? 'savings');
  const [busy, setBusy] = useState(false);

  const branch = bank ? bankById(bank)?.branchCode : undefined;
  const digits = accountNumber.replace(/\D/g, '');

  const save = async () => {
    if (!holder.trim()) return toast('Enter the account holder name ✍️');
    if (!bank) return toast('Choose your bank 🏦');
    if (!existing && !digits) return toast('Enter your account number');
    if (digits && (digits.length < 6 || digits.length > 13)) return toast('Enter a valid account number (6–13 digits)');
    setBusy(true);
    try {
      await saveBanking({ holder: holder.trim(), bank, accountType, ...(digits ? { accountNumber: digits } : {}) });
      toast('Banking details saved securely 💳');
      onClose();
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await clearBanking();
      toast('Banking details removed');
      onClose();
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title="Banking details" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">Get paid<span className="text-brand">.</span></h3>
      <p className="text-small text-dim mt-1 mb-4 leading-relaxed">Where should your earnings be paid? You can update this any time.</p>

      <div className="mb-3">
        <Label>Account holder</Label>
        <input className={field} value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="As it appears on your ID" aria-label="Account holder" />
      </div>

      <div className="mb-3">
        <Label>Bank</Label>
        <select className={field} value={bank} onChange={(e) => setBank(e.target.value)} aria-label="Bank">
          <option value="" disabled>Choose your bank</option>
          {SA_BANKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {branch && <p className="text-micro text-dim mt-1.5">Universal branch code: <b className="text-ink font-mono tnum">{branch}</b></p>}
      </div>

      <div className="mb-3">
        <Label>Account number</Label>
        <input
          className={field}
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder={existing ? `•••• ${existing.last4} — leave blank to keep` : 'e.g. 1234567890'}
          aria-label="Account number"
        />
        {existing && <p className="text-micro text-dim mt-1.5">For your safety we never show a saved account number. Type a new one only if it changed.</p>}
      </div>

      <div className="mb-4">
        <Label>Account type</Label>
        <div className="flex gap-2">
          {(['savings', 'cheque'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAccountType(t)}
              aria-pressed={accountType === t}
              className={`flex-1 rounded-xl border-[1.5px] py-2.5 text-small font-bold capitalize transition ${accountType === t ? 'border-ink bg-ink text-canvas' : 'border-line text-dim hover:border-faint'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 items-start bg-info-soft rounded-xl px-3.5 py-3 mb-4">
        <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
        <span className="text-small text-ink leading-snug">Encrypted and stored on Vuka's servers — never on this device. Only the last 4 digits are ever shown back to you.</span>
      </div>

      <Button block disabled={busy} onClick={save}>{busy ? 'Saving…' : existing ? 'Update details' : 'Save details'}</Button>
      {existing && <button disabled={busy} onClick={remove} className="w-full text-center text-small text-danger font-bold mt-3 disabled:opacity-50">Remove banking details</button>}
    </Sheet>
  );
}

/* ---------------- Identity (KYC) ----------------
   Submits a real SA ID number for checking. The badge is granted by the review
   on the server — nothing here can grant it, which is the point. */
export function IdentitySheet({ verified, onClose }: { verified: boolean; onClose: () => void }) {
  const { toast } = useApp();
  const [submission, setSubmission] = useState<IdVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getIdVerification()
      .then((v) => { if (!cancelled) setSubmission(v); })
      .catch(() => { /* treated as "not submitted" */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    if (fullName.trim().length < 3) return toast('Enter your full name as it appears on your ID');
    if (idNumber.replace(/\D/g, '').length !== 13) return toast('An SA ID number has 13 digits');
    setBusy(true);
    try {
      setSubmission(await api.submitIdVerification(fullName.trim(), idNumber.replace(/\D/g, '')));
      toast("ID submitted 🪪 We'll check it and let you know.");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const status = verified ? 'verified' : submission?.status ?? 'none';

  return (
    <Sheet title="Identity" onClose={onClose}>
      <div className={`w-16 h-16 rounded-2xl grid place-items-center text-hero mb-3 ${status === 'verified' ? 'bg-verified-soft' : 'bg-surface-2'}`} aria-hidden="true">
        {status === 'verified' ? '✅' : status === 'pending' ? '🕓' : '🪪'}
      </div>

      {status === 'verified' && (
        <>
          <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">Verified with SA ID<span className="text-brand">.</span></h3>
          <p className="text-small text-dim mt-1.5 leading-relaxed">
            Your SA ID is confirmed{submission?.last4 ? <> (•••• {submission.last4})</> : null}. Employers see your ✅ Verified badge, and formal roles that require verification are open to you.
          </p>
          <Button block variant="ghost" className="mt-5" onClick={onClose}>Close</Button>
        </>
      )}

      {status === 'pending' && (
        <>
          <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">We're checking your ID<span className="text-brand">.</span></h3>
          <p className="text-small text-dim mt-1.5 leading-relaxed">
            Submitted{submission?.last4 ? <> for ID •••• {submission.last4}</> : null}. Checks usually finish within a day — your ✅ badge appears here automatically. You can keep working in the meantime.
          </p>
          <Button block variant="ghost" className="mt-5" onClick={onClose}>Close</Button>
        </>
      )}

      {(status === 'none' || status === 'rejected') && (
        <>
          <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">Verify your identity<span className="text-brand">.</span></h3>
          {status === 'rejected' && (
            <div className="bg-live-soft rounded-xl px-3.5 py-3 mt-3 text-small text-ink leading-snug">
              <b>We couldn't verify your last submission.</b>{submission?.reason ? ` ${submission.reason}` : ' Please check the details and try again.'}
            </div>
          )}
          <p className="text-small text-dim mt-1.5 leading-relaxed">Verifying adds a ✅ badge to your profile, builds employer trust, and unlocks formal roles that require it.</p>

          {loading ? (
            <div className="flex flex-col gap-3 mt-4" aria-busy="true"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>
          ) : (
            <>
              <div className="mt-4 mb-3">
                <Label>Full name (as on your ID)</Label>
                <input className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Thandeka Mokoena" aria-label="Full name as on your ID" />
              </div>
              <div className="mb-3">
                <Label>SA ID number</Label>
                <input
                  className={field}
                  inputMode="numeric"
                  maxLength={13}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="13 digits"
                  aria-label="South African ID number"
                />
                <p className="text-micro text-dim mt-1.5">We check the number is valid, then confirm it against Home Affairs records.</p>
              </div>
              <div className="flex gap-2.5 items-start bg-info-soft rounded-xl px-3.5 py-3 mb-4">
                <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
                <span className="text-small text-ink leading-snug">Your ID number is encrypted and never shown to employers — they only see the ✅ badge.</span>
              </div>
              <Button block disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit for verification'}</Button>
              <button onClick={onClose} className="w-full text-center text-small text-dim font-bold mt-3 hover:text-ink">Maybe later</button>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ---------------- Safety centre ---------------- */
export function SafetySheet({ gigId, aboutUserId, onClose }: { gigId?: string; aboutUserId?: string; onClose: () => void }) {
  const { toast } = useApp();
  const { t } = useLanguage();
  const [concern, setConcern] = useState('');
  const [busy, setBusy] = useState(false);
  const report = async () => {
    if (!concern.trim()) return toast('Describe the concern so we can help');
    setBusy(true);
    try {
      await api.reportSafety(concern.trim(), { gigId, aboutUserId });
      setConcern('');
      toast('Report received — our safety team will look into it 🛡️');
      onClose();
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Sheet title={t('safety.title')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">{t('safety.title')}<span className="text-brand">.</span></h3>
      <p className="text-small text-dim mt-1 mb-3 leading-relaxed">{t('safety.intro')}</p>
      <ul className="space-y-2 text-small text-ink mb-4">
        {/* This used to read "Only ID-verified users can be hired or hire".
            Nothing enforced it — nothing ever has — and a safety claim the
            product does not keep is worse than no claim at all. */}
        <li className="flex gap-2 items-start"><span>🪪</span> {t('safety.verify')}</li>
        <li className="flex gap-2 items-start"><span>⭐</span> {t('safety.ratings')}</li>
        <li className="flex gap-2 items-start"><span>⚖️</span> {t('safety.fairPay')}</li>
        <li className="flex gap-2 items-start"><span>📍</span> {t('safety.meetPublic')}</li>
      </ul>
      <div className="bg-live-soft rounded-xl px-3.5 py-3 mb-4 text-small text-ink leading-snug">
        <b>{t('safety.emergency')}</b>
      </div>
      <Label>{t('safety.reportConcern')}</Label>
      <textarea className={`${field} resize-none`} rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} placeholder={t('safety.reportPlaceholder')} aria-label={t('safety.reportConcern')} />
      <Button block className="mt-3" disabled={busy} onClick={report}>{busy ? t('action.sending') : t('safety.reportSubmit')}</Button>
      <p className="text-center text-micro text-dim mt-2.5">{t('safety.reportNote')}</p>
    </Sheet>
  );
}

/* ---------------- Language ----------------
   This used to save a preference and change nothing. Four of the five options
   said "coming soon", which on a South African jobs app meant: we know who you
   are, and we have not built for you.

   Now the choice is applied. What is not yet translated falls back to English
   rather than going blank, and the screen says how much of each language is
   actually done — a number the check script computes, so it cannot drift into
   a claim the catalogue does not support. */
export function LanguageSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const { lang, setLang, t } = useLanguage();
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = (id: Lang) => {
    setLang(id);
    /* Read the new language's own name from its own catalogue, so the
       confirmation is already in the language just chosen. */
    toast(translate(id, 'lang.applied', { language: langMeta(id).label }));
  };

  /* Translation complaints ride the safety-report queue rather than a new
     endpoint and a new table: that queue is already staffed and already has an
     admin screen, and a report nobody reads is worse than no report button.
     The tag is what makes them filterable. */
  const sendReport = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api.reportSafety(`[translation:${lang}] ${note.trim()}`);
      setNote('');
      setReporting(false);
      toast(t('lang.reportSent'));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('lang.title')} onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">
        {t('lang.title')}<span className="text-brand">.</span>
      </h3>
      <p className="text-small text-dim mt-1 mb-4 leading-relaxed">{t('lang.intro')}</p>

      <div className="flex flex-col gap-2">
        {LANGS.map((l) => {
          const pct = coverage(l.id);
          const selected = lang === l.id;
          return (
            <button
              key={l.id}
              onClick={() => pick(l.id)}
              aria-pressed={selected}
              lang={l.tag}
              className={`flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-3.5 py-3 text-left transition ${selected ? 'border-brand-solid bg-brand-soft' : 'border-line hover:border-faint'}`}
            >
              <span className="min-w-0">
                <span className="block text-small font-bold text-ink truncate">{l.label}</span>
                {/* The English name underneath is the way back: you have to be
                    able to find your language, and then find your way out of
                    one you picked by mistake. */}
                <span className="block text-micro text-dim truncate" lang="en">
                  {l.english}
                  {pct < 100 && <> · {t('lang.partial', { percent: pct })}</>}
                </span>
              </span>
              {selected && <span className="text-ink shrink-0"><Icon name="check" size={18} /></span>}
            </button>
          );
        })}
      </div>

      <p className="text-micro text-dim mt-3 leading-relaxed">{t('lang.partialHint')}</p>

      <div className="bg-surface-2 rounded-xl px-3.5 py-3 mt-4 text-micro text-dim leading-relaxed">
        {t('lang.legalNote')}
      </div>

      {/* Community correction. These translations were not written by
          first-language speakers and the screen says so rather than letting a
          user discover it from a wrong word. */}
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-small font-bold text-ink m-0">{t('lang.reportTitle')}</p>
        <p className="text-micro text-dim mt-1 leading-relaxed">{t('lang.reportBody')}</p>
        {reporting ? (
          <>
            <textarea
              className={`${field} resize-none mt-2.5`}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('lang.reportPlaceholder')}
              aria-label={t('lang.reportAction')}
            />
            <Button block className="mt-2.5" disabled={busy || !note.trim()} onClick={sendReport}>
              {busy ? t('action.sending') : t('action.send')}
            </Button>
          </>
        ) : (
          <Button block variant="ghost" className="mt-2.5" onClick={() => setReporting(true)}>
            {t('lang.reportAction')}
          </Button>
        )}
      </div>

      <Button block variant="ghost" className="mt-5" onClick={onClose}>{t('action.done')}</Button>
    </Sheet>
  );
}

/* ---------------- Edit profile ----------------
   The details a CV needs and sign-up deliberately does not ask for. Sign-up
   stays short because every field on that funnel costs completions; this is
   where the rest gets filled in, once there is a reason to.

   Before this existed a profile was written once at registration and never
   again: a typo in a name was permanent, and nobody could fill in education,
   so the Education section of every generated CV was empty. */
export function EditProfileSheet({ onClose }: { onClose: () => void }) {
  const { toast, reloadData } = useApp();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ message: string; field?: string } | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [offered, setOffered] = useState<string[]>([]);
  const [f, setF] = useState({ name: '', location: '', education: '', bio: '', email: '' });

  useEffect(() => {
    let cancelled = false;
    api.getProfile()
      .then((d) => {
        if (cancelled) return;
        setF({
          name: d.user.name ?? '',
          location: d.profile?.location ?? '',
          education: d.profile?.education ?? '',
          bio: d.profile?.bio ?? '',
          email: d.user.email ?? '',
        });
        setLanguages(d.profile?.languages ?? []);
        setOffered(d.languages ?? []);
      })
      .catch((e) => { if (!cancelled) setErr({ message: e instanceof Error ? e.message : 'Could not load your profile.' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const set = (k: keyof typeof f) => (v: string) => { setErr(null); setF((p) => ({ ...p, [k]: v })); };
  const toggleLang = (l: string) =>
    setLanguages((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.saveProfile({ ...f, languages });
      await reloadData();
      toast('Profile saved — your CV is up to date 📄');
      onClose();
    } catch (e) {
      const ae = e as ApiError;
      setErr({ message: ae.message, field: ae.field });
    } finally {
      setBusy(false);
    }
  };

  const bad = (field: string) => (err?.field === field ? 'border-danger' : '');

  return (
    <Sheet title="Edit your profile" onClose={onClose}>
      <p className="text-small text-dim mt-1 mb-4 leading-relaxed">
        These details go on your CV. Employers see them when you apply.
      </p>

      {loading ? <Skeleton className="h-56" /> : (
        <>
          <SheetLabel>Full name</SheetLabel>
          <input className={`${fieldCls} ${bad('name')}`} value={f.name} onChange={(e) => set('name')(e.target.value)} aria-label="Full name" />

          <SheetLabel>Where you live</SheetLabel>
          <input className={`${fieldCls} ${bad('location')}`} value={f.location} onChange={(e) => set('location')(e.target.value)} placeholder="Suburb, City" aria-label="Where you live" />

          <SheetLabel>Email address <span className="font-normal text-faint">(optional)</span></SheetLabel>
          <input
            className={`${fieldCls} ${bad('email')}`} value={f.email} type="email" inputMode="email"
            autoCapitalize="none" spellCheck={false} placeholder="you@example.co.za"
            onChange={(e) => set('email')(e.target.value)} aria-label="Email address"
          />
          <p className="text-micro text-faint mt-1 mb-1 leading-relaxed">
            Employers expect one on a CV, and you can use it to sign in as well as your number.
          </p>

          <SheetLabel>Education <span className="font-normal text-faint">(optional)</span></SheetLabel>
          <input className={fieldCls} value={f.education} onChange={(e) => set('education')(e.target.value)} placeholder="e.g. Matric, Morris Isaacson High School, 2021" aria-label="Education" />

          <SheetLabel>Languages you speak</SheetLabel>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {offered.map((l) => {
              const on = languages.includes(l);
              return (
                <button
                  key={l} type="button" onClick={() => toggleLang(l)} aria-pressed={on}
                  className={`rounded-pill border-[1.5px] px-3 py-1.5 text-small font-bold transition active:scale-95 ${
                    on ? 'border-ink bg-ink text-canvas' : 'border-line text-dim hover:border-faint'}`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          <SheetLabel>About you <span className="font-normal text-faint">(optional)</span></SheetLabel>
          <textarea
            className={`${fieldCls} min-h-[88px] resize-none`} value={f.bio} maxLength={600}
            onChange={(e) => set('bio')(e.target.value)} placeholder="A sentence or two about how you work."
            aria-label="About you"
          />
          <p className="text-micro text-faint mt-1 mb-3 leading-relaxed">
            Leave this blank and we write it for you from the jobs you have completed.
          </p>

          {err && <InlineError>{err.message}</InlineError>}

          <Button block className="mt-4" disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
        </>
      )}
    </Sheet>
  );
}

function SheetLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-micro font-extrabold uppercase tracking-wide text-dim mt-3.5 mb-1.5">{children}</label>;
}
const fieldCls = 'w-full border-[1.5px] border-line rounded-xl px-3.5 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-line transition';

/**
 * Who you have blocked, and how to undo it.
 *
 * Blocking happens inside a conversation, which is where it is needed — but
 * undoing it should not require finding that conversation again. Someone who
 * blocked an employer in a bad moment and now wants the work back should not
 * have to scroll an inbox to get there.
 */
export function BlockedSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const [people, setPeople] = useState<BlockedUser[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.listBlocks().then((r) => { if (!cancelled) setPeople(r); }).catch(() => { if (!cancelled) setPeople([]); });
    return () => { cancelled = true; };
  }, []);

  const unblock = async (u: BlockedUser) => {
    setBusy(u.id);
    try {
      await api.unblockUser(u.id);
      setPeople((prev) => (prev ?? []).filter((p) => p.id !== u.id));
      toast(`${u.name.split(' ')[0]} is unblocked.`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet title="Blocked people" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink tracking-tight m-0">Blocked people<span className="text-brand">.</span></h3>
      <p className="text-small text-dim mt-1 mb-4 leading-relaxed">
        A blocked person can't message you and can't invite you to a job — and you can't message
        them either, until you unblock. Nothing either of you said is deleted.
      </p>

      {people === null ? (
        <div className="flex flex-col gap-2">{[0, 1].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}</div>
      ) : people.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-hero mb-2" aria-hidden="true">🛡️</div>
          <p className="text-dim text-small m-0">You haven't blocked anyone.</p>
          <p className="text-faint text-small mt-1 mb-0">You can block someone from inside a conversation.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {people.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-2xl border border-line bg-surface">
              <Avatar initials={u.initials} size="sm" />
              <div className="flex-1 min-w-0">
                <b className="block text-small font-extrabold text-ink truncate">{u.name}</b>
                <span className="text-micro text-faint">Blocked {shortDate(u.blockedAt)}</span>
              </div>
              <button
                type="button"
                onClick={() => unblock(u)}
                disabled={busy === u.id}
                className="shrink-0 inline-flex items-center min-h-[44px] px-3.5 rounded-pill border border-line bg-surface text-small font-bold text-ink hover:bg-surface-2 transition active:scale-95 disabled:opacity-50"
              >
                {busy === u.id ? 'Unblocking…' : 'Unblock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/** "12 Sep 2026" — enough to remember the occasion by. */
function shortDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
}
