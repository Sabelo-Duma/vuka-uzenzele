/* ============================================================
   Scan your ID — the card, and the person it belongs to.

   Seven steps, each one screen, because this is done once, on a phone, often
   by someone doing it for the first time:

     1. What happens and why, and consent — a face photo used for matching is
        special personal information under POPIA, so this is asked, not assumed.
     2. The front of the card: a photo, for the reviewer.
     3. The back of the card: a photo, like the front, kept for the reviewer.
        The barcode is read from that photo when it can be, and the details
        fill themselves in. When it cannot (glare, a worn card, an old phone),
        that is fine: the person types the ID number and the reviewer reads
        it off the photo. (Until 2026-11-27 this was a live scan, and a card
        that would not scan held people up; a photo always works.)
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
  CameraError, capturePhoto, closeCamera, openCamera, readImageFile, warmBarcodeReader, type Facing,
} from '../../lib/camera';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useT } from '../../providers/LanguageProvider';

type Step = 'intro' | 'front' | 'back' | 'details' | 'selfie' | 'challenge' | 'sending' | 'done';
const STEPS: Step[] = ['intro', 'front', 'back', 'details', 'selfie', 'challenge'];

/* The server picks the liveness instruction and sends it in English (that is
   what the reviewer sees). Known ones are shown in the chosen language; an
   instruction the app does not know yet is shown as the server sent it. */
