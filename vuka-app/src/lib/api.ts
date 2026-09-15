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
export interface ApiUser { id: string; role: Role; name: string; phone: string; email?: string | null; }
export interface ApiProfile {
  age: number; location: string; education: string; bio: string;
  skills: CategoryId[]; idVerified: boolean; color: string; joined: string; tagline: string;
  languages?: string[];
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
/** What kind of thing a message is. */
export type MessageKind = 'text' | 'voice' | 'image';
/** The message a reply is quoting — a snippet, not the whole thing. */
export interface QuotedMessage { id: string; senderId: string; body: string; kind: MessageKind; deleted: boolean; }
/** A voice note or a photo. Never carries the bytes — those are fetched by id. */
export interface Attachment {
  id: string;
  kind: 'voice' | 'image';
  mime: string;
  size: number;
  /** Voice only. */
  durationMs: number | null;
  /** Voice only: one digit 0-9 per bar, measured by the sender as they spoke. */
  waveform: string | null;
  /** Image only. */
  width: number | null;
  height: number | null;
}
export interface Message {
  id: string;
  /** The sender's own id for this message, minted before it was first sent. */
  clientId: string | null;
  senderId: string; recipientId: string;
  kind: MessageKind;
  body: string; createdAt: string;
  /** It reached a device they are signed in on. */
  delivered: boolean;
  /** They opened the conversation with it on screen. */
  read: boolean;
  /** Set once the sender has changed it; the UI must say so. */
  editedAt: string | null;
  /** Withdrawn by the sender. `body` is empty — render a tombstone, not a blank. */
  deleted: boolean;
  attachment: Attachment | null;
  replyTo: QuotedMessage | null;
}
export interface Conversation {
  user: ChatUser; lastMessage: string; lastKind: MessageKind; lastAt: string;
  lastFromMe: boolean; lastRead: boolean; lastDelivered: boolean;
  unread: number; online: boolean;
}
/** Someone this account has blocked. */
export interface BlockedUser extends ChatUser { blockedAt: string }
export interface Thread {
  other: ChatUser;
  online: boolean;
  /** You blocked them. Never true for the person who was blocked. */
  blocked: boolean;
  messages: Message[];
  /** There is older history above this page. */
  hasMore: boolean;
  editWindowMinutes: number;
  voiceMaxMs: number;
  attachMaxBytes: number;
}
/** What one round of catching up returned. */
export interface SyncResult { now: string; unread: number; messages: Message[] }
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
    tier: t.tier.id, tagline: t.tagline, badges: t.badges,
  };
}

/* ============================================================
   Attachments — the one part of the API that isn't JSON.

   Bytes go up on their own, before any message refers to them. Two round trips
   instead of one, and worth it: a voice note is a hundred times the size of the
   message that carries it, so the send itself stays small enough to retry, and
   a recording that dies halfway leaves nothing but an unreferenced row.
   ============================================================ */

export interface UploadOptions {
  kind: 'voice' | 'image';
  durationMs?: number;
  waveform?: string;
  width?: number;
  height?: number;
  /** 0-1, called as the bytes go. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/**
 * Send the bytes.
 *
 * XMLHttpRequest rather than fetch, for one reason: upload progress. fetch
 * still cannot report it in any browser this app runs on, and a voice note on a
 * slow connection with no sign of movement is indistinguishable from a broken
 * one — which is when people press send again.
 */
export function uploadAttachment(blob: Blob, opts: UploadOptions): Promise<Attachment> {
  const q = new URLSearchParams({ kind: opts.kind });
  if (opts.durationMs != null) q.set('durationMs', String(Math.round(opts.durationMs)));
  if (opts.waveform) q.set('waveform', opts.waveform);
  if (opts.width != null) q.set('w', String(Math.round(opts.width)));
  if (opts.height != null) q.set('h', String(Math.round(opts.height)));

  return new Promise<Attachment>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/attachments?${q}`);
    xhr.responseType = 'json';
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // The blob's own type carries the container and codec the browser chose.
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      const data = xhr.response as { error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress?.(1);
        resolve(xhr.response as Attachment);
      } else if (xhr.status === 413) {
        reject(new ApiError('That recording is too long to send. Try a shorter one.', 413));
      } else {
        reject(new ApiError(data?.error ?? 'That upload failed. Please try again.', xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError("Can't reach Vuka right now. Check your connection and try again.", 0));
    xhr.onabort = () => reject(new ApiError('Upload cancelled.', 0));
    opts.signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(blob);
  });
}

/**
 * Bring an attachment back as a blob URL.
 *
 * Never pointed at directly with <audio src="/api/attachments/…">. A media
 * element cannot send an Authorization header, and Safari expects a server it
 * streams from to answer byte-range requests — a blob URL sidesteps both, and
 * makes the clip play instantly the second time.
 *
 * Cached for the life of the page, keyed by id. The bytes behind an id never
 * change, so the only cost of keeping one is the memory, and the cost of not
 * keeping it is re-downloading a voice note every time the thread scrolls.
 */
const blobUrls = new Map<string, Promise<string>>();

export function attachmentUrl(id: string): Promise<string> {
  const cached = blobUrls.get(id);
  if (cached) return cached;

  const pending = (async () => {
    const res = await fetch(`${BASE}/attachments/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let msg = 'That file is no longer available.';
      try { msg = ((await res.json()) as { error?: string }).error ?? msg; } catch { /* no body */ }
      throw new ApiError(msg, res.status);
    }
    return URL.createObjectURL(await res.blob());
  })();

  // A failure must not be cached, or a clip that failed once never loads again.
  pending.catch(() => blobUrls.delete(id));
  blobUrls.set(id, pending);
  return pending;
}

