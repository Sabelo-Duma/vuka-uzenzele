import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CATEGORIES } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { api } from '../../lib/api';
import { useTheme } from '../../providers/ThemeProvider';
import { ApiError } from '../../lib/api';
import type { CategoryId, Role } from '../../types';
import { Button, InlineError } from '../../components/ui';
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
  /** Last sign-in failure, kept on the form until the user changes something. */
  const [loginError, setLoginError] = useState<{ message: string; reason?: string } | null>(null);
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
        /* Sent as typed. This used to fall back to 18 when the field was
           blank or unparseable, which meant the app asserted an age on
           somebody's behalf — and would have walked straight through the
           server's new minimum-age check while doing it. */
        age: Number(data.age),
        location: data.location, skills: data.skills,
      });
    } catch (e) { toast((e as Error).message); setBusy(false); }
  };

  return (
    <AuthLayout>
      {view === 'role' && <RoleChoose onBack={() => setView('landing')} onPick={(r) => { setRole(r); setStep(0); setView('reg'); }} onLogin={() => setView('login')} />}
      {view === 'login' && <LoginView
        busy={busy}
        error={loginError}
        onBack={() => { setLoginError(null); setView('landing'); }}
        onForgot={() => { setLoginError(null); setView('reset'); }}
        onSignUp={() => { setLoginError(null); setView('role'); }}
        onClearError={() => setLoginError(null)}
        onLogin={async (phone, password) => {
          if (!phone.trim() || !password) {
            setLoginError({ message: 'Enter your mobile number and password to sign in.' });
            return;
          }
          setBusy(true);
          setLoginError(null);
          try {
            await login(phone, password);
          } catch (e) {
            const err = e as ApiError;
            setLoginError({ message: err.message, reason: err.reason });
            setBusy(false);
          }
        }}
        onDemo={async (r) => { setBusy(true); setLoginError(null); try { await demoLogin(r); } catch (e) { setLoginError({ message: (e as Error).message }); setBusy(false); } }} />}
      {view === 'reset' && <ResetView onBack={() => setView('login')} />}
      {view === 'reg' && key !== 'done' && (
        <RegStep
          stepKey={key} steps={steps} step={step} role={role} data={data} setData={setData}
          onBack={back}
          onNext={next}
          // The phone and OTP steps advance themselves once the server agrees.
          onVerified={(verifyToken) => { setData((d) => ({ ...d, verifyToken })); setStep((s) => s + 1); }}
          onSignIn={() => setView('login')}
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
      <aside className="feature-band hidden lg:flex flex-col justify-between w-[44%] max-w-[600px] p-12 relative overflow-hidden">
        <div aria-hidden="true" className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,176,31,.20), transparent 70%)' }} />
        <div aria-hidden="true" className="absolute -left-16 bottom-10 w-[280px] h-[280px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.06), transparent 70%)' }} />

        <div className="relative flex items-center gap-2.5 font-bold text-lead"><span className="w-3 h-3 rounded-full bg-brand-solid" />Vuka Uzenzele</div>

        <div className="relative max-w-md">
          <span className="ob-rise inline-flex items-center gap-2 rounded-pill bg-white/10 border border-white/15 px-3 py-1.5 text-small font-bold text-on-feature-dim mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-solid floaty" />Youth work, reimagined for South Africa
          </span>
          <h1 className="font-display ob-rise text-hero font-extrabold leading-[1.05] tracking-[-0.02em]">Start with no CV.<br />Let your work write it<span className="text-brand">.</span></h1>
          <p className="ob-rise-2 text-on-feature-dim mt-5 text-body leading-relaxed">Vuka Uzenzele connects South Africa's youth to real work — and turns every completed job into a verified track record that opens the door to formal employment.</p>
          <ul className="ob-rise-3 mt-9 space-y-4">
            {[
              { icon: '🪜', t: 'The Ladder', s: 'A strong profile unlocks cashier, security & call-centre roles.' },
              { icon: '🧾', t: 'A CV that builds itself', s: 'Real, verified references from every job you complete.' },
              { icon: '🛡️', t: 'Safe & fair by design', s: 'ID verification, two-way reviews, minimum-wage checks.' },
            ].map((f) => (
              <li key={f.t} className="flex gap-3.5 items-start">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/10 text-title shrink-0" aria-hidden="true">{f.icon}</span>
                <span><span className="block font-bold text-body">{f.t}</span><span className="block text-on-feature-dim text-small leading-snug mt-0.5">{f.s}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-on-feature-dim text-micro leading-relaxed">
          <span className="text-on-feature-dim font-semibold">Vuka Uzenzele · 2026</span><br />
          Built to help close South Africa's youth unemployment gap — nearly 60% for ages 15–24.
        </div>
      </aside>

      {/* Flow panel */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-5 sm:px-8 h-16 shrink-0">
          <div className="flex items-center gap-2 font-bold text-ink lg:invisible"><span className="w-2.5 h-2.5 rounded-full bg-brand-solid" />Vuka Uzenzele</div>
          <button onClick={toggle} aria-label="Toggle theme" className="grid place-items-center w-11 h-11 shrink-0 rounded-chip border border-line text-ink hover:bg-surface transition active:scale-95">
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
      <h2 className="font-display text-display font-extrabold text-ink mb-1.5 leading-tight tracking-tight">Create your account<span className="text-brand">.</span></h2>
      <p className="text-small text-dim mb-6">How will you use Vuka?</p>
      <div className="grid gap-3.5">
        <RoleOption emoji="🙋" bg="var(--v-info-soft)" title="I want to work" sub="Find gigs & formal jobs near you, and build a verified CV." onClick={() => onPick('worker')} />
        <RoleOption emoji="💼" bg="var(--v-brand-soft)" title="I need help" sub="Post a job and hire trusted, ID-verified youth nearby." onClick={() => onPick('employer')} />
      </div>
      <div className="text-center mt-6"><button onClick={onLogin} className="text-small text-dim font-semibold hover:text-ink">Already have an account? <b className="text-brand">Log in</b></button></div>
    </div>
  );
}
function RoleOption({ emoji, bg, title, sub, onClick }: { emoji: string; bg: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left border border-line rounded-[20px] p-4 bg-surface flex gap-4 items-center hover:border-brand hover:shadow-e2 transition active:scale-[.985]">
      <span className="grid place-items-center w-[54px] h-[54px] rounded-2xl text-display shrink-0 dark:bg-surface-2" style={{ background: bg }} aria-hidden="true">{emoji}</span>
      <span className="flex-1"><span className="block text-lead font-bold text-ink">{title}</span><span className="block text-small text-dim mt-0.5 leading-snug">{sub}</span></span>
      <span className="text-faint"><Icon name="chev" size={18} /></span>
    </button>
  );
}

/* ---------------- Login ---------------- */
// text-base (16px), not text-small: iOS Safari zooms the viewport on focus for
// anything smaller, which shunts the layout sideways mid-sign-up.
const inputCls = 'w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-line transition';
/** Same field, outlined red while it is the thing holding up the flow. */
const inputErrCls = 'w-full border-[1.5px] border-danger rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-danger transition';
function LoginView({ busy, error, onBack, onLogin, onDemo, onForgot, onSignUp, onClearError }: {
  busy: boolean;
  /** Persistent failure from the last attempt. A toast is wrong for this: it
   *  sits at the bottom of the screen behind the open keyboard, and is gone in
   *  two seconds — so a failed sign-in looked like the button doing nothing. */
  error: { message: string; reason?: string } | null;
  onBack: () => void; onLogin: (identifier: string, password: string) => void;
  onDemo: (r: Role) => void; onForgot: () => void; onSignUp: () => void; onClearError: () => void;
}) {
  // One field for both credentials. Asking someone to first classify their own
  // credential is a question the software can answer from the '@'.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  // Editing either field means the message is about a previous attempt.
  const edit = (set: (v: string) => void) => (v: string) => { onClearError(); set(v); };
  return (
    <div>
      <BackRow onBack={onBack} />
      <h2 className="font-display text-display font-extrabold text-ink mb-1.5 leading-tight tracking-tight">Welcome back<span className="text-brand">.</span></h2>
      <p className="text-small text-dim mb-6">Sign in to pick up where you left off.</p>
      <div className="mb-3.5">
        <Label htmlFor="signin-identifier">Mobile number or email</Label>
        {/* The field takes either, so the example shows both — a lone phone
            number reads as an instruction. Kept short enough to survive a
            320px screen without the browser truncating it. */}
        <input
          id="signin-identifier"
          className={error ? inputErrCls : inputCls}
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="072 000 0000 / you@mail.com"
          value={identifier}
          onChange={(e) => edit(setIdentifier)(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'signin-error' : undefined}
        />
      </div>
      <div className="mb-2">
        <Label htmlFor="signin-password">Password</Label>
        <input
          id="signin-password"
          className={error ? inputErrCls : inputCls}
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => edit(setPassword)(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'signin-error' : undefined}
          onKeyDown={(e) => { if (e.key === 'Enter') onLogin(identifier, password); }}
        />
      </div>
      <div className="flex justify-end mb-4"><button type="button" onClick={onForgot} className="inline-flex items-center min-h-[44px] px-2 -mr-2 rounded-chip text-small font-bold text-ink hover:bg-surface-2 hover:text-brand transition">Forgot password?</button></div>

      {error && (
        <div role="alert" id="signin-error" className="mb-4 rounded-2xl border border-danger bg-danger-soft px-4 py-3">
          <p className="text-small font-semibold text-danger leading-snug m-0">{error.message}</p>
          {error.reason === 'no_account' && (
            <button type="button" onClick={onSignUp} className="mt-2 text-small font-extrabold text-ink underline underline-offset-2">
              Create an account →
            </button>
          )}
          {error.reason === 'wrong_password' && (
            <button type="button" onClick={onForgot} className="mt-2 text-small font-extrabold text-ink underline underline-offset-2">
              Reset my password →
            </button>
          )}
        </div>
      )}

      <Button block disabled={busy} onClick={() => onLogin(identifier, password)}>{busy ? 'Signing in…' : 'Log in'}</Button>

      <div className="flex items-center gap-3 my-6"><span className="flex-1 h-px bg-line" /><span className="text-micro text-faint font-semibold uppercase tracking-wide">Or explore instantly</span><span className="flex-1 h-px bg-line" /></div>
      <div className="grid grid-cols-2 gap-2.5">
        <Button size="sm" variant="ghost" className="whitespace-nowrap" disabled={busy} onClick={() => onDemo('worker')}>🙋 Demo worker</Button>
        <Button size="sm" variant="ghost" className="whitespace-nowrap" disabled={busy} onClick={() => onDemo('employer')}>💼 Demo employer</Button>
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
  const [error, setError] = useState<string | null>(null);

  const request = async () => {
    if (phone.replace(/\D/g, '').length < 9) {
      setError("That doesn't look like a full mobile number. Enter all 10 digits, e.g. 072 000 0000.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.requestPasswordReset(phone);
      setDevCode(res.devCode ?? null);
      toast(res.devCode ? `Test mode — your code is ${res.devCode}` : res.message);
      setPhase('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.replace(/\D/g, '').length < 6) {
      setError('Enter all six digits of the code from your SMS.');
      return;
    }
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Confirming signs the account straight in, so there's no second login step.
      await api.confirmPasswordReset(phone, code, password).then(async () => { await login(phone, password); });
      toast('Password changed 🔒 Welcome back!');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div>
      <BackRow onBack={onBack} />
      <h2 className="font-display text-display font-extrabold text-ink mb-1.5 leading-tight tracking-tight">Reset your password<span className="text-brand">.</span></h2>
      {phase === 'phone' ? (
        <>
          <p className="text-small text-dim mb-6">Enter the mobile number on your account and we'll SMS you a code.</p>
          <div className="mb-5"><Label>Mobile number</Label>
            <input className={error ? inputErrCls : inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={phone} aria-invalid={!!error} onChange={(e) => { setError(null); setPhone(e.target.value); }} aria-label="Mobile number" onKeyDown={(e) => { if (e.key === 'Enter') request(); }} />
          </div>
          {error && <InlineError>{error}</InlineError>}
          <Button block disabled={busy} onClick={request}>{busy ? 'Sending…' : 'Send reset code'}</Button>
        </>
      ) : (
        <>
          <p className="text-small text-dim mb-6">If <b className="text-ink">{phone}</b> has a Vuka account, a 6-digit code is on its way. Enter it with your new password.</p>
          <div className="mb-3.5"><Label>Reset code</Label>
            <input className={error ? inputErrCls : inputCls} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} aria-invalid={!!error} onChange={(e) => { setError(null); setCode(e.target.value.replace(/\D/g, '')); }} aria-label="Reset code" />
          </div>
          <div className="mb-2"><Label>New password</Label>
            <input className={inputCls} type="password" placeholder="At least 8 characters" value={password} onChange={(e) => { setError(null); setPassword(e.target.value); }} aria-label="New password" onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }} />
          </div>
          {error && <InlineError action={{ label: 'Start again', onClick: () => { setError(null); setCode(''); setPhase('phone'); } }}>{error}</InlineError>}
          {devCode && <p className="text-small text-dim mb-3">Test mode — your code is <b className="text-ink font-mono tnum tracking-widest">{devCode}</b></p>}
          <Trust>Changing your password signs out anyone else who was using your account.</Trust>
          <Button block className="mt-6" disabled={busy} onClick={confirm}>{busy ? 'Saving…' : 'Set new password & sign in'}</Button>
          <button type="button" onClick={() => setPhase('phone')} className="w-full text-center text-small text-dim font-semibold mt-3 hover:text-ink">Use a different number</button>
        </>
      )}
    </div>
  );
}

/* ---------------- Registration step ---------------- */
/** Vuka's minimum age, matching the terms and the server. */
export const MIN_AGE = 18;

/**
 * Why this step cannot continue yet, in words meant for the person on it.
 *
 * Age is the one that matters: a 17-year-old who gets all the way to the end
 * and is then refused has given us their name, their number and an SMS code
 * for nothing. Better to say it on the step where it is asked.
 */
function blockedReason(stepKey: string, data: OBData, role: Role): string | null {
  if (stepKey !== 'about') return null;
  if (!data.name.trim()) return 'Please enter your name.';
  if (role !== 'worker') return null;
  const age = Number(data.age);
  if (!data.age.trim() || !Number.isFinite(age)) return 'Please enter your age.';
  if (age < MIN_AGE) return `You need to be ${MIN_AGE} or older to work through Vuka.`;
  if (age > 99) return 'Please enter a valid age.';
  return null;
}

function RegStep({ stepKey, steps, step, role, data, setData, onBack, onNext, onVerified, onSignIn }: {
  role: Role;
  stepKey: string; steps: string[]; step: number; data: OBData;
  setData: React.Dispatch<React.SetStateAction<OBData>>;
  onBack: () => void; onNext: () => void; onVerified: (verifyToken: string) => void;
  /** Offered when the number turns out to already have an account. */
  onSignIn: () => void;
}) {
  const blocked = blockedReason(stepKey, data, role);
  const total = steps.length - 1;
  const progress = (
    <div className="flex gap-1.5 mb-6">{steps.slice(0, total).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-solid' : 'bg-line'}`} />)}</div>
  );

  // The phone and code steps own their own button: each has to wait on the
  // server, and "Continue" must not move on until it has.
  if (stepKey === 'phone') {
    return <div><BackRow onBack={onBack} />{progress}<PhoneStep data={data} setData={setData} onSent={onNext} onSignIn={onSignIn} /></div>;
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
      {blocked && <p className="text-small font-semibold text-danger leading-snug mt-4 mb-0" role="alert">{blocked}</p>}
      <Button block className="mt-7" disabled={!!blocked} onClick={onNext}>Continue</Button>
    </div>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return <button onClick={onBack} aria-label="Back" className="grid place-items-center w-11 h-11 shrink-0 rounded-chip border border-line bg-surface text-ink mb-5 hover:bg-surface-2 transition active:scale-95"><Icon name="back" size={20} /></button>;
}
function Head({ h, sub }: { h: string; sub: string }) {
  return (<><h2 className="font-display text-head font-extrabold text-ink mb-1.5 leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: h }} /><p className="text-small text-dim mb-6 leading-relaxed">{sub}</p></>);
}
function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="block text-micro font-bold text-dim uppercase tracking-wide mb-1.5">{children}</label>;
}
const Trust = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 items-start bg-info-soft rounded-[13px] px-3.5 py-3 mt-4"><span className="text-info shrink-0"><Icon name="shield" size={16} /></span><span className="text-small text-ink leading-snug">{children}</span></div>
);

function PhoneStep({ data, setData, onSent, onSignIn }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>>; onSent: () => void; onSignIn: () => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; reason?: string } | null>(null);

  const send = async () => {
    if (data.phone.replace(/\D/g, '').length < 9) {
      setError({ message: "That doesn't look like a full mobile number. Enter all 10 digits, e.g. 072 000 0000." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.requestOtp(data.phone);
      setData((d) => ({ ...d, otp: '' }));
      // In a pilot without an SMS contract the server may hand the code back so
      // sign-up still works; say so plainly rather than pretending it was sent.
      lastDevCode.value = res.devCode ?? null;
      toast(res.sent ? 'Code sent 📱 Check your SMS.' : `Test mode — your code is ${res.devCode}`);
      onSent();
    } catch (e) {
      const err = e as ApiError;
      setError({ message: err.message, reason: err.reason });
    } finally {
      setBusy(false);
    }
  };

  return (<><Head h="What's your number<span class='text-brand'>?</span>" sub="We'll send an SMS code to confirm it's you. Your number is never shown to others." />
    <div><Label>Mobile number</Label><input className={error ? inputErrCls : inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={data.phone} aria-invalid={!!error} onChange={(e) => { setError(null); setData({ ...data, phone: e.target.value }); }} aria-label="Mobile number" onKeyDown={(e) => { if (e.key === 'Enter') send(); }} /></div>
    {error && (
      <InlineError action={error.reason === 'already_registered' ? { label: 'Sign in instead', onClick: onSignIn } : undefined}>
        {error.message}
      </InlineError>
    )}
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
  /* The code auto-submits on the fourth digit and the boxes clear on failure,
     so a toast was the only trace that anything had happened — and it was gone
     in two seconds. The reason stays put now. */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const submit = async (code: string) => {
    if (code.replace(/\D/g, '').length < 4) {
      setError('Enter all four digits of the code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.verifyOtp(data.phone, code);
      onVerified(res.verifyToken);
    } catch (e) {
      setError((e as Error).message);
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
    setError(null);
    try {
      const res = await api.requestOtp(data.phone);
      setDevCode(res.devCode ?? null);
      lastDevCode.value = res.devCode ?? null;
      setData((d) => ({ ...d, otp: '' }));
      refs.current[0]?.focus();
      toast(res.sent ? 'New code sent 📱' : `Test mode — your code is ${res.devCode}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (<><Head h="Enter your code<span class='text-brand'>.</span>" sub={`We sent a 4-digit code to ${data.phone || 'your phone'}.`} />
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (<input key={i} ref={(el) => { refs.current[i] = el; }} maxLength={1} inputMode="numeric" aria-label={`Digit ${i + 1}`} placeholder="•"
        value={data.otp[i] ?? ''}
        disabled={busy}
        aria-invalid={!!error}
        className={`w-16 h-18 py-4 text-center text-display font-bold text-ink border-[1.5px] rounded-2xl bg-surface focus:outline-none disabled:opacity-60 transition-colors ${
          error ? 'border-danger focus:border-danger' : 'border-line focus:border-ink'
        }`}
        onChange={(e) => setDigit(i, e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Backspace' && !(data.otp[i] ?? '') && i > 0) refs.current[i - 1]?.focus(); }} />))}
    </div>
    {error && <InlineError action={{ label: 'Send a new code', onClick: resend }}>{error}</InlineError>}
    {devCode && <p className="text-center text-small text-dim mt-3">Test mode — your code is <b className="text-ink font-mono tnum tracking-widest">{devCode}</b></p>}
    <p className="text-center text-small text-dim mt-4">
      Didn't get it? <button type="button" disabled={busy} onClick={resend} className="text-ink font-bold underline underline-offset-2 hover:text-brand transition disabled:opacity-50">Resend</button>
    </p>
    <Button block className="mt-7" disabled={busy} onClick={() => submit(data.otp)}>{busy ? 'Checking…' : 'Confirm my number'}</Button></>);
}
function AboutStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Tell us about you<span class='text-brand'>.</span>" sub="This starts your profile. Keep it simple and honest." />
    <div className="mb-3.5"><Label>Full name</Label><input className={inputCls} placeholder="e.g. Thandeka Mokoena" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} aria-label="Full name" /></div>
    <div className="flex gap-2.5">
      {/* min was 16. The terms have always said 18 and over, and POPIA s34
          makes a child's personal information unlawful to process here at all,
          so the field was inviting exactly the sign-ups the product must
          refuse — and the refusal only came later, if at all. */}
      <div className="flex-1"><Label>Age</Label><input className={inputCls} type="number" min={MIN_AGE} max={99} placeholder="21" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} aria-label="Age" inputMode="numeric" /></div>
      <div className="flex-[2]"><Label>Where you live</Label><input className={inputCls} placeholder="Suburb, City" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} aria-label="Location" /></div>
    </div></>);
}
function SkillsStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  const toggleSkill = (id: CategoryId) => setData((d) => ({ ...d, skills: d.skills.includes(id) ? d.skills.filter((s) => s !== id) : [...d.skills, id] }));
  return (<><Head h="What are you good at<span class='text-brand'>?</span>" sub="Pick everything you can do — no experience or papers needed. Choose at least one." />
    <div className="grid grid-cols-2 gap-2.5">
      {CATEGORIES.map((c) => { const sel = data.skills.includes(c.id); return (
        <button key={c.id} onClick={() => toggleSkill(c.id)} aria-pressed={sel} className={`relative flex gap-2.5 items-center border-[1.5px] rounded-2xl px-3 py-3.5 bg-surface transition ${sel ? 'border-brand-solid bg-brand-soft' : 'border-line hover:border-faint'}`}>
          <span className="text-head" aria-hidden="true">{c.icon}</span><b className="text-small text-ink">{c.label}</b>
          {sel && <span className="absolute top-2 right-2.5 text-brand font-extrabold text-small">✓</span>}
        </button>); })}
    </div></>);
}
function PasswordStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Create a password<span class='text-brand'>.</span>" sub="You'll use your mobile number and this password to sign in next time." />
    <div><Label>Password</Label><input className={inputCls} type="password" placeholder="At least 8 characters" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} aria-label="Password" /></div>
    <Trust>Your password is stored securely (hashed) — never in plain text.</Trust></>);
}
/**
 * Verification is explained here but done from the profile, after sign-up — it
 * needs a signed-in account and a real review, so there is nothing to "scan"
 * and nothing to tick on this screen.
 */
function IdStep() {
  return (<><Head h="Verify your identity<span class='text-brand'>.</span>" sub="Optional — but verified workers get the ✅ badge, more employer trust, and access to formal roles that require it." />
    <div className="border-[1.5px] border-dashed border-line bg-surface-2 rounded-[20px] p-6 text-center">
      <div className="w-[72px] h-[72px] mx-auto mb-2.5 rounded-[20px] grid place-items-center text-hero bg-info-soft dark:bg-surface" aria-hidden="true">🪪</div>
      <h4 className="font-display m-0 mb-1 text-lead text-ink font-bold">Do this from your profile</h4>
      <p className="m-0 text-small text-dim leading-relaxed">Finish signing up, then open <b className="text-ink">Profile → Identity</b> and enter your SA ID number. We check it and add your badge — usually within a day.</p>
    </div>
    <ul className="mt-4 space-y-2 text-small text-ink">
      <li className="flex gap-2 items-start"><span>🔒</span> Your ID number is encrypted and never shown to employers</li>
      <li className="flex gap-2 items-start"><span>⚡</span> Takes under a minute, once</li>
      <li className="flex gap-2 items-start"><span>🪜</span> Unlocks formal roles that require verification</li>
    </ul>
    <Trust>You can start applying for gigs straight away — verification is not needed first.</Trust></>);
}
function OrgStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Your details<span class='text-brand'>.</span>" sub="So workers know who they're dealing with." />
    <div className="mb-3.5"><Label>Your name or business</Label><input className={inputCls} placeholder="e.g. Sipho Dlamini / Zanele Beauty Bar" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} aria-label="Name or business" /></div>
    <div><Label>Where are you</Label><input className={inputCls} placeholder="Suburb, City" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} aria-label="Location" /></div></>);
}

/* ---------------- Success ---------------- */
function Success({ role, name, busy, onEnter, onBack }: { role: Role; name: string; busy: boolean; onEnter: () => void; onBack: () => void }) {
  const worker = role === 'worker';
  return (
    <div className="text-center">
      <BackRow onBack={onBack} />
      <div className="w-[110px] h-[110px] mx-auto rounded-[30px] grid place-items-center text-giant text-on-feature feature-band" aria-hidden="true">{worker ? '🎉' : '💼'}</div>
      <h2 className="font-display text-head font-extrabold text-ink mt-5 mb-2 tracking-tight">Almost there{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
      <p className="text-small text-dim leading-relaxed">{worker ? "Create your account and you're a Starter 🌱 with a blank CV — now let your work write it for you." : 'Create your account, then post your first job and reach verified youth nearby.'}</p>
      {/* An inverted block: `ink` and `canvas` swap between themes, so the
          secondary lines have to recede from the block's own text colour
          rather than pick a fixed grey. */}
      {worker && (
        <div className="text-left bg-ink text-canvas rounded-card p-4 mt-5">
          <b className="text-small">Your first 3 steps</b>
          <div className="text-small opacity-85 mt-2.5">1️⃣ Apply to a gig near you (it's free)</div>
          <div className="text-small opacity-85 mt-2">2️⃣ Do a great job & get reviewed</div>
          <div className="text-small opacity-85 mt-2">3️⃣ Watch your CV grow and unlock formal jobs 🪜</div>
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
      <p className="text-micro text-dim leading-relaxed mt-3">
        By creating an account you agree to our{' '}
        <button onClick={() => setLegal('terms')} className="font-bold text-ink underline underline-offset-2">Terms of use</button>
        {' '}and to us handling your information as set out in the{' '}
        <button onClick={() => setLegal('privacy')} className="font-bold text-ink underline underline-offset-2">Privacy notice</button>.
        You must be 18 or older.
      </p>
      {legal === 'privacy' && <PrivacySheet onClose={() => setLegal(null)} />}
      {legal === 'terms' && <TermsSheet onClose={() => setLegal(null)} />}
    </>
  );
}
