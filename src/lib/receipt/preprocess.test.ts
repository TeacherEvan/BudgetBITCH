import { describe, expect, test, vi } from 'vitest';
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

  // Regression for P2-N11: a detached <img> has layout width/height 0; OCR
  // received a 0x0 canvas. Use intrinsic naturalWidth/naturalHeight instead.
  test('uses intrinsic naturalWidth/naturalHeight for a detached image with zero layout size', async () => {
    const img = document.createElement('img');
    Object.defineProperty(img, 'naturalWidth', { value: 3000, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 2000, configurable: true });
    expect(img.width).toBe(0);
    expect(img.height).toBe(0);

    const drawImage = vi.fn();
    const recordedDimensions: Array<[number, number]> = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement
    ) {
      return {
        drawImage: (...args: unknown[]) => {
          recordedDimensions.push([this.width, this.height]);
          drawImage(...args);
        },
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    const result = await preprocessImage(img);

    expect(result.width).toBe(1600);
    expect(result.height).toBe(1067);
    expect(result.canvas.width).toBe(1600);
    expect(result.canvas.height).toBe(1067);
    expect(recordedDimensions).toEqual([[1600, 1067]]);
    expect(drawImage).toHaveBeenCalledWith(img, 0, 0, 1600, 1067);
  });
});
