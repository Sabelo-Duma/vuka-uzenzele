import { useEffect, useState } from 'react';

const COLORS = ['#F20023', '#0E355A', '#FBBF24', '#1273B8', '#18CE0F', '#B45309'];

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
