// components/dashboard/panels/index.tsx
import { DailyDisposableHero } from '../daily-disposable-hero';
import { ExpenseTracker } from './expense-tracker';
import { IncomeInflowPanel } from './income-inflow-panel';
import { BudgetVisual } from './budget-visual';
import { BudgetAlerts } from './budget-alerts';
import { Bills } from './bills';
import { SavingsGoals } from './savings-goals';
import { NetWorth } from './net-worth';
import { Subscriptions } from './subscriptions';
import { EmergencyFund } from './emergency-fund';
import { DebtPayoff } from './debt-payoff';
import { CashFlowForecast } from './cash-flow-forecast';
import { BudgetVarianceGrid } from '../budget-variance-grid';
import { CashFlowProjectionCard } from '../cash-flow-projection-card';
import { CategoryPivotCard } from '../category-pivot-card';
import { BentoGrid, type PanelConfig } from '../bento-grid';
import type { WizardProfile } from '@/lib/types/budget';

export const buildPanels = (locale: 'th' | 'en', onSetup?: () => void): PanelConfig[] => [
  { id: 'daily_budget', title: 'Daily Budget', children: <DailyDisposableHero locale={locale} onSetup={onSetup} /> },
  { id: 'expenses', title: 'Expenses', children: <ExpenseTracker /> },
  { id: 'inflow', title: 'Income Inflow', children: <IncomeInflowPanel /> },
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

export const buildExcelPanels = (locale: 'th' | 'en', profile: WizardProfile | null): PanelConfig[] => [
  { id: 'variance', title: 'Variance Grid', children: <BudgetVarianceGrid locale={locale} currency={profile?.answers?.currency ?? 'THB'} /> },
  { id: 'cashflow', title: '30D Cash Flow', children: <CashFlowProjectionCard locale={locale} currency={profile?.answers?.currency ?? 'THB'} currentCashBalance={35000} monthlyIncome={profile?.answers?.income ?? 45000} /> },
  { id: 'pivot', title: '50/30/20 Matrix', children: <CategoryPivotCard locale={locale} currency={profile?.answers?.currency ?? 'THB'} profile={profile} /> },
];

export { BentoGrid, type PanelConfig };