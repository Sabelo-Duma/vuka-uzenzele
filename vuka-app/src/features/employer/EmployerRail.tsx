import { Fragment, type ReactNode } from 'react';
import { TIERS } from '../../data/catalog';
import { useApp } from '../../store/appStore';
import { Button, Card } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { langMeta } from '../../i18n';
import { useLanguage, useT } from '../../providers/LanguageProvider';

/**
 * A translated sentence with markup inside it (a bold amount, a bold name).
 *
 * The whole sentence is one catalogue entry with {placeholders}, because word
 * order is the first thing that differs between these five languages; each
 * placeholder is then swapped for the node in `parts`. Pass `count` to pick
 * the plural form (`key_one` / `key_other`) — the {count} in it can then be a
 * node too, which plain t() cannot do because it prints the number as text.
 */
export function useRichT() {
  const t = useT();
  const { lang } = useLanguage();
  return (key: string, parts: Record<string, ReactNode>, count?: number): ReactNode => {
    let template: string;
    if (count !== undefined) {
      let category = 'other';
      try { category = new Intl.PluralRules(langMeta(lang).tag).select(count); } catch { /* no PluralRules: fall back to other */ }
      const wanted = `${key}_${category}`;
      template = t(wanted);
      if (template === wanted) template = t(`${key}_other`);
    } else {
      template = t(key);
    }
    return template.split(/(\{\w+\})/).map((seg, i) => {
      const name = /^\{(\w+)\}$/.exec(seg)?.[1];
      if (name && Object.prototype.hasOwnProperty.call(parts, name)) return <Fragment key={i}>{parts[name]}</Fragment>;
      return seg;
    });
  };
}

/** Desktop side-rail: talent stats + trust note. */
export function EmployerStats() {
  const { state } = useApp();
  const t = useT();
  const total = state.talent.length;
  const proPlus = state.talent.filter((w) => w.tier >= 2).length;
  const verified = state.talent.filter((w) => w.idVerified).length;
  return (
    <>
      <Card className="p-5">
        <div className="text-small font-bold text-ink mb-3">{t('employer.rail.talentNearYou')}</div>
        <div className="grid grid-cols-3 gap-2">
          <Stat value={String(total)} label={t('employer.rail.workers')} />
          {/* i18n-ignore: short for the Professional tier and up; a tier label, the same in every language */}
          <Stat value={String(proPlus)} label="Pro+" />
          <Stat value={String(verified)} label={t('jobs.verified')} />
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-small font-bold text-ink mb-1.5">{t('employer.rail.hireWithConfidence')}</div>
        <p className="text-small text-dim leading-relaxed m-0">{t('employer.rail.trustNote', { icons: TIERS.map((tier) => tier.icon).join(' ') })}</p>
      </Card>
    </>
  );
}

/** Desktop side-rail: prominent post-a-job call to action. */
export function PostJobCard() {
  const { navigate } = useApp();
  const t = useT();
  return (
    <Card className="p-5 text-on-feature feature-band">
      <div aria-hidden="true"><Icon name="briefcase" size={26} /></div>
      <b className="block text-body mt-2">{t('employer.needAHand')}</b>
      <p className="text-small text-on-feature-dim my-2 leading-snug">{t('employer.rail.postPitch')}</p>
      <Button block variant="primary" icon="plus" onClick={() => navigate('post')}>{t('post.title')}</Button>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><b className="block text-title font-extrabold text-ink leading-tight font-mono tnum">{value}</b><span className="text-micro text-dim font-bold uppercase tracking-wide">{label}</span></div>;
}
