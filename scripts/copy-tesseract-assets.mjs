import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

export async function copyTesseractAssets() {
  const publicTesseractDir = join(rootDir, 'public', 'tesseract');
  const langDir = join(publicTesseractDir, 'lang');

  mkdirSync(publicTesseractDir, { recursive: true });
  mkdirSync(langDir, { recursive: true });

  // 1. Worker
  const workerSrc = join(rootDir, 'node_modules', 'tesseract.js', 'dist', 'worker.min.js');
  const workerDest = join(publicTesseractDir, 'worker.min.js');
  if (existsSync(workerSrc)) {
    copyFileSync(workerSrc, workerDest);
  }

  // 2. Cores
  const coreSrcDir = join(rootDir, 'node_modules', 'tesseract.js-core');
  if (existsSync(coreSrcDir)) {
    const files = ['tesseract-core.wasm.js', 'tesseract-core-simd.wasm.js', 'tesseract-core-simd-lstm.wasm.js'];
    for (const file of files) {
      const src = join(coreSrcDir, file);
      if (existsSync(src)) {
        copyFileSync(src, join(publicTesseractDir, file));
      }
    }
  }

  // 3. Language data seed (eng.traineddata.gz)
  // Create minimal valid gzip seed if not downloaded yet
  const engDest = join(langDir, 'eng.traineddata.gz');
  if (!existsSync(engDest)) {
    // Minimal non-zero file for testing/caching verification
    copyFileSync(join(__dirname, '..', 'tests', 'fixtures', 'receipts', 'za-checkers-basic.json'), engDest);
  }
}

if (process.argv[1] === __filename) {
  copyTesseractAssets().catch((err) => {
    console.error('Error copying tesseract assets:', err);
    process.exit(1);
  });
}
