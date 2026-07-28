import { useEffect, useState } from 'react';
import { useApp } from '../store/appStore';

/** Global toast — listens to store.toast and auto-dismisses. */
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
      className={`fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-8 z-[70] rounded-pill bg-navy text-white
        px-4.5 py-3 text-[13px] font-bold shadow-e3 whitespace-nowrap transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      style={{ paddingLeft: 18, paddingRight: 18 }}
    >
      {msg}
    </div>
  );
}
