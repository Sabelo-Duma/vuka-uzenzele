import type { SVGProps } from 'react';

/** Shared inline icon set (1.5px stroke, currentColor) — decorative by default (aria-hidden). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number | undefined, props: SVGProps<SVGSVGElement>) {
  return {
    width: size ?? 16,
    height: size ?? 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export const IconCheck = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconX = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconClock = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
export const IconLock = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const IconLockOpen = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></svg>
);
export const IconPencil = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
);
export const IconShield = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" /></svg>
);
export const IconMegaphone = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="m3 11 18-6v14L3 13v-2Z" /><path d="M7 13.5V19a1.5 1.5 0 0 0 3 0v-4" /></svg>
);
export const IconScales = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M12 3v18M4 7h16" /><path d="m7 7-3 7a3.5 3.5 0 0 0 7 0L8 7M20 7l-3 7a3.5 3.5 0 0 0 7 0l-3-7" transform="scale(0.85) translate(1.5 1.5)" /></svg>
);
export const IconGavel = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6 6M9 7l7-4 4 7-7 4-4-7Z" /></svg>
);
export const IconTrophy = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M8 21h8m-4-4v4M7 4h10v6a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1" /></svg>
);
export const IconSlash = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" /></svg>
);
export const IconSparkle = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></svg>
);
export const IconUpload = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M12 16V4m0 0 4 4m-4-4L8 8" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
);
export const IconFile = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" /><path d="M14 2v5h5" /></svg>
);
export const IconAlert = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
);
export const IconInfo = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
);
export const IconRefresh = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" /></svg>
);
export const IconChevronDown = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconSend = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
);
export const IconPaperclip = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
);
export const IconInbox = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" /></svg>
);
export const IconSpinner = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)} className={`animate-spin ${p.className ?? ''}`}><path d="M21 12a9 9 0 1 1-9-9" /></svg>
);
