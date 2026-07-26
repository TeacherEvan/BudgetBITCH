'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/use-accounts';
import type { WizardProfile } from '@/lib/types/budget';
import type { CurrencyOverride } from '@/hooks/use-currency-override';

interface AccountSettingsCardProps {
  locale: 'th' | 'en';
  profile: WizardProfile | null;
  override: CurrencyOverride;
  clearProfile?: () => void;
}

export function AccountSettingsCard({
  locale,
  profile,
  override,
  clearProfile,
}: AccountSettingsCardProps) {
  const router = useRouter();
  const { setDisplayName } = useAccounts();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <section id="settings-profile" className="scroll-mt-24">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C] mb-4">
        {locale === 'th' ? 'โปรไฟล์' : 'Profile'}
      </h2>
      <Card className="p-4 space-y-4">
        {profile?.answers ? (
          <div className="flex items-center gap-3 p-3 bg-white/4 rounded-xl border border-white/8">
            <div className="w-10 h-10 rounded-full bg-[#C9960C]/20 flex items-center justify-center text-[#E8B020] font-bold text-lg flex-shrink-0">
              💰
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">
                {override ?? profile.answers.currency ?? 'THB'} {locale === 'th' ? 'โปรไฟล์' : 'Profile'}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {locale === 'th' ? 'รายรับต่อเดือน: ' : 'Monthly income: '}
                <span className="text-[#E8B020] font-mono">
                  {typeof profile.answers.income === 'number' ? profile.answers.income.toLocaleString() : '—'}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/50">
            {locale === 'th' ? 'ยังไม่ได้ตั้งค่าโปรไฟล์' : 'No profile set up yet'}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.1em] text-white/60">
            {locale === 'th' ? 'ชื่อที่แสดง (สำหรับบอร์ดคู่)' : 'Display name (shared boards)'}
          </label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={locale === 'th' ? 'เช่น Evan, Leandi' : 'e.g. Evan, Leandi'}
              maxLength={40}
              aria-label={locale === 'th' ? 'ชื่อที่แสดง' : 'Display name'}
            />
            <Button
              type="button"
              variant="primary"
              disabled={saving || name.trim().length === 0}
              onClick={async () => {
                setSaving(true);
                try {
                  await setDisplayName(name.trim());
                  setName('');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? (locale === 'th' ? 'บันทึก...' : 'Save...') : (locale === 'th' ? 'บันทึก' : 'Save')}
            </Button>
          </div>
          <p className="text-xs text-white/40">
            {locale === 'th'
              ? 'แสดงให้สมาชิกบอร์ดคนอื่นเห็นแทนอีเมล'
              : 'Shown to other board members instead of your email'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            clearProfile?.();
            router.push('/dashboard');
          }}
          className="flex w-full items-center gap-2 rounded-xl border border-[rgba(201,150,12,0.3)] bg-[rgba(201,150,12,0.08)] px-4 py-3 text-sm font-medium text-[#E8B020] transition-colors hover:bg-[rgba(201,150,12,0.15)]"
        >
          🔄 {locale === 'th' ? 'เริ่มวิซาร์ดตั้งค่าใหม่อีกครั้ง' : 'Re-run Setup Wizard'}
        </button>
      </Card>
    </section>
  );
}
