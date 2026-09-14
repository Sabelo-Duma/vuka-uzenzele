import { useEffect, useRef, useState } from 'react';
import { attachmentUrl } from '../../lib/api';
import type { Attachment } from '../../lib/api';
import { Icon } from '../../components/Icon';

/**
 * A photo in the thread.
 *
 * Worth having in a product about work: "is this the right gate?", "here's the
 * garden now that I'm done", "this is the invoice". All of those are one
 * picture and no sentence.
 *
 * The space it will occupy is reserved from the dimensions that travelled with
 * the message, so the thread does not jump when the image arrives. That matters
 * more here than usual — the thread auto-scrolls to the newest message, and a
 * late-loading image above shifts everything under the reader's thumb.
 */
export function PhotoNote({ attachment, caption, onOpen }: {
  attachment: Attachment;
  caption?: string;
  onOpen: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Fetched when it comes near the screen rather than when the thread loads.
     Scrolling up through a long conversation should not pull down every photo
     in it — the thread is the one place in this app where history is unbounded. */
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      attachmentUrl(attachment.id).then(setUrl).catch(() => setFailed(true));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        attachmentUrl(attachment.id).then(setUrl).catch(() => setFailed(true));
      }
    }, { rootMargin: '300px' });
    io.observe(node);
    return () => io.disconnect();
  }, [attachment.id]);

  const ratio = attachment.width && attachment.height
    ? `${attachment.width} / ${attachment.height}`
    : '4 / 3';

  return (
    <div className="min-w-[180px]">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl bg-surface-3 max-w-[260px]"
        style={{ aspectRatio: ratio, maxWidth: '100%' }}
      >
        {url && !failed ? (
          <button
            type="button"
            onClick={() => onOpen(url)}
            aria-label={caption ? `Open photo: ${caption}` : 'Open photo'}
            className="absolute inset-0 w-full h-full"
          >
            <img src={url} alt={caption || 'Photo sent in this conversation'} className="w-full h-full object-cover" />
          </button>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-faint">
            {failed
              ? <span className="text-micro px-3 text-center">This photo is no longer available.</span>
              : <span className="block w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
          </div>
        )}
      </div>
      {caption && <p className="text-small mt-1.5 mb-0 whitespace-pre-wrap break-words">{caption}</p>}
    </div>
  );
}

/**
 * Full-screen viewer.
 *
 * No download button. A viewer's sandbox blocks downloads the page starts
 * itself, so a button that silently does nothing would be worse than no button
 * — long-press and "save image" is the path that actually works, on every
 * platform, and is the one people already know.
 */
export function PhotoLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Photo">
      <button className="absolute inset-0 w-full h-full" aria-label="Close photo" onClick={onClose} />
      <img src={url} alt="" className="relative max-w-[94vw] max-h-[86vh] object-contain rounded-lg" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 grid place-items-center w-11 h-11 rounded-full bg-white/15 text-white backdrop-blur transition active:scale-95"
      >
        <Icon name="x" size={22} />
      </button>
    </div>
  );
}
