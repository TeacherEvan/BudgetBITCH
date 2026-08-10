import { describe, expect, test, vi, beforeEach } from 'vitest';
import { runOcrScan, resetOcrWorker } from './ocr-worker';

describe('Tesseract Web Worker wrapper', () => {
  beforeEach(async () => {
    // The worker is cached at module scope across calls; reset between tests
    // so each test observes a fresh create-once schedule.
    await resetOcrWorker();
    vi.clearAllMocks();
  });

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

  test('reuses a single worker across repeated scans (no re-init per scan)', async () => {
    const mockWorker = {
      recognize: vi.fn().mockResolvedValue({ data: { lines: [] } }),
      terminate: vi.fn().mockResolvedValue(undefined),
    };
    const mockCreateWorker = vi.fn().mockResolvedValue(mockWorker);

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    await runOcrScan(canvas, { countryHint: 'ZA', createWorkerFn: mockCreateWorker });
    await runOcrScan(canvas, { countryHint: 'ZA', createWorkerFn: mockCreateWorker });
    await runOcrScan(canvas, { countryHint: 'ZA', createWorkerFn: mockCreateWorker });

    // createWorker should only fire once (worker cached); terminate never called mid-run.
    expect(mockCreateWorker).toHaveBeenCalledTimes(1);
    expect(mockWorker.terminate).not.toHaveBeenCalled();
  });
});
