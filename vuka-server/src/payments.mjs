/* ============================================================
   Real payments, through Paystack.

   Vuka never holds anybody's money. Paystack prohibits "escrow services", and
   money landing in the owner's account would be taking deposits from the
   public. So the shape is (agreed with the owner 2026-11-25):

     1. A worker's bank details become a Paystack SUBACCOUNT, so a payment can
        settle straight to the worker's bank.
     2. Before an employer's first hire, they add a card on Paystack's own
        page. A small check charge proves the card works and is refunded at
        once; Paystack hands back a reusable authorization code.
     3. When the job is confirmed — by the employer, or by the auto-release
        window — the card is charged the pay PLUS Vuka's fee, split so the
        worker's subaccount receives exactly the advertised pay and the main
        account keeps the fee. Vuka bears Paystack's own charge (bearer
        "account"), out of its fee.

   Everything here is off until PAYSTACK_SECRET_KEY is set. Then sk_test_…
   runs against Paystack's test mode and sk_live_… moves real money. Without a
   key the escrow ledger in escrow.mjs keeps running in test mode, as before.

   Every request shape below was checked against Paystack's published OpenAPI
   spec (github.com/PaystackOSS/openapi, dist/paystack.yaml, read 2026-11-26)
   and the webhook signature against their doc snippets
   (PaystackOSS/doc-code-snippets, payments/webhooks/verifying-signature).
   Amounts are in cents for ZAR.
   ============================================================ */
import crypto from 'node:crypto';
import { all, get, run } from './db.mjs';
import { uuid } from './auth.mjs';
import { decryptField, encryptField } from './crypto.mjs';
import { gigTotalCents } from './escrow.mjs';

