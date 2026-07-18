// components/dashboard/mobile-panel-tabs.tsx
'use client';

import { MoreHorizontal } from 'lucide-react';
import { PANEL_CONFIG, type PanelKey } from './dashboard-shell';

// Primary mobile tabs — the five most-used panels.
const PRIMARY_TABS: PanelKey[] = ['expenses', 'budget', 'goals', 'netWorth', 'budgetAlerts'];

interface MobilePanelTabsProps {
  activePanel: PanelKey;
  onSelect: (panel: PanelKey) => void;
  onMore: () => void;
  locale: 'th' | 'en';
}

export function MobilePanelTabs({ activePanel, onSelect, onMore, locale }: MobilePanelTabsProps) {
  return (
    <nav
      aria-label={locale === 'th' ? 'แผงแดชบอร์ด' : 'Dashboard panels'}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around gap-1 border-t border-white/10 bg-black/95 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)] pt-2"
    >
      {PRIMARY_TABS.map((panel) => {
        const config = PANEL_CONFIG[panel];
        const isActive = activePanel === panel;
        return (
          <button
            key={panel}
            data-testid={`mobile-tab-${panel}`}
            type="button"
            onClick={() => onSelect(panel)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium leading-tight transition-colors ${
              isActive ? 'text-amber-400' : 'text-white/55'
            }`}
          >
            <span className="text-lg leading-none">{config.icon}</span>
            <span className="truncate">{config.label[locale]}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium leading-tight text-white/55 transition-colors"
      >
        <MoreHorizontal className="text-lg leading-none" />
        <span className="truncate">{locale === 'th' ? 'เพิ่มเติม' : 'More'}</span>
      </button>
    </nav>
  );
}
