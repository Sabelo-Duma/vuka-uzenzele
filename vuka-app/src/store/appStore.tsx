import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode,
} from 'react';
import type { CvSnapshot, FormalJob, Gig, HistoryEntry, Role, TalentWorker, WorkerProfile } from '../types';
import { api, ApiError, setToken, getToken, toTalentWorker, type ApiProfile, type ApiUser, type Applicant, type AuthResult, type Conversation, type CreateGigInput, type Hire, type Invitation, type Message, type MyJob, type RegisterInput, type Thread } from '../lib/api';
import { computeCv } from '../lib/engine';
import { applyServerConfig, minWagePerHour } from '../data/catalog';
import { resetBanking } from '../lib/banking';

export type Screen =
  | 'home' | 'jobs' | 'cv' | 'me'
  | 'talent' | 'post' | 'hires' | 'applicants'
  | 'gigDetail' | 'formalDetail' | 'workerDetail'
  | 'messages' | 'chat';

export interface Nav { screen: Screen; id?: string; }

type Status = 'booting' | 'anon' | 'authed';

export interface AppState {
  status: Status;
  dataLoading: boolean;       // true while gigs/talent/formal are being fetched after auth
  user: ApiUser | null;
  role: Role;
  worker: WorkerProfile;      // populated for worker sessions; placeholder otherwise
  gigs: Gig[];
  formalJobs: FormalJob[];
  appliedGigIds: string[];
  appliedFormalIds: string[]; // formal roles this worker has applied to (server-backed)
  myJobs: MyJob[];            // this worker's own work: hired / done / completed
  jobAlerts: boolean;         // account-level preference (drives push/SMS)
  /** Set when an employer confirms a job while the worker is in the app, so the
   *  CV growth is celebrated at the moment it actually becomes real. */
  celebrate: { before: CvSnapshot; after: CvSnapshot; jobTitle: string } | null;
  talent: TalentWorker[];
  invitations: Invitation[]; // pending job invitations for the signed-in worker
  unread: number;            // unread direct-message count (nav badge)
  /** Employer: jobs a worker has marked done that still need confirming. */
  pendingConfirmations: number;
  /** Fair-pay reference in force (server value once /api/config lands). */
  minWage: number;
  feed: 'gigs' | 'formal';
  categoryFilter: string | null; // active category filter on the jobs feed (null = All)
  nav: Nav;
  toast: { msg: string; n: number } | null;
  error: string | null;
}

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'ME';

function blankWorker(): WorkerProfile {
  return { name: '', age: 18, initials: '', location: '', education: '', bio: '', skills: [], idVerified: false, joined: '', color: '#0E355A', history: [] };
}

function buildWorker(name: string, profile: ApiProfile | null | undefined, history: HistoryEntry[] | undefined): WorkerProfile {
  return {
    name,
    age: profile?.age ?? 18,
    initials: initialsOf(name),
    location: profile?.location ?? '',
    education: profile?.education ?? '',
    bio: profile?.bio ?? '',
    skills: profile?.skills ?? [],
    idVerified: profile?.idVerified ?? false,
    joined: profile?.joined ?? '',
    color: profile?.color ?? '#0E355A',
    history: history ?? [],
  };
}

type Action =
  | { type: 'STATUS'; status: Status }
  | { type: 'DATA_LOADING'; loading: boolean }
  | { type: 'SESSION'; user: ApiUser; worker: WorkerProfile }
  | { type: 'WORKER'; worker: WorkerProfile }
  | { type: 'GIGS'; gigs: Gig[] }
  | { type: 'FORMAL'; formalJobs: FormalJob[] }
  | { type: 'APPLIED'; ids: string[] }
  | { type: 'APPLIED_FORMAL'; ids: string[] }
  | { type: 'MY_JOBS'; jobs: MyJob[] }
  | { type: 'CELEBRATE'; payload: AppState['celebrate'] }
  | { type: 'JOB_ALERTS'; on: boolean }
  | { type: 'CONFIG'; minWage: number }
  | { type: 'TALENT'; talent: TalentWorker[] }
  | { type: 'INVITATIONS'; invitations: Invitation[] }
  | { type: 'UNREAD'; count: number }
  | { type: 'PENDING_CONFIRMATIONS'; count: number }
  | { type: 'REMOVE_GIG'; id: string }
  | { type: 'LOGOUT' }
  | { type: 'NAVIGATE'; nav: Nav }
  | { type: 'SET_FEED'; feed: 'gigs' | 'formal' }
  | { type: 'SET_CATEGORY'; category: string | null }
  | { type: 'TOAST'; msg: string }
  | { type: 'ERROR'; error: string | null };

