// components/dashboard/panels/net-worth-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { ASSET_TYPES, LIABILITY_TYPES, AssetInput, LiabilityInput } from './net-worth-types';

interface NetWorthFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  locale: 'th' | 'en';
  title: string;
  initialData: AssetInput | LiabilityInput;
  onSubmit: (data: AssetInput | LiabilityInput) => void;
  type: 'asset' | 'liability';
}

export function NetWorthForm({ isOpen, onClose, isEditing, locale, title, initialData, onSubmit, type }: NetWorthFormProps) {
  const [formData, setFormData] = useState<AssetInput | LiabilityInput>(initialData);

  const assetTypeOptions = ASSET_TYPES.map(t => ({ value: t.value, label: locale === 'th' ? t.label.th : t.label.en }));
  const liabilityTypeOptions = LIABILITY_TYPES.map(t => ({ value: t.value, label: locale === 'th' ? t.label.th : t.label.en }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (type === 'asset') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="md"
        closeOnEscape
        closeOnOverlayClick
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={locale === 'th' ? 'ชื่อ' : 'Name'}
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label={locale === 'th' ? 'มูลค่า' : 'Value'}
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
            required
          />
          <Select
            label={locale === 'th' ? 'ประเภท' : 'Type'}
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as AssetInput['type'] })}
            options={assetTypeOptions}
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? (locale === 'th' ? 'อัปเดต' : 'Update') : (locale === 'th' ? 'เพิ่ม' : 'Add')}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      closeOnEscape
      closeOnOverlayClick
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={locale === 'th' ? 'ชื่อ' : 'Name'}
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
          autoFocus
        />
        <Input
          label={locale === 'th' ? 'จำนวนเงิน' : 'Value'}
          type="number"
          step="0.01"
          min="0"
          value={formData.value}
          onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
          required
        />
        <Select
          label={locale === 'th' ? 'ประเภท' : 'Type'}
          value={formData.type}
          onChange={e => setFormData({ ...formData, type: e.target.value as LiabilityInput['type'] })}
          options={liabilityTypeOptions}
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button type="submit" className="flex-1">
            {isEditing ? (locale === 'th' ? 'อัปเดต' : 'Update') : (locale === 'th' ? 'เพิ่ม' : 'Add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}