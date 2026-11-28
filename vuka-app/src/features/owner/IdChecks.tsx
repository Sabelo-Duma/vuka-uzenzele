/* ============================================================
   ID checks: the owner reviews ID submissions from inside the app.

   Until a verification bureau is appointed (see vuka-server/src/idcheck.mjs),
   a person decides every submission. Before this screen that meant curl and
   the admin token, so in practice nobody did. Owner only: the server refuses
   everyone else, and every other account renders nothing.

   What the reviewer does: compare the face in both selfies with the card's
   photo, check the second selfie follows the instruction it was given (the
   liveness check), and check the typed name and the last four digits against
   the card. Deciding deletes the photos on the server (POPIA).
   ============================================================ */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api, type IdDocumentKind, type OwnerIdCheck } from '../../lib/api';
import { useApp } from '../../store/appStore';
import { useT } from '../../providers/LanguageProvider';
import { Button, Card } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { CHALLENGE_KEYS } from '../profile/IdScan';

const PHOTOS: { kind: IdDocumentKind; label: string }[] = [
  { kind: 'card_front', label: 'owner.ids.front' },
  { kind: 'card_back', label: 'owner.ids.back' },
  { kind: 'selfie', label: 'owner.ids.selfie' },
  { kind: 'selfie_challenge', label: 'owner.ids.challenge' },
];
const REASONS = ['owner.ids.reason.blurry', 'owner.ids.reason.face', 'owner.ids.reason.challenge', 'owner.ids.reason.name'];

/** One photo, fetched with the sign-in header. */
function Photo({ id, kind, label, sent, onOpen }: {
  id: string; kind: IdDocumentKind; label: string; sent: boolean; onOpen: (url: string) => void;
}) {
  const t = useT();
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!sent) return undefined;
    let live = true;
    let made = '';
    api.ownerIdPhoto(id, kind)
      .then((b) => { if (!live) return; made = URL.createObjectURL(b); setUrl(made); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; if (made) URL.revokeObjectURL(made); };
  }, [id, kind, sent]);
  return (
    <figure className="m-0">
      <button
        type="button"
        disabled={!url}
        onClick={() => onOpen(url)}
        className="block w-full aspect-[3/4] rounded-2xl overflow-hidden bg-surface-3 border border-line"
        aria-label={t(label)}
      >
        {url
          ? <img src={url} alt="" className="w-full h-full object-cover" />
          : <span className="grid place-items-center w-full h-full text-micro text-dim px-2 text-center">
              {!sent ? t('owner.ids.notSent') : failed ? t('owner.ids.photoMissing') : '…'}
            </span>}
      </button>
      <figcaption className="mt-1 text-micro font-bold text-dim">{t(label)}</figcaption>
    </figure>
  );
}

