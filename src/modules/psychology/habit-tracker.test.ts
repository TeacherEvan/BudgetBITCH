// src/modules/psychology/habit-tracker.test.ts
import { describe, it, expect } from 'vitest';
import {
  recordHabitActivity,
  isWeeklyReflectionDue,
  type StreakState,
} from './habit-tracker';

describe('habit-tracker', () => {
  it('initializes streak to 1 on first activity', () => {
    const initial: StreakState = {
      currentStreak: 0,
      bestStreak: 0,
      shieldsRemaining: 2,
      lastActiveDayString: null,
      shieldUsedToday: false,
    };

    const next = recordHabitActivity(initial, new Date('2026-11-01'));
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.shieldsRemaining).toBe(2);
    expect(next.lastActiveDayString).toBe('2026-11-01');
  });

  it('increments streak on consecutive days', () => {
    const state: StreakState = {
      currentStreak: 4,
      bestStreak: 10,
      shieldsRemaining: 2,
      lastActiveDayString: '2026-11-01',
      shieldUsedToday: false,
    };

    const next = recordHabitActivity(state, new Date('2026-11-02'));
    expect(next.currentStreak).toBe(5);
    expect(next.lastActiveDayString).toBe('2026-11-02');
    expect(next.shieldUsedToday).toBe(false);
  });

  it('consumes a grace shield when missing 1 day without breaking streak', () => {
    const state: StreakState = {
      currentStreak: 5,
      bestStreak: 10,
      shieldsRemaining: 2,
      lastActiveDayString: '2026-11-01',
      shieldUsedToday: false,
    };

    // User missed 2026-11-02, logs on 2026-11-03
    const next = recordHabitActivity(state, new Date('2026-11-03'));
    expect(next.currentStreak).toBe(6);
    expect(next.shieldsRemaining).toBe(1);
    expect(next.shieldUsedToday).toBe(true);
  });

  it('resets streak to 1 shame-free if multiple days missed', () => {
    const state: StreakState = {
      currentStreak: 5,
      bestStreak: 10,
      shieldsRemaining: 1,
      lastActiveDayString: '2026-11-01',
      shieldUsedToday: false,
    };

    // User missed 4 days
    const next = recordHabitActivity(state, new Date('2026-11-05'));
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(10);
    expect(next.shieldsRemaining).toBe(2); // replenished
  });

  it('determines if weekly reflection is due', () => {
    expect(isWeeklyReflectionDue(null)).toBe(true);

    const now = new Date('2026-11-08T12:00:00Z');
    const threeDaysAgo = new Date('2026-11-05T12:00:00Z').getTime();
    const eightDaysAgo = new Date('2026-10-31T12:00:00Z').getTime();

    expect(isWeeklyReflectionDue(threeDaysAgo, now)).toBe(false);
    expect(isWeeklyReflectionDue(eightDaysAgo, now)).toBe(true);
  });
});
