/**
 * Banking / payout details.
 *
 * These live on the SERVER: the account number is encrypted at rest and is
 * never sent back to the app. Reads return only what the UI needs to show a
 * masked hint — holder, bank, account type and the last 4 digits. Nothing
 * sensitive is written to the device.
 *
 * The summary is cached in-module and shared through `useBanking()` so several
 * screens can show the same state without each refetching.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { api, type BankingInput, type BankingSummary } from './api';
import { tr } from '../i18n';

export interface SaBank { id: string; name: string; branchCode: string }

/* Every universal branch code below was checked against published sources on
   15 September 2026. A wrong one does not fail loudly — it sends somebody's
   wages to the wrong bank — so re-check rather than assume if this list is
   ever extended. */

/** Major SA banks with their universal branch codes.
    Bank names are brand names and stay as the bank writes them. */
export const SA_BANKS: SaBank[] = [
  // i18n-ignore: bank name
  { id: 'absa', name: 'Absa', branchCode: '632005' },
  { id: 'fnb', name: 'FNB', branchCode: '250655' },
  // i18n-ignore: bank name
  { id: 'standard', name: 'Standard Bank', branchCode: '051001' },
  // i18n-ignore: bank name
  { id: 'nedbank', name: 'Nedbank', branchCode: '198765' },
  // i18n-ignore: bank name
  { id: 'capitec', name: 'Capitec', branchCode: '470010' },
  /* Renamed in January 2026. The id stays 'tymebank' so accounts already saved
     still resolve, and the old name is kept in the label so somebody looking
     for the bank they opened recognises it. The branch code did not change. */
  { id: 'tymebank', get name() { return tr('common.bank.tymebank'); }, branchCode: '678910' },
  // i18n-ignore: bank name
  { id: 'africanbank', name: 'African Bank', branchCode: '430000' },
  // i18n-ignore: bank name
  { id: 'discovery', name: 'Discovery Bank', branchCode: '679000' },
  // i18n-ignore: bank name
  { id: 'investec', name: 'Investec', branchCode: '580105' },
  // i18n-ignore: bank name
  { id: 'bankzero', name: 'Bank Zero', branchCode: '888000' },
  // i18n-ignore: bank name
  { id: 'postbank', name: 'Postbank', branchCode: '460005' },
];

export const bankById = (id: string): SaBank | undefined => SA_BANKS.find((b) => b.id === id);

export type { BankingSummary, BankingInput };

/* ---------------- shared cache ---------------- */
type State = { status: 'idle' | 'loading' | 'ready'; details: BankingSummary | null };

let state: State = { status: 'idle', details: null };
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Fetch once per session (or after a change). Failures leave status idle so a later screen retries. */
async function load() {
  if (state.status !== 'idle') return;
  set({ ...state, status: 'loading' });
  try {
    set({ status: 'ready', details: await api.getBanking() });
  } catch {
    set({ status: 'idle', details: null });
  }
}

/** Drop the cache — call on sign-out so the next account starts clean. */
export function resetBanking() {
  set({ status: 'idle', details: null });
}

export async function saveBanking(input: BankingInput): Promise<BankingSummary> {
  const saved = await api.saveBanking(input);
  set({ status: 'ready', details: saved });
  return saved;
}

export async function clearBanking(): Promise<void> {
  await api.deleteBanking();
  set({ status: 'ready', details: null });
}

/** e.g. "Capitec •••• 4321" — safe to show in a row subtitle. */
export function bankingSummaryText(d: BankingSummary | null): string | null {
  if (!d) return null;
  return `${bankById(d.bank)?.name ?? tr('common.bank.fallback')} •••• ${d.last4}`;
}

/** Subscribe a component to the payout details, loading them on first use. */
export function useBanking(): { banking: BankingSummary | null; loading: boolean } {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  useEffect(() => { void load(); }, []);
  return { banking: snapshot.details, loading: snapshot.status !== 'ready' };
}
