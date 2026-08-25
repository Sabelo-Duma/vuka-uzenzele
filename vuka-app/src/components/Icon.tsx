import type { SVGProps } from 'react';

export type IconName =
  | 'home' | 'jobs' | 'ladder' | 'user' | 'talent' | 'plus' | 'back' | 'chev'
  | 'pin' | 'shield' | 'bolt' | 'lock' | 'check' | 'sun' | 'moon' | 'briefcase'
  | 'x' | 'bell' | 'camera' | 'globe' | 'card' | 'wallet' | 'star' | 'chat' | 'send' | 'clock'
  | 'reply' | 'edit' | 'trash' | 'copy';

const P = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  jobs: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" /></>,
  ladder: <><path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21" /></>,
  talent: <><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c0-3.3 3-5.3 6.5-5.3S15.5 16.7 15.5 20" /><path d="M16 5.2a3.4 3.4 0 0 1 0 6.4M18 20c0-2.6-1-4.3-2.5-5.3" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  back: <><path d="M15 5l-7 7 7 7" /></>,
  chev: <><path d="M9 5l7 7-7 7" /></>,
  pin: <><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  bolt: <><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></>,
  lock: <><rect x="4" y="10" width="16" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  check: <><path d="M20 6 9 17l-5-5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
  x: <><path d="M18 6 6 18M6 6l12 12" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M16 12h4" /></>,
  star: <><path d="M12 3l2.9 6 6.1.9-4.5 4.3 1.1 6.1L12 17.8 6.4 20.3l1.1-6.1L3 9.9 9.1 9z" /></>,
  chat: <><path d="M21 11.5a8.5 8.5 0 0 1-11.7 7.9L3 21l1.6-6.3A8.5 8.5 0 1 1 21 11.5Z" /></>,
  send: <><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></>,
  reply: <><path d="M9 17 4 12l5-5" /><path d="M4 12h11a5 5 0 0 1 5 5v3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3.5 2" /></>,
} as const satisfies Record<IconName, React.ReactNode>;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  const filled = name === 'bolt' || name === 'star';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