function init(): AppState {
  return {
    status: 'booting', dataLoading: false, user: null, role: 'worker', worker: blankWorker(),
    gigs: [], formalJobs: [], appliedGigIds: [], appliedFormalIds: [], myJobs: [], celebrate: null, jobAlerts: true,
    talent: [], invitations: [], unread: 0, pendingConfirmations: 0, minWage: minWagePerHour(),
    feed: 'gigs', categoryFilter: null, nav: { screen: 'home' }, toast: null, error: null,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'STATUS': return { ...state, status: action.status };
    case 'DATA_LOADING': return { ...state, dataLoading: action.loading };
    case 'SESSION': return { ...state, user: action.user, role: action.user.role, worker: action.worker, status: 'authed', dataLoading: true, nav: { screen: 'home' }, error: null };
    case 'WORKER': return { ...state, worker: action.worker };
    case 'GIGS': return { ...state, gigs: action.gigs };
    case 'FORMAL': return { ...state, formalJobs: action.formalJobs };
    case 'APPLIED': return { ...state, appliedGigIds: action.ids };
    case 'APPLIED_FORMAL': return { ...state, appliedFormalIds: action.ids };
    case 'MY_JOBS': return { ...state, myJobs: action.jobs };
    case 'CELEBRATE': return { ...state, celebrate: action.payload };
    case 'JOB_ALERTS': return { ...state, jobAlerts: action.on };
    // Re-render on the server's config so anything reading the thresholds
    // (fair-pay chips, lock states) picks up the authoritative values.
    case 'CONFIG': return { ...state, minWage: action.minWage };
    case 'TALENT': return { ...state, talent: action.talent };
    case 'INVITATIONS': return { ...state, invitations: action.invitations };
    case 'UNREAD': return { ...state, unread: action.count };
    case 'PENDING_CONFIRMATIONS': return { ...state, pendingConfirmations: action.count };
    case 'REMOVE_GIG': return { ...state, gigs: state.gigs.filter((g) => g.id !== action.id), appliedGigIds: state.appliedGigIds.filter((id) => id !== action.id) };
    case 'LOGOUT': return { ...init(), status: 'anon' };
    case 'NAVIGATE': return { ...state, nav: action.nav };
    case 'SET_FEED': return { ...state, feed: action.feed };
    case 'SET_CATEGORY': return { ...state, categoryFilter: action.category };
    case 'TOAST': return { ...state, toast: { msg: action.msg, n: (state.toast?.n ?? 0) + 1 } };
    case 'ERROR': return { ...state, error: action.error };
    default: return state;
  }
}

