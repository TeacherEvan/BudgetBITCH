// lib/utils/budget-alerts.ts
import type { ExpenseCategory, BudgetCategory } from '@/lib/types/budget';
import { formatCurrency } from '@/lib/utils/currency';

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  category: ExpenseCategory;
  message: string;
  actionable?: string;
  spent: number;
  limit: number;
  pct: number;
}

/** Generate budget alerts from expenses and budgets */
export function generateBudgetAlerts(
  budgets: BudgetCategory[],
  expenses: { category: ExpenseCategory; amount: number }[],
  locale: 'th' | 'en' = 'en'
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  
  // Calculate spending per category
  const spending = new Map<ExpenseCategory, number>();
  expenses.forEach(e => {
    if (e.amount > 0) {
      spending.set(e.category, (spending.get(e.category) || 0) + e.amount);
    }
  });
  
  budgets.forEach((budget) => {
    const spent = spending.get(budget.category) || 0;
    const limit = budget.monthlyLimit;
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    
    if (limit === 0) return; // No budget set
    
    const categoryLabel = getCategoryLabel(budget.category, locale);

    if (pct >= 100) {
      alerts.push({
        id: `alert-${budget.category}-critical`,
        type: 'critical',
        category: budget.category,
        message: locale === 'th'
          ? `${categoryLabel} เกินงบแล้ว (${formatCurrency(spent, locale)}/${formatCurrency(limit, locale)})`
          : `${categoryLabel} over budget (${formatCurrency(spent, locale)}/${formatCurrency(limit, locale)})`,
        actionable: locale === 'th'
          ? 'พิจารณาลดค่าใช้จ่ายหรือปรับงบประมาณ'
          : 'Consider reducing spending or adjusting budget',
        spent,
        limit,
        pct,
      });
    } else if (pct >= budget.alertAtPct) {
      alerts.push({
        id: `alert-${budget.category}-warning`,
        type: 'warning',
        category: budget.category,
        message: locale === 'th'
          ? `${categoryLabel} ใกล้ถึงขีดจำกัด (${Math.round(pct)}%)`
          : `${categoryLabel} approaching limit (${Math.round(pct)}%)`,
        actionable: locale === 'th'
          ? 'ติดตามค่าใช้จ่ายในหมวดนี้'
          : 'Monitor spending in this category',
        spent,
        limit,
        pct,
      });
    } else if (pct < 50 && spent > 0) {
      // Under budget - positive feedback
      alerts.push({
        id: `alert-${budget.category}-success`,
        type: 'success',
        category: budget.category,
        message: locale === 'th'
          ? `${categoryLabel} อยู่ในงบ (${Math.round(pct)}%)`
          : `${categoryLabel} on track (${Math.round(pct)}%)`,
        spent,
        limit,
        pct,
      });
    }
  });
  
  // Sort: critical first, then warning, then info, then success
  const typeOrder = { critical: 0, warning: 1, info: 2, success: 3 };
  alerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
  
  return alerts;
}

function getCategoryLabel(category: ExpenseCategory, locale: 'th' | 'en'): string {
  const labels: Record<ExpenseCategory, { th: string; en: string }> = {
    housing: { th: 'ที่อยู่อาศัย', en: 'Housing' },
    transport: { th: 'การเดินทาง', en: 'Transport' },
    food: { th: 'อาหาร', en: 'Food' },
    utilities: { th: 'ค่าสาธารณูปโภค', en: 'Utilities' },
    phone_internet: { th: 'โทรศัพท์/อินเตอร์เน็ต', en: 'Phone/Internet' },
    subscriptions: { th: 'สมัครสมาชิก', en: 'Subscriptions' },
    entertainment: { th: 'บันเทิง', en: 'Entertainment' },
    healthcare: { th: 'สุขภาพ', en: 'Healthcare' },
    insurance: { th: 'ประกันภัย', en: 'Insurance' },
    debt: { th: 'หนี้สิน', en: 'Debt' },
    savings: { th: 'เงินออม', en: 'Savings' },
    other: { th: 'อื่นๆ', en: 'Other' },
  };
  return labels[category][locale === 'th' ? 'th' : 'en'];
}

/** Get summary stats for budget overview */
export function getBudgetSummary(
  budgets: BudgetCategory[],
  expenses: { category: ExpenseCategory; amount: number }[]
): {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  savingsRate: number;
  categoriesOverBudget: number;
  categoriesNearLimit: number;
  categoriesOnTrack: number;
} {
  const spending = new Map<ExpenseCategory, number>();
  expenses.forEach(e => {
    if (e.amount > 0) {
      spending.set(e.category, (spending.get(e.category) || 0) + e.amount);
    }
  });
  
  let totalBudget = 0;
  let totalSpent = 0;
  let categoriesOverBudget = 0;
  let categoriesNearLimit = 0;
  let categoriesOnTrack = 0;
  
  budgets.forEach(budget => {
    if (budget.monthlyLimit === 0) return;
    
    totalBudget += budget.monthlyLimit;
    const spent = spending.get(budget.category) || 0;
    totalSpent += spent;
    const pct = (spent / budget.monthlyLimit) * 100;
    
    if (pct >= 100) categoriesOverBudget++;
    else if (pct >= budget.alertAtPct) categoriesNearLimit++;
    else categoriesOnTrack++;
  });
  
  const totalRemaining = totalBudget - totalSpent;
  const savingsRate = totalBudget > 0 ? ((totalRemaining / totalBudget) * 100) : 0;
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    savingsRate,
    categoriesOverBudget,
    categoriesNearLimit,
    categoriesOnTrack,
  };
}