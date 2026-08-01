import type { OcrLine, OcrPayload, OcrWord } from '../../../convex/lib/receipt/types';

/** Minimal shape of the tesseract.js recognize() result we consume. */
type TesseractWord = {
  text?: string;
  confidence?: number;
  bbox?: { x0?: number; y0?: number; x1?: number; y1?: number };
};
type TesseractLine = {
  text?: string;
  confidence?: number;
  words?: TesseractWord[];
};
type TesseractRecognizeResult = { data: { lines?: TesseractLine[] } };

export type OcrScanOptions = {
  countryHint?: string;
  currencyHint?: string;
  createWorkerFn?: (...args: unknown[]) => Promise<unknown>;
  onProgress?: (progress: number) => void;
};

export type TesseractWorker = {
  recognize: (canvas: HTMLCanvasElement) => Promise<TesseractRecognizeResult>;
  terminate: () => Promise<unknown>;
};

// Tesseract.js loads ~MBs of WASM + lang data. Import it lazily so it stays out
// of the Quick Add / wizard route bundles and only downloads on first scan.
let tesseractMod: typeof import('tesseract.js') | null = null;
async function loadTesseract(): Promise<typeof import('tesseract.js')> {
  if (!tesseractMod) {
    tesseractMod = await import('tesseract.js');
  }
  return tesseractMod;
}

// Reuse one worker per language across scans. Creating a worker re-initializes
// the WASM runtime + lang blob (hundreds of ms), so reusing it is the single
// biggest repeat-scan win. Invalidated by lang change or explicit reset.
let cachedWorker: { lang: string; worker: TesseractWorker } | null = null;

/** Drop the cached worker (e.g. on unmount or in tests). */
export async function resetOcrWorker(): Promise<void> {
  if (cachedWorker) {
    await cachedWorker.worker.terminate();
    cachedWorker = null;
  }
}

async function getWorker(
  lang: string,
  makeWorker: (...args: unknown[]) => Promise<unknown>,
  logger?: (m: { status: string; progress: number }) => void
): Promise<TesseractWorker> {
  if (cachedWorker && cachedWorker.lang === lang) {
    return cachedWorker.worker;
  }
  // Lang changed (or first run): terminate the stale worker, then create a new one.
  if (cachedWorker) {
    await cachedWorker.worker.terminate();
    cachedWorker = null;
  }
  const worker = (await makeWorker(lang, 1, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/',
    langPath: '/tesseract/lang',
    cacheMethod: 'refresh',
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && logger) {
        logger(m);
      }
    },
  })) as TesseractWorker;
  cachedWorker = { lang, worker };
  return worker;
}

export async function runOcrScan(
  canvas: HTMLCanvasElement,
  options: OcrScanOptions = {}
): Promise<OcrPayload> {
  const lang = options.countryHint === 'TH' ? 'eng+tha' : 'eng';

  const makeWorker =
    options.createWorkerFn ??
    (async (...args: unknown[]) => {
      const { createWorker, OEM } = await loadTesseract();
      return (createWorker as (...a: unknown[]) => Promise<unknown>)(...args, OEM.LSTM_ONLY);
    });

  const worker = await getWorker(
    lang,
    makeWorker,
    options.onProgress
      ? (m) => options.onProgress!(m.progress)
      : undefined
  );

  const res = (await worker.recognize(canvas)) as TesseractRecognizeResult;

  const rawLines = res.data.lines ?? [];
  const lines: OcrLine[] = rawLines.map((l: TesseractLine, idx: number) => {
    const text = l.text ? l.text.trim() : '';
    const conf = typeof l.confidence === 'number' ? l.confidence : 80;
    const y = l.words?.[0]?.bbox?.y0 ?? idx * 20;

    const words: OcrWord[] = (l.words ?? []).map((w: TesseractWord) => ({
      text: w.text ? w.text.trim() : '',
      conf: typeof w.confidence === 'number' ? w.confidence : conf,
      bbox: [
        w.bbox?.x0 ?? 0,
        w.bbox?.y0 ?? y,
        w.bbox?.x1 ?? 0,
        w.bbox?.y1 ?? y + 15,
      ],
    }));

    return {
      text,
      conf,
      y,
      words,
    };
  });

  return {
    lines: lines.filter((l) => l.text.length > 0),
    width: canvas.width,
    height: canvas.height,
    lang,
    engine: 'tesseract.js@6',
    capturedAt: Date.now(),
    countryHint: options.countryHint,
    currencyHint: options.currencyHint,
  };
}