interface Store {
  state: AppState;
  navigate: (screen: Screen, id?: string) => void;
  setFeed: (feed: 'gigs' | 'formal') => void;
  setCategory: (category: string | null) => void;
  toast: (msg: string) => void;
  register: (input: RegisterInput) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  logout: () => void;
  applyGig: (id: string) => Promise<void>;
  applyFormal: (id: string) => Promise<void>;
  setJobAlerts: (on: boolean) => Promise<void>;
  /** Worker marks work done + rates the employer. Returns who must confirm it. */
  completeGig: (gigId: string, rating: number, safetyFlag: boolean) => Promise<{ awaitingConfirmationFrom: string }>;
  /** Employer: hire an applicant, then later confirm + rate their work. */
  hireWorker: (gigId: string, workerId: string) => Promise<void>;
  confirmWork: (applicationId: string, rating: number, review?: string) => Promise<void>;
  loadApplicants: (gigId: string) => Promise<{ gig: Gig; applicants: Applicant[] }>;
  loadMyHires: () => Promise<Hire[]>;
  dismissCelebration: () => void;
  postGig: (input: CreateGigInput) => Promise<void>;
  reloadTalent: () => Promise<void>;
  listMyGigs: () => Promise<Gig[]>;
  inviteWorker: (workerId: string, gigId: string, message?: string) => Promise<{ ok: boolean; already?: boolean }>;
  respondInvitation: (id: string, accept: boolean) => Promise<{ accepted: boolean; gigId: string }>;
  refreshUnread: () => Promise<void>;
  loadConversations: () => Promise<Conversation[]>;
  loadThread: (userId: string) => Promise<Thread>;
  sendMessage: (toUserId: string, body: string) => Promise<Message>;
  reloadData: () => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<Store | undefined>(undefined);

const DEMO = {
  worker: { phone: '0710000000', password: 'demo1234' },
  employer: { phone: '0720000000', password: 'demo1234' },
} as const;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const stateRef = useRef(state);
  stateRef.current = state;

  const loadWorkerData = useCallback(async () => {
    const [gigs, formalJobs, applications, formalApps, myJobs, invitations, prefs] = await Promise.all([
      api.listGigs(), api.listFormal(), api.listApplications(), api.listFormalApplications(),
      api.listMyJobs(), api.listInvitations(), api.getPreferences(),
    ]);
    dispatch({ type: 'GIGS', gigs });
    dispatch({ type: 'FORMAL', formalJobs });
    dispatch({ type: 'APPLIED', ids: applications.map((a) => a.gigId) });
    dispatch({ type: 'APPLIED_FORMAL', ids: formalApps.map((a) => a.jobId) });
    dispatch({ type: 'MY_JOBS', jobs: myJobs });
    dispatch({ type: 'INVITATIONS', invitations });
    dispatch({ type: 'JOB_ALERTS', on: prefs.jobAlerts });
  }, []);

  const loadEmployerData = useCallback(async () => {
    const [talent, formalJobs, prefs] = await Promise.all([api.listTalent(), api.listFormal(), api.getPreferences()]);
    dispatch({ type: 'TALENT', talent: talent.map(toTalentWorker) });
    dispatch({ type: 'FORMAL', formalJobs });
    dispatch({ type: 'JOB_ALERTS', on: prefs.jobAlerts });
  }, []);

  // Load the signed-in user's data. A failure here is a DATA problem (flaky
  // network, a single 500) — NOT an auth problem — so we surface a retryable
  // error and never throw, so callers can't mistake it for a bad session.
  const loadFor = useCallback(async (role: Role) => {
    dispatch({ type: 'DATA_LOADING', loading: true });
    try {
      if (role === 'worker') await loadWorkerData();
      else await loadEmployerData();
      dispatch({ type: 'ERROR', error: null });
    } catch {
      dispatch({ type: 'ERROR', error: "We couldn't load your latest data. Check your connection and retry." });
    } finally {
      dispatch({ type: 'DATA_LOADING', loading: false });
    }
  }, [loadWorkerData, loadEmployerData]);

  const establish = useCallback(async (result: AuthResult) => {
    const user = result.user;
    const worker = user.role === 'worker' ? buildWorker(user.name, result.profile, result.history) : blankWorker();
    dispatch({ type: 'SESSION', user, worker });
    await loadFor(user.role);
  }, [loadFor]);

  /** Retry loading data after a failure (used by the error banner). */
  const reloadData = useCallback(() => loadFor(stateRef.current.role), [loadFor]);

