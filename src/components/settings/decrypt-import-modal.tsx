// components/settings/decrypt-import-modal.tsx
'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface DecryptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecrypt: () => Promise<void>;
  locale: 'th' | 'en';
  importPassword: string;
  setImportPassword: (password: string) => void;
  showImportPassword: boolean;
  setShowImportPassword: (show: boolean) => void;
}

const COPY = {
  th: {
    title: 'ต้องการรหัสผ่านเพื่อนำเข้าข้อมูล',
    desc: 'ข้อมูลสำรองนี้ถูกเข้ารหัส กรุณาป้อนรหัสผ่านที่ตั้งค่าไว้เพื่อถอดรหัสและนำเข้าข้อมูล',
    enterPassword: 'ป้อนรหัสผ่านสำรองข้อมูล',
    cancel: 'ยกเลิก',
    submit: 'ตกลง',
  },
  en: {
    title: 'Password Required to Import',
    desc: 'This backup file is encrypted. Enter the backup password to decrypt and restore.',
    enterPassword: 'Enter backup password',
    cancel: 'Cancel',
    submit: 'Submit',
  },
};

export function DecryptImportModal({
  isOpen,
  onClose,
  onDecrypt,
  locale,
  importPassword,
  setImportPassword,
  showImportPassword,
  setShowImportPassword,
}: DecryptImportModalProps) {
  const l = COPY[locale] || COPY.en;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={l.title}
      description={l.desc}
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
            onClick={onClose}
          >
            {l.cancel}
          </Button>
          <Button variant="primary" onClick={onDecrypt} disabled={!importPassword}>
            {l.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}