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
  /** Machine-readable cause, where the server offers one (e.g. 'no_account'),
   *  so the UI can act on it rather than pattern-matching on English. */
  reason?: string;
  /** The form field the server rejected, so the message can be shown against
   *  it instead of floating free of the thing that caused it. */
  field?: string;
  constructor(message: string, status: number, reason?: string, field?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
    this.field = field;
    this.name = 'ApiError';
  }
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
    const err = data as { error?: string; reason?: string; field?: string } | null;
    const msg = err?.error ?? 'Something went wrong. Please try again.';
    throw new ApiError(msg, res.status, err?.reason, err?.field);
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
export interface PublicCvResult { name: string; cv: ServerCv; history: HistoryEntry[]; profile: ApiProfile | null; followers?: number; }
export interface Invitation { id: string; message: string | null; gig: Gig; }
export interface ChatUser { id: string; name: string; role: Role; initials: string; color: string; }
/** The message a reply is quoting — a snippet, not the whole thing. */
export interface QuotedMessage { id: string; senderId: string; body: string; deleted: boolean; }
export interface Message {
  id: string; senderId: string; recipientId: string; body: string; createdAt: string; read: boolean;
  /** Set once the sender has changed it; the UI must say so. */
  editedAt: string | null;
  /** Withdrawn by the sender. `body` is empty — render a tombstone, not a blank. */
  deleted: boolean;
  replyTo: QuotedMessage | null;
}
export interface Conversation { user: ChatUser; lastMessage: string; lastAt: string; lastFromMe: boolean; unread: number; }
export interface Thread { other: ChatUser; messages: Message[]; editWindowMinutes: number; }
export interface Social { followers: number; following: number; isFollowing: boolean; }
export interface ServerTalent {
  id: string; name: string; initials: string; age: number; location: string;
  skills: CategoryId[]; idVerified: boolean; color: string; tagline: string;
  rating: number; jobsDone: number; tier: ServerTier; badges: string[];
}

/** Engine thresholds + fair-pay reference, straight from the server. */
export interface ServerConfig {
  minWage: number;
  tiers: { id: TierId; name: string; minJobs: number; minRating: number; maxFlags: number }[];
  badges: { id: string; threshold: number | null; special: string | null }[];
  /** Public key for push subscriptions. Empty string = push is off server-side. */
  vapidPublicKey?: string;
}
/** Payout details as the server is willing to return them — never the full number. */
export interface BankingSummary {
  holder: string;
  bank: string;
  accountType: 'savings' | 'cheque';
  last4: string;
  updatedAt: string;
}
export interface BankingInput {
  holder: string;
  bank: string;
  accountType: 'savings' | 'cheque';
  /** Omit to keep the stored number and change only the other fields. */
  accountNumber?: string;
}
export interface Preferences { jobAlerts: boolean; }
export interface FormalApplication {
  jobId: string;
  /** applied | shortlisted | rejected | placed — decided by whoever reviews them. */
  status: string;
  appliedAt: string;
  note?: string | null;
  decidedAt?: string | null;
}
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface RegisterInput {
  role: Role; name: string; phone: string; password: string;
  /** Proof the phone number passed SMS verification — required. */
  verifyToken: string;
  age?: number; location?: string; education?: string; bio?: string;
  skills?: CategoryId[];
}

/** `devCode` is only ever present in dev / an explicitly opted-in pilot. */
export interface OtpSent { ok: boolean; sent: boolean; expiresInSeconds: number; devCode?: string }
export interface OtpVerified { ok: boolean; verifyToken: string }
export interface ResetRequested { ok: boolean; message: string; devCode?: string }

/** Where a piece of work has got to. Neither side can advance it alone. */
export type WorkStatus = 'applied' | 'not_selected' | 'hired' | 'worker_done' | 'completed';

export interface MyJob {
  applicationId: string;
  status: WorkStatus;
  hiredAt: string | null;
  workerDoneAt: string | null;
  completedAt: string | null;
  employerRatingOfMe: number | null;
  employerReview: string | null;
  gig: Gig;
}
export interface Applicant {
  applicationId: string;
  status: WorkStatus;
  appliedAt: string;
  workerDoneAt: string | null;
  worker: {
    id: string; name: string; initials: string; age: number; location: string;
    tagline: string; color: string; skills: CategoryId[]; idVerified: boolean;
    rating: number; jobsDone: number; tier: ServerTier; badges: string[];
  };
}
export interface Hire {
  applicationId: string;
  status: WorkStatus;
  hiredAt: string | null;
  workerDoneAt: string | null;
  completedAt: string | null;
  worker: { id: string; name: string; initials: string };
  gig: Gig;
}
export interface IdVerification {
  status: 'none' | 'pending' | 'verified' | 'rejected';
  last4?: string;
  fullName?: string;
  reason?: string | null;
  submittedAt?: string;
  reviewedAt?: string | null;
}
export interface CreateGigInput {
  title: string; category: CategoryId; hours: number; payPerHour: number;
  location: string; when: string; description: string; urgent?: boolean;
  /** Exact coordinates, when the employer chose to share them. Optional by
   *  design: without them the server places the job from its location text. */
  lat?: number; lng?: number;
}

