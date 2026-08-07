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
  locale: string;
  importPassword: string;
  setImportPassword: (password: string) => void;
  showImportPassword: boolean;
  setShowImportPassword: (show: boolean) => void;
}

const COPY = {
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
  importPassword,
  setImportPassword,
  showImportPassword,
  setShowImportPassword,
}: DecryptImportModalProps) {
  const l = COPY.en;

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