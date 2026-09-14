import { useId } from 'react';

/**
 * The Vuka mark, inline.
 *
 * The same three shapes as public/icon.svg — a sun over two lines of light —
 * so the tab icon, the home-screen icon and the wordmark in the app are one
 * thing rather than three. The header used to carry an unrelated dot.
 *
 * Two variants, because the mark is asked to do two jobs:
 *   bare — the light alone, in currentColor, beside a wordmark (the default:
 *          a dark tile sits heavily on a white header)
 *   tile — on its own indigo ground, for a splash or a dark surface
 *
 * Keep the geometry in step with public/icon.svg and public/icon-maskable.svg.
 */
export function SunMark({ size = 28, variant = 'bare', className = '' }: {
  size?: number;
  variant?: 'tile' | 'bare';
  className?: string;
}) {
  const tile = variant === 'tile';
  /* Two tiles on one page would otherwise share a gradient id, and the second
     would paint with the first one's fill. The colons React puts in useId are
     stripped: they are legal in an XML id but they are not legal in a CSS
     selector, and a `url(#...)` that some engine declines to resolve is an
     invisible background rather than an error. */
  const gradId = `vuka-sky-${useId().replace(/:/g, '')}`;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Vuka Uzenzele"
    >
      {tile && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#172134" />
              <stop offset="1" stopColor="#0B1220" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="112" fill={`url(#${gradId})`} />
        </>
      )}
      <g fill={tile ? '#F5A200' : 'currentColor'}>
        <path d="M156 254a100 100 0 0 1 200 0z" />
        <rect x="120" y="288" width="272" height="30" rx="15" />
        <rect x="186" y="346" width="140" height="24" rx="12" />
      </g>
    </svg>
  );
}
