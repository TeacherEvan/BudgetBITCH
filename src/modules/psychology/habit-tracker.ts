// src/modules/psychology/habit-tracker.ts
//
// Shame-Free Habit Engagement Engine.
// Pure TS domain logic.
//
// Traditional financial apps penalize users for missing a single day,
// triggering guilt, avoidance, and abandonment (The Ostrich Effect).
// This engine implements:
// - Streak continuity with 2 weekly Grace Shields.
// - Weekly mindful reflection eligibility (every 7 days or on Sunday/Monday).

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  shieldsRemaining: number;
  lastActiveDayString: string | null; // 'YYYY-MM-DD'
  shieldUsedToday: boolean;
}

export interface WeeklyReflectionEntry {
  id: string;
  timestamp: number;
  sentiment: 'peaceful' | 'stretched' | 'overwhelmed';
  celebrationNote: string;
  focalIntention: string;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function formatDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Updates streak with grace shields.
 * If user logged today, streak holds.
 * If user logged yesterday, streak increments by 1.
 * If user missed 1 day (logged 2 days ago), a Grace Shield is consumed to protect the streak.
 * If user missed > 1 day and has no shields, streak gracefully resets to 1 (shame-free).
 */
export function recordHabitActivity(
  currentState: StreakState,
  activityDate: Date = new Date()
): StreakState {
  const todayKey = formatDayKey(activityDate);

  if (currentState.lastActiveDayString === todayKey) {
    return { ...currentState, shieldUsedToday: false };
  }

  if (!currentState.lastActiveDayString) {
    return {
      currentStreak: 1,
      bestStreak: Math.max(1, currentState.bestStreak),
      shieldsRemaining: currentState.shieldsRemaining,
      lastActiveDayString: todayKey,
      shieldUsedToday: false,
    };
  }

  const lastDate = parseDayKey(currentState.lastActiveDayString);
  const diffDays = Math.round((activityDate.getTime() - lastDate.getTime()) / ONE_DAY_MS);

  if (diffDays <= 1) {
    const nextStreak = currentState.currentStreak + 1;
    return {
      currentStreak: nextStreak,
      bestStreak: Math.max(nextStreak, currentState.bestStreak),
      shieldsRemaining: currentState.shieldsRemaining,
      lastActiveDayString: todayKey,
      shieldUsedToday: false,
    };
  }

  // 1 missed day (diffDays === 2) -> can be covered by a grace shield
  if (diffDays === 2 && currentState.shieldsRemaining > 0) {
    const nextStreak = currentState.currentStreak + 1;
    return {
      currentStreak: nextStreak,
      bestStreak: Math.max(nextStreak, currentState.bestStreak),
      shieldsRemaining: currentState.shieldsRemaining - 1,
      lastActiveDayString: todayKey,
      shieldUsedToday: true,
    };
  }

  // More than 1 missed day or no shields left -> reset streak to 1
  return {
    currentStreak: 1,
    bestStreak: currentState.bestStreak,
    shieldsRemaining: 2, // replenish shields for a fresh start
    lastActiveDayString: todayKey,
    shieldUsedToday: false,
  };
}

/**
 * Checks if a weekly reflection is due (>= 6.5 days since last reflection).
 */
export function isWeeklyReflectionDue(lastReflectionTimestamp: number | null, now: Date = new Date()): boolean {
  if (!lastReflectionTimestamp) return true;
  const elapsedMs = now.getTime() - lastReflectionTimestamp;
  const elapsedDays = elapsedMs / ONE_DAY_MS;
  return elapsedDays >= 6.5;
}
