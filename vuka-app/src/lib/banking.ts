/**
 * Banking details, stored on the device for now.
 *
 * Backend persistence is deliberately parked, so — like prefs/appliedFormal —
 * this saves locally so the feature genuinely works (persists across reloads,
 * shows a real saved state). When the payments backend lands, swap read/save
 * for API calls; the shape and callers stay the same.
 *
 * NOTE: for a pilot only. Real payout details must move server-side (encrypted)
 * before money flows — flagged in the costing model.
 */

export interface BankDetails {
  holder: string;      // account holder name
  bank: string;        // bank id (see SA_BANKS)
  accountNumber: string;
  accountType: 'cheque' | 'savings';
}

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

const KEY = 'vuka-banking';

export function getBanking(): BankDetails | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BankDetails) : null;
  } catch {
    return null;
  }
}

export function saveBanking(d: BankDetails): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage unavailable */
  }
}

export function clearBanking(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** e.g. "Capitec •••• 4321" — safe to show in the row subtitle. */
export function bankingSummary(): string | null {
  const d = getBanking();
  if (!d) return null;
  const last4 = d.accountNumber.slice(-4);
  const name = bankById(d.bank)?.name ?? 'Bank';
  return `${name} •••• ${last4}`;
}
