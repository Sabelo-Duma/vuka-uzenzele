/* ============================================================
   Vuka Uzenzele — app logic (vanilla JS SPA, no dependencies)
   Runs entirely in the browser, fully offline.

   The concept, in one loop:
     do a job  →  get reviewed  →  your verified CV writes itself
     →  your reputation rises  →  you climb the opportunity ladder
     →  better + FORMAL jobs (cashier, security, call-centre) unlock.

   Brand: Gijima (navy #0E355A / red #F20023).
   ============================================================ */

const app = document.getElementById('app');

const state = {
  role: 'worker',        // 'worker' | 'employer'
  tab: 'home',
  route: null,           // detail overlay { name, params }
  feed: 'gigs',          // jobs tab: 'gigs' | 'formal'
  appliedJobs: [],
  onboarded: false,      // false → show onboarding/registration first
  ob: {                  // onboarding wizard state
    view: 'welcome',     // 'welcome' | 'role' | 'reg'
    slide: 0,            // welcome carousel slide
    role: 'worker',      // chosen role
    step: 0,             // registration step index
    data: { phone: '', name: '', age: '', location: 'Soweto, Gauteng', skills: [], idVerified: false },
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const cat = id => CATEGORIES.find(c => c.id === id) || {};
const money = n => 'R' + (Math.round(n * 100) / 100).toLocaleString('en-ZA');

// ---- Inline SVG icons (offline) ----
const ICON = {
  home:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  jobs:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"/></svg>',
  cv:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h7M9 17h7"/></svg>',
  ladder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/></svg>',
  user:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21"/></svg>',
  talent:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.3 3-5.3 6.5-5.3S15.5 16.7 15.5 20"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.4M18 20c0-2.6-1-4.3-2.5-5.3"/></svg>',
  plus:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  back:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chev:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  pin:   '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  shield:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  bolt:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
  lock:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
};

/* ============================================================
   DERIVED — reputation, badges, and the OPPORTUNITY TIER
   ============================================================ */
function computeTier(jobsDone, avg, flags) {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (jobsDone >= t.minJobs && avg >= t.minRating && flags <= t.maxFlags) current = t;
  }
  return current;
}

function computeCV() {
  const h = ME.history;
  const jobsDone = h.length;
  const avg = jobsDone ? h.reduce((s, j) => s + j.rating, 0) / jobsDone : 0;
  const totalEarned = h.reduce((s, j) => s + j.pay, 0);
  const flags = h.filter(j => j.safetyFlag).length;
  const catsWorked = new Set(h.map(j => j.category));

  let rep = 0;
  if (jobsDone) rep = Math.min(100, Math.round((avg / 5) * 60 + Math.min(jobsDone, 12) / 12 * 30 + (flags ? 0 : 10)));

  const earned = new Set();
  BADGES.forEach(b => {
    if (b.threshold && jobsDone >= b.threshold) earned.add(b.id);
    if (b.special === 'rating45' && avg >= 4.5) earned.add(b.id);
    if (b.special === 'idverified' && ME.idVerified) earned.add(b.id);
    if (b.special === 'multiskill' && catsWorked.size >= 3) earned.add(b.id);
  });

  const tier = computeTier(jobsDone, avg, flags);
  const nextTier = TIERS[tier.id + 1] || null;
  let tierProgress = 100, jobsToGo = 0, ratingOk = true, flagBlocked = false;
  if (nextTier) {
    jobsToGo = Math.max(0, nextTier.minJobs - jobsDone);
    ratingOk = avg >= nextTier.minRating;
    flagBlocked = flags > nextTier.maxFlags;
    const span = nextTier.minJobs - tier.minJobs;
    tierProgress = span ? Math.min(100, Math.round(((jobsDone - tier.minJobs) / span) * 100)) : 100;
  }
  return { jobsDone, avg, totalEarned, flags, catsWorked, rep, earned, tier, nextTier, tierProgress, jobsToGo, ratingOk, flagBlocked };
}

// How many formal jobs are unlocked at a given tier id
const unlockedFormalCount = tierId => FORMAL_JOBS.filter(f => f.minTier <= tierId).length;

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; $('.screen').appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================================================
   SHELL
   ============================================================ */
function render() {
  const cv = computeCV();
  if (!state.onboarded) {
    app.innerHTML = `
      <div class="stage">
        ${pitchRail(cv)}
        <div class="device">
          <div class="notch"></div>
          <div class="screen">
            ${statusBar()}
            ${renderOnboarding()}
          </div>
        </div>
      </div>`;
    bindOnboarding();
    return;
  }
  app.innerHTML = `
    <div class="stage">
      ${pitchRail(cv)}
      <div class="device">
        <div class="notch"></div>
        <div class="screen">
          ${statusBar()}
          <div class="view" id="view">${renderView(cv)}</div>
          ${renderTabBar()}
        </div>
      </div>
    </div>
    <div class="sheet-wrap" id="sheet"></div>`;
  bindTabs(); bindView();
  const v = $('#view'); if (v) v.scrollTop = 0;
}

/* ============================================================
   ONBOARDING / REGISTRATION FLOW
   ============================================================ */
const OB_SLIDES = [
  { art: '💚', h: 'Welcome to Vuka Uzenzele<span class="dot">.</span>', p: 'Rise up and do it for yourself. Find real work near you today — no CV, no matric, no experience needed to start.' },
  { art: '🧾', h: 'Your work writes your CV<span class="dot">.</span>', p: 'Every job you finish adds a verified reference to your profile — automatically. Start with nothing and build a track record employers trust.' },
  { art: '🪜', h: 'Climb to better jobs<span class="dot">.</span>', p: 'A strong profile unlocks formal work — cashier, security, call-centre — as you rise. The more you prove yourself, the bigger the opportunities.' },
];

function renderOnboarding() {
  const ob = state.ob;
  if (ob.view === 'welcome') return obWelcome();
  if (ob.view === 'role')    return obRole();
  return obReg();
}

function obWelcome() {
  const s = OB_SLIDES[state.ob.slide];
  const last = state.ob.slide === OB_SLIDES.length - 1;
  return `<div class="ob">
    <div class="ob-scroll">
      <div class="ob-brand"><span class="gd"></span>Vuka Uzenzele</div>
      <div class="ob-carousel">
        <div class="ob-art">${s.art}</div>
        <h2>${s.h}</h2>
        <p>${s.p}</p>
        <div class="dots">${OB_SLIDES.map((_, i) => `<i class="${i === state.ob.slide ? 'on' : ''}"></i>`).join('')}</div>
      </div>
    </div>
    <div class="ob-foot">
      <button class="btn primary block" data-ob="next-slide">${last ? 'Get started' : 'Next'}</button>
      <div class="ob-skip"><a data-ob="explore">Just exploring? <b>Open the demo profile →</b></a></div>
    </div>
  </div>`;
}

function obRole() {
  return `<div class="ob">
    <div class="ob-scroll">
      <div class="ob-brand"><span class="gd"></span>Vuka Uzenzele</div>
      <h2 class="ob-h" style="margin-top:16px">How will you use Vuka<span class="dot">?</span></h2>
      <p class="ob-sub">You can switch anytime later.</p>
      <div class="ob-roles">
        <button class="ob-role" data-obrole="worker">
          <div class="rico" style="background:#eaf3fb">🙋</div>
          <div><h4>I want to work</h4><p>Find gigs & formal jobs near you, and build a verified CV.</p></div>
        </button>
        <button class="ob-role" data-obrole="employer">
          <div class="rico" style="background:#faf5ff">💼</div>
          <div><h4>I need help</h4><p>Post a job and hire trusted, ID-verified youth nearby.</p></div>
        </button>
      </div>
    </div>
    <div class="ob-foot">
      <div class="ob-skip"><a data-ob="explore">Just exploring? <b>Open the demo profile →</b></a></div>
    </div>
  </div>`;
}

// Registration wizard — worker has 5 steps, employer has 3
function obSteps() {
  return state.ob.role === 'worker'
    ? ['phone', 'otp', 'about', 'skills', 'id', 'done']
    : ['phone', 'otp', 'org', 'done'];
}

function obReg() {
  const steps = obSteps();
  const key = steps[state.ob.step];
  const d = state.ob.data;
  const total = steps.length - 1; // exclude 'done' from the progress bar
  const bar = key === 'done' ? '' : `<div class="ob-steps">${steps.slice(0, total).map((_, i) => `<i class="${i <= state.ob.step ? 'done' : ''}"></i>`).join('')}</div>`;

  let body = '';
  if (key === 'phone') body = `
    <h2 class="ob-h">What's your number<span class="dot">?</span></h2>
    <p class="ob-sub">We'll send a free SMS code to confirm it's you. Your number is never shown to others.</p>
    <div class="formrow"><label>Mobile number</label><input id="ob-phone" type="tel" inputmode="numeric" placeholder="072 000 0000" value="${d.phone}"></div>
    <div class="trustline"><span class="ti">${ICON.shield}</span><span>Sending the code is <b>zero-rated</b> — it costs you no airtime or data.</span></div>`;
  else if (key === 'otp') body = `
    <h2 class="ob-h">Enter your code<span class="dot">.</span></h2>
    <p class="ob-sub">We sent a 4-digit code to <b>${d.phone || 'your phone'}</b>.</p>
    <div class="otp">${[0,1,2,3].map(i => `<input maxlength="1" inputmode="numeric" data-otp="${i}" placeholder="•">`).join('')}</div>
    <p class="otp-hint">Didn't get it? <b>Resend code</b> · Demo code: <b>1 2 3 4</b></p>`;
  else if (key === 'about') body = `
    <h2 class="ob-h">Tell us about you<span class="dot">.</span></h2>
    <p class="ob-sub">This starts your profile. Keep it simple and honest.</p>
    <div class="formrow"><label>Full name</label><input id="ob-name" placeholder="e.g. Thandeka Mokoena" value="${d.name}"></div>
    <div class="formrow" style="display:flex;gap:10px">
      <div style="flex:1"><label>Age</label><input id="ob-age" type="number" min="16" max="35" placeholder="21" value="${d.age}"></div>
      <div style="flex:2"><label>Where you live</label><input id="ob-loc" placeholder="Suburb, City" value="${d.location}"></div>
    </div>`;
  else if (key === 'skills') body = `
    <h2 class="ob-h">What are you good at<span class="dot">?</span></h2>
    <p class="ob-sub">Pick everything you can do — you don't need experience or papers. Choose at least one.</p>
    <div class="skillgrid">
      ${CATEGORIES.map(c => `<button class="skillopt ${d.skills.includes(c.id) ? 'sel' : ''}" data-obskill="${c.id}"><span class="se">${c.icon}</span><b>${c.label}</b></button>`).join('')}
    </div>`;
  else if (key === 'id') body = `
    <h2 class="ob-h">Verify your identity<span class="dot">.</span></h2>
    <p class="ob-sub">This is optional — but verified workers get the ✅ badge, more trust, and access to formal jobs.</p>
    <div class="idcard ${d.idVerified ? 'done' : ''}">
      <div class="idic">${d.idVerified ? '✅' : '🪪'}</div>
      ${d.idVerified
        ? `<h4>Identity verified</h4><p>Your SA ID has been confirmed. You've earned the Verified badge.</p>`
        : `<h4>Scan your SA ID or smart card</h4><p>Point your camera at your green ID book or smart ID card. We check it securely — takes a few seconds.</p>`}
    </div>
    ${d.idVerified ? '' : `<button class="btn ghost block" data-ob="verify-id" style="margin-top:14px">📷 Scan my ID now</button>`}
    <div class="trustline"><span class="ti">${ICON.shield}</span><span>Your ID is used only to confirm you're a real person. It is never shown to employers.</span></div>`;
  else if (key === 'org') body = `
    <h2 class="ob-h">Your details<span class="dot">.</span></h2>
    <p class="ob-sub">So workers know who they're dealing with.</p>
    <div class="formrow"><label>Your name or business</label><input id="ob-name" placeholder="e.g. Sipho Dlamini / Zanele Beauty Bar" value="${d.name}"></div>
    <div class="formrow"><label>Where are you</label><input id="ob-loc" placeholder="Suburb, City" value="${d.location}"></div>`;
  else if (key === 'done') return obSuccess();

  const btnLabel = key === 'id' ? (d.idVerified ? 'Finish' : 'Skip for now') : 'Continue';
  return `<div class="ob">
    <div class="ob-scroll">
      <div style="display:flex;align-items:center;gap:12px;margin:6px 0 14px">
        <button class="backbtn" data-ob="back">${ICON.back}</button>
        <div class="ob-brand" style="margin:0"><span class="gd"></span>Vuka Uzenzele</div>
      </div>
      ${bar}
      ${body}
    </div>
    <div class="ob-foot"><button class="btn primary block" data-ob="next-step">${btnLabel}</button></div>
  </div>`;
}

