import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useT } from '../providers/LanguageProvider';
import { MsiziOrb } from './MsiziOrb';

/**
 * Msizi's floating button, which you can move.
 *
 * It used to be pinned bottom-right, which on the chat screen is exactly where
 * the send button is: reported from a phone as making it hard to send a
 * message. Now you hold and drag it anywhere. When you let go it settles
 * against the nearer side, like a chat head, and it stays there next time.
 * A tap still opens Msizi; only a real drag (more than a few pixels) moves it.
 *
 * Its resting place is kept between the header and the tab bar, and on the
 * chat screen it is lifted clear of the message box however low you left it.
 * It hides while the keyboard is up and on the Msizi screen itself.
 */

const SIZE = 64;
const EDGE = 14;          // gap to the side of the screen
const TAB_BAR = 74;       // tab bar height, above the home-indicator inset
const COMPOSER = 92;      // extra lift on the chat screen, clear of the message box
const HEADER = 56 + 12;   // top bar plus breathing room
const DRAG_PX = 6;        // movement that turns a tap into a drag
const KEY = 'vuka-msizi-fab';

type Spot = { side: 'left' | 'right'; bottom: number };

function load(): Spot {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '');
    if ((s.side === 'left' || s.side === 'right') && Number.isFinite(s.bottom)) return s;
  } catch { /* first run, private mode, or garbage: use the default */ }
  return { side: 'right', bottom: TAB_BAR };
}

function save(s: Spot) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* not worth failing over */ }
}

/** The safe-area insets, which CSS knows and JavaScript does not. */
function insets(): { top: number; bottom: number } {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const out = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  probe.remove();
  return out;
}

export function MsiziFab({ onOpen, hidden, onChat }: { onOpen: () => void; hidden: boolean; onChat: boolean }) {
  const t = useT();
  const [spot, setSpot] = useState<Spot>(load);
  /** While dragging: the orb's top-left, in px. */
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const safe = useRef({ top: 0, bottom: 0 });

  const [, reflow] = useState(0);
  useEffect(() => {
    safe.current = insets();
    const onResize = () => reflow((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const lowest = TAB_BAR + (onChat ? COMPOSER : 0);
  const highest = () => window.innerHeight - safe.current.top - safe.current.bottom - HEADER - SIZE;
  const clampBottom = (b: number) => Math.min(Math.max(b, lowest), Math.max(lowest, highest()));

  if (hidden) return null;

  const down = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    start.current = { px: e.clientX, py: e.clientY, ox: r.left, oy: r.top, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.px, dy = e.clientY - s.py;
    if (!s.moved && Math.hypot(dx, dy) < DRAG_PX) return;
    s.moved = true;
    const maxX = window.innerWidth - SIZE;
    const maxY = window.innerHeight - SIZE;
    setDrag({ x: Math.min(Math.max(s.ox + dx, 0), maxX), y: Math.min(Math.max(s.oy + dy, 0), maxY) });
  };
  const up = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    if (!s.moved) { onOpen(); return; }
    const x = drag?.x ?? s.ox, y = drag?.y ?? s.oy;
    const next: Spot = {
      side: x + SIZE / 2 < window.innerWidth / 2 ? 'left' : 'right',
      bottom: clampBottom(window.innerHeight - y - SIZE - safe.current.bottom),
    };
    setDrag(null);
    setSpot(next);
    save(next);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const style: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y, transition: 'none' }
    : {
        /* Both sides as left, so settling against the nearer edge slides
           there instead of jumping. */
        left: spot.side === 'left' ? EDGE : window.innerWidth - SIZE - EDGE,
        bottom: `calc(${clampBottom(spot.bottom)}px + env(safe-area-inset-bottom))`,
      };

  return (
    <button
      aria-label={t('msizi.open')}
      title={t('common.msiziFab.hint')}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { start.current = null; setDrag(null); }}
      /* A click with no pointer behind it (detail 0) is the keyboard or a
         screen reader: an ordinary button press. Pointer taps open on release. */
      onClick={(e) => { if (e.detail === 0) onOpen(); }}
      style={{ ...style, width: SIZE, height: SIZE, touchAction: 'none' }}
      className={`lg:hidden fixed z-40 grid place-items-center rounded-full select-none
        transition-[left,bottom,transform] duration-300 ease-out
        ${drag ? 'scale-110 cursor-grabbing' : 'active:scale-95 cursor-grab'}`}
    >
      <MsiziOrb size={52} mark />
    </button>
  );
}
