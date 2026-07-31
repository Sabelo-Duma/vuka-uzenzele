/* ============================================================
   API client for the Vuka Uzenzele backend.
   Dev: relative '/api' (proxied by Vite to :3001).
   Prod: set VITE_API_URL to the deployed API base.
   ============================================================ */
import type { CategoryId, FormalJob, Gig, HistoryEntry, Role, TalentWorker, TierId } from '../types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';
const TOKEN_KEY = 'vuka-token';

let token: string | null = null;
try { token = localStorage.getItem(TOKEN_KEY); } catch { token = null; }

export function setToken(next: string | null) {
  token = next;
  try {
    if (next) localStorage.setItem(TOKEN_KEY, next);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable */ }
}
export function getToken() { return token; }

/** Error carrying the server's user-facing message. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; this.name = 'ApiError'; }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach Vuka right now. Check your connection and try again.", 0);
  }
  let data: unknown = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error ?? 'Something went wrong. Please try again.';
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

// ---- server response shapes ----
export interface ApiUser { id: string; role: Role; name: string; phone: string; }
export interface ApiProfile {
  age: number; location: string; education: string; bio: string;
  skills: CategoryId[]; idVerified: boolean; color: string; joined: string; tagline: string;
}
export interface ServerTier { id: TierId; name: string; icon: string; minJobs: number; minRating: number; maxFlags: number; unlocks: string; }
export interface ServerCv {
  jobsDone: number; avg: number; totalEarned: number; flags: number; categoriesWorked: number;
  rep: number; earnedBadges: string[]; tier: ServerTier; nextTier: ServerTier | null;
  tierProgress: number; jobsToGo: number; ratingMet: boolean; flagBlocked: boolean;
}
export interface AuthResult {
  token: string; user: ApiUser;
  cv?: ServerCv; history?: HistoryEntry[]; profile?: ApiProfile | null;
}
export interface CvResult { cv: ServerCv; history: HistoryEntry[]; profile: ApiProfile | null; }
export interface PublicCvResult { name: string; cv: ServerCv; history: HistoryEntry[]; profile: ApiProfile | null; }
export interface Invitation { id: string; message: string | null; gig: Gig; }
export interface ChatUser { id: string; name: string; role: Role; initials: string; color: string; }
export interface Message { id: string; senderId: string; recipientId: string; body: string; createdAt: string; read: boolean; }
export interface Conversation { user: ChatUser; lastMessage: string; lastAt: string; lastFromMe: boolean; unread: number; }
export interface Thread { other: ChatUser; messages: Message[]; }
export interface ServerTalent {
  id: string; name: string; initials: string; age: number; location: string;
  skills: CategoryId[]; idVerified: boolean; color: string; tagline: string;
  rating: number; jobsDone: number; tier: ServerTier; badges: string[];
}

export interface RegisterInput {
  role: Role; name: string; phone: string; password: string;
  age?: number; location?: string; education?: string; bio?: string;
  skills?: CategoryId[]; idVerified?: boolean;
}
export interface CreateGigInput {
  title: string; category: CategoryId; hours: number; payPerHour: number;
  location: string; when: string; description: string; urgent?: boolean;
}

/** Map a server talent record to the client's TalentWorker (tier as index). */
export function toTalentWorker(t: ServerTalent): TalentWorker {
  return {
    id: t.id, name: t.name, initials: t.initials, age: t.age, location: t.location,
    skills: t.skills, rating: t.rating, jobsDone: t.jobsDone, idVerified: t.idVerified,
    tier: t.tier.id, color: t.color, tagline: t.tagline, badges: t.badges,
  };
}

export const api = {
  register: (input: RegisterInput) => request<AuthResult>('POST', '/auth/register', input),
  login: (phone: string, password: string) => request<AuthResult>('POST', '/auth/login', { phone, password }),
  me: () => request<AuthResult>('GET', '/auth/me'),
  listGigs: () => request<Gig[]>('GET', '/gigs'),
  getGig: (id: string) => request<Gig>('GET', `/gigs/${id}`),
  createGig: (input: CreateGigInput) => request<Gig>('POST', '/gigs', input),
  applyGig: (id: string) => request<{ ok: boolean }>('POST', `/gigs/${id}/apply`),
  completeGig: (id: string, rating: number, safetyFlag: boolean) => request<CvResult>('POST', `/gigs/${id}/complete`, { rating, safetyFlag }),
  listApplications: () => request<{ gigId: string; status: string }[]>('GET', '/me/applications'),
  listFormal: () => request<FormalJob[]>('GET', '/formal-jobs'),
  getCv: () => request<CvResult>('GET', '/me/cv'),
  listTalent: () => request<ServerTalent[]>('GET', '/talent'),
  getTalent: (id: string) => request<ServerTalent>('GET', `/talent/${id}`),
  getPublicCv: (id: string) => request<PublicCvResult>('GET', `/public/cv/${id}`),
  listMyGigs: () => request<Gig[]>('GET', '/me/gigs'),
  inviteWorker: (workerId: string, gigId: string, message?: string) => request<{ ok: boolean; already?: boolean }>('POST', `/talent/${workerId}/invite`, { gigId, message }),
  listInvitations: () => request<Invitation[]>('GET', '/me/invitations'),
  respondInvitation: (id: string, accept: boolean) => request<{ ok: boolean; accepted: boolean; gigId: string }>('POST', `/invitations/${id}/respond`, { accept }),
  unreadCount: () => request<{ count: number }>('GET', '/messages/unread-count'),
  listConversations: () => request<Conversation[]>('GET', '/messages/conversations'),
  getThread: (userId: string) => request<Thread>('GET', `/messages/thread/${userId}`),
  sendMessage: (toUserId: string, body: string) => request<Message>('POST', '/messages', { toUserId, body }),
};
