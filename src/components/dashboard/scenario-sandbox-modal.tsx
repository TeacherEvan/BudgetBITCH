// src/components/dashboard/scenario-sandbox-modal.tsx
'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatMoney, type CurrencyCode } from '@/lib/utils/currency';
import type { WizardProfile } from '@/lib/types/budget';
import {
  SlidersHorizontal,
  TrendingUp,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ScenarioSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: WizardProfile | null;
  currency?: CurrencyCode | null;
  locale?: 'th' | 'en';
  onApplyScenario?: (updatedProfile: Partial<WizardProfile>) => void;
}

const PRESETS = [
  {
    id: 'defensive',
    nameEn: 'Shield & Protect',
    nameTh: 'ตั้งรับ (เงินเฟ้อ +10%)',
    descEn: 'Income -10%, Fixed Expenses +10%',
    incomeMod: -0.1,
    fixedMod: 0.1,
    variableMod: 0,
    icon: ShieldAlert,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    id: 'fire',
    nameEn: 'F.I.R.E. Speedrun',
    nameTh: 'เร่งออม F.I.R.E.',
    descEn: 'Wants -35%, Savings +40%',
    incomeMod: 0,
    fixedMod: 0,
    variableMod: -0.35,
    icon: Zap,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    id: 'hustle',
    nameEn: 'Side Hustle Surge',
    nameTh: 'เพิ่มรายได้ +25%',
    descEn: 'Income +25%',
    incomeMod: 0.25,
    fixedMod: 0,
    variableMod: 0.05,
    icon: Sparkles,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    id: 'stress',
    nameEn: 'Income Shock Test',
    nameTh: 'กรณีฉุกเฉิน (รายได้ -30%)',
    descEn: 'Income -30%',
    incomeMod: -0.3,
    fixedMod: 0,
    variableMod: -0.2,
    icon: SlidersHorizontal,
    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
];

export function ScenarioSandboxModal({
  isOpen,
  onClose,
  profile,
  currency = 'THB',
  locale = 'en',
  onApplyScenario,
}: ScenarioSandboxModalProps) {
  const isTh = locale === 'th';
  const baseIncome = profile?.answers?.income ?? 45000;
  const baseFixed = (profile?.answers?.income ?? 45000) * 0.45;
  const baseVariable = (profile?.answers?.income ?? 45000) * 0.35;

  const [income, setIncome] = useState(baseIncome);
  const [fixedExpenses, setFixedExpenses] = useState(baseFixed);
  const [variableExpenses, setVariableExpenses] = useState(baseVariable);
  const [savingsGoalTarget, setSavingsGoalTarget] = useState(100000);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setActivePreset(preset.id);
    setIncome(Math.round(baseIncome * (1 + preset.incomeMod)));
    setFixedExpenses(Math.round(baseFixed * (1 + preset.fixedMod)));
    setVariableExpenses(Math.round(baseVariable * (1 + preset.variableMod)));
  };

  const resetSliders = () => {
    setActivePreset(null);
    setIncome(baseIncome);
    setFixedExpenses(baseFixed);
    setVariableExpenses(baseVariable);
  };

  const calculations = useMemo(() => {
    const totalOutflow = fixedExpenses + variableExpenses;
    const netMonthlySurplus = income - totalOutflow;
    const savingsRate = income > 0 ? (netMonthlySurplus / income) * 100 : 0;
    const emergencyRunwayMonths = totalOutflow > 0 ? (income * 3) / totalOutflow : 0;
    const monthsToTargetGoal = netMonthlySurplus > 0 ? Math.ceil(savingsGoalTarget / netMonthlySurplus) : Infinity;

    // 12-month projection data points
    const projection = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      balance: Math.max(0, Math.round(netMonthlySurplus * (i + 1))),
    }));

    return {
      totalOutflow,
      netMonthlySurplus,
      savingsRate,
      emergencyRunwayMonths,
      monthsToTargetGoal,
      projection,
    };
  }, [income, fixedExpenses, variableExpenses, savingsGoalTarget]);

  const maxVal = Math.max(1, ...calculations.projection.map(p => p.balance));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isTh ? '📊 What-If Scenario Sandbox (Excel Goal Seek)' : '📊 What-If Scenario Sandbox (Excel Goal Seek)'}
      description={
        isTh
          ? 'จำลองสถานการณ์การเงิน ปรับรายได้/รายจ่ายแบบเรียลไทม์ คำนวณเงินออมล่วงหน้า 12 เดือน'
          : 'Simulate financial scenarios, adjust income/spending in real-time, and calculate 12-month wealth growth.'
      }
      size="lg"
    >
      <div className="space-y-6 pt-2">
        {/* Preset Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
            {isTh ? 'เลือกสถานการณ์จำลองสำเร็จรูป' : 'Quick Scenario Presets'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map(p => {
              const Icon = p.icon;
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                    isActive
                      ? `${p.color} ring-2 ring-amber-400`
                      : 'border-white/10 bg-white/5 hover:border-white/20 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <p className="text-xs font-bold leading-tight">{isTh ? p.nameTh : p.nameEn}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{p.descEn}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid gap-4 sm:grid-cols-3 bg-neutral-900/60 p-4 rounded-2xl border border-white/10">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-emerald-400">{isTh ? 'รายได้ประจำเดือน' : 'Monthly Income'}</span>
              <span className="text-white font-bold">{formatMoney(income, currency, locale)}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={250000}
              step={1000}
              value={income}
              onChange={e => {
                setActivePreset(null);
                setIncome(Number(e.target.value));
              }}
              className="w-full accent-emerald-400 bg-white/10 rounded-lg h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-rose-400">{isTh ? 'รายจ่ายจำเป็น (Needs)' : 'Fixed Needs'}</span>
              <span className="text-white font-bold">{formatMoney(fixedExpenses, currency, locale)}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={150000}
              step={1000}
              value={fixedExpenses}
              onChange={e => {
                setActivePreset(null);
                setFixedExpenses(Number(e.target.value));
              }}
              className="w-full accent-rose-400 bg-white/10 rounded-lg h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-amber-400">{isTh ? 'รายจ่ายผันแปร (Wants)' : 'Discretionary Wants'}</span>
              <span className="text-white font-bold">{formatMoney(variableExpenses, currency, locale)}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={variableExpenses}
              onChange={e => {
                setActivePreset(null);
                setVariableExpenses(Number(e.target.value));
              }}
              className="w-full accent-amber-400 bg-white/10 rounded-lg h-2"
            />
          </div>
        </div>

        {/* Real-Time Goal Seek Metrics */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[11px] text-white/60">{isTh ? 'กระแสเงินสดคงเหลือ/เดือน' : 'Net Monthly Cash Flow'}</p>
            <p
              className={`text-lg font-bold mt-0.5 ${
                calculations.netMonthlySurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatMoney(calculations.netMonthlySurplus, currency, locale)}
            </p>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[11px] text-white/60">{isTh ? 'อัตราการออม' : 'Savings Rate'}</p>
            <p className="text-lg font-bold text-amber-400 mt-0.5">{calculations.savingsRate.toFixed(1)}%</p>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[11px] text-white/60">{isTh ? 'ระยะเวลาอยู่รอด' : 'Runway Buffer'}</p>
            <p className="text-lg font-bold text-cyan-400 mt-0.5">
              {calculations.emergencyRunwayMonths.toFixed(1)} {isTh ? 'เดือน' : 'mos'}
            </p>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[11px] text-white/60">{isTh ? 'เป้าหมาย 100K THB' : 'Time to 100K Goal'}</p>
            <p className="text-lg font-bold text-purple-400 mt-0.5">
              {calculations.monthsToTargetGoal === Infinity
                ? '∞'
                : `${calculations.monthsToTargetGoal} ${isTh ? 'เดือน' : 'mos'}`}
            </p>
          </div>
        </div>

        {/* 12-Month Projected Growth Graph */}
        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {isTh ? 'ประมาณการการเติบโตเงินออม 12 เดือน' : '12-Month Projected Wealth Growth'}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              +
              {formatMoney(
                calculations.projection[calculations.projection.length - 1]?.balance ?? 0,
                currency,
                locale
              )}
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="flex items-end gap-1.5 h-24 pt-4 border-b border-white/10 px-1">
            {calculations.projection.map(p => {
              const heightPct = Math.max(8, Math.round((p.balance / maxVal) * 100));
              return (
                <div key={p.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-300"
                  />
                  <span className="text-[9px] text-white/40">M{p.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={resetSliders} className="text-xs text-white/60 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            {isTh ? 'รีเซ็ตเป็นค่าเริ่มต้น' : 'Reset Sliders'}
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {isTh ? 'ปิด' : 'Close'}
            </Button>
            {onApplyScenario && (
              <Button
                onClick={() => {
                  if (profile?.answers) {
                    onApplyScenario({
                      answers: {
                        ...profile.answers,
                        income,
                        rent: Math.round(fixedExpenses * 0.5),
                        entertainment: Math.round(variableExpenses * 0.5),
                      },
                    });
                  }
                  onClose();
                }}
                className="bg-amber-400 text-black font-semibold hover:bg-amber-300"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isTh ? 'นำสถานการณ์นี้ไปใช้กับงบจริง' : 'Apply to My Budget'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
