import { describe, expect, test, vi } from 'vitest';
import { runOcrScan } from './ocr-worker';

describe('Tesseract Web Worker wrapper', () => {
  test('configures worker paths to self-hosted /tesseract/ assets and returns OcrPayload', async () => {
    // Mock worker runner
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({
        data: {
          lines: [
            {
              text: 'CHECKERS HYPER 53.98',
              confidence: 92,
              words: [
                { text: 'CHECKERS', confidence: 95, bbox: { x0: 10, y0: 20, x1: 90, y1: 40 } },
                { text: '53.98', confidence: 89, bbox: { x0: 100, y0: 20, x1: 150, y1: 40 } },
              ],
            },
          ],
        },
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
    };

    const mockCreateWorker = vi.fn().mockResolvedValue(mockWorker);

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 400;

    const payload = await runOcrScan(canvas, {
      countryHint: 'ZA',
      createWorkerFn: mockCreateWorker,
    });

    expect(payload).toBeDefined();
    expect(payload.engine).toBe('tesseract.js@6');
    expect(payload.lines.length).toBeGreaterThan(0);
    expect(mockCreateWorker).toHaveBeenCalledWith('eng', 1, expect.objectContaining({
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/',
    }));
  });
});