export const CHALLENGE_KEYS: Record<string, string> = {
  'Turn your head to your left': 'profile.scan.challenge.left',
  'Turn your head to your right': 'profile.scan.challenge.right',
  'Look up': 'profile.scan.challenge.up',
  'Smile with your teeth showing': 'profile.scan.challenge.smile',
  'Close your eyes': 'profile.scan.challenge.eyes',
  'Tilt your head to one side': 'profile.scan.challenge.tilt',
};

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
  const t = useT();
  useEffect(() => {
    let stream: MediaStream | null = null;
    let live = true;
    const video = videoRef.current;
    if (!video) return undefined;
    openCamera(video, facing)
      .then((s) => { if (!live) { closeCamera(s); return; } stream = s; onReady(video); })
      .catch((e) => { if (live) onError(e instanceof CameraError ? e.message : t('profile.scan.cameraFailed')); });
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
  const t = useT();
  const [step, setStep] = useState<Step>('intro');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [front, setFront] = useState<Blob | null>(null);
  const [back, setBack] = useState<Blob | null>(null);
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [challengeShot, setChallengeShot] = useState<Blob | null>(null);

  const [barcode, setBarcode] = useState<IdBarcode | null>(null);
  /** What reading the barcode off the back photo came to. */
  const [backRead, setBackRead] = useState<'idle' | 'reading' | 'read' | 'none'>('idle');
  const [typedId, setTypedId] = useState('');
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

  /* Pre-fill the name from the card when there is one. */
  useEffect(() => {
    if (barcode && !fullName) setFullName(displayName(barcode));
  }, [barcode, fullName]);

  const idNumber = barcode?.idNumber ?? typedId.replace(/\D/g, '');
  const idInfo = checkIdNumber(idNumber);

  /* The photo of the back is kept whatever happens; reading its barcode is a
     bonus that saves typing. A reader that fails to load (the app updated
     while open) is treated like a barcode that did not read. */
  const keepBackPhoto = async (photo: Blob | undefined) => {
    if (!photo) return;
    setError(null);
    setBack(photo);
    setBarcode(null);
    setFullName('');
    setBackRead('reading');
    try {
      const found = (await readImageFile(photo))
        .map((r) => parseIdBarcode(r.text, r.format))
        .filter((x): x is IdBarcode => !!x);
      const best = found.find((x) => x.surname || x.names) ?? found[0];
      if (best) { setBarcode(best); setBackRead('read'); } else setBackRead('none');
    } catch {
      setBackRead('none');
    }
  };

  const retakeBack = () => {
    setBack(null);
    setBarcode(null);
    setFullName('');
    setTypedId('');
    setBackRead('idle');
    setCameraReady(false);
  };

  const take = async (setter: (b: Blob) => void, mirror = false) => {
    const v = videoRef.current;
    if (!v) return;
    const blob = await capturePhoto(v);
    if (!blob) { setError(t('profile.scan.photoFailed')); return; }
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
      // i18n-ignore: the server's English instruction; shown translated through CHALLENGE_KEYS below
      setChallenge(res.challenge ?? 'Turn your head to your left');
      setChecks(res.checks);
      if (front && res.id) await api.uploadIdDocument(res.id, 'card_front', front);
      if (back && res.id) await api.uploadIdDocument(res.id, 'card_back', back);
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
    <div role="dialog" aria-modal="true" aria-label={t('me.verifyId')} className="fixed inset-0 z-[70] bg-canvas overflow-y-auto">
      <div className="max-w-md mx-auto px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] min-h-full flex flex-col">
        {/* Header: where you are, and a way out. */}
        <div className="flex items-center justify-between py-2">
          <p className="m-0 text-small font-bold text-dim">
            {stepNo >= 0 ? t('profile.scan.step', { step: stepNo + 1, total: STEPS.length }) : step === 'done' ? t('action.done') : t('chat.sending')}
          </p>
          <button
            onClick={onClose}
            aria-label={t('action.close')}
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
            <h1 className="m-0 font-display text-head font-extrabold text-ink tracking-tight">{t('me.verifyId')}</h1>
            <p className="m-0 text-body text-dim leading-relaxed">
              {t('profile.scan.intro')}
            </p>
            <ol className="m-0 pl-0 list-none flex flex-col gap-3">
              {[
                ['camera', t('profile.scan.listFront')],
                ['search', t('profile.scan.listBack')],
                ['user', t('profile.scan.listSelfies')],
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
              <b>{t('profile.scan.photosTitle')}</b> {t('profile.scan.photosBody')}
            </div>
            <label className="flex gap-3 items-start min-h-[44px] cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-[var(--v-brand)] shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span className="text-body text-ink leading-snug">{t('profile.scan.consent')}</span>
            </label>
            <Button block disabled={!consent} icon="camera" onClick={() => go('front')}>{t('profile.scan.start')}</Button>
          </div>
        )}

        {/* 2. Front of the card */}
        {step === 'front' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">{t('profile.scan.frontTitle')}</h1>
              <p className="m-0 mt-1 text-small text-dim">{t('profile.scan.frontHint')}</p>
            </div>
            {front ? <Preview blob={front} /> : (
              <CameraView facing="environment" guide="card" onReady={onCameraReady} onError={setError} />
            )}
            {front ? (
              <div className="flex gap-2.5">
                <Button variant="ghost" className="flex-1" icon="retry" onClick={() => { setFront(null); setCameraReady(false); }}>{t('profile.scan.retake')}</Button>
                <Button className="flex-1" onClick={() => go('back')}>{t('profile.scan.usePhoto')}</Button>
              </div>
            ) : (
              <Button block icon="camera" disabled={!cameraReady} onClick={() => take(setFront)}>{t('profile.scan.takePhoto')}</Button>
            )}
          </div>
        )}

        {/* 3. Back of the card: the barcode */}
        {step === 'back' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">{t('profile.scan.backTitle')}</h1>
              <p className="m-0 mt-1 text-small text-dim">
                {t('profile.scan.backHint')}
              </p>
            </div>

            {back ? <Preview blob={back} /> : (
              <CameraView facing="environment" guide="card" onReady={onCameraReady} onError={setError} />
            )}

            {backRead === 'reading' && (
              <p role="status" className="m-0 text-small text-dim text-center">{t('profile.scan.reading')}</p>
            )}

            {barcode && (
              <div className="rounded-3xl border border-line bg-surface p-4">
                <p className="m-0 flex items-center gap-2 text-body font-bold text-verified"><Icon name="check" size={18} />{t('profile.scan.cardRead')}</p>
                <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-small">
                  {barcode.surname && <><dt className="text-dim">{t('profile.scan.name')}</dt><dd className="m-0 text-ink font-semibold">{displayName(barcode)}</dd></>}
                  <dt className="text-dim">{t('profile.scan.idNumber')}</dt><dd className="m-0 text-ink font-semibold font-mono tnum">•••••••••{barcode.idNumber.slice(-4)}</dd>
                  {idInfo.dateOfBirth && <><dt className="text-dim">{t('auth.dateOfBirth')}</dt><dd className="m-0 text-ink font-semibold">{idInfo.dateOfBirth}</dd></>}
                </dl>
              </div>
            )}

            {/* The barcode did not read. Not a problem: the photo still goes to
                the reviewer, and the number is typed. */}
            {backRead === 'none' && (
              <div className="flex flex-col gap-2">
                <p className="m-0 rounded-2xl border border-line bg-surface-2 px-3.5 py-2.5 text-small text-ink leading-snug">
                  {t('profile.scan.typeAfterPhoto')}
                </p>
                <label className="text-micro font-bold uppercase tracking-wide text-dim" htmlFor="idnum">{t('profile.scan.idNumber')}</label>
                <input
                  id="idnum"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={13}
                  value={typedId}
                  onChange={(e) => setTypedId(e.target.value.replace(/\D/g, ''))}
                  className="w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink font-mono tnum focus:outline-none focus:border-ink"
                  placeholder={t('profile.id.digits')}
                />
                {typedId.length === 13 && !idInfo.ok && <p className="m-0 text-small text-danger">{idInfo.reason}</p>}
              </div>
            )}

            {back ? (
              <div className="flex gap-2.5">
                <Button variant="ghost" className="flex-1" icon="retry" onClick={retakeBack}>{t('profile.scan.retake')}</Button>
                <Button className="flex-1" disabled={backRead === 'reading' || !(barcode || idInfo.ok)} onClick={() => go('details')}>{t('action.continue')}</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button block icon="camera" disabled={!cameraReady} onClick={() => take((b) => { void keepBackPhoto(b); })}>{t('profile.scan.takePhoto')}</Button>
                {/* For a camera that will not open here, or a photo already taken. */}
                <label className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-pill border border-line bg-surface text-body font-bold text-ink cursor-pointer active:scale-[.975] transition">
                  <Icon name="image" size={18} />
                  {t('profile.scan.choosePhoto')}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void keepBackPhoto(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              </div>
            )}
          </div>
        )}

        {/* 4. The name, as on the card */}
        {step === 'details' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">{t('profile.scan.nameTitle')}</h1>
              <p className="m-0 mt-1 text-small text-dim">{barcode?.surname ? t('profile.scan.nameFromCard') : t('profile.scan.nameExact')}</p>
            </div>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full border-[1.5px] border-line rounded-pill px-4 py-3 text-base bg-surface text-ink focus:outline-none focus:border-ink"
              placeholder={t('profile.scan.namePlaceholder')}
              aria-label={t('auth.fullName')}
            />
            <Button block disabled={busy || fullName.trim().length < 3 || !idInfo.ok} onClick={start}>
              {busy ? t('auth.verifying') : t('profile.scan.toSelfies')}
            </Button>
          </div>
        )}

        {/* 5. Selfie, straight on */}
        {step === 'selfie' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">{t('profile.scan.selfieTitle')}</h1>
              <p className="m-0 mt-1 text-small text-dim">{t('profile.scan.selfieHint')}</p>
            </div>
            {checks && checks.mismatches.length > 0 && (
              <p className="m-0 rounded-2xl border border-line bg-surface-2 px-3.5 py-2.5 text-small text-ink leading-snug">
                {t('profile.scan.mismatch', { fields: checks.mismatches.join(', ') })}
              </p>
            )}
            {selfie ? <Preview blob={selfie} mirror /> : (
              <CameraView facing="user" guide="face" onReady={onCameraReady} onError={setError} />
            )}
            {selfie ? (
              <div className="flex gap-2.5">
                <Button variant="ghost" className="flex-1" icon="retry" onClick={() => { setSelfie(null); setCameraReady(false); }}>{t('profile.scan.retake')}</Button>
                <Button className="flex-1" onClick={() => go('challenge')}>{t('profile.scan.usePhoto')}</Button>
              </div>
            ) : (
              <Button block icon="camera" disabled={!cameraReady} onClick={() => take(setSelfie, true)}>{t('profile.scan.takeSelfie')}</Button>
            )}
          </div>
        )}

        {/* 6. The random instruction */}
        {step === 'challenge' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="m-0 font-display text-title font-extrabold text-ink">{t('profile.scan.challengeTitle')}</h1>
              <p className="m-0 mt-1 text-body text-ink">
                {t('profile.scan.challengeWhen')} <b className="text-brand">{CHALLENGE_KEYS[challenge] ? t(CHALLENGE_KEYS[challenge]) : challenge}</b>
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
                <Button variant="ghost" className="flex-1" icon="retry" onClick={() => { setChallengeShot(null); setCameraReady(false); }}>{t('profile.scan.retake')}</Button>
                <Button className="flex-1" onClick={send}>{t('profile.scan.send')}</Button>
              </div>
            ) : (
              <Button block icon="camera" disabled={!cameraReady || countdown !== null} onClick={takeChallenge}>
                {countdown !== null ? t('profile.scan.getReady') : t('profile.scan.startCount')}
              </Button>
            )}
          </div>
        )}

        {step === 'sending' && (
          <div className="flex-1 grid place-items-center text-center">
            <div>
              <span className="inline-block w-10 h-10 rounded-full border-4 border-surface-3 border-t-brand-solid animate-spin" aria-hidden="true" />
              <p role="status" className="mt-4 text-body font-semibold text-ink">{t('profile.scan.sending')}</p>
            </div>
          </div>
        )}

        {/* 7. Sent */}
        {step === 'done' && (
          <div className="flex flex-col gap-4 text-center items-center pt-6">
            <span className="grid place-items-center w-16 h-16 rounded-full bg-verified-soft text-verified"><Icon name="check" size={30} /></span>
            <h1 className="m-0 font-display text-head font-extrabold text-ink">{t('profile.scan.sentTitle')}</h1>
            <p className="m-0 text-body text-dim leading-relaxed max-w-sm">
              {t('profile.scan.sentBody')}
            </p>
            <p className="m-0 rounded-2xl border border-line bg-info-soft px-3.5 py-2.5 text-small text-ink leading-snug max-w-sm">
              <b>{t('profile.scan.homeAffairsLabel')}</b> {t('profile.scan.homeAffairsBody')}
            </p>
            <Button block onClick={onDone}>{t('action.done')}</Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