function obSuccess() {
  const worker = state.ob.role === 'worker';
  const d = state.ob.data;
  return `<div class="ob">
    <div class="ob-scroll">
      <div class="ob-success">
        <div class="sart">${worker ? '🎉' : '💼'}</div>
        <h2>You're all set${d.name ? ', ' + d.name.split(' ')[0] : ''}!</h2>
        <p>${worker
          ? 'Your profile is live. You\'re a <b>Starter 🌱</b> with a blank CV — now let your work write it for you.'
          : 'Your account is ready. Post your first job and reach verified youth nearby.'}</p>
        ${worker ? `
        <div class="startcard">
          <b>Your first 3 steps</b>
          <div class="sl">1️⃣ Apply to a gig near you (it's free)</div>
          <div class="sl">2️⃣ Do a great job & get reviewed</div>
          <div class="sl">3️⃣ Watch your CV grow and unlock formal jobs 🪜</div>
        </div>` : ''}
      </div>
    </div>
    <div class="ob-foot"><button class="btn primary block" data-ob="enter">${worker ? 'Start finding work' : 'Go to my dashboard'}</button></div>
  </div>`;
}

// Turn the collected answers into a fresh, empty-CV profile.
function applyRegistration() {
  const d = state.ob.data;
  if (state.ob.role === 'worker') {
    if (d.name) { ME.name = d.name; ME.initials = d.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
    if (d.age) ME.age = +d.age;
    if (d.location) ME.location = d.location;
    ME.skills = d.skills.length ? d.skills.slice() : ['cleaning'];
    ME.idVerified = d.idVerified;
    ME.education = 'New member';
    ME.joined = 'July 2026';
    ME.bio = 'New to Vuka and ready to work. Reliable, willing to learn, and building my reputation one job at a time.';
    ME.history = [];               // START WITH NO CV — the whole point.
    state.role = 'worker';
  } else {
    state.role = 'employer';
  }
  state.tab = 'home';
  state.onboarded = true;
}

// Save whatever inputs are on screen for the current step
function obSaveInputs() {
  const d = state.ob.data;
  const g = id => { const el = $('#' + id); return el ? el.value.trim() : null; };
  const phone = g('ob-phone'); if (phone !== null) d.phone = phone;
  const name = g('ob-name');   if (name !== null) d.name = name;
  const age = g('ob-age');     if (age !== null) d.age = age;
  const loc = g('ob-loc');     if (loc !== null) d.location = loc;
}

function obValidate(key) {
  const d = state.ob.data;
  if (key === 'phone' && d.phone.replace(/\D/g, '').length < 9) { toast('Enter a valid mobile number 📱'); return false; }
  if (key === 'about' && !d.name) { toast('Please enter your name ✍️'); return false; }
  if (key === 'skills' && d.skills.length === 0) { toast('Pick at least one skill 🎯'); return false; }
  if (key === 'org' && !d.name) { toast('Enter your name or business ✍️'); return false; }
  return true;
}

function bindOnboarding() {
  const go = () => render();
  document.querySelectorAll('[data-ob]').forEach(el => el.addEventListener('click', () => {
    const act = el.dataset.ob;
    if (act === 'explore') { state.onboarded = true; state.role = 'worker'; state.tab = 'home'; go(); return; }
    if (act === 'next-slide') {
      if (state.ob.slide < OB_SLIDES.length - 1) state.ob.slide++;
      else { state.ob.view = 'role'; }
      go(); return;
    }
    if (act === 'back') {
      obSaveInputs();
      if (state.ob.step > 0) state.ob.step--;
      else state.ob.view = 'role';
      go(); return;
    }
    if (act === 'verify-id') { state.ob.data.idVerified = true; toast('ID verified ✅ You earned the Verified badge'); go(); return; }
    if (act === 'next-step') {
      obSaveInputs();
      const steps = obSteps();
      const key = steps[state.ob.step];
      if (!obValidate(key)) return;
      state.ob.step++;
      go(); return;
    }
    if (act === 'enter') { applyRegistration(); go(); return; }
  }));

  // skill multi-select toggles
  document.querySelectorAll('[data-obskill]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.obskill;
    const arr = state.ob.data.skills;
    const i = arr.indexOf(id);
    if (i > -1) arr.splice(i, 1); else arr.push(id);
    render();
  }));

  // role choose
  document.querySelectorAll('[data-obrole]').forEach(el => el.addEventListener('click', () => {
    state.ob.role = el.dataset.obrole; state.ob.view = 'reg'; state.ob.step = 0; render();
  }));

  // OTP auto-advance focus (nice touch, no re-render)
  const otps = Array.from(document.querySelectorAll('[data-otp]'));
  otps.forEach((box, i) => box.addEventListener('input', () => {
    if (box.value && i < otps.length - 1) otps[i + 1].focus();
  }));
  if (otps.length) otps[0].focus();
}

