import type { OcrLine, OcrPayload } from './types';

export type NormalisedLine = OcrLine & {
  hasAmount: boolean;
  isNoise: boolean;
};

export type NormalisedPayload = OcrPayload & {
  lines: NormalisedLine[];
};

const THAI_DIGITS_MAP: Record<string, string> = {
  '๐': '0',
  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9',
};

export function foldThaiDigits(text: string): string {
  return text.replace(/[๐-๙]/g, (ch) => THAI_DIGITS_MAP[ch] || ch);
}

// Regex matching numbers with decimal or comma standard amounts
const AMOUNT_REGEX = /\b\d+(?:[\.,]\d{2})\b/;

export function normaliseLineText(text: string): string {
  const folded = foldThaiDigits(text);
  return folded.replace(/\s+/g, ' ').trim();
}

export function normaliseLine(input: string | OcrLine): NormalisedLine {
  const lineObj: OcrLine =
    typeof input === 'string'
      ? { text: input, conf: 100, y: 0, words: [] }
      : input;

  const text = normaliseLineText(lineObj.text);
  const hasAmount = AMOUNT_REGEX.test(text);
  const isNoise = text.length === 0;

  return {
    ...lineObj,
    text,
    hasAmount,
    isNoise,
  };
}

export function normalisePayload(payload: OcrPayload): NormalisedPayload {
  return {
    ...payload,
    lines: payload.lines.map((line) => normaliseLine(line)),
  };
}
