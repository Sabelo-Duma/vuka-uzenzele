/**
 * Generate PWA raster icons from public/icon.svg.
 * Run once (or after editing the icon): `node scripts/gen-icons.mjs`
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'icon.svg'));

const targets = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-48x48.png', size: 48 },
];

for (const t of targets) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: t.size } });
  const png = r.render().asPng();
  writeFileSync(join(root, 'public', t.name), png);
  console.log(`✓ ${t.name} (${t.size}px)`);
}
console.log('Icons generated.');
