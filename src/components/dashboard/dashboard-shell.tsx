// components/dashboard/dashboard-shell.tsx
'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { HeaderBar } from '@/components/layout/header-bar';
import { DailyDisposableHero } from '@/components/dashboard/daily-disposable-hero';
import { CriticalExpensesModal } from '@/components/dashboard/critical-expenses-modal';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';
import { ExpenseTracker } from '@/components/dashboard/panels/expense-tracker';
import { BudgetVisual } from '@/components/dashboard/panels/budget-visual';
import { BudgetAlerts } from '@/components/dashboard/panels/budget-alerts';
import { Bills } from '@/components/dashboard/panels/bills';
import { SavingsGoals } from '@/components/dashboard/panels/savings-goals';
import { NetWorth } from '@/components/dashboard/panels/net-worth';
import { Subscriptions } from '@/components/dashboard/panels/subscriptions';
import { EmergencyFund } from '@/components/dashboard/panels/emergency-fund';
import { DebtPayoff } from '@/components/dashboard/panels/debt-payoff';
import { CashFlowForecast } from '@/components/dashboard/panels/cash-flow-forecast';
import { Modal } from '@/components/ui/modal';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { BentoGrid, PanelConfig } from '@/components/dashboard/bento-grid';
import { MobilePanelTabs } from '@/components/dashboard/mobile-panel-tabs';

export type PanelKey = 'expenses' | 'budget' | 'budgetAlerts' | 'bills' | 'goals' | 'netWorth' | 'subscriptions' | 'emergency' | 'debt' | 'forecast';

export const PANEL_CONFIG: Record<PanelKey, { label: { th: string; en: string }; icon: string }> = {
  expenses: { label: { th: 'ค่าใช้จ่าย', en: 'Expenses' }, icon: '💸' },
  budget: { label: { th: 'งบประมาณ', en: 'Budget' }, icon: '📊' },
  budgetAlerts: { label: { th: 'การแจ้งเตือน', en: 'Budget Alerts' }, icon: '🔔' },
  bills: { label: { th: 'บิล/บิลล์', en: 'Bills' }, icon: '📋' },
  goals: { label: { th: 'เป้าหมาย', en: 'Goals' }, icon: '🎯' },
  netWorth: { label: { th: 'มูลค่าสุทธิ', en: 'Net Worth' }, icon: '💰' },
  subscriptions: { label: { th: 'สมัครสมาชิก', en: 'Subscriptions' }, icon: '📺' },
  emergency: { label: { th: 'เงินสำรอง', en: 'Emergency' }, icon: '🛡️' },
  debt: { label: { th: 'หนี้สิน', en: 'Debt' }, icon: '📉' },
  forecast: { label: { th: 'พยากรณ์', en: 'Forecast' }, icon: '🔮' },
};

const PANEL_ORDER: PanelKey[] = ['expenses', 'budget', 'budgetAlerts', 'bills', 'goals', 'netWorth', 'subscriptions', 'emergency', 'debt', 'forecast'];

const PANELS: PanelConfig[] = [
  { id: 'expenses', title: 'Expenses', children: <ExpenseTracker /> },
  { id: 'budget', title: 'Budget', children: <BudgetVisual /> },
  { id: 'budgetAlerts', title: 'Budget Alerts', children: <BudgetAlerts /> },
  { id: 'bills', title: 'Bills', children: <Bills /> },
  { id: 'goals', title: 'Goals', children: <SavingsGoals /> },
  { id: 'netWorth', title: 'Net Worth', children: <NetWorth /> },
  { id: 'subscriptions', title: 'Subscriptions', children: <Subscriptions /> },
  { id: 'emergency', title: 'Emergency', children: <EmergencyFund /> },
  { id: 'debt', title: 'Debt', children: <DebtPayoff /> },
  { id: 'forecast', title: 'Forecast', children: <CashFlowForecast /> },
];

interface DashboardShellProps {
  locale: 'th' | 'en';
  onLocaleChange?: (locale: 'th' | 'en') => void;
  voiceEnabled?: boolean;
  onVoiceToggle?: () => void;
}

