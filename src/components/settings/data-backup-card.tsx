'use client';

import { useState } from 'react';
import { Download, Upload, Shield, Trash2, AlertCircle, KeyRound, Eye, EyeOff, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { USER_DATA_STORES, clearAllUserData, getDB, createLocalCheckpoint } from '@/lib/db/local-db';
import { createBackupPayload, parseAndValidateBackup, type BackupData } from '@/lib/db/backup-schema';
import { encryptBackup, decryptBackup } from '@/lib/db/crypto-backup';
import { formatMoney } from '@/lib/utils/currency';
import type { WizardProfile, CriticalExpenseCommitment } from '@/lib/types/budget';
import type { CurrencyOverride } from '@/hooks/use-currency-override';
import { format } from 'date-fns';
import { ChangePasswordModal } from '@/components/settings/change-password-modal';
import { StorageDiagnosticsModal } from '@/components/settings/storage-diagnostics-modal';

type Status = 'idle' | 'success' | 'error';

const RESET_PRESERVE = [
  'budgetbitch:theme',
  'voiceSettings',
  'bb-locale',
  'budgetbitch:offlineQueue',
  'budgetbitch:boardQueue',
];

interface DataBackupCardProps {
  locale: 'th' | 'en';
  lastSync: string | null;
  setLastSync: (time: string) => void;
  clearProfile?: () => void;
  commitment: CriticalExpenseCommitment | null;
  profile: WizardProfile | null;
  override: CurrencyOverride;
}

export function DataBackupCard({
  locale,
  lastSync,
  setLastSync,
  clearProfile,
  commitment,
  profile,
  override,
}: DataBackupCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<Status>('idle');
  const [importStatus, setImportStatus] = useState<Status>('idle');
  const [syncStatus, setSyncStatus] = useState<Status>('idle');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  // Storage Diagnostics and Encryption states
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [encryptExport, setEncryptExport] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPasswordInput, setShowImportPasswordInput] = useState(false);
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [pendingFileString, setPendingFileString] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState('');

  const handleResetConfirm = async () => {
    setResetOpen(false);
    await clearAllUserData();
    clearProfile?.();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && !RESET_PRESERVE.includes(key)) {
        localStorage.removeItem(key);
      }
    }
    window.location.href = '/';
  };

  const handleExportData = async () => {
    setExporting(true);
    setExportStatus('idle');
    try {
      const db = await getDB();
      const allData: Record<string, unknown> = {};

      for (const store of USER_DATA_STORES) {
        allData[store] = await db.getAll(store);
      }
      // Include settings in export too
      allData['settings'] = await db.getAll('settings');

      const payload = await createBackupPayload(allData as BackupData);

      if (encryptExport && exportPassword) {
        const rawDataStr = JSON.stringify(payload.data);
        const encrypted = await encryptBackup(rawDataStr, exportPassword);
        payload.data = encrypted.ciphertext;
        payload.cryptoSalt = encrypted.salt;
        payload.cryptoIv = encrypted.iv;
        payload.isEncrypted = true;
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budgetbitch-backup-${format(new Date(), 'yyyy-MM-dd')}${payload.isEncrypted ? '.enc' : ''}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('success');
    } catch (err: unknown) {
      console.error('Export failed:', err);
      setExportStatus('error');
    } finally {
      setExporting(false);
    }
  };

  const executeDataImport = async (data: BackupData) => {
    // 1. Create a failsafe local checkpoint before modifying anything
    await createLocalCheckpoint('Pre-Import Backup');
    const db = await getDB();
    // Note: We are going to use a single transaction for clearing and writing.
    const allStores = [...USER_DATA_STORES, 'settings'] as const;
    const tx = db.transaction(allStores, 'readwrite');
    // Clear existing stores
    for (const store of allStores) {
      await tx.objectStore(store).clear();
    }
    // Write new data
    for (const [store, items] of Object.entries(data)) {
      const storeObj = tx.objectStore(store as (typeof allStores)[number]);
      if (store === 'wizardProfile' || store === 'settings') {
        if (items.length > 0) {
          // We expect only one item, but we take the first one.
          await storeObj.put(items[0] as never, 'current' as never);
        }
      } else {
        for (const item of items) {
          await storeObj.put(item as never);
        }
      }
    }
    await tx.done;
    setImportStatus('success');
    window.location.reload();
  };

  const handleImportData = (file: File) => {
    setImportStatus('idle');
    setImportErrorMessage('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileString = e.target?.result as string;
      try {
        const rawPayload = JSON.parse(fileString);
        
        // Check if this is an encrypted backup payload
        if (rawPayload && rawPayload.isEncrypted) {
          setPendingFileString(fileString);
          setShowImportPasswordInput(true);
          return;
        }

        // Standard validation
        const { data } = await parseAndValidateBackup(fileString);
        await executeDataImport(data);
      } catch (err: unknown) {
        console.error('Import failed:', err);
        setImportErrorMessage(err instanceof Error ? err.message : 'Invalid file format');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handleDecryptAndImport = async () => {
    if (!pendingFileString || !importPassword) return;
    setImportStatus('idle');
    setImportErrorMessage('');
    try {
      const rawPayload = JSON.parse(pendingFileString);
      const decryptedString = await decryptBackup(
        rawPayload.data,
        importPassword,
        rawPayload.cryptoSalt,
        rawPayload.cryptoIv
      );

      // Reconstruct payload as unencrypted and validate
      const unencryptedPayload = {
        ...rawPayload,
        isEncrypted: false,
        data: JSON.parse(decryptedString)
      };

      const { data } = await parseAndValidateBackup(JSON.stringify(unencryptedPayload));
      setShowImportPasswordInput(false);
      setPendingFileString(null);
      setImportPassword('');
      await executeDataImport(data);
    } catch (err: unknown) {
      console.error('Decryption/Import failed:', err);
      setImportErrorMessage(locale === 'th' ? 'รหัสผ่านไม่ถูกต้อง หรือไฟล์เสียหาย' : 'Incorrect password or corrupted file');
      setImportStatus('error');
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    try {
      await import('@/lib/convex/sync-snapshots').then(m => m.syncDailySnapshot());
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('budgetbitch:lastSync', now);
      setSyncStatus('success');
    } catch {
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const l = {
    th: {
      dataSection: 'ข้อมูล',
      privacySection: 'ความเป็นส่วนตัว',
      exportData: 'ส่งออกข้อมูล (JSON)',
      importData: 'นำเข้าข้อมูล (JSON)',
      exportDesc: 'ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON',
      importDesc: 'นำเข้าข้อมูลจากไฟล์ JSON',
      exportSuccess: 'ส่งออกสำเร็จ',
      importSuccess: 'นำเข้าข้อมูลสำเร็จ',
      importError: 'ไฟล์ไม่ถูกต้อง',
      syncNow: 'ซิงค์ตอนนี้',
      syncing: 'กำลังซิงค์...',
      syncSuccess: 'ซิงค์ข้อมูลสำเร็จ',
      syncError: 'ซิงค์ล้มเหลว',
      neverSynced: 'ยังไม่เคยซิงค์',
      syncDesc: 'ซิงค์โปรไฟล์และสแนปช็อตของคุณไปยังระบบคลาวด์ (ไม่ใช่บอร์ดคู่)',
      resetData: 'ล้างข้อมูลทั้งหมด',
      resetConfirmTitle: 'ยืนยันการล้างข้อมูล',
      resetConfirmBody: 'ลบข้อมูลทั้งหมด: โปรไฟล์, ค่าใช้จ่าย, งบประมาณ, เป้าหมาย ฯลฯ จะไม่สามารถกู้คืนได้',
      resetConfirmCancel: 'ยกเลิก',
      resetConfirmDestructive: 'ลบข้อมูลทั้งหมด',
      privacyDisclaimer: 'ข้อความยอมรับความเป็นส่วนตัว',
      privacyBody: 'เราใช้ข้อมูลตำแหน่งของคุณ เพื่อแสดงราคาน้ำมัน บิลล์ และโปรโมชั่นใกล้คุณเท่านั้น ไม่ได้เก็บหรือขายข้อมูลให้บุคคลที่สาม ไม่มีการติดตาม และไม่ใช้เพื่อการตลาดใดๆ',
      criticalExpense: 'ค่าใช้จ่ายที่ต้องลด',
      committed: 'ยอมรับแล้ว',
      notCommitted: 'ยังไม่ได้เลือก',
      password: 'รหัสผ่าน',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      passwordDesc: 'รีเซ็ตรหัสผ่านด้วยลิงก์ในหน้า sign-in หรือใช้ฟอร์มด้านล่าง',
      encryptBackup: 'เข้ารหัสไฟล์สำรองข้อมูล',
      enterPassword: 'ป้อนรหัสผ่านสำรองข้อมูล',
      diagnosticsTitle: 'ความสมบูรณ์และวิเคราะห์หน่วยความจำ',
      diagnosticsDesc: 'ตรวจสอบพื้นที่การจัดเก็บ สภาพระบบ และสแนปช็อตกู้คืนระบบ',
      diagnosticsBtn: 'การวิเคราะห์และกู้คืน',
      importPasswordTitle: 'ต้องการรหัสผ่านเพื่อนำเข้าข้อมูล',
      importPasswordDesc: 'ข้อมูลสำรองนี้ถูกเข้ารหัส กรุณาป้อนรหัสผ่านที่ตั้งค่าไว้เพื่อถอดรหัสและนำเข้าข้อมูล',
      submit: 'ตกลง',
    },
    en: {
      dataSection: 'Data',
      privacySection: 'Privacy',
      exportData: 'Export Data (JSON)',
      importData: 'Import Data (JSON)',
      exportDesc: 'Download all data as JSON file',
      importDesc: 'Import data from JSON file',
      exportSuccess: 'Export complete',
      importSuccess: 'Data imported successfully',
      importError: 'Invalid file',
      syncNow: 'Sync Now',
      syncing: 'Syncing...',
      syncSuccess: 'Sync complete',
      syncError: 'Sync failed',
      neverSynced: 'Never synced',
      syncDesc: 'Sync your profile & daily snapshot to the cloud (not the couple board)',
      resetData: 'Reset All Data',
      resetConfirmTitle: 'Confirm Reset',
      resetConfirmBody: 'Delete ALL data: profile, expenses, budgets, goals, etc. This cannot be undone.',
      resetConfirmCancel: 'Cancel',
      resetConfirmDestructive: 'Delete All Data',
      privacyDisclaimer: 'Privacy Disclaimer',
      privacyBody: 'We use your location ONLY to show local fuel prices, bills, and deals near you. We never store, sell, or share your data with third parties. No tracking. No marketing. Ever.',
      criticalExpense: 'Cut One Expense',
      committed: 'Committed',
      notCommitted: 'Not Selected',
      password: 'Password',
      changePassword: 'Change password',
      passwordDesc: 'Reset via the sign-in reset flow, or use the form below.',
      encryptBackup: 'Encrypt backup file',
      enterPassword: 'Enter backup password',
      diagnosticsTitle: 'Storage Integrity & Diagnostics',
      diagnosticsDesc: 'Inspect storage quota, health diagnostics, and recovery points.',
      diagnosticsBtn: 'Diagnostics & Recovery',
      importPasswordTitle: 'Password Required to Import',
      importPasswordDesc: 'This backup file is encrypted. Enter the backup password to decrypt and restore.',
      submit: 'Submit',
    },
  }[locale];

  return (
    <>
      {/* Data Section */}
      <section id="settings-data" className="scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.dataSection}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.exportData}</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">{l.exportDesc}</p>
              
              {/* Encryption UI */}
              <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/5 space-y-3">
                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encryptExport}
                    onChange={(e) => setEncryptExport(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/50"
                  />
                  <span>{l.encryptBackup}</span>
                </label>

                {encryptExport && (
                  <div className="relative">
                    <Input
                      type={showExportPassword ? 'text' : 'password'}
                      placeholder={l.enterPassword}
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      className="w-full text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportPassword(!showExportPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    >
                      {showExportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button variant="secondary" onClick={handleExportData} className="w-full" disabled={exporting || (encryptExport && !exportPassword)}>
                {exporting ? l.syncing : l.exportData}
              </Button>
              {exportStatus === 'success' && <p className="mt-2 text-sm text-emerald-400">{l.exportSuccess}</p>}
              {exportStatus === 'error' && <p className="mt-2 text-sm text-rose-400">{l.importError}</p>}
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.importData}</h3>
              </div>
              <p className="text-sm text-white/50 mb-4">{l.importDesc}</p>
            </div>
            <div>
              <input
                type="file"
                accept=".json"
                aria-label={l.importData}
                onChange={(e) => e.target.files?.[0] && handleImportData(e.target.files[0])}
                className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-400/20 file:text-amber-400 hover:file:bg-amber-400/30 cursor-pointer"
              />
              {importStatus === 'success' && <p className="mt-2 text-sm text-emerald-400">{l.importSuccess}</p>}
              {importStatus === 'error' && <p className="mt-2 text-sm text-rose-400">{importErrorMessage || l.importError}</p>}
            </div>
          </Card>

          {/* New Diagnostics card */}
          <Card className="p-4 sm:col-span-2 border-amber-400/30 bg-amber-400/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.diagnosticsTitle}</h3>
              </div>
              <p className="text-sm text-white/60">{l.diagnosticsDesc}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setDiagnosticsOpen(true)}
              className="w-full sm:w-auto bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/30 text-amber-400"
            >
              {l.diagnosticsBtn}
            </Button>
          </Card>

          <Card className="p-4 sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.syncNow}</h3>
              </div>
              <span className="text-xs text-white/50">
                {lastSync
                  ? format(new Date(lastSync), locale === 'th' ? 'd MMM yyyy HH:mm' : 'MMM d, yyyy HH:mm')
                  : l.neverSynced}
              </span>
            </div>
            <p className="text-sm text-white/50 mb-4">{l.syncDesc}</p>
            <Button variant="primary" onClick={handleSyncNow} disabled={syncing} className="w-full">
              {syncing ? l.syncing : l.syncNow}
            </Button>
            {syncStatus === 'success' && <p className="mt-2 text-sm text-emerald-400">{l.syncSuccess}</p>}
            {syncStatus === 'error' && <p className="mt-2 text-sm text-rose-400">{l.syncError}</p>}
          </Card>

          <Card className="p-4 sm:col-span-2 border-rose-400/30 bg-rose-400/5">
            <div className="flex items-center gap-3 mb-3">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <h3 className="font-semibold text-white">{l.resetData}</h3>
            </div>
            <p className="text-sm text-rose-400/80 mb-4">{l.resetConfirmBody}</p>
            <Button
              variant="secondary"
              onClick={() => setResetOpen(true)}
              className="w-full bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400"
            >
              {l.resetData}
            </Button>
          </Card>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="settings-privacy" className="scroll-mt-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">{l.privacySection}</h2>
        <Card className="p-4 space-y-4 border-emerald-400/30 bg-emerald-400/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">{l.privacyDisclaimer}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{l.privacyBody}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">{l.criticalExpense}</h3>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${commitment ? 'bg-emerald-400/20 text-emerald-400' : 'bg-amber-400/20 text-amber-400'}`}>
                {commitment ? l.committed : l.notCommitted}
              </span>
            </div>
            {commitment && profile && (
              <div className="bg-black/30 rounded-xl p-3 text-sm">
                <p className="text-white/70">
                  {locale === 'th'
                    ? `คุณเลือกลด: ${commitment.expenseKey} | ประหยัดต่อเดือน: ${formatMoney(commitment.estimatedMonthlyCost, override ?? profile.answers.currency ?? 'THB', 'th')}`
                    : `You chose: ${commitment.expenseKey} | Monthly savings: ${formatMoney(commitment.estimatedMonthlyCost, override ?? profile.answers.currency ?? 'THB', 'en')}`}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-medium text-white">{l.password}</p>
              </div>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                {l.changePassword}
              </button>
            </div>
            <p className="text-xs text-white/50">{l.passwordDesc}</p>
          </div>
        </Card>
      </section>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        locale={locale}
      />

      <StorageDiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        locale={locale}
      />

      {/* Decrypt Password Prompt Modal */}
      <Modal
        isOpen={showImportPasswordInput}
        onClose={() => {
          setShowImportPasswordInput(false);
          setPendingFileString(null);
          setImportPassword('');
        }}
        title={l.importPasswordTitle}
        description={l.importPasswordDesc}
        size="sm"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showImportPassword ? 'text' : 'password'}
              placeholder={l.enterPassword}
              value={importPassword}
              onChange={(e) => setImportPassword(e.target.value)}
              className="w-full text-xs pr-8"
            />
            <button
              type="button"
              onClick={() => setShowImportPassword(!showImportPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              {showImportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportPasswordInput(false);
                setPendingFileString(null);
                setImportPassword('');
              }}
            >
              {l.resetConfirmCancel}
            </Button>
            <Button variant="primary" onClick={handleDecryptAndImport} disabled={!importPassword}>
              {l.submit}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title={l.resetConfirmTitle}
        description={l.resetConfirmBody}
        size="sm"
        closeOnOverlayClick={false}
      >
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            {l.resetConfirmCancel}
          </Button>
          <Button
            variant="secondary"
            onClick={handleResetConfirm}
            className="bg-rose-400/10 hover:bg-rose-400/20 border-rose-400/30 text-rose-400"
          >
            {l.resetConfirmDestructive}
          </Button>
        </div>
      </Modal>
    </>
  );
}
