import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  preprocessReceiptImage,
  applyContrastEnhancement,
} from './image-preprocessor';

describe('Adaptive Document Contrast & Image Preprocessor', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:http://localhost/mock-uuid'),
      revokeObjectURL: vi.fn(),
    });

    // Mock HTMLImageElement
    class MockImage {
      naturalWidth = 2400;
      naturalHeight = 1800;
      width = 2400;
      height = 1800;
      onload: (() => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      private _src = '';

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }

      get src() {
        return this._src;
      }
    }

    vi.stubGlobal('Image', MockImage);

    // Mock Canvas toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback: (blob: Blob | null) => void, mime?: string) {
      const mockBlob = new Blob(['mock-data'], { type: mime || 'image/jpeg' });
      callback(mockBlob);
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('clamps maximum dimension to 1600px maintaining aspect ratio', async () => {
    const inputBlob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
    const result = await preprocessReceiptImage(inputBlob, { maxDimension: 1600 });

    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200); // 1800 * (1600 / 2400)
    expect(result.processedBlob).toBeInstanceOf(Blob);
    expect(result.previewUrl).toBe('blob:http://localhost/mock-uuid');
  });

  it('handles portrait orientation dimension clamp', async () => {
    class PortraitMockImage {
      naturalWidth = 1500;
      naturalHeight = 3000;
      width = 1500;
      height = 3000;
      onload: (() => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      private _src = '';

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', PortraitMockImage);

    const inputBlob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
    const result = await preprocessReceiptImage(inputBlob, { maxDimension: 1600 });

    expect(result.height).toBe(1600);
    expect(result.width).toBe(800); // 1500 * (1600 / 3000)
  });

  it('does not upscale images smaller than maxDimension', async () => {
    class SmallMockImage {
      naturalWidth = 800;
      naturalHeight = 600;
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    }
    vi.stubGlobal('Image', SmallMockImage);

    const inputBlob = new Blob(['small-image'], { type: 'image/png' });
    const result = await preprocessReceiptImage(inputBlob, { maxDimension: 1600 });

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('applies contrast enhancement to canvas context without throwing', () => {
    const mockData = new Uint8ClampedArray([
      50, 50, 50, 255,   // Dark gray
      200, 200, 200, 255 // Light gray
    ]);

    const mockCtx = {
      getImageData: vi.fn(() => ({
        data: mockData,
      })),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    expect(() => applyContrastEnhancement(mockCtx, 2, 1)).not.toThrow();
    expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 2, 1);
    expect(mockCtx.putImageData).toHaveBeenCalled();
  });

  // Regression for P1-C5: a real decode can take >150ms. The old 150ms
  // "jsdom fast path" timeout rejected and returned the raw multi-MB photo.
  it('waits for a 300ms decode and still produces resized preprocessing output', async () => {
    class SlowMockImage {
      naturalWidth = 2400;
      naturalHeight = 1800;
      width = 2400;
      height = 1800;
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      private _src = '';

      set src(value: string) {
        this._src = value;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 300);
      }
      get src() {
        return this._src;
      }
    }
    vi.stubGlobal('Image', SlowMockImage);
    // Simulate a real browser UA so the production 10s deadline applies (the
    // 150ms fallback is intentionally jsdom-only for unrelated scan tests).
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (real browser)');

    const drawImage = vi.fn();
    const canvasWidths: number[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement
    ) {
      return {
        drawImage: (...args: unknown[]) => {
          canvasWidths.push(this.width, this.height);
          drawImage(...args);
        },
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    const inputBlob = new Blob(['slow-decode-photo'], { type: 'image/jpeg' });
    const result = await preprocessReceiptImage(inputBlob, { maxDimension: 1600, enhanceContrast: false });

    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
    expect(result.processedBlob).not.toBe(inputBlob);
    expect(canvasWidths).toEqual([1600, 1200]);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 1200);
  });

  // Regression for P1-C5: prefer createImageBitmap() when the browser supports it.
  it('prefers createImageBitmap when available and records exact draw dimensions', async () => {
    const bitmap = { width: 2400, height: 1800, close: vi.fn() };
    const createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmap);

    // The Image constructor must not be used on the createImageBitmap path.
    vi.stubGlobal('Image', vi.fn(() => {
      throw new Error('Image should not be constructed when createImageBitmap is available');
    }));

    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement
    ) {
      return {
        drawImage: (...args: unknown[]) => {
          drawImage(this.width, this.height, ...args);
        },
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    });

    const inputBlob = new Blob(['bitmap-photo'], { type: 'image/jpeg' });
    const result = await preprocessReceiptImage(inputBlob, { maxDimension: 1600, enhanceContrast: false });

    expect(createImageBitmap).toHaveBeenCalledWith(inputBlob);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
    expect(drawImage).toHaveBeenCalledWith(1600, 1200, bitmap, 0, 0, 1600, 1200);
  });
});