export function DashboardShell({ locale, onLocaleChange, voiceEnabled = false, onVoiceToggle }: DashboardShellProps) {
  const { loading: commitmentLoading } = useCriticalExpense();
  const [criticalExpenseOpen, setCriticalExpenseOpen] = useState(false);
  const [openPanels, setOpenPanels] = useState<PanelKey[]>(['expenses', 'budget']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marketWatchOpen, setMarketWatchOpen] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<PanelKey>('expenses');

  const togglePanel = (panel: PanelKey) => {
    setOpenPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  };

  const isPanelOpen = (panel: PanelKey) => openPanels.includes(panel);

  // Only render the panels the user has toggled on in the sidebar (desktop).
  const visiblePanels = PANELS.filter((panel) => openPanels.includes(panel.id as PanelKey));

  // Mobile: exactly one active panel rendered at a time.
  const mobilePanel = PANELS.find((panel) => panel.id === mobileActivePanel) ?? PANELS[0];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header Bar */}
      <HeaderBar
        locale={locale}
        onLocaleChange={(next) => onLocaleChange?.(next)}
        onSettingsOpen={() => setMobileMenuOpen(true)}
        voiceEnabled={voiceEnabled}
        onVoiceToggle={() => onVoiceToggle?.()}
      />

      <main className="flex-1 flex lg:flex-row overflow-hidden">
        {/* Desktop Sidebar - only on lg+ */}
        <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-white/5 bg-black/30 p-4 overflow-y-auto">
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {locale === 'th' ? 'ค่าใช้จ่ายที่ต้องลด' : 'Cut One Expense'}
            </h3>
            <button
              onClick={() => setCriticalExpenseOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={commitmentLoading}
            >
              <span className="text-2xl">🎯</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">
                  {locale === 'th' ? 'เลือก 1 อย่างลดในเดือนนี้' : 'Pick 1 to cut this month'}
                </p>
                <p className="text-xs text-white/60">
                  {locale === 'th' ? 'ดูเงินที่จะประหยัดได้' : 'See your savings potential'}
                </p>
              </div>
              <ChevronDown className="text-amber-400" />
            </button>
            {commitmentLoading && <p className="text-xs text-white/50 text-center">{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</p>}

            {/* Market Watch - desktop sidebar, only below xl */}
            <button
              onClick={() => setMarketWatchOpen(true)}
              className="xl:hidden w-full flex items-center gap-3 p-3 rounded-xl bg-sky-400/10 border border-sky-400/30 hover:bg-sky-400/20 transition-colors text-left"
            >
              <span className="text-2xl">📰</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-white text-sm">
                  {locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Market Watch'}
                </p>
                <p className="text-xs text-white/60">
                  {locale === 'th' ? 'ดูราคาน้ำมัน โปรโมชั่น ข่าว' : 'Fuel, deals & news'}
                </p>
              </div>
              <ChevronDown className="text-sky-400" />
            </button>
          </div>

          <div className="space-y-2">
            {PANEL_ORDER.map(panel => {
              const config = PANEL_CONFIG[panel];
              const isOpen = isPanelOpen(panel);
              return (
                <button
                  key={panel}
                  onClick={() => togglePanel(panel)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    isOpen
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-black/30 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-medium text-white text-sm flex-1 text-left">
                    {config.label[locale]}
                  </span>
                  {isOpen ? <ChevronUp className="text-white/50" /> : <ChevronDown className="text-white/40" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile Bottom Sheet Sidebar */}
        <div data-testid="mobile-sheet" className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <button onClick={() => setMobileMenuOpen(false)} className="absolute -top-3 right-4 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white/50" />
          </button>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{locale === 'th' ? 'เมนู' : 'Menu'}</h3>
            </div>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-left disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setCriticalExpenseOpen(true); setMobileMenuOpen(false); }} disabled={commitmentLoading}>
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-white">{locale === 'th' ? 'เลือก 1 อย่างลดในเดือนนี้' : 'Pick 1 to cut this month'}</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-sky-400/10 border border-sky-400/30 text-left" onClick={() => { setMarketWatchOpen(true); setMobileMenuOpen(false); }}>
              <span className="text-2xl">📰</span>
              <div>
                <p className="font-medium text-white">{locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Market Watch'}</p>
              </div>
            </button>
            {PANEL_ORDER.map(panel => {
              const config = PANEL_CONFIG[panel];
              const isOpen = mobileActivePanel === panel;
              return (
                <button
                  key={panel}
                  onClick={() => { setMobileActivePanel(panel); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    isOpen ? 'bg-white/5 border border-white/10' : 'bg-black/30 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-medium text-white text-sm flex-1">{config.label[locale]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile bottom tab bar - swaps the single active panel */}
        <MobilePanelTabs
          activePanel={mobileActivePanel}
          onSelect={setMobileActivePanel}
          onMore={() => setMobileMenuOpen(true)}
          locale={locale}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          {/* Daily Disposable Hero */}
          <DailyDisposableHero locale={locale} />

          {/* Panels */}
          <div className="mt-6">
            {/* Mobile: one active panel at a time (no scroll stack) */}
            <div className="lg:hidden" data-testid="mobile-panels">
              <BentoGrid panels={[mobilePanel]} />
            </div>
            {/* Desktop: toggled grid */}
            <div className="hidden lg:block" data-testid="desktop-panels">
              <BentoGrid panels={visiblePanels} />
            </div>
          </div>
        </div>

        {/* Alerts Sidebar - Desktop (xl+) */}
        <aside className="hidden xl:block w-80 flex-shrink-0 border-l border-white/5 bg-black/30 p-4 overflow-y-auto">
          <AlertsSidebar locale={locale} />
        </aside>

        {/* Critical Expenses Modal */}
        <CriticalExpensesModal
          isOpen={criticalExpenseOpen}
          onClose={() => setCriticalExpenseOpen(false)}
          locale={locale}
        />

        {/* Market Watch Modal */}
        <Modal
          isOpen={marketWatchOpen}
          onClose={() => setMarketWatchOpen(false)}
          showCloseButton={true}
          size="lg"
          title={locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Market Watch'}
        >
          <AlertsSidebar locale={locale} />
        </Modal>
      </main>
    </div>
  );
}