function statusBar() {
  return `<div class="statusbar">
    <span>9:41</span>
    <div class="right">
      <span>Vodacom</span>
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="4.5" y="4.5" width="3" height="7.5" rx="1"/><rect x="9" y="2" width="3" height="10" rx="1"/><rect x="13.5" y="0" width="3" height="12" rx="1" opacity=".4"/></svg>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1" y="1.5" width="19" height="9" rx="2.5"/><rect x="2.5" y="3" width="14" height="6" rx="1.2" fill="currentColor"/><rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor"/></svg>
    </div>
  </div>`;
}

function renderView(cv) {
  if (state.route) {
    if (state.route.name === 'job')    return jobDetail(state.route.params.id);
    if (state.route.name === 'formal') return formalDetail(state.route.params.id, cv);
    if (state.route.name === 'worker') return workerDetail(state.route.params.id);
  }
  if (state.role === 'worker') {
    if (state.tab === 'home')    return workerHome(cv);
    if (state.tab === 'jobs')    return jobsFeed(cv);
    if (state.tab === 'cv')      return cvScreen(cv);
    if (state.tab === 'profile') return workerProfile(cv);
  } else {
    if (state.tab === 'home')    return employerHome();
    if (state.tab === 'talent')  return talentScreen();
    if (state.tab === 'post')    return postJobScreen();
    if (state.tab === 'profile') return employerProfile();
  }
  return '';
}

/* ============================================================
   DESKTOP PITCH RAIL
   ============================================================ */
function pitchRail(cv) {
  return `<div class="pitch">
    <span class="eyebrow">Gijima Innovation Engine · Concept prototype</span>
    <h1>Vuka Uzenzele<span class="dot">.</span><span class="zulu">“Rise up &amp; do it for yourself”</span></h1>
    <p class="lead">A free, mobile-first platform that turns everyday informal work into a verified track record — and a real pathway into formal employment for South Africa's youth.</p>
    <p class="tag">“Start with no CV. Let your work write it for you — then let it open real doors.”</p>
    <ul class="usp">
      <li><span class="dotmark">🪜</span><div><b>The opportunity ladder.</b> A strong, verified profile unlocks better and more <b>formal</b> jobs — cashier, security, call-centre — no matric needed.</div></li>
      <li><span class="dotmark">🧾</span><div><b>Auto-built verified CV.</b> Every completed job adds a real, referenced entry. Try it: apply → complete → watch it write itself.</div></li>
      <li><span class="dotmark">🎯</span><div><b>Wider than cleaning.</b> 8 gig types + a growing board of formal roles, vs rivals' narrow focus.</div></li>
      <li><span class="dotmark">🛡️</span><div><b>Trust by design.</b> ID verification, two-way reviews, one-tap safety flag.</div></li>
      <li><span class="dotmark">⚖️</span><div><b>Fair pay built in.</b> Every gig checked against SA minimum wage (R28.79/hr).</div></li>
    </ul>
    <p class="credits">
      <span class="gijmark"><span class="gd"></span>Gijima</span> · Prototype for Sabelo Duma · 2026<br>
      Demo tip: complete one gig and watch Thandeka climb from <b>${cv.tier.name}</b> — unlocking formal jobs.
    </p>
  </div>`;
}

/* ============================================================
   WORKER — HOME
   ============================================================ */
function workerHome(cv) {
  const featured = JOBS.slice(0, 3);
  return `
    ${roleSwitch()}
    <div class="appbar">
      <div class="hello"><small>Sawubona 👋</small><h2>${ME.name.split(' ')[0]}, let's hustle<span class="dot">.</span></h2></div>
      <div class="avatar" style="background:${ME.color}">${ME.initials}<span class="vbadge">${ICON.shield}</span><span class="tierpin">${cv.tier.icon}</span></div>
    </div>
    <div class="zerorate"><span class="free">FREE DATA</span> Zero-rated — browsing &amp; applying costs you nothing 📶</div>
    <div class="pad">
      ${tierStrip(cv)}
      <div class="section-title"><h3>What are you good at?</h3></div>
      <div class="cats">
        ${CATEGORIES.map(c => `<div class="cat" data-cat="${c.id}"><div class="bubble" style="color:${c.color}">${c.icon}</div><span>${c.label}</span></div>`).join('')}
      </div>
      <div class="section-title"><h3>Gigs near you</h3><a data-tab="jobs" data-feed="gigs">See all →</a></div>
      ${featured.map(jobCard).join('')}
      <div class="section-title"><h3>Formal jobs</h3><a data-tab="jobs" data-feed="formal">See all →</a></div>
      ${formalTeaser(cv)}
    </div>`;
}

function roleSwitch() {
  return `<div class="roleswitch">
    <button class="${state.role==='worker'?'active':''}" data-role="worker">🙋 I want work</button>
    <button class="${state.role==='employer'?'active':''}" data-role="employer">💼 I need help</button>
  </div>`;
}

// Compact tier progress strip for the home screen
function tierStrip(cv) {
  const nextTxt = cv.nextTier
    ? `<b>${cv.jobsToGo === 0 ? 'Rating up' : cv.jobsToGo + ' more job' + (cv.jobsToGo>1?'s':'')}</b> to reach <b>${cv.nextTier.name}</b> ${cv.nextTier.icon}`
    : `You've reached the top tier 🎉`;
  return `<div class="card tiercard">
    <div class="tt">
      <div class="tico">${cv.tier.icon}</div>
      <div style="flex:1">
        <small>Your tier</small>
        <h3>${cv.tier.name} · <span style="opacity:.8;font-weight:600;font-size:14px">${unlockedFormalCount(cv.tier.id)} formal jobs unlocked</span></h3>
      </div>
      <button class="btn primary sm" data-tab="cv">Ladder</button>
    </div>
    <div class="nextline">${nextTxt}</div>
    <div class="track"><div class="fill" style="width:${cv.tierProgress}%"></div></div>
  </div>`;
}

