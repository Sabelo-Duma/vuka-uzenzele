/* ============================================================
   Escrow — the pay for a job, secured before the work starts.

   The rules, as the product owner set them on 2026-09-25:

     1. The employer secures the full pay for a gig — when posting it, or
        later, but always BEFORE anyone is hired. Workers see "Funds secured"
        on the gig before they apply.
     2. Nobody can be hired onto an unfunded gig. Hiring is where the work
        starts, so the money is always waiting by the time anybody arrives.
     3. Until someone is hired, the employer may take the money back, at no
        fee. From the moment of hiring it is locked to that worker.
     4. When the job is confirmed (by the employer, or by the auto-release
        timer when they never answer) the pay moves into the worker's wallet
        on Vuka, and the worker withdraws it when they choose.

   ------------------------------------------------------------
   TEST MODE. This is a ledger; no real money moves.

   Real custody needs a licensed payment provider holding the funds in its
   own settlement account — Vuka taking deposits itself would be taking
   deposits from the public (Banks Act, National Payment System Act). Until a
   provider is signed and wired in, every row here is marked test_mode, every
   screen says "Test mode", and a "withdrawal" records the request without
   sending anything. The seam for the provider is `fund` (collect), `reverse`
   (refund) and `withdraw` (payout) below — nothing else touches money.
   ============================================================ */
import { all, get, run } from './db.mjs';
import { uuid } from './auth.mjs';

/** 'test' until a payment provider is connected. There is no 'live' path yet. */
export const PAYMENTS_MODE = 'test';
const TEST = 1;

/** The pay for a gig, in cents. Hours × rate, rounded to the rand as elsewhere. */
export function gigTotalCents(g) {
  return Math.round(Number(g.hours) * Number(g.pay_per_hour)) * 100;
}

const now = () => new Date().toISOString();

/** The live (held or released) escrow for a gig, if any. */
export async function escrowFor(gigId) {
  return (await get(
    "SELECT * FROM escrow WHERE gig_id = ? AND status IN ('held','released') ORDER BY funded_at DESC LIMIT 1",
    [gigId],
  )) ?? null;
}

/** gigId -> 'held' | 'released', for serialising many gigs at once. */
export async function fundingFor(gigIds) {
  const ids = [...new Set(gigIds)].filter(Boolean);
  const out = new Map();
  if (ids.length === 0) return out;
  const rows = await all(
    `SELECT gig_id, status FROM escrow WHERE status IN ('held','released') AND gig_id IN (${ids.map(() => '?').join(',')})`,
    ids,
  );
  for (const r of rows) out.set(r.gig_id, r.status);
  return out;
}

/** True once anybody is hired onto the gig — the point after which funds lock. */
async function someoneHired(gigId) {
  return !!(await get(
    "SELECT id FROM applications WHERE gig_id = ? AND status IN ('hired','worker_done','completed') LIMIT 1",
    [gigId],
  ));
}

class EscrowError extends Error {
  constructor(message, status, reason) { super(message); this.status = status; this.reason = reason; }
}
export { EscrowError };

/**
 * Secure the pay for a gig. Idempotent: funding an already-funded gig returns
 * the existing escrow rather than taking the money twice.
 */
export async function fund(gig, employerId) {
  if (gig.employer_id !== employerId) throw new EscrowError('Only the person who posted this job can fund it.', 403, 'not_owner');
  const existing = await escrowFor(gig.id);
  if (existing) return { escrow: existing, already: true };
  const row = {
    id: uuid(), gig_id: gig.id, employer_id: employerId, amount_cents: gigTotalCents(gig),
    status: 'held', test_mode: TEST, funded_at: now(),
  };
  await run(
    'INSERT INTO escrow (id, gig_id, employer_id, amount_cents, status, test_mode, funded_at) VALUES (?,?,?,?,?,?,?)',
    [row.id, row.gig_id, row.employer_id, row.amount_cents, row.status, row.test_mode, row.funded_at],
  );
  return { escrow: row, already: false };
}

/**
 * Give the money back to the employer, at no fee. Only while nobody is hired.
 * The claim is a conditional UPDATE, so a hire racing a reversal cannot both win.
 */
