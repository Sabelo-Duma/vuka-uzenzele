import { useEffect, useState } from 'react';

/* Confetti is the one place the palette's rules are suspended — it is not
   carrying meaning, it is celebrating. It still draws from the palette so a
   burst looks like it belongs to this app rather than to a party shop. */
const COLORS = [
  'var(--v-brand-solid)',
  'var(--v-verified)',
  'var(--v-live-solid)',
  'var(--v-on-feature-accent)',
  'var(--v-info)',
];

/** Lightweight CSS confetti burst, self-clears after ~3.4s. */
export function Confetti() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 3400);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORS[i % COLORS.length],
            borderRadius: i % 3 === 0 ? '999px' : '2px',
            animationDuration: `${1.6 + (i % 7) * 0.18}s`,
            animationDelay: `${(i % 11) * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}