/** Let go of a clip's bytes — used when a message is withdrawn. */
export function forgetAttachment(id: string) {
  const held = blobUrls.get(id);
  blobUrls.delete(id);
  held?.then((url) => URL.revokeObjectURL(url)).catch(() => { /* never resolved */ });
}

/** The live channel's address, once a ticket has been bought. */
export const eventStreamUrl = (ticket: string) => `${BASE}/events?ticket=${encodeURIComponent(ticket)}`;

export const api = {
  register: (input: RegisterInput) => request<AuthResult>('POST', '/auth/register', input),
  /** One field, either credential. The server tells a phone from an email. */
  login: (identifier: string, password: string) => request<AuthResult>('POST', '/auth/login', { identifier, password }),
  getProfile: () => request<{ user: ApiUser; profile: ApiProfile | null; languages: string[] }>('GET', '/me/profile'),
  saveProfile: (body: { name: string; location: string; education: string; bio: string; email: string; languages: string[] }) =>
    request<{ ok: true; user: ApiUser; profile: ApiProfile | null }>('PUT', '/me/profile', body),
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
  /** Withdraw your own listing. Refuses once someone is hired for it. */
  deleteGig: (id: string) => request<{ ok: boolean; applicantsNotified: number }>('DELETE', `/gigs/${id}`),
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
  /**
   * One conversation, in one of three shapes.
   *   {}              the newest page — opening a chat
   *   { before }      the page above that — scrolling up
   *   { since }       only what changed — staying current
   * `since` is inclusive, so the caller must deduplicate by id. That is
   * deliberate on the server's side: a cursor that overlaps can never skip a
   * message, and a duplicate costs nothing to throw away.
   */
  getThread: (userId: string, opts: { since?: string; before?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (opts.since) q.set('since', opts.since);
    if (opts.before) q.set('before', opts.before);
    if (opts.limit) q.set('limit', String(opts.limit));
    const qs = q.toString();
    return request<Thread>('GET', `/messages/thread/${userId}${qs ? `?${qs}` : ''}`);
  },
  /** Everything new across every conversation — one request, not one per thread. */
  syncMessages: (since: string) => request<SyncResult>('GET', `/messages/sync?since=${encodeURIComponent(since)}`),
  /** Say the messages were actually put in front of someone. */
  markRead: (userId: string, upTo?: string) =>
    request<{ ok: boolean; marked: number; unread: number }>('POST', '/messages/read', { userId, upTo: upTo ?? null }),
  /** A signal, not a record. Fire and forget. */
  sendTyping: (toUserId: string) => request<{ ok: boolean }>('POST', '/messages/typing', { toUserId }),
  /** A sixty-second pass for the live channel, since EventSource cannot send headers. */
  eventTicket: () => request<{ ticket: string; expiresIn: number }>('POST', '/events/ticket'),
  sendMessage: (toUserId: string, body: string, opts: { replyToId?: string | null; clientId?: string; attachmentId?: string | null } = {}) =>
    request<Message>('POST', '/messages', {
      toUserId,
      body,
      replyToId: opts.replyToId ?? null,
      clientId: opts.clientId ?? null,
      attachmentId: opts.attachmentId ?? null,
    }),
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
  /* Blocking. A safety report waits for a person to read it; this takes effect
     on the next request, which is what somebody being harassed actually needs. */
  blockUser: (userId: string) => request<{ ok: boolean; blocked: boolean }>('POST', `/users/${userId}/block`),
  unblockUser: (userId: string) => request<{ ok: boolean; blocked: boolean }>('DELETE', `/users/${userId}/block`),
  listBlocks: () => request<BlockedUser[]>('GET', '/me/blocks'),
  subscribePush: (sub: PushSubscriptionInput) => request<{ ok: boolean }>('POST', '/push/subscribe', sub),
  unsubscribePush: (endpoint?: string) => request<{ ok: boolean }>('POST', '/push/unsubscribe', { endpoint }),
  /** Sends one notification to this account's devices, so the user can see it work. */
  testPush: () => request<{ ok: boolean; devices: number }>('POST', '/push/test'),
};