  // Adopt the server's engine config (fair-pay reference + tier/badge
  // thresholds). Public and cheap, so it runs before any sign-in. If it fails
  // we keep the bundled fallback — the app still works offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await api.getConfig();
        if (cancelled) return;
        applyServerConfig(cfg);
        dispatch({ type: 'CONFIG', minWage: minWagePerHour() });
      } catch { /* bundled defaults stand in */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Boot: resume a saved session if a token exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) { dispatch({ type: 'STATUS', status: 'anon' }); return; }
      try {
        const me = await api.me();
        if (cancelled) return;
        await establish(me);
      } catch (e) {
        if (cancelled) return;
        // Only a real auth failure (401) ends the session. A network error must
        // NOT delete the token — the user stays logged in and retries on reconnect.
        if (e instanceof ApiError && e.status === 401) setToken(null);
        dispatch({ type: 'STATUS', status: 'anon' });
      }
    })();
    return () => { cancelled = true; };
  }, [establish]);

  // Keep the unread-message badge fresh while signed in (light polling).
  useEffect(() => {
    if (state.status !== 'authed') return;
    let cancelled = false;
    const tick = async () => {
      try { const { count } = await api.unreadCount(); if (!cancelled) dispatch({ type: 'UNREAD', count }); } catch { /* offline */ }

      if (stateRef.current.role === 'employer') {
        // Work a worker has finished is money and a reference held up on the
        // employer's action — surface it as a badge, don't wait to be found.
        try {
          const hires = await api.listMyHires();
          if (!cancelled) dispatch({ type: 'PENDING_CONFIRMATIONS', count: hires.filter((h) => h.status === 'worker_done').length });
        } catch { /* offline */ }
        return;
      }
      // Keep a worker's pending invitations fresh without a full reload.
      try { const invitations = await api.listInvitations(); if (!cancelled) dispatch({ type: 'INVITATIONS', invitations }); } catch { /* offline */ }

      // A job is only really finished when the employer confirms it — which
      // happens on their phone, not this one. Watch for the CV growing so the
      // tier-up is celebrated at the moment it becomes true.
      try {
        const [cv, jobs] = await Promise.all([api.getCv(), api.listMyJobs()]);
        if (cancelled) return;
        const current = stateRef.current;
        const before = computeCv(current.worker);
        const justConfirmed = current.myJobs.find(
          (j) => j.status === 'worker_done' && jobs.find((n) => n.applicationId === j.applicationId)?.status === 'completed',
        );
        dispatch({ type: 'MY_JOBS', jobs });
        if (cv.history.length > current.worker.history.length) {
          const worker = buildWorker(current.user?.name ?? current.worker.name, cv.profile, cv.history);
          dispatch({ type: 'WORKER', worker });
          // Only celebrate a job this session was actually waiting on, so a
          // reload never replays an old one.
          if (justConfirmed) {
            dispatch({ type: 'CELEBRATE', payload: { before, after: computeCv(worker), jobTitle: justConfirmed.gig.title } });
          }
        }
      } catch { /* offline — try again on the next tick */ }
    };
    tick();
    const iv = setInterval(tick, 20000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [state.status]);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.register(input);
    setToken(res.token);
    await establish(res);
  }, [establish]);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await api.login(phone, password);
    setToken(res.token);
    await establish(res);
  }, [establish]);

  const demoLogin = useCallback(async (role: Role) => {
    const creds = DEMO[role];
    await login(creds.phone, creds.password);
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
    resetBanking(); // never let the next account see the previous one's payout row
    dispatch({ type: 'LOGOUT' });
  }, []);

  const applyGig = useCallback(async (id: string) => {
    await api.applyGig(id);
    const cur = stateRef.current.appliedGigIds;
    if (!cur.includes(id)) dispatch({ type: 'APPLIED', ids: [...cur, id] });
  }, []);

  const applyFormal = useCallback(async (id: string) => {
    await api.applyFormal(id);
    const cur = stateRef.current.appliedFormalIds;
    if (!cur.includes(id)) dispatch({ type: 'APPLIED_FORMAL', ids: [...cur, id] });
  }, []);

  // Optimistic, but rolled back if the server rejects it — a toggle that lies
  // about being saved is worse than one that flicks back.
  const setJobAlerts = useCallback(async (on: boolean) => {
    const previous = stateRef.current.jobAlerts;
    dispatch({ type: 'JOB_ALERTS', on });
    try {
      const prefs = await api.savePreferences({ jobAlerts: on });
      dispatch({ type: 'JOB_ALERTS', on: prefs.jobAlerts });
    } catch (e) {
      dispatch({ type: 'JOB_ALERTS', on: previous });
      throw e;
    }
  }, []);

  /**
   * The worker's half of finishing a job: mark it done and rate the employer.
   * The CV deliberately does NOT move here — the employer's confirmation writes
   * the reference, and `watchForConfirmations` below celebrates it when it lands.
   */
  const completeGig = useCallback(async (gigId: string, rating: number, safetyFlag: boolean) => {
    const result = await api.completeGig(gigId, rating, safetyFlag);
    dispatch({ type: 'REMOVE_GIG', id: gigId });
    try { dispatch({ type: 'MY_JOBS', jobs: await api.listMyJobs() }); } catch { /* refreshed on next poll */ }
    return { awaitingConfirmationFrom: result.awaitingConfirmationFrom };
  }, []);

  const hireWorker = useCallback(async (gigId: string, workerId: string) => {
    await api.hireWorker(gigId, workerId);
  }, []);

  const confirmWork = useCallback(async (applicationId: string, rating: number, review?: string) => {
    await api.confirmWork(applicationId, rating, review);
  }, []);

  const loadApplicants = useCallback((gigId: string) => api.listApplicants(gigId), []);
  const loadMyHires = useCallback(() => api.listMyHires(), []);

  const postGig = useCallback(async (input: CreateGigInput) => {
    await api.createGig(input);
  }, []);

  const reloadTalent = useCallback(async () => {
    const talent = await api.listTalent();
    dispatch({ type: 'TALENT', talent: talent.map(toTalentWorker) });
  }, []);

  const listMyGigs = useCallback(() => api.listMyGigs(), []);

  const inviteWorker = useCallback((workerId: string, gigId: string, message?: string) => api.inviteWorker(workerId, gigId, message), []);

  const respondInvitation = useCallback(async (id: string, accept: boolean) => {
    const res = await api.respondInvitation(id, accept);
    const cur = stateRef.current;
    dispatch({ type: 'INVITATIONS', invitations: cur.invitations.filter((i) => i.id !== id) });
    if (accept && !cur.appliedGigIds.includes(res.gigId)) dispatch({ type: 'APPLIED', ids: [...cur.appliedGigIds, res.gigId] });
    return { accepted: res.accepted, gigId: res.gigId };
  }, []);

  const refreshUnread = useCallback(async () => {
    try { const { count } = await api.unreadCount(); dispatch({ type: 'UNREAD', count }); } catch { /* offline — keep last */ }
  }, []);

  const loadConversations = useCallback(() => api.listConversations(), []);

  const loadThread = useCallback(async (userId: string) => {
    const thread = await api.getThread(userId); // server marks incoming as read
    refreshUnread();
    return thread;
  }, [refreshUnread]);

  const sendMessage = useCallback((toUserId: string, body: string) => api.sendMessage(toUserId, body), []);

  const value = useMemo<Store>(() => ({
    state,
    navigate: (screen, id) => dispatch({ type: 'NAVIGATE', nav: { screen, id } }),
    setFeed: (feed) => dispatch({ type: 'SET_FEED', feed }),
    setCategory: (category) => dispatch({ type: 'SET_CATEGORY', category }),
    toast: (msg) => dispatch({ type: 'TOAST', msg }),
    register, login, demoLogin, logout, applyGig, applyFormal, setJobAlerts, completeGig, postGig, reloadTalent, listMyGigs, inviteWorker, respondInvitation,
    hireWorker, confirmWork, loadApplicants, loadMyHires,
    dismissCelebration: () => dispatch({ type: 'CELEBRATE', payload: null }),
    refreshUnread, loadConversations, loadThread, sendMessage, reloadData,
    clearError: () => dispatch({ type: 'ERROR', error: null }),
  }), [state, register, login, demoLogin, logout, applyGig, applyFormal, setJobAlerts, completeGig, postGig, reloadTalent, listMyGigs, inviteWorker, respondInvitation, hireWorker, confirmWork, loadApplicants, loadMyHires, refreshUnread, loadConversations, loadThread, sendMessage, reloadData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): Store {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
