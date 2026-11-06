// src/modules/psychology/runway-calculator.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateRunway,
  calculateWealthVelocity,
  calculateFinancialHealthIndex,
  simulateHorizonAdjustments,
} from './runway-calculator';

describe('runway-calculator', () => {
  describe('calculateRunway', () => {
    it('returns zero runway when fixed burn is positive but liquid savings is 0', () => {
      const res = calculateRunway(0, 3000);
      expect(res.months).toBe(0);
      expect(res.status).toBe('critical');
    });

    it('returns critical status when runway is under 1 month', () => {
      const res = calculateRunway(1500, 3000);
      expect(res.months).toBe(0.5);
      expect(res.status).toBe('critical');
    });

    it('returns vulnerable status for 1–3 months of buffer', () => {
      const res = calculateRunway(6000, 3000);
      expect(res.months).toBe(2);
      expect(res.status).toBe('vulnerable');
    });

    it('returns secure status for 3–6 months', () => {
      const res = calculateRunway(12000, 3000);
      expect(res.months).toBe(4);
      expect(res.status).toBe('secure');
    });

    it('returns abundant status for 6+ months', () => {
      const res = calculateRunway(24000, 3000);
      expect(res.months).toBe(8);
      expect(res.status).toBe('abundant');
    });

    it('handles zero fixed burn gracefully', () => {
      const res = calculateRunway(1000, 0);
      expect(res.status).toBe('abundant');
      expect(res.months).toBe(999);
    });
  });

  describe('calculateWealthVelocity', () => {
    it('calculates stagnant tier for < 10% allocation', () => {
      const res = calculateWealthVelocity(5000, 200, 100);
      expect(res.velocityPercent).toBe(6);
      expect(res.tier).toBe('stagnant');
    });

    it('calculates building tier for 10–19%', () => {
      const res = calculateWealthVelocity(5000, 500, 250);
      expect(res.velocityPercent).toBe(15);
      expect(res.tier).toBe('building');
    });

    it('calculates accelerating tier for 20–34%', () => {
      const res = calculateWealthVelocity(5000, 1000, 300);
      expect(res.velocityPercent).toBe(26);
      expect(res.tier).toBe('accelerating');
    });

    it('calculates escape_velocity for 35%+', () => {
      const res = calculateWealthVelocity(5000, 1500, 500);
      expect(res.velocityPercent).toBe(40);
      expect(res.tier).toBe('escape_velocity');
    });

    it('guards against zero or negative income', () => {
      const res = calculateWealthVelocity(0, 500, 200);
      expect(res.velocityPercent).toBe(0);
      expect(res.tier).toBe('stagnant');
    });
  });

  describe('calculateFinancialHealthIndex', () => {
    it('produces high score (thriving) for strong financial profile', () => {
      const res = calculateFinancialHealthIndex({
        monthlyIncome: 10000,
        monthlyFixedBurn: 3000,
        liquidSavings: 15000,
        monthlyDiscretionarySpend: 2000,
        monthlyDebtPayment: 500,
        totalDebtBalance: 5000,
        monthlySavingsContribution: 2500,
      });

      expect(res.overallScore).toBeGreaterThanOrEqual(80);
      expect(res.tier).toBe('thriving');
      expect(res.subScores.liquidity).toBe(25);
      expect(res.insights.length).toBeGreaterThan(0);
    });

    it('produces vulnerable score for tight liquidity, high debt, and rigid overhead', () => {
      const res = calculateFinancialHealthIndex({
        monthlyIncome: 3000,
        monthlyFixedBurn: 2500, // 83% fixed
        liquidSavings: 200,
        monthlyDiscretionarySpend: 300,
        monthlyDebtPayment: 1500, // 50% DTI
        totalDebtBalance: 30000,
        monthlySavingsContribution: 0,
      });

      expect(res.overallScore).toBeLessThan(40);
      expect(res.tier).toBe('vulnerable');
    });
  });

  describe('simulateHorizonAdjustments', () => {
    it('correctly models months gained and annual wealth accumulation', () => {
      const res = simulateHorizonAdjustments(
        6000, // current savings
        3000, // monthly fixed
        200,  // extra savings / mo
        100   // fixed reduction / mo
      );

      // Current runway = 6000 / 3000 = 2.0 months
      expect(res.currentRunwayMonths).toBe(2);
      // New fixed burn = 2900
      expect(res.newFixedBurn).toBe(2900);
      // Extra 12 mo savings = (200 + 100) * 12 = 3600
      expect(res.annualWealthDelta).toBe(3600);
      // New projected savings in 1 yr = 6000 + 3600 = 9600
      // Simulated runway = 9600 / 2900 = 3.3
      expect(res.simulatedRunwayMonths).toBe(3.3);
      expect(res.monthsGained).toBe(1.3);
    });
  });
});
