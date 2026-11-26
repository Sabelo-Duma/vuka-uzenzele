import { useEffect, useState } from 'react';
import { api, type PaymentsConfig } from './api';

/* One read of the payment settings per app load, shared by every screen that
   words things differently for card payments (Paystack) and the test ledger.
   A failed read is forgotten, so the next screen tries again. */
let cached: Promise<PaymentsConfig | null> | null = null;

export function loadPaymentsConfig(): Promise<PaymentsConfig | null> {
  cached ??= api.paymentsConfig().catch(() => { cached = null; return null; });
  return cached;
}

/** Undefined while loading, null if it could not be read. */
export function usePaymentsConfig(): PaymentsConfig | null | undefined {
  const [config, setConfig] = useState<PaymentsConfig | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadPaymentsConfig().then((c) => { if (live) setConfig(c); });
    return () => { live = false; };
  }, []);
  return config;
}

/** True when payments go by card through Paystack. */
export const isCardMode = (c: PaymentsConfig | null | undefined) => c?.provider === 'paystack';
