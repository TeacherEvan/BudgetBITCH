// components/dashboard/panels/budget-visual.tsx
'use client';

import { useExpenses, useBudgets, useWizardProfile } from '@/hooks/use-local-db';
import { Card } from '@/components/ui/card';
import { useCurrency } from '@/hooks/use-currency';
import { format } from 'date-fns';
import { useDisplayPrefs } from '@/hooks/use-display-prefs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
  PieChart, Pie, Legend,
} from 'recharts';

const CATEGORIES = [
  { value: 'housing', label: { th: 'ที่อยู่อาศัย', en: 'Housing' } },
  { value: 'transport', label: { th: 'การเดินทาง', en: 'Transport' } },
  { value: 'food', label: { th: 'อาหาร', en: 'Food' } },
  { value: 'utilities', label: { th: 'ค่าสาธารณูปโภค', en: 'Utilities' } },
  { value: 'phone_internet', label: { th: 'โทรศัพท์/อินเตอร์เน็ต', en: 'Phone/Internet' } },
  { value: 'subscriptions', label: { th: 'สมัครสมาชิก', en: 'Subscriptions' } },
  { value: 'entertainment', label: { th: 'บันเทิง', en: 'Entertainment' } },
  { value: 'healthcare', label: { th: 'สุขภาพ', en: 'Healthcare' } },
  { value: 'insurance', label: { th: 'ประกันภัย', en: 'Insurance' } },
  { value: 'debt', label: { th: 'หนี้สิน', en: 'Debt' } },
  { value: 'savings', label: { th: 'เงินออม', en: 'Savings' } },
  { value: 'other', label: { th: 'อื่นๆ', en: 'Other' } },
];

interface BudgetVisualProps {
  locale?: 'th' | 'en';
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
}

interface Budget {
  category: string;
  monthlyLimit: number;
  alertAtPct: number;
}

export function BudgetVisual({ locale = 'en' }: BudgetVisualProps) {
  const formatCurrency = useCurrency();
  const { graphType } = useDisplayPrefs();

  const { expenses: rawExpenses } = useExpenses();
  const { budgets: rawBudgets } = useBudgets();
  const { profile } = useWizardProfile();

  const expenses = rawExpenses as Expense[];
  const budgets = rawBudgets as Budget[];

  // Bind to the user's actual wizard profile income; fall back to 50000 only
  // when no profile exists (e.g. before the setup wizard is completed).
  const monthlyIncome = profile?.answers?.income || 50000;
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  const monthlyExpenses = expenses
    .filter((e: Expense) => format(new Date(e.date), 'yyyy-MM') === currentMonth)
    .reduce((acc: Record<string, number>, e: Expense) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

  const budgetData = CATEGORIES.map((cat) => {
    const spent = monthlyExpenses[cat.value] || 0;
    const budget = budgets.find((b: Budget) => b.category === cat.value)?.monthlyLimit || 0;
    return {
      category: cat.label[locale === 'th' ? 'th' : 'en'],
      spent,
      budget,
      pct: budget > 0 ? Math.min(100, (spent / budget) * 100) : 0,
    };
  }).filter((d) => d.budget > 0 || d.spent > 0);

  const totalIncome = monthlyIncome;
  const totalExpenses = Object.values(monthlyExpenses).reduce((a: number, b: number) => a + b, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : '0';

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">📊 Budget Overview</h3>
        <div className="text-right">
          <p className="text-sm text-white/60">This Month</p>
          <p className="font-mono text-xl text-white">{formatCurrency(totalIncome - totalExpenses, 'en')}</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[120px] bg-amber-400/10 border border-amber-400/30 rounded-xl p-3">
            <p className="text-xs text-amber-400 font-medium">Income</p>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{formatCurrency(totalIncome, 'en')}</p>
          </div>
          <div className="flex-1 min-w-[120px] bg-rose-400/10 border border-rose-400/30 rounded-xl p-3">
            <p className="text-xs text-rose-400 font-medium">Expenses</p>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{formatCurrency(totalExpenses, 'en')}</p>
          </div>
          <div className="flex-1 min-w-[120px] bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-3">
            <p className="text-xs text-emerald-400 font-medium">Savings Rate</p>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{savingsRate}%</p>
          </div>
        </div>

        {budgetData.length > 0 && (
          <div className="h-64" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              {(graphType === 'pie' || graphType === 'donut') ? (
                <PieChart>
                  <Pie
                    data={budgetData.map((d, i) => ({ name: d.category, value: d.spent, fill: COLORS[i % COLORS.length] }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={graphType === 'donut' ? 42 : 0}
                    strokeWidth={0}
                  >
                    {budgetData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#ffffff80' }} />
                </PieChart>
              ) : graphType === 'line' ? (
                <LineChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: '#ffffff80', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="spent" stroke="#E8B020" strokeWidth={2} dot={{ fill: '#E8B020', r: 4 }} />
                  {budgetData.some(d => d.budget > 0) && (
                    <Line type="monotone" dataKey="budget" stroke="#ffffff40" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                  )}
                </LineChart>
              ) : (
                <BarChart data={budgetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis type="number" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }} />
                  <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                    {budgetData.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-2 mt-4">
          {budgetData.map((item: { category: string; spent: number; budget: number; pct: number }, index: number) => (
            <div key={item.category} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.category}</p>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, item.pct)}%`,
                      backgroundColor: item.pct > 100 ? '#ef4444' : COLORS[index % COLORS.length]
                    }} 
                  />
                </div>
              </div>
              <span className="text-sm font-mono text-white/80 w-28 text-right">
                {item.budget > 0 ? `${formatCurrency(item.spent, 'en')} / ${formatCurrency(item.budget, 'en')}` : formatCurrency(item.spent, 'en')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}// End of file
