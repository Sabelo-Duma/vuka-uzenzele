/* ============================================================
   The camera, for the ID scan: open it, take a still, read a barcode, close it.

   The barcode reader is zxing-wasm (MIT, 920 KB of WebAssembly). It is loaded
   only when somebody actually opens the ID scan — never at start-up, where it
   would cost everyone data for a step most people take once — and its .wasm
   is served from this origin (the CSP allows 'wasm-unsafe-eval' for exactly
   this). It reads PDF417 on iPhone, where the browser's own BarcodeDetector
   does not exist.
   ============================================================ */

export type Facing = 'environment' | 'user';

export class CameraError extends Error {
  constructor(public kind: 'denied' | 'unavailable' | 'failed', message: string) { super(message); }
}

/** Open a camera stream into a <video>. Resolves once frames are flowing. */
export async function openCamera(video: HTMLVideoElement, facing: Facing): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('unavailable', 'This phone does not let the browser use the camera.');
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facing },
        /* The back of an ID card is a dense barcode: ask for enough pixels
           to read it, without demanding them (a cheap phone may not have 1080p). */
        width: { ideal: facing === 'environment' ? 1920 : 1280 },
        height: { ideal: facing === 'environment' ? 1080 : 720 },
      },
    });
  } catch (e) {
    const name = (e as { name?: string }).name ?? '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new CameraError('denied', 'Vuka needs permission to use the camera. Allow it in your phone settings, then try again.');
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new CameraError('unavailable', 'No camera could be found on this phone.');
    }
    throw new CameraError('failed', 'The camera could not be started. Please try again.');
  }
  /* iOS will not play a camera stream inline without these three. */
  video.setAttribute('playsinline', 'true');
  video.muted = true;
  video.srcObject = stream;
  await video.play().catch(() => { /* autoplay is allowed for muted inline video */ });
  if (!video.videoWidth) {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      video.addEventListener('loadedmetadata', done, { once: true });
      window.setTimeout(done, 2500);
    });
  }
  return stream;
}

export function closeCamera(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/** The current frame as a canvas, scaled so its long side is at most `max`. */
function frameCanvas(video: HTMLVideoElement, max: number): HTMLCanvasElement | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Take a still as a JPEG: large enough to read a card, small enough to send. */
export function capturePhoto(video: HTMLVideoElement, max = 1280, quality = 0.86): Promise<Blob | null> {
  const canvas = frameCanvas(video, max);
  if (!canvas) return Promise.resolve(null);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}

/* ---- barcodes ---- */

type Reader = (input: ImageData | Blob) => Promise<{ text: string; format: string }[]>;
let reader: Promise<Reader> | null = null;

/** Load the reader once. A failure is retried next time rather than cached. */
function loadReader(): Promise<Reader> {
  if (!reader) {
    reader = (async () => {
      const [zx, wasm] = await Promise.all([
        import('zxing-wasm/reader'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ]);
      zx.prepareZXingModule({
        overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasm.default : prefix + path) },
        fireImmediately: false,
      });
      return async (input: ImageData | Blob) => {
        const results = await zx.readBarcodes(input, {
          formats: ['PDF417', 'Code39'],
          tryHarder: true,
          tryRotate: true,
          maxNumberOfSymbols: 2,
        });
        return results.filter((r) => r.isValid && r.text).map((r) => ({ text: r.text, format: String(r.format) }));
      };
    })().catch((e) => { reader = null; throw e; });
  }
  return reader;
}

/** Start loading the reader early (while the person is still reading the intro). */
export function warmBarcodeReader(): void {
  void loadReader().catch(() => { /* retried when actually needed */ });
}

/** Read any ID barcodes in the current video frame. */
export async function readFrame(video: HTMLVideoElement): Promise<{ text: string; format: string }[]> {
  const canvas = frameCanvas(video, 1600);
  if (!canvas) return [];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  const read = await loadReader();
  return read(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

/** Read ID barcodes from a photo chosen or taken outside the live view. */
export async function readImageFile(file: Blob): Promise<{ text: string; format: string }[]> {
  const read = await loadReader();
  return read(file);
}
