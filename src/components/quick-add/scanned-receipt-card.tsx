'use client';

import { Button } from '@/components/ui/button';
import { Camera, Save, Plus } from 'lucide-react';
import type { ExpenseCategory, ReceiptLineItem } from '@/lib/types/budget';

type LineItemField = 'description' | 'amount' | 'qty';

export function ScannedReceiptCard({
  loading,
  amount,
  merchant,
  category,
  date,
  tax,
  lineItems,
  repeatCandidate,
  onAmountChange,
  onMerchantChange,
  onCategoryChange,
  onDateChange,
  onTaxChange,
  onUpdateLineItem,
  onSave,
  onRepeat,
}: {
  loading: boolean;
  amount: string;
  merchant: string;
  category: ExpenseCategory;
  date: string;
  tax: string;
  lineItems: ReceiptLineItem[] | undefined;
  repeatCandidate: { merchant: string } | undefined;
  onAmountChange: (v: string) => void;
  onMerchantChange: (v: string) => void;
  onCategoryChange: (v: ExpenseCategory) => void;
  onDateChange: (v: string) => void;
  onTaxChange: (v: string) => void;
  onUpdateLineItem: (idx: number, field: LineItemField, value: string | number | undefined) => void;
  onSave: () => void;
  onRepeat: () => void;
}) {
  return (
    <div className="mb-6 bg-amber-400/5 border border-amber-400/30 rounded-2xl p-4 space-y-3 animate-in fade-in" data-testid="scanned-receipt-card">
      <div className="flex items-center gap-2 text-amber-400 font-medium text-xs uppercase tracking-wider">
        <Camera className="w-4 h-4" />
        <span>{'Scanned Receipt — review & save'}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Amount'}</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
            data-testid="scanned-amount-input"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Date'}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400/50"
            data-testid="scanned-date-input"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Merchant'}</label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => onMerchantChange(e.target.value)}
          placeholder="Merchant name"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
          data-testid="scanned-merchant-input"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Category'}</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-amber-400/50 text-white outline-none"
          data-testid="scanned-category-select"
        >
          {(['food', 'transport', 'utilities', 'entertainment', 'housing', 'phone_internet', 'subscriptions', 'healthcare', 'insurance', 'debt', 'savings', 'other'] as ExpenseCategory[]).map((c) => (
            <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Tax / VAT'}</label>
        <input
          type="text"
          inputMode="decimal"
          value={tax}
          onChange={(e) => onTaxChange(e.target.value)}
          placeholder="0.00"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50"
          data-testid="scanned-tax-input"
        />
      </div>

      {lineItems && lineItems.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{'Line Items (editable)'}</label>
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1.5">
              <input
                type="text"
                value={item.description}
                onChange={(e) => onUpdateLineItem(idx, 'description', e.target.value)}
                placeholder="Item"
                className="col-span-6 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                data-testid={`scanned-line-item-desc-${idx}`}
              />
              <input
                type="text"
                inputMode="decimal"
                value={String(item.amount)}
                onChange={(e) => onUpdateLineItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="col-span-3 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                data-testid={`scanned-line-item-amount-${idx}`}
              />
              <input
                type="text"
                inputMode="numeric"
                value={item.qty != null ? String(item.qty) : ''}
                onChange={(e) => onUpdateLineItem(idx, 'qty', e.target.value ? parseInt(e.target.value) || undefined : undefined)}
                placeholder="qty"
                className="col-span-3 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
                data-testid={`scanned-line-item-qty-${idx}`}
              />
            </div>
          ))}
        </div>
      )}

      <Button
        variant="primary"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold"
        onClick={onSave}
        isLoading={loading}
        data-testid="save-scanned-receipt-btn"
      >
        <Save className="w-4 h-4 text-slate-950" />
        <span>{'Save Scanned Receipt'}</span>
      </Button>

      {repeatCandidate && (
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold"
          onClick={onRepeat}
          isLoading={loading}
          data-testid="repeat-purchase-btn"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>{`Repeat last ${repeatCandidate.merchant} purchase`}</span>
        </Button>
      )}
    </div>
  );
}
