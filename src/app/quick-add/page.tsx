// app/quick-add/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Plus, Minus, Save, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuickAddState } from '@/hooks/use-quick-add-state';
import { useHaptic } from '@/hooks/use-haptic';
import { useTranslations } from 'next-intl';
import { PermissionModal } from '@/components/quick-add/permission-modal';
import { IncomeCategoryPicker } from '@/components/quick-add/income-category-picker';
import { ScannedReceiptCard } from '@/components/quick-add/scanned-receipt-card';
import { SmsPasteModal } from '@/components/quick-add/sms-paste-modal';
import { Toast } from '@/components/quick-add/toast';
import { ReceiptVerifySheet } from '@/components/receipt/receipt-verify-sheet';
import { QuickAddCameraSheet } from '@/components/quick-add/quick-add-camera-sheet';
import { RequireAuth } from '@/components/auth/require-auth';
import { useResolvedCurrency } from '@/hooks/use-currency';

export default function QuickAddPage() {
  const router = useRouter();
  const t = useTranslations('quickAdd');
  const s = useQuickAddState();
  const haptic = useHaptic();
  const resolvedBoardCurrency = useResolvedCurrency();
  const boardCurrency =
    resolvedBoardCurrency ||
    s.profile?.answers?.currency ||
    (s.profile?.locale?.includes('TH') ? 'THB' : s.profile?.locale?.includes('ZA') ? 'ZAR' : 'USD');

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-1)] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative Subtle Ambient Lighting (Budgeted: 0 blurs) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(232,176,32,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full pointer-events-none transition-all duration-500 ${s.isExpense ? 'bg-[radial-gradient(circle,rgba(244,63,94,0.05)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)]'}`} />

      {/* Standalone Widget Container */}
      <div className="w-full max-w-sm bg-[var(--surface-layer-1)]/90 backdrop-blur-md border border-[var(--border-soft)] rounded-3xl p-6 shadow-[var(--specular-top-elevated),var(--shadow-card)] relative z-10 bb-panel-safe transition-all duration-300">

        {/* Header / Back */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--gold-bright)] transition-colors p-2 min-h-[44px] min-w-[44px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--gold-bright)]">
            {t('title')}
          </h2>
          <div className="w-11 h-1" /> {/* Spacer */}
        </div>

        {/* Large Widget +/- Sign Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => {
              haptic.trigger('selection');
              s.setIsExpense(!s.isExpense);
            }}
            aria-label={s.isExpense ? t('expense') : t('income')}
            className={`
              w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-transform duration-150 active:duration-[25ms] active:translate-y-[1px] active:scale-[0.985] cursor-pointer relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              ${s.isExpense
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_20px_rgba(244,63,94,0.2)] hover:border-rose-400 focus-visible:ring-rose-500'
                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 focus-visible:ring-emerald-500'
              }
            `}
          >
            {s.isExpense ? (
              <Minus className="w-10 h-10 stroke-[2.5]" />
            ) : (
              <Plus className="w-10 h-10 stroke-[2.5]" />
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80 tabular-nums">
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
              className="w-full bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-2xl px-5 py-4 text-[var(--text-1)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--gold-bright)] transition-colors disabled:opacity-50 pr-24 shadow-[var(--specular-top-subtle)]"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {s.entrySource === 'import' && (
                <span className="text-[10px] bg-sky-400/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📱 SMS
                </span>
              )}
              {s.entrySource === 'receipt' && (
                <span className="text-[10px] bg-[var(--gold-bright)]/20 text-[var(--gold-bright)] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  📸 Photo
                </span>
              )}
              {s.detectedCategory !== 'other' && s.isExpense && s.entrySource === 'manual' && (
                <span className="text-[10px] bg-[var(--gold-bright)]/20 text-[var(--gold-bright)] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {s.detectedCategory}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scanned Receipt Review (editable fields with AnimatePresence spring unfurl) */}
        <AnimatePresence mode="wait">
          {s.entrySource === 'receipt' ? (
            <motion.div
              key="scanned-receipt-slip"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
            >
              <ScannedReceiptCard
                loading={s.loading}
                amount={s.scannedAmount}
                merchant={s.scannedMerchant}
                category={s.scannedCategory}
                date={s.scannedDate}
                tax={s.scannedTax}
                lineItems={s.scannedLineItems}
                repeatCandidate={s.repeatCandidate}
                previewUrl={s.scanPreviewUrl}
                confidence={s.scanConfidence}
                scannedCurrency={s.scannedCurrency}
                boardCurrency={boardCurrency}
                onAmountChange={s.setScannedAmount}
                onMerchantChange={s.setScannedMerchant}
                onCategoryChange={s.setScannedCategory}
                onDateChange={s.setScannedDate}
                onTaxChange={s.setScannedTax}
                onUpdateLineItem={s.updateScannedLineItem}
                onAddLineItem={s.addScannedLineItem}
                onRemoveLineItem={s.removeScannedLineItem}
                onSave={s.handleSaveScannedReceipt}
                onRepeat={s.handleRepeatPurchase}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

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
            handleCapturedFrame={s.handleCapturedFrame}
            fileInputRef={s.fileInputRef}
            cameraLabel={t('camera')}
            scanStage={s.scanStage}
            scanPreviewUrl={s.scanPreviewUrl}
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
    </RequireAuth>
  );
}
