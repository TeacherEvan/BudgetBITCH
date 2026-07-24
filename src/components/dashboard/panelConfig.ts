// components/dashboard/panelConfig.ts
export type PanelKey = 
  | 'daily_budget' 
  | 'expenses' 
  | 'inflow' 
  | 'budget' 
  | 'budgetAlerts' 
  | 'bills' 
  | 'goals' 
  | 'netWorth' 
  | 'subscriptions' 
  | 'emergency' 
  | 'debt' 
  | 'forecast';

export const PANEL_CONFIG: Record<PanelKey, { label: { th: string; en: string }; icon: string }> = {
  daily_budget: { label: { th: 'งบประมาณรายวัน', en: 'Daily Budget' }, icon: '📅' },
  expenses: { label: { th: 'ค่าใช้จ่าย', en: 'Expenses' }, icon: '💸' },
  inflow: { label: { th: 'รายรับ', en: 'Inflow / Income' }, icon: '💵' },
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

export const PANEL_ORDER: PanelKey[] = [
  'daily_budget', 
  'expenses', 
  'inflow', 
  'budget', 
  'budgetAlerts', 
  'bills', 
  'goals', 
  'netWorth', 
  'subscriptions', 
  'emergency', 
  'debt', 
  'forecast'
];

export type ExcelTab = 'standard' | 'variance' | 'cashflow' | 'pivot';

export const EXCEL_TABS: { key: ExcelTab; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'standard', label: 'Standard Dashboard', icon: '📊', color: 'text-black', bg: 'bg-amber-400' },
  { key: 'variance', label: 'Excel Variance Grid', icon: '✨', color: 'text-black', bg: 'bg-emerald-400' },
  { key: 'cashflow', label: '30D Cash Flow', icon: '📅', color: 'text-black', bg: 'bg-amber-400' },
  { key: 'pivot', label: '50/30/20 Matrix', icon: '🧩', color: 'text-black', bg: 'bg-cyan-400' },
];

export const createPanelConfigs = (
  locale: 'th' | 'en',
  onSetup?: () => void
) => {
  // Lazy import to avoid circular deps
  return {
    daily_budget: { id: 'daily_budget', title: 'Daily Budget', component: 'DailyDisposableHero', props: { locale, onSetup } },
    expenses: { id: 'expenses', title: 'Expenses', component: 'ExpenseTracker', props: {} },
    inflow: { id: 'inflow', title: 'Income Inflow', component: 'IncomeInflowPanel', props: {} },
    budget: { id: 'budget', title: 'Budget', component: 'BudgetVisual', props: {} },
    budgetAlerts: { id: 'budgetAlerts', title: 'Budget Alerts', component: 'BudgetAlerts', props: {} },
    bills: { id: 'bills', title: 'Bills', component: 'Bills', props: {} },
    goals: { id: 'goals', title: 'Goals', component: 'SavingsGoals', props: {} },
    netWorth: { id: 'netWorth', title: 'Net Worth', component: 'NetWorth', props: {} },
    subscriptions: { id: 'subscriptions', title: 'Subscriptions', component: 'Subscriptions', props: {} },
    emergency: { id: 'emergency', title: 'Emergency', component: 'EmergencyFund', props: {} },
    debt: { id: 'debt', title: 'Debt', component: 'DebtPayoff', props: {} },
    forecast: { id: 'forecast', title: 'Forecast', component: 'CashFlowForecast', props: {} },
  };
};