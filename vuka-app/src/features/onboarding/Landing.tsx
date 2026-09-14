import { useState } from 'react';
import { useTheme } from '../../providers/ThemeProvider';
import { Icon } from '../../components/Icon';
import { TIERS } from '../../data/catalog';
import { HEADLINE_STATS, STATS_SOURCE, YOUTH_UNEMPLOYMENT_SENTENCE } from '../../data/stats';
import { PrivacySheet, TermsSheet } from '../profile/LegalSheets';

/** Illustrative figures for the reputation preview. Labelled as a preview so
 *  nobody mistakes them for live platform numbers. */
const PREVIEW = { score: 69, jobs: 5, rating: '4,5', earned: '370' };

/**
 * Public marketing landing page — the first thing an anonymous visitor sees.
 * "Get started" enters the register flow; "Log in" goes to sign-in.
 */
export function Landing({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  const { resolved, toggle } = useTheme();
  const [legal, setLegal] = useState<'privacy' | 'terms' | null>(null);

  /* The reputation preview is drawn from the real ladder rather than from a
     picture of one. The old version showed "Trusted 🥈" — silver — while the
     app showed Trusted as bronze, so the first tier a new user reached looked
     like a demotion from what the homepage had promised. */
  const shown = TIERS[1];
  const next = TIERS[2];
  const toGo = Math.max(0, next.minJobs - PREVIEW.jobs);
  const progress = Math.round(((PREVIEW.jobs - shown.minJobs) / (next.minJobs - shown.minJobs)) * 100);

  return (
    <div className="min-h-screen bg-surface text-ink overflow-x-hidden">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-surface-veil backdrop-blur border-b border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-ink tracking-tight text-lead">
            <span className="w-3 h-3 rounded-full bg-brand-solid" />Vuka Uzenzele
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggle} aria-label="Toggle theme" className="grid place-items-center w-10 h-10 rounded-xl border border-line text-ink hover:bg-surface-2 transition active:scale-95">
              <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            <button onClick={onLogin} className="text-small font-bold text-ink px-3 py-2 rounded-pill hover:bg-surface-2 transition">Log in</button>
            <button onClick={onGetStarted} className="rounded-pill bg-brand-solid text-brand-on text-small font-bold px-4 sm:px-5 py-2.5 hover:bg-brand-hover transition active:scale-95">Get started</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-14 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-8 items-center">
          <div>
            <span className="ob-rise inline-flex items-center gap-2 rounded-pill bg-surface-2 border border-line px-3 py-1.5 text-small font-bold text-ink mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-solid floaty" />Youth work, reimagined for South Africa
            </span>
            <h1 className="font-display ob-rise text-[clamp(2.1rem,6vw,3.6rem)] font-extrabold text-ink leading-[1.04] tracking-[-0.02em]">
              Your first job shouldn't need a CV<span className="text-brand">.</span>
            </h1>
            <p className="ob-rise-2 text-dim text-[clamp(1rem,2.2vw,1.2rem)] leading-relaxed mt-5 max-w-[46ch]">
              Vuka Uzenzele turns real work — car washes, moving, tutoring, cleaning — into a
              <b className="text-ink"> verified track record</b> that opens the door to formal jobs. No matric, no experience needed to start.
            </p>
            <div className="ob-rise-3 flex flex-wrap gap-3 mt-8">
              <button onClick={onGetStarted} className="inline-flex items-center gap-2 rounded-pill bg-brand-solid text-brand-on font-bold text-body px-6 py-3.5 hover:bg-brand-hover transition active:scale-95 shadow-e2">
                Get started — it's free <Icon name="chev" size={18} />
              </button>
              <button onClick={onLogin} className="inline-flex items-center rounded-pill border border-line text-ink font-bold text-body px-6 py-3.5 hover:bg-surface-2 transition active:scale-95">
                I have an account
              </button>
            </div>
            <p className="ob-rise-3 text-small text-faint mt-4">Free to join · built light on data, and it opens even with no signal.</p>
          </div>

          {/* Hero visual — a preview built from the app's own cards */}
          <div className="relative hidden sm:block pb-16 pr-4" aria-hidden="true">
            <div className="absolute inset-0 -m-8 rounded-[40px]" style={{ background: 'radial-gradient(70% 70% at 70% 30%, rgba(255,176,31,.14), transparent 70%)' }} />
            <div className="relative rounded-[28px] p-6 pb-7 text-on-feature overflow-hidden shadow-e3 feature-band">
              <span className="absolute -right-10 -top-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,176,31,.20), transparent 70%)' }} />
              <div className="relative">
                <div className="text-micro font-bold uppercase tracking-widest text-on-feature-dim">Your Vuka Score</div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="grid place-items-center w-20 h-20 rounded-full shrink-0" style={{ background: `conic-gradient(var(--v-brand-solid) 0 ${PREVIEW.score}%, rgba(255,255,255,.16) ${PREVIEW.score}% 100%)` }}>
                    <div className="grid place-items-center w-[62px] h-[62px] rounded-full bg-feature text-title font-extrabold font-mono tnum">{PREVIEW.score}</div>
                  </div>
                  <div>
                    <div className="text-lead font-extrabold">{shown.name} {shown.icon}</div>
                    <div className="text-small text-on-feature-dim font-mono tnum">{PREVIEW.jobs} jobs · {PREVIEW.rating}★ · R{PREVIEW.earned}</div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-micro text-on-feature-dim mb-1.5">
                    <span>{toGo} more {toGo === 1 ? 'job' : 'jobs'} to {next.name}</span>
                    <span aria-hidden="true">{next.icon}</span>
                  </div>
                  <div className="h-2 rounded-pill bg-white/15 overflow-hidden"><div className="h-full rounded-pill bg-brand-solid" style={{ width: `${progress}%` }} /></div>
                </div>
              </div>
            </div>
            {/* floating gig card — overlaps only the bottom-right corner */}
            <div className="floaty absolute right-0 -bottom-2 w-[214px] rounded-2xl bg-surface border border-line shadow-e3 p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-10 h-10 rounded-xl text-lead shrink-0" style={{ background: 'var(--v-brand-soft)', color: 'var(--v-brand)' }}>🚗</span>
                <div className="min-w-0 flex-1">
                  <b className="text-small text-ink block leading-tight">Wash 2 cars</b>
                  <span className="text-micro text-dim">Diepkloof · 1.2 km</span>
                </div>
                <b className="text-body font-extrabold text-ink font-mono tnum">R100</b>
              </div>
              <div className="flex gap-1.5 mt-2.5">
                <span className="text-micro font-bold rounded-pill px-2 py-0.5 bg-live-soft text-brand">Urgent</span>
                <span className="text-micro font-bold rounded-pill px-2 py-0.5 bg-verified-soft text-verified">Fair pay</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission band */}
      <section className="bg-surface-2 border-y border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-10 pb-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {HEADLINE_STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold text-brand font-mono tnum leading-none">{s.value}</div>
              <div className="text-small text-dim mt-2 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
        {/* The figures above carry their source, so anyone can check them and
            so it is obvious when they have gone stale. */}
        <p className="max-w-[1080px] mx-auto px-4 sm:px-6 pb-8 text-center text-micro text-faint">Source: {STATS_SOURCE}</p>
      </section>

      {/* How it works */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-small font-bold uppercase tracking-widest text-brand">How it works</p>
          <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.3rem)] font-extrabold text-ink tracking-tight mt-2">Start today. Rise as you go.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { ic: '📍', t: 'Find work near you', p: 'Browse gigs in your area and apply in one tap — cleaning, moving, tutoring, car washes and more.' },
            { ic: '⭐', t: 'Do the job, get rated', p: 'Finish a gig and the person who hired you leaves a verified review. That reference is yours forever.' },
            { ic: '🪜', t: 'Rise to bigger jobs', p: 'Your track record lifts your tier — unlocking cashier, security & call-centre roles. No matric needed.' },
          ].map((s, i) => (
            <div key={s.t} className="rounded-[20px] border border-line bg-surface p-6 shadow-e1">
              <div className="flex items-center justify-between">
                <span className="grid place-items-center w-12 h-12 rounded-2xl bg-surface-2 border border-line text-head">{s.ic}</span>
                <span className="text-small font-extrabold text-faint font-mono tnum">0{i + 1}</span>
              </div>
              <h3 className="font-display text-lead font-extrabold text-ink mt-4 tracking-tight">{s.t}</h3>
              <p className="text-small text-dim leading-relaxed mt-1.5">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two-sided */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 pb-16 grid md:grid-cols-2 gap-5">
        <div className="rounded-[24px] p-7 text-on-feature relative overflow-hidden shadow-e2 feature-band">
          <span className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,176,31,.20), transparent 70%)' }} />
          <div className="relative">
            <div className="text-head">🙋</div>
            <h3 className="font-display text-title font-extrabold mt-2">Looking for work?</h3>
            <p className="text-on-feature-dim text-body leading-relaxed mt-2">Build a verified CV from real jobs, get paid fairly, and unlock formal employment — starting from zero.</p>
            <button onClick={onGetStarted} className="mt-5 rounded-pill bg-on-feature text-feature font-bold text-body px-5 py-3 hover:opacity-90 transition active:scale-95">Start earning →</button>
          </div>
        </div>
        <div className="rounded-[24px] p-7 bg-surface border border-line shadow-e2">
          <div className="text-head">💼</div>
          <h3 className="font-display text-title font-extrabold text-ink mt-2 tracking-tight">Need to hire?</h3>
          <p className="text-dim text-body leading-relaxed mt-2">Find ID-verified youth nearby with real reviews and earned tiers. Post a job, invite, and chat directly.</p>
          <button onClick={onGetStarted} className="mt-5 rounded-pill bg-ink text-canvas font-bold text-body px-5 py-3 hover:bg-ink transition active:scale-95">Post a job →</button>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-surface-2 border-y border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-small font-bold text-ink">
          <span>🪪 ID-verified</span>
          <span>⚖️ Fair-pay checked</span>
          <span>⭐ Two-way reviews</span>
          <span>📶 Light on data</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[1080px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] font-extrabold text-ink tracking-tight max-w-[18ch] mx-auto">Rise up &amp; do it for yourself<span className="text-brand">.</span></h2>
        <p className="text-dim text-body mt-4 max-w-[44ch] mx-auto">Join young South Africans turning everyday work into a career. It's free, and it starts now.</p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <button onClick={onGetStarted} className="rounded-pill bg-brand-solid text-brand-on font-bold text-body px-7 py-3.5 hover:bg-brand-hover transition active:scale-95 shadow-e2">Get started free</button>
          <button onClick={onLogin} className="rounded-pill border border-line text-ink font-bold text-body px-7 py-3.5 hover:bg-surface-2 transition active:scale-95">Log in</button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 text-center text-small text-dim leading-relaxed">
          <b className="text-ink">Gijima Innovation Engine · 2026</b><br />
          {YOUTH_UNEMPLOYMENT_SENTENCE}
          <div className="flex items-center justify-center gap-4 mt-3">
            <button onClick={() => setLegal('privacy')} className="font-semibold underline underline-offset-2 hover:text-ink transition">Privacy &amp; your data</button>
            <button onClick={() => setLegal('terms')} className="font-semibold underline underline-offset-2 hover:text-ink transition">Terms of use</button>
          </div>
        </div>
      </footer>

      {legal === 'privacy' && <PrivacySheet onClose={() => setLegal(null)} />}
      {legal === 'terms' && <TermsSheet onClose={() => setLegal(null)} />}
    </div>
  );
}
