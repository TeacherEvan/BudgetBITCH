// components/dashboard/dashboard-shell.tsx
'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { HeaderBar } from '@/components/layout/header-bar';
import { AccountSwitcher } from '@/components/accounts/account-switcher';
import { CriticalExpensesModal } from '@/components/dashboard/critical-expenses-modal';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';
import { PriorityGuide } from '@/components/dashboard/priority-guide';
import { Modal } from '@/components/ui/modal';
import { useCriticalExpense } from '@/hooks/use-critical-expense';
import { useWizardProfile, useBudgets, useBills } from '@/hooks/use-local-db';
import { BentoGrid, type PanelConfig } from '@/components/dashboard/bento-grid';
import { MobilePanelTabs } from '@/components/dashboard/mobile-panel-tabs';
import { ScenarioSandboxModal } from '@/components/dashboard/scenario-sandbox-modal';
import { CashFlowProjectionCard } from '@/components/dashboard/cash-flow-projection-card';
import { CategoryPivotCard } from '@/components/dashboard/category-pivot-card';
import { BudgetVarianceGrid } from '@/components/dashboard/budget-variance-grid';
import { buildPanels } from '@/components/dashboard/panels';
import { PANEL_CONFIG, PANEL_ORDER, type PanelKey } from '@/components/dashboard/panelConfig';
import { DailyDisposableHero } from '@/components/dashboard/daily-disposable-hero';

interface DashboardShellProps {
  locale: 'th' | 'en';
  onLocaleChange?: (locale: 'th' | 'en') => void;
  onSetup?: () => void;
}

