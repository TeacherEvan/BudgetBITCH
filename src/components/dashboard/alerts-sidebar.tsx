// components/dashboard/alerts-sidebar.tsx
'use client';

import { AnimatedFeedList } from './animated-feed-list';

export function AlertsSidebar({ locale, isModal = false }: { locale: 'th' | 'en'; isModal?: boolean }) {
  if (isModal) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="font-semibold text-white text-lg">
            {locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Latest Updates'}
          </h3>
        </div>
        <AnimatedFeedList locale={locale} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-lg">
          {locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Latest Updates'}
        </h3>
      </div>
      <AnimatedFeedList locale={locale} />
    </div>
  );
}