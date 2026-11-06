// components/settings/local-vault-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import {
  hasLocalPassword,
  setLocalPassword,
  removeLocalPassword,
  unlockLocalVault,
} from '@/lib/auth/local-lock';

interface LocalVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

export function LocalVaultModal({ isOpen, onClose }: LocalVaultModalProps) {
  const [hasPassword, setHasPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasPassword(hasLocalPassword());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSetOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (hasPassword) {
      if (!currentPassword) {
        setError('Current password is required to make changes.');
        return;
      }
      const ok = await unlockLocalVault(currentPassword);
      if (!ok) {
        setError('Current password is incorrect.');
        return;
      }
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await setLocalPassword(newPassword);
      setHasPassword(true);
      setSuccess('Local device vault password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Failed to update local password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setError(null);
    setSuccess(null);

    if (hasPassword) {
      if (!currentPassword) {
        setError('Please enter your current password to remove protection.');
        return;
      }
      const ok = await unlockLocalVault(currentPassword);
      if (!ok) {
        setError('Current password is incorrect.');
        return;
      }
    }

    removeLocalPassword();
    setHasPassword(false);
    setSuccess('Password protection removed. Budget is now unlocked on this device.');
    setCurrentPassword('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasPassword ? 'Local Vault Protection' : 'Set Local Vault Password'}
      size="sm"
    >
      <div className="space-y-4 py-2">
        <p className="text-xs text-white/60">
          {hasPassword
            ? 'Your budget data on this device is encrypted and protected by your master password/PIN.'
            : 'Protect your financial records stored in IndexedDB on this device with a master password or PIN.'}
        </p>

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSetOrUpdate} className="space-y-3">
          {hasPassword && (
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Current Password / PIN
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">
              {hasPassword ? 'New Password / PIN' : 'Master Password / PIN'}
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">
              Confirm New Password / PIN
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full text-sm"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full justify-center mt-2"
          >
            {hasPassword ? 'Update Master Password' : 'Save Master Password'}
          </Button>
        </form>

        {hasPassword && (
          <div className="pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handleRemovePassword}
              className="flex items-center justify-center gap-1.5 w-full text-xs text-rose-400 hover:text-rose-300 py-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Device Password Protection
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
