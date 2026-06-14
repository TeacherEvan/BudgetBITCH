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
import { Bills } from '@/components/dashboard/panels/bills';
import { SavingsGoals } from '@/components/dashboard/panels/savings-goals';
import { NetWorth } from '@/components/dashboard/panels/net-worth';
import { Subscriptions } from '@/components/dashboard/panels/subscriptions';
import { EmergencyFund } from '@/components/dashboard/panels/emergency-fund';
import { DebtPayoff } from '@/components/dashboard/panels/debt-payoff';
import { CashFlowForecast } from '@/components/dashboard/panels/cash-flow-forecast';
import { useWizardProfile } from '@/hooks/use-local-db';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { BentoGrid, PanelConfig } from '@/components/dashboard/bento-grid';

type PanelKey = 'expenses' | 'budget' | 'bills' | 'goals' | 'netWorth' | 'subscriptions' | 'emergency' | 'debt' | 'forecast';

const PANEL_CONFIG: Record<PanelKey, { label: { th: string; en: string }; icon: string }> = {
  expenses: { label: { th: 'ค่าใช้จ่าย', en: 'Expenses' }, icon: '💸' },
  budget: { label: { th: 'งบประมาณ', en: 'Budget' }, icon: '📊' },
  bills: { label: { th: 'บิล/บิลล์', en: 'Bills' }, icon: '📋' },
  goals: { label: { th: 'เป้าหมาย', en: 'Goals' }, icon: '🎯' },
  netWorth: { label: { th: 'มูลค่าสุทธิ', en: 'Net Worth' }, icon: '💰' },
  subscriptions: { label: { th: 'สมัครสมาชิก', en: 'Subscriptions' }, icon: '📺' },
  emergency: { label: { th: 'เงินสำรอง', en: 'Emergency' }, icon: '🛡️' },
  debt: { label: { th: 'หนี้สิน', en: 'Debt' }, icon: '📉' },
  forecast: { label: { th: 'พยากรณ์', en: 'Forecast' }, icon: '🔮' },
};

const PANEL_ORDER: PanelKey[] = ['expenses', 'budget', 'bills', 'goals', 'netWorth', 'subscriptions', 'emergency', 'debt', 'forecast'];

const PANELS: PanelConfig[] = [
  { id: 'expenses', title: 'Expenses', children: <ExpenseTracker /> },
  { id: 'budget', title: 'Budget', children: <BudgetVisual /> },
  { id: 'bills', title: 'Bills', children: <Bills /> },
  { id: 'goals', title: 'Goals', children: <SavingsGoals /> },
  { id: 'netWorth', title: 'Net Worth', children: <NetWorth /> },
  { id: 'subscriptions', title: 'Subscriptions', children: <Subscriptions /> },
  { id: 'emergency', title: 'Emergency', children: <EmergencyFund /> },
  { id: 'debt', title: 'Debt', children: <DebtPayoff /> },
  { id: 'forecast', title: 'Forecast', children: <CashFlowForecast /> },
];

export function DashboardShell({ locale }: { locale: 'th' | 'en' }) {
  const { profile } = useWizardProfile();
  const { commitment, loading: commitmentLoading } = useCriticalExpense();
  const [criticalExpenseOpen, setCriticalExpenseOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openPanels, setOpenPanels] = useState<PanelKey[]>(['expenses', 'budget']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const togglePanel = (panel: PanelKey) => {
    setOpenPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  };

  const isPanelOpen = (panel: PanelKey) => openPanels.includes(panel);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header Bar */}
      <HeaderBar
        locale={locale}
        onLocaleChange={() => {}}
        onSettingsOpen={() => setMobileMenuOpen(true)}
        voiceEnabled={false}
        onVoiceToggle={() => {}}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 lg:hidden">
          <div className="p-6">
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-white/50">
              <X className="w-6 h-6" />
            </button>
            <nav className="space-y-4 mt-12">
              <a href="/dashboard" className="block text-xl font-medium text-white" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
              <a href="/settings" className="block text-xl font-medium text-white/70" onClick={() => setMobileMenuOpen(false)}>Settings</a>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 flex lg:flex-row overflow-hidden">
        {/* Desktop Sidebar - only on lg+ */}
        <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-white/5 bg-black/30 p-4 overflow-y-auto">
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {locale === 'th' ? 'ค่าใช้จ่ายที่ต้องลด' : 'Cut One Expense'}
            </h3>
            <button
              onClick={() => setCriticalExpenseOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-colors text-left"
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
            {commitmentLoading && <p className="text-xs text-white/50 text-center">Loading...</p>}
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto transform transition-transform duration-300">
          <button onClick={() => setMobileMenuOpen(true)} className="absolute -top-3 right-4 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white/50" />
          </button>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{locale === 'th' ? 'เมนู' : 'Menu'}</h3>
            </div>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-left" onClick={() => { setCriticalExpenseOpen(true); setMobileMenuOpen(false); }}>
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-medium text-white">{locale === 'th' ? 'ลงทะเบียนค่าใช้จ่ายลด' : 'Register Cut Expense'}</p>
              </div>
            </button>
            {PANEL_ORDER.map(panel => {
              const config = PANEL_CONFIG[panel];
              const isOpen = isPanelOpen(panel);
              return (
                <button
                  key={panel}
                  onClick={() => { togglePanel(panel); setMobileMenuOpen(false); }}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-6">
          {/* Daily Disposable Hero */}
          <DailyDisposableHero locale={locale} />

          {/* Bento Grid Panels */}
          <div className="space-y-4 mt-6">
            <BentoGrid panels={PANELS} />
          </div>
        </div>

        {/* Alerts Sidebar - Desktop */}
        <aside className="hidden xl:block w-80 flex-shrink-0 border-l border-white/5 bg-black/30 p-4 overflow-y-auto">
          <AlertsSidebar locale={locale} />
        </aside>

        {/* Critical Expenses Modal */}
        <CriticalExpensesModal
          isOpen={criticalExpenseOpen}
          onClose={() => setCriticalExpenseOpen(false)}
          locale={locale}
        />

        {/* Mobile Alerts Bottom Sheet */}
        <div className="xl:hidden fixed bottom-20 left-4 right-4 z-30 md:bottom-24 md:left-auto md:right-4 md:w-96">
          <AlertsSidebar locale={locale} />
        </div>
      </main>
    </div>
  );
}