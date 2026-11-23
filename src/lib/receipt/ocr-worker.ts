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

type WorkerLogger = (m: { status: string; progress: number }) => void;
type MakeWorker = (lang: string, oem: number, options: unknown) => Promise<unknown>;

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

// tesseract.js loads ~MBs of WASM + lang data. Import it lazily so it stays out
// of the Quick Add / wizard route bundles and only downloads on first scan.
let tesseractMod: typeof import('tesseract.js') | null = null;
async function loadTesseract(): Promise<typeof import('tesseract.js')> {
  if (!tesseractMod) {
    tesseractMod = await import('tesseract.js');
  }
  return tesseractMod;
}

// The self-hosted /tesseract/lang folder only ships eng.traineddata. Multi-lang
// scans must use the standard multi-language tessdata CDN or tha never loads.
const MULTI_LANG_TESSDATA_CDN = 'https://tessdata.projectnaptha.com/4.0.0';
const ENG_LOCAL_PATH = '/tesseract/lang';
const ENG_CDN_PATH = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int';

function resolveLangPath(lang: string): string {
  return lang.includes('+') ? MULTI_LANG_TESSDATA_CDN : ENG_LOCAL_PATH;
}

function resolveFallbackLangPath(lang: string): string {
  return lang.includes('+') ? MULTI_LANG_TESSDATA_CDN : ENG_CDN_PATH;
}

// Reuse one worker per language across scans. Creating a worker re-initializes
// the WASM runtime + lang blob (hundreds of ms), so reusing it is the single
// biggest repeat-scan win. Invalidated by lang change or explicit reset.
let cachedWorker: { lang: string; worker: TesseractWorker } | null = null;

// Single-flight: concurrent first scans must share one initialization promise.
let pendingWorker: { lang: string; promise: Promise<TesseractWorker> } | null = null;

// The worker's logger closure is created once. Route it through a mutable ref
// so each scan's onProgress receives events instead of the first scan's closure.
let activeProgressCallback: WorkerLogger | null = null;

/** Drop the cached worker (e.g. on unmount or in tests). */
export async function resetOcrWorker(): Promise<void> {
  activeProgressCallback = null;
  if (pendingWorker) {
    try {
      const worker = await pendingWorker.promise;
      await worker.terminate();
    } catch {
      // Initialization failed already — nothing to terminate.
    }
    pendingWorker = null;
  }
  if (cachedWorker) {
    try {
      await cachedWorker.worker.terminate();
    } catch {
      // Ignore terminate failures during teardown.
    }
    cachedWorker = null;
  }
}

function createWorkerForLang(lang: string, makeWorker: MakeWorker): Promise<TesseractWorker> {
  const workerOptions = {
    workerBlobURL: false,
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/',
    langPath: resolveLangPath(lang),
    cacheMethod: 'refresh',
    logger: ((m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') {
        activeProgressCallback?.(m);
      }
    }) satisfies WorkerLogger,
  };

  return (async () => {
    try {
      return (await makeWorker(lang, 1, workerOptions)) as TesseractWorker;
    } catch {
      // Local asset loading failed (e.g. invalid local stub lang file).
      const cdnOptions = {
        ...workerOptions,
        langPath: resolveFallbackLangPath(lang),
      };
      return (await makeWorker(lang, 1, cdnOptions)) as TesseractWorker;
    }
  })();
}

async function getWorker(lang: string, makeWorker: MakeWorker): Promise<TesseractWorker> {
  if (cachedWorker?.lang === lang) {
    return cachedWorker.worker;
  }
  if (pendingWorker?.lang === lang) {
    return pendingWorker.promise;
  }

  if (cachedWorker) {
    await cachedWorker.worker.terminate();
    cachedWorker = null;
  }
  if (pendingWorker) {
    try {
      const other = await pendingWorker.promise;
      await other.terminate();
    } catch {
      // Ignore failed initialization.
    }
    pendingWorker = null;
  }

  const promise = createWorkerForLang(lang, makeWorker)
    .then((worker) => {
      cachedWorker = { lang, worker };
      return worker;
    })
    .finally(() => {
      if (pendingWorker?.promise === promise) {
        pendingWorker = null;
      }
    });

  pendingWorker = { lang, promise };
  return promise;
}

export async function runOcrScan(
  canvas: HTMLCanvasElement,
  options: OcrScanOptions = {}
): Promise<OcrPayload> {
  const lang = options.countryHint === 'TH' ? 'eng+tha' : 'eng';

  activeProgressCallback = options.onProgress
    ? (m) => options.onProgress!(m.progress)
    : null;

  const makeWorker: MakeWorker = async (workerLang, oem, workerOptions) => {
    if (options.createWorkerFn) {
      return options.createWorkerFn(workerLang, oem, workerOptions);
    }
    const { createWorker } = await loadTesseract();
    // tesseract.js signature: createWorker(lang, oem, options). The OEM value
    // must be the 2nd argument, never appended as a 4th.
    return (createWorker as (...a: unknown[]) => Promise<unknown>)(
      workerLang,
      oem,
      workerOptions
    );
  };

  const worker = await getWorker(lang, makeWorker);

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
