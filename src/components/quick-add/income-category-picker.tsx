'use client';

import type { IncomeCategory } from '@/lib/types/budget';

export function IncomeCategoryPicker({
  value,
  onChange,
}: {
  value: IncomeCategory;
  onChange: (v: IncomeCategory) => void;
}) {
  return (
    <div className="mb-6 space-y-1.5">
      <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
        {'Income Category'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IncomeCategory)}
        className="w-full min-h-[44px] px-4 py-3 bg-[var(--surface-layer-3)] border border-[var(--border-neutral)] rounded-2xl text-sm focus:outline-none focus:border-emerald-500/50 text-[var(--text-1)] outline-none shadow-[var(--specular-top-subtle)]"
      >
        <option value="salary" className="bg-[#110D01] text-[var(--text-1)]">💵 {'Salary'}</option>
        <option value="freelance" className="bg-[#110D01] text-[var(--text-1)]">💻 {'Freelance'}</option>
        <option value="business" className="bg-[#110D01] text-[var(--text-1)]">🏢 {'Business'}</option>
        <option value="investments" className="bg-[#110D01] text-[var(--text-1)]">📈 {'Investments'}</option>
        <option value="gift" className="bg-[#110D01] text-[var(--text-1)]">🎁 {'Gift'}</option>
        <option value="refund" className="bg-[#110D01] text-[var(--text-1)]">🔄 {'Refund'}</option>
        <option value="other" className="bg-[#110D01] text-[var(--text-1)]">✨ {'Other'}</option>
      </select>
    </div>
  );
}
