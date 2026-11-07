// src/modules/psychology/runway-calculator.ts
//
// Pure domain logic for macroeconomic financial psychology & perspective analytics.
// Zero React, zero I/O. Computes liquid runway, wealth velocity,
// CFPB-aligned financial health scores, and what-if horizon adjustments.

export type RunwayStatus = 'critical' | 'vulnerable' | 'secure' | 'abundant';

export interface RunwayResult {
  months: number;
  status: RunwayStatus;
  label: string;
  advice: string;
}

export type WealthVelocityTier = 'stagnant' | 'building' | 'accelerating' | 'escape_velocity';

export interface WealthVelocityResult {
  velocityPercent: number;
  tier: WealthVelocityTier;
  label: string;
  description: string;
}

export interface FinancialHealthIndexParams {
  liquidSavings: number;
  monthlyIncome: number;
  monthlyFixedBurn: number;
  monthlyDiscretionarySpend: number;
  monthlyDebtPayment: number;
  totalDebtBalance: number;
  monthlySavingsContribution: number;
}

export interface FinancialHealthScore {
  overallScore: number; // 0 - 100
  tier: 'vulnerable' | 'coping' | 'healthy' | 'thriving';
  subScores: {
    liquidity: number; // 0 - 25
    debtHealth: number; // 0 - 25
    wealthVelocity: number; // 0 - 25
    budgetFlexibility: number; // 0 - 25
  };
  insights: string[];
}

export interface HorizonSimulationResult {
  currentRunwayMonths: number;
  simulatedRunwayMonths: number;
  monthsGained: number;
  annualWealthDelta: number;
  newFixedBurn: number;
}

/**
 * Calculates liquid runway in months.
 * Runway = Liquid Savings / Monthly Fixed Burn Rate.
 */
export function calculateRunway(liquidSavings: number, monthlyFixedBurn: number): RunwayResult {
  const safeSavings = Math.max(0, liquidSavings);
  const safeBurn = Math.max(0, monthlyFixedBurn);

  if (safeBurn <= 0) {
    if (safeSavings > 0) {
      return {
        months: 999,
        status: 'abundant',
        label: 'Infinite Runway (Zero Fixed Obligations)',
        advice: 'You have no fixed obligations. Every earned dollar can accelerate your wealth.',
      };
    }
    return {
      months: 0,
      status: 'critical',
      label: 'Zero Runway',
      advice: 'Set your recurring fixed bills to establish an accurate survival runway.',
    };
  }

  const rawMonths = safeSavings / safeBurn;
  const months = Math.round(rawMonths * 10) / 10;

  if (months < 1) {
    return {
      months,
      status: 'critical',
      label: 'Critical Runway (< 1 Month)',
      advice: 'You are living paycheck-to-paycheck on fixed commitments. Focus on establishing a $1,000 starter buffer before investing.',
    };
  }
  if (months < 3) {
    return {
      months,
      status: 'vulnerable',
      label: 'Vulnerable Buffer (1–3 Months)',
      advice: 'A sudden shock (medical, car repair) could push you into high-interest debt. Aim for a 3-month foundation.',
    };
  }
  if (months < 6) {
    return {
      months,
      status: 'secure',
      label: 'Solid Safety Net (3–6 Months)',
      advice: 'Your foundation is strong. You have peace of mind to navigate job transitions or life emergencies.',
    };
  }
  return {
    months,
    status: 'abundant',
    label: 'Abundant Freedom (6+ Months)',
    advice: 'Exceptional financial resilience. You have complete leverage over career and lifestyle decisions.',
  };
}

/**
 * Calculates Wealth Velocity: percentage of gross/net income directed into net-worth-building
 * vehicles (savings goals, emergency fund, and debt principal reduction) rather than evaporated.
 */
export function calculateWealthVelocity(
  monthlyIncome: number,
  monthlySavings: number,
  monthlyDebtPrincipal: number
): WealthVelocityResult {
  const safeIncome = Math.max(0, monthlyIncome);
  const totalWealthAllocation = Math.max(0, monthlySavings) + Math.max(0, monthlyDebtPrincipal);

  if (safeIncome <= 0) {
    return {
      velocityPercent: 0,
      tier: 'stagnant',
      label: '0% Velocity',
      description: 'Configure your active income to measure wealth accumulation speed.',
    };
  }

  const ratio = Math.min(1, totalWealthAllocation / safeIncome);
  const velocityPercent = Math.round(ratio * 100);

  if (velocityPercent < 10) {
    return {
      velocityPercent,
      tier: 'stagnant',
      label: 'Slow Velocity (<10%)',
      description: 'Over 90% of cash flow is consumed by living costs. Prioritize automated transfers on payday.',
    };
  }
  if (velocityPercent < 20) {
    return {
      velocityPercent,
      tier: 'building',
      label: 'Building Momentum (10–19%)',
      description: 'Solid foundation. You are building equity, but small lifestyle leaks may slow long-term compound growth.',
    };
  }
  if (velocityPercent < 35) {
    return {
      velocityPercent,
      tier: 'accelerating',
      label: 'Accelerating Wealth (20–34%)',
      description: 'Exceeding standard 50/30/20 guidelines. Your money is working efficiently towards freedom.',
    };
  }
  return {
    velocityPercent,
    tier: 'escape_velocity',
    label: 'Escape Velocity (35%+)',
    description: 'Phenomenal wealth creation rate. You are on track for accelerated financial independence.',
  };
}

