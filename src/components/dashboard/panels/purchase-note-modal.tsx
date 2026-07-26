// components/dashboard/panels/purchase-note-modal.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface NoteEditorProps {
  locale: 'th' | 'en';
  initialNote: string;
  onSave: (note: string) => Promise<void> | void;
  onClose: () => void;
}

// Inner editor is keyed by its mount so `useState(initialNote)` re-seeds cleanly
// every time the modal opens, avoiding setState-in-effect.
function NoteEditor({ locale, initialNote, onSave, onClose }: NoteEditorProps) {
  const [value, setValue] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder={
          locale === 'th'
            ? 'เช่น ของขวัญวันเกิดให้แม่, ค่าอาหารลูกค้า XYZ...'
            : 'e.g. Birthday gift for Mom, client lunch XYZ...'
        }
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[rgba(201,150,12,0.4)] focus:outline-none focus:ring-1 focus:ring-[rgba(201,150,12,0.3)]"
        aria-label={locale === 'th' ? 'บันทึก' : 'Note'}
      />
      <p className="text-xs text-white/40">
        {locale === 'th'
          ? 'บันทึกนี้จะแสดงให้สมาชิกบอร์ดคนอื่นเห็น'
          : 'Visible to all members of this shared board'}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
          {saving
            ? locale === 'th'
              ? 'กำลังบันทึก...'
              : 'Saving...'
            : locale === 'th'
              ? 'บันทึก'
              : 'Save'}
        </Button>
      </div>
    </div>
  );
}

interface PurchaseNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: 'th' | 'en';
  merchant: string;
  initialNote: string;
  onSave: (note: string) => Promise<void> | void;
}

export function PurchaseNoteModal({
  isOpen,
  onClose,
  locale = 'en',
  merchant,
  initialNote,
  onSave,
}: PurchaseNoteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locale === 'th' ? 'บันทึกการซื้อร่วม' : 'Shared Purchase Note'}
      description={merchant}
    >
      {isOpen && (
        <NoteEditor
          key={merchant}
          locale={locale}
          initialNote={initialNote}
          onSave={onSave}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
