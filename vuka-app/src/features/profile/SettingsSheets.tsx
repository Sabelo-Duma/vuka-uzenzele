import { useState } from 'react';
import { useApp } from '../../store/appStore';
import { Button, Sheet } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { SA_BANKS, bankById, getBanking, saveBanking, clearBanking, type BankDetails } from '../../lib/banking';

const field =
  'w-full border-[1.5px] border-line-strong rounded-xl px-3.5 py-2.5 text-sm bg-surface text-navy focus:outline-none focus:border-navy transition';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5">{children}</label>;
}

/* ---------------- Banking details ---------------- */
export function BankingSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const existing = getBanking();
  const [holder, setHolder] = useState(existing?.holder ?? '');
  const [bank, setBank] = useState(existing?.bank ?? '');
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber ?? '');
  const [accountType, setAccountType] = useState<BankDetails['accountType']>(existing?.accountType ?? 'savings');

  const branch = bank ? bankById(bank)?.branchCode : undefined;
  const digits = accountNumber.replace(/\D/g, '');

  const save = () => {
    if (!holder.trim()) return toast('Enter the account holder name ✍️');
    if (!bank) return toast('Choose your bank 🏦');
    if (digits.length < 6 || digits.length > 13) return toast('Enter a valid account number (6–13 digits)');
    saveBanking({ holder: holder.trim(), bank, accountNumber: digits, accountType });
    toast('Banking details saved 💳');
    onClose();
  };

  const remove = () => {
    clearBanking();
    toast('Banking details removed');
    onClose();
  };

  return (
    <Sheet title="Banking details" onClose={onClose}>
      <h3 className="text-[19px] font-extrabold text-navy tracking-tight m-0">Get paid<span className="text-red">.</span></h3>
      <p className="text-[12.5px] text-muted mt-1 mb-4 leading-relaxed">Where should your earnings be paid? You can update this any time.</p>

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
        {branch && <p className="text-[11px] text-muted mt-1.5">Universal branch code: <b className="text-navy tnum">{branch}</b></p>}
      </div>

      <div className="mb-3">
        <Label>Account number</Label>
        <input className={field} inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" aria-label="Account number" />
      </div>

      <div className="mb-4">
        <Label>Account type</Label>
        <div className="flex gap-2">
          {(['savings', 'cheque'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAccountType(t)}
              aria-pressed={accountType === t}
              className={`flex-1 rounded-xl border-[1.5px] py-2.5 text-[13px] font-bold capitalize transition ${accountType === t ? 'border-navy bg-navy text-white dark:text-navy-deep' : 'border-line-strong text-muted hover:border-navy'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 items-start bg-[#eaf3fb] dark:bg-info/10 rounded-xl px-3.5 py-3 mb-4">
        <span className="text-info shrink-0"><Icon name="shield" size={16} /></span>
        <span className="text-[12px] text-navy leading-snug">Stored on your device for now. Payouts move to a secure, encrypted service before real money flows.</span>
      </div>

      <Button block onClick={save}>{existing ? 'Update details' : 'Save details'}</Button>
      {existing && <button onClick={remove} className="w-full text-center text-[12.5px] text-red font-bold mt-3">Remove banking details</button>}
    </Sheet>
  );
}

/* ---------------- Identity ---------------- */
export function IdentitySheet({ verified, onClose }: { verified: boolean; onClose: () => void }) {
  return (
    <Sheet title="Identity" onClose={onClose}>
      <div className={`w-16 h-16 rounded-2xl grid place-items-center text-4xl mb-3 ${verified ? 'bg-[#e6f5e6]' : 'bg-surface-2'}`} aria-hidden="true">{verified ? '✅' : '🪪'}</div>
      <h3 className="text-[19px] font-extrabold text-navy tracking-tight m-0">{verified ? 'Verified with SA ID' : 'Verify your identity'}<span className="text-red">.</span></h3>
      {verified ? (
        <p className="text-[13px] text-muted mt-1.5 leading-relaxed">Your SA ID is confirmed. Employers see your ✅ Verified badge, and you have access to formal roles that require verification.</p>
      ) : (
        <>
          <p className="text-[13px] text-muted mt-1.5 leading-relaxed">Verifying your SA ID adds a ✅ badge to your profile, builds employer trust, and unlocks formal roles that require it.</p>
          <ul className="mt-3 space-y-2 text-[12.5px] text-navy">
            <li className="flex gap-2 items-start"><span>📷</span> Scan your green ID book or smart ID card</li>
            <li className="flex gap-2 items-start"><span>⚡</span> Takes under a minute, once</li>
            <li className="flex gap-2 items-start"><span>🔒</span> Only used to confirm it's really you</li>
          </ul>
          <p className="text-[12px] text-muted mt-4 leading-relaxed">ID verification opens at pilot launch. We'll notify you the moment it's ready.</p>
        </>
      )}
      <Button block variant="ghost" className="mt-5" onClick={onClose}>Close</Button>
    </Sheet>
  );
}

/* ---------------- Safety centre ---------------- */
export function SafetySheet({ onClose }: { onClose: () => void }) {
  const { toast } = useApp();
  const [concern, setConcern] = useState('');
  const report = () => {
    if (!concern.trim()) return toast('Describe the concern so we can help');
    setConcern('');
    toast('Report received — our safety team will look into it 🛡️');
    onClose();
  };
  return (
    <Sheet title="Safety centre" onClose={onClose}>
      <h3 className="text-[19px] font-extrabold text-navy tracking-tight m-0">Safety centre<span className="text-red">.</span></h3>
      <p className="text-[12.5px] text-muted mt-1 mb-3 leading-relaxed">How Vuka keeps you safe — and how to get help.</p>
      <ul className="space-y-2 text-[12.5px] text-navy mb-4">
        <li className="flex gap-2 items-start"><span>🪪</span> Only ID-verified users can be hired or hire</li>
        <li className="flex gap-2 items-start"><span>⭐</span> Two-way ratings after every job keep everyone accountable</li>
        <li className="flex gap-2 items-start"><span>⚖️</span> Fair-pay checks flag any gig below minimum wage</li>
        <li className="flex gap-2 items-start"><span>📍</span> Meet in public, tell someone where you'll be</li>
      </ul>
      <div className="bg-[#fdecef] dark:bg-red/10 rounded-xl px-3.5 py-3 mb-4 text-[12.5px] text-navy leading-snug">
        <b>In an emergency, call 10111 (SAPS)</b> or 112 from any mobile.
      </div>
      <Label>Report a concern</Label>
      <textarea className={`${field} resize-none`} rows={3} value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="Tell us what happened…" aria-label="Report a concern" />
      <Button block className="mt-3" onClick={report}>Submit report</Button>
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
      <h3 className="text-[19px] font-extrabold text-navy tracking-tight m-0">Language<span className="text-red">.</span></h3>
      <p className="text-[12.5px] text-muted mt-1 mb-4 leading-relaxed">Choose your preferred language. More are rolling out — your choice is saved for when they land.</p>
      <div className="flex flex-col gap-2">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => pick(l.id, l.ready)}
            aria-pressed={lang === l.id}
            className={`flex items-center justify-between rounded-xl border-[1.5px] px-3.5 py-3 text-sm font-bold transition ${lang === l.id ? 'border-navy bg-surface-2' : 'border-line-strong hover:border-navy'}`}
          >
            <span className="text-navy">{l.label} {!l.ready && <span className="text-[11px] font-semibold text-muted">· coming soon</span>}</span>
            {lang === l.id && <span className="text-navy"><Icon name="check" size={18} /></span>}
          </button>
        ))}
      </div>
      <Button block variant="ghost" className="mt-5" onClick={onClose}>Done</Button>
    </Sheet>
  );
}
