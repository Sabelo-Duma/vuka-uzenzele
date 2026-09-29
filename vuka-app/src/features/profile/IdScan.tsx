/* ============================================================
   Scan your ID — the card, and the person it belongs to.

   Seven steps, each one screen, because this is done once, on a phone, often
   by someone doing it for the first time:

     1. What happens and why, and consent — a face photo used for matching is
        special personal information under POPIA, so this is asked, not assumed.
     2. The front of the card: a photo, for the reviewer.
     3. The back of the card: the barcodes are read live on the phone. The
        details fill themselves in; nobody retypes a 13-digit number. If a card
        will not scan, a photo of the back, or typing the number, still works.
     4. Confirm the name, as it is on the card.
     5. A selfie, looking straight ahead.
     6. A second selfie following a random instruction chosen by the server. A
        printed photo or a screen held up to the camera cannot follow an
        instruction it did not know in advance — that is the liveness check.
     7. Sent. A person compares the selfies with the card; the Home Affairs
        check (through a verification bureau) is in test mode until one is
        appointed, and the screen says so.

   Nothing here decides anything. The server checks the number and the barcode
   again, and the badge is only ever granted by a reviewed submission.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, type IdChecks } from '../../lib/api';
import { checkIdNumber, displayName, parseIdBarcode, type IdBarcode } from '../../lib/saId';
import {
  CameraError, capturePhoto, closeCamera, openCamera, readFrame, readImageFile, warmBarcodeReader, type Facing,
} from '../../lib/camera';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';

type Step = 'intro' | 'front' | 'back' | 'details' | 'selfie' | 'challenge' | 'sending' | 'done';
const STEPS: Step[] = ['intro', 'front', 'back', 'details', 'selfie', 'challenge'];

/** How long the live scan runs before offering the other ways in. */
const SCAN_HELP_AFTER_MS = 20_000;
/** Having read only the ID number, keep looking this long for the details barcode. */
const WAIT_FOR_DETAILS_MS = 4_000;

/* ------------------------------------------------------------------
   The live camera, with a guide drawn over it.
   ------------------------------------------------------------------ */

function CameraView({ facing, guide, onReady, onError }: {
  facing: Facing;
  guide: 'card' | 'face';
  onReady: (video: HTMLVideoElement) => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let live = true;
    const video = videoRef.current;
    if (!video) return undefined;
    openCamera(video, facing)
      .then((s) => { if (!live) { closeCamera(s); return; } stream = s; onReady(video); })
      .catch((e) => { if (live) onError(e instanceof CameraError ? e.message : 'The camera could not be started.'); });
    /* The camera is released on every way out of the step. */
    return () => { live = false; closeCamera(stream); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);
  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-black aspect-[3/4] max-h-[62vh]">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
        playsInline
        muted
      />
      {/* The guide: where the card or the face should sit. */}
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center pointer-events-none">
        {guide === 'card'
          ? <div className="w-[86%] aspect-[1.586] rounded-2xl border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          : <div className="w-[62%] aspect-[3/4] rounded-[50%] border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />}
      </div>
    </div>
  );
}

/** The photo just taken, to keep or retake. */
function Preview({ blob, mirror = false }: { blob: Blob; mirror?: boolean }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-black aspect-[3/4] max-h-[62vh]">
      {url && <img src={url} alt="" className={`absolute inset-0 w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`} />}
    </div>
  );
}

/* ------------------------------------------------------------------
   The flow.
   ------------------------------------------------------------------ */

