export type TransactionType = 'expense' | 'income' | 'transfer' | 'refund' | 'atm' | 'fee';

export interface SMSPattern {
  name: string;
  country: string | undefined; // undefined = generic (any country)
  regex: RegExp;
  extract: (match: RegExpMatchArray, text: string) => Partial<TransactionCandidate> & { confidenceBoost?: number };
  priority: number; // higher = tried first
  confidence: number; // base confidence for this pattern
}

export interface TransactionCandidate {
  amount: number;
  currency: string;
  merchant: string;
  date: string; // ISO yyyy-mm-dd
  type: TransactionType;
  confidence: number; // 0.0 - 1.0
  rawText: string;
  source: 'share-target' | 'notification-listener' | 'manual-paste';
  detectedCountry?: string;
}

export interface ParsedSMSResult {
  candidates: TransactionCandidate[];
  rawText: string;
  detectedCountry: string | null;
}