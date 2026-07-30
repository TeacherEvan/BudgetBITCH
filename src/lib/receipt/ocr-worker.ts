import { createWorker, OEM } from 'tesseract.js';
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
  createWorkerFn?: typeof createWorker;
  onProgress?: (progress: number) => void;
};

export async function runOcrScan(
  canvas: HTMLCanvasElement,
  options: OcrScanOptions = {}
): Promise<OcrPayload> {
  const lang = options.countryHint === 'TH' ? 'eng+tha' : 'eng';
  const makeWorker = options.createWorkerFn ?? createWorker;

  const worker = await makeWorker(lang, OEM.LSTM_ONLY, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/',
    langPath: '/tesseract/lang',
    cacheMethod: 'refresh',
    logger: (m) => {
      if (m.status === 'recognizing text' && options.onProgress) {
        options.onProgress(m.progress);
      }
    },
  });

  const res = (await worker.recognize(canvas)) as unknown as TesseractRecognizeResult;
  await worker.terminate();

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
