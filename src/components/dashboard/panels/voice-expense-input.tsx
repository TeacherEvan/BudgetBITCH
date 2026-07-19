// components/dashboard/panels/voice-expense-input.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, X, Check, Sparkles } from 'lucide-react';
import { useVoice } from '@/hooks/use-voice';
import { mapThaiToCategory } from '@/lib/utils/thai-category-mapper';
import { useCurrency } from '@/hooks/use-currency';
import { Button } from '@/components/ui/button';
import type { ExpenseCategory } from '@/lib/types/budget';

interface ParsedExpense {
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  note?: string;
}

interface VoiceExpenseInputProps {
  locale: 'th' | 'en';
  onAddExpense: (expense: ParsedExpense) => void;
  isOpen: boolean;
  onClose: () => void;
}

const THAI_NUMBER_WORDS: Record<string, number> = {
  'ศูนย์': 0, 'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5,
  'หก': 6, 'เจ็ด': 7, 'แปด': 8, 'เก้า': 9, 'สิบ': 10,
  'ยี่สิบ': 20, 'สามสิบ': 30, 'สี่สิบ': 40, 'ห้าสิบ': 50,
  'หกสิบ': 60, 'เจ็ดสิบ': 70, 'แปดสิบ': 80, 'เก้าสิบ': 90,
  'ร้อย': 100, 'พัน': 1000, 'หมื่น': 10000, 'แสน': 100000, 'ล้าน': 1000000,
};

export function parseThaiNumber(text: string): number | null {
  // Try direct number first
  const directMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
  if (directMatch) {
    return parseFloat(directMatch[1].replace(/,/g, ''));
  }

  // Thai number words are not space-separated in real input
  // (e.g. "สามร้อยบาท"), so scan the string for known tokens in order
  // and accumulate by place value.
  const tokens = Object.keys(THAI_NUMBER_WORDS).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(tokens.map(escapeRegExp).join('|'), 'g');

  let total = 0;
  let current = 0;
  for (const match of text.matchAll(pattern)) {
    const val = THAI_NUMBER_WORDS[match[0]];
    if (val >= 10) {
      // Unit word (สิบ/ร้อย/พัน/...): multiply the accumulated lower digit by it.
      total += (current || 1) * val;
      current = 0;
    } else {
      current = val;
    }
  }
  total += current;

  return total > 0 ? total : null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseExpenseFromText(text: string): ParsedExpense | null {
  const lowerText = text.toLowerCase().trim();
  
  // Extract amount - look for number patterns
  let amount = 0;
  const amountPatterns = [
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|baht|thb|฿)/i,
    /(?:ใช้|จ่าย|เสีย|จ่ายเงิน|pay|paid|spent)\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|baht)/i,
  ];
  
  for (const pattern of amountPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }
  
  // If no amount found with patterns, try Thai number words
  if (amount === 0) {
    const thaiAmount = parseThaiNumber(text);
    if (thaiAmount) amount = thaiAmount;
  }
  
  // If still no amount, look for any number
  if (amount === 0) {
    const anyNumber = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
    if (anyNumber) {
      amount = parseFloat(anyNumber[1].replace(/,/g, ''));
    }
  }
  
  if (amount === 0) return null;
  
  // Extract category using mapper
  const category = mapThaiToCategory(text);
  
  // Extract merchant - try to find known merchants or use first noun phrase
  let merchant = '';
  const merchants = ['โลตัส', 'ลอตัส', 'lotus', 'บิ๊กซี', 'bigc', 'แมคโคร', 'makro', 'แกร็บ', 'แกรบ', 'กรับ', 'grab', 'โบลท์', 'bolt', 'เน็ตฟลิกซ์', 'netflix', 'สปอติฟาย', 'สปอตติฟาย', 'สปอตตี้', 'spotify', 'ยูทูบ', 'youtube', 'ดิสนีย์', 'disney', 'ทรูไอดี', 'trueid', 'สตาร์บัคส์', 'starbucks', 'อเมซอน', 'amazon', 'ลาซาด้า', 'lazada', 'ช็อปปี้', 'shopee'];
  
  for (const m of merchants) {
    if (lowerText.includes(m)) {
      merchant = m.charAt(0).toUpperCase() + m.slice(1);
      break;
    }
  }
  
  // If no known merchant, try to extract from text (simplified)
  if (!merchant) {
    // Remove amount and category words, take remaining as merchant
    let remaining = lowerText;
    remaining = remaining.replace(/\d+(?:,\d{3})*(?:\.\d+)?/g, '');
    remaining = remaining.replace(/บาท|baht|thb|฿/gi, '');
    remaining = remaining.replace(/ใช้|จ่าย|เสีย|จ่ายเงิน|pay|paid|spent|for|ที่|ใน|at/gi, '');
    remaining = remaining.trim();
    
    // Take first few words as merchant
    const words = remaining.split(/\s+/).filter(w => w.length > 1);
    if (words.length > 0) {
      merchant = words.slice(0, 3).join(' ').charAt(0).toUpperCase() + words.slice(0, 3).join(' ').slice(1);
    }
  }
  
  // Generate note from original text
  const note = `Voice: "${text}"`;
  
  return {
    merchant: merchant || 'Voice Entry',
    amount,
    category,
    note,
  };
}

