import { useId, useState } from 'react';
import { minWagePerHour } from '../../data/catalog';
import { money } from '../../lib/format';
import type { FormalJob, Gig } from '../../types';
import { Button, Sheet } from '../../components/ui';
import { Icon } from '../../components/Icon';

/**
 * Narrowing the feed down to the job you can actually take.
 *
 * Discovery was eight category chips and nothing else. That works with three
 * listings and fails completely at a few hundred, which is the first real
 * growth milestone — and it fails worst for the person with the least room to
 * manoeuvre, who needs work within walking distance, above a certain rate,
 * this week.
 *
 * Four controls, each answering a question a worker actually asks:
 *   search    — "is the thing I can do in here?"
 *   pays at least — "is it worth the taxi fare?"
 *   within    — "can I get there?" (only once the device knows where it is)
 *   sort      — "show me the best one first"
 */
export interface JobFilter {
  query: string;
  minRate: number;
  maxKm: number | null;
  sort: 'best' | 'pay' | 'near';
}

export const EMPTY_FILTER: JobFilter = { query: '', minRate: 0, maxKm: null, sort: 'best' };

export const activeCount = (f: JobFilter): number =>
  (f.query.trim() ? 1 : 0) + (f.minRate > 0 ? 1 : 0) + (f.maxKm !== null ? 1 : 0) + (f.sort !== 'best' ? 1 : 0);

const matches = (haystack: string[], q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((h) => h.toLowerCase().includes(needle));
};

export function applyToGigs(list: Gig[], f: JobFilter): Gig[] {
  const out = list.filter((g) =>
    matches([g.title, g.description, g.location, g.employer], f.query)
    && g.payPerHour >= f.minRate
    // A listed distance is a label, not a measurement, so an unmeasured
    // listing is never silently excluded by a distance filter.
    && (f.maxKm === null || g.distanceSource !== 'measured' || g.distanceKm <= f.maxKm));

  if (f.sort === 'pay') return [...out].sort((a, b) => b.payPerHour - a.payPerHour);
  if (f.sort === 'near') return [...out].sort((a, b) => a.distanceKm - b.distanceKm);
  return out;
}

export function applyToFormal(list: FormalJob[], f: JobFilter): FormalJob[] {
  const out = list.filter((j) =>
    matches([j.title, j.description, j.location, j.employer, j.type], f.query)
    && (f.maxKm === null || j.distanceSource !== 'measured' || j.distanceKm <= f.maxKm));
  if (f.sort === 'near') return [...out].sort((a, b) => a.distanceKm - b.distanceKm);
  return out;
}

/** The row above the feed: a search box, and everything else behind one button. */
export function FilterBar({ value, onChange, hasCoords, results }: {
  value: JobFilter;
  onChange: (f: JobFilter) => void;
  hasCoords: boolean;
  results: number;
}) {
  const [open, setOpen] = useState(false);
  const searchId = useId();
  const active = activeCount(value);

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <label htmlFor={searchId} className="sr-only">Search jobs</label>
          <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint">
            <Icon name="search" size={18} />
          </span>
          <input
            id={searchId}
            type="search"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder="Search jobs"
            className="w-full min-h-[44px] border-[1.5px] border-line rounded-pill pl-10 pr-4 py-2.5 text-base bg-surface text-ink focus:outline-none focus:border-ink"
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={active > 0 ? `Filters, ${active} applied` : 'Filters'}
          className={`inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[44px] px-3.5 rounded-pill border text-small font-bold transition active:scale-95
            ${active > 0 ? 'bg-brand-soft border-brand text-brand' : 'bg-surface border-line text-ink hover:bg-surface-2'}`}
        >
          <Icon name="filter" size={16} />
          Filters
          {active > 0 && <span className="font-mono tnum">{active}</span>}
        </button>
      </div>

      {active > 0 && (
        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-micro text-dim">
            <span className="font-mono tnum font-bold text-ink">{results}</span> {results === 1 ? 'match' : 'matches'}
          </span>
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTER)}
            className="inline-flex items-center min-h-[44px] px-2 -mr-2 rounded-chip text-micro font-bold text-brand hover:bg-surface-2 transition"
          >
            Clear filters
          </button>
        </div>
      )}

      {open && (
        <FilterSheet
          value={value}
          hasCoords={hasCoords}
          results={results}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function FilterSheet({ value, hasCoords, results, onChange, onClose }: {
  value: JobFilter;
  hasCoords: boolean;
  results: number;
  onChange: (f: JobFilter) => void;
  onClose: () => void;
}) {
  const minWage = minWagePerHour();
  /* Rate steps start at the legal floor, because "at least minimum wage" is
     the filter this product exists to make possible. */
  const rates = [0, Math.ceil(minWage), 50, 75, 100];
  const distances: (number | null)[] = [null, 2, 5, 10, 20];

  return (
    <Sheet title="Filters" onClose={onClose}>
      <h3 className="font-display text-title font-extrabold text-ink m-0 mb-1">Filters</h3>
      <p className="text-small text-dim mb-4">
        <span className="font-mono tnum font-bold text-ink">{results}</span> {results === 1 ? 'job matches' : 'jobs match'} right now.
      </p>

      <Group label="Pays at least">
        <Choices
          options={rates.map((r) => ({ value: r, label: r === 0 ? 'Any rate' : `${money(r)}/hr` }))}
          selected={value.minRate}
          onSelect={(r) => onChange({ ...value, minRate: r })}
        />
        <Note>The legal minimum is {money(minWage)} an hour.</Note>
      </Group>

      <Group label="Within">
        {hasCoords ? (
          <>
            <Choices
              options={distances.map((d) => ({ value: d, label: d === null ? 'Any distance' : `${d} km` }))}
              selected={value.maxKm}
              onSelect={(d) => onChange({ ...value, maxKm: d })}
            />
            <Note>Listings without a measured distance are always shown.</Note>
          </>
        ) : (
          <Note>Turn on “Show gigs nearest me” to filter by distance.</Note>
        )}
      </Group>

      <Group label="Show first">
        <Choices
          options={[
            { value: 'best' as const, label: 'Best match' },
            { value: 'pay' as const, label: 'Best paid' },
            { value: 'near' as const, label: 'Nearest' },
          ]}
          selected={value.sort}
          onSelect={(sort) => onChange({ ...value, sort })}
        />
      </Group>

      <Button block className="mt-5" onClick={onClose}>
        Show {results} {results === 1 ? 'job' : 'jobs'}
      </Button>
      <Button block variant="ghost" className="mt-2" onClick={() => { onChange(EMPTY_FILTER); onClose(); }}>
        Clear everything
      </Button>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-4 border-0 p-0 m-0">
      <legend className="text-micro font-bold uppercase tracking-wide text-dim mb-2 p-0">{label}</legend>
      {children}
    </fieldset>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-micro text-faint mt-2 mb-0 leading-snug">{children}</p>;
}

function Choices<T extends string | number | null>({ options, selected, onSelect }: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === selected;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(o.value)}
            className={`inline-flex items-center whitespace-nowrap min-h-[44px] px-4 rounded-pill border-[1.5px] text-small font-bold transition active:scale-95
              ${on ? 'border-ink bg-ink text-canvas' : 'border-line text-dim hover:border-faint hover:text-ink'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
