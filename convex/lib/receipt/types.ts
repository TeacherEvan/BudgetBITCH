import type { LineItem } from './extract_details';

export type OcrWord = {
  text: string;
  conf: number;
  bbox: [number, number, number, number];
};

export type OcrLine = {
  text: string;
  conf: number;
  y: number;
  words: OcrWord[];
};

export type OcrPayload = {
  lines: OcrLine[];
  width: number;
  height: number;
  lang: string;
  engine: 'tesseract.js@6' | 'gemini-vision@1';
  capturedAt: number;
  countryHint?: string;
  currencyHint?: string;
};

export type FieldName = 'total' | 'date' | 'merchant' | 'category' | 'currency' | 'tax';

export type FieldCandidate = {
  value: string | number;
  conf: number;
  evidenceLine?: OcrLine;
  ruleId: string;
};

export type QuestionOption = {
  value: string;
  label: string;
  evidence?: string;
};

export type Question =
  | {
      kind: 'choice';
      field: FieldName;
      prompt: string;
      options: QuestionOption[];
    }
  | {
      kind: 'confirm';
      field: FieldName;
      prompt: string;
      value: string;
    }
  | {
      kind: 'entry';
      field: FieldName;
      prompt: string;
      inputType: 'amount' | 'date' | 'text';
    };

export type Answer = {
  field: FieldName;
  value: string;
};

export type ScrapeResult = {
  draftId?: string;
  fields: Record<FieldName, FieldCandidate | null>;
  confidence: Record<FieldName, number>;
  evidence: Record<FieldName, OcrLine | null>;
  questions: Question[];
  lineItems?: LineItem[]; // optional parsed line items from receipt
};

export function makeLine(words: OcrWord[]): OcrLine {
  if (words.length === 0) {
    return { text: '', conf: 0, y: 0, words: [] };
  }

  const text = words.map((w) => w.text).join(' ');
  const totalConf = words.reduce((acc, w) => acc + w.conf, 0);
  const conf = totalConf / words.length;
  const minY = Math.min(...words.map((w) => w.bbox[1]));

  return {
    text,
    conf,
    y: minY,
    words,
  };
}
