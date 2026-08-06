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
      <label className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
        {'Income Category'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IncomeCategory)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/50 text-white outline-none"
      >
        <option value="salary" className="bg-[#0a0a0a]">💵 {'Salary'}</option>
        <option value="freelance" className="bg-[#0a0a0a]">💻 {'Freelance'}</option>
        <option value="business" className="bg-[#0a0a0a]">🏢 {'Business'}</option>
        <option value="investments" className="bg-[#0a0a0a]">📈 {'Investments'}</option>
        <option value="gift" className="bg-[#0a0a0a]">🎁 {'Gift'}</option>
        <option value="refund" className="bg-[#0a0a0a]">🔄 {'Refund'}</option>
        <option value="other" className="bg-[#0a0a0a]">✨ {'Other'}</option>
      </select>
    </div>
  );
}
