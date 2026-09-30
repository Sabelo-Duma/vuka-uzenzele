import { Fragment, type ReactNode } from 'react';

/**
 * Put React nodes into a translated sentence.
 *
 * t() leaves any {placeholder} it was not given exactly as written, so a
 * sentence can be translated whole — word order intact — and its bold or
 * styled parts dropped in afterwards: fill(translated, { tier: <b>{name}</b> }).
 */
export function fill(text: string, parts: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((seg, i) => {
    const name = /^\{(\w+)\}$/.exec(seg)?.[1];
    return <Fragment key={i}>{name !== undefined && name in parts ? parts[name] : seg}</Fragment>;
  });
}

/**
 * Style the number inside a translated plural. The plural has to be looked up
 * with its real count, so {count} is already filled in; this finds that figure
 * and hands it to `render`.
 */
export function withCount(text: string, count: number, render: (n: string) => ReactNode): ReactNode {
  const n = String(count);
  const at = text.indexOf(n);
  if (at < 0) return text;
  return <>{text.slice(0, at)}{render(n)}{text.slice(at + n.length)}</>;
}
