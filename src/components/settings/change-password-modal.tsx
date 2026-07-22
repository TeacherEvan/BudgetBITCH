// components/settings/change-password-modal.tsx
'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: 'th' | 'en';
}

const COPY = {
  en: {
    title: 'Change Password',
    description: 'Enter your current password and a new password below.',
    oldPasswordLabel: 'Current Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    submit: 'Update Password',
    updating: 'Updating password...',
    successTitle: 'Password Changed!',
    successMessage: 'Your password has been updated successfully. DONE!',
    close: 'Close',
    passwordsMismatch: 'New passwords do not match.',
    passwordLength: 'New password must be at least 8 characters.',
    genericError: 'Failed to update password. Please check your current password.',
  },
  th: {
    title: 'เปลี่ยนรหัสผ่าน',
    description: 'กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ของคุณด้านล่าง',
    oldPasswordLabel: 'รหัสผ่านปัจจุบัน',
    newPasswordLabel: 'รหัสผ่านใหม่',
    confirmPasswordLabel: 'ยืนยันรหัสผ่านใหม่',
    submit: 'อัปเดตรหัสผ่าน',
    updating: 'กำลังอัปเดตรหัสผ่าน...',
    successTitle: 'เปลี่ยนรหัสผ่านเรียบร้อย!',
    successMessage: 'อัปเดตรหัสผ่านของคุณสำเร็จแล้ว DONE!',
    close: 'ปิด',
    passwordsMismatch: 'รหัสผ่านใหม่ไม่ตรงกัน',
    passwordLength: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
    genericError: 'ไม่สามารถอัปเดตรหัสผ่านได้ โปรดตรวจสอบรหัสผ่านปัจจุบันของคุณ',
  },
};

export function ChangePasswordModal({ isOpen, onClose, locale = 'en' }: ChangePasswordModalProps) {
  const changePassword = useAction(api.accounts.changePassword);
  const copy = COPY[locale] || COPY.en;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oldPassword) {
      setError(copy.oldPasswordLabel + ' is required');
      return;
    }
    if (newPassword.length < 8) {
      setError(copy.passwordLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(copy.passwordsMismatch);
      return;
    }

    setLoading(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Incorrect old password')) {
        setError(copy.genericError);
      } else if (msg.includes('8 characters')) {
        setError(copy.passwordLength);
      } else {
        setError(msg || copy.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={copy.title} size="sm">
      {success ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{copy.successTitle}</h3>
            <p className="text-sm text-white/70 mt-1">{copy.successMessage}</p>
          </div>
          <Button onClick={handleClose} className="w-full bg-amber-400 text-black font-semibold hover:bg-amber-300 mt-4">
            {copy.close}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <p className="text-xs text-white/70">{copy.description}</p>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">{copy.oldPasswordLabel}</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">{copy.newPasswordLabel}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">{copy.confirmPasswordLabel}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-400 text-black font-semibold hover:bg-amber-300">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {copy.updating}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  {copy.submit}
                </span>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