function ringSVG(pct, colors = ['#0E355A', '#1273B8'], size = 132, stroke = 11, id = 'g') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#e6ebf2" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
  </svg>`;
}

function jobCard(j) {
  const c = cat(j.category);
  const total = j.hours * j.payPerHour;
  const fair = j.payPerHour >= MIN_WAGE_PER_HOUR;
  return `<div class="card job" data-job="${j.id}">
    <div class="top">
      <div class="icon" style="background:${c.color}22;color:${c.color}">${c.icon}</div>
      <div class="info"><h4>${j.title}</h4><div class="meta">${ICON.pin} ${j.location} · ${j.distanceKm} km</div></div>
      <div class="pay"><b>${money(total)}</b><small>${money(j.payPerHour)}/hr · ${j.hours}h</small></div>
    </div>
    <div class="foot"><div class="pillrow" style="margin:0">
      ${j.urgent ? `<span class="chip urgent">${ICON.bolt} Urgent</span>` : ''}
      ${fair ? `<span class="chip fair">${ICON.shield} Fair pay</span>` : ''}
      <span class="chip time">🗓 ${j.when}</span>
    </div></div>
  </div>`;
}

// Formal job card — locked or unlocked based on tier
function formalCard(f, cv) {
  const c = cat(f.category);
  const unlocked = f.minTier <= cv.tier.id;
  const reqTier = TIERS[f.minTier];
  const body = `
    <div class="top">
      <div class="icon" style="background:${c.color}22;color:${c.color}">${c.icon}</div>
      <div class="info">
        <h4>${f.title}</h4>
        <div class="type-line">${f.employer} · ${f.type}</div>
        <div class="meta">${ICON.pin} ${f.location} · ${f.distanceKm} km</div>
      </div>
      <div class="pay"><b style="font-size:14px">${f.salary.split('/')[0]}</b><small>${f.salary.includes('/') ? '/'+f.salary.split('/')[1] : ''}</small></div>
    </div>`;
  if (unlocked) {
    return `<div class="card job formal-card" data-formal="${f.id}">
      ${body}
      <div class="foot"><div class="pillrow" style="margin:0">
        <span class="chip formal">${ICON.shield} Formal</span>
        <span class="chip time">🎓 ${f.education.split('·')[0].trim()}</span>
      </div></div>
    </div>`;
  }
  // locked
  const jobsNeeded = Math.max(0, reqTier.minJobs - cv.jobsDone);
  const span = reqTier.minJobs - cv.tier.minJobs;
  const prog = span > 0 ? Math.min(100, Math.round(((cv.jobsDone - cv.tier.minJobs) / span) * 100)) : 0;
  return `<div class="card job formal-card locked" data-formal="${f.id}">
    <div class="lockmask">${body}</div>
    <div class="lockbar">
      <span class="lk">${ICON.lock}</span>
      <div class="txt">Unlocks at <b>${reqTier.name} ${reqTier.icon}</b> — ${jobsNeeded>0?`${jobsNeeded} more good job${jobsNeeded>1?'s':''}`:'raise your rating'} to go
        <div class="mini-track"><div class="mini-fill" style="width:${prog}%"></div></div>
      </div>
    </div>
  </div>`;
}

function formalTeaser(cv) {
  const locked = FORMAL_JOBS.filter(f => f.minTier > cv.tier.id);
  const next = locked[0] || FORMAL_JOBS[FORMAL_JOBS.length - 1];
  return formalCard(next, cv);
}

/* ============================================================
   WORKER — JOBS FEED (segmented: Gigs / Formal)
   ============================================================ */
function jobsFeed(cv) {
  const isGigs = state.feed === 'gigs';
  return `
    <div class="appbar"><div class="hello"><small>${isGigs ? JOBS.length + ' gigs near Soweto' : FORMAL_JOBS.length + ' formal roles'}</small><h2>Find work<span class="dot">.</span></h2></div></div>
    <div class="pad">
      <div class="segment">
        <button class="${isGigs?'active':''}" data-feed="gigs">🔥 Gigs <span class="cnt">${JOBS.length}</span></button>
        <button class="${!isGigs?'active':''}" data-feed="formal">🏢 Formal jobs <span class="cnt">${FORMAL_JOBS.length}</span></button>
      </div>
      ${isGigs ? gigsList() : formalList(cv)}
    </div>`;
}

function gigsList() {
  return `
    <div class="cats" style="margin-bottom:6px">
      <div class="cat"><div class="bubble" style="color:var(--gj-red);border-color:var(--gj-red)">🔥</div><span>All</span></div>
      ${CATEGORIES.map(c => `<div class="cat" data-cat="${c.id}"><div class="bubble" style="color:${c.color}">${c.icon}</div><span>${c.label}</span></div>`).join('')}
    </div>
    ${JOBS.map(jobCard).join('')}
    <p class="note">New gigs are posted every day. Every completed gig builds your CV and pushes you up the ladder. 🪜</p>`;
}

function formalList(cv) {
  const unlocked = FORMAL_JOBS.filter(f => f.minTier <= cv.tier.id);
  const locked = FORMAL_JOBS.filter(f => f.minTier > cv.tier.id);
  return `
    <div class="card" style="padding:13px 15px;margin-bottom:12px;display:flex;gap:10px;align-items:center;background:#eaf3fb;border-color:#cfe3f5">
      <span style="font-size:20px">🪜</span>
      <div style="font-size:12.5px;color:var(--gj-navy);line-height:1.4"><b>You're ${cv.tier.name} ${cv.tier.icon}.</b> ${unlocked.length} formal job${unlocked.length!==1?'s':''} open to you now${locked.length?` · ${locked.length} more unlock as you rise`:''}.</div>
    </div>
    ${unlocked.length ? `<div class="section-title" style="margin-top:4px"><h3>Open to you now</h3></div>${unlocked.map(f => formalCard(f, cv)).join('')}` : ''}
    ${locked.length ? `<div class="section-title"><h3>Unlock as you rise</h3></div>${locked.map(f => formalCard(f, cv)).join('')}` : ''}
    <p class="note">Formal employers hire straight from Vuka's higher tiers — your verified record is your application. ⚖️ All pay is fair-pay checked.</p>`;
}

/* ============================================================
   JOB DETAIL (informal gig) — apply / complete
   ============================================================ */
