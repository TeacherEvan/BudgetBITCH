"use client";

import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { PANEL_CONFIG, type PanelKey } from "./dashboard-shell";

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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around gap-1 border-t border-[rgba(201,150,12,0.15)] bg-[#080600] px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2"
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
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[10px] font-bold leading-tight cursor-pointer select-none"
          >
            {/* Active Top indicator pill */}
            {isActive && (
              <motion.div
                layoutId="tab-active-pill"
                className="absolute top-0 w-8 h-[3px] bg-[#E8B020] rounded-full"
                style={{ boxShadow: "0 0 8px #E8B020" }}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}

            {/* Icon */}
            <motion.span
              animate={{
                y: isActive ? -3 : 0,
                scale: isActive ? 1.15 : 1,
                opacity: isActive ? 1 : 0.44
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="text-lg leading-none"
            >
              {config.icon}
            </motion.span>

            {/* Label */}
            <span className={`truncate ${isActive ? 'text-[#E8B020] font-extrabold' : 'text-[#F8F3E8]/50'}`}>
              {config.label[locale]}
            </span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onMore}
        className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[10px] font-bold leading-tight cursor-pointer select-none"
      >
        {/* Icon */}
        <span className="text-lg leading-none opacity-44 text-[#F8F3E8] flex justify-center">
          <MoreHorizontal className="w-5 h-5" />
        </span>

        {/* Label */}
        <span className="truncate text-[#F8F3E8]/50">
          {locale === 'th' ? 'เพิ่มเติม' : 'More'}
        </span>

        {/* Alert Count Badge */}
        {alertCount > 0 && (
          <span 
            className="absolute top-0.5 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#E84040] text-[#F8F3E8] text-[9px] font-bold flex items-center justify-center border border-[#080600]"
            style={{ boxShadow: "0 0 6px rgba(232,64,64,0.4)" }}
          >
            {alertCount}
          </span>
        )}
      </button>
    </nav>
  );
}
