/* ============================================================
   Preparing a photo for a chat message.

   A picture straight off a modern phone camera is eight to twelve megabytes.
   Sending that as-is would cost the sender most of a day's data to upload and
   the receiver the same to look at it, to show something that is displayed at
   about eight hundred pixels wide. So it is resized in the browser, before a
   single byte goes anywhere.

   This is also what makes photos affordable to store at all: the whole of this
   platform's durable storage is one small Postgres database, and the difference
   between 300 KB and 9 MB a photo is the difference between a feature and a
   bill.
   ============================================================ */

/** Wide enough to read a street sign or an invoice on a phone screen. */
const MAX_EDGE = 1600;
/** Past about 0.82 the file grows fast and the picture stops improving. */
const QUALITY = 0.82;

export interface PreparedPhoto {
  blob: Blob;
  width: number;
  height: number;
  /** What it weighed before, so the UI can say the resize was worth it. */
  originalSize: number;
}

export const isSupportedImage = (file: File) =>
  ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type);

/**
 * Decode, shrink, re-encode.
 *
 * createImageBitmap does the decode off the main thread where it exists, which
 * on a low-end phone is the difference between a brief pause and a visibly
 * frozen app. The <img> path is the fallback, and is also what handles the
 * formats a canvas can read but createImageBitmap has refused in the past.
 *
 * Always comes back as JPEG. Not because it is the best codec — it isn't — but
 * because it is the one format that every browser can both write and read, and
 * a photo that arrives and cannot be opened is worse than a slightly larger one.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const source = await decode(file);
  const { width: sw, height: sh } = source;
  if (!sw || !sh) throw new Error("That image couldn't be opened.");

  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("This browser couldn't process that image.");
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ('close' in source && typeof source.close === 'function') source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  if (!blob) throw new Error("That image couldn't be prepared for sending.");

  /* Shrinking a small screenshot can make it bigger — PNG line art turns into
     JPEG noise. Keep whichever is smaller, as long as the original is a format
     the other side can definitely open. */
  const keepOriginal = blob.size >= file.size && (file.type === 'image/jpeg' || file.type === 'image/png');
  return {
    blob: keepOriginal ? file : blob,
    width,
    height,
    originalSize: file.size,
  };
}

type Decoded = ImageBitmap | HTMLImageElement;

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fall through to the <img> path */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That image couldn't be opened."));
      img.src = url;
    });
  } finally {
    // Revoked after decode: the bitmap is independent of the URL by then.
    URL.revokeObjectURL(url);
  }
}
