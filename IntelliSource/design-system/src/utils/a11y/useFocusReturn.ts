import { useEffect, useRef } from 'react';

/** Returns focus to the triggering element when a dialog/drawer closes (UX spec §6.2). */
export function useFocusReturn(open: boolean): void {
  const previous = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previous.current = (document.activeElement as HTMLElement) ?? null;
      return () => {
        previous.current?.focus?.();
      };
    }
    return undefined;
  }, [open]);
}