export async function reverse(gig, employerId) {
  if (gig.employer_id !== employerId) throw new EscrowError('Only the person who posted this job can take the funds back.', 403, 'not_owner');
  const e = await escrowFor(gig.id);
  if (!e || e.status !== 'held') throw new EscrowError('There are no funds on this job to take back.', 409, 'not_funded');
  if (await someoneHired(gig.id)) {
    throw new EscrowError('Someone has been hired, so the funds are locked to them now.', 409, 'locked');
  }
  const claimed = await get(
    "UPDATE escrow SET status = 'reversed', reversed_at = ? WHERE id = ? AND status = 'held' RETURNING id",
    [now(), e.id],
  );
  if (!claimed) throw new EscrowError('Those funds have already moved.', 409, 'not_funded');
  return { amountCents: e.amount_cents, fee: 0 };
}

/**
 * Move a gig's held pay into the worker's wallet. Called on confirmation and
 * on auto-release. Safe to call twice: only one call can claim the row, and a
 * gig with no escrow (posted before escrow existed) is simply a no-op.
 */
export async function release(gigId, workerId, applicationId) {
  const e = await get("SELECT * FROM escrow WHERE gig_id = ? AND status = 'held' LIMIT 1", [gigId]);
  if (!e) return null;
  const at = now();
  const claimed = await get(
    "UPDATE escrow SET status = 'released', released_at = ?, worker_id = ?, application_id = ? WHERE id = ? AND status = 'held' RETURNING id",
    [at, workerId, applicationId, e.id],
  );
  if (!claimed) return null;
  await run(
    'INSERT INTO wallet_entries (id, user_id, kind, amount_cents, escrow_id, note, test_mode, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuid(), workerId, 'release', e.amount_cents, e.id, null, e.test_mode, at],
  );
  return { amountCents: e.amount_cents };
}

/** A worker's wallet: balance, what is on its way, and the ledger. */
export async function wallet(userId) {
  const entries = await all(
    `SELECT w.id, w.kind, w.amount_cents, w.note, w.test_mode, w.created_at, g.title AS gig_title
       FROM wallet_entries w
       LEFT JOIN escrow e ON e.id = w.escrow_id
       LEFT JOIN gigs g ON g.id = e.gig_id
      WHERE w.user_id = ? ORDER BY w.created_at DESC LIMIT 100`,
    [userId],
  );
  const bal = await get('SELECT COALESCE(SUM(amount_cents), 0) AS c FROM wallet_entries WHERE user_id = ?', [userId]);
  /* Pay secured on jobs this worker is hired onto and has not been released. */
  const pend = await get(
    `SELECT COALESCE(SUM(e.amount_cents), 0) AS c
       FROM escrow e JOIN applications a ON a.gig_id = e.gig_id
      WHERE a.worker_id = ? AND a.status IN ('hired','worker_done') AND e.status = 'held'`,
    [userId],
  );
  return {
    mode: PAYMENTS_MODE,
    /* node-pg returns SUM as a string. */
    balanceCents: Number(bal?.c ?? 0),
    pendingCents: Number(pend?.c ?? 0),
    entries: entries.map((r) => ({
      id: r.id, kind: r.kind, amountCents: Number(r.amount_cents), note: r.note,
      testMode: !!r.test_mode, at: r.created_at, gigTitle: r.gig_title ?? null,
    })),
  };
}

/**
 * Withdraw the whole balance to the worker's saved bank account.
 * In test mode this records the withdrawal and sends nothing.
 */
export async function withdraw(userId) {
  const bank = await get('SELECT bank, account_last4 FROM banking_details WHERE user_id = ?', [userId]);
  if (!bank) throw new EscrowError('Add your bank details under Me first, so we know where to send it.', 409, 'needs_banking');
  const bal = await get('SELECT COALESCE(SUM(amount_cents), 0) AS c FROM wallet_entries WHERE user_id = ?', [userId]);
  const cents = Number(bal?.c ?? 0);
  if (cents <= 0) throw new EscrowError('There is nothing in your wallet to withdraw yet.', 409, 'empty');
  const note = `${bank.bank} ••••${bank.account_last4}`;
  await run(
    'INSERT INTO wallet_entries (id, user_id, kind, amount_cents, escrow_id, note, test_mode, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [uuid(), userId, 'withdrawal', -cents, null, note, TEST, now()],
  );
  return { amountCents: cents, to: note, mode: PAYMENTS_MODE };
}
