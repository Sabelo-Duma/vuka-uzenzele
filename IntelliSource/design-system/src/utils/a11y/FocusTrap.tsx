import type { ReactNode, RefObject } from 'react';
import { useEffect, useRef } from 'react';

/** Focus trap for modals/drawers (WCAG 2.1 AA — no keyboard traps *outside* the dialog contract). */
export interface FocusTrapProps {
  active: boolean;
  children: ReactNode;
  /** Element to focus on activation (defaults to first focusable). */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function FocusTrap({ active, children, initialFocusRef }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const target = initialFocusRef?.current ?? container.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, initialFocusRef]);

  return <div ref={containerRef}>{children}</div>;
}
