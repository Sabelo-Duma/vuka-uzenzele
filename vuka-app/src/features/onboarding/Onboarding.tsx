import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CATEGORIES } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { api } from '../../lib/api';
import { useTheme } from '../../providers/ThemeProvider';
import type { CategoryId, Role } from '../../types';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { PrivacySheet, TermsSheet } from '../profile/LegalSheets';
import { Landing } from './Landing';

type OBView = 'landing' | 'role' | 'reg' | 'login' | 'reset';
interface OBData {
  phone: string; otp: string; name: string; age: string; location: string;
  skills: CategoryId[]; password: string;
  /** Proof from the server that the OTP for `phone` checked out. */
  verifyToken: string;
}

const stepsFor = (role: Role): string[] =>
  role === 'worker'
    ? ['phone', 'otp', 'about', 'skills', 'password', 'id', 'done']
    : ['phone', 'otp', 'org', 'password', 'done'];

export function Onboarding() {
  const { register, login, demoLogin, toast } = useApp();

  const [view, setView] = useState<OBView>('landing');
  const [role, setRole] = useState<Role>('worker');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<OBData>({ phone: '', otp: '', name: '', age: '', location: 'Soweto, Gauteng', skills: [], password: '', verifyToken: '' });

  const steps = stepsFor(role);
  const key = steps[step];

  const validate = (): boolean => {
    if (key === 'about' && !data.name.trim()) { toast('Please enter your name ✍️'); return false; }
    if (key === 'skills' && data.skills.length === 0) { toast('Pick at least one skill 🎯'); return false; }
    if (key === 'org' && !data.name.trim()) { toast('Enter your name or business ✍️'); return false; }
    if (key === 'password' && data.password.length < 8) { toast('Choose a password of at least 8 characters 🔒'); return false; }
    return true;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => { if (step > 0) setStep((s) => s - 1); else setView('role'); };

  if (view === 'landing') {
    return <Landing onGetStarted={() => setView('role')} onLogin={() => setView('login')} />;
  }

  const finish = async () => {
    setBusy(true);
    try {
      await register({
        role, name: data.name, phone: data.phone, password: data.password,
        verifyToken: data.verifyToken,
        age: Number(data.age) || (role === 'worker' ? 18 : 30),
        location: data.location, skills: data.skills,
      });
    } catch (e) { toast((e as Error).message); setBusy(false); }
  };

  return (
    <AuthLayout>
      {view === 'role' && <RoleChoose onBack={() => setView('landing')} onPick={(r) => { setRole(r); setStep(0); setView('reg'); }} onLogin={() => setView('login')} />}
      {view === 'login' && <LoginView busy={busy} onBack={() => setView('landing')} onForgot={() => setView('reset')}
        onLogin={async (phone, password) => { setBusy(true); try { await login(phone, password); } catch (e) { toast((e as Error).message); setBusy(false); } }}
        onDemo={async (r) => { setBusy(true); try { await demoLogin(r); } catch (e) { toast((e as Error).message); setBusy(false); } }} />}
      {view === 'reset' && <ResetView onBack={() => setView('login')} />}
      {view === 'reg' && key !== 'done' && (
        <RegStep
          stepKey={key} steps={steps} step={step} data={data} setData={setData}
          onBack={back}
          onNext={next}
          // The phone and OTP steps advance themselves once the server agrees.
          onVerified={(verifyToken) => { setData((d) => ({ ...d, verifyToken })); setStep((s) => s + 1); }}
        />
      )}
      {view === 'reg' && key === 'done' && <Success role={role} name={data.name} busy={busy} onEnter={finish} onBack={back} />}
    </AuthLayout>
  );
}

/* ============================================================
   Enterprise split-screen auth layout
   ============================================================ */
function AuthLayout({ children }: { children: ReactNode }) {
  const { resolved, toggle } = useTheme();
  return (
    <div className="min-h-screen flex bg-surface-2 text-ink">
      {/* Brand / value panel (desktop) */}
      <aside className="hidden lg:flex flex-col justify-between w-[44%] max-w-[600px] p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0D182B 0%, #0E355A 62%, #123e69 100%)' }}>
        <div aria-hidden="true" className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,0,35,.18), transparent 70%)' }} />
        <div aria-hidden="true" className="absolute -left-16 bottom-10 w-[280px] h-[280px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.06), transparent 70%)' }} />

        <div className="relative flex items-center gap-2.5 font-bold text-lg"><span className="w-3 h-3 rounded-full bg-red" />Vuka Uzenzele</div>

        <div className="relative max-w-md">
          <span className="ob-rise inline-flex items-center gap-2 rounded-pill bg-white/10 border border-white/15 px-3 py-1.5 text-[12px] font-bold text-white/90 mb-6">
            <span className="w-2 h-2 rounded-full bg-red floaty" />Youth work, reimagined for South Africa
          </span>
          <h1 className="ob-rise text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em]">Start with no CV.<br />Let your work write it<span className="text-red">.</span></h1>
          <p className="ob-rise-2 text-white/70 mt-5 text-[15px] leading-relaxed">Vuka Uzenzele connects South Africa's youth to real work — and turns every completed job into a verified track record that opens the door to formal employment.</p>
          <ul className="ob-rise-3 mt-9 space-y-4">
            {[
              { icon: '🪜', t: 'The opportunity ladder', s: 'A strong profile unlocks cashier, security & call-centre roles.' },
              { icon: '🧾', t: 'A CV that builds itself', s: 'Real, verified references from every job you complete.' },
              { icon: '🛡️', t: 'Safe & fair by design', s: 'ID verification, two-way reviews, minimum-wage checks.' },
            ].map((f) => (
              <li key={f.t} className="flex gap-3.5 items-start">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/10 text-xl shrink-0" aria-hidden="true">{f.icon}</span>
                <span><span className="block font-bold text-[15px]">{f.t}</span><span className="block text-white/60 text-[13px] leading-snug mt-0.5">{f.s}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-white/45 text-xs leading-relaxed">
          <span className="text-white/70 font-semibold">Gijima Innovation Engine · 2026</span><br />
          Built to help close South Africa's youth unemployment gap — nearly 60% for ages 15–24.
        </div>
      </aside>

      {/* Flow panel */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-5 sm:px-8 h-16 shrink-0">
          <div className="flex items-center gap-2 font-bold text-navy lg:invisible"><span className="w-2.5 h-2.5 rounded-full bg-red" />Vuka Uzenzele</div>
          <button onClick={toggle} aria-label="Toggle theme" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong text-navy hover:bg-surface transition active:scale-95">
            <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-area flex">
          <div className="ob-rise m-auto w-full max-w-[420px] px-6 sm:px-10 py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Role choose ---------------- */
function RoleChoose({ onPick, onLogin, onBack }: { onPick: (r: Role) => void; onLogin: () => void; onBack: () => void }) {
  return (
    <div>
      <BackRow onBack={onBack} />
      <h2 className="text-[26px] font-extrabold text-navy mb-1.5 leading-tight tracking-tight">Create your account<span className="text-red">.</span></h2>
      <p className="text-[13.5px] text-muted mb-6">How will you use Vuka?</p>
      <div className="grid gap-3.5">
        <RoleOption emoji="🙋" bg="#eaf3fb" title="I want to work" sub="Find gigs & formal jobs near you, and build a verified CV." onClick={() => onPick('worker')} />
        <RoleOption emoji="💼" bg="#faf5ff" title="I need help" sub="Post a job and hire trusted, ID-verified youth nearby." onClick={() => onPick('employer')} />
      </div>
      <div className="text-center mt-6"><button onClick={onLogin} className="text-[13px] text-muted font-semibold hover:text-navy">Already have an account? <b className="text-red">Log in</b></button></div>
    </div>
  );
}
function RoleOption({ emoji, bg, title, sub, onClick }: { emoji: string; bg: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left border border-line-strong rounded-[20px] p-4 bg-surface flex gap-4 items-center hover:border-red hover:shadow-e2 transition active:scale-[.985]">
      <span className="grid place-items-center w-[54px] h-[54px] rounded-2xl text-[28px] shrink-0 dark:bg-surface-2" style={{ background: bg }} aria-hidden="true">{emoji}</span>
      <span className="flex-1"><span className="block text-base font-bold text-navy">{title}</span><span className="block text-[12.5px] text-muted mt-0.5 leading-snug">{sub}</span></span>
      <span className="text-subtle"><Icon name="chev" size={18} /></span>
    </button>
  );
}

/* ---------------- Login ---------------- */
// text-base (16px), not text-sm: iOS Safari zooms the viewport on focus for
// anything smaller, which shunts the layout sideways mid-sign-up.
const inputCls = 'w-full border-[1.5px] border-line-strong rounded-pill px-4 py-3 text-base bg-surface text-navy focus:outline-none focus:border-navy transition';
function LoginView({ busy, onBack, onLogin, onDemo, onForgot }: { busy: boolean; onBack: () => void; onLogin: (phone: string, password: string) => void; onDemo: (r: Role) => void; onForgot: () => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <BackRow onBack={onBack} />
      <h2 className="text-[26px] font-extrabold text-navy mb-1.5 leading-tight tracking-tight">Welcome back<span className="text-red">.</span></h2>
      <p className="text-[13.5px] text-muted mb-6">Sign in to pick up where you left off.</p>
      <div className="mb-3.5"><Label>Mobile number</Label><input className={inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Mobile number" /></div>
      <div className="mb-2"><Label>Password</Label><input className={inputCls} type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" onKeyDown={(e) => { if (e.key === 'Enter') onLogin(phone, password); }} /></div>
      <div className="text-right mb-5"><button type="button" onClick={onForgot} className="text-[12.5px] font-bold text-navy hover:text-red transition">Forgot password?</button></div>
      <Button block disabled={busy} onClick={() => onLogin(phone, password)}>{busy ? 'Signing in…' : 'Log in'}</Button>

      <div className="flex items-center gap-3 my-6"><span className="flex-1 h-px bg-line" /><span className="text-[11px] text-subtle font-semibold uppercase tracking-wide">Or explore instantly</span><span className="flex-1 h-px bg-line" /></div>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="ghost" disabled={busy} onClick={() => onDemo('worker')}>🙋 Demo worker</Button>
        <Button variant="ghost" disabled={busy} onClick={() => onDemo('employer')}>💼 Demo employer</Button>
      </div>
    </div>
  );
}

/* ---------------- Forgot password ----------------
   Request a code by SMS, then set a new password. The server answers the
   request step identically for unknown numbers, so this screen must not imply
   the number was found. */
function ResetView({ onBack }: { onBack: () => void }) {
  const { toast, login } = useApp();
  const [phase, setPhase] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    if (phone.replace(/\D/g, '').length < 9) return toast('Enter a valid mobile number 📱');
    setBusy(true);
    try {
      const res = await api.requestPasswordReset(phone);
      setDevCode(res.devCode ?? null);
      toast(res.devCode ? `Test mode — your code is ${res.devCode}` : res.message);
      setPhase('code');
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.replace(/\D/g, '').length < 6) return toast('Enter the 6-digit code from your SMS 🔢');
    if (password.length < 8) return toast('Choose a password of at least 8 characters 🔒');
    setBusy(true);
    try {
      // Confirming signs the account straight in, so there's no second login step.
      await api.confirmPasswordReset(phone, code, password).then(async () => { await login(phone, password); });
      toast('Password changed 🔒 Welcome back!');
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div>
      <BackRow onBack={onBack} />
      <h2 className="text-[26px] font-extrabold text-navy mb-1.5 leading-tight tracking-tight">Reset your password<span className="text-red">.</span></h2>
      {phase === 'phone' ? (
        <>
          <p className="text-[13.5px] text-muted mb-6">Enter the mobile number on your account and we'll SMS you a code.</p>
          <div className="mb-5"><Label>Mobile number</Label>
            <input className={inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Mobile number" onKeyDown={(e) => { if (e.key === 'Enter') request(); }} />
          </div>
          <Button block disabled={busy} onClick={request}>{busy ? 'Sending…' : 'Send reset code'}</Button>
        </>
      ) : (
        <>
          <p className="text-[13.5px] text-muted mb-6">If <b className="text-navy">{phone}</b> has a Vuka account, a 6-digit code is on its way. Enter it with your new password.</p>
          <div className="mb-3.5"><Label>Reset code</Label>
            <input className={inputCls} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Reset code" />
          </div>
          <div className="mb-2"><Label>New password</Label>
            <input className={inputCls} type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="New password" onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }} />
          </div>
          {devCode && <p className="text-[12px] text-muted mb-3">Test mode — your code is <b className="text-navy tnum tracking-widest">{devCode}</b></p>}
          <Trust>Changing your password signs out anyone else who was using your account.</Trust>
          <Button block className="mt-6" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Set new password & sign in'}</Button>
          <button type="button" onClick={() => setPhase('phone')} className="w-full text-center text-[12.5px] text-muted font-semibold mt-3 hover:text-navy">Use a different number</button>
        </>
      )}
    </div>
  );
}

/* ---------------- Registration step ---------------- */
function RegStep({ stepKey, steps, step, data, setData, onBack, onNext, onVerified }: {
  stepKey: string; steps: string[]; step: number; data: OBData;
  setData: React.Dispatch<React.SetStateAction<OBData>>;
  onBack: () => void; onNext: () => void; onVerified: (verifyToken: string) => void;
}) {
  const total = steps.length - 1;
  const progress = (
    <div className="flex gap-1.5 mb-6">{steps.slice(0, total).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-red' : 'bg-line-strong'}`} />)}</div>
  );

  // The phone and code steps own their own button: each has to wait on the
  // server, and "Continue" must not move on until it has.
  if (stepKey === 'phone') {
    return <div><BackRow onBack={onBack} />{progress}<PhoneStep data={data} setData={setData} onSent={onNext} /></div>;
  }
  if (stepKey === 'otp') {
    return <div><BackRow onBack={onBack} />{progress}<OtpStep data={data} setData={setData} onVerified={onVerified} /></div>;
  }

  return (
    <div>
      <BackRow onBack={onBack} />
      {progress}
      {stepKey === 'about' && <AboutStep data={data} setData={setData} />}
      {stepKey === 'skills' && <SkillsStep data={data} setData={setData} />}
      {stepKey === 'password' && <PasswordStep data={data} setData={setData} />}
      {stepKey === 'id' && <IdStep />}
      {stepKey === 'org' && <OrgStep data={data} setData={setData} />}
      <Button block className="mt-7" onClick={onNext}>{stepKey === 'id' ? 'Continue' : 'Continue'}</Button>
    </div>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return <button onClick={onBack} aria-label="Back" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy mb-5 hover:bg-surface-2 transition active:scale-95"><Icon name="back" size={20} /></button>;
}
function Head({ h, sub }: { h: string; sub: string }) {
  return (<><h2 className="text-[24px] font-extrabold text-navy mb-1.5 leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: h }} /><p className="text-[13.5px] text-muted mb-6 leading-relaxed">{sub}</p></>);
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5">{children}</label>;
}
const Trust = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 items-start bg-[#eaf3fb] dark:bg-info/10 rounded-[13px] px-3.5 py-3 mt-4"><span className="text-info shrink-0"><Icon name="shield" size={16} /></span><span className="text-[12px] text-navy leading-snug">{children}</span></div>
);

function PhoneStep({ data, setData, onSent }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>>; onSent: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (data.phone.replace(/\D/g, '').length < 9) return toast('Enter a valid mobile number 📱');
    setBusy(true);
    try {
      const res = await api.requestOtp(data.phone);
      setData((d) => ({ ...d, otp: '' }));
      // In a pilot without an SMS contract the server may hand the code back so
      // sign-up still works; say so plainly rather than pretending it was sent.
      lastDevCode.value = res.devCode ?? null;
      toast(res.sent ? 'Code sent 📱 Check your SMS.' : res.devCode ? `Test mode — your code is ${res.devCode}` : 'Code created — check your SMS.');
      onSent();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (<><Head h="What's your number<span class='text-red'>?</span>" sub="We'll send an SMS code to confirm it's you. Your number is never shown to others." />
    <div><Label>Mobile number</Label><input className={inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} aria-label="Mobile number" onKeyDown={(e) => { if (e.key === 'Enter') send(); }} /></div>
    <Trust>Your number is how employers reach you about work — and how you get back in if you forget your password.</Trust>
    <Button block className="mt-7" disabled={busy} onClick={send}>{busy ? 'Sending code…' : 'Send me the code'}</Button></>);
}

/** Test-mode code from the last send, so the OTP screen can show it. */
const lastDevCode: { value: string | null } = { value: null };

function OtpStep({ data, setData, onVerified }: {
  data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>>; onVerified: (token: string) => void;
}) {
  const { toast } = useApp();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(lastDevCode.value);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const submit = async (code: string) => {
    if (code.replace(/\D/g, '').length < 4) return toast('Enter the 4-digit code 🔢');
    setBusy(true);
    try {
      const res = await api.verifyOtp(data.phone, code);
      onVerified(res.verifyToken);
    } catch (e) {
      toast((e as Error).message);
      setData((d) => ({ ...d, otp: '' }));
      refs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = [0, 1, 2, 3].map((j) => data.otp[j] ?? '');
    arr[i] = d;
    const next = arr.join('');
    setData({ ...data, otp: next });
    if (d && i < 3) refs.current[i + 1]?.focus();
    if (next.length === 4 && !next.includes('')) void submit(next);
  };

  const resend = async () => {
    setBusy(true);
    try {
      const res = await api.requestOtp(data.phone);
      setDevCode(res.devCode ?? null);
      lastDevCode.value = res.devCode ?? null;
      toast(res.sent ? 'New code sent 📱' : res.devCode ? `Test mode — your code is ${res.devCode}` : 'New code created.');
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (<><Head h="Enter your code<span class='text-red'>.</span>" sub={`We sent a 4-digit code to ${data.phone || 'your phone'}.`} />
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (<input key={i} ref={(el) => { refs.current[i] = el; }} maxLength={1} inputMode="numeric" aria-label={`Digit ${i + 1}`} placeholder="•"
        value={data.otp[i] ?? ''}
        disabled={busy}
        className="w-16 h-18 py-4 text-center text-[26px] font-bold text-navy border-[1.5px] border-line-strong rounded-2xl bg-surface focus:outline-none focus:border-navy disabled:opacity-60"
        onChange={(e) => setDigit(i, e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Backspace' && !(data.otp[i] ?? '') && i > 0) refs.current[i - 1]?.focus(); }} />))}
    </div>
    {devCode && <p className="text-center text-[12px] text-muted mt-3">Test mode — your code is <b className="text-navy tnum tracking-widest">{devCode}</b></p>}
    <p className="text-center text-[12.5px] text-muted mt-4">
      Didn't get it? <button type="button" disabled={busy} onClick={resend} className="text-navy font-bold underline underline-offset-2 hover:text-red transition disabled:opacity-50">Resend</button>
    </p>
    <Button block className="mt-7" disabled={busy} onClick={() => submit(data.otp)}>{busy ? 'Checking…' : 'Confirm my number'}</Button></>);
}
function AboutStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Tell us about you<span class='text-red'>.</span>" sub="This starts your profile. Keep it simple and honest." />
    <div className="mb-3.5"><Label>Full name</Label><input className={inputCls} placeholder="e.g. Thandeka Mokoena" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} aria-label="Full name" /></div>
    <div className="flex gap-2.5">
      <div className="flex-1"><Label>Age</Label><input className={inputCls} type="number" min={16} max={35} placeholder="21" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} aria-label="Age" /></div>
      <div className="flex-[2]"><Label>Where you live</Label><input className={inputCls} placeholder="Suburb, City" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} aria-label="Location" /></div>
    </div></>);
}
function SkillsStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  const toggleSkill = (id: CategoryId) => setData((d) => ({ ...d, skills: d.skills.includes(id) ? d.skills.filter((s) => s !== id) : [...d.skills, id] }));
  return (<><Head h="What are you good at<span class='text-red'>?</span>" sub="Pick everything you can do — no experience or papers needed. Choose at least one." />
    <div className="grid grid-cols-2 gap-2.5">
      {CATEGORIES.map((c) => { const sel = data.skills.includes(c.id); return (
        <button key={c.id} onClick={() => toggleSkill(c.id)} aria-pressed={sel} className={`relative flex gap-2.5 items-center border-[1.5px] rounded-2xl px-3 py-3.5 bg-surface transition ${sel ? 'border-red bg-[#fdecef] dark:bg-red/10' : 'border-line-strong hover:border-navy'}`}>
          <span className="text-[22px]" aria-hidden="true">{c.icon}</span><b className="text-[13.5px] text-navy">{c.label}</b>
          {sel && <span className="absolute top-2 right-2.5 text-red font-extrabold text-[13px]">✓</span>}
        </button>); })}
    </div></>);
}
function PasswordStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Create a password<span class='text-red'>.</span>" sub="You'll use your mobile number and this password to sign in next time." />
    <div><Label>Password</Label><input className={inputCls} type="password" placeholder="At least 8 characters" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} aria-label="Password" /></div>
    <Trust>Your password is stored securely (hashed) — never in plain text.</Trust></>);
}
/**
 * Verification is explained here but done from the profile, after sign-up — it
 * needs a signed-in account and a real review, so there is nothing to "scan"
 * and nothing to tick on this screen.
 */
function IdStep() {
  return (<><Head h="Verify your identity<span class='text-red'>.</span>" sub="Optional — but verified workers get the ✅ badge, more employer trust, and access to formal roles that require it." />
    <div className="border-[1.5px] border-dashed border-line-strong bg-surface-2 rounded-[20px] p-6 text-center">
      <div className="w-[72px] h-[72px] mx-auto mb-2.5 rounded-[20px] grid place-items-center text-4xl bg-[#eaf3fb] dark:bg-surface" aria-hidden="true">🪪</div>
      <h4 className="m-0 mb-1 text-base text-navy font-bold">Do this from your profile</h4>
      <p className="m-0 text-[12.5px] text-muted leading-relaxed">Finish signing up, then open <b className="text-navy">Profile → Identity</b> and enter your SA ID number. We check it and add your badge — usually within a day.</p>
    </div>
    <ul className="mt-4 space-y-2 text-[12.5px] text-navy">
      <li className="flex gap-2 items-start"><span>🔒</span> Your ID number is encrypted and never shown to employers</li>
      <li className="flex gap-2 items-start"><span>⚡</span> Takes under a minute, once</li>
      <li className="flex gap-2 items-start"><span>🪜</span> Unlocks formal roles that require verification</li>
    </ul>
    <Trust>You can start applying for gigs straight away — verification is not needed first.</Trust></>);
}
function OrgStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Your details<span class='text-red'>.</span>" sub="So workers know who they're dealing with." />
    <div className="mb-3.5"><Label>Your name or business</Label><input className={inputCls} placeholder="e.g. Sipho Dlamini / Zanele Beauty Bar" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} aria-label="Name or business" /></div>
    <div><Label>Where are you</Label><input className={inputCls} placeholder="Suburb, City" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} aria-label="Location" /></div></>);
}

/* ---------------- Success ---------------- */
function Success({ role, name, busy, onEnter, onBack }: { role: Role; name: string; busy: boolean; onEnter: () => void; onBack: () => void }) {
  const worker = role === 'worker';
  return (
    <div className="text-center">
      <BackRow onBack={onBack} />
      <div className="w-[110px] h-[110px] mx-auto rounded-[30px] grid place-items-center text-[54px] text-white" style={{ background: 'linear-gradient(135deg,var(--gj-navy),#123e69)' }} aria-hidden="true">{worker ? '🎉' : '💼'}</div>
      <h2 className="text-[24px] font-extrabold text-navy mt-5 mb-2 tracking-tight">Almost there{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
      <p className="text-[13.5px] text-muted leading-relaxed">{worker ? "Create your account and you're a Starter 🌱 with a blank CV — now let your work write it for you." : 'Create your account, then post your first job and reach verified youth nearby.'}</p>
      {worker && (
        <div className="text-left bg-navy text-white rounded-[18px] p-4 mt-5">
          <b className="text-[13px]">Your first 3 steps</b>
          <div className="text-[13px] text-white/90 mt-2.5">1️⃣ Apply to a gig near you (it's free)</div>
          <div className="text-[13px] text-white/90 mt-2">2️⃣ Do a great job & get reviewed</div>
          <div className="text-[13px] text-white/90 mt-2">3️⃣ Watch your CV grow and unlock formal jobs 🪜</div>
        </div>
      )}
      <Button block className="mt-7" disabled={busy} onClick={onEnter}>{busy ? 'Creating your account…' : worker ? 'Create account & start' : 'Create account'}</Button>
      <Consent />
    </div>
  );
}

/** Consent, in the one place where it actually means something. */
function Consent() {
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null);
  return (
    <>
      <p className="text-[11.5px] text-muted leading-relaxed mt-3">
        By creating an account you agree to our{' '}
        <button onClick={() => setLegal('terms')} className="font-bold text-navy underline underline-offset-2">Terms of use</button>
        {' '}and to us handling your information as set out in the{' '}
        <button onClick={() => setLegal('privacy')} className="font-bold text-navy underline underline-offset-2">Privacy notice</button>.
        You must be 18 or older.
      </p>
      {legal === 'privacy' && <PrivacySheet onClose={() => setLegal(null)} />}
      {legal === 'terms' && <TermsSheet onClose={() => setLegal(null)} />}
    </>
  );
}