function jobDetail(id) {
  const j = JOBS.find(x => x.id === id);
  if (!j) return '';
  const c = cat(j.category);
  const total = j.hours * j.payPerHour;
  const fairPct = Math.min(100, Math.round((j.payPerHour / (MIN_WAGE_PER_HOUR * 1.8)) * 100));
  const applied = state.appliedJobs.includes(j.id);
  return `
    <div class="detailtop"><button class="backbtn" data-back>${ICON.back}</button><h3>Gig details</h3></div>
    <div class="hero jobhero">
      <div class="eyebrow-l">${c.icon} ${c.label} · informal gig</div>
      <h2>${j.title}</h2>
      <div class="sub">${ICON.pin} ${j.location} · ${j.distanceKm} km away · ${j.when}</div>
      <div class="paybox">
        <div class="pcell"><small>You'll earn</small><b>${money(total)}</b></div>
        <div class="pcell"><small>Rate</small><b>${money(j.payPerHour)}/hr</b></div>
        <div class="pcell"><small>Time</small><b>${j.hours} hrs</b></div>
      </div>
    </div>
    <div class="detail-block">
      <div class="fairmeter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b style="font-size:13px;color:var(--gj-navy)">${ICON.shield} Fair Pay check</b>
          <span class="chip fair">${j.payPerHour >= MIN_WAGE_PER_HOUR ? 'Above minimum wage' : 'Below minimum'}</span>
        </div>
        <div class="track"><div class="fill" style="width:${fairPct}%"></div></div>
        <div class="lbls"><span>SA min R${MIN_WAGE_PER_HOUR}/hr</span><span>${money(j.payPerHour)}/hr</span></div>
      </div>
      <p>${j.description}</p>
    </div>
    <div class="detail-block" style="border-top:1px solid var(--line)">
      <div class="kv"><span class="k">Posted by</span><span class="v" style="display:flex;align-items:center;gap:8px"><span class="avatar sm" style="background:${c.color}">${j.employerInitials}</span>${j.employer}</span></div>
      <div class="kv"><span class="k">Employer rating</span><span class="v"><span class="stars">${'★'.repeat(Math.round(j.employerRating))}</span> ${j.employerRating.toFixed(1)}</span></div>
      <div class="kv"><span class="k">Safety</span><span class="v" style="color:var(--gj-info)">${ICON.shield} ID-verified employer</span></div>
    </div>
    <div class="sticky-cta">
      ${applied
        ? `<button class="btn gold block" data-complete="${j.id}">✅ Mark gig as complete</button>
           <p class="note" style="padding:8px 0 0">You applied! In the real app the employer confirms — for the demo, tap above to finish and watch your CV + tier update.</p>`
        : `<button class="btn primary block" data-apply="${j.id}">Apply for this gig — it's free</button>`}
    </div>`;
}

/* ============================================================
   FORMAL JOB DETAIL — tier-gated
   ============================================================ */
function formalDetail(id, cv) {
  const f = FORMAL_JOBS.find(x => x.id === id);
  if (!f) return '';
  const c = cat(f.category);
  const unlocked = f.minTier <= cv.tier.id;
  const reqTier = TIERS[f.minTier];
  return `
    <div class="detailtop"><button class="backbtn" data-back>${ICON.back}</button><h3>Formal job</h3></div>
    <div class="hero formalhero">
      <div class="eyebrow-l">🏢 ${f.employer} · ${f.type}</div>
      <h2>${f.title}</h2>
      <div class="sub">${ICON.pin} ${f.location} · ${f.distanceKm} km away</div>
      <div class="paybox">
        <div class="pcell"><small>Pay</small><b style="font-size:14px">${f.salary}</b></div>
        <div class="pcell"><small>Type</small><b style="font-size:14px">${f.type}</b></div>
      </div>
    </div>
    <div class="detail-block">
      <div class="kv"><span class="k">Education</span><span class="v">🎓 ${f.education}</span></div>
      <div class="kv"><span class="k">Access</span><span class="v" style="color:${unlocked?'var(--gj-success)':'var(--gj-seal)'}">${unlocked?ICON.check+' Open to you ('+cv.tier.name+')':ICON.lock+' '+reqTier.name+' tier '+reqTier.icon+' required'}</span></div>
    </div>
    <div class="detail-block" style="border-top:1px solid var(--line)">
      <p>${f.description}</p>
      <div class="perklist">
        ${f.perks.map(p => `<div class="perk"><span class="pk">${ICON.check}</span>${p}</div>`).join('')}
      </div>
    </div>
    ${unlocked ? '' : lockExplainer(f, cv, reqTier)}
    <div class="sticky-cta">
      ${unlocked
        ? `<button class="btn navy block" data-applyformal="${f.id}">Apply with my verified CV</button>
           <p class="note" style="padding:8px 0 0">Your Vuka CV, references and tier are sent as your application — no paperwork.</p>`
        : `<button class="btn primary block" data-tab="cv">${ICON.ladder} See how to unlock this</button>`}
    </div>`;
}

function lockExplainer(f, cv, reqTier) {
  const jobsNeeded = Math.max(0, reqTier.minJobs - cv.jobsDone);
  return `<div class="detail-block" style="border-top:1px solid var(--line)">
    <div class="card tiercard" style="margin:0">
      <div class="tt"><div class="tico">${ICON.lock}</div><div style="flex:1"><small>Locked</small><h3>Reach ${reqTier.name} ${reqTier.icon}</h3></div></div>
      <div class="reqs">
        <div class="req ${cv.jobsDone>=reqTier.minJobs?'met':''}"><small>Jobs done</small><b>${cv.jobsDone}/${reqTier.minJobs}</b></div>
        <div class="req ${cv.avg>=reqTier.minRating?'met':''}"><small>Rating</small><b>${cv.avg.toFixed(1)}/${reqTier.minRating.toFixed(1)}</b></div>
        <div class="req ${cv.flags<=reqTier.maxFlags?'met':''}"><small>Safety flags</small><b>${cv.flags}</b></div>
      </div>
      <div class="nextline" style="margin-bottom:0">${jobsNeeded>0?`Complete <b>${jobsNeeded} more good job${jobsNeeded>1?'s':''}</b> and keep your rating up — this role is then yours to apply for.`:`Lift your average rating to <b>${reqTier.minRating.toFixed(1)}★</b> to unlock.`}</div>
    </div>
  </div>`;
}

/* ============================================================
   CV + CAREER LADDER SCREEN (the concept's home)
   ============================================================ */
function cvScreen(cv) {
  const skillLabels = ME.skills.map(s => cat(s).label);
  return `
    <div class="appbar"><div class="hello"><small>Auto-generated · always up to date</small><h2>My CV &amp; ladder<span class="dot">.</span></h2></div></div>
    <div class="pad">
      <!-- Reputation ring -->
      <div class="card repcard">
        <div class="ring">${ringSVG(cv.rep, cv.tier.ring, 132, 11, 'repg')}<div class="mid"><b>${cv.rep}</b><small>Rep score</small></div></div>
        <div class="repstats">
          <div><b>${cv.jobsDone}</b><span>Jobs done</span></div>
          <div><b>${cv.avg.toFixed(1)}★</b><span>Rating</span></div>
          <div><b>${money(cv.totalEarned)}</b><span>Earned</span></div>
        </div>
      </div>

      <!-- Tier progress -->
      ${tierCardFull(cv)}

      <!-- The ladder -->
      <div class="section-title"><h3>Your opportunity ladder</h3></div>
      <div class="card ladder">
        ${TIERS.map(t => ladderRung(t, cv)).join('')}
      </div>

      <!-- Badges -->
      <div class="section-title"><h3>Badges</h3><span style="font-size:12px;color:var(--muted)">${cv.earned.size}/${BADGES.length} earned</span></div>
      <div class="badges">
        ${BADGES.map(b => `<div class="badge ${cv.earned.has(b.id)?'':'locked'}" title="${b.desc}"><div class="b-ic">${b.icon}</div><b>${b.label}</b></div>`).join('')}
      </div>

      <!-- The generated CV document -->
      <div class="section-title"><h3>Your CV document</h3></div>
      <div class="card cvdoc">
        <div class="cvhead">
          <h3>${ME.name}</h3>
          <p>${ME.location} · Age ${ME.age} · ${ME.education} · Member since ${ME.joined}</p>
          ${ME.idVerified ? `<span class="verline">${ICON.shield} Identity verified · ${cv.tier.name} tier · ${cv.jobsDone} verified references</span>` : ''}
        </div>
        <div class="cvbody">
          <h5>About me</h5>
          <p style="margin:0;font-size:13.5px;color:var(--ink-soft);line-height:1.5">${ME.bio}</p>
          <h5>Skills</h5>
          <div class="skillpills">${skillLabels.map(s => `<span class="skillpill">${s}</span>`).join('')}</div>
          <h5>Verified work history</h5>
          ${cv.jobsDone === 0
            ? `<p class="note" style="text-align:left;padding:0">No jobs yet — complete your first gig and it appears here automatically. 🌱</p>`
            : ME.history.slice().reverse().map(cvEntry).join('')}
        </div>
      </div>

      <button class="btn navy block" data-share>📄 Download / share my CV</button>
      <p class="note">This CV was built automatically from real, completed jobs and verified references — no writing required.</p>
    </div>`;
}

function tierCardFull(cv) {
  if (!cv.nextTier) {
    return `<div class="card tiercard">
      <div class="tt"><div class="tico">${cv.tier.icon}</div><div style="flex:1"><small>Your tier · top of the ladder</small><h3>${cv.tier.name}</h3></div></div>
      <div class="nextline" style="margin-bottom:0">You're in the top 5% — employers see you first, and every formal job is open to you. 🎉</div>
    </div>`;
  }
  const n = cv.nextTier;
  return `<div class="card tiercard">
    <div class="tt"><div class="tico">${cv.tier.icon}</div><div style="flex:1"><small>Your tier</small><h3>${cv.tier.name}</h3></div>
      <div style="text-align:right"><small style="color:rgba(255,255,255,.7);font-size:11px">NEXT</small><div style="font-weight:700">${n.icon} ${n.name}</div></div></div>
    <div class="nextline">Reach <b>${n.name}</b> to unlock: ${n.unlocks}</div>
    <div class="track"><div class="fill" style="width:${cv.tierProgress}%"></div></div>
    <div class="reqs">
      <div class="req ${cv.jobsDone>=n.minJobs?'met':''}"><small>Jobs</small><b>${cv.jobsDone}/${n.minJobs}</b></div>
      <div class="req ${cv.ratingOk?'met':''}"><small>Rating</small><b>${cv.avg.toFixed(1)}/${n.minRating.toFixed(1)}</b></div>
      <div class="req ${!cv.flagBlocked?'met':''}"><small>No flags</small><b>${cv.flags===0?'✓':cv.flags}</b></div>
    </div>
  </div>`;
}

function ladderRung(t, cv) {
  const reached = cv.tier.id >= t.id;
  const current = cv.tier.id === t.id;
  return `<div class="rung ${reached?'reached':'locked'} ${current?'current':''}">
    <div class="r-node" style="${current?`background:${t.color};color:#fff;border-color:${t.color}`:''}">${reached?t.icon:ICON.lock}</div>
    <div class="r-body">
      <div class="r-head"><h4>${t.name}</h4>${current?'<span class="pillnow">You are here</span>':''}
        ${!reached?`<span style="font-size:11px;color:var(--subtle);font-weight:700;margin-left:auto">${t.minJobs}+ jobs · ${t.minRating.toFixed(1)}★</span>`:''}</div>
      <div class="r-un">${t.unlocks}</div>
    </div>
  </div>`;
}

function cvEntry(j) {
  const c = cat(j.category);
  return `<div class="cvjob">
    <div class="r"><b>${j.jobTitle}</b><span class="date">${j.date}</span></div>
    <div style="font-size:12px;color:var(--muted);margin-top:1px">${c.icon} ${c.label} · ${j.hours}h · <span class="stars">${'★'.repeat(j.rating)}${'☆'.repeat(5-j.rating)}</span></div>
    <div class="quote">“${j.review}”</div>
    <div class="ref"><span class="vtick">${ICON.shield}</span> Verified reference — ${j.employer}</div>
  </div>`;
}

/* ============================================================
   WORKER — PROFILE
   ============================================================ */
function workerProfile(cv) {
  return `
    ${roleSwitch()}
    <div class="appbar"><div class="hello"><small>Your account</small><h2>Profile<span class="dot">.</span></h2></div></div>
    <div class="pad">
      <div class="card" style="padding:20px;text-align:center;margin-bottom:14px">
        <div class="avatar lg" style="background:${ME.color};margin:0 auto 10px">${ME.initials}<span class="vbadge">${ICON.shield}</span><span class="tierpin">${cv.tier.icon}</span></div>
        <h3 style="margin:0;font-size:19px;color:var(--gj-navy)">${ME.name}</h3>
        <p style="margin:3px 0 0;color:var(--muted);font-size:13px">${ICON.pin} ${ME.location} · Age ${ME.age} · ${ME.education}</p>
        <div class="pillrow" style="justify-content:center;margin-top:10px">
          <span class="tierbadge" style="background:${cv.tier.color}">${cv.tier.icon} ${cv.tier.name}</span>
          <span class="chip fair">${ICON.shield} ID Verified</span>
          <span class="chip time">⭐ ${cv.avg.toFixed(1)} rating</span>
        </div>
      </div>
      ${settingRow('🪜','My opportunity ladder',`${cv.tier.name} · ${unlockedFormalCount(cv.tier.id)} formal jobs unlocked`,'cv')}
      ${settingRow('🔔','Job alerts','Get notified of new gigs & unlocks near you')}
      ${settingRow('📶','Data saver','On — zero-rated mode active')}
      ${settingRow('🪪','Identity','Verified with SA ID ✅')}
      ${settingRow('💳','Get paid','Instant EFT / cash on completion')}
      ${settingRow('🛡️','Safety centre','Report, block & emergency contacts')}
      ${settingRow('🌍','Language','English · isiZulu · Sesotho · Afrikaans')}
      <p class="note">Prototype account — Thandeka Mokoena. Data resets on refresh.</p>
    </div>`;
}
function settingRow(ic, title, sub, tab) {
  return `<div class="card setting" ${tab?`data-tab="${tab}"`:''} style="${tab?'cursor:pointer':''}">
    <div class="s-ic">${ic}</div>
    <div class="s-t"><b>${title}</b><div>${sub}</div></div>
    <div class="s-chev">${ICON.chev}</div>
  </div>`;
}

/* ============================================================
   EMPLOYER SIDE
   ============================================================ */
function employerHome() {
  const top = WORKERS.slice(0, 3);
  return `
    ${roleSwitch()}
    <div class="appbar"><div class="hello"><small>Need a hand today?</small><h2>Find trusted help<span class="dot">.</span></h2></div>
      <div class="avatar" style="background:var(--gj-navy)">You</div></div>
    <div class="zerorate alt"><span class="free">SAFE</span> Every worker is ID-verified with a real, reviewed CV and an earned tier 🛡️</div>
    <div class="pad">
      <div class="card" style="padding:16px;margin-bottom:14px;background:linear-gradient(150deg,#faf5ff,#fff)">
        <b style="font-size:15px;color:var(--gj-navy)">Post a job in 30 seconds</b>
        <p style="font-size:13px;color:var(--muted);margin:4px 0 12px;line-height:1.45">Describe what you need. Verified youth nearby apply — you pick by rating, reviews and tier.</p>
        <button class="btn navy block" data-tab="post">${ICON.plus} Post a job</button>
      </div>
      <div class="section-title"><h3>Top-rated near you</h3><a data-tab="talent">Browse all →</a></div>
      ${top.map(workerCard).join('')}
    </div>`;
}

function talentScreen() {
  return `
    <div class="appbar"><div class="hello"><small>${WORKERS.length} verified workers in Soweto</small><h2>Browse talent<span class="dot">.</span></h2></div></div>
    <div class="pad">
      <div class="cats" style="margin-bottom:6px">
        <div class="cat"><div class="bubble" style="color:var(--gj-navy);border-color:var(--gj-navy)">👥</div><span>All</span></div>
        ${CATEGORIES.map(c => `<div class="cat"><div class="bubble" style="color:${c.color}">${c.icon}</div><span>${c.label}</span></div>`).join('')}
      </div>
      ${WORKERS.map(workerCard).join('')}
    </div>`;
}

function workerCard(w) {
  const t = TIERS[w.tier];
  return `<div class="card wcard" data-worker="${w.id}">
    <div class="avatar" style="background:${w.color}">${w.initials}${w.idVerified?`<span class="vbadge">${ICON.shield}</span>`:''}</div>
    <div class="info">
      <h4>${w.name}${w.idVerified?` <span style="color:var(--gj-info)">${ICON.shield}</span>`:''}</h4>
      <div class="tl">${w.tagline}</div>
      <div class="mini"><span class="tierbadge" style="background:${t.color}">${t.icon} ${t.name}</span> ${w.skills.map(s => `<span class="mini-b" title="${cat(s).label}">${cat(s).icon}</span>`).join('')}</div>
    </div>
    <div class="rt"><b>${w.rating.toFixed(1)}★</b><small>${w.jobsDone} jobs</small></div>
  </div>`;
}

function workerDetail(id) {
  const w = WORKERS.find(x => x.id === id);
  if (!w) return '';
  const t = TIERS[w.tier];
  return `
    <div class="detailtop"><button class="backbtn" data-back>${ICON.back}</button><h3>Worker profile</h3></div>
    <div class="hero" style="background:linear-gradient(150deg,${w.color},${w.color}cc)">
      <div class="avatar lg" style="background:rgba(255,255,255,.25)">${w.initials}</div>
      <h2>${w.name} ${w.idVerified?`<span style="font-size:16px">${ICON.shield}</span>`:''}</h2>
      <div class="sub">${ICON.pin} ${w.location} · Age ${w.age}</div>
      <div class="paybox">
        <div class="pcell"><small>Tier</small><b style="font-size:14px">${t.icon} ${t.name}</b></div>
        <div class="pcell"><small>Rating</small><b>${w.rating.toFixed(1)}★</b></div>
        <div class="pcell"><small>Jobs</small><b>${w.jobsDone}</b></div>
      </div>
    </div>
    <div class="detail-block"><p>${w.tagline}</p></div>
    <div class="detail-block" style="border-top:1px solid var(--line)">
      <b style="font-size:13px;color:var(--gj-navy)">Skills</b>
      <div class="skillpills" style="margin-top:8px">${w.skills.map(s=>`<span class="skillpill">${cat(s).icon} ${cat(s).label}</span>`).join('')}</div>
      <b style="font-size:13px;display:block;margin-top:16px;color:var(--gj-navy)">Badges earned</b>
      <div class="badges" style="margin-top:8px">${BADGES.filter(b=>w.badges.includes(b.id)).map(b=>`<div class="badge"><div class="b-ic">${b.icon}</div><b>${b.label}</b></div>`).join('')}</div>
    </div>
    <div class="sticky-cta"><button class="btn navy block" data-book="${w.id}">Book ${w.name.split(' ')[0]}</button></div>`;
}

function postJobScreen() {
  return `
    <div class="appbar"><div class="hello"><small>Reach verified youth nearby</small><h2>Post a job<span class="dot">.</span></h2></div></div>
    <div class="pad">
      <div class="formrow"><label>What do you need?</label><input id="pj-title" placeholder="e.g. Wash my car this Saturday"></div>
      <div class="formrow"><label>Category</label><select id="pj-cat">${CATEGORIES.map(c=>`<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}</select></div>
      <div class="formrow" style="display:flex;gap:10px">
        <div style="flex:1"><label>Hours</label><input id="pj-hrs" type="number" value="2" min="1"></div>
        <div style="flex:1"><label>Rate /hr</label><input id="pj-rate" type="number" value="50" min="1"></div>
      </div>
      <div class="formrow"><label>Where</label><input id="pj-loc" placeholder="Suburb, e.g. Diepkloof" value="Soweto"></div>
      <div id="pj-fair"></div>
      <button class="btn navy block" data-postjob style="margin-top:6px">Post job — it's free to post</button>
      <p class="note">We auto-check your rate against SA minimum wage so youth are always paid fairly. ⚖️</p>
    </div>`;
}

function employerProfile() {
  return `
    ${roleSwitch()}
    <div class="appbar"><div class="hello"><small>Your account</small><h2>Profile<span class="dot">.</span></h2></div></div>
    <div class="pad">
      <div class="card" style="padding:20px;text-align:center;margin-bottom:14px">
        <div class="avatar lg" style="background:var(--gj-navy);margin:0 auto 10px">You</div>
        <h3 style="margin:0;font-size:19px;color:var(--gj-navy)">Employer account</h3>
        <p style="margin:3px 0 0;color:var(--muted);font-size:13px">Post jobs · hire verified youth</p>
      </div>
      ${settingRow('🪪','Verify your identity','Builds trust with workers')}
      ${settingRow('⭐','Your employer rating','5.0 — workers rate you too')}
      ${settingRow('🧾','Past jobs & payments','View history')}
      ${settingRow('🛡️','Safety centre','Report a concern')}
      <p class="note">Two-way reviews keep everyone accountable — workers rate employers too.</p>
    </div>`;
}

/* ============================================================
   TAB BAR
   ============================================================ */
function renderTabBar() {
  const tabs = state.role === 'worker'
    ? [['home','Home',ICON.home],['jobs','Jobs',ICON.jobs],['__center','',ICON.plus],['cv','Ladder',ICON.ladder],['profile','Me',ICON.user]]
    : [['home','Home',ICON.home],['talent','Talent',ICON.talent],['__center','',ICON.plus],['post','Post',ICON.jobs],['profile','Me',ICON.user]];
  return `<div class="tabbar">
    ${tabs.map(([id,label,ic]) => {
      if (id === '__center') {
        const target = state.role === 'worker' ? 'jobs' : 'post';
        return `<button class="tab center" data-tab="${target}"><span class="fab">${ic}</span></button>`;
      }
      return `<button class="tab ${state.tab===id?'active':''}" data-tab="${id}">${ic}<span>${label}</span></button>`;
    }).join('')}
  </div>`;
}

/* ============================================================
   EVENTS
   ============================================================ */
function bindTabs() {
  document.querySelectorAll('[data-tab]').forEach(el => el.addEventListener('click', () => {
    if (el.dataset.feed) state.feed = el.dataset.feed;
    state.route = null; state.tab = el.dataset.tab; render();
  }));
  document.querySelectorAll('[data-role]').forEach(el => el.addEventListener('click', () => {
    state.role = el.dataset.role; state.tab = 'home'; state.route = null; render();
  }));
}

function bindView() {
  document.querySelectorAll('[data-job]').forEach(el => el.addEventListener('click', () => { state.route = { name:'job', params:{ id: el.dataset.job } }; render(); }));
  document.querySelectorAll('[data-formal]').forEach(el => el.addEventListener('click', () => { state.route = { name:'formal', params:{ id: el.dataset.formal } }; render(); }));
  document.querySelectorAll('[data-worker]').forEach(el => el.addEventListener('click', () => { state.route = { name:'worker', params:{ id: el.dataset.worker } }; render(); }));
  document.querySelectorAll('[data-back]').forEach(el => el.addEventListener('click', () => { state.route = null; render(); }));

  // feed segment (within jobs tab, no tab change)
  document.querySelectorAll('.segment [data-feed]').forEach(el => el.addEventListener('click', () => { state.feed = el.dataset.feed; render(); }));

  document.querySelectorAll('[data-apply]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.apply;
    if (!state.appliedJobs.includes(id)) state.appliedJobs.push(id);
    toast('Applied! 🎉 The employer will be in touch.'); render();
  }));
  document.querySelectorAll('[data-complete]').forEach(el => el.addEventListener('click', () => openReviewSheet(el.dataset.complete)));
  document.querySelectorAll('[data-applyformal]').forEach(el => el.addEventListener('click', () => {
    const f = FORMAL_JOBS.find(x => x.id === el.dataset.applyformal);
    toast(`Application sent to ${f.employer} with your verified CV 📄`);
  }));
  document.querySelectorAll('[data-share]').forEach(el => el.addEventListener('click', () => toast('CV link copied — ready to share with any employer 📄')));
  document.querySelectorAll('[data-book]').forEach(el => el.addEventListener('click', () => toast('Request sent! They\'ll confirm shortly. 🤝')));
  document.querySelectorAll('[data-cat]').forEach(el => el.addEventListener('click', () => {
    if (state.role === 'worker') { state.tab='jobs'; state.feed='gigs'; state.route=null; render(); toast('Showing ' + cat(el.dataset.cat).label + ' gigs'); }
  }));

  const rate = $('#pj-rate');
  if (rate) { const upd = () => { const f=$('#pj-fair'); const v=+rate.value||0;
      f.innerHTML = `<div class="chip ${v>=MIN_WAGE_PER_HOUR?'fair':'urgent'}" style="margin-bottom:12px">${v>=MIN_WAGE_PER_HOUR?ICON.shield+' Fair pay — above SA minimum':'⚠ Below SA minimum wage (R'+MIN_WAGE_PER_HOUR+'/hr)'}</div>`; };
    rate.addEventListener('input', upd); upd();
  }
  const postBtn = document.querySelector('[data-postjob]');
  if (postBtn) postBtn.addEventListener('click', () => {
    const title = $('#pj-title').value.trim();
    if (!title) { toast('Give your job a title first ✍️'); return; }
    toast('Job posted! Verified youth nearby can now apply 🚀');
    state.role='employer'; state.tab='home'; render();
  });
}

