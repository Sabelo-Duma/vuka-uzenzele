/* ============================================================
   Card payments through Paystack (vuka-server/src/payments.mjs).

   Shown only when the server says paymentsMode is 'card'. The employer adds a
   card once, on Paystack's own page (a small check charge, refunded); the card
   is charged when a job is done, and the worker's pay goes straight to their
   bank. Nothing here touches card numbers: Paystack's page does.

   Leaving for Paystack loses the app's place, so where to come back to is
   kept in sessionStorage, and /paystack-return picks it up (PaystackReturn).
   ============================================================ */
import { useCallback, useEffect, useState } from 'react';
import { api, type Applicant, type PaymentState, type PaymentsConfig } from '../lib/api';
import { money } from '../lib/format';
import { useApp } from '../store/appStore';
import type { Gig } from '../types';
import { BoldText, Button, Sheet } from './ui';
import { Icon } from './Icon';
import { useT } from '../providers/LanguageProvider';

const RETURN_KEY = 'vuka-paystack-return';

/* Written out rather than built from the status, so every key is visible to
   the translation checks. */
const STATUS_KEY: Record<string, string> = {
  success: 'common.pay.status.success', waiting_bank: 'common.pay.status.waitingBank', failed: 'common.pay.status.failed',
  needs_card: 'common.pay.status.needsCard', paused: 'common.pay.status.paused', pending: 'common.pay.status.pending',
  charging: 'common.pay.status.pending',
};
type Back = { reference: string; screen: 'applicants'; id: string };

function goToPaystack(url: string, back: Back) {
  try { sessionStorage.setItem(RETURN_KEY, JSON.stringify(back)); } catch { /* the reference also comes back in the URL */ }
  window.location.assign(url);
}

/** Said under every card-payment screen while the keys are Paystack's test keys. */
export function PaystackTestNote({ mode, className = '' }: { mode?: string; className?: string }) {
  const t = useT();
  if (mode !== 'test') return null;
  return (
    <p className={`flex gap-2 items-start rounded-2xl border border-line bg-info-soft px-3.5 py-2.5 text-small text-ink leading-snug ${className}`}>
      <Icon name="alert" size={16} />
      <span><BoldText text={t('common.pay.testMode')} /></span>
    </p>
  );
}

