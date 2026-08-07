import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { copyTesseractAssets } from './copy-tesseract-assets.mjs';

describe('Tesseract self-hosted asset vendor script', () => {
  test('copies worker, wasm cores and eng traineddata into public/tesseract/', async () => {
    await copyTesseractAssets();

    const targetDir = join(process.cwd(), 'public', 'tesseract');

    const expectedFiles = [
      join(targetDir, 'worker.min.js'),
      join(targetDir, 'tesseract-core-simd-lstm.wasm.js'),
      join(targetDir, 'lang', 'eng.traineddata.gz'),
    ];

    for (const filePath of expectedFiles) {
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeGreaterThan(0);
    }
  });
});
