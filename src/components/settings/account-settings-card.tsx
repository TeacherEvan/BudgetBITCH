'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
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