/**
 * CFPB-aligned Holistic Financial Well-Being Index (0–100).
 * Four 25-point pillars:
 * 1. Liquidity Pillar (Emergency coverage vs 3-month standard)
 * 2. Debt Health Pillar (Debt-to-income & minimum interest burden)
 * 3. Wealth Velocity Pillar (Savings & principal rate)
 * 4. Cost Rigidity / Budget Flexibility Pillar (Fixed burn / Income ratio)
 */
export function calculateFinancialHealthIndex(params: FinancialHealthIndexParams): FinancialHealthScore {
  const income = Math.max(1, params.monthlyIncome);
  const fixed = Math.max(0, params.monthlyFixedBurn);
  const liquid = Math.max(0, params.liquidSavings);
  const debtPayment = Math.max(0, params.monthlyDebtPayment);
  const savings = Math.max(0, params.monthlySavingsContribution);

  const insights: string[] = [];

  // 1. Liquidity (0 to 25 pts) — 3 months fixed burn is full points
  const targetReserve = fixed > 0 ? fixed * 3 : income * 1.5;
  const liquidityRatio = targetReserve > 0 ? Math.min(1, liquid / targetReserve) : 0;
  const liquidityScore = Math.round(liquidityRatio * 25);
  if (liquidityScore < 10) {
    insights.push('Low cash buffer increases vulnerability to unexpected shocks.');
  } else if (liquidityScore >= 20) {
    insights.push('Emergency reserve is well-shielded against disruptions.');
  }

  // 2. Debt Health (0 to 25 pts) — Debt-to-income ratio (DTI)
  const dti = debtPayment / income;
  let debtScore = 25;
  if (dti > 0.45) {
    debtScore = 5;
    insights.push('Debt service consumes over 45% of income, creating heavy cash-flow drag.');
  } else if (dti > 0.3) {
    debtScore = 12;
    insights.push('Debt obligations are elevated. Consider focused snowball/avalanche payoffs.');
  } else if (dti > 0.1) {
    debtScore = 19;
    insights.push('Manageable debt load with controlled interest costs.');
  } else {
    insights.push('Zero or minimal debt burden gives high strategic freedom.');
  }

  // 3. Wealth Velocity (0 to 25 pts) — Savings + Principal debt reduction / Income
  const velocityRatio = (savings + debtPayment) / income;
  let velocityScore = Math.round(Math.min(1, velocityRatio / 0.3) * 25);
  velocityScore = Math.max(0, Math.min(25, velocityScore));
  if (velocityScore >= 20) {
    insights.push('Superb wealth accumulation velocity; you save or build equity rapidly.');
  } else if (velocityScore < 8) {
    insights.push('Low capital retention rate. Most earnings are consumed immediately.');
  }

  // 4. Budget Flexibility / Rigidity (0 to 25 pts) — Fixed costs vs Income
  const fixedRatio = fixed / income;
  let flexibilityScore = 25;
  if (fixedRatio > 0.7) {
    flexibilityScore = 5;
    insights.push('Fixed expenses exceed 70% of income, creating severe budget rigidity.');
  } else if (fixedRatio > 0.5) {
    flexibilityScore = 14;
    insights.push('Fixed expenses are standard (~50–70%). Room exists to trim recurring subscriptions.');
  } else {
    insights.push('Low fixed overhead affords massive agility during market or life shifts.');
  }

  const overallScore = Math.min(100, Math.max(0, liquidityScore + debtScore + velocityScore + flexibilityScore));

  let tier: FinancialHealthScore['tier'] = 'vulnerable';
  if (overallScore >= 80) tier = 'thriving';
  else if (overallScore >= 60) tier = 'healthy';
  else if (overallScore >= 40) tier = 'coping';

  return {
    overallScore,
    tier,
    subScores: {
      liquidity: liquidityScore,
      debtHealth: debtScore,
      wealthVelocity: velocityScore,
      budgetFlexibility: flexibilityScore,
    },
    insights,
  };
}

import { roundCurrency1dp } from '@/lib/utils/currency';

/**
 * Interactive Horizon What-If Simulator:
 * Quantifies how trimming recurring fixed costs or boosting monthly savings
 * directly multiplies runway and adds annual net worth equity.
 */
export function simulateHorizonAdjustments(
  currentSavings: number,
  monthlyFixedBurn: number,
  deltaMonthlySavings: number,
  deltaFixedReduction: number
): HorizonSimulationResult {
  const safeBurn = Math.max(1, monthlyFixedBurn);
  const currentRunway = roundCurrency1dp(Math.max(0, currentSavings) / safeBurn);

  const newFixedBurn = Math.max(1, safeBurn - Math.max(0, deltaFixedReduction));
  // In 12 months, the extra savings accumulates
  const projectedExtraSavingsInOneYear = Math.max(0, deltaMonthlySavings) * 12 + Math.max(0, deltaFixedReduction) * 12;
  const newProjectedSavings = Math.max(0, currentSavings) + projectedExtraSavingsInOneYear;

  const simulatedRunway = roundCurrency1dp(newProjectedSavings / newFixedBurn);
  const monthsGained = Math.max(0, roundCurrency1dp(simulatedRunway - currentRunway));
  const annualWealthDelta = projectedExtraSavingsInOneYear;

  return {
    currentRunwayMonths: currentRunway,
    simulatedRunwayMonths: simulatedRunway,
    monthsGained,
    annualWealthDelta,
    newFixedBurn,
  };
}