export function IdScan({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<Step>('intro');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [front, setFront] = useState<Blob | null>(null);
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [challengeShot, setChallengeShot] = useState<Blob | null>(null);

  const [barcode, setBarcode] = useState<IdBarcode | null>(null);
  const [typedId, setTypedId] = useState('');
  const [typing, setTyping] = useState(false);
  const [scanHelp, setScanHelp] = useState(false);
  const [fullName, setFullName] = useState('');

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState('');
  const [checks, setChecks] = useState<IdChecks | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  /* The reader downloads while the person reads the first screen. */
  useEffect(() => { warmBarcodeReader(); }, []);

  const go = useCallback((next: Step) => {
    setError(null);
    setCameraReady(false);
    videoRef.current = null;
    setStep(next);
  }, []);

  const onCameraReady = useCallback((v: HTMLVideoElement) => { videoRef.current = v; setCameraReady(true); }, []);

  /* ---- the live barcode scan ---- */
  useEffect(() => {
    if (step !== 'back' || !cameraReady || barcode || typing) return undefined;
    let stop = false;
    let idOnly: IdBarcode | null = null;
    let idOnlyAt = 0;
    const started = Date.now();
    const helpTimer = window.setTimeout(() => setScanHelp(true), SCAN_HELP_AFTER_MS);
    const loop = async () => {
      while (!stop) {
        const v = videoRef.current;
        if (v) {
          try {
            for (const r of await readFrame(v)) {
              const parsed = parseIdBarcode(r.text, r.format);
              if (!parsed) continue;
              /* The details barcode is what we want; the number-only one is
                 kept as a fallback in case the details will not read. */
              if (parsed.surname || parsed.names) { setBarcode(parsed); return; }
              if (!idOnly) { idOnly = parsed; idOnlyAt = Date.now(); }
            }
          } catch (e) {
            /* The reader failed to load: most likely the app updated while
               open and the old reader file is gone. A reload fixes it. */
            if (Date.now() - started > 2000) {
              setError('The scanner could not start. Close this and open it again — if it keeps happening, reload Vuka.');
              return;
            }
            void e;
          }
          if (idOnly && Date.now() - idOnlyAt > WAIT_FOR_DETAILS_MS) { setBarcode(idOnly); return; }
        }
        await new Promise((r) => window.setTimeout(r, 250));
      }
    };
    void loop();
    return () => { stop = true; window.clearTimeout(helpTimer); };
  }, [step, cameraReady, barcode, typing]);

  /* Pre-fill the name from the card when there is one. */
  useEffect(() => {
    if (barcode && !fullName) setFullName(displayName(barcode));
  }, [barcode, fullName]);

  const idNumber = barcode?.idNumber ?? typedId.replace(/\D/g, '');
  const idInfo = checkIdNumber(idNumber);

  const scanPhotoOfBack = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const found = (await readImageFile(file))
        .map((r) => parseIdBarcode(r.text, r.format))
        .filter((x): x is IdBarcode => !!x);
      const best = found.find((x) => x.surname || x.names) ?? found[0];
      if (best) setBarcode(best);
      else setError('No ID barcode could be read in that photo. Try again in good light, or type your ID number.');
    } catch {
      setError('That photo could not be read. Try again, or type your ID number.');
    } finally {
      setBusy(false);
    }
  };

  const take = async (setter: (b: Blob) => void, mirror = false) => {
    const v = videoRef.current;
    if (!v) return;
    const blob = await capturePhoto(v);
    if (!blob) { setError('The photo did not come out. Please try again.'); return; }
    void mirror;
    setter(blob);
  };

  /* Start the submission: the server checks the number and the barcode, and
     sends back the instruction for the second selfie. */
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.startIdScan({
        consent: true,
        fullName: fullName.trim(),
        idNumber,
        scan: barcode ? { ...barcode } : { source: 'typed' },
      });
      setVerificationId(res.id ?? null);
      setChallenge(res.challenge ?? 'Turn your head to your left');
      setChecks(res.checks);
      if (front && res.id) await api.uploadIdDocument(res.id, 'card_front', front);
      go('selfie');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /* The second selfie is taken on a count, so the instruction has been read
     and followed before the shutter goes. */
  const takeChallenge = () => {
    let n = 3;
    setCountdown(n);
    const tick = window.setInterval(() => {
      n -= 1;
      if (n > 0) { setCountdown(n); return; }
      window.clearInterval(tick);
      setCountdown(null);
      void take(setChallengeShot, true);
    }, 1000);
  };

  const send = async () => {
    if (!verificationId || !selfie || !challengeShot) return;
    go('sending');
    try {
      await api.uploadIdDocument(verificationId, 'selfie', selfie);
      await api.uploadIdDocument(verificationId, 'selfie_challenge', challengeShot);
      await api.submitIdScan(verificationId);
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
      setStep('challenge');
    }
  };

  const stepNo = STEPS.indexOf(step);

  /* Portalled to <body>: it is opened from inside a sheet, and a fixed layer
     inside a transformed parent is positioned against that parent, not the
     screen. */
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Verify your ID" className="fixed inset-0 z-[70] bg-canvas overflow-y-auto">
      <div className="max-w-md mx-auto px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] min-h-full flex flex-col">
        {/* Header: where you are, and a way out. */}
        <div className="flex items-center justify-between py-2">
          <p className="m-0 text-small font-bold text-dim">
            {stepNo >= 0 ? `Step ${stepNo + 1} of ${STEPS.length}` : step === 'done' ? 'Done' : 'Sending'}
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center w-11 h-11 rounded-full border border-line bg-surface text-ink active:scale-95 transition"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {stepNo >= 0 && (
          <div aria-hidden="true" className="flex gap-1.5 mb-4">
            {STEPS.map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepNo ? 'bg-brand-solid' : 'bg-surface-3'}`} />
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="m-0 mb-3 flex gap-2 items-start rounded-2xl border border-line bg-danger-soft px-3.5 py-2.5 text-small text-ink leading-snug">
            <Icon name="alert" size={16} /><span>{error}</span>
          </p>
        )}

        {/* 1. What happens, and consent */}
        {step === 'intro' && (
          <div className="flex flex-col gap-4">
            <h1 className="m-0 font-display text-head font-extrabold text-ink tracking-tight">Verify your ID</h1>
            <p className="m-0 text-body text-dim leading-relaxed">
              A verified ID tells the other person you are who you say you are. It takes about two minutes. You will need your
              smart ID card (or green ID book) and good light.
            </p>
            <ol className="m-0 pl-0 list-none flex flex-col gap-3">
              {[
                ['camera', 'A photo of the front of your card'],
                ['search', 'A scan of the back — the details fill themselves in'],
                ['user', 'Two quick selfies, so we know the card is yours'],
              ].map(([icon, text]) => (
                <li key={text} className="flex gap-3 items-center rounded-2xl border border-line bg-surface px-4 py-3">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-brand-soft text-brand shrink-0">
                    <Icon name={icon as 'camera'} size={18} />
                  </span>
                  <span className="text-body font-semibold text-ink">{text}</span>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-small text-ink leading-relaxed">
              <b>How your photos are used.</b> A person at Vuka compares your selfies with your card. Later your ID will also be
              checked against Home Affairs through a verification service. Your ID number is stored encrypted and only its last
              four digits are ever shown. The photos are deleted as soon as the check is done. Verifying is optional — you can
              use Vuka without it.
            </div>
            <label className="flex gap-3 items-start min-h-[44px] cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[var(--v-brand)] shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span className="text-body text-ink leading-snug">I agree to Vuka using my ID and photos this way.</span>
            </label>
            <Button block disabled={!consent} icon="camera" onClick={() => go('front')}>Start</Button>
          </div>
        )}

        {/* 2. Front of the card */}
        {step === 'front' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">Front of your card</h1>
              <p className="m-0 mt-1 text-small text-dim">Fit the whole card inside the frame. Avoid glare on the photo.</p>
            </div>
            {front ? <Preview blob={front} /> : (
              <CameraView facing="environment" guide="card" onReady={onCameraReady} onError={setError} />
            )}
            {front ? (
              <div className="flex gap-2.5">
                <Button variant="ghost" className="flex-1" icon="retry" onClick={() => { setFront(null); setCameraReady(false); }}>Retake</Button>
                <Button className="flex-1" onClick={() => go('back')}>Use this photo</Button>
              </div>
            ) : (
              <Button block icon="camera" disabled={!cameraReady} onClick={() => take(setFront)}>Take photo</Button>
            )}
          </div>
        )}

        {/* 3. Back of the card: the barcode */}
        {step === 'back' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">Back of your card</h1>
              <p className="m-0 mt-1 text-small text-dim">
                Hold the back of the card inside the frame. It reads the barcodes by itself — keep it still for a moment.
              </p>
            </div>

            {barcode ? (
              <div className="rounded-3xl border border-line bg-surface p-4">
                <p className="m-0 flex items-center gap-2 text-body font-bold text-verified"><Icon name="check" size={18} />Card read</p>
                <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-small">
                  {barcode.surname && <><dt className="text-dim">Name</dt><dd className="m-0 text-ink font-semibold">{displayName(barcode)}</dd></>}
                  <dt className="text-dim">ID number</dt><dd className="m-0 text-ink font-semibold font-mono tnum">•••••••••{barcode.idNumber.slice(-4)}</dd>
                  {idInfo.dateOfBirth && <><dt className="text-dim">Date of birth</dt><dd className="m-0 text-ink font-semibold">{idInfo.dateOfBirth}</dd></>}
                </dl>
              </div>
            ) : typing ? (
              <div className="flex flex-col gap-2">
                <label className="text-micro font-bold uppercase tracking-wide text-dim" htmlFor="idnum">ID number</label>
                <input
                  id="idnum"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  value={typedId}
                  onChange={(e) => setTypedId(e.target.value.replace(/\D/g, ''))}
                  className="w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink font-mono tnum focus:outline-none focus:border-ink"
                  placeholder="13 digits"
                />
                {typedId.length === 13 && !idInfo.ok && <p className="m-0 text-small text-danger">{idInfo.reason}</p>}
              </div>
            ) : (
              <CameraView facing="environment" guide="card" onReady={onCameraReady} onError={(m) => { setError(m); setScanHelp(true); }} />
            )}

            {!barcode && !typing && (
              <p role="status" className="m-0 text-small text-dim text-center">{cameraReady ? 'Looking for the barcode…' : 'Starting the camera…'}</p>
            )}

            {barcode || (typing && idInfo.ok) ? (
              <Button block onClick={() => go('details')}>Continue</Button>
            ) : null}

            {/* The other ways in are always offered — a card that will not scan
                should never be a dead end — but the photo option leads once
                the live scan has struggled for a while. */}
            {!barcode && (
              <div className="flex flex-col gap-2">
                {!typing && (
                  <label className={`inline-flex items-center justify-center gap-2 min-h-[48px] rounded-pill border text-body font-bold cursor-pointer active:scale-[.975] transition
                    ${scanHelp ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink'}`}>
                    <Icon name="image" size={18} />
                    {busy ? 'Reading…' : 'Take a photo of the back instead'}
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => scanPhotoOfBack(e.target.files?.[0])} />
                  </label>
                )}
                <Button variant="ghost" block onClick={() => setTyping((x) => !x)}>
                  {typing ? 'Scan the card instead' : 'Type my ID number instead'}
                </Button>
              </div>
            )}
            {barcode && (
              <Button variant="ghost" block onClick={() => { setBarcode(null); setFullName(''); setCameraReady(false); }}>Scan again</Button>
            )}
          </div>
        )}

        {/* 4. The name, as on the card */}
        {step === 'details' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">Your full name</h1>
              <p className="m-0 mt-1 text-small text-dim">Exactly as it is on your ID{barcode?.surname ? ' — we filled it in from your card.' : '.'}</p>
            </div>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink"
              placeholder="First names and surname"
              aria-label="Full name"
            />
            <Button block disabled={busy || fullName.trim().length < 3 || !idInfo.ok} onClick={start}>
              {busy ? 'Checking…' : 'Continue to selfies'}
            </Button>
          </div>
        )}

        {/* 5. Selfie, straight on */}
        {step === 'selfie' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">A selfie</h1>
              <p className="m-0 mt-1 text-small text-dim">Face the camera with your whole face in the oval. No hat or sunglasses.</p>
            </div>
            {checks && checks.mismatches.length > 0 && (
              <p className="m-0 rounded-2xl border border-line bg-surface-2 px-3.5 py-2.5 text-small text-ink leading-snug">
                Some details did not match your card ({checks.mismatches.join(', ')}). You can carry on — the person reviewing it will check.
              </p>
            )}
            {selfie ? <Preview blob={selfie} mirror /> : (
              <CameraView facing="user" guide="face" onReady={onCameraReady} onError={setError} />
            )}
            {selfie ? (
              <div className="flex gap-2.5">
                <Button variant="ghost" className="flex-1" icon="retry" onClick={() => { setSelfie(null); setCameraReady(false); }}>Retake</Button>
                <Button className="flex-1" onClick={() => go('challenge')}>Use this photo</Button>
              </div>
            ) : (
              <Button block icon="camera" disabled={!cameraReady} onClick={() => take(setSelfie, true)}>Take selfie</Button>
            )}
          </div>
        )}

        {/* 6. The random instruction */}
        {step === 'challenge' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">One more</h1>
              <p className="m-0 mt-1 text-body text-ink">
                When the count reaches zero: <b className="text-brand">{challenge}</b>
              </p>
            </div>
            {challengeShot ? <Preview blob={challengeShot} mirror /> : (
              <div className="relative">
                <CameraView facing="user" guide="face" onReady={onCameraReady} onError={setError} />
                {countdown !== null && (
                  <div aria-live="assertive" className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-[88px] font-extrabold text-white drop-shadow-lg">{countdown}</span>
                  </div>
                )}
              </div>
            )}
            {challengeShot ? (
              <div className="flex gap-2.5">
                <Button variant="ghost" className="flex-1" icon="retry" onClick={() => { setChallengeShot(null); setCameraReady(false); }}>Retake</Button>
                <Button className="flex-1" onClick={send}>Send for checking</Button>
              </div>
            ) : (
              <Button block icon="camera" disabled={!cameraReady || countdown !== null} onClick={takeChallenge}>
                {countdown !== null ? 'Get ready…' : 'Start the count'}
              </Button>
            )}
          </div>
        )}

        {step === 'sending' && (
          <div className="flex-1 grid place-items-center text-center">
            <div>
              <span className="inline-block w-10 h-10 rounded-full border-4 border-surface-3 border-t-brand-solid animate-spin" aria-hidden="true" />
              <p role="status" className="mt-4 text-body font-semibold text-ink">Sending your ID securely…</p>
            </div>
          </div>
        )}

        {/* 7. Sent */}
        {step === 'done' && (
          <div className="flex flex-col gap-4 text-center items-center pt-6">
            <span className="grid place-items-center w-16 h-16 rounded-full bg-verified-soft text-verified"><Icon name="check" size={30} /></span>
            <h1 className="m-0 font-display text-head font-extrabold text-ink">Sent for checking</h1>
            <p className="m-0 text-body text-dim leading-relaxed max-w-sm">
              A person at Vuka will compare your selfies with your card. We will let you know as soon as it is done. Your photos
              are deleted once the check is complete.
            </p>
            <p className="m-0 rounded-2xl border border-line bg-info-soft px-3.5 py-2.5 text-small text-ink leading-snug max-w-sm">
              <b>Home Affairs check:</b> coming soon. It is in test mode until a verification service is connected.
            </p>
            <Button block onClick={onDone}>Done</Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
