// components/dashboard/mobile-panel-tabs.tsx
'use client';

import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { PANEL_CONFIG, type PanelKey } from './dashboard-shell';

// Primary mobile tabs — the five most-used panels.
const PRIMARY_TABS: PanelKey[] = ['expenses', 'budget', 'goals', 'netWorth', 'budgetAlerts'];

interface MobilePanelTabsProps {
  activePanel: PanelKey;
  onSelect: (panel: PanelKey) => void;
  onMore: () => void;
  locale: 'th' | 'en';
  alertCount?: number;
}

export function MobilePanelTabs({ activePanel, onSelect, onMore, locale, alertCount = 0 }: MobilePanelTabsProps) {
  return (
    <nav
      aria-label={locale === 'th' ? 'แผงแดชบอร์ด' : 'Dashboard panels'}
      className="bb-mobile-tab-bar lg:hidden flex flex-shrink-0 items-stretch justify-around gap-1 border-t border-[rgba(201,150,12,0.15)] bg-[#080600] px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
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
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium leading-tight transition-colors"
          >
            {/* Gold pill indicator ABOVE the icon for active tabs */}
            {isActive && (
              <motion.span
                layoutId="tab-active"
                className="absolute -top-1 h-[3px] w-8 rounded-[12px] bg-[#E8B020]"
                style={{ boxShadow: '0 0 8px #E8B020' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <motion.span
              animate={{ y: isActive ? -3 : 0, scale: isActive ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className={`text-lg leading-none ${isActive ? 'text-[#E8B020]' : 'text-white/45'}`}
            >
              {config.icon}
            </motion.span>
            <span className={`truncate ${isActive ? 'text-[#F8F3E8]' : 'text-white/45'}`}>
              {config.label[locale]}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium leading-tight text-white/45 transition-colors"
      >
        <span className="relative text-lg leading-none">
          <MoreHorizontal />
          {alertCount > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E84040] px-1 text-[9px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </span>
        <span className="truncate">{locale === 'th' ? 'เพิ่มเติม' : 'More'}</span>
      </button>
    </nav>
  );
}
