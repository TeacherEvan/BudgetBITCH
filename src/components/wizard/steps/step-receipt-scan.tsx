// components/wizard/steps/step-receipt-scan.tsx
'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReceiptScan } from '@/hooks/use-receipt-scan';
import { ReceiptVerifySheet } from '@/components/receipt/receipt-verify-sheet';

interface StepReceiptScanProps {
  locale: string;
  value?: boolean;
  onChange: (key: 'receiptScanned', value: boolean) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepReceiptScan({
  locale,
  onChange,
  error,
  disabled = false,
}: StepReceiptScanProps) {
  const isThai = locale === 'th';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isScanning, progress, draft, scanImage, answerQuestion, confirmDraft } = useReceiptScan();
  const [scanError, setScanError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        await scanImage(img, isThai ? 'TH' : 'ZA');
        onChange('receiptScanned', true);
      } catch (err) {
        console.error('Receipt scan error:', err);
        setScanError(
          isThai
            ? 'ไม่สามารถอ่านใบเสร็จได้ กรุณาลองใหม่อีกครั้งหรือกดข้าม'
            : 'Could not parse receipt. Please try another image or skip.'
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  const handleSkip = () => {
    onChange('receiptScanned', false);
  };

  const scanResult = draft
    ? {
        amount: Number(draft.fields.total?.value ?? 0),
        merchant: String(draft.fields.merchant?.value ?? 'Unknown'),
        category: String(draft.fields.category?.value ?? 'other'),
        date: draft.fields.date?.value ? String(draft.fields.date.value) : null,
      }
    : null;

  return (
    <div className="space-y-6 text-center animate-in fade-in duration-300">
      <div>
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-400/20 flex items-center justify-center mb-3">
          <Camera className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">
          {isThai ? 'สแกนใบเสร็จแรกของคุณ' : 'Scan Your First Receipt'}
        </h2>
        <p className="mt-1 text-sm text-white/70">
          {isThai
            ? 'ถ่ายรูปหรืออัปโหลดใบเสร็จ ระบบจะสกัดข้อมูลรายจ่ายให้อัตโนมัติ'
            : 'Snap a photo or upload a receipt to extract expense details automatically.'}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
        data-testid="receipt-file-input"
      />

      {!scanResult ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 hover:border-amber-400/50 transition-colors">
            {isScanning ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-sm font-medium text-white">
                  {isThai ? `กำลังวิเคราะห์ใบเสร็จ (${Math.round(progress * 100)}%)...` : `Analyzing receipt (${Math.round(progress * 100)}%)...`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full gap-2 justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isScanning}
                >
                  <Upload className="w-5 h-5" />
                  {isThai ? 'ถ่ายรูป / อัปโหลดใบเสร็จ' : 'Take Photo / Upload Receipt'}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSkip}
              disabled={disabled || isScanning}
              className="text-white/60 hover:text-white gap-2"
              data-testid="skip-receipt-btn"
            >
              <SkipForward className="w-4 h-4" />
              {isThai ? 'ข้ามขั้นตอน (ป้อนรายจ่ายด้วยตนเอง)' : 'Skip for now (enter manually later)'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-amber-400/30 rounded-2xl p-5 space-y-3 text-left">
          <div className="flex items-center gap-2 text-amber-400 font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{isThai ? 'สแกนสำเร็จ!' : 'Receipt Scanned Successfully!'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-white/80 pt-2 border-t border-white/10">
            <div>
              <span className="text-xs text-white/40 block">{isThai ? 'ร้านค้า' : 'Merchant'}</span>
              <span className="font-semibold">{scanResult.merchant}</span>
            </div>
            <div>
              <span className="text-xs text-white/40 block">{isThai ? 'จำนวนเงิน' : 'Amount'}</span>
              <span className="font-semibold text-amber-400">
                {scanResult.amount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-white/40 block">{isThai ? 'หมวดหมู่' : 'Category'}</span>
              <span className="capitalize">{scanResult.category}</span>
            </div>
            <div>
              <span className="text-xs text-white/40 block">{isThai ? 'วันที่' : 'Date'}</span>
              <span>{scanResult.date || 'Today'}</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            {isThai ? 'สแกนอีกใบ' : 'Scan Another Receipt'}
          </Button>
        </div>
      )}

      {(scanError || error) && (
        <p className="text-xs text-rose-400" role="alert">
          {scanError || error}
        </p>
      )}

      <ReceiptVerifySheet
        isOpen={Boolean(draft && draft.questions && draft.questions.length > 0)}
        questions={draft?.questions ?? []}
        onAnswer={answerQuestion}
        onClose={() => confirmDraft()}
      />
    </div>
  );
}
