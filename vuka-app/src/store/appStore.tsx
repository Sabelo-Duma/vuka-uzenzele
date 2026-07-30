import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode,
} from 'react';
import type { CvSnapshot, FormalJob, Gig, HistoryEntry, Role, TalentWorker, WorkerProfile } from '../types';
import { api, setToken, getToken, toTalentWorker, type ApiProfile, type ApiUser, type AuthResult, type CreateGigInput, type RegisterInput } from '../lib/api';
import { computeCv } from '../lib/engine';

export type Screen =
  | 'home' | 'jobs' | 'cv' | 'me'
  | 'talent' | 'post'
  | 'gigDetail' | 'formalDetail' | 'workerDetail';

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
  talent: TalentWorker[];
  feed: 'gigs' | 'formal';
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
  | { type: 'TALENT'; talent: TalentWorker[] }
  | { type: 'REMOVE_GIG'; id: string }
  | { type: 'LOGOUT' }
  | { type: 'NAVIGATE'; nav: Nav }
  | { type: 'SET_FEED'; feed: 'gigs' | 'formal' }
  | { type: 'TOAST'; msg: string }
  | { type: 'ERROR'; error: string | null };

function init(): AppState {
  return {
    status: 'booting', dataLoading: false, user: null, role: 'worker', worker: blankWorker(),
    gigs: [], formalJobs: [], appliedGigIds: [], talent: [],
    feed: 'gigs', nav: { screen: 'home' }, toast: null, error: null,
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
    case 'TALENT': return { ...state, talent: action.talent };
    case 'REMOVE_GIG': return { ...state, gigs: state.gigs.filter((g) => g.id !== action.id), appliedGigIds: state.appliedGigIds.filter((id) => id !== action.id) };
    case 'LOGOUT': return { ...init(), status: 'anon' };
    case 'NAVIGATE': return { ...state, nav: action.nav };
    case 'SET_FEED': return { ...state, feed: action.feed };
    case 'TOAST': return { ...state, toast: { msg: action.msg, n: (state.toast?.n ?? 0) + 1 } };
    case 'ERROR': return { ...state, error: action.error };
    default: return state;
  }
}

interface Store {
  state: AppState;
  navigate: (screen: Screen, id?: string) => void;
  setFeed: (feed: 'gigs' | 'formal') => void;
  toast: (msg: string) => void;
  register: (input: RegisterInput) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  demoLogin: (role: Role) => Promise<void>;
  logout: () => void;
  applyGig: (id: string) => Promise<void>;
  completeGig: (gigId: string, rating: number, safetyFlag: boolean) => Promise<{ before: CvSnapshot; after: CvSnapshot }>;
  postGig: (input: CreateGigInput) => Promise<void>;
  reloadTalent: () => Promise<void>;
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
    const [gigs, formalJobs, applications] = await Promise.all([api.listGigs(), api.listFormal(), api.listApplications()]);
    dispatch({ type: 'GIGS', gigs });
    dispatch({ type: 'FORMAL', formalJobs });
    dispatch({ type: 'APPLIED', ids: applications.map((a) => a.gigId) });
  }, []);

  const loadEmployerData = useCallback(async () => {
    const [talent, formalJobs] = await Promise.all([api.listTalent(), api.listFormal()]);
    dispatch({ type: 'TALENT', talent: talent.map(toTalentWorker) });
    dispatch({ type: 'FORMAL', formalJobs });
  }, []);

  const establish = useCallback(async (result: AuthResult) => {
    const user = result.user;
    const worker = user.role === 'worker' ? buildWorker(user.name, result.profile, result.history) : blankWorker();
    dispatch({ type: 'SESSION', user, worker });
    try {
      if (user.role === 'worker') await loadWorkerData();
      else await loadEmployerData();
    } finally {
      dispatch({ type: 'DATA_LOADING', loading: false });
    }
  }, [loadWorkerData, loadEmployerData]);

  // Boot: resume a saved session if a token exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) { dispatch({ type: 'STATUS', status: 'anon' }); return; }
      try {
        const me = await api.me();
        if (cancelled) return;
        await establish(me);
      } catch {
        setToken(null);
        if (!cancelled) dispatch({ type: 'STATUS', status: 'anon' });
      }
    })();
    return () => { cancelled = true; };
  }, [establish]);

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
    dispatch({ type: 'LOGOUT' });
  }, []);

  const applyGig = useCallback(async (id: string) => {
    await api.applyGig(id);
    const cur = stateRef.current.appliedGigIds;
    if (!cur.includes(id)) dispatch({ type: 'APPLIED', ids: [...cur, id] });
  }, []);

  const completeGig = useCallback(async (gigId: string, rating: number, safetyFlag: boolean) => {
    const before = computeCv(stateRef.current.worker);
    const result = await api.completeGig(gigId, rating, safetyFlag);
    const worker = buildWorker(stateRef.current.user?.name ?? stateRef.current.worker.name, result.profile, result.history);
    dispatch({ type: 'WORKER', worker });
    dispatch({ type: 'REMOVE_GIG', id: gigId });
    return { before, after: computeCv(worker) };
  }, []);

  const postGig = useCallback(async (input: CreateGigInput) => {
    await api.createGig(input);
  }, []);

  const reloadTalent = useCallback(async () => {
    const talent = await api.listTalent();
    dispatch({ type: 'TALENT', talent: talent.map(toTalentWorker) });
  }, []);

  const value = useMemo<Store>(() => ({
    state,
    navigate: (screen, id) => dispatch({ type: 'NAVIGATE', nav: { screen, id } }),
    setFeed: (feed) => dispatch({ type: 'SET_FEED', feed }),
    toast: (msg) => dispatch({ type: 'TOAST', msg }),
    register, login, demoLogin, logout, applyGig, completeGig, postGig, reloadTalent,
  }), [state, register, login, demoLogin, logout, applyGig, completeGig, postGig, reloadTalent]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): Store {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
