'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, Save, Plus, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import type { ExpenseCategory, ReceiptLineItem } from '@/lib/types/budget';
import type { ScanConfidenceMap } from '@/hooks/use-quick-add-state';
import { useHaptic } from '@/hooks/use-haptic';
import { playPaperTearSound } from '@/lib/audio/sound-fx';
import type { CurrencyCode } from '@/lib/utils/currency';
import { FALLBACK_RATES } from '@/components/dashboard/currency-options';

type LineItemField = 'description' | 'amount' | 'qty';

function ConfidencePip({ status, label }: { status: 'high' | 'review'; label: string }) {
  return (
    <span
      title={status === 'high' ? `${label}: High confidence` : `${label}: Review recommended`}
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        status === 'high'
          ? 'bg-[#40C87A] shadow-[0_0_6px_rgba(64,200,122,0.7)]'
          : 'bg-[#E8A020] shadow-[0_0_6px_rgba(232,160,32,0.7)]'
      }`}
      data-testid={`confidence-pip-${label.toLowerCase()}`}
    />
  );
}

export function ScannedReceiptCard({
  loading,
  amount,
  merchant,
  category,
  date,
  tax,
  lineItems,
  repeatCandidate,
  previewUrl,
  confidence,
  scannedCurrency,
  boardCurrency,
  onAmountChange,
  onMerchantChange,
  onCategoryChange,
  onDateChange,
  onTaxChange,
  onUpdateLineItem,
  onAddLineItem,
  onRemoveLineItem,
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
  previewUrl?: string | null;
  confidence?: ScanConfidenceMap;
  scannedCurrency?: string | null;
  boardCurrency?: CurrencyCode | null;
  onAmountChange: (v: string) => void;
  onMerchantChange: (v: string) => void;
  onCategoryChange: (v: ExpenseCategory) => void;
  onDateChange: (v: string) => void;
  onTaxChange: (v: string) => void;
  onUpdateLineItem: (idx: number, field: LineItemField, value: string | number | undefined) => void;
  onAddLineItem?: () => void;
  onRemoveLineItem?: (idx: number) => void;
  onSave: () => void;
  onRepeat: () => void;
}) {
  const [showPhoto, setShowPhoto] = useState(false);
  const haptic = useHaptic();

  const fxConversion = useMemo(() => {
    if (!scannedCurrency || !boardCurrency) return null;
    const normScanned = scannedCurrency.trim().toUpperCase() as CurrencyCode;
    const normBoard = boardCurrency.trim().toUpperCase() as CurrencyCode;
    if (normScanned === normBoard) return null;

    const parsedAmt = parseFloat(amount) || 0;
    if (parsedAmt <= 0) return null;

    const rateFrom = FALLBACK_RATES[normScanned];
    const rateTo = FALLBACK_RATES[normBoard];

    let convertedAmount: number | null = null;
    if (rateFrom && rateTo) {
      // Rates are EUR-relative
      convertedAmount = Math.round((parsedAmt / rateFrom) * rateTo * 100) / 100;
    }

    return {
      scannedCurrency: normScanned,
      boardCurrency: normBoard,
      convertedAmount,
    };
  }, [scannedCurrency, boardCurrency, amount]);

  const resolvedConfidence: ScanConfidenceMap = useMemo(() => {
    if (confidence) return confidence;
    const amtNum = parseFloat(amount);
    return {
      amount: Number.isFinite(amtNum) && amtNum > 0 ? 'high' : 'review',
      merchant: merchant.trim().length >= 2 ? 'high' : 'review',
      date: /^\d{4}-\d{2}-\d{2}$/.test(date.trim()) ? 'high' : 'review',
    };
  }, [confidence, amount, merchant, date]);

  const reconciliation = useMemo(() => {
    if (!lineItems || lineItems.length === 0) return null;
    const itemsSum =
      Math.round(
        lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0) * 100
      ) / 100;
    const totalNum = Math.round((parseFloat(amount) || 0) * 100) / 100;
    const taxNum = Math.round((parseFloat(tax) || 0) * 100) / 100;
    const matchesTotal =
      totalNum > 0 &&
      (Math.abs(itemsSum - totalNum) <= 0.05 ||
        Math.abs(itemsSum + taxNum - totalNum) <= 0.05);
    return { itemsSum, totalNum, matchesTotal };
  }, [lineItems, amount, tax]);

  return (
    <div
      className="mb-6 relative bg-[var(--surface-layer-2)] border-x border-[var(--gold-border-strong)] px-4 py-4 space-y-3 shadow-[var(--specular-top-subtle),var(--shadow-card)] bb-panel-safe"
      data-testid="scanned-receipt-card"
    >
      {/* Top Perforated Thermal Ticket Edge */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 left-0 right-0 h-2 w-full text-[var(--surface-layer-2)]"
        preserveAspectRatio="none"
        viewBox="0 0 120 6"
      >
        <polygon
          fill="currentColor"
          points="0,6 5,0 10,6 15,0 20,6 25,0 30,6 35,0 40,6 45,0 50,6 55,0 60,6 65,0 70,6 75,0 80,6 85,0 90,6 95,0 100,6 105,0 110,6 115,0 120,6"
        />
      </svg>

      {/* Slip Header + Optional Photo Preview Toggle */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-[var(--gold-border-soft)]">
        <div className="flex items-center gap-2 text-[var(--gold-bright)] font-medium text-xs uppercase tracking-wider">
          <Camera className="w-4 h-4 shrink-0" />
          <span>{'Scanned Receipt — review & save'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Multi-Currency Telemetry & Currency Badge */}
          {fxConversion && (
            <div
              className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-layer-3)] border border-[var(--gold-border-soft)] px-2 py-0.5 text-[10px] font-mono tabular-nums text-[var(--gold-bright)]"
              data-testid="scanned-receipt-currency-fx-badge"
              title={`Original: ${fxConversion.scannedCurrency} ${amount}${
                fxConversion.convertedAmount != null
                  ? ` ≈ ${fxConversion.boardCurrency} ${fxConversion.convertedAmount.toFixed(2)}`
                  : ''
              }`}
            >
              <span className="font-bold">{fxConversion.scannedCurrency}</span>
              <ArrowRightLeft className="w-2.5 h-2.5 text-[var(--text-muted)]" />
              <span className="text-[var(--text-1)]">
                {fxConversion.convertedAmount != null
                  ? `${fxConversion.boardCurrency} ${fxConversion.convertedAmount.toFixed(2)}`
                  : fxConversion.boardCurrency}
              </span>
            </div>
          )}

          {previewUrl && (
            <button
              type="button"
              onClick={() => setShowPhoto((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] px-2 py-1 text-[10px] font-semibold text-[var(--text-2)] hover:text-[var(--gold-bright)] transition-colors cursor-pointer"
              data-testid="toggle-receipt-photo-btn"
            >
              {showPhoto ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPhoto ? 'Hide photo' : 'Photo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Captured Photo Drawer */}
      {previewUrl && showPhoto && (
        <div
          className="overflow-hidden rounded-xl border border-[var(--border-neutral)] bg-[var(--surface-canvas)] max-h-44 flex items-center justify-center"
          data-testid="receipt-photo-drawer"
        >
          <img
            src={previewUrl}
            alt="Captured receipt preview"
            className="max-h-44 w-full object-contain"
          />
        </div>
      )}

      {/* Amount & Date Row with Confidence Pips */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            <ConfidencePip status={resolvedConfidence.amount} label="Amount" />
            <span>{'Amount'}</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full min-h-[44px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-xl px-3 py-2 text-[var(--text-1)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums shadow-[var(--specular-top-subtle)]"
            data-testid="scanned-amount-input"
          />
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            <ConfidencePip status={resolvedConfidence.date} label="Date" />
            <span>{'Date'}</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full min-h-[44px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-xl px-3 py-2 text-[var(--text-1)] text-sm focus:outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums shadow-[var(--specular-top-subtle)]"
            data-testid="scanned-date-input"
          />
        </div>
      </div>

      {/* Merchant Input with Confidence Pip */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
          <ConfidencePip status={resolvedConfidence.merchant} label="Merchant" />
          <span>{'Merchant'}</span>
        </label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => onMerchantChange(e.target.value)}
          placeholder="Merchant name"
          className="w-full min-h-[44px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-xl px-3 py-2 text-[var(--text-1)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--gold-bright)] shadow-[var(--specular-top-subtle)]"
          data-testid="scanned-merchant-input"
        />
      </div>

      {/* Category & Tax Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            {'Category'}
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as ExpenseCategory)}
            className="w-full min-h-[44px] px-3 py-2 bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-xl text-sm focus:outline-none focus:border-[var(--gold-bright)] text-[var(--text-1)] outline-none shadow-[var(--specular-top-subtle)]"
            data-testid="scanned-category-select"
          >
            {(
              [
                'food',
                'transport',
                'utilities',
                'entertainment',
                'housing',
                'phone_internet',
                'subscriptions',
                'healthcare',
                'insurance',
                'debt',
                'savings',
                'other',
              ] as ExpenseCategory[]
            ).map((c) => (
              <option key={c} value={c} className="bg-[#110D01] text-[var(--text-1)]">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            {'Tax / VAT'}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={tax}
            onChange={(e) => onTaxChange(e.target.value)}
            placeholder="0.00"
            className="w-full min-h-[44px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-xl px-3 py-2 text-[var(--text-1)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--gold-bright)] font-mono tabular-nums shadow-[var(--specular-top-subtle)]"
            data-testid="scanned-tax-input"
          />
        </div>
      </div>

      {/* Thermal Perforation Divider before Line Items */}
      {lineItems && lineItems.length > 0 && (
        <div className="pt-2 border-t border-dashed border-[var(--gold-border-soft)] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              {'Line Items (editable)'}
            </label>
            {reconciliation && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono tabular-nums font-semibold ${
                  reconciliation.matchesTotal
                    ? 'bg-emerald-500/15 text-[#40C87A] border border-emerald-500/30'
                    : 'bg-amber-500/15 text-[#E8A020] border border-amber-500/30'
                }`}
                data-testid="line-items-reconciliation-badge"
              >
                {reconciliation.matchesTotal ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Reconciled ({reconciliation.itemsSum.toFixed(2)})</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>
                      Items {reconciliation.itemsSum.toFixed(2)} / {reconciliation.totalNum.toFixed(2)}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {lineItems.map((item, idx) => {
                const itemKey = `item-${idx}-${item.description}-${item.amount}`;
                return (
                  <motion.div
                    key={itemKey}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      scale: 0.95,
                      marginBottom: 0,
                      transition: { duration: 0.2 },
                    }}
                    className="relative overflow-hidden rounded-xl"
                  >
                    {/* Background Ruby Trash Container revealed on Swipe-Left */}
                    {onRemoveLineItem && (
                      <div
                        className="absolute inset-0 flex items-center justify-end pr-4 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300"
                        aria-hidden="true"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400 animate-pulse" />
                      </div>
                    )}

                    {/* Foreground Interactive Row with Drag Gestures */}
                    <motion.div
                      drag={onRemoveLineItem ? 'x' : false}
                      dragConstraints={{ left: -100, right: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(_e, info) => {
                        if (!onRemoveLineItem) return;
                        if (info.offset.x <= -70) {
                          haptic.trigger('heavy');
                          playPaperTearSound();
                          onRemoveLineItem(idx);
                        }
                      }}
                      className="grid grid-cols-12 gap-1.5 items-center minmax(0, 1fr) bg-[var(--surface-layer-2)] relative z-10 p-0.5 rounded-xl transition-colors"
                    >
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => onUpdateLineItem(idx, 'description', e.target.value)}
                        placeholder="Item"
                        className={`${
                          onRemoveLineItem ? 'col-span-5' : 'col-span-6'
                        } min-h-[36px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-1)]`}
                        data-testid={`scanned-line-item-desc-${idx}`}
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={String(item.amount)}
                        onChange={(e) =>
                          onUpdateLineItem(idx, 'amount', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="col-span-3 min-h-[36px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-1)] font-mono tabular-nums"
                        data-testid={`scanned-line-item-amount-${idx}`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.qty != null ? String(item.qty) : ''}
                        onChange={(e) =>
                          onUpdateLineItem(
                            idx,
                            'qty',
                            e.target.value ? parseInt(e.target.value) || undefined : undefined
                          )
                        }
                        placeholder="qty"
                        className="col-span-3 min-h-[36px] bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-1)] font-mono tabular-nums"
                        data-testid={`scanned-line-item-qty-${idx}`}
                      />
                      {onRemoveLineItem && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.trigger('heavy');
                            playPaperTearSound();
                            onRemoveLineItem(idx);
                          }}
                          aria-label={`Remove line item ${idx + 1}`}
                          className="col-span-1 min-h-[36px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-rose-500/10 transition-colors cursor-pointer"
                          data-testid={`remove-line-item-btn-${idx}`}
                          data-testitem-delete-btn={`receipt-item-delete-btn-${idx}`}
                        >
                          <span
                            className="sr-only"
                            data-testid={`receipt-item-delete-btn-${idx}`}
                          >
                            Delete
                          </span>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {onAddLineItem && (
            <button
              type="button"
              onClick={onAddLineItem}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--gold-bright)] hover:underline pt-1 cursor-pointer"
              data-testid="add-line-item-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add item</span>
            </button>
          )}
        </div>
      )}

      <Button
        variant="primary"
        className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-2xl text-xs font-bold"
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
          className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded-2xl text-xs font-semibold"
          onClick={onRepeat}
          isLoading={loading}
          data-testid="repeat-purchase-btn"
        >
          <Plus className="w-4 h-4 text-[var(--gold-bright)]" />
          <span>{`Repeat last ${repeatCandidate.merchant} purchase`}</span>
        </Button>
      )}

      {/* Bottom Perforated Thermal Ticket Edge */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 right-0 h-2 w-full text-[var(--surface-layer-2)]"
        preserveAspectRatio="none"
        viewBox="0 0 120 6"
      >
        <polygon
          fill="currentColor"
          points="0,0 5,6 10,0 15,6 20,0 25,6 30,0 35,6 40,0 45,6 50,0 55,6 60,0 65,6 70,0 75,6 80,0 85,6 90,0 95,6 100,0 105,6 110,0 115,6 120,0"
        />
      </svg>
    </div>
  );
}
