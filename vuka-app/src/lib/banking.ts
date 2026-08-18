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

export interface SaBank { id: string; name: string; branchCode: string }

/** Major SA banks with their universal branch codes. */
export const SA_BANKS: SaBank[] = [
  { id: 'absa', name: 'Absa', branchCode: '632005' },
  { id: 'fnb', name: 'FNB', branchCode: '250655' },
  { id: 'standard', name: 'Standard Bank', branchCode: '051001' },
  { id: 'nedbank', name: 'Nedbank', branchCode: '198765' },
  { id: 'capitec', name: 'Capitec', branchCode: '470010' },
  { id: 'tymebank', name: 'TymeBank', branchCode: '678910' },
  { id: 'africanbank', name: 'African Bank', branchCode: '430000' },
  { id: 'discovery', name: 'Discovery Bank', branchCode: '679000' },
  { id: 'investec', name: 'Investec', branchCode: '580105' },
  { id: 'bankzero', name: 'Bank Zero', branchCode: '888000' },
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
  return `${bankById(d.bank)?.name ?? 'Bank'} •••• ${d.last4}`;
}

/** Subscribe a component to the payout details, loading them on first use. */
export function useBanking(): { banking: BankingSummary | null; loading: boolean } {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  useEffect(() => { void load(); }, []);
  return { banking: snapshot.details, loading: snapshot.status !== 'ready' };
}
