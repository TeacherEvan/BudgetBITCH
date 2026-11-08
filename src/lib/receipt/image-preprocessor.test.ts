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
});
