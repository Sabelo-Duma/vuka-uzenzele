/* ============================================================
   The worker's wallet.

   Where confirmed pay lands, and where it is withdrawn from. Three numbers a
   worker needs, in order of how often they ask: what they can take out now,
   what is secured on a job they are doing, and what happened when.

   Withdrawal goes to the bank account saved under "Get paid"; with none
   saved, the button says so and takes them there rather than failing.

   TEST MODE until a payment provider is connected: the sheet says so above
   the balance, where it cannot be missed.
   ============================================================ */
import { useCallback, useEffect, useState } from 'react';
import { api, type CardWallet, type Wallet } from '../../lib/api';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Button, Sheet } from '../../components/ui';
import { TestModeNote } from '../../components/Funding';
import { useLanguage, useT } from '../../providers/LanguageProvider';
import { langMeta } from '../../i18n';
import { fill } from './fill';

export function WalletSheet({ onClose, onNeedBank }: { onClose: () => void; onNeedBank: () => void }) {
  const { toast } = useApp();
  const t = useT();
  const { lang } = useLanguage();
  const [loaded, setWallet] = useState<Wallet | CardWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setWallet(await api.getWallet()); setError(null); }
    catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const withdraw = async () => {
    setBusy(true);
    try {
      const out = await api.withdrawWallet();
      toast(t(out.mode === 'test' ? 'worker.wallet.sentTest' : 'worker.wallet.sent', { amount: money(out.amount), to: out.to }));
      await load();
    } catch (e) {
      const err = e as { message: string; reason?: string };
      if (err.reason === 'needs_banking') { toast(err.message); onNeedBank(); return; }
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* Card mode (Paystack): nothing to withdraw — pay goes to the bank. */
  if (loaded?.mode === 'card') return <CardWalletSheet w={loaded} onClose={onClose} onNeedBank={onNeedBank} />;
  const wallet = loaded as Wallet | null;

  return (
    <Sheet title={t('worker.myWallet')} onClose={onClose}>
      {wallet?.mode !== 'live' && <TestModeNote className="mb-4" />}

      {error && <p className="text-small text-danger mb-3">{error}</p>}

      <div className="rounded-3xl feature-band p-5 mb-3">
        <small className="block text-micro font-bold uppercase tracking-wide text-on-feature-dim">{t('worker.wallet.available')}</small>
        <b className="block font-display text-display font-extrabold text-on-feature font-mono tnum leading-none mt-1.5">
          {wallet ? money(wallet.balance) : '…'}
        </b>
        {wallet && wallet.pending > 0 && (
          <p className="text-small text-on-feature-dim mt-2 mb-0">
            {fill(t('worker.wallet.pending'), { amount: <b className="font-mono tnum text-on-feature">{money(wallet.pending)}</b> })}
          </p>
        )}
      </div>

      <Button block icon="wallet" disabled={busy || !wallet || wallet.balance <= 0} onClick={withdraw}>
        {busy ? t('worker.wallet.withdrawing') : wallet && wallet.balance > 0 ? t('worker.wallet.withdraw', { amount: money(wallet.balance) }) : t('worker.wallet.nothing')}
      </Button>
      <p className="text-micro text-dim text-center mt-2 mb-4">{t('worker.wallet.goesTo', { row: t('worker.getPaid') })}</p>

      <h3 className="font-display text-small font-extrabold text-ink uppercase tracking-wide mb-2">{t('worker.wallet.history')}</h3>
      {wallet && wallet.entries.length === 0 && (
        <p className="text-small text-dim leading-relaxed">
          {t('worker.wallet.empty')}
        </p>
      )}
      <ul className="flex flex-col divide-y divide-line-soft m-0 p-0 list-none">
        {wallet?.entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="text-small font-semibold text-ink truncate">
                {e.kind === 'release' ? (e.gigTitle ?? t('worker.jobConfirmed')) : t('worker.wallet.withdrawnTo', { bank: e.note ?? t('worker.wallet.yourBank') })}
              </div>
              <div className="text-micro text-dim">
                {new Date(e.at).toLocaleDateString(langMeta(lang).tag, { day: 'numeric', month: 'short', year: 'numeric' })}
                {e.testMode ? ` · ${t('worker.wallet.testMode')}` : ''}
              </div>
            </div>
            <b className={`font-mono tnum text-small shrink-0 ${e.amount > 0 ? 'text-verified' : 'text-ink'}`}>
              {e.amount > 0 ? '+' : '−'}{money(Math.abs(e.amount))}
            </b>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** Card mode: what has been paid to the worker's bank, and what is on its way. */
function CardWalletSheet({ w, onClose, onNeedBank }: { w: CardWallet; onClose: () => void; onNeedBank: () => void }) {
  const t = useT();
  const { lang } = useLanguage();
  return (
    <Sheet title={t('worker.myPay')} onClose={onClose}>
      <div className="rounded-3xl feature-band p-5 mb-3">
        <small className="block text-micro font-bold uppercase tracking-wide text-on-feature-dim">{t('common.pay.walletPaid')}</small>
        <b className="block font-display text-display font-extrabold text-on-feature font-mono tnum leading-none mt-1.5">{money(w.paid)}</b>
        {w.waiting > 0 && (
          <p className="text-small text-on-feature-dim mt-2 mb-0">{t('common.pay.walletWaiting', { amount: money(w.waiting) })}</p>
        )}
      </div>
      {w.payout ? (
        <p className="text-small text-dim text-center mt-1 mb-4">{t('common.pay.walletTo', { bank: w.payout.bank.toUpperCase(), last4: w.payout.last4 })}</p>
      ) : (
        <>
          <p className="text-small text-ink mt-1 mb-2">{t('common.pay.walletNoBank')}</p>
          <Button block icon="wallet" onClick={onNeedBank}>{t('worker.getPaid')}</Button>
          <div className="mb-4" />
        </>
      )}
      <h3 className="font-display text-small font-extrabold text-ink uppercase tracking-wide mb-2">{t('worker.wallet.history')}</h3>
      {w.payments.length === 0 && <p className="text-small text-dim leading-relaxed">{t('common.pay.walletEmpty')}</p>}
      <ul className="flex flex-col divide-y divide-line-soft m-0 p-0 list-none">
        {w.payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="text-small font-semibold text-ink truncate">{p.gigTitle ?? t('worker.jobConfirmed')}</div>
              <div className="text-micro text-dim">
                {new Date(p.at).toLocaleDateString(langMeta(lang).tag, { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{p.status === 'success' ? t('common.pay.rowPaid') : t('common.pay.rowWaiting')}
              </div>
            </div>
            <b className={`font-mono tnum text-small shrink-0 ${p.status === 'success' ? 'text-verified' : 'text-dim'}`}>{money(p.pay)}</b>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
