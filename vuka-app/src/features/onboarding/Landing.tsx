import { useTheme } from '../../providers/ThemeProvider';
import { Icon } from '../../components/Icon';

/**
 * Public marketing landing page — the first thing an anonymous visitor sees.
 * "Get started" enters the register flow; "Log in" goes to sign-in.
 */
export function Landing({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  const { resolved, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-surface text-ink overflow-x-hidden">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur border-b border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-navy tracking-tight text-lg">
            <span className="w-3 h-3 rounded-full bg-red" />Vuka Uzenzele
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggle} aria-label="Toggle theme" className="grid place-items-center w-10 h-10 rounded-xl border border-line-strong text-navy hover:bg-surface-2 transition active:scale-95">
              <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <button onClick={onLogin} className="text-[13.5px] font-bold text-navy px-3 py-2 rounded-pill hover:bg-surface-2 transition">Log in</button>
            <button onClick={onGetStarted} className="rounded-pill bg-red text-white text-[13.5px] font-bold px-4 sm:px-5 py-2.5 hover:bg-red-hover transition active:scale-95">Get started</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-14 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center">
          <div>
            <span className="ob-rise inline-flex items-center gap-2 rounded-pill bg-surface-2 border border-line px-3 py-1.5 text-[12px] font-bold text-navy mb-6">
              <span className="w-2 h-2 rounded-full bg-red floaty" />Youth work, reimagined for South Africa
            </span>
            <h1 className="ob-rise text-[clamp(2.1rem,6vw,3.6rem)] font-extrabold text-navy leading-[1.04] tracking-[-0.02em]">
              Your first job shouldn't need a CV<span className="text-red">.</span>
            </h1>
            <p className="ob-rise-2 text-muted text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed mt-5 max-w-[46ch]">
              Vuka Uzenzele turns real work — car washes, moving, tutoring, cleaning — into a
              <b className="text-navy"> verified track record</b> that opens the door to formal jobs. No matric, no experience needed to start.
            </p>
            <div className="ob-rise-3 flex flex-wrap gap-3 mt-8">
              <button onClick={onGetStarted} className="inline-flex items-center gap-2 rounded-pill bg-red text-white font-bold text-[15px] px-6 py-3.5 hover:bg-red-hover transition active:scale-95 shadow-e2">
                Get started — it's free <Icon name="chev" size={18} />
              </button>
              <button onClick={onLogin} className="inline-flex items-center rounded-pill border border-line-strong text-navy font-bold text-[15px] px-6 py-3.5 hover:bg-surface-2 transition active:scale-95">
                I have an account
              </button>
            </div>
            <p className="ob-rise-3 text-[12.5px] text-subtle mt-4">Zero-rated · browsing &amp; applying costs no data.</p>
          </div>

          {/* Hero visual — a preview built from the app's own cards */}
          <div className="relative hidden sm:block pb-16 pr-4" aria-hidden="true">
            <div className="absolute inset-0 -m-8 rounded-[40px]" style={{ background: 'radial-gradient(70% 70% at 70% 30%, rgba(242,0,35,.12), transparent 70%)' }} />
            <div className="relative rounded-[28px] p-6 pb-7 text-white overflow-hidden shadow-e3" style={{ background: 'linear-gradient(155deg,#0D182B,#0E355A 60%,#123e69)' }}>
              <span className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,0,35,.35), transparent 70%)' }} />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">Your reputation</div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="grid place-items-center w-20 h-20 rounded-full shrink-0" style={{ background: 'conic-gradient(#18ce0f 0 69%, rgba(255,255,255,.14) 69% 100%)' }}>
                    <div className="grid place-items-center w-[62px] h-[62px] rounded-full bg-navy-deep text-xl font-extrabold tnum">69</div>
                  </div>
                  <div>
                    <div className="text-lg font-extrabold">Trusted 🥈</div>
                    <div className="text-[12.5px] text-white/70">2 jobs · 4.5★ · R370 earned</div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-[11px] text-white/70 mb-1.5"><span>1 more job to Professional</span><span aria-hidden="true">🥇</span></div>
                  <div className="h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-red" style={{ width: '64%' }} /></div>
                </div>
              </div>
            </div>
            {/* floating gig card — overlaps only the bottom-right corner */}
            <div className="floaty absolute right-0 -bottom-2 w-[214px] rounded-2xl bg-surface border border-line shadow-e3 p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-10 h-10 rounded-xl text-lg shrink-0" style={{ background: '#F2002322', color: '#F20023' }}>🚗</span>
                <div className="min-w-0 flex-1">
                  <b className="text-[13px] text-navy block leading-tight">Wash 2 cars</b>
                  <span className="text-[11px] text-muted">Diepkloof · 1.2 km</span>
                </div>
                <b className="text-[15px] font-extrabold text-navy tnum">R100</b>
              </div>
              <div className="flex gap-1.5 mt-2.5">
                <span className="text-[10px] font-bold rounded-pill px-2 py-0.5 bg-[#fdecef] text-red">Urgent</span>
                <span className="text-[10px] font-bold rounded-pill px-2 py-0.5 bg-[#e6f5e6] text-success">Fair pay</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission band */}
      <section className="bg-surface-2 border-y border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '~60%', l: 'Youth (15–24) unemployed' },
            { n: '~3.4m', l: 'Not in work, education or training' },
            { n: 'R0', l: 'To browse & apply — always' },
            { n: '1st', l: 'Job made possible with no CV' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold text-red tnum leading-none">{s.n}</div>
              <div className="text-[12.5px] text-muted mt-2 leading-snug">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-[12px] font-bold uppercase tracking-widest text-red">How it works</p>
          <h2 className="text-[clamp(1.6rem,3.6vw,2.3rem)] font-extrabold text-navy tracking-tight mt-2">Start today. Rise as you go.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { ic: '📍', t: 'Find work near you', p: 'Browse gigs in your area and apply in one tap — cleaning, moving, tutoring, car washes and more.' },
            { ic: '⭐', t: 'Do the job, get rated', p: 'Finish a gig and the person who hired you leaves a verified review. That reference is yours forever.' },
            { ic: '🪜', t: 'Rise to bigger jobs', p: 'Your track record lifts your tier — unlocking cashier, security & call-centre roles. No matric needed.' },
          ].map((s, i) => (
            <div key={s.t} className="rounded-[20px] border border-line bg-surface p-6 shadow-e1">
              <div className="flex items-center justify-between">
                <span className="grid place-items-center w-12 h-12 rounded-2xl bg-surface-2 border border-line text-2xl">{s.ic}</span>
                <span className="text-[13px] font-extrabold text-subtle tnum">0{i + 1}</span>
              </div>
              <h3 className="text-[17px] font-extrabold text-navy mt-4 tracking-tight">{s.t}</h3>
              <p className="text-[13.5px] text-muted leading-relaxed mt-1.5">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two-sided */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 pb-16 grid md:grid-cols-2 gap-5">
        <div className="rounded-[24px] p-7 text-white relative overflow-hidden shadow-e2" style={{ background: 'linear-gradient(150deg,#0E355A,#123e69)' }}>
          <span className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,0,35,.3), transparent 70%)' }} />
          <div className="relative">
            <div className="text-2xl">🙋</div>
            <h3 className="text-xl font-extrabold mt-2">Looking for work?</h3>
            <p className="text-white/80 text-[14px] leading-relaxed mt-2">Build a verified CV from real jobs, get paid fairly, and unlock formal employment — starting from zero.</p>
            <button onClick={onGetStarted} className="mt-5 rounded-pill bg-white text-navy font-bold text-[14px] px-5 py-3 hover:bg-white/90 transition active:scale-95">Start earning →</button>
          </div>
        </div>
        <div className="rounded-[24px] p-7 bg-surface border border-line shadow-e2">
          <div className="text-2xl">💼</div>
          <h3 className="text-xl font-extrabold text-navy mt-2 tracking-tight">Need to hire?</h3>
          <p className="text-muted text-[14px] leading-relaxed mt-2">Find ID-verified youth nearby with real reviews and earned tiers. Post a job, invite, and chat directly.</p>
          <button onClick={onGetStarted} className="mt-5 rounded-pill bg-navy text-white dark:text-navy-deep font-bold text-[14px] px-5 py-3 hover:bg-navy-2 transition active:scale-95">Post a job →</button>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-surface-2 border-y border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-bold text-navy">
          <span>🪪 ID-verified</span>
          <span>⚖️ Fair-pay checked</span>
          <span>⭐ Two-way reviews</span>
          <span>📶 Zero-rated</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-[clamp(1.7rem,4vw,2.6rem)] font-extrabold text-navy tracking-tight max-w-[18ch] mx-auto">Rise up &amp; do it for yourself<span className="text-red">.</span></h2>
        <p className="text-muted text-[15px] mt-4 max-w-[44ch] mx-auto">Join young South Africans turning everyday work into a career. It's free, and it starts now.</p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <button onClick={onGetStarted} className="rounded-pill bg-red text-white font-bold text-[15px] px-7 py-3.5 hover:bg-red-hover transition active:scale-95 shadow-e2">Get started free</button>
          <button onClick={onLogin} className="rounded-pill border border-line-strong text-navy font-bold text-[15px] px-7 py-3.5 hover:bg-surface-2 transition active:scale-95">Log in</button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 text-center text-[12px] text-muted leading-relaxed">
          <b className="text-navy">Gijima Innovation Engine · 2026</b><br />
          Built to help close South Africa's youth unemployment gap — nearly 60% for ages 15–24.
        </div>
      </footer>
    </div>
  );
}
