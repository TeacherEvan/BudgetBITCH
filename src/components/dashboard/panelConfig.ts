// components/dashboard/panelConfig.ts
export type PanelKey = 
  | 'daily_budget' 
  | 'spending' 
  | 'inflow' 
  | 'budgetAlerts' 
  | 'bills' 
  | 'goals' 
  | 'netWorth' 
  | 'subscriptions' 
  | 'emergency' 
  | 'debt' 
  | 'forecast';

export const PANEL_CONFIG: Record<PanelKey, { label: { en: string }; icon: string }> = {
  daily_budget: { label: { en: 'Daily Budget' }, icon: '📅' },
  spending: { label: { en: 'Spending' }, icon: '💸' },
  inflow: { label: { en: 'Inflow / Income' }, icon: '💵' },
  budgetAlerts: { label: { en: 'Budget Alerts' }, icon: '🔔' },
  bills: { label: { en: 'Bills' }, icon: '📋' },
  goals: { label: { en: 'Goals' }, icon: '🎯' },
  netWorth: { label: { en: 'Net Worth' }, icon: '💰' },
  subscriptions: { label: { en: 'Subscriptions' }, icon: '📺' },
  emergency: { label: { en: 'Emergency' }, icon: '🛡️' },
  debt: { label: { en: 'Debt' }, icon: '📉' },
  forecast: { label: { en: 'Forecast' }, icon: '🔮' },
};

export const PANEL_ORDER: PanelKey[] = [
  'daily_budget', 
  'spending', 
  'inflow', 
  'budgetAlerts', 
  'bills', 
  'goals', 
  'netWorth', 
  'subscriptions', 
  'emergency', 
  'debt', 
  'forecast'
];