/** Viewer position, appended so the server can measure real distances. */
export type Near = { lat: number; lng: number } | null | undefined;
const nearQuery = (near: Near) => (near ? `?lat=${encodeURIComponent(near.lat)}&lng=${encodeURIComponent(near.lng)}` : '');

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
  requestOtp: (phone: string) => request<OtpSent>('POST', '/auth/otp', { phone }),
  verifyOtp: (phone: string, code: string) => request<OtpVerified>('POST', '/auth/otp/verify', { phone, code }),
  requestPasswordReset: (phone: string) => request<ResetRequested>('POST', '/auth/password/request', { phone }),
  confirmPasswordReset: (phone: string, code: string, password: string) =>
    request<AuthResult>('POST', '/auth/password/confirm', { phone, code, password }),
  /** Pass the viewer's position to get measured distances, nearest first. */
  listGigs: (near?: Near) => request<Gig[]>('GET', `/gigs${nearQuery(near)}`),
  getGig: (id: string, near?: Near) => request<Gig>('GET', `/gigs/${id}${nearQuery(near)}`),
  createGig: (input: CreateGigInput) => request<Gig>('POST', '/gigs', input),
  applyGig: (id: string) => request<{ ok: boolean }>('POST', `/gigs/${id}/apply`),
  /** Worker marks the work done and rates the employer. The CV moves only on the employer's confirmation. */
  completeGig: (id: string, rating: number, safetyFlag: boolean) =>
    request<{ ok: boolean; status: WorkStatus; awaitingConfirmationFrom: string }>('POST', `/gigs/${id}/complete`, { rating, safetyFlag }),
  listMyJobs: () => request<MyJob[]>('GET', '/me/jobs'),
  listApplicants: (gigId: string) => request<{ gig: Gig; applicants: Applicant[] }>('GET', `/gigs/${gigId}/applicants`),
  hireWorker: (gigId: string, workerId: string) => request<{ ok: boolean; applicationId: string }>('POST', `/gigs/${gigId}/hire`, { workerId }),
  listMyHires: () => request<Hire[]>('GET', '/me/hires'),
  confirmWork: (applicationId: string, rating: number, review?: string) =>
    request<{ ok: boolean; status: WorkStatus; rating: number; review: string }>('POST', `/applications/${applicationId}/confirm`, { rating, review }),
  getIdVerification: () => request<IdVerification>('GET', '/me/id-verification'),
  submitIdVerification: (fullName: string, idNumber: string) => request<IdVerification>('POST', '/me/id-verification', { fullName, idNumber }),
  listApplications: () => request<{ gigId: string; status: string }[]>('GET', '/me/applications'),
  listFormal: (near?: Near) => request<FormalJob[]>('GET', `/formal-jobs${nearQuery(near)}`),
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
  sendMessage: (toUserId: string, body: string, replyToId?: string | null) =>
    request<Message>('POST', '/messages', { toUserId, body, replyToId: replyToId ?? null }),
  editMessage: (id: string, body: string) => request<Message>('PATCH', `/messages/${id}`, { body }),
  deleteMessage: (id: string) => request<Message>('DELETE', `/messages/${id}`),
  getSocial: (userId: string) => request<Social>('GET', `/users/${userId}/social`),
  follow: (userId: string) => request<{ isFollowing: boolean; followers: number }>('POST', `/users/${userId}/follow`),
  unfollow: (userId: string) => request<{ isFollowing: boolean; followers: number }>('DELETE', `/users/${userId}/follow`),
  listFollowing: () => request<ChatUser[]>('GET', '/me/following'),
  mySocial: () => request<{ followers: number; following: number }>('GET', '/me/social'),
  getConfig: () => request<ServerConfig>('GET', '/config'),
  myEmployerRating: () => request<{ rating: number | null; count: number }>('GET', '/me/employer-rating'),
  applyFormal: (id: string) => request<{ ok: boolean; already?: boolean }>('POST', `/formal-jobs/${id}/apply`),
  listFormalApplications: () => request<FormalApplication[]>('GET', '/me/formal-applications'),
  getBanking: () => request<BankingSummary | null>('GET', '/me/banking'),
  saveBanking: (input: BankingInput) => request<BankingSummary>('PUT', '/me/banking', input),
  deleteBanking: () => request<{ ok: boolean }>('DELETE', '/me/banking'),
  getPreferences: () => request<Preferences>('GET', '/me/preferences'),
  savePreferences: (prefs: Preferences) => request<Preferences>('PUT', '/me/preferences', prefs),
  reportSafety: (concern: string, extra?: { gigId?: string; aboutUserId?: string }) =>
    request<{ ok: boolean; id: string }>('POST', '/safety/report', { concern, ...extra }),
  subscribePush: (sub: PushSubscriptionInput) => request<{ ok: boolean }>('POST', '/push/subscribe', sub),
  unsubscribePush: (endpoint?: string) => request<{ ok: boolean }>('POST', '/push/unsubscribe', { endpoint }),
  /** Sends one notification to this account's devices, so the user can see it work. */
  testPush: () => request<{ ok: boolean; devices: number }>('POST', '/push/test'),
};