const secret = () => process.env.PAYSTACK_SECRET_KEY || '';
const base = () => (process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co').replace(/\/$/, '');

/** 'off' (no key), 'test' (sk_test_) or 'live' (sk_live_). */
export function paystackMode() {
  const k = secret();
  if (!k) return 'off';
  return k.startsWith('sk_live_') ? 'live' : 'test';
}
export const paystackOn = () => paystackMode() !== 'off';

/** Vuka's fee, as a percentage of the job's pay, added on top for the employer. */
export function feePercent() {
  const n = Number(process.env.VUKA_FEE_PERCENT ?? 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 30) : 10;
}
/** The amount charged to prove a new card works. Refunded straight away. */
export const cardCheckCents = () => Math.max(100, Number(process.env.VUKA_CARD_CHECK_CENTS || 500));

/** Pay, fee and total for a gig, in cents. */
export function priceFor(gig) {
  const pay = gigTotalCents(gig);
  const fee = Math.round(pay * feePercent() / 100);
  return { pay, fee, total: pay + fee };
}

export class PaymentError extends Error {
  constructor(message, status = 409, reason = 'payment') { super(message); this.status = status; this.reason = reason; }
}

const now = () => new Date().toISOString();

/** One call to Paystack. Throws PaymentError on anything but a clean answer. */
async function paystack(method, path, body) {
  let res;
  try {
    res = await fetch(`${base()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new PaymentError('The payment service could not be reached. Please try again in a moment.', 502, 'provider_down');
  }
  let json = null;
  try { json = await res.json(); } catch { /* handled below */ }
  if (!res.ok || !json || json.status === false) {
    const msg = json?.message ? String(json.message) : `HTTP ${res.status}`;
    console.warn(`paystack: ${method} ${path} -> ${msg}`);
    const err = new PaymentError('The payment service turned this down. Please check the details and try again.', 502, 'provider_refused');
    err.providerMessage = msg;
    throw err;
  }
  return json.data;
}

/* ---------------- banks ---------------- */

/* Vuka's bank ids (the banking form) → how Paystack names them. */
const BANK_NAMES = {
  absa: /absa/i, fnb: /first national|\bfnb\b/i, standard: /standard bank/i, nedbank: /nedbank/i,
  capitec: /capitec/i, tymebank: /tyme/i, africanbank: /african bank/i, discovery: /discovery/i,
  investec: /investec/i, bankzero: /bank ?zero/i, postbank: /post ?bank/i,
};
let bankCache = { at: 0, list: [] };

/** Paystack's bank code for one of Vuka's bank ids, or null. */
export async function bankCode(bankId) {
  const re = BANK_NAMES[bankId];
  if (!re) return null;
  if (Date.now() - bankCache.at > 24 * 3600_000 || !bankCache.list.length) {
    const list = await paystack('GET', '/bank?country=south%20africa&perPage=100');
    bankCache = { at: Date.now(), list: Array.isArray(list) ? list : [] };
  }
  /* "Capitec Bank" over "Capitec Business" when both exist: shortest match. */
  const hits = bankCache.list.filter((b) => re.test(String(b.name || '')) && b.active !== false && b.is_deleted !== true);
  hits.sort((a, b) => String(a.name).length - String(b.name).length);
  return hits[0]?.code ?? null;
}

/* ---------------- the worker's side: a subaccount ---------------- */

/**
 * The worker's Paystack subaccount, created from their saved bank details the
 * first time and again whenever those details change. Null when they have not
 * saved bank details yet.
 */
export async function ensurePayout(userId) {
  const bank = await get('SELECT * FROM banking_details WHERE user_id = ?', [userId]);
  if (!bank) return null;
  const have = await get('SELECT * FROM payout_accounts WHERE user_id = ?', [userId]);
  if (have && have.bank === bank.bank && have.account_last4 === bank.account_last4 && have.mode === paystackMode()) return have;

  const code = await bankCode(bank.bank);
  if (!code) throw new PaymentError('That bank cannot receive payments through Vuka yet.', 409, 'bank_unsupported');
  const user = await get('SELECT name, phone FROM users WHERE id = ?', [userId]);
  const data = await paystack('POST', '/subaccount', {
    business_name: bank.holder,
    settlement_bank: code,
    account_number: decryptField(bank.account_number_enc),
    percentage_charge: feePercent(),
    description: `Vuka worker ${userId}`,
    primary_contact_name: user?.name ?? bank.holder,
    primary_contact_phone: user?.phone ?? undefined,
  });
  const row = { user_id: userId, subaccount_code: data.subaccount_code, bank: bank.bank, account_last4: bank.account_last4, mode: paystackMode(), created_at: now() };
  if (have) {
    await run('UPDATE payout_accounts SET subaccount_code = ?, bank = ?, account_last4 = ?, mode = ?, created_at = ? WHERE user_id = ?',
      [row.subaccount_code, row.bank, row.account_last4, row.mode, row.created_at, userId]);
  } else {
    await run('INSERT INTO payout_accounts (user_id, subaccount_code, bank, account_last4, mode, created_at) VALUES (?,?,?,?,?,?)',
      [row.user_id, row.subaccount_code, row.bank, row.account_last4, row.mode, row.created_at]);
  }
  return row;
}

/* ---------------- the employer's side: a saved card ---------------- */

export async function savedCard(userId) {
  const c = await get('SELECT * FROM payment_cards WHERE user_id = ? AND mode = ?', [userId, paystackMode()]);
  return c ? { last4: c.last4, brand: c.brand, expMonth: c.exp_month, expYear: c.exp_year, email: c.email } : null;
}

export async function forgetCard(userId) {
  await run('DELETE FROM payment_cards WHERE user_id = ?', [userId]);
}

async function keepCard(userId, auth, email) {
  if (!auth?.authorization_code || auth.reusable !== true) return false;
  await run('DELETE FROM payment_cards WHERE user_id = ?', [userId]);
  await run('INSERT INTO payment_cards (user_id, authorization_enc, last4, brand, exp_month, exp_year, email, mode, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [userId, encryptField(auth.authorization_code), String(auth.last4 ?? ''), String(auth.brand ?? auth.card_type ?? 'card'),
      String(auth.exp_month ?? ''), String(auth.exp_year ?? ''), email, paystackMode(), now()]);
  return true;
}

const validEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) && e.length <= 120;

/** Paystack needs an email for every payment: the account's, or one given now. */
async function emailFor(userId, given) {
  if (validEmail(given)) {
    const e = given.trim();
    await run('UPDATE users SET email = ? WHERE id = ? AND (email IS NULL OR email = ?)', [e, userId, '']);
    return e;
  }
  const u = await get('SELECT email FROM users WHERE id = ?', [userId]);
  if (validEmail(u?.email)) return u.email.trim();
  throw new PaymentError('Add your email address, so the payment service can send you receipts.', 409, 'needs_email');
}

async function recordAttempt(row) {
  await run(
    `INSERT INTO payments (id, kind, reference, application_id, gig_id, employer_id, worker_id, amount_cents, worker_cents, fee_cents, status, auth_url, message, mode, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [row.id, row.kind, row.reference, row.application_id ?? null, row.gig_id ?? null, row.employer_id, row.worker_id ?? null,
      row.amount_cents, row.worker_cents ?? 0, row.fee_cents ?? 0, row.status, row.auth_url ?? null, row.message ?? null,
      paystackMode(), now(), now()],
  );
}

async function setStatus(id, status, extra = {}) {
  await run('UPDATE payments SET status = ?, auth_url = COALESCE(?, auth_url), message = COALESCE(?, message), paid_at = COALESCE(?, paid_at), updated_at = ? WHERE id = ?',
    [status, extra.authUrl ?? null, extra.message ?? null, status === 'success' ? now() : null, now(), id]);
}

/**
 * Start adding a card: a small check charge on Paystack's page. Returns the
 * page to send the employer to. verify() finishes it when they come back.
 */
export async function startCardCheck(userId, { email, callbackUrl }) {
  const mail = await emailFor(userId, email);
  const reference = `vcard_${uuid().replace(/-/g, '')}`;
  const data = await paystack('POST', '/transaction/initialize', {
    email: mail, amount: cardCheckCents(), currency: 'ZAR', reference, channels: ['card'],
    callback_url: callbackUrl, metadata: { purpose: 'card_check', userId },
  });
  await recordAttempt({ id: uuid(), kind: 'card_check', reference, employer_id: userId, amount_cents: cardCheckCents(), status: 'pending', auth_url: data.authorization_url });
  return { url: data.authorization_url, reference };
}

/* ---------------- paying for a job ---------------- */

/** The latest attempt for an application. */
async function latestFor(applicationId) {
  return (await get("SELECT * FROM payments WHERE kind = 'job' AND application_id = ? ORDER BY created_at DESC LIMIT 1", [applicationId])) ?? null;
}

export function paymentOut(p) {
  if (!p) return null;
  return {
    status: p.status, amount: Number(p.amount_cents) / 100, pay: Number(p.worker_cents) / 100, fee: Number(p.fee_cents) / 100,
    authUrl: p.status === 'paused' ? p.auth_url : null, paidAt: p.paid_at ?? null, mode: p.mode,
  };
}

/** What the employer or the worker sees about one application's payment. */
export async function paymentForApplication(applicationId) {
  return paymentOut(await latestFor(applicationId));
}

/**
 * Charge the employer's saved card for a confirmed job, split to the worker.
 *
 * Never throws for an ordinary outcome: the result says what happened —
 * 'success', 'paused' (the bank wants the employer to approve it; authUrl),
 * 'failed' (declined), 'needs_card' (nothing saved), 'waiting_bank' (the
 * worker has no bank details yet). Safe to call again: a paid or in-flight
 * application is returned as it is.
 */
export async function payForApplication(applicationId) {
  if (!paystackOn()) return null;
  const prev = await latestFor(applicationId);
  if (prev && ['success', 'charging', 'pending', 'paused'].includes(prev.status)) return paymentOut(prev);

  const app = await get('SELECT * FROM applications WHERE id = ?', [applicationId]);
  if (!app || app.status !== 'completed') return null;
  const gig = await get('SELECT * FROM gigs WHERE id = ?', [app.gig_id]);
  if (!gig) return null;
  const price = priceFor(gig);
  if (price.pay <= 0) return null;
  const base = {
    id: uuid(), kind: 'job', reference: `vjob_${uuid().replace(/-/g, '')}`, application_id: app.id, gig_id: gig.id,
    employer_id: gig.employer_id, worker_id: app.worker_id, amount_cents: price.total, worker_cents: price.pay, fee_cents: price.fee,
  };

  let payout = null;
  try { payout = await ensurePayout(app.worker_id); } catch (e) { base.message = e.message; }
  if (!payout) { await recordAttempt({ ...base, status: 'waiting_bank' }); return paymentOut(await latestFor(app.id)); }

  const card = await get('SELECT * FROM payment_cards WHERE user_id = ? AND mode = ?', [gig.employer_id, paystackMode()]);
  if (!card) { await recordAttempt({ ...base, status: 'needs_card' }); return paymentOut(await latestFor(app.id)); }

  /* Claimed before the call, so a second caller sees 'charging' and stops. */
  await recordAttempt({ ...base, status: 'charging' });
  try {
    const data = await paystack('POST', '/transaction/charge_authorization', {
      authorization_code: decryptField(card.authorization_enc),
      email: card.email, amount: price.total, currency: 'ZAR', reference: base.reference,
      subaccount: payout.subaccount_code, transaction_charge: String(price.fee), bearer: 'account',
      metadata: JSON.stringify({ purpose: 'job', applicationId: app.id, gigId: gig.id }),
    });
    if (data?.paused && data?.authorization_url) await setStatus(base.id, 'paused', { authUrl: data.authorization_url });
    else if (data?.status === 'success') await setStatus(base.id, 'success');
    else await setStatus(base.id, 'failed', { message: String(data?.gateway_response || data?.status || 'declined') });
  } catch (e) {
    await setStatus(base.id, 'failed', { message: e.providerMessage || e.message });
  }
  return paymentOut(await latestFor(app.id));
}

/**
 * Pay for a job on Paystack's page instead — no card saved yet, or the saved
 * one was declined. The card used is kept for next time.
 */
export async function startJobCheckout(applicationId, employerId, { email, callbackUrl }) {
  const app = await get('SELECT * FROM applications WHERE id = ?', [applicationId]);
  const gig = app ? await get('SELECT * FROM gigs WHERE id = ?', [app.gig_id]) : null;
  if (!app || !gig || gig.employer_id !== employerId) throw new PaymentError('That job could not be found.', 404, 'not_found');
  if (app.status !== 'completed') throw new PaymentError('You can pay once you have confirmed the job.', 409, 'not_confirmed');
  const prev = await latestFor(app.id);
  if (prev?.status === 'success') throw new PaymentError('This job has already been paid.', 409, 'paid');
  const payout = await ensurePayout(app.worker_id);
  if (!payout) throw new PaymentError('The worker has not added their bank details yet. We have asked them to, and will let you know.', 409, 'waiting_bank');
  const mail = await emailFor(employerId, email);
  const price = priceFor(gig);
  const reference = `vjob_${uuid().replace(/-/g, '')}`;
  const data = await paystack('POST', '/transaction/initialize', {
    email: mail, amount: price.total, currency: 'ZAR', reference, channels: ['card'], callback_url: callbackUrl,
    subaccount: payout.subaccount_code, transaction_charge: String(price.fee), bearer: 'account',
    metadata: { purpose: 'job', applicationId: app.id, gigId: gig.id },
  });
  await recordAttempt({
    id: uuid(), kind: 'job', reference, application_id: app.id, gig_id: gig.id, employer_id: employerId, worker_id: app.worker_id,
    amount_cents: price.total, worker_cents: price.pay, fee_cents: price.fee, status: 'pending', auth_url: data.authorization_url,
  });
  return { url: data.authorization_url, reference };
}

/**
 * Ask Paystack how a payment ended, and act on it once. Used when the person
 * comes back from Paystack's page, and by the webhook.
 */
export async function verifyReference(reference) {
  const p = await get('SELECT * FROM payments WHERE reference = ?', [String(reference || '')]);
  if (!p) throw new PaymentError('That payment could not be found.', 404, 'not_found');
  if (['success', 'failed', 'refunded'].includes(p.status)) return { kind: p.kind, ...paymentOut(p) };

  const data = await paystack('GET', `/transaction/verify/${encodeURIComponent(p.reference)}`);
  if (data?.status === 'success') {
    /* Claim it, so the browser and the webhook arriving together act once. */
    const claimed = await get("UPDATE payments SET status = 'success', paid_at = ?, updated_at = ? WHERE id = ? AND status != 'success' RETURNING id", [now(), now(), p.id]);
    if (claimed) {
      await keepCard(p.employer_id, data.authorization, data.customer?.email ?? (await get('SELECT email FROM users WHERE id = ?', [p.employer_id]))?.email);
      if (p.kind === 'card_check') {
        try {
          await paystack('POST', '/refund', { transaction: p.reference, merchant_note: 'Card check, refunded automatically' });
          await setStatus(p.id, 'refunded');
        } catch (e) {
          console.warn(`paystack: card-check refund failed for ${p.reference}: ${e.providerMessage || e.message}`);
        }
      }
    }
  } else if (['failed', 'abandoned', 'reversed'].includes(data?.status)) {
    await setStatus(p.id, 'failed', { message: String(data.gateway_response || data.status) });
  }
  const after = await get('SELECT * FROM payments WHERE id = ?', [p.id]);
  return { kind: after.kind, applicationId: after.application_id, ...paymentOut(after) };
}

/** Jobs waiting on this worker's bank details, to retry once they add them. */
export async function retryWaitingFor(workerId) {
  if (!paystackOn()) return [];
  const rows = await all("SELECT DISTINCT application_id FROM payments WHERE kind = 'job' AND worker_id = ? AND status = 'waiting_bank'", [workerId]);
  const out = [];
  for (const r of rows) {
    const latest = await latestFor(r.application_id);
    if (latest?.status === 'waiting_bank') out.push({ applicationId: r.application_id, result: await payForApplication(r.application_id) });
  }
  return out;
}

/** A worker's payments, for their wallet screen. */
export async function workerPayments(workerId) {
  const rows = await all(
    `SELECT p.*, g.title AS gig_title FROM payments p LEFT JOIN gigs g ON g.id = p.gig_id
      WHERE p.kind = 'job' AND p.worker_id = ? ORDER BY p.created_at DESC LIMIT 200`,
    [workerId],
  );
  /* One line per job: its latest attempt. */
  const seen = new Set();
  const latest = rows.filter((r) => (seen.has(r.application_id) ? false : (seen.add(r.application_id), true)));
  const payout = await get('SELECT bank, account_last4 FROM payout_accounts WHERE user_id = ?', [workerId]);
  return {
    mode: paystackMode(),
    payout: payout ? { bank: payout.bank, last4: payout.account_last4 } : null,
    paidCents: latest.filter((r) => r.status === 'success').reduce((s, r) => s + Number(r.worker_cents), 0),
    waitingCents: latest.filter((r) => r.status !== 'success').reduce((s, r) => s + Number(r.worker_cents), 0),
    payments: latest.map((r) => ({ id: r.id, gigTitle: r.gig_title ?? null, ...paymentOut(r), at: r.paid_at ?? r.created_at })),
  };
}

/* ---------------- webhook ---------------- */

/**
 * Paystack's signature: header "paystack-signature: t=<unix>,v1=<kid>:<hex>",
 * HMAC-SHA512 over "<t>." + raw body with the whsec_ secret, five minutes'
 * tolerance. Ported from Paystack's own snippet.
 */
export function verifySignature(rawBody, header, secrets, nowSec = Math.floor(Date.now() / 1000)) {
  if (!Buffer.isBuffer(rawBody) || typeof header !== 'string') return null;
  let t = null;
  const entries = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key === 't') {
      if (t !== null || !/^[0-9]+$/.test(value)) return null;
      t = Number(value);
    } else if (key === 'v1') {
      const j = value.indexOf(':');
      if (j !== -1) entries.push({ kid: value.slice(0, j), hex: value.slice(j + 1) });
    }
  }
  if (t === null || entries.length === 0) return null;
  if (Math.abs(nowSec - t) > 300) return null;
  for (const s of secrets) {
    const expected = crypto.createHmac('sha512', s).update(`${t}.`).update(rawBody).digest();
    for (const { kid, hex } of entries) {
      if (!/^[0-9a-f]{128}$/.test(hex)) continue;
      if (crypto.timingSafeEqual(expected, Buffer.from(hex, 'hex'))) return kid;
    }
  }
  return null;
}