/* ============================================================
   REVIEW FLOW → writes CV, may trigger a TIER-UP
   ============================================================ */
let reviewPick = 5;
function openReviewSheet(jobId) {
  const j = JOBS.find(x => x.id === jobId);
  if (!j) return;
  reviewPick = 5;
  const sheet = $('#sheet');
  sheet.className = 'sheet-wrap open';
  sheet.innerHTML = `
    <div class="sheet-scrim" data-close></div>
    <div class="sheet">
      <div class="grab"></div>
      <h3>How was the gig?</h3>
      <p class="s-sub">Rate <b>${j.employer}</b> for “${j.title}”. They rate you too — that's what builds your CV and lifts your tier.</p>
      <div class="ratepick" id="ratepick">${[1,2,3,4,5].map(n => `<span data-star="${n}" class="${n<=reviewPick?'on':''}">⭐</span>`).join('')}</div>
      <div class="safety-row">
        <input type="checkbox" id="safety">
        <label for="safety"><b>I felt unsafe or something went wrong.</b> Flagging alerts our Safety team and is kept confidential. Your safety comes first.</label>
      </div>
      <button class="btn primary block" id="submitReview">Submit &amp; update my CV</button>
      <p class="note">Both reviews must be submitted before pay is released — keeping everyone honest.</p>
    </div>`;
  sheet.querySelector('[data-close]').addEventListener('click', closeSheet);
  sheet.querySelectorAll('[data-star]').forEach(s => s.addEventListener('click', () => {
    reviewPick = +s.dataset.star;
    sheet.querySelectorAll('[data-star]').forEach(x => x.classList.toggle('on', +x.dataset.star <= reviewPick));
  }));
  sheet.querySelector('#submitReview').addEventListener('click', () => completeJob(j));
}
function closeSheet() { const s = $('#sheet'); if (s) s.className = 'sheet-wrap'; }

