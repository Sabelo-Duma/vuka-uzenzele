import { useCallback, useEffect, useRef } from 'react';

/**
 * aria-live announcements for async updates (SignalR row changes, AI progress, autosave).
 * Creates a visually-hidden live region; polite by default, assertive for errors/deadline modals.
 */
export function useAnnounce() {
  const politeRef = useRef<HTMLElement | null>(null);
  const assertiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const make = (politeness: 'polite' | 'assertive') => {
      const el = document.createElement('div');
      el.setAttribute('aria-live', politeness);
      el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
      el.className = 'gj-sr-only';
      document.body.appendChild(el);
      return el;
    };
    politeRef.current = make('polite');
    assertiveRef.current = make('assertive');
    return () => {
      politeRef.current?.remove();
      assertiveRef.current?.remove();
    };
  }, []);

  return useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const el = politeness === 'assertive' ? assertiveRef.current : politeRef.current;
    if (!el) return;
    el.textContent = '';
    // rAF ensures repeat messages re-announce
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, []);
}