/** Add (or replace) the employer's card. */
export function AddCardSheet({ backTo, onClose }: { backTo: string; onClose: () => void }) {
  const t = useT();
  const { state, toast } = useApp();
  const [cfg, setCfg] = useState<PaymentsConfig | null>(null);
  const [email, setEmail] = useState(state.user?.email ?? '');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.paymentsConfig().then(setCfg).catch(() => {}); }, []);

  const go = async () => {
    setBusy(true);
    try {
      const out = await api.addCard(email.trim());
      goToPaystack(out.url, { reference: out.reference, screen: 'applicants', id: backTo });
    } catch (e) {
      toast((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Sheet title={t('common.pay.addTitle')} onClose={onClose}>
      <p className="text-body text-ink leading-relaxed m-0 mb-4">
        {t('common.pay.addBody', { check: money(cfg?.cardCheck ?? 5) })}
      </p>
      <label className="block mb-4">
        <span className="block text-small font-bold text-ink mb-1.5">{t('common.pay.email')}</span>
        <input
          type="email" inputMode="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-h-[44px] px-3.5 rounded-xl border border-line bg-surface text-body text-ink"
        />
      </label>
      <Button block icon="lock" disabled={busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} onClick={go}>
        {busy ? t('common.pay.opening') : t('common.pay.continue')}
      </Button>
      <PaystackTestNote mode={cfg?.mode} className="mt-4" />
    </Sheet>
  );
}

/** On the employer's job: what it costs, the card, and how the payment went. */
export function CardPayPanel({ gig, hired, onAddCard }: { gig: Gig; hired?: Applicant; onAddCard: () => void }) {
  const t = useT();
  const { toast } = useApp();
  const [cfg, setCfg] = useState<PaymentsConfig | null>(null);
  const [pay, setPay] = useState<PaymentState | null>(null);
  const [busy, setBusy] = useState(false);
  const appId = hired?.status === 'completed' ? hired.applicationId : null;

  const load = useCallback(async () => {
    try { setCfg(await api.paymentsConfig()); } catch { /* the panel just stays plain */ }
    if (appId) { try { setPay(await api.applicationPayment(appId)); } catch { /* shown as not loaded */ } }
  }, [appId]);
  useEffect(() => { void load(); }, [load]);

  const total = gig.totalPay ?? Math.round(gig.hours * gig.payPerHour);
  const fee = Math.round(total * (cfg?.feePercent ?? 10)) / 100;
  const first = hired?.worker.name.split(' ')[0] ?? '';

  const payNow = async (method?: 'checkout') => {
    if (!appId) return;
    setBusy(true);
    try {
      const out = await api.payApplication(appId, method);
      if ('url' in out && out.url) { goToPaystack(out.url, { reference: out.reference, screen: 'applicants', id: gig.id }); return; }
      if ('payment' in out && out.payment?.status === 'paused' && out.payment.authUrl) { window.location.assign(out.payment.authUrl); return; }
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const status = pay?.payment?.status;
  return (
    <div className="mt-3 pt-3 border-t border-line-soft">
      <p className="text-small text-ink leading-relaxed m-0 mb-2.5">
        <BoldText text={t('common.pay.how', { total: money(total + fee), pay: money(total), fee: money(fee) })} />
      </p>

      {cfg?.card ? (
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <span className="inline-flex items-center gap-2 text-small text-dim">
            <Icon name="lock" size={14} />{t('common.pay.cardOnFile', { brand: cfg.card.brand.toUpperCase(), last4: cfg.card.last4 })}
          </span>
          <Button size="sm" variant="ghost" onClick={onAddCard}>{t('common.pay.changeCard')}</Button>
        </div>
      ) : cfg && !hired ? (
        <>
          <p className="text-small text-dim leading-relaxed m-0 mb-2.5">{t('common.pay.noCardYet')}</p>
          <Button block size="sm" icon="lock" onClick={onAddCard}>{t('common.pay.addCard')}</Button>
        </>
      ) : null}

      {appId && status && (
        <div className="mt-2.5">
          <p className={`text-small leading-relaxed m-0 ${status === 'success' ? 'text-verified font-semibold' : 'text-ink'}`}>
            {t(STATUS_KEY[status] ?? 'common.pay.status.pending', { amount: money(pay?.payment?.amount ?? 0), pay: money(pay?.payment?.pay ?? 0), name: first })}
          </p>
          {status === 'paused' && pay?.payment?.authUrl && (
            <Button block size="sm" className="mt-2.5" onClick={() => window.location.assign(pay.payment!.authUrl!)}>{t('common.pay.approve')}</Button>
          )}
          {(status === 'failed' || status === 'needs_card') && (
            <div className="flex flex-col gap-2 mt-2.5">
              {cfg?.card && status === 'failed' && (
                <Button block size="sm" disabled={busy} onClick={() => payNow()}>{t('common.pay.payNow', { amount: money(pay?.price.total ?? total + fee) })}</Button>
              )}
              <Button block size="sm" variant={cfg?.card && status === 'failed' ? 'ghost' : undefined} disabled={busy} onClick={() => payNow('checkout')}>
                {cfg?.card && status === 'failed' ? t('common.pay.changeCard') : t('common.pay.payNow', { amount: money(pay?.price.total ?? total + fee) })}
              </Button>
            </div>
          )}
        </div>
      )}
      <PaystackTestNote mode={cfg?.mode} className="mt-3" />
    </div>
  );
}

/**
 * Back from Paystack's page: ask the server how it went, say so, and return
 * to the screen the person left from. Rendered once the person is signed in.
 */
export function PaystackReturn() {
  const t = useT();
  const { state, navigate, toast } = useApp();
  useEffect(() => {
    if (state.status !== 'authed') return;
    let saved: Back | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(RETURN_KEY) || 'null'); } catch { saved = null; }
    const onReturnPage = window.location.pathname === '/paystack-return';
    if (!onReturnPage && !saved) return;
    let params: URLSearchParams | null = null;
    try { params = new URLSearchParams(window.location.search); } catch { params = null; }
    const reference = params?.get('reference') || params?.get('trxref') || saved?.reference;
    try { sessionStorage.removeItem(RETURN_KEY); } catch { /* fine */ }
    if (onReturnPage) { try { window.history.replaceState({}, '', '/'); } catch { /* fine */ } }
    if (!reference) return;
    toast(t('common.pay.checking'));
    api.verifyPayment(reference)
      .then((out) => {
        if (out.status === 'success' || out.status === 'refunded') toast(t(out.kind === 'card_check' ? 'common.pay.cardSaved' : 'common.pay.jobPaid'));
        else toast(t('common.pay.notDone'));
      })
      .catch((e) => toast((e as Error).message))
      .finally(() => { if (saved?.screen === 'applicants' && saved.id) navigate('applicants', saved.id); });
  }, [state.status]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** For a worker looking at a job: how and when they are paid. */
export function WorkerCardPayNote({ gig }: { gig: Gig }) {
  const t = useT();
  if (gig.paymentsMode !== 'card') return null;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 mb-4">
      <p className="flex gap-2.5 m-0 text-small text-ink leading-relaxed">
        <span className="text-verified shrink-0"><Icon name="wallet" size={18} /></span>
        <span><BoldText text={t('common.pay.workerNote', { total: money(gig.totalPay ?? Math.round(gig.hours * gig.payPerHour)) })} /></span>
      </p>
    </div>
  );
}