function completeJob(j) {
  const flagged = $('#safety')?.checked;
  const before = computeCV();
  const reviews = {
    5: 'Excellent work — punctual, professional and went the extra mile. Highly recommend.',
    4: 'Good job overall, friendly and reliable. Happy to book again.',
    3: 'Job was done, room for improvement but fair effort.',
    2: 'Completed but a few issues. Communication could be better.',
    1: 'Did not meet expectations this time.',
  };
  ME.history.push({
    jobTitle: j.title, category: j.category, employer: j.employer, employerInitials: j.employerInitials,
    date: j.when.split('·')[0].trim() || 'Jul 2026', hours: j.hours, pay: Math.round(j.hours * j.payPerHour),
    rating: reviewPick, review: reviews[reviewPick], safetyFlag: !!flagged,
  });
  if (!ME.skills.includes(j.category)) ME.skills.push(j.category);
  const idx = JOBS.findIndex(x => x.id === j.id); if (idx > -1) JOBS.splice(idx, 1);
  state.appliedJobs = state.appliedJobs.filter(id => id !== j.id);

  const after = computeCV();
  const newBadges = [...after.earned].filter(b => !before.earned.has(b));
  const tieredUp = after.tier.id > before.tier.id;
  showCelebration(after, newBadges, flagged, tieredUp, before.tier);
}

