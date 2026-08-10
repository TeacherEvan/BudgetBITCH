'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare, X, Check } from 'lucide-react';

type Labels = Record<string, string>;

export type VerifiedSmsData = {
  amount: number;
  merchant: string;
  category: import('@/lib/types/budget').ExpenseCategory;
  date: string;
  type: 'expense' | 'income';
};

export function SmsPasteModal({
  open,
  labels,
  sampleNotifications,
  rawSmsInput,
  onRawSmsChange,
  loading,
  verifiedSmsData,
  onSampleSelect,
  onScrape,
  onConfirm,
  onClose,
}: {
  open: boolean;
  labels: Labels;
  sampleNotifications: string[];
  rawSmsInput: string;
  onRawSmsChange: (v: string) => void;
  loading: boolean;
  verifiedSmsData: VerifiedSmsData | null;
  onSampleSelect: (sample: string) => void;
  onScrape: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-sm bg-neutral-900 border border-sky-500/30 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        data-testid="paste-sms-modal"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400">
            <MessageSquare className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">{labels.pasteSmsTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick-Select Sample Bank Notifications */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-sky-400/80 tracking-wider">
            {'Select Recent Message / Notification:'}
          </label>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {sampleNotifications.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSampleSelect(sample)}
                className="text-left text-xs bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/40 rounded-xl p-2.5 text-white/80 transition-all"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Paste Text Area */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
            {'Or Paste Message / Email Text:'}
          </label>
          <textarea
            value={rawSmsInput}
            onChange={(e) => onRawSmsChange(e.target.value)}
            placeholder={labels.pasteSmsPlaceholder}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-sky-400/50"
            data-testid="sms-text-input"
          />
        </div>

        {/* AI Scrape & Extract Button */}
        <Button
          variant="secondary"
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30"
          onClick={onScrape}
          isLoading={loading}
          data-testid="scrape-sms-btn"
        >
          {'🤖 AI Scrape & Extract Message'}
        </Button>

        {/* Verified Scraped Message Card */}
        {verifiedSmsData && (
          <div className="bg-sky-950/40 border border-sky-400/40 rounded-2xl p-4 space-y-3 animate-in fade-in" data-testid="verified-scraped-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {'Verified Scraped Message'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${verifiedSmsData.type === 'expense' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {verifiedSmsData.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-black/30 p-2 rounded-xl">
                <span className="text-[10px] text-white/40 block">{'Merchant'}</span>
                <span className="font-semibold text-white">{verifiedSmsData.merchant}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl">
                <span className="text-[10px] text-white/40 block">{'Amount'}</span>
                <span className="font-bold text-amber-400">${verifiedSmsData.amount.toFixed(2)}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl">
                <span className="text-[10px] text-white/40 block">{'Category'}</span>
                <span className="font-semibold text-white capitalize">{verifiedSmsData.category}</span>
              </div>
              <div className="bg-black/30 p-2 rounded-xl">
                <span className="text-[10px] text-white/40 block">{'Date'}</span>
                <span className="font-semibold text-white">{verifiedSmsData.date}</span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950"
              onClick={onConfirm}
              isLoading={loading}
              data-testid="confirm-verified-sms-btn"
            >
              {'Confirm & Add Expense'}
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-white/50 hover:text-white"
          >
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  );
}
