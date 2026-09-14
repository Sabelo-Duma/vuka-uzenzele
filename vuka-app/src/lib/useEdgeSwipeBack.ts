import { useEffect } from 'react';

/**
 * Swipe in from the left edge to go back.
 *
 * On a phone this is the gesture people already have in their thumbs, and
 * without it every retreat has to be made by finding a small arrow at the top
 * of a screen you have scrolled to the bottom of — or by going sideways
 * through the tab bar, which is not going back at all.
 *
 * Deliberately narrow, because a gesture that fires when you did not mean it
 * is worse than no gesture:
 *
 *  - it must start within EDGE px of the left edge, where nothing else lives
 *  - it must travel THRESHOLD px right, and mostly horizontally
 *  - it must not start inside something that scrolls sideways, or the category
 *    rail would throw you off the screen
 *  - one finger only, so a pinch never counts
 *
 * It does not animate. A transition that tracks the finger needs the outgoing
 * screen kept alive and painted, and this app re-renders a single screen from
 * state — faking it would cost more than the gesture is worth.
 */
const EDGE = 28;
const THRESHOLD = 70;

export function useEdgeSwipeBack(onBack: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const scrollsSideways = (node: EventTarget | null): boolean => {
      let el = node instanceof Element ? node : null;
      while (el && el !== document.body) {
        const style = getComputedStyle(el);
        if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth) return true;
        el = el.parentElement;
      }
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { tracking = false; return; }
      const t = e.touches[0];
      tracking = t.clientX <= EDGE && !scrollsSideways(e.target);
      startX = t.clientX;
      startY = t.clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      // Mostly sideways, or it is a scroll that happened to begin near the edge.
      if (dx > THRESHOLD && dx > dy * 1.6) {
        tracking = false;
        onBack();
      } else if (dy > 60) {
        tracking = false;
      }
    };

    const stop = () => { tracking = false; };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', stop, { passive: true });
    window.addEventListener('touchcancel', stop, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', stop);
      window.removeEventListener('touchcancel', stop);
    };
  }, [onBack, enabled]);
}