export function VoiceExpenseInput({ locale, onAddExpense, isOpen, onClose }: VoiceExpenseInputProps) {
  const formatCurrency = useCurrency();

  const { 
    speak, 
    startListening, 
    stopListening, 
    isListening, 
    transcript, 
    isSupported,
    error,
    clearTranscript 
  } = useVoice(locale === 'th' ? 'th-TH' : 'en-US');
  
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clear transcript and reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      clearTranscript();
      /* eslint-disable react-hooks/set-state-in-effect */
      setParsedExpense(null);
      setShowConfirmation(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen, clearTranscript]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && isOpen && !isListening) {
      const parsed = parseExpenseFromText(transcript);
      if (parsed) {
        setTimeout(() => {
          setParsedExpense(parsed);
          setShowConfirmation(true);
        }, 0);
        
        // Speak confirmation
        const confirmText = locale === 'th' 
          ? `พบ ${parsed.merchant} ${formatCurrency(parsed.amount, locale)} หมวด ${parsed.category}`
          : `Found ${parsed.merchant} ${formatCurrency(parsed.amount, locale)} category ${parsed.category}`;
        speak(confirmText);
      }
    }
  // formatCurrency is an unstable closure from useCurrency(); adding it to the
  // deps would re-run this effect every render. It only formats the spoken
  // confirmation string, which is correct to recompute against current `locale`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isOpen, isListening, speak, locale]);

  const handleConfirm = useCallback(async () => {
    if (parsedExpense) {
      setIsProcessing(true);
      try {
        await onAddExpense(parsedExpense);
        setShowConfirmation(false);
        setParsedExpense(null);
        onClose();
        speak(locale === 'th' ? 'บันทึกแล้ว' : 'Saved');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [parsedExpense, onAddExpense, onClose, speak, locale]);

  const handleRetry = useCallback(() => {
    setShowConfirmation(false);
    setParsedExpense(null);
    startListening();
  }, [startListening]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setParsedExpense(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancel} />
      
      <div className="relative w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="text-amber-400" />
            {locale === 'th' ? 'บันทึกค่าใช้จ่ายด้วยเสียง' : 'Voice Expense Entry'}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Voice State */}
        {!showConfirmation && !isProcessing && (
          <div className="space-y-4">
            {!isSupported ? (
              <div className="text-center py-8 text-white/50">
                <p>{locale === 'th' 
                  ? 'เบราว์เซอร์ไม่รองรับการบันทึกเสียง' 
                  : 'Voice recognition not supported in this browser'}</p>
                <Button variant="secondary" className="mt-4" onClick={handleCancel}>
                  {locale === 'th' ? 'ปิด' : 'Close'}
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <Button
                    variant={isListening ? 'danger' : 'primary'}
                    size="lg"
                    className="w-24 h-24 rounded-full"
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                  >
                    {isListening ? (
                      <Mic className="w-10 h-10 text-white animate-pulse" />
                    ) : (
                      <Mic className="w-10 h-10 text-slate-950" />
                    )}
                  </Button>
                  <p className="mt-4 text-white/70 text-center">
                    {isListening 
                      ? (locale === 'th' ? 'กำลังฟัง... พูดเลย' : 'Listening... Speak now')
                      : (locale === 'th' ? 'กดไอคอนไมค์ แล้วพูด เช่น "จ่ายแกร็บ 150"' : 'Tap mic, then speak e.g. "Paid Grab 150"')}
                    </p>
                  {error && (
                    <p className="mt-2 text-center text-rose-400 text-sm">
                      {locale === 'th' ? 'ข้อผิดพลาด: ' : 'Error: '} {error}
                    </p>
                  )}
                </div>
                <div className="text-center py-4 border-t border-white/10">
                  <p className="text-xs text-white/40">
                    {locale === 'th' 
                      ? 'ตัวอย่าง: "ซื้อข้าว 80 บาท", "จ่ายแกร็บ 150", "น้ำมัน 500 บาท"'
                      : 'Examples: "Lunch 80 baht", "Grab 150", "Fuel 500 baht"'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Confirmation */}
        {showConfirmation && parsedExpense && !isProcessing && (
          <div className="space-y-4">
            <div className="text-center">
              <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-white/70">
                {locale === 'th' ? 'เข้าใจแล้ว ใช่ไหม?' : 'Got it. Is this correct?'}
              </p>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">{locale === 'th' ? 'รายการ' : 'Merchant'}</span>
                <span className="font-medium text-white">{parsedExpense.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{locale === 'th' ? 'จำนวนเงิน' : 'Amount'}</span>
                <span className="font-bold text-amber-400 text-lg">{formatCurrency(parsedExpense.amount, locale)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">{locale === 'th' ? 'หมวดหมู่' : 'Category'}</span>
                <span className="font-medium text-white capitalize">{parsedExpense.category}</span>
              </div>
              {parsedExpense.note && (
                <div className="flex justify-between text-xs text-white/50">
                  <span>Note</span>
                  <span>{parsedExpense.note}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleRetry}>
                <Mic className="w-4 h-4 mr-1" />
                {locale === 'th' ? 'พูดใหม่' : 'Retry'}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleCancel}>
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-1" />
                {locale === 'th' ? 'บันทึก' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent mx-auto mb-4" />
            <p className="text-white/70">{locale === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</p>
          </div>
        )}
      </div>
    </div>
  );
}