export function DashboardShell({ locale, onLocaleChange, onSetup }: DashboardShellProps) {
  const { loading: commitmentLoading } = useCriticalExpense();
  const { profile } = useWizardProfile();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { bills } = useBills();
  const [criticalExpenseOpen, setCriticalExpenseOpen] = useState(false);
  const [openPanels, setOpenPanels] = useState<PanelKey[]>(['expenses', 'budget']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marketWatchOpen, setMarketWatchOpen] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<PanelKey>('expenses');
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [excelTab, setExcelTab] = useState<'standard' | 'variance' | 'cashflow' | 'pivot'>('standard');


  // T5: direction-aware panel transitions. Direction is decided in the
  // select handler and stored in state (never read a ref during render).
  const prevIndexRef = useRef(0);
  const [direction, setDirection] = useState(1);
  const handleSelectPanel = (panel: PanelKey) => {
    const nextIndex = PANEL_ORDER.indexOf(panel);
    const dir = nextIndex >= prevIndexRef.current ? 1 : -1;
    prevIndexRef.current = nextIndex;
    setDirection(dir);
    setMobileActivePanel(panel);
  };

  // T9: alert badge count for the More tab (critical = no income, warning = bill due soon).
  let alertCount = 0;
  if (!profile || !profile.completed || !profile.answers?.income) {
    alertCount += 1;
  } else if (!budgetsLoading && budgets.length === 0) {
    alertCount += 1;
  } else {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dueSoon = bills.filter(b => b.isActive).some(b => {
      const diff = (((b.dueDay - dayOfMonth) % daysInMonth) + daysInMonth) % daysInMonth;
      return diff > 0 && diff <= 7;
    });
    if (dueSoon) alertCount += 1;
  }

  const togglePanel = (panel: PanelKey) => {
    setOpenPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  };

  const isPanelOpen = (panel: PanelKey) => openPanels.includes(panel);

  const panels: PanelConfig[] = useMemo(() => buildPanels(locale, onSetup), [locale, onSetup]);

  // Only render the panels the user has toggled on in the sidebar (desktop).
  const visiblePanels = panels.filter((panel) => openPanels.includes(panel.id as PanelKey));

  // Mobile: exactly one active panel rendered at a time.
  const mobilePanel = panels.find((panel) => panel.id === mobileActivePanel) ?? panels[0];

  return (
    <div className="bb-viewport-fill bg-[var(--bg-base)]">
      {/* Header Bar */}
      <header className="flex-shrink-0">
        <HeaderBar
          locale={locale}
          onLocaleChange={(next) => onLocaleChange?.(next)}
        />
      </header>

      {/* T6: priority guidance strip — 0 height when empty */}
      <div className="bb-status-strip flex-shrink-0">
        <PriorityGuide />
      </div>


      <main className="flex min-h-0 flex-1 flex-row overflow-hidden">
        {/* Desktop Sidebar - only on lg+ */}
        <aside className="hidden w-80 flex-shrink-0 overflow-y-auto border-r border-[var(--gold-border-soft)] bg-[var(--bg-surface-1)] p-4 lg:block">
          <AccountSwitcher locale={locale} />
          <Link
            href="/accounts"
            className="flex w-full items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-left transition-colors hover:bg-sky-400/20 mt-3"
          >
            <span className="text-2xl">🏦</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                {locale === 'th' ? 'จัดการบัญชีร่วมกัน' : 'Manage Accounts'}
              </p>
              <p className="text-[10px] text-white/50 leading-tight">
                {locale === 'th' ? 'แชร์บอร์ดกับครอบครัว เพื่อน หรือที่ทำงาน' : 'Share budget with family, friends, or work'}
              </p>
            </div>
          </Link>
          <div className="mb-6 mt-4 space-y-3">
            <h3 className="bb-kicker">
              {locale === 'th' ? 'ค่าใช้จ่ายที่ต้องลด' : 'Cut One Expense'}
            </h3>
            <button
              onClick={() => setCriticalExpenseOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--gold-border-strong)] bg-[var(--gold-base)]/10 p-3 text-left transition-colors hover:bg-[var(--gold-base)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={commitmentLoading}
            >
              <span className="text-2xl">🎯</span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-[var(--text-1)] truncate">
                  {locale === 'th' ? 'เลือก 1 อย่างลดในเดือนนี้' : 'Pick 1 to cut this month'}
                </p>
                <p className="text-xs text-[var(--text-2)]">
                  {locale === 'th' ? 'ดูเงินที่จะประหยัดได้' : 'See your savings potential'}
                </p>
              </div>
              <ChevronDown className="text-[var(--gold-bright)]" />
            </button>
            {commitmentLoading && <p className="text-center text-xs text-[var(--text-2)]">{locale === 'th' ? 'กำลังโหลด...' : 'Loading...'}</p>}

            {/* Market Watch - desktop sidebar, only below xl */}
            <button
              data-testid="market-watch-trigger"
              onClick={() => setMarketWatchOpen(true)}
              className="xl:hidden flex w-full items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-left transition-colors hover:bg-sky-400/20"
            >
              <span className="text-2xl">📰</span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-[var(--text-1)] truncate">
                  {locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Market Watch'}
                </p>
                <p className="text-xs text-[var(--text-2)]">
                  {locale === 'th' ? 'ดูราคาน้ำมัน โปรโมชั่น ข่าว' : 'Fuel, deals & news'}
                </p>
              </div>
              <ChevronDown className="text-sky-400" />
            </button>
          </div>

          <div className="relative space-y-2">
            {PANEL_ORDER.map(panel => {
              const config = PANEL_CONFIG[panel];
              const isOpen = isPanelOpen(panel);
              return (
                <button
                  key={panel}
                  onClick={() => togglePanel(panel)}
                  className={`relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    isOpen
                      ? 'border border-[var(--gold-border-soft)] bg-[var(--bg-surface-2)]'
                      : 'bg-[var(--bg-surface-1)] hover:bg-[var(--bg-surface-2)]'
                  }`}
                >
                  {isOpen && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-y-1 left-0 w-[3px] rounded-full"
                      style={{ background: 'var(--gold-bright)', boxShadow: '0 0 8px var(--gold-bright)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="text-xl">{config.icon}</span>
                  <span className={`flex-1 text-left text-sm font-medium truncate ${isOpen ? 'text-[var(--gold-bright)]' : 'text-[var(--text-2)]'}`}>
                    {config.label[locale]}
                  </span>
                  {isOpen ? <ChevronUp className="text-[var(--text-muted)]" /> : <ChevronDown className="text-[var(--text-muted)]" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* THE ONLY SCROLL ZONE */}
        <div className="bb-scroll-zone flex flex-col px-4 py-4 sm:px-5 lg:px-6">
          {/* Daily Disposable Hero */}
          <DailyDisposableHero locale={locale} onSetup={onSetup} />

          {/* Excel Power Budgeting Control Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex w-full items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setExcelTab('standard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  excelTab === 'standard'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                📊 Standard Dashboard
              </button>
              <button
                type="button"
                onClick={() => setExcelTab('variance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  excelTab === 'variance'
                    ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                ✨ Excel Variance Grid
              </button>
              <button
                type="button"
                onClick={() => setExcelTab('cashflow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  excelTab === 'cashflow'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                📅 30D Cash Flow
              </button>
              <button
                type="button"
                onClick={() => setExcelTab('pivot')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  excelTab === 'pivot'
                    ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                🧩 50/30/20 Matrix
              </button>
            </div>

            <button
              type="button"
              onClick={() => setScenarioModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-amber-500 text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center"
            >
              <span>⚙️</span>
              <span>{locale === 'th' ? 'What-If Sandbox (Goal Seek)' : 'What-If Sandbox (Goal Seek)'}</span>
            </button>
          </div>

          {/* Panels or Excel Views */}
          <div className="mt-4">
            {excelTab === 'variance' && (
              <BudgetVarianceGrid locale={locale} currency={profile?.answers?.currency ?? 'THB'} />
            )}
            {excelTab === 'cashflow' && (
              <CashFlowProjectionCard
                locale={locale}
                currency={profile?.answers?.currency ?? 'THB'}
                currentCashBalance={35000}
                monthlyIncome={profile?.answers?.income ?? 45000}
              />
            )}
            {excelTab === 'pivot' && (
              <CategoryPivotCard locale={locale} currency={profile?.answers?.currency ?? 'THB'} profile={profile} />
            )}
            {excelTab === 'standard' && (
              <>
                {/* Mobile: one active panel at a time (direction-aware slide-in). */}
                <div className="lg:hidden" data-testid="mobile-panels">
                  <motion.div
                    key={mobileActivePanel}
                    initial={{ opacity: 0, x: direction * 32 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
                  >
                    <BentoGrid panels={[mobilePanel]} />
                  </motion.div>
                </div>
                {/* Desktop: toggled grid */}
                <div className="hidden lg:block" data-testid="desktop-panels">
                  <BentoGrid panels={visiblePanels} />
                </div>
              </>
            )}
          </div>

          <ScenarioSandboxModal
            isOpen={scenarioModalOpen}
            onClose={() => setScenarioModalOpen(false)}
            profile={profile}
            currency={profile?.answers?.currency ?? 'THB'}
            locale={locale}
          />
        </div>

        {/* Alerts Sidebar - Desktop (xl+) */}
        <aside className="hidden w-80 flex-shrink-0 overflow-y-auto border-l border-[var(--gold-border-soft)] bg-[var(--bg-surface-1)] p-4 xl:block">
          <AlertsSidebar locale={locale} />
        </aside>
      </main>

      {/* Mobile bottom tab bar - swaps the single active panel */}
      <MobilePanelTabs
        activePanel={mobileActivePanel}
        onSelect={handleSelectPanel}
        onMore={() => setMobileMenuOpen(true)}
        locale={locale}
        alertCount={alertCount}
      />

      {/* Mobile Bottom Sheet Sidebar */}
      <div data-testid="mobile-sheet" className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transform rounded-t-2xl border-t bg-[var(--bg-base)]/95 p-4 backdrop-blur-xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ maxHeight: '82vh', overflowY: 'auto' }}>
        <button onClick={() => setMobileMenuOpen(false)} className="absolute -top-3 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--gold-border-soft)] bg-[var(--bg-base)]/80">
          <X className="h-5 w-5 text-[var(--text-muted)]" />
        </button>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-1)]">{locale === 'th' ? 'เมนู' : 'Menu'}</h3>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl border border-[var(--gold-border-strong)] bg-[var(--gold-base)]/10 p-3 text-left disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { setCriticalExpenseOpen(true); setMobileMenuOpen(false); }} disabled={commitmentLoading}>
            <span className="text-2xl">🎯</span>
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-1)] truncate">{locale === 'th' ? 'เลือก 1 อย่างลดในเดือนนี้' : 'Pick 1 to cut this month'}</p>
            </div>
          </button>
          <button
              data-testid="market-watch-trigger"
              className="flex w-full items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-left"
              onClick={() => { setMarketWatchOpen(true); setMobileMenuOpen(false); }}
            >
            <span className="text-2xl">📰</span>
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-1)] truncate">{locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Market Watch'}</p>
            </div>
          </button>
          <div className="pt-1">
            <AccountSwitcher locale={locale} />
          </div>
          <Link
            href="/accounts"
            onClick={() => setMobileMenuOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-left transition-colors hover:bg-sky-400/20"
          >
            <span className="text-2xl">🏦</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                {locale === 'th' ? 'จัดการบัญชีร่วมกัน' : 'Manage Accounts'}
              </p>
              <p className="text-[10px] text-white/50 leading-tight">
                {locale === 'th' ? 'แชร์บอร์ดกับครอบครัว เพื่อน หรือที่ทำงาน' : 'Share budget with family, friends, or work'}
              </p>
            </div>
          </Link>
          {PANEL_ORDER.map(panel => {
            const config = PANEL_CONFIG[panel];
            const isActive = mobileActivePanel === panel;
            return (
              <button
                key={panel}
                onClick={() => { setMobileActivePanel(panel); setMobileMenuOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  isActive ? 'border border-[var(--gold-border-soft)] bg-[var(--bg-surface-2)]' : 'bg-[var(--bg-surface-1)] hover:bg-[var(--bg-surface-2)]'
                }`}
              >
                <span className="text-xl">{config.icon}</span>
                <span className={`flex-1 text-left text-sm font-medium truncate ${isActive ? 'text-[var(--gold-bright)]' : 'text-[var(--text-2)]'}`}>{config.label[locale]}</span>
              </button>
            );
          })}
        </div>
      </div>

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
        size="2xl"
        title={locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Market Watch'}
      >
        <AlertsSidebar locale={locale} isModal={true} />
      </Modal>

      {/* Mobile Floating Action Button (FAB) for Quick Add Widget */}
      <div className="fixed bottom-20 right-4 z-30 lg:hidden">
        <Link
          href="/quick-add"
          aria-label={locale === 'th' ? 'เพิ่มรายการด่วน' : 'Quick Add Widget'}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-[0_0_24px_rgba(245,215,66,0.5)] transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-2xl font-black">+</span>
        </Link>
      </div>
    </div>
  );
}
