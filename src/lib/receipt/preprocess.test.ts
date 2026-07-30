import { describe, expect, test } from 'vitest';
import { preprocessImage } from './preprocess';

describe('Mobile image pre-processing', () => {
  test('downscales image dimensions if max edge exceeds 1600px', async () => {
    // Create mock HTMLImageElement or Blob
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1800;

    const result = await preprocessImage(canvas);

    expect(result.width).toBeLessThanOrEqual(1600);
    expect(result.height).toBeLessThanOrEqual(1600);
    expect(result.canvas).toBeDefined();
  });
});
