/**
 * The launch screen.
 *
 * Deliberately identical to the #boot block in index.html — same ground, same
 * mark, same wordmark at the same size — so that when the bundle arrives and
 * React takes over, nothing moves. If you change one, change the other.
 *
 * It is drawn here rather than reusing <SunMark variant="tile" /> because the
 * tile draws its own rounded indigo card, and this screen wants the indigo to
 * be the whole page with the light floating on it.
 */
export function Splash() {
  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center"
      style={{
        background: 'linear-gradient(180deg, #172134 0%, #0B1220 100%)',
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      <div className="text-center">
        <svg
          viewBox="0 0 512 512"
          role="img"
          aria-label="Vuka Uzenzele"
          className="block mx-auto"
          style={{ width: 132, height: 132 }}
        >
          <g fill="#F5A200">
            <path d="M156 254a100 100 0 0 1 200 0z" />
            <rect x="120" y="288" width="272" height="30" rx="15" />
            <rect x="186" y="346" width="140" height="24" rx="12" />
          </g>
        </svg>

        <div
          className="font-display font-extrabold text-white"
          style={{ marginTop: 22, fontSize: 27, letterSpacing: '-0.02em' }}
        >
          Vuka Uzenzele
        </div>

        {/* The tagline is not translated, and should not be: it is the product's
            name-line, the way "Just do it" stays English on every store page. */}
        <div style={{ marginTop: 7, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.58)' }}>
          Rise up &amp; Do it Yourself
        </div>

        {/* Wordless on purpose — this can render before a catalogue is chosen,
            and a bar needs no language. */}
        <div
          role="progressbar"
          aria-label="Loading"
          className="mx-auto overflow-hidden"
          style={{ marginTop: 26, width: 132, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.14)' }}
        >
          <span className="splash-bar block h-full" style={{ width: '40%', borderRadius: 2, background: '#F5A200' }} />
        </div>
      </div>
    </div>
  );
}
