import { describe, expect, test, vi, beforeEach } from 'vitest';
import { runOcrScan, resetOcrWorker } from './ocr-worker';

const tesseractMock = vi.hoisted(() => ({
  createWorker: vi.fn(),
  OEM: { LSTM_ONLY: 1 },
}));
vi.mock('tesseract.js', () => tesseractMock);

function makeMockWorker(lines: unknown[] = []) {
  return {
    recognize: vi.fn().mockResolvedValue({ data: { lines } }),
    terminate: vi.fn().mockResolvedValue(undefined),
  };
}

function makeCanvas(width = 300, height = 400) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

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
    const mockWorker = makeMockWorker();
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

  // Regression for P1-C10: the default maker appended OEM.LSTM_ONLY as a 4th
  // argument, producing createWorker(lang, 1, options, 1).
  test('default worker maker calls createWorker with exactly three arguments including OEM.LSTM_ONLY', async () => {
    const mockWorker = makeMockWorker();
    tesseractMock.createWorker.mockResolvedValue(mockWorker);

    const payload = await runOcrScan(makeCanvas(), { countryHint: 'ZA' });

    expect(payload.lang).toBe('eng');
    expect(tesseractMock.createWorker).toHaveBeenCalledTimes(1);
    const args = tesseractMock.createWorker.mock.calls[0];
    expect(args).toHaveLength(3);
    expect(args[0]).toBe('eng');
    expect(args[1]).toBe(tesseractMock.OEM.LSTM_ONLY);
    expect(args[2]).toEqual(expect.objectContaining({
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/',
      langPath: '/tesseract/lang',
    }));
  });

  // Regression for P1-C10: the fallback hardcoded @tesseract.js-data/eng,
  // so Thai traineddata could never load for eng+tha.
  test('uses a multi-language traineddata path for eng+tha scans', async () => {
    const mockWorker = makeMockWorker();
    const createWorkerFn = vi.fn(async (...args: unknown[]) => {
      const options = args[2] as { langPath: string };
      expect(options.langPath).toMatch(/tha|tessdata\.projectnaptha\.com/);
      return mockWorker;
    });

    const payload = await runOcrScan(makeCanvas(), {
      countryHint: 'TH',
      createWorkerFn,
    });

    expect(payload.lang).toBe('eng+tha');
    expect(createWorkerFn).toHaveBeenCalledTimes(1);
    expect(createWorkerFn.mock.calls[0][0]).toBe('eng+tha');
    expect((createWorkerFn.mock.calls[0][2] as { langPath: string }).langPath).toBe(
      'https://tessdata.projectnaptha.com/4.0.0'
    );
  });

  // Regression for P1-C10: two concurrent first scans each created a worker.
  test('single-flights worker creation when two scans start concurrently', async () => {
    const mockWorker = makeMockWorker();
    let resolveWorker!: (worker: unknown) => void;
    const createWorkerFn = vi.fn(
      () => new Promise<unknown>((resolve) => {
        resolveWorker = resolve;
      })
    );

    const first = runOcrScan(makeCanvas(), { countryHint: 'ZA', createWorkerFn });
    const second = runOcrScan(makeCanvas(), { countryHint: 'ZA', createWorkerFn });

    expect(createWorkerFn).toHaveBeenCalledTimes(1);

    resolveWorker(mockWorker);
    const [firstPayload, secondPayload] = await Promise.all([first, second]);

    expect(firstPayload.lines).toEqual([]);
    expect(secondPayload.lines).toEqual([]);
    expect(createWorkerFn).toHaveBeenCalledTimes(1);
    expect(mockWorker.terminate).not.toHaveBeenCalled();
  });

  // Regression for P1-C10: the first scan's logger closure was cached forever.
  test('routes progress through the most recent scan onProgress callback', async () => {
    const mockWorker = makeMockWorker();
    const workerOptions: Array<{
      logger: (m: { status: string; progress: number }) => void;
    }> = [];
    const createWorkerFn = vi.fn(async (...args: unknown[]) => {
      const options = args[2] as {
        logger: (m: { status: string; progress: number }) => void;
      };
      workerOptions.push(options);
      return mockWorker;
    });

    const firstProgress = vi.fn();
    await runOcrScan(makeCanvas(), { countryHint: 'ZA', createWorkerFn, onProgress: firstProgress });

    expect(workerOptions).toHaveLength(1);
    workerOptions[0].logger({ status: 'recognizing text', progress: 0.25 });
    expect(firstProgress).toHaveBeenCalledWith(0.25);

    workerOptions[0].logger({ status: 'loading language traineddata', progress: 0.9 });
    expect(firstProgress).toHaveBeenCalledTimes(1);

    const secondProgress = vi.fn();
    await runOcrScan(makeCanvas(), { countryHint: 'ZA', createWorkerFn, onProgress: secondProgress });

    expect(createWorkerFn).toHaveBeenCalledTimes(1);
    workerOptions[0].logger({ status: 'recognizing text', progress: 0.75 });
    expect(secondProgress).toHaveBeenCalledWith(0.75);
    expect(firstProgress).toHaveBeenCalledTimes(1);
  });
});
