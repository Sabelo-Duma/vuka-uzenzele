import { useEffect, useState } from 'react';
import { useApp } from '../store/appStore';

/**
 * Global toast — listens to store.toast and auto-dismisses.
 *
 * Anchored to the TOP on small screens. It used to sit at bottom-24, which on a
 * phone is behind the on-screen keyboard — so every message raised while a form
 * was focused was invisible, and a failed action looked like a dead button.
 * Keyboards cover the bottom of the screen and never the top.
 *
 * Toasts are still the wrong tool for an error the user must act on: this one
 * disappears after 2.4 seconds. Those belong inline on the form.
 */
export function Toast() {
  const { state } = useApp();
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!state.toast) return;
    setMsg(state.toast.msg);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(t);
  }, [state.toast]);

  return (
    <div
      aria-live="polite"
      role="status"
      className={`fixed left-1/2 -translate-x-1/2 z-[70] rounded-2xl sm:rounded-pill bg-navy text-white
        top-[max(12px,env(safe-area-inset-top))] sm:top-auto sm:bottom-8
        max-w-[calc(100vw-24px)] sm:max-w-[min(420px,calc(100vw-32px))]
        px-4.5 py-3 text-small font-bold text-center shadow-e3 transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 sm:translate-y-4 pointer-events-none'}`}
      style={{ paddingLeft: 18, paddingRight: 18 }}
    >
      {msg}
    </div>
  );
}
