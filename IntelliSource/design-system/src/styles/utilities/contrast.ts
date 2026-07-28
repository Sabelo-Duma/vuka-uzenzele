/** WCAG contrast utilities — used by CI token-pair tests and dynamic content (charts). */

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((ch) => ch + ch).join('') : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** Contrast ratio between two hex colors (1–21). */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function passesAA(fgHex: string, bgHex: string, largeText = false): boolean {
  return contrastRatio(fgHex, bgHex) >= (largeText ? 3 : 4.5);
}

export function passesAAUiComponent(fgHex: string, bgHex: string): boolean {
  return contrastRatio(fgHex, bgHex) >= 3;
}
