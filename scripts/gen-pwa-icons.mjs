// Generate PWA PNG icons from the maskable SVG source at all manifest sizes.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'public', 'icons');

// Maskable source already includes safe-zone padding.
const svg = await readFile(join(root, 'app-icon-maskable.svg'));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(
    join(root, `icon-${size}x${size}.png`),
  );
  console.log(`generated icon-${size}x${size}.png`);
}

console.log('done');
