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
import { api, type Wallet } from '../../lib/api';
import { money } from '../../lib/format';
import { useApp } from '../../store/appStore';
import { Button, Sheet } from '../../components/ui';
import { TestModeNote } from '../../components/Funding';

export function WalletSheet({ onClose, onNeedBank }: { onClose: () => void; onNeedBank: () => void }) {
  const { toast } = useApp();
  const [wallet, setWallet] = useState<Wallet | null>(null);
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
      toast(`${money(out.amount)} sent to ${out.to}${out.mode === 'test' ? ' (test mode — no real money moved)' : ''}`);
      await load();
    } catch (e) {
      const err = e as { message: string; reason?: string };
      if (err.reason === 'needs_banking') { toast(err.message); onNeedBank(); return; }
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="My wallet" onClose={onClose}>
      {wallet?.mode !== 'live' && <TestModeNote className="mb-4" />}

      {error && <p className="text-small text-danger mb-3">{error}</p>}

      <div className="rounded-3xl feature-band p-5 mb-3">
        <small className="block text-micro font-bold uppercase tracking-wide text-on-feature-dim">Available to withdraw</small>
        <b className="block font-display text-display font-extrabold text-on-feature font-mono tnum leading-none mt-1.5">
          {wallet ? money(wallet.balance) : '…'}
        </b>
        {wallet && wallet.pending > 0 && (
          <p className="text-small text-on-feature-dim mt-2 mb-0">
            + <b className="font-mono tnum text-on-feature">{money(wallet.pending)}</b> secured on jobs you are doing — it arrives here when each is confirmed.
          </p>
        )}
      </div>

      <Button block icon="wallet" disabled={busy || !wallet || wallet.balance <= 0} onClick={withdraw}>
        {busy ? 'Withdrawing…' : wallet && wallet.balance > 0 ? `Withdraw ${money(wallet.balance)} to my bank` : 'Nothing to withdraw yet'}
      </Button>
      <p className="text-micro text-dim text-center mt-2 mb-4">It goes to the account under “Get paid”.</p>

      <h3 className="font-display text-small font-extrabold text-ink uppercase tracking-wide mb-2">History</h3>
      {wallet && wallet.entries.length === 0 && (
        <p className="text-small text-dim leading-relaxed">
          Nothing yet. When an employer confirms a job you did, its pay lands here.
        </p>
      )}
      <ul className="flex flex-col divide-y divide-line-soft m-0 p-0 list-none">
        {wallet?.entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="text-small font-semibold text-ink truncate">
                {e.kind === 'release' ? (e.gigTitle ?? 'Job confirmed') : `Withdrawn to ${e.note ?? 'your bank'}`}
              </div>
              <div className="text-micro text-dim">
                {new Date(e.at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                {e.testMode ? ' · test mode' : ''}
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
