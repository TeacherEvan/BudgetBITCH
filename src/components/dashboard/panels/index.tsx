// components/dashboard/panels/index.tsx
import dynamic from 'next/dynamic';
import { DailyDisposableHero } from '../daily-disposable-hero';
import { SpendingPanel } from './spending-panel';
import { BentoGrid, type PanelConfig } from '../bento-grid';

// Lazy load non-default panels to prevent bundle bloat on initial dashboard mount
const IncomeInflowPanel = dynamic(() => import('./income-inflow-panel').then((m) => m.IncomeInflowPanel), { ssr: false });
const BudgetAlerts = dynamic(() => import('./budget-alerts').then((m) => m.BudgetAlerts), { ssr: false });
const Bills = dynamic(() => import('./bills').then((m) => m.Bills), { ssr: false });
const SavingsGoals = dynamic(() => import('./savings-goals').then((m) => m.SavingsGoals), { ssr: false });
const NetWorth = dynamic(() => import('./net-worth').then((m) => m.NetWorth), { ssr: false });
const Subscriptions = dynamic(() => import('./subscriptions').then((m) => m.Subscriptions), { ssr: false });
const EmergencyFund = dynamic(() => import('./emergency-fund').then((m) => m.EmergencyFund), { ssr: false });
const DebtPayoff = dynamic(() => import('./debt-payoff').then((m) => m.DebtPayoff), { ssr: false });
const CashFlowForecast = dynamic(() => import('./cash-flow-forecast').then((m) => m.CashFlowForecast), { ssr: false });

export const buildPanels = (locale: string, onSetup?: () => void): PanelConfig[] => [
  { id: 'daily_budget', title: 'Daily Budget', children: <DailyDisposableHero locale={locale} onSetup={onSetup} /> },
  { id: 'spending', title: 'Spending', children: <SpendingPanel /> },
  { id: 'inflow', title: 'Income Inflow', children: <IncomeInflowPanel /> },
  { id: 'budgetAlerts', title: 'Budget Alerts', children: <BudgetAlerts /> },
  { id: 'bills', title: 'Bills', children: <Bills /> },
  { id: 'goals', title: 'Goals', children: <SavingsGoals /> },
  { id: 'netWorth', title: 'Net Worth', children: <NetWorth /> },
  { id: 'subscriptions', title: 'Subscriptions', children: <Subscriptions /> },
  { id: 'emergency', title: 'Emergency', children: <EmergencyFund /> },
  { id: 'debt', title: 'Debt', children: <DebtPayoff /> },
  { id: 'forecast', title: 'Forecast', children: <CashFlowForecast /> },
];

export { BentoGrid, type PanelConfig };