function showCelebration(cv, newBadges, flagged, tieredUp, prevTier) {
  const sheet = $('#sheet');
  const badgeObjs = BADGES.filter(b => newBadges.includes(b.id));
  const newlyUnlocked = tieredUp ? (unlockedFormalCount(cv.tier.id) - unlockedFormalCount(prevTier.id)) : 0;
  sheet.className = 'sheet-wrap open';
  sheet.innerHTML = `
    <div class="confetti" id="confetti"></div>
    <div class="sheet-scrim" data-close></div>
    <div class="sheet">
      <div class="grab"></div>
      ${tieredUp ? `
        <div class="tierup-banner">
          <div class="tu-ic">${cv.tier.icon}</div>
          <h4>TIER UP — you're now ${cv.tier.name}!</h4>
          <p>${cv.tier.unlocks}</p>
          ${newlyUnlocked>0?`<div class="newjobs">🔓 ${newlyUnlocked} new formal job${newlyUnlocked>1?'s':''} unlocked</div>`:''}
        </div>` : `
        <div class="celebrate"><div class="big">🎉</div>
          <h3 style="text-align:center;margin-top:8px">Gig complete — CV updated!</h3>
          <p class="s-sub" style="text-align:center">A new verified reference just wrote itself into your CV. Reputation now <b>${cv.rep}/100</b>.</p>
        </div>`}
      <div class="card" style="padding:14px;display:flex;gap:14px;align-items:center;margin-bottom:14px">
        <div class="ring" style="width:60px;height:60px;flex:0 0 auto">${ringSVG(cv.rep, cv.tier.ring, 60, 7, 'celg')}<div class="mid"><b style="font-size:16px">${cv.rep}</b></div></div>
        <div style="flex:1"><b style="font-size:14px;color:var(--gj-navy)">${cv.jobsDone} jobs · ${cv.avg.toFixed(1)}★ · ${cv.tier.icon} ${cv.tier.name}</b>
          <div style="font-size:12px;color:var(--muted)">${money(cv.totalEarned)} earned · ${cv.nextTier?`${cv.jobsToGo>0?cv.jobsToGo+' job'+(cv.jobsToGo>1?'s':''):'rating'} to ${cv.nextTier.name}`:'top tier reached'}</div></div>
      </div>
      ${badgeObjs.length ? `
        <div style="text-align:center;margin-bottom:12px">
          <b style="font-size:13px;color:var(--gj-navy)">🏅 New badge${badgeObjs.length>1?'s':''} unlocked!</b>
          <div class="badges" style="grid-template-columns:repeat(${Math.min(badgeObjs.length,3)},1fr);margin-top:10px">
            ${badgeObjs.map(b=>`<div class="badge new"><div class="b-ic">${b.icon}</div><b>${b.label}</b></div>`).join('')}
          </div>
        </div>` : ''}
      ${flagged ? `<div class="safety-row" style="background:#fdecef;border-color:#f5c2cb"><span style="font-size:18px">🛡️</span><label style="color:#991b1b"><b>Safety flag received.</b> Our team will follow up privately. Thank you for speaking up — you're never penalised for reporting.</label></div>` : ''}
      <button class="btn navy block" id="seeCV">${tieredUp?'See what I unlocked →':'See my updated CV →'}</button>
    </div>`;
  sheet.querySelector('[data-close]').addEventListener('click', () => { closeSheet(); render(); });
  sheet.querySelector('#seeCV').addEventListener('click', () => {
    closeSheet(); state.role='worker'; state.route=null;
    if (tieredUp) { state.tab='jobs'; state.feed='formal'; } else { state.tab='cv'; }
    render();
  });
  spawnConfetti();
}

function spawnConfetti() {
  const box = $('#confetti'); if (!box) return;
  const colors = ['#F20023','#0E355A','#FBBF24','#1273B8','#18CE0F','#B45309'];
  for (let i = 0; i < 64; i++) {
    const s = document.createElement('i');
    s.style.left = ((i * 37) % 100) + '%';
    s.style.background = colors[i % colors.length];
    s.style.animationDuration = (1.6 + ((i % 7) * 0.18)) + 's';
    s.style.animationDelay = ((i % 11) * 0.06) + 's';
    if (i % 3 === 0) s.style.borderRadius = '999px';
    box.appendChild(s);
  }
  setTimeout(() => { if (box) box.innerHTML = ''; }, 3400);
}

// ---------- Boot ----------
render();
