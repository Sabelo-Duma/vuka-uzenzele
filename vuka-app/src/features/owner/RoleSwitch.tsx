import { useState } from 'react';
import { useApp } from '../../store/appStore';
import { useT } from '../../providers/LanguageProvider';
import { api, setToken } from '../../lib/api';
import { Card } from '../../components/ui';

/**
 * "Use Vuka as: Worker | Employer", for the owner's account only. It sits on
 * both profile pages, where the owner looks for it, and on the People page.
 * Every other account renders nothing; the server refuses the switch too.
 */
export function OwnerRoleSwitch({ className = 'mb-3.5' }: { className?: string }) {
  const { state } = useApp();
  const t = useT();
  const myRole = state.user?.role;
  const [switching, setSwitching] = useState(false);
  const [failed, setFailed] = useState('');

  if (!state.user?.features?.owner) return null;

  /* The role travels in the sign-in token, so a switch brings a new one, and
     the app starts again from the top as that side. */
  const switchTo = async (role: 'worker' | 'employer') => {
    if (role === myRole || switching) return;
    setSwitching(true);
    setFailed('');
    try {
      const res = await api.ownerSwitchRole(role);
      setToken(res.token);
      window.location.assign('/');
    } catch (e) {
      setFailed((e as Error).message);
      setSwitching(false);
    }
  };

  return (
    <Card className={`p-3.5 ${className}`}>
      <div className="text-small font-bold text-ink mb-2">{t('owner.useAs')}</div>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('owner.useAs')}>
        {(['worker', 'employer'] as const).map((r) => (
          <button
            key={r}
            onClick={() => switchTo(r)}
            disabled={switching}
            aria-pressed={myRole === r}
            className={`min-h-[44px] rounded-pill border text-small font-bold transition active:scale-95 disabled:opacity-60
              ${myRole === r ? 'bg-ink text-canvas border-ink' : 'border-line text-ink hover:bg-surface-2'}`}
          >
            {r === 'worker' ? t('owner.worker') : t('owner.employer')}
          </button>
        ))}
      </div>
      <p className="m-0 mt-2 text-micro text-faint">{switching ? t('owner.switching') : failed || t('owner.useAsHint')}</p>
    </Card>
  );
}
