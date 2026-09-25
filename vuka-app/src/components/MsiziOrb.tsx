/* ============================================================
   Msizi's orb — the one picture of Msizi, at every size.

   The styles, and why each state looks the way it does, live with the other
   motion in index.css (".orb"). This component only chooses the state and
   the size; the speaking loudness is written straight onto the element as
   --level by the screen, per animation frame, without re-rendering React.
   ============================================================ */
import { forwardRef, type CSSProperties } from 'react';
import { Icon } from './Icon';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const MsiziOrb = forwardRef<HTMLSpanElement, {
  size?: number;
  state?: OrbState;
  /** Show the assistant mark on the sphere — for small sizes, where the orb
      alone could be mistaken for decoration. */
  mark?: boolean;
  className?: string;
}>(function MsiziOrb({ size = 56, state = 'idle', mark = false, className = '' }, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-state={state}
      className={`orb ${className}`}
      style={{ '--orb': `${size}px` } as CSSProperties}
    >
      <span className="orb-halo" />
      <span className="orb-core">
        {mark && <Icon name="assistant" size={Math.round(size * 0.46)} />}
      </span>
      <span className="orb-ripple" />
      <span className="orb-ripple" />
    </span>
  );
});
