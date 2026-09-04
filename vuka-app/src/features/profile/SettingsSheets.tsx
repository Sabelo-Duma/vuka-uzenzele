import { useEffect, useState } from 'react';
import { useApp } from '../../store/appStore';
import { api, type IdVerification } from '../../lib/api';
import { Button, Sheet, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { SA_BANKS, bankById, saveBanking, clearBanking, useBanking, type BankingSummary } from '../../lib/banking';

// text-base (16px), not text-sm: iOS Safari zooms the viewport on focus for
// anything smaller, and these sit inside a bottom sheet that then can't scroll
// back into view.
const field =
  'w-full border-[1.5px] border-line-strong rounded-xl px-3.5 py-2.5 text-base bg-surface text-navy focus:outline-none focus:border-navy transition';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5">{children}</label>;
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
      <h3 className="text-title font-extrabold text-navy tracking-tight m-0">Get paid<span className="text-red">.</span></h3>
      <p className="text-small text-muted mt-1 mb-4 leading-relaxed">Where should your earnings be paid? You can update this any time.</p>

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
        {branch && <p className="text-micro text-muted mt-1.5">Universal branch code: <b className="text-navy tnum">{branch}</b></p>}
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
        {existing && <p className="text-micro text-muted mt-1.5">For your safety we never show a saved account number. Type a new one only if it changed.</p>}
      </div>

      <div className="mb-4">
        <Label>Account type</Label>
        <div className="flex gap-2">
          {(['savings', 'cheque'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAccountType(t)}
              aria-pressed={accountType === t}
              className={`flex-1 rounded-xl border-[1.5px] py-2.5 text-small font-bold capitalize transition ${accountType === t ? 'border-navy bg-navy text-white dark:text-navy-deep' : 'border-line-strong text-muted hover:border-navy'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 items-start bg-[#eaf3fb] dark:bg-info/10 rounded-xl px-3.5 py-3 mb-4">
        <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
        <span className="text-small text-navy leading-snug">Encrypted and stored on Vuka's servers — never on this device. Only the last 4 digits are ever shown back to you.</span>
      </div>

      <Button block disabled={busy} onClick={save}>{busy ? 'Saving…' : existing ? 'Update details' : 'Save details'}</Button>
      {existing && <button disabled={busy} onClick={remove} className="w-full text-center text-small text-red font-bold mt-3 disabled:opacity-50">Remove banking details</button>}
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
      <div className={`w-16 h-16 rounded-2xl grid place-items-center text-4xl mb-3 ${status === 'verified' ? 'bg-[#e6f5e6]' : 'bg-surface-2'}`} aria-hidden="true">
        {status === 'verified' ? '✅' : status === 'pending' ? '🕓' : '🪪'}
      </div>

      {status === 'verified' && (
        <>
          <h3 className="text-title font-extrabold text-navy tracking-tight m-0">Verified with SA ID<span className="text-red">.</span></h3>
          <p className="text-small text-muted mt-1.5 leading-relaxed">
            Your SA ID is confirmed{submission?.last4 ? <> (•••• {submission.last4})</> : null}. Employers see your ✅ Verified badge, and formal roles that require verification are open to you.
          </p>
          <Button block variant="ghost" className="mt-5" onClick={onClose}>Close</Button>
        </>
      )}

      {status === 'pending' && (
        <>
          <h3 className="text-title font-extrabold text-navy tracking-tight m-0">We're checking your ID<span className="text-red">.</span></h3>
          <p className="text-small text-muted mt-1.5 leading-relaxed">
            Submitted{submission?.last4 ? <> for ID •••• {submission.last4}</> : null}. Checks usually finish within a day — your ✅ badge appears here automatically. You can keep working in the meantime.
          </p>
          <Button block variant="ghost" className="mt-5" onClick={onClose}>Close</Button>
        </>
      )}

      {(status === 'none' || status === 'rejected') && (
        <>
          <h3 className="text-title font-extrabold text-navy tracking-tight m-0">Verify your identity<span className="text-red">.</span></h3>
          {status === 'rejected' && (
            <div className="bg-[#fdecef] dark:bg-red/10 rounded-xl px-3.5 py-3 mt-3 text-small text-navy leading-snug">
              <b>We couldn't verify your last submission.</b>{submission?.reason ? ` ${submission.reason}` : ' Please check the details and try again.'}
            </div>
          )}
          <p className="text-small text-muted mt-1.5 leading-relaxed">Verifying adds a ✅ badge to your profile, builds employer trust, and unlocks formal roles that require it.</p>

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
                <p className="text-micro text-muted mt-1.5">We check the number is valid, then confirm it against Home Affairs records.</p>
              </div>
              <div className="flex gap-2.5 items-start bg-[#eaf3fb] dark:bg-info/10 rounded-xl px-3.5 py-3 mb-4">
                <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
                <span className="text-small text-navy leading-snug">Your ID number is encrypted and never shown to employers — they only see the ✅ badge.</span>
              </div>
              <Button block disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit for verification'}</Button>
              <button onClick={onClose} className="w-full text-center text-small text-muted font-bold mt-3 hover:text-navy">Maybe later</button>
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
    <Sheet title="Safety centre" onClose={onClose}>
      <h3 className="text-title font-extrabold text-navy tracking-tight m-0">Safety centre<span className="text-red">.</span></h3>
      <p className="text-small text-muted mt-1 mb-3 leading-relaxed">How Vuka keeps you safe — and how to get help.</p>
      <ul className="space-y-2 text-small text-navy mb-4">
        <li className="flex gap-2 items-start"><span>🪪</span> Only ID-verified users can be hired or hire</li>
        <li className="flex gap-2 items-start"><span>⭐</span> Two-way ratings after every job keep everyone accountable</li>
        <li className="flex gap-2 items-start"><span>⚖️</span> Fair-pay checks flag any gig below minimum wage</li>
        <li className="flex gap-2 items-start"><span>📍</span> Meet in public, tell someone where you'll be</li>
      </ul>
      <div className="bg-[#fdecef] dark:bg-red/10 rounded-xl px-3.5 py-3 mb-4 text-small text-navy leading-snug">
        <b>In an emergency, call 10111 (SAPS)</b> or 112 from any mobile.
      </div>
      <Label>Report a concern</Label>
      <textarea className={`${field} resize-none`} rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="Tell us what happened…" aria-label="Report a concern" />
      <Button block className="mt-3" disabled={busy} onClick={report}>{busy ? 'Sending…' : 'Submit report'}</Button>
      <p className="text-center text-micro text-muted mt-2.5">Reports go to Vuka's safety team and are kept confidential.</p>
    </Sheet>
  );
}

/* ---------------- Language ---------------- */
const LANGS = [
  { id: 'en', label: 'English', ready: true },
  { id: 'zu', label: 'isiZulu', ready: false },
  { id: 'st', label: 'Sesotho', ready: false },
  { id: 'af', label: 'Afrikaans', ready: false },
  { id: 'xh', label: 'isiXhosa', ready: false },
];
function getLang(): string { try { return localStorage.getItem('vuka-lang') || 'en'; } catch { return 'en'; } }

export function LanguageSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const [lang, setLang] = useState(getLang());
  const pick = (id: string, ready: boolean) => {
    setLang(id);
    try { localStorage.setItem('vuka-lang', id); } catch { /* ignore */ }
    const label = LANGS.find((l) => l.id === id)?.label;
    toast(ready ? `Language set to ${label} 🌍` : `${label} is coming soon — saved as your preference 🌍`);
  };
  return (
    <Sheet title="Language" onClose={onClose}>
      <h3 className="text-title font-extrabold text-navy tracking-tight m-0">Language<span className="text-red">.</span></h3>
      <p className="text-small text-muted mt-1 mb-4 leading-relaxed">Choose your preferred language. More are rolling out — your choice is saved for when they land.</p>
      <div className="flex flex-col gap-2">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => pick(l.id, l.ready)}
            aria-pressed={lang === l.id}
            className={`flex items-center justify-between rounded-xl border-[1.5px] px-3.5 py-3 text-sm font-bold transition ${lang === l.id ? 'border-navy bg-surface-2' : 'border-line-strong hover:border-navy'}`}
          >
            <span className="text-navy">{l.label} {!l.ready && <span className="text-micro font-semibold text-muted">· coming soon</span>}</span>
            {lang === l.id && <span className="text-navy"><Icon name="check" size={18} /></span>}
          </button>
        ))}
      </div>
      <Button block variant="ghost" className="mt-5" onClick={onClose}>Done</Button>
    </Sheet>
  );
}
