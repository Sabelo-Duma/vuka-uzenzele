/** Skip-navigation link — first tabbable element in every layout (UX spec §6.2). */
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="gj-sr-only focus:not-sr-only focus:absolute focus:left-gj-4 focus:top-gj-4 focus:z-[100] focus:rounded-pill focus:bg-gj-navy focus:px-gj-5 focus:py-gj-2 focus:text-white focus:no-underline"
    >
      Skip to main content
    </a>
  );
}