function Check({ c, mine, onDecided }: { c: OwnerIdCheck; mine: boolean; onDecided: (id: string, approved: boolean) => void }) {
  const t = useT();
  const [zoom, setZoom] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [own, setOwn] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError('');
    try {
      await api.ownerIdDecide(c.id, approve, approve ? undefined : (own.trim() || (reason ? t(reason) : undefined)));
      onDecided(c.id, approve);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const mismatches = (c.checks?.mismatches ?? []).map((f) => t(`owner.ids.f.${f}`)).join(', ');
  const fromBarcode = !!c.checks?.barcodeRead;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-body font-bold text-ink">{c.fullName}</p>
          <p className="m-0 text-micro text-dim">{t('owner.ids.sent', { date: new Date(c.submittedAt).toLocaleString() })}</p>
        </div>
        {mine && <span className="shrink-0 rounded-pill bg-info-soft px-2.5 py-1 text-micro font-bold text-ink">{t('owner.ids.yours')}</span>}
      </div>

      <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-small">
        <dt className="text-dim">{t('owner.ids.account')}</dt><dd className="m-0 text-ink">{c.name}{c.phone ? ` · ${c.phone}` : ''}</dd>
        <dt className="text-dim">{t('owner.ids.idEnds')}</dt><dd className="m-0 text-ink font-mono tnum">{c.last4}</dd>
        {c.dateOfBirth && <><dt className="text-dim">{t('owner.ids.born')}</dt><dd className="m-0 text-ink">{c.dateOfBirth}</dd></>}
        {c.gender && <><dt className="text-dim">{t('owner.ids.sex')}</dt><dd className="m-0 text-ink">{c.gender === 'female' ? t('owner.ids.female') : t('owner.ids.male')}</dd></>}
      </dl>
      <p className={`m-0 mt-2 flex items-center gap-1.5 text-small ${fromBarcode ? 'text-verified' : 'text-dim'}`}>
        <Icon name={fromBarcode ? 'check' : 'edit'} size={14} />{fromBarcode ? t('owner.ids.barcodeRead') : t('owner.ids.typed')}
      </p>
      {mismatches && (
        <p className="m-0 mt-2 flex gap-2 items-start rounded-xl bg-danger-soft px-3 py-2 text-small text-ink">
          <Icon name="alert" size={14} /><span>{t('owner.ids.mismatch', { fields: mismatches })}</span>
        </p>
      )}

      {c.challenge && (
        <p className="m-0 mt-3 text-small text-ink">
          {t('owner.ids.instruction')} <b className="text-brand">{CHALLENGE_KEYS[c.challenge] ? t(CHALLENGE_KEYS[c.challenge]) : c.challenge}</b>
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {PHOTOS.map((p) => (
          <Photo key={p.kind} id={c.id} kind={p.kind} label={p.label} sent={c.documents.includes(p.kind)} onOpen={setZoom} />
        ))}
      </div>
      <p className="m-0 mt-2 text-micro text-faint">{t('owner.ids.tapToEnlarge')} {t('owner.ids.homeAffairs')}</p>

      {error && <p role="alert" className="m-0 mt-3 text-small text-danger">{error}</p>}

      {rejecting ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="m-0 text-small font-bold text-ink">{t('owner.ids.reasonTitle')}</p>
          {REASONS.map((r) => (
            <label key={r} className="flex gap-2.5 items-start min-h-[40px] cursor-pointer text-small text-ink">
              <input type="radio" name={`reason-${c.id}`} className="mt-0.5 w-4 h-4 accent-[var(--v-brand)] shrink-0" checked={reason === r && !own.trim()} onChange={() => { setReason(r); setOwn(''); }} />
              <span>{t(r)}</span>
            </label>
          ))}
          <textarea
            value={own}
            onChange={(e) => setOwn(e.target.value.slice(0, 300))}
            rows={2}
            placeholder={t('owner.ids.reasonOther')}
            aria-label={t('owner.ids.reasonOther')}
            className="w-full border-[1.5px] border-line rounded-2xl px-3.5 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-ink"
          />
          <div className="flex gap-2.5">
            <Button variant="ghost" className="flex-1" disabled={busy} onClick={() => setRejecting(false)}>{t('owner.ids.cancel')}</Button>
            <Button className="flex-1" disabled={busy || !(reason || own.trim())} onClick={() => decide(false)}>{t('owner.ids.sendReject')}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2.5">
          <Button variant="ghost" className="flex-1" icon="x" disabled={busy} onClick={() => setRejecting(true)}>{t('owner.ids.reject')}</Button>
          <Button className="flex-1" icon="check" disabled={busy} onClick={() => decide(true)}>{t('owner.ids.approve')}</Button>
        </div>
      )}

      {zoom && createPortal(
        <button type="button" onClick={() => setZoom('')} aria-label={t('action.close')} className="fixed inset-0 z-[80] bg-black/90 grid place-items-center p-3">
          <img src={zoom} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </button>,
        document.body,
      )}
    </Card>
  );
}

/** The entry on the profile page, and the full-screen list behind it. */
export function OwnerIdChecks({ className = 'mb-3.5' }: { className?: string }) {
  const { state } = useApp();
  const t = useT();
  const isOwner = !!state.user?.features?.owner;
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<OwnerIdCheck[] | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = useCallback(() => {
    setError('');
    api.ownerIdChecks().then(setList).catch(() => setError(t('owner.ids.loadFailed')));
  }, [t]);
  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  if (!isOwner) return null;
  const count = list?.length ?? 0;

  const decided = (id: string, approved: boolean) => {
    setList((l) => (l ?? []).filter((x) => x.id !== id));
    setDone(approved ? t('owner.ids.approved') : t('owner.ids.rejected'));
  };

  return (
    <>
      <Card className={`p-0 ${className}`}>
        <button type="button" onClick={() => { setOpen(true); setDone(''); load(); }} className="w-full flex items-center gap-3 px-3.5 py-3 text-left min-h-[56px]">
          <span className="grid place-items-center w-10 h-10 rounded-full bg-brand-soft text-brand shrink-0"><Icon name="id" size={18} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-small font-bold text-ink">{t('owner.ids.title')}</span>
            <span className="block text-micro text-dim">{count ? t('owner.ids.waiting') : t('owner.ids.none')}</span>
          </span>
          {count > 0 && <span className="min-w-[24px] h-6 px-2 rounded-full bg-live text-white text-micro font-bold grid place-items-center tnum">{count}</span>}
          <Icon name="chev" size={16} />
        </button>
      </Card>

      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label={t('owner.ids.title')} className="fixed inset-0 z-[70] bg-canvas overflow-y-auto">
          <div className="max-w-md mx-auto px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between py-2">
              <h1 className="m-0 font-display text-title font-extrabold text-ink">{t('owner.ids.title')}</h1>
              <button onClick={() => setOpen(false)} aria-label={t('action.close')} className="grid place-items-center w-11 h-11 rounded-full border border-line bg-surface text-ink active:scale-95 transition">
                <Icon name="x" size={18} />
              </button>
            </div>
            <p className="m-0 mb-1 text-small text-dim leading-relaxed">{t('owner.ids.how')}</p>
            <p className="m-0 mb-4 text-micro text-faint">{t('owner.ids.deleteNote')}</p>
            {done && <p role="status" className="m-0 mb-3 rounded-2xl bg-verified-soft px-3.5 py-2.5 text-small font-semibold text-ink">{done}</p>}
            {error && <p role="alert" className="m-0 mb-3 text-small text-danger">{error}</p>}
            {list && list.length === 0 && <p className="m-0 text-body text-dim">{t('owner.ids.empty')}</p>}
            <div className="flex flex-col gap-3.5">
              {list?.map((c) => <Check key={c.id} c={c} mine={c.userId === state.user?.id} onDecided={decided} />)}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
