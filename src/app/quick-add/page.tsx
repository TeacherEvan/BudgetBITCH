// app/quick-add/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus, Minus, Save, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuickAddState } from '@/hooks/use-quick-add-state';
import { useTranslations } from 'next-intl';
import { PermissionModal } from '@/components/quick-add/permission-modal';
import { IncomeCategoryPicker } from '@/components/quick-add/income-category-picker';
import { ScannedReceiptCard } from '@/components/quick-add/scanned-receipt-card';
import { SmsPasteModal } from '@/components/quick-add/sms-paste-modal';
import { Toast } from '@/components/quick-add/toast';
import { ReceiptVerifySheet } from '@/components/receipt/receipt-verify-sheet';
import { QuickAddCameraSheet } from '@/components/quick-add/quick-add-camera-sheet';

export default function QuickAddPage() {
  const router = useRouter();
  const t = useTranslations('QuickAdd');
  const s = useQuickAddState();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative Cyberpunk Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-400/5 blur-[120px] pointer-events-none" />
      <div className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${s.isExpense ? 'bg-rose-500/5' : 'bg-emerald-500/5'}`} />

      {/* Standalone Widget Container */}
      <div className="w-full max-w-sm bg-black/45 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative z-10 transition-all duration-300">

        {/* Header / Back */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-400 transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-amber-400/80">
            {t('title')}
          </h2>
          <div className="w-12 h-1" /> {/* Spacer */}
        </div>

        {/* Large Widget +/- Sign Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => s.setIsExpense(!s.isExpense)}
            aria-label={s.isExpense ? t('expense') : t('income')}
            className={`
              w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 relative group
              ${s.isExpense
                ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-400'
              }
            `}
          >
            {s.isExpense ? (
              <Minus className="w-10 h-10 stroke-[2.5]" />
            ) : (
              <Plus className="w-10 h-10 stroke-[2.5]" />
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-70">
              {s.isExpense ? t('expense') : t('income')}
            </span>
          </button>
        </div>

        {/* Amount & Description Input Box */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <input
              type="text"
              value={s.inputText}
              onChange={(e) => s.setInputText(e.target.value)}
              placeholder={t('placeholder')}
              disabled={s.loading}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-400/50 transition-colors disabled:opacity-50 pr-24"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {s.entrySource === 'import' && (
                <span className="text-[10px] bg-sky-400/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📱 SMS
                </span>
              )}
              {s.entrySource === 'receipt' && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📸 Photo
                </span>
              )}
              {s.detectedCategory !== 'other' && s.isExpense && s.entrySource === 'manual' && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {s.detectedCategory}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scanned Receipt Review (editable fields) */}
        {s.entrySource === 'receipt' && (s.scannedAmount !== '' || s.scannedMerchant !== '') ? (
          <ScannedReceiptCard
            loading={s.loading}
            amount={s.scannedAmount}
            merchant={s.scannedMerchant}
            category={s.scannedCategory}
            date={s.scannedDate}
            tax={s.scannedTax}
            lineItems={s.scannedLineItems}
            repeatCandidate={s.repeatCandidate}
            onAmountChange={s.setScannedAmount}
            onMerchantChange={s.setScannedMerchant}
            onCategoryChange={s.setScannedCategory}
            onDateChange={s.setScannedDate}
            onTaxChange={s.setScannedTax}
            onUpdateLineItem={s.updateScannedLineItem}
            onSave={s.handleSaveScannedReceipt}
            onRepeat={s.handleRepeatPurchase}
          />
        ) : null}

        {/* Category Pickers for Income */}
        {!s.isExpense && (
          <IncomeCategoryPicker value={s.incomeCategory} onChange={s.setIncomeCategory} />
        )}

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Camera Scan Button */}
          <QuickAddCameraSheet
            loading={s.loading}
            triggerCamera={s.triggerCamera}
            handleFileChange={s.handleFileChange}
            fileInputRef={s.fileInputRef}
            cameraLabel={t('camera')}
          />

          {/* Inbox SMS / Email Button */}
          <Button
            variant="secondary"
            onClick={s.triggerInboxFeature}
            isLoading={s.loading}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold"
            data-testid="inbox-sms-btn"
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>{t('inbox')}</span>
          </Button>
        </div>

        {/* Save Button */}
        <Button
          variant="primary"
          onClick={s.handleSave}
          isLoading={s.loading}
          disabled={s.isExpense && s.entrySource === 'manual' && !s.verifiedSmsData}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold shadow-lg"
          data-testid="quick-add-save-btn"
        >
          <Save className="w-4 h-4 text-slate-950" />
          <span>{t('save')}</span>
        </Button>
      </div>

      <PermissionModal
        open={s.showPermModal}
        rememberCheck={s.rememberCheck}
        onRememberChange={s.setRememberCheck}
        onDeny={s.handleDenyPermission}
        onGrant={s.handleGrantPermission}
      />

      <SmsPasteModal
        open={s.showSmsModal}
        sampleNotifications={s.sampleNotifications}
        rawSmsInput={s.rawSmsInput}
        onRawSmsChange={s.setRawSmsInput}
        loading={s.loading}
        verifiedSmsData={s.verifiedSmsData}
        onSampleSelect={(sample) => {
          s.setRawSmsInput(sample);
          s.handleScrapeSms(sample);
        }}
        onScrape={() => s.handleScrapeSms()}
        onConfirm={s.handleConfirmVerifiedSms}
        onClose={() => {
          s.setShowSmsModal(false);
          s.setVerifiedSmsData(null);
        }}
      />

      {/* Floating Toast Notification */}
      <Toast toast={s.toast} loadingLabel={t('scanning')} />

      {/* Receipt Verification Bottom Sheet (Questions only if ambiguous) */}
      <ReceiptVerifySheet
        isOpen={Boolean(s.draft && s.draft.questions && s.draft.questions.length > 0)}
        questions={s.draft?.questions ?? []}
        onAnswer={s.answerQuestion}
        onClose={() => s.confirmDraft()}
      />
    </div>
  );
}
