// components/dashboard/panels/import-csv-modal.tsx
'use client';

import { useRef, useState } from 'react';
import { Upload, AlertTriangle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { parseImport, type ParsedExpense } from '@/modules/budgeting/csv-import';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the parsed (valid) rows once the user confirms. */
  onImport: (rows: ParsedExpense[]) => void;
  locale?: 'th' | 'en';
}

const COPY = {
  en: {
    title: 'Import Expenses (CSV)',
    desc: 'Upload a bank/statement export. Columns detected automatically (date, merchant, amount, category, note).',
    choose: 'Choose CSV file',
    orPaste: 'Or paste CSV text',
    parse: 'Preview & Import',
    previewTitle: 'Preview',
    valid: 'valid rows',
    errors: 'rows skipped',
    confirm: 'Import',
    cancel: 'Cancel',
    empty: 'No file loaded yet.',
    errorHeader: 'Some rows were skipped:',
    sample: 'Sample: date,merchant,amount,category,note',
    close: 'Close',
  },
  th: {
    title: 'นำเข้ารายจ่าย (CSV)',
    desc: 'อัปโหลดรายการจากธนาคาร ตรวจหาคอลัมน์อัตโนมัติ (วันที่, รายการ, จำนวนเงิน, หมวดหมู่, หมายเหตุ)',
    choose: 'เลือกไฟล์ CSV',
    orPaste: 'หรือวางข้อความ CSV',
    parse: 'ดูตัวอย่างและนำเข้า',
    previewTitle: 'ตัวอย่าง',
    valid: 'แถวที่ใช้ได้',
    errors: 'แถวที่ข้าม',
    confirm: 'นำเข้า',
    cancel: 'ยกเลิก',
    empty: 'ยังไม่มีไฟล์',
    errorHeader: 'บางแถวถูกข้าม:',
    sample: 'ตัวอย่าง: date,merchant,amount,category,note',
    close: 'ปิด',
  },
};

export function ImportCsvModal({ isOpen, onClose, onImport, locale = 'en' }: ImportCsvModalProps) {
  const t = COPY[locale];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof parseImport> | null>(null);

  const reset = () => {
    setText('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setResult(parseImport(content));
  };

  const handlePreview = () => {
    setResult(parseImport(text));
  };

  const handleConfirm = () => {
    if (!result || result.valid.length === 0) return;
    onImport(result.valid);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t.title}
      description={t.desc}
      size="lg"
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4 transition-colors hover:bg-white/5">
          <Upload className="h-5 w-5 text-[var(--gold-bright)]" />
          <span className="text-sm text-white">{t.choose}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
            data-testid="csv-file-input"
          />
        </label>

        <div>
          <p className="mb-1 text-xs text-white/60">{t.orPaste}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={t.sample}
            className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white outline-none focus:border-[var(--gold-border-soft)]"
            data-testid="csv-text-area"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handlePreview}
          disabled={text.trim() === ''}
          data-testid="csv-preview-btn"
        >
          <FileSpreadsheet className="mr-1 h-4 w-4" /> {t.parse}
        </Button>

        {result && text.trim() !== '' && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {result.valid.length} {t.valid}
              </span>
              {result.errors.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> {result.errors.length} {t.errors}
                </span>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-amber-400/10 p-2 text-xs text-amber-200">
                <p className="mb-1 font-medium">{t.errorHeader}</p>
                <ul className="space-y-0.5">
                  {result.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>
                      {locale === 'th' ? 'บรรทัด' : 'Line'} {e.line}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.valid.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                className="w-full"
                data-testid="csv-confirm-btn"
              >
                {t.confirm} ({result.valid.length})
              </Button>
            )}
          </div>
        )}

        {!result && text.trim() === '' && (
          <p className="text-center text-xs text-white/40">{t.empty}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {t.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
