// components/sms/sms-confirm.tsx
'use client';

import { useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { filterByConfidence, type TransactionCandidate } from '@/lib/sms-parser';
import type { ParsedSMSResult } from '@/lib/sms-parser/types';

const DEFAULT_THRESHOLD = 0.7;

interface SmsConfirmProps {
  text: string;
  candidates: TransactionCandidate[];
  onSave: (candidates: TransactionCandidate[]) => void | Promise<void>;
  onDismiss: () => void;
  locale: 'th' | 'en';
  threshold?: number;
}

const LABELS = {
  th: {
    title: 'เพิ่มรายการจาก SMS?',
    addAll: 'เพิ่มทั้งหมด',
    dismiss: 'ยกเลิก',
    confidence: 'ความมั่นใจ',
    expense: 'จ่าย',
    income: 'รับ',
    empty: 'ไม่พบรายการที่น่าเชื่อถือ',
    saved: 'บันทึกเรียบร้อย',
  },
  en: {
    title: 'Add these from SMS?',
    addAll: 'Add all',
    dismiss: 'Dismiss',
    confidence: 'Confidence',
    expense: 'Expense',
    income: 'Income',
    empty: 'No reliable transactions found',
    saved: 'Saved',
  },
} as const;

export function SmsConfirm({
  text,
  candidates,
  onSave,
  onDismiss,
  locale,
  threshold = DEFAULT_THRESHOLD,
}: SmsConfirmProps) {
  const l = LABELS[locale];
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const accepted = useMemo<TransactionCandidate[]>(
    () => filterByConfidence({ candidates, rawText: text, detectedCountry: null }, threshold).candidates,
    [candidates, text, threshold],
  );

  const handleAddAll = async () => {
    if (saving || accepted.length === 0) return;
    setSaving(true);
    try {
      await onSave(accepted);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="mx-auto w-full max-w-md rounded-2xl border border-[rgba(201,150,12,0.25)] bg-black/60 p-5 backdrop-blur-xl"
      data-testid="sms-confirm"
    >
      <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-[#C9960C]">
        {saved ? l.saved : l.title}
      </h2>
      <p className="mb-4 truncate text-xs text-white/40" title={text}>
        {text}
      </p>

      {accepted.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/50" data-testid="sms-empty">
          {l.empty}
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {accepted.map((c, i) => (
            <li
              key={`${c.amount}-${c.merchant}-${c.date}-${i}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-3 py-2"
              data-testid="sms-row"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white/90">{c.merchant}</p>
                <p className="text-xs text-white/50">
                  {c.amount} {c.currency} · {c.type === 'income' ? l.income : l.expense}
                </p>
              </div>
              <span className="ml-2 shrink-0 rounded-full bg-[rgba(201,150,12,0.15)] px-2 py-0.5 text-[10px] font-bold text-[#E8B020]">
                {Math.round(c.confidence * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="sms-dismiss-btn"
          onClick={onDismiss}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/10"
        >
          <X className="h-4 w-4" /> {l.dismiss}
        </button>
        <button
          type="button"
          data-testid="sms-add-all-btn"
          disabled={saving || accepted.length === 0 || saved}
          onClick={handleAddAll}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C9960C] py-2.5 text-xs font-bold text-[#080600] transition-colors hover:bg-[#F5D742] disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> {l.addAll}
        </button>
      </div>
    </div>
  );
}

export type { ParsedSMSResult };
