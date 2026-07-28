import { useRef, useState, type ReactNode } from 'react';
import { CATEGORIES } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { useTheme } from '../../providers/ThemeProvider';
import type { CategoryId, Role } from '../../types';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';

type OBView = 'welcome' | 'role' | 'reg' | 'login';
interface OBData { phone: string; name: string; age: string; location: string; skills: CategoryId[]; idVerified: boolean; password: string; }

const SLIDES = [
  { art: '💚', h: 'Welcome to Vuka Uzenzele', p: 'Find real work near you today — no CV, no matric, no experience needed to start.' },
  { art: '🧾', h: 'Your work writes your CV', p: 'Every job you finish adds a verified reference to your profile — automatically.' },
  { art: '🪜', h: 'Climb to better jobs', p: 'A strong profile unlocks formal work — cashier, security, call-centre — as you rise.' },
];

const stepsFor = (role: Role): string[] =>
  role === 'worker'
    ? ['phone', 'otp', 'about', 'skills', 'password', 'id', 'done']
    : ['phone', 'otp', 'org', 'password', 'done'];

export function Onboarding() {
  const { register, login, demoLogin, toast } = useApp();

  const [view, setView] = useState<OBView>('welcome');
  const [slide, setSlide] = useState(0);
  const [role, setRole] = useState<Role>('worker');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<OBData>({ phone: '', name: '', age: '', location: 'Soweto, Gauteng', skills: [], idVerified: false, password: '' });

  const steps = stepsFor(role);
  const key = steps[step];

  const validate = (): boolean => {
    if (key === 'phone' && data.phone.replace(/\D/g, '').length < 9) { toast('Enter a valid mobile number 📱'); return false; }
    if (key === 'about' && !data.name.trim()) { toast('Please enter your name ✍️'); return false; }
    if (key === 'skills' && data.skills.length === 0) { toast('Pick at least one skill 🎯'); return false; }
    if (key === 'org' && !data.name.trim()) { toast('Enter your name or business ✍️'); return false; }
    if (key === 'password' && data.password.length < 4) { toast('Choose a password of at least 4 characters 🔒'); return false; }
    return true;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => { if (step > 0) setStep((s) => s - 1); else setView('role'); };

  const finish = async () => {
    setBusy(true);
    try {
      await register({
        role, name: data.name, phone: data.phone, password: data.password,
        age: Number(data.age) || (role === 'worker' ? 18 : 30),
        location: data.location, skills: data.skills, idVerified: data.idVerified,
      });
    } catch (e) { toast((e as Error).message); setBusy(false); }
  };

  return (
    <AuthLayout>
      {view === 'welcome' && <Welcome slide={slide} onNext={() => (slide < SLIDES.length - 1 ? setSlide(slide + 1) : setView('role'))} onLogin={() => setView('login')} />}
      {view === 'role' && <RoleChoose onPick={(r) => { setRole(r); setStep(0); setView('reg'); }} onLogin={() => setView('login')} />}
      {view === 'login' && <LoginView busy={busy} onBack={() => setView('welcome')}
        onLogin={async (phone, password) => { setBusy(true); try { await login(phone, password); } catch (e) { toast((e as Error).message); setBusy(false); } }}
        onDemo={async (r) => { setBusy(true); try { await demoLogin(r); } catch (e) { toast((e as Error).message); setBusy(false); } }} />}
      {view === 'reg' && key !== 'done' && <RegStep stepKey={key} steps={steps} step={step} data={data} setData={setData} onBack={back} onNext={next} />}
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
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-tight">Start with no CV.<br />Let your work write it<span className="text-red">.</span></h1>
          <p className="text-white/70 mt-5 text-[15px] leading-relaxed">Vuka Uzenzele connects South Africa's youth to real work — and turns every completed job into a verified track record that opens the door to formal employment.</p>
          <ul className="mt-9 space-y-4">
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
          <div className="m-auto w-full max-w-[420px] px-6 sm:px-10 py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- Welcome ---------------- */
function Welcome({ slide, onNext, onLogin }: { slide: number; onNext: () => void; onLogin: () => void }) {
  const s = SLIDES[slide];
  const last = slide === SLIDES.length - 1;
  return (
    <div className="text-center">
      <div className="w-[150px] h-[150px] mx-auto rounded-[36px] grid place-items-center text-[72px] bg-[#eaf3fb] border border-line dark:bg-surface" aria-hidden="true">{s.art}</div>
      <h2 className="text-[26px] font-bold text-navy mt-6 mb-2 leading-tight">{s.h}<span className="text-red">.</span></h2>
      <p className="text-[14.5px] text-muted leading-relaxed">{s.p}</p>
      <div className="flex justify-center gap-2 mt-6 mb-8">
        {SLIDES.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-red' : 'w-2 bg-line-strong'}`} />)}
      </div>
      <Button block onClick={onNext}>{last ? 'Get started' : 'Next'}</Button>
      <button onClick={onLogin} className="mt-4 text-[13px] text-muted font-semibold hover:text-navy">Already have an account? <b className="text-red">Log in</b></button>
    </div>
  );
}

/* ---------------- Role choose ---------------- */
function RoleChoose({ onPick, onLogin }: { onPick: (r: Role) => void; onLogin: () => void }) {
  return (
    <div>
      <h2 className="text-[26px] font-bold text-navy mb-1.5 leading-tight">Create your account<span className="text-red">.</span></h2>
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
const inputCls = 'w-full border-[1.5px] border-line-strong rounded-pill px-4 py-3 text-sm bg-surface text-navy focus:outline-none focus:border-navy transition';
function LoginView({ busy, onBack, onLogin, onDemo }: { busy: boolean; onBack: () => void; onLogin: (phone: string, password: string) => void; onDemo: (r: Role) => void }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div>
      <BackRow onBack={onBack} />
      <h2 className="text-[26px] font-bold text-navy mb-1.5 leading-tight">Welcome back<span className="text-red">.</span></h2>
      <p className="text-[13.5px] text-muted mb-6">Sign in to pick up where you left off.</p>
      <div className="mb-3.5"><Label>Mobile number</Label><input className={inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Mobile number" /></div>
      <div className="mb-5"><Label>Password</Label><input className={inputCls} type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" onKeyDown={(e) => { if (e.key === 'Enter') onLogin(phone, password); }} /></div>
      <Button block disabled={busy} onClick={() => onLogin(phone, password)}>{busy ? 'Signing in…' : 'Log in'}</Button>

      <div className="flex items-center gap-3 my-6"><span className="flex-1 h-px bg-line" /><span className="text-[11px] text-subtle font-semibold uppercase tracking-wide">Or explore instantly</span><span className="flex-1 h-px bg-line" /></div>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="ghost" disabled={busy} onClick={() => onDemo('worker')}>🙋 Demo worker</Button>
        <Button variant="ghost" disabled={busy} onClick={() => onDemo('employer')}>💼 Demo employer</Button>
      </div>
    </div>
  );
}

/* ---------------- Registration step ---------------- */
function RegStep({ stepKey, steps, step, data, setData, onBack, onNext }: {
  stepKey: string; steps: string[]; step: number; data: OBData;
  setData: React.Dispatch<React.SetStateAction<OBData>>; onBack: () => void; onNext: () => void;
}) {
  const total = steps.length - 1;
  const btnLabel = stepKey === 'id' ? (data.idVerified ? 'Finish' : 'Skip for now') : 'Continue';
  return (
    <div>
      <BackRow onBack={onBack} />
      <div className="flex gap-1.5 mb-6">{steps.slice(0, total).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-red' : 'bg-line-strong'}`} />)}</div>
      {stepKey === 'phone' && <PhoneStep data={data} setData={setData} />}
      {stepKey === 'otp' && <OtpStep phone={data.phone} />}
      {stepKey === 'about' && <AboutStep data={data} setData={setData} />}
      {stepKey === 'skills' && <SkillsStep data={data} setData={setData} />}
      {stepKey === 'password' && <PasswordStep data={data} setData={setData} />}
      {stepKey === 'id' && <IdStep data={data} setData={setData} />}
      {stepKey === 'org' && <OrgStep data={data} setData={setData} />}
      <Button block className="mt-7" onClick={onNext}>{btnLabel}</Button>
    </div>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return <button onClick={onBack} aria-label="Back" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong bg-surface text-navy mb-5 hover:bg-surface-2 transition active:scale-95"><Icon name="back" size={20} /></button>;
}
function Head({ h, sub }: { h: string; sub: string }) {
  return (<><h2 className="text-[24px] font-bold text-navy mb-1.5 leading-tight" dangerouslySetInnerHTML={{ __html: h }} /><p className="text-[13.5px] text-muted mb-6 leading-relaxed">{sub}</p></>);
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-1.5">{children}</label>;
}
const Trust = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 items-start bg-[#eaf3fb] dark:bg-info/10 rounded-[13px] px-3.5 py-3 mt-4"><span className="text-info shrink-0"><Icon name="shield" size={16} /></span><span className="text-[12px] text-navy leading-snug">{children}</span></div>
);

function PhoneStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="What's your number<span class='text-red'>?</span>" sub="We'll send a free SMS code to confirm it's you. Your number is never shown to others." />
    <div><Label>Mobile number</Label><input className={inputCls} type="tel" inputMode="numeric" placeholder="072 000 0000" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} aria-label="Mobile number" /></div>
    <Trust>Sending the code is <b>zero-rated</b> — it costs you no airtime or data.</Trust></>);
}
function OtpStep({ phone }: { phone: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (<><Head h="Enter your code<span class='text-red'>.</span>" sub={`We sent a 4-digit code to ${phone || 'your phone'}.`} />
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (<input key={i} ref={(el) => { refs.current[i] = el; }} maxLength={1} inputMode="numeric" aria-label={`Digit ${i + 1}`} placeholder="•"
        className="w-16 h-18 py-4 text-center text-[26px] font-bold text-navy border-[1.5px] border-line-strong rounded-2xl bg-surface focus:outline-none focus:border-navy"
        onChange={(e) => { if (e.target.value && i < 3) refs.current[i + 1]?.focus(); }} />))}
    </div>
    <p className="text-center text-[12.5px] text-muted mt-4">Didn't get it? <b className="text-navy">Resend</b> · Demo code: <b className="text-navy">1 2 3 4</b></p></>);
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
    <div><Label>Password</Label><input className={inputCls} type="password" placeholder="At least 4 characters" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} aria-label="Password" /></div>
    <Trust>Your password is stored securely (hashed) — never in plain text.</Trust></>);
}
function IdStep({ data, setData }: { data: OBData; setData: React.Dispatch<React.SetStateAction<OBData>> }) {
  return (<><Head h="Verify your identity<span class='text-red'>.</span>" sub="Optional — but verified workers get the ✅ badge, more trust, and access to formal jobs." />
    <div className={`border-[1.5px] rounded-[20px] p-6 text-center ${data.idVerified ? 'border-success bg-[#f0fbef] dark:bg-success/10' : 'border-dashed border-line-strong bg-surface-2'}`}>
      <div className={`w-[72px] h-[72px] mx-auto mb-2.5 rounded-[20px] grid place-items-center text-4xl ${data.idVerified ? 'bg-[#dff5de] dark:bg-success/20' : 'bg-[#eaf3fb] dark:bg-surface'}`} aria-hidden="true">{data.idVerified ? '✅' : '🪪'}</div>
      {data.idVerified ? <><h4 className="m-0 mb-1 text-base text-navy font-bold">Identity verified</h4><p className="m-0 text-[12.5px] text-muted leading-relaxed">Your SA ID has been confirmed. You've earned the Verified badge.</p></>
        : <><h4 className="m-0 mb-1 text-base text-navy font-bold">Scan your SA ID or smart card</h4><p className="m-0 text-[12.5px] text-muted leading-relaxed">Point your camera at your green ID book or smart ID card.</p></>}
    </div>
    {!data.idVerified && <Button variant="ghost" block icon="camera" className="mt-4" onClick={() => setData({ ...data, idVerified: true })}>Scan my ID now</Button>}
    <Trust>Your ID is used only to confirm you're a real person. It is never shown to employers.</Trust></>);
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
      <h2 className="text-[24px] font-bold text-navy mt-5 mb-2">Almost there{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
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
    </div>
  );